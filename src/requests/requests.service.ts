import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Request, RequestStatus, TimelineEvent } from './entities/request.entity.js';
import { RequestAsset } from './entities/request-asset.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { Asset } from '../assets/entities/asset.entity.js';
import {
  InventoryItem,
  InventoryItemStatus,
} from '../inventory-items/entities/inventory-item.entity.js';
import {
  MailerService,
  RequestEmailContext,
} from '../mailer/mailer.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
import {
  PaginatedRequestsQueryDto,
  RequestSortOrder,
} from './dto/paginated-requests-query.dto.js';
import { PaginatedResult } from '../common/paginated-result.js';

const RELATIONS = {
  requestor: true,
  approvedBy: true,
  items: { asset: true },
};

/** Which statuses a request may be moved *from* for each target status
 * (BEN-110). Anything else is rejected as an illegal transition. */
const LEGAL_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.PENDING_APPROVAL]: [],
  [RequestStatus.APPROVED]: [RequestStatus.PENDING_APPROVAL],
  [RequestStatus.REJECTED]: [RequestStatus.PENDING_APPROVAL],
  [RequestStatus.READY_FOR_PICKUP]: [RequestStatus.APPROVED],
  [RequestStatus.FOR_DELIVERY]: [RequestStatus.APPROVED],
  [RequestStatus.COMPLETED]: [
    RequestStatus.READY_FOR_PICKUP,
    RequestStatus.FOR_DELIVERY,
  ],
};

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    private readonly mailerService: MailerService,
  ) {}

  async paginate(
    query: PaginatedRequestsQueryDto,
  ): Promise<PaginatedResult<Request>> {
    const {
      page = 1,
      limit = 10,
      status,
      displayId,
      requester,
      itemName,
      sort = RequestSortOrder.NEWEST,
    } = query;

    // Filters/paginates on a query with no to-many join, so `skip`/`take`
    // apply correctly. `itemName` needs the `items` -> `assets` join, which
    // would fan out rows (breaking pagination) if done here — pushed into a
    // subquery instead. `requestor` uses `leftJoinAndSelect` (not just
    // `leftJoin`) even though only its columns are needed for filtering:
    // TypeORM wraps any join + skip/take combination in an outer
    // `SELECT DISTINCT` subquery, and that outer query can only reference
    // columns the inner one actually selected — so ordering by a joined
    // column (the employee-name sort) needs it selected, not just joined.
    // Safe here since `requestor` is ManyToOne — no fan-out risk.
    const buildFilteredQuery = () => {
      const filtered = this.requestsRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.requestor', 'requestor');

      if (status) {
        filtered.andWhere('request.status = :status', { status });
      }
      if (displayId) {
        filtered.andWhere('request.displayId ILIKE :displayId', {
          displayId: `%${displayId}%`,
        });
      }
      if (requester) {
        filtered.andWhere(
          '(requestor.firstName ILIKE :requester OR requestor.lastName ILIKE :requester OR requestor.email ILIKE :requester)',
          { requester: `%${requester}%` },
        );
      }
      if (itemName) {
        filtered.andWhere(
          `request.id IN (SELECT ra."request_id" FROM request_assets ra INNER JOIN assets a ON a.id = ra."asset_id" WHERE a.name ILIKE :itemName)`,
          { itemName: `%${itemName}%` },
        );
      }

      return filtered;
    };

    // `getManyAndCount()` is avoided here: TypeORM's automatic count-query
    // derivation drops joins that are only referenced by `orderBy` (not
    // `where`), which breaks with a "column does not exist" error once
    // `orderBy` references the joined `requestor` table (the employee-name
    // sort). Counting on a query with no `orderBy` at all sidesteps that.
    const total = await buildFilteredQuery().getCount();

    const idQuery = buildFilteredQuery();
    if (sort === RequestSortOrder.EMPLOYEE_NAME_ASC) {
      idQuery
        .orderBy('requestor.firstName', 'ASC')
        .addOrderBy('requestor.lastName', 'ASC');
    } else {
      idQuery.orderBy(
        'request.createdAt',
        sort === RequestSortOrder.OLDEST ? 'ASC' : 'DESC',
      );
    }
    idQuery.skip((page - 1) * limit).take(limit);

    const pageOfRequests = await idQuery.getMany();

    // Re-fetch this page's requests with the full relation graph — can't
    // eager-load `items`/`asset` on the query above without risking the
    // pagination fan-out bug. `find()` with `id: In(...)` doesn't preserve
    // order, so the already-correctly-sorted ids from the query above are
    // used to reorder the result instead of re-sorting (which would only
    // be right for the createdAt sorts, not employee name).
    const orderedIds = pageOfRequests.map((r) => r.id);
    const data = orderedIds.length
      ? await this.requestsRepository.find({
          where: { id: In(orderedIds) },
          relations: RELATIONS,
        })
      : [];
    const dataById = new Map(data.map((r) => [r.id, r]));
    const orderedData = orderedIds
      .map((id) => dataById.get(id))
      .filter((r): r is Request => r !== undefined);

    return {
      data: await this.attachAvailableStock(orderedData),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async find(id: number): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!request) {
      throw new NotFoundException(
        `Request with ID '${id}' could not be found.`,
      );
    }

    const [requestWithStock] = await this.attachAvailableStock([request]);
    return requestWithStock;
  }

  async create(
    createRequestDto: CreateRequestDto,
    requestor: User,
  ): Promise<Request> {
    const assetIds = createRequestDto.items.map((item) => item.assetId);
    if (new Set(assetIds).size !== assetIds.length) {
      throw new BadRequestException(
        'Each asset may only appear once per request.',
      );
    }

    // Validates every line, reserves stock, and creates the request (plus
    // its RequestAsset lines, via cascade) in one atomic transaction: either
    // all lines succeed and stock is decremented for each, or nothing is
    // created and nothing is reserved (FR-005/006). Reservation locks the
    // InventoryItem rows being claimed (`FOR UPDATE`, in a stable id order)
    // so concurrent submits for the last unit can't both succeed (ADR-0002).
    const savedRequest = await this.requestsRepository.manager.transaction(
      async (manager) => {
        const requestItems: RequestAsset[] = [];

        for (const line of createRequestDto.items) {
          const asset = await manager.findOneBy(Asset, { id: line.assetId });
          if (!asset) {
            throw new BadRequestException(
              `Asset with ID '${line.assetId}' could not be found.`,
            );
          }
          const availableUnits = await manager
            .createQueryBuilder(InventoryItem, 'inventory')
            .setLock('pessimistic_write')
            .where('inventory.asset_id = :assetId', { assetId: asset.id })
            .andWhere('inventory.status = :status', {
              status: InventoryItemStatus.AVAILABLE,
            })
            .orderBy('inventory.id', 'ASC')
            .take(line.quantity)
            .getMany();

          if (availableUnits.length < line.quantity) {
            throw new BadRequestException(
              `Insufficient stock for '${asset.name}': requested ${line.quantity}, ${availableUnits.length} available.`,
            );
          }

          await manager.update(
            InventoryItem,
            availableUnits.map((unit) => unit.id),
            { status: InventoryItemStatus.RESERVED },
          );

          requestItems.push(
            manager.create(RequestAsset, { asset, quantity: line.quantity }),
          );
        }

        const initialEvent: TimelineEvent = {
          status: RequestStatus.PENDING_APPROVAL,
          at: new Date().toISOString(),
          byUserId: requestor.id,
        };

        const newRequest = manager.create(Request, {
          purpose: createRequestDto.purpose,
          items: requestItems,
          requestor,
          createdBy: requestor,
          timeline: [initialEvent],
          displayId: 'PENDING', // replaced with a real ID once the row has one
        });

        // `items` cascades on save, inserting the RequestAsset rows too.
        const inserted = await manager.save(newRequest);
        inserted.displayId = `REQ-${inserted.createdAt.getFullYear()}-${inserted.id}`;

        return manager.save(inserted);
      },
    );

    // Sent after the transaction commits — a delivery failure must not roll
    // back an already-valid submit (BEN-111).
    await this.sendNewRequestEmails(savedRequest, requestor);

    return savedRequest;
  }

  /**
   * On submit, notifies the requester ("Your request is in") and every admin
   * ("A new request needs your approval") — BEN-111.
   */
  private async sendNewRequestEmails(
    request: Request,
    requestor: User,
  ): Promise<void> {
    const context: RequestEmailContext = {
      requestId: request.id,
      displayId: request.displayId,
      submittedAt: request.createdAt,
      purpose: request.purpose,
      items: request.items.map((item) => ({
        itemName: item.asset.name,
        quantity: item.quantity,
      })),
      requesterFirstName: requestor.firstName,
      requesterFullName: `${requestor.firstName} ${requestor.lastName}`.trim(),
      requesterOffice: requestor.location,
      requesterEmail: requestor.email,
    };

    const admins = await this.requestsRepository.manager.find(User, {
      where: { role: UserRole.ADMIN },
      select: { email: true },
    });

    await Promise.all([
      this.mailerService.sendRequestSubmittedEmail(context),
      this.mailerService.sendRequestNeedsApprovalEmail(
        context,
        admins.map((admin) => admin.email),
      ),
    ]);
  }

  async update(
    id: number,
    updateRequestDto: UpdateRequestDto,
    actor: User,
  ): Promise<Request> {
    const request = await this.find(id);
    const { status, rejectionReason, ...fields } = updateRequestDto;

    if (!status) {
      // No status change — a plain field edit (e.g. the purpose).
      await this.requestsRepository.save({ ...request, ...fields });
      return this.find(id);
    }

    const allowedFrom = LEGAL_TRANSITIONS[status];
    if (!allowedFrom.includes(request.status)) {
      throw new ConflictException(
        `A request with status '${request.status}' cannot be moved to '${status}'. Expected one of: ${allowedFrom.join(', ')}.`,
      );
    }

    const changedAt = new Date();

    await this.requestsRepository.manager.transaction(async (manager) => {
      // The stock reserved at submit either goes out to the requester
      // (approve) or returns to the shelf (reject). Release and complete
      // leave it alone — it stays assigned.
      if (status === RequestStatus.APPROVED) {
        await this.moveReservedUnits(manager, request, {
          status: InventoryItemStatus.ASSIGNED,
          assignedTo: request.requestor,
          assignedAt: changedAt,
        });
      } else if (status === RequestStatus.REJECTED) {
        await this.moveReservedUnits(manager, request, {
          status: InventoryItemStatus.AVAILABLE,
          assignedTo: null,
          assignedAt: null,
        });
      }

      const isDecision =
        status === RequestStatus.APPROVED || status === RequestStatus.REJECTED;

      await manager.save(Request, {
        ...request,
        ...fields,
        status,
        rejectionReason:
          status === RequestStatus.REJECTED
            ? (rejectionReason ?? null)
            : request.rejectionReason,
        approvedBy: isDecision ? actor : request.approvedBy,
        updatedBy: actor,
        timeline: [
          ...request.timeline,
          {
            status,
            at: changedAt.toISOString(),
            byUserId: actor.id,
            ...(status === RequestStatus.REJECTED && rejectionReason
              ? { note: rejectionReason }
              : {}),
          },
        ],
      });
    });

    const updated = await this.find(id);

    // Sent after the transaction commits — a delivery failure must not roll
    // back an already-valid status change.
    await this.sendStatusChangeEmail(updated, status, changedAt, rejectionReason);

    return updated;
  }

  /**
   * Moves the units this request reserved into a new state. Units are
   * re-derived per line (the right asset, still `RESERVED`, capped at the
   * line's quantity) rather than tracked explicitly on the request — see the
   * note in `create()`. Locked in a stable id order so two concurrent
   * decisions can't claim the same units.
   */
  private async moveReservedUnits(
    manager: EntityManager,
    request: Request,
    changes: {
      status: InventoryItemStatus;
      assignedTo: User | null;
      assignedAt: Date | null;
    },
  ): Promise<void> {
    for (const item of request.items) {
      const reserved = await manager
        .createQueryBuilder(InventoryItem, 'inventory')
        .setLock('pessimistic_write')
        .where('inventory.asset_id = :assetId', { assetId: item.asset.id })
        .andWhere('inventory.status = :status', {
          status: InventoryItemStatus.RESERVED,
        })
        .orderBy('inventory.id', 'ASC')
        .take(item.quantity)
        .getMany();

      if (!reserved.length) {
        continue;
      }

      await manager.update(
        InventoryItem,
        reserved.map((unit) => unit.id),
        changes,
      );
    }
  }

  /** Dispatches the email for whichever transition just happened. */
  private async sendStatusChangeEmail(
    request: Request,
    status: RequestStatus,
    changedAt: Date,
    rejectionReason?: string,
  ): Promise<void> {
    const context: RequestEmailContext = {
      requestId: request.id,
      displayId: request.displayId,
      submittedAt: changedAt,
      purpose: request.purpose,
      items: request.items.map((item) => ({
        itemName: item.asset.name,
        quantity: item.quantity,
      })),
      requesterFirstName: request.requestor.firstName,
      requesterFullName:
        `${request.requestor.firstName} ${request.requestor.lastName}`.trim(),
      requesterOffice: request.requestor.location,
      requesterEmail: request.requestor.email,
    };

    switch (status) {
      case RequestStatus.APPROVED:
        return this.mailerService.sendRequestApprovedEmail(context);
      case RequestStatus.REJECTED:
        return this.mailerService.sendRequestRejectedEmail(
          context,
          rejectionReason ?? request.rejectionReason ?? '',
        );
      case RequestStatus.READY_FOR_PICKUP:
        return this.mailerService.sendRequestReadyForPickupEmail(context);
      case RequestStatus.FOR_DELIVERY:
        return this.mailerService.sendRequestForDeliveryEmail(context);
      case RequestStatus.COMPLETED:
        return this.mailerService.sendRequestCompletedEmail(context);
      default:
        return;
    }
  }

  async delete(id: number): Promise<Request> {
    const requestToDelete = await this.requestsRepository.findOneBy({ id });
    if (!requestToDelete) {
      throw new NotFoundException(
        `Request with ID '${id}' could not be found.`,
      );
    }

    return this.requestsRepository.softRemove(requestToDelete);
  }

  /**
   * Attaches each item's current available stock (same counting logic as
  * `AssetsService.attachQuantities()`: `InventoryItem` rows with status
   * `AVAILABLE`, grouped by asset) — per PR #79 review, so an admin view can
   * show live stock alongside a request's line items without a second
   * round-trip.
   */
  private async attachAvailableStock(requests: Request[]): Promise<Request[]> {
    const assetIds = [
      ...new Set(requests.flatMap((r) => r.items.map((item) => item.asset.id))),
    ];
    if (!assetIds.length) {
      return requests;
    }

    const counts = await this.requestsRepository.manager
      .createQueryBuilder(InventoryItem, 'inventory')
      .select('inventory.asset_id', 'assetId')
      .addSelect('COUNT(inventory.id)', 'count')
      .where('inventory.asset_id IN (:...assetIds)', { assetIds })
      .andWhere('inventory.status = :status', {
        status: InventoryItemStatus.AVAILABLE,
      })
      .groupBy('inventory.asset_id')
      .getRawMany<{ assetId: number; count: string }>();

    const stockByAssetId = new Map(
      counts.map(({ assetId, count }) => [assetId, Number(count)]),
    );

    for (const request of requests) {
      for (const item of request.items) {
        Object.assign(item, {
          availableStock: stockByAssetId.get(item.asset.id) ?? 0,
        });
      }
    }

    return requests;
  }
}

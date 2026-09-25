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
import { Asset, AssetLocation } from '../assets/entities/asset.entity.js';
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
import { CancelRequestDto } from './dto/cancel-request.dto.js';
import {
  PaginatedRequestsQueryDto,
  RequestSortOrder,
} from './dto/paginated-requests-query.dto.js';
import { PaginatedResult } from '../common/paginated-result.js';

const RELATIONS = {
  requestor: true,
  reviewedBy: true,
  cancelledBy: true,
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
  // Only through `cancel()`, which has its own per-role rules.
  [RequestStatus.CANCELLED]: [],
};

/** Statuses an employee may cancel their own request from (FR-010a). */
const EMPLOYEE_CANCELLABLE = [RequestStatus.PENDING_APPROVAL];

/** Statuses an admin may cancel a request from (FR-010b) — after approval
 * only; a pending request is rejected instead. */
const ADMIN_CANCELLABLE = [
  RequestStatus.APPROVED,
  RequestStatus.READY_FOR_PICKUP,
  RequestStatus.FOR_DELIVERY,
];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Lists requests for the Admin's Requests Queue, or — when `viewer` is an
   * employee — only that employee's own requests (My Requests, FR-016).
   */
  async paginate(
    query: PaginatedRequestsQueryDto,
    viewer: User,
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

      if (viewer.role !== UserRole.ADMIN) {
        filtered.andWhere('requestor.id = :viewerId', { viewerId: viewer.id });
      }
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

  /**
   * Fetches one request. With a non-admin `viewer`, someone else's request is
   * reported as not found rather than forbidden, so employees can't probe
   * which request IDs exist. Internal callers omit `viewer`.
   */
  async find(id: number, viewer?: User): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (
      !request ||
      (viewer &&
        viewer.role !== UserRole.ADMIN &&
        request.requestor.id !== viewer.id)
    ) {
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

    // Stock is held per office, and an employee requests from their own
    // office only (FR-006; the MVP doesn't request another office's stock).
    // A home office outside the known offices fails closed.
    const office = Object.values(AssetLocation).find(
      (location) => location === String(requestor.location),
    );
    if (!office) {
      throw new BadRequestException(
        `Your account's office ('${requestor.location}') isn't one we hold stock at; ask an admin to update it.`,
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
        const reservedUnitIds: number[] = [];

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
            .andWhere('inventory.location = :office', { office })
            .andWhere('inventory.status = :status', {
              status: InventoryItemStatus.AVAILABLE,
            })
            .orderBy('inventory.id', 'ASC')
            .take(line.quantity)
            .getMany();

          if (availableUnits.length < line.quantity) {
            throw new BadRequestException(
              `Insufficient stock for '${asset.name}' at ${office}: requested ${line.quantity}, ${availableUnits.length} available.`,
            );
          }

          // Reserved below, once the request row exists to link them to.
          reservedUnitIds.push(...availableUnits.map((unit) => unit.id));

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
          requestingOffice: office,
          createdBy: requestor,
          timeline: [initialEvent],
          displayId: 'PENDING', // replaced with a real ID once the row has one
        });

        // `items` cascades on save, inserting the RequestAsset rows too.
        const inserted = await manager.save(newRequest);
        inserted.displayId = `REQ-${inserted.createdAt.getFullYear()}-${inserted.id}`;

        // Still locked from the reads above. Recording the request on each
        // unit lets approve/reject move exactly these units later.
        await manager.update(InventoryItem, reservedUnitIds, {
          status: InventoryItemStatus.RESERVED,
          request: { id: inserted.id },
        });

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
      requesterOffice: request.requestingOffice,
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

    const changedAt = new Date();

    await this.requestsRepository.manager.transaction(async (manager) => {
      const currentStatus = await this.lockedStatus(manager, id);
      if (!LEGAL_TRANSITIONS[status].includes(currentStatus)) {
        throw new ConflictException(
          `A request with status '${currentStatus}' cannot be moved to '${status}'.`,
        );
      }

      // The stock reserved at submit either goes out to the requester
      // (approve) or returns to the shelf (reject). Release and complete
      // leave it alone — it stays assigned. Assigned units keep their
      // request link as a record of which request issued them; returned
      // units drop it so a later request can claim them.
      if (status === RequestStatus.APPROVED) {
        await this.moveRequestUnits(
          manager,
          request,
          [InventoryItemStatus.RESERVED],
          {
            status: InventoryItemStatus.ASSIGNED,
            assignedTo: request.requestor,
            assignedAt: changedAt,
          },
        );
      } else if (status === RequestStatus.REJECTED) {
        await this.moveRequestUnits(
          manager,
          request,
          [InventoryItemStatus.RESERVED],
          {
            status: InventoryItemStatus.AVAILABLE,
            assignedTo: null,
            assignedAt: null,
            request: null,
          },
        );
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
        reviewedBy: isDecision ? actor : request.reviewedBy,
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
   * Cancels a request with a reason (FR-010a/b/c): the requester may cancel
   * their own while it is pending approval; an admin may cancel one that has
   * been approved but not completed. The claimed stock returns to Available
   * in the same transaction as the status change.
   */
  async cancel(
    id: number,
    cancelRequestDto: CancelRequestDto,
    actor: User,
  ): Promise<Request> {
    // Scoped by `actor`, so an employee gets 404 for someone else's request.
    const request = await this.find(id, actor);
    const reason = cancelRequestDto.reason.trim();
    const isAdmin = actor.role === UserRole.ADMIN;
    const cancellable = isAdmin ? ADMIN_CANCELLABLE : EMPLOYEE_CANCELLABLE;
    const changedAt = new Date();

    await this.requestsRepository.manager.transaction(async (manager) => {
      const currentStatus = await this.lockedStatus(manager, id);
      if (!cancellable.includes(currentStatus)) {
        throw new ConflictException(
          isAdmin
            ? `A request with status '${currentStatus}' cannot be cancelled by an admin; only approved requests not yet completed can be (reject a pending request instead).`
            : `A request with status '${currentStatus}' cannot be cancelled; you can only cancel a request while it is pending approval.`,
        );
      }

      // Reserved units (and units already assigned on approval) go back on
      // the shelf, free for another request to claim.
      await this.moveRequestUnits(
        manager,
        request,
        [InventoryItemStatus.RESERVED, InventoryItemStatus.ASSIGNED],
        {
          status: InventoryItemStatus.AVAILABLE,
          assignedTo: null,
          assignedAt: null,
          request: null,
        },
      );

      await manager.save(Request, {
        ...request,
        status: RequestStatus.CANCELLED,
        cancellationReason: reason,
        cancelledBy: actor,
        updatedBy: actor,
        timeline: [
          ...request.timeline,
          {
            status: RequestStatus.CANCELLED,
            at: changedAt.toISOString(),
            byUserId: actor.id,
            note: reason,
          },
        ],
      });
    });

    const cancelled = await this.find(id);

    // Sent after the transaction commits, like every status email.
    await this.sendStatusChangeEmail(
      cancelled,
      RequestStatus.CANCELLED,
      changedAt,
      reason,
    );

    return cancelled;
  }

  /**
   * Moves the units this request claimed on submit (linked via
   * `InventoryItem.request`) that are currently in one of `from` into a new
   * state. Locked in a stable id order so two concurrent decisions can't
   * both move them.
   */
  private async moveRequestUnits(
    manager: EntityManager,
    request: Request,
    from: InventoryItemStatus[],
    changes: {
      status: InventoryItemStatus;
      assignedTo: User | null;
      assignedAt: Date | null;
      request?: null;
    },
  ): Promise<void> {
    const units = await manager
      .createQueryBuilder(InventoryItem, 'inventory')
      .setLock('pessimistic_write')
      .where('inventory.request_id = :requestId', { requestId: request.id })
      .andWhere('inventory.status IN (:...from)', { from })
      .orderBy('inventory.id', 'ASC')
      .getMany();

    if (!units.length) {
      return;
    }

    await manager.update(
      InventoryItem,
      units.map((unit) => unit.id),
      changes,
    );
  }

  /**
   * Re-reads the request's status under a row lock, inside the transaction
   * that will change it — so two concurrent status changes (an employee's
   * cancel and an admin's approve, say) can't both pass their checks.
   */
  private async lockedStatus(
    manager: EntityManager,
    id: number,
  ): Promise<RequestStatus> {
    const locked = await manager.findOne(Request, {
      where: { id },
      select: { id: true, status: true },
      lock: { mode: 'pessimistic_write' },
    });
    if (!locked) {
      throw new NotFoundException(`Request with ID '${id}' could not be found.`);
    }
    return locked.status;
  }

  /** Dispatches the email for whichever transition just happened. */
  private async sendStatusChangeEmail(
    request: Request,
    status: RequestStatus,
    changedAt: Date,
    reason?: string,
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
      requesterOffice: request.requestingOffice,
      requesterEmail: request.requestor.email,
    };

    switch (status) {
      case RequestStatus.APPROVED:
        return this.mailerService.sendRequestApprovedEmail(context);
      case RequestStatus.REJECTED:
        return this.mailerService.sendRequestRejectedEmail(
          context,
          reason ?? request.rejectionReason ?? '',
        );
      case RequestStatus.CANCELLED:
        return this.mailerService.sendRequestCancelledEmail(
          context,
          reason ?? request.cancellationReason ?? '',
          request.cancelledBy?.id === request.requestor.id,
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
   * Attaches each item's current available stock at the request's office
   * (same counting logic as `AssetsService.attachQuantities()`:
   * `InventoryItem` rows with status `AVAILABLE`) — per PR #79 review, so an
   * admin view can show live stock alongside a request's line items without
   * a second round-trip.
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
      .addSelect('inventory.location', 'office')
      .addSelect('COUNT(inventory.id)', 'count')
      .where('inventory.asset_id IN (:...assetIds)', { assetIds })
      .andWhere('inventory.status = :status', {
        status: InventoryItemStatus.AVAILABLE,
      })
      .groupBy('inventory.asset_id')
      .addGroupBy('inventory.location')
      .getRawMany<{ assetId: number; office: string; count: string }>();

    const stockKey = (assetId: number, office: string) => `${assetId}@${office}`;
    const stock = new Map(
      counts.map(({ assetId, office, count }) => [
        stockKey(assetId, office),
        Number(count),
      ]),
    );

    for (const request of requests) {
      for (const item of request.items) {
        Object.assign(item, {
          availableStock:
            stock.get(stockKey(item.asset.id, request.requestingOffice)) ?? 0,
        });
      }
    }

    return requests;
  }
}

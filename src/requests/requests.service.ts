import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Request, RequestStatus, TimelineEvent } from './entities/request.entity.js';
import { RequestAsset } from './entities/request-asset.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Asset } from '../assets/entities/asset.entity.js';
import {
  InventoryItem,
  InventoryItemStatus,
} from '../inventory-items/entities/inventory-item.entity.js';
import { MailerService } from '../mailer/mailer.service.js';
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
    // back an already-valid submit.
    await this.mailerService.sendRequestSubmittedEmail(
      savedRequest.id,
      requestor.firstName,
      requestor.email,
      savedRequest.items.map((item) => ({
        itemName: item.asset.name,
        quantity: item.quantity,
      })),
    );

    return savedRequest;
  }

  async update(
    id: number,
    updateRequestDto: UpdateRequestDto,
  ): Promise<Request> {
    const requestToUpdate = await this.requestsRepository.findOneBy({ id });
    if (!requestToUpdate) {
      throw new NotFoundException(
        `Request with ID '${id}' could not be found.`,
      );
    }

    await this.requestsRepository.save({
      ...requestToUpdate,
      ...updateRequestDto,
    });

    return this.find(id);
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

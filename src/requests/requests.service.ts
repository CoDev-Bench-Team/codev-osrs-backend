import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestStatus, TimelineEvent } from './entities/request.entity.js';
import { RequestAsset } from './entities/request-asset.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Asset } from '../assets/entities/asset.entity.js';
import {
  AssetInventory,
  AssetInventoryStatus,
} from '../assets/entities/asset-inventory.entity.js';
import { MailerService } from '../mailer/mailer.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';

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

  list(): Promise<Request[]> {
    return this.requestsRepository.find({ relations: RELATIONS });
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

    return request;
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
    // AssetInventory rows being claimed (`FOR UPDATE`, in a stable id order)
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
          if (!asset.isActive) {
            throw new BadRequestException(
              `Asset '${asset.name}' is not active and cannot be requested.`,
            );
          }

          const availableUnits = await manager
            .createQueryBuilder(AssetInventory, 'inventory')
            .setLock('pessimistic_write')
            .where('inventory.assetId = :assetId', { assetId: asset.id })
            .andWhere('inventory.status = :status', {
              status: AssetInventoryStatus.AVAILABLE,
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
            AssetInventory,
            availableUnits.map((unit) => unit.id),
            { status: AssetInventoryStatus.RESERVED },
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
}

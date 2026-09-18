import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Request, RequestStatus, TimelineEvent } from './entities/request.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Asset, AssetLocation } from '../assets/entities/asset.entity.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';

const RELATIONS = { requester: true, approvedBy: true };

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
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
    requester: User,
  ): Promise<Request> {
    // NOTE: this validates that the requested assets exist, but does not yet
    // deduct stock on submission (see the process flow's inventory rules) —
    // that needs the 'assets' resource's AssetInventory, which is separate
    // follow-up work.
    await this.validateAssetsExist(createRequestDto.items);

    const initialEvent: TimelineEvent = {
      status: RequestStatus.PENDING_APPROVAL,
      at: new Date().toISOString(),
      byUserId: requester.id,
    };

    // `User.location` (`UserLocation`) and `Request.location` (`AssetLocation`)
    // are separate enums that happen to share the same office names/values.
    const location =
      createRequestDto.location ?? (requester.location as unknown as AssetLocation);

    const newRequest = this.requestsRepository.create({
      ...createRequestDto,
      location,
      requester,
      createdBy: requester,
      timeline: [initialEvent],
      displayId: 'PENDING', // replaced with a real ID once the row has one
    });

    const savedRequest = await this.requestsRepository.save(newRequest);
    savedRequest.displayId = `REQ-${savedRequest.createdAt.getFullYear()}-${savedRequest.id}`;

    return this.requestsRepository.save(savedRequest);
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

    if (updateRequestDto.items) {
      await this.validateAssetsExist(updateRequestDto.items);
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

  private async validateAssetsExist(
    items: { assetId: number }[],
  ): Promise<void> {
    const assetIds = [...new Set(items.map((item) => item.assetId))];
    const foundAssets = await this.assetsRepository.findBy({
      id: In(assetIds),
    });

    if (foundAssets.length === assetIds.length) {
      return;
    }

    const foundIds = new Set(foundAssets.map((asset) => asset.id));
    const missingIds = assetIds.filter((id) => !foundIds.has(id));
    throw new BadRequestException(
      `Asset(s) with ID(s) ${missingIds.join(', ')} could not be found.`,
    );
  }
}

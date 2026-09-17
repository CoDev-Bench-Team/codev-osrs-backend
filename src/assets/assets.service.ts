import { Injectable, NotFoundException } from '@nestjs/common';
import { Asset } from './entities/asset.entity.js';
import { AssetInventory, AssetInventoryStatus } from './entities/asset-inventory.entity.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { PaginatedAssetsQueryDto } from './dto/paginated-assets-query.dto.js';
import { PaginatedResult } from '../common/paginated-result.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

type AssetWithQuantity = Asset & { quantity: number };

@Injectable()
export class AssetsService {
    constructor(
        @InjectRepository(Asset)
        private readonly assetRepository: Repository<Asset>,
        @InjectRepository(AssetInventory)
        private readonly assetInventoryRepository: Repository<AssetInventory>,
    ) {}


    //
    // Returns paginated results given the current page and how many items per page
    //
    async paginate({ page = 1, limit = 10 }: PaginatedAssetsQueryDto): Promise<PaginatedResult<AssetWithQuantity>> {
        const [data, total] = await this.assetRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: await this.attachQuantities(data),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    //
    // Returns 1 Asset given the id number of the Asset
    //
    async find(id: number): Promise<AssetWithQuantity> {
        const asset = await this.assetRepository.findOneBy({ id });
        if (!asset) {
            throw new NotFoundException(`Asset with ID '${id}' could not be found.`);
        }

        const [assetWithQuantity] = await this.attachQuantities([asset]);
        return assetWithQuantity;
    }


    //
    // Inserts the passed asset entry to DB, along with an AssetInventory
    // entry for each unit of the asset's initial quantity
    //
    async create(createAsset: CreateAssetDto): Promise<AssetWithQuantity> {
        const { quantity = 0, ...assetDetails } = createAsset;

        const newAsset = this.assetRepository.create({
            ...assetDetails,
            createdAt: new Date(),
        });

        const savedAsset = await this.assetRepository.save(newAsset);

        // Gets existing counts of current asset type
        const existingCount = await this.assetInventoryRepository.count({
            where: { asset: { type: savedAsset.type } },
        });

        // Corresponding AssetInvetory entry is added based on the passed quantity
        // assetCode is automatically generated based on how CODEV-[Asset Type]-[Number of Asset Type]
        const inventoryEntries = Array.from({ length: quantity }, (_, index) =>
            this.assetInventoryRepository.create({
                asset: savedAsset,
                assetCode: `CODEV-${savedAsset.type.toUpperCase()}-${existingCount + index + 1}`,
                status: AssetInventoryStatus.AVAILABLE,
                createdAt: new Date(),
            }),
        );

        if (inventoryEntries.length) {
            await this.assetInventoryRepository.save(inventoryEntries);
        }

        return Object.assign(savedAsset, { quantity });
    }

    //
    // Updates the passed asset entry to DB
    //
    async update(id: number, updateAssetDto: UpdateAssetDto): Promise<AssetWithQuantity> {
        const assetToUpdate = await this.assetRepository.findOneBy({ id });
        if (!assetToUpdate) {
            throw new NotFoundException(`Asset with ID '${id}' could not be found.`);
        }

        // quantity is derived from available AssetInventory records, not stored on the Asset itself
        const { quantity, ...assetChanges } = updateAssetDto;

        const savedAsset = await this.assetRepository.save({
            ...assetToUpdate,
            ...assetChanges,
            updatedAt: new Date(),
        });

        const [assetWithQuantity] = await this.attachQuantities([savedAsset]);
        return assetWithQuantity;
    }

    //
    // Computes each asset's quantity as the number of its AssetInventory
    // records that are currently Available, and attaches it to the entity
    //
    private async attachQuantities(assets: Asset[]): Promise<AssetWithQuantity[]> {
        if (!assets.length) {
            return [];
        }

        const counts = await this.assetInventoryRepository
            .createQueryBuilder('inventory')
            .innerJoin('inventory.asset', 'asset')
            .select('asset.id', 'assetId')
            .addSelect('COUNT(inventory.id)', 'count')
            .where('asset.id IN (:...assetIds)', { assetIds: assets.map((asset) => asset.id) })
            .andWhere('inventory.status = :status', { status: AssetInventoryStatus.AVAILABLE })
            .groupBy('asset.id')
            .getRawMany<{ assetId: number; count: string }>();

        const quantityByAssetId = new Map(counts.map(({ assetId, count }) => [assetId, Number(count)]));

        return assets.map((asset) => Object.assign(asset, { quantity: quantityByAssetId.get(asset.id) ?? 0 }));
    }

    //
    // Removes the Asset Record from the DB with the given id
    //
    async delete(id: number): Promise<Asset> {
        const assetToDelete = await this.assetRepository.findOneBy({ id });
        if (!assetToDelete) {
            throw new NotFoundException(`Asset with ID '${id}' could not be found.`);
        }

        return this.assetRepository.remove(assetToDelete);
    }
}

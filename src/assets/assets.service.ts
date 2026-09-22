import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Asset, AssetLocation } from './entities/asset.entity.js';
import { AssetInventory, AssetInventoryStatus } from './entities/asset-inventory.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { UpdateStocksDto } from './dto/update-stocks.dto.js';
import { UpdateAssetInventoryDto } from './dto/update-asset-inventory.dto.js';
import { PaginatedAssetsQueryDto } from './dto/paginated-assets-query.dto.js';
import { PaginatedResult } from '../common/paginated-result.js';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';

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
    // Returns a paginated list of AssetInventory entries (individual stock units),
    // with their parent Asset attached, given the current page and how many items per page
    //
    async paginateInventory({ page = 1, limit = 10 }: PaginatedAssetsQueryDto): Promise<PaginatedResult<AssetInventory>> {
        const [data, total] = await this.assetInventoryRepository.findAndCount({
            relations: { asset: true },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
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
        const { quantity = 0, location, price, supplier, purchasedAt, ...assetDetails } = createAsset;

        const newAsset = this.assetRepository.create({
            ...assetDetails,
            createdAt: new Date(),
        });

        const savedAsset = await this.assetRepository.save(newAsset);

        await this.addInventoryUnits(savedAsset, Array.from({ length: quantity }, () => location), {
            price,
            supplier,
            purchasedAt,
        });

        return Object.assign(savedAsset, { quantity });
    }

    //
    // Adds stock to an existing asset: a batch of AssetInventory entries is created for
    // each requested location, and the asset's low-stock threshold is updated if provided
    //
    async updateStocks(id: number, updateStocksDto: UpdateStocksDto): Promise<AssetWithQuantity> {
        const asset = await this.assetRepository.findOneBy({ id });
        if (!asset) {
            throw new NotFoundException(`Asset with ID '${id}' could not be found.`);
        }

        const { lowQtyAlert, stocks } = updateStocksDto;

        if (lowQtyAlert !== undefined) {
            asset.lowQtyAlert = lowQtyAlert;
            asset.updatedAt = new Date();
            await this.assetRepository.save(asset);
        }

        const locations = stocks.flatMap(({ location, quantity }) => Array.from({ length: quantity }, () => location));
        await this.addInventoryUnits(asset, locations);

        const [assetWithQuantity] = await this.attachQuantities([asset]);
        return assetWithQuantity;
    }

    //
    // Returns 1 AssetInventory entry given its id, with its parent Asset attached
    //
    async findStock(id: number): Promise<AssetInventory> {
        const stock = await this.assetInventoryRepository.findOne({
            where: { id },
            relations: { asset: true },
        });
        if (!stock) {
            throw new NotFoundException(`Stock with ID '${id}' could not be found.`);
        }

        return stock;
    }

    //
    // Updates a single AssetInventory entry given its id
    //
    async updateStock(id: number, updateAssetInventoryDto: UpdateAssetInventoryDto): Promise<AssetInventory> {
        const stockToUpdate = await this.assetInventoryRepository.findOneBy({ id });
        if (!stockToUpdate) {
            throw new NotFoundException(`Stock with ID '${id}' could not be found.`);
        }

        const { assignedToId, ...stockChanges } = updateAssetInventoryDto;

        // assignedAt tracks when the unit was last (re)assigned, so it's derived
        // from assignedToId rather than being settable directly
        const assignment = assignedToId === undefined
            ? {}
            : assignedToId === null
                ? { assignedTo: null, assignedAt: null }
                : { assignedTo: { id: assignedToId } as User, assignedAt: new Date() };

        return this.assetInventoryRepository.save({
            ...stockToUpdate,
            ...this.omitUndefined(stockChanges),
            ...assignment,
            updatedAt: new Date(),
        });
    }

    //
    // Removes a single AssetInventory entry (one stock unit) from the DB
    //
    async deleteStock(id: number): Promise<AssetInventory> {
        const stockToDelete = await this.assetInventoryRepository.findOneBy({ id });
        if (!stockToDelete) {
            throw new NotFoundException(`Stock with ID '${id}' could not be found.`);
        }

        return this.assetInventoryRepository.remove(stockToDelete);
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
            ...this.omitUndefined(assetChanges),
            updatedAt: new Date(),
        });

        const [assetWithQuantity] = await this.attachQuantities([savedAsset]);
        return assetWithQuantity;
    }

    //
    // Creates 1 AssetInventory entry per given location, for the given asset.
    // assetCode is automatically generated based on CODEV-[Asset Type]-[Number of Asset Type]
    //
    private async addInventoryUnits(
        asset: Asset,
        locations: AssetLocation[],
        unitDetails: { price?: number; supplier?: string; purchasedAt?: Date } = {},
    ): Promise<AssetInventory[]> {
        if (!locations.length) {
            return [];
        }

        const existingCount = await this.assetInventoryRepository.count({
            where: { asset: { type: asset.type } },
        });

        const inventoryEntries = locations.map((location, index) =>
            this.assetInventoryRepository.create({
                asset,
                assetCode: `CODEV-${asset.type.toUpperCase()}-${existingCount + index + 1}`,
                status: AssetInventoryStatus.AVAILABLE,
                location,
                ...unitDetails,
                createdAt: new Date(),
            }),
        );

        return this.assetInventoryRepository.save(inventoryEntries);
    }

    //
    // Strips undefined-valued keys from a DTO before merging it into an entity.
    // Declared-but-unset fields on a validated DTO instance surface as explicit
    // `undefined` own properties (a class-transformer + TS class-field quirk), which
    // would otherwise overwrite good existing values when spread into the entity.
    //
    private omitUndefined<T extends object>(obj: T): Partial<T> {
        return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
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

        try {
            return await this.assetRepository.remove(assetToDelete);
        } catch (error) {
            if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
                throw new ConflictException(`Asset with ID '${id}' still has stock units and cannot be deleted.`);
            }
            throw error;
        }
    }
}

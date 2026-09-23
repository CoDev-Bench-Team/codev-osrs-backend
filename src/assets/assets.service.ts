import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Asset, AssetLocation } from './entities/asset.entity.js';
import { AssetInventory, AssetInventoryStatus } from './entities/asset-inventory.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { CreateAssetInventoryDto } from './dto/create-asset-inventory.dto.js';
import { CreateAssetInventoryBatchDto } from './dto/create-asset-inventory-batch.dto.js';
import { UpdateAssetInventoryDto } from './dto/update-asset-inventory.dto.js';
import { AssetStockLevel, PaginatedAssetsQueryDto } from './dto/paginated-assets-query.dto.js';
import { PaginatedAssetInventoryQueryDto } from './dto/paginated-asset-inventory-query.dto.js';
import { PaginatedResult } from '../common/paginated-result.js';
import { DeepPartial, In, Not, Repository } from 'typeorm';
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
    // Returns paginated results given the current page and how many items per page,
    // optionally filtered by search text, category, office location, and stock level
    //
    async list({ page = 1, limit = 10, search, category, location, stockLevel }: PaginatedAssetsQueryDto): Promise<PaginatedResult<AssetWithQuantity>> {
        const query = this.assetRepository.createQueryBuilder('asset');

        if (search) {
            query.andWhere(
                '(asset.name ILIKE :search OR asset.model ILIKE :search OR CAST(asset.category AS text) ILIKE :search)',
                { search: `%${search}%` },
            );
        }
        if (category) {
            query.andWhere('asset.category = :category', { category });
        }
        if (stockLevel) {
            // Same count attachQuantities reports: Available units, scoped to the location if given
            const availableCount = `(
                SELECT COUNT(*) FROM asset_inventories inventory
                WHERE inventory."assetId" = asset.id
                  AND inventory.status = :availableStatus
                  AND inventory."deletedAt" IS NULL
                  ${location ? 'AND inventory.location = :location' : ''}
            )`;
            const stockLevelConditions: Record<AssetStockLevel, string> = {
                [AssetStockLevel.OUT_OF_STOCK]: `${availableCount} = 0`,
                [AssetStockLevel.LOW_STOCK]: `${availableCount} BETWEEN 1 AND asset.lowQtyAlert`,
                [AssetStockLevel.IN_STOCK]: `${availableCount} > asset.lowQtyAlert`,
            };
            query.andWhere(stockLevelConditions[stockLevel], { availableStatus: AssetInventoryStatus.AVAILABLE, location });
        }

        const [data, total] = await query
            .orderBy('asset.id', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: await this.attachQuantities(data, location),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    //
    // Returns a paginated list of AssetInventory entries (individual stock units),
    // with their parent Asset attached, given the current page and how many items per page,
    // optionally filtered by the asset's search text or category and by unit status
    //
    async listStock({ page = 1, limit = 10, search, category, status }: PaginatedAssetInventoryQueryDto): Promise<PaginatedResult<AssetInventory>> {
        // asset is ManyToOne, so joining it can't fan out rows and break skip/take
        const query = this.assetInventoryRepository
            .createQueryBuilder('inventory')
            .innerJoinAndSelect('inventory.asset', 'asset');

        if (search) {
            query.andWhere(
                '(asset.name ILIKE :search OR asset.model ILIKE :search OR CAST(asset.category AS text) ILIKE :search)',
                { search: `%${search}%` },
            );
        }
        if (category) {
            query.andWhere('asset.category = :category', { category });
        }
        if (status) {
            query.andWhere('inventory.status = :status', { status });
        }

        const [data, total] = await query
            .orderBy('inventory.id', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

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
    // Inserts the passed asset entry to DB. Stock units are added separately,
    // so a newly created asset always starts with a quantity of 0
    //
    async create(createAsset: CreateAssetDto): Promise<AssetWithQuantity> {
        const newAsset = this.assetRepository.create({
            ...createAsset,
            createdAt: new Date(),
        });

        const savedAsset = await this.assetRepository.save(newAsset);

        return Object.assign(savedAsset, { quantity: 0 });
    }

    //
    // Inserts a single AssetInventory entry (one stock unit) for the given asset.
    // The unit starts as Assigned if a user is given, otherwise as Available
    //
    async createStock(createAssetInventoryDto: CreateAssetInventoryDto): Promise<AssetInventory> {
        const { assetId, assignedToId, ...unitDetails } = createAssetInventoryDto;

        const asset = await this.assetRepository.findOneBy({ id: assetId });
        if (!asset) {
            throw new BadRequestException(`Asset with ID '${assetId}' could not be found.`);
        }

        await this.assertSerialNumbersAvailable([unitDetails.serialNumber]);

        const assignment = assignedToId === undefined
            ? { status: AssetInventoryStatus.AVAILABLE }
            : { status: AssetInventoryStatus.ASSIGNED, assignedTo: { id: assignedToId } as User, assignedAt: new Date() };

        const savedStock = await this.assetInventoryRepository.save(
            this.assetInventoryRepository.create({
                ...this.omitUndefined(unitDetails),
                ...assignment,
                asset,
                createdAt: new Date(),
            }),
        );

        return this.findStock(savedStock.id);
    }

    //
    // Inserts one AssetInventory entry per given unit for the given asset. The
    // shared purchase details and location are applied to every unit, and all
    // units start as Available
    //
    async createStocks(createAssetInventoryBatchDto: CreateAssetInventoryBatchDto): Promise<AssetInventory[]> {
        const { assetId, units, ...sharedDetails } = createAssetInventoryBatchDto;

        const asset = await this.assetRepository.findOneBy({ id: assetId });
        if (!asset) {
            throw new BadRequestException(`Asset with ID '${assetId}' could not be found.`);
        }

        await this.assertSerialNumbersAvailable(units.map((unit) => unit.serialNumber));

        const shared = this.omitUndefined(sharedDetails);
        return this.addInventoryUnits(asset, units.map((unit) => ({ ...shared, ...this.omitUndefined(unit) })));
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

        const { assetId, assignedToId, ...stockChanges } = updateAssetInventoryDto;

        let asset: Asset | undefined;
        if (assetId !== undefined) {
            asset = await this.assetRepository.findOneBy({ id: assetId }) ?? undefined;
            if (!asset) {
                throw new BadRequestException(`Asset with ID '${assetId}' could not be found.`);
            }
        }

        // assignedAt tracks when the unit was last (re)assigned, so it's derived
        // from assignedToId rather than being settable directly. Status follows the
        // assignment unless the caller sets it explicitly
        const assignment = assignedToId === undefined
            ? {}
            : assignedToId === null
                ? { assignedTo: null, assignedAt: null, status: AssetInventoryStatus.AVAILABLE }
                : { assignedTo: { id: assignedToId } as User, assignedAt: new Date(), status: AssetInventoryStatus.ASSIGNED };

        await this.assertSerialNumbersAvailable([stockChanges.serialNumber], id);

        await this.assetInventoryRepository.save({
            ...stockToUpdate,
            ...assignment,
            ...this.omitUndefined(stockChanges),
            ...(asset ? { asset } : {}),
            updatedAt: new Date(),
        });

        return this.findStock(id);
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

        const savedAsset = await this.assetRepository.save({
            ...assetToUpdate,
            ...this.omitUndefined(updateAssetDto),
            updatedAt: new Date(),
        });

        const [assetWithQuantity] = await this.attachQuantities([savedAsset]);
        return assetWithQuantity;
    }

    //
    // Creates 1 Available AssetInventory entry per given set of unit details,
    // for the given asset. Saved as one batch, so either all units are created or none
    //
    private async addInventoryUnits(
        asset: Asset,
        units: DeepPartial<AssetInventory>[],
    ): Promise<AssetInventory[]> {
        if (!units.length) {
            return [];
        }

        const inventoryEntries = units.map((unit) =>
            this.assetInventoryRepository.create({
                ...unit,
                asset,
                status: AssetInventoryStatus.AVAILABLE,
                createdAt: new Date(),
            }),
        );

        return this.assetInventoryRepository.save(inventoryEntries);
    }

    //
    // Rejects serial numbers that repeat within the given list (400) or already
    // belong to another stock unit (409). Unset serial numbers are ignored, and
    // excludeId skips the unit being updated so it can keep its own serial number
    //
    private async assertSerialNumbersAvailable(serialNumbers: (string | null | undefined)[], excludeId?: number): Promise<void> {
        const provided = serialNumbers.filter((serialNumber): serialNumber is string => typeof serialNumber === 'string');
        if (!provided.length) {
            return;
        }

        const repeated = [...new Set(provided.filter((serialNumber, index) => provided.indexOf(serialNumber) !== index))];
        if (repeated.length) {
            throw new BadRequestException(`Serial numbers must be unique; repeated: ${repeated.join(', ')}.`);
        }

        const taken = await this.assetInventoryRepository.find({
            select: { serialNumber: true },
            where: {
                serialNumber: In(provided),
                ...(excludeId === undefined ? {} : { id: Not(excludeId) }),
            },
        });
        if (taken.length) {
            throw new ConflictException(`Serial numbers already in use: ${taken.map((stock) => stock.serialNumber).join(', ')}.`);
        }
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
    // records that are currently Available (at the given location, if any),
    // and attaches it to the entity
    //
    private async attachQuantities(assets: Asset[], location?: AssetLocation): Promise<AssetWithQuantity[]> {
        if (!assets.length) {
            return [];
        }

        const countQuery = this.assetInventoryRepository
            .createQueryBuilder('inventory')
            .innerJoin('inventory.asset', 'asset')
            .select('asset.id', 'assetId')
            .addSelect('COUNT(inventory.id)', 'count')
            .where('asset.id IN (:...assetIds)', { assetIds: assets.map((asset) => asset.id) })
            .andWhere('inventory.status = :status', { status: AssetInventoryStatus.AVAILABLE });

        if (location) {
            countQuery.andWhere('inventory.location = :location', { location });
        }

        const counts = await countQuery
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

        const stockCount = await this.assetInventoryRepository.count({ where: { asset: { id } } });
        if (stockCount > 0) {
            throw new ConflictException(`Asset with ID '${id}' still has stock units and cannot be deleted.`);
        }

        return this.assetRepository.remove(assetToDelete);
    }
}

import {
	IsDate,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetLocation } from '../../assets/entities/asset.entity.js';
import { InventoryItemStatus } from '../entities/inventory-item.entity.js';

const isDefined = (_: object, value: unknown) => value !== undefined;

export class UpdateInventoryItemDto {
	@ApiPropertyOptional({ description: 'The ID of the catalog asset this inventory item belongs to.', example: 1 })
	@ValidateIf(isDefined)
	@IsInt()
	assetId?: number;

	@ApiPropertyOptional({ description: 'The purchase price of this inventory item. Pass null to clear it.', example: 1299.99, nullable: true })
	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	price?: number | null;

	@ApiPropertyOptional({ description: 'The supplier this inventory item was purchased from. Pass null to clear it.', example: 'Amazon', nullable: true })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	supplier?: string | null;

	@ApiPropertyOptional({ description: 'The date this inventory item was purchased. Pass null to clear it.', example: '2026-01-15T00:00:00.000Z', nullable: true })
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	purchasedAt?: Date | null;

	@ApiPropertyOptional({ description: 'The serial number of this inventory item. Pass null to clear it.', example: 'PF3ABCXY', nullable: true })
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	serialNumber?: string | null;

	@ApiPropertyOptional({ description: "This inventory item's BitLocker identifier. Pass null to clear it.", example: '12345678-90AB-CDEF-1234-567890ABCDEF', nullable: true })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	bitlockerIdentifier?: string | null;

	@ApiPropertyOptional({ description: "This inventory item's BitLocker recovery key/PIN. Pass null to clear it.", example: '123456-654321-123456-654321-123456-654321-123456-654321', nullable: true })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	recoveryPin?: string | null;

	@ApiPropertyOptional({ description: 'The ID of the user to assign this inventory item to. Pass null to unassign it.', example: 1, nullable: true })
	@IsOptional()
	@IsInt()
	assignedToId?: number | null;

	@ApiPropertyOptional({ description: 'The office location this inventory item is at.', enum: AssetLocation, example: AssetLocation.CEBU })
	@ValidateIf(isDefined)
	@IsEnum(AssetLocation)
	location?: AssetLocation;

	@ApiPropertyOptional({ description: 'Free-form notes about this inventory item. Pass null to clear it.', example: 'Minor scratch on the lid.', nullable: true })
	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description?: string | null;

	@ApiPropertyOptional({ description: 'The URL of an attachment for this inventory item. Pass null to clear it.', example: 'https://example.com/receipts/1234.png', nullable: true })
	@IsOptional()
	@IsString()
	@MaxLength(2048)
	attachmentUrl?: string | null;

	@ApiPropertyOptional({ description: 'The availability status of this inventory item.', enum: InventoryItemStatus, example: InventoryItemStatus.AVAILABLE })
	@ValidateIf(isDefined)
	@IsEnum(InventoryItemStatus)
	status?: InventoryItemStatus;
}

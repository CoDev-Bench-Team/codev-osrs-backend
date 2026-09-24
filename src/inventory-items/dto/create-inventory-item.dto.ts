import {
	IsDate,
	IsDefined,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetLocation } from '../../assets/entities/asset.entity.js';

export class CreateInventoryItemDto {
	@ApiProperty({ description: 'The ID of the catalog asset this inventory item belongs to.', example: 1 })
	@IsDefined()
	@IsInt()
	assetId: number;

	@ApiPropertyOptional({ description: 'The purchase price of this inventory item.', example: 1299.99 })
	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	price?: number;

	@ApiPropertyOptional({ description: 'The supplier this inventory item was purchased from.', example: 'Amazon' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	supplier?: string;

	@ApiPropertyOptional({ description: 'The date this inventory item was purchased.', example: '2026-01-15T00:00:00.000Z' })
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	purchasedAt?: Date;

	@ApiPropertyOptional({ description: 'The serial number of this inventory item.', example: 'PF3ABCXY' })
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	serialNumber?: string;

	@ApiPropertyOptional({ description: "This inventory item's BitLocker identifier.", example: '12345678-90AB-CDEF-1234-567890ABCDEF' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	bitlockerIdentifier?: string;

	@ApiPropertyOptional({ description: "This inventory item's BitLocker recovery key/PIN.", example: '123456-654321-123456-654321-123456-654321-123456-654321' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	recoveryPin?: string;

	@ApiPropertyOptional({ description: 'The ID of the user to assign this inventory item to.', example: 1 })
	@IsOptional()
	@IsInt()
	assignedToId?: number;

	@ApiProperty({ description: 'The office location this inventory item is at.', enum: AssetLocation, example: AssetLocation.CEBU })
	@IsDefined()
	@IsNotEmpty()
	@IsEnum(AssetLocation)
	location: AssetLocation;

	@ApiPropertyOptional({ description: 'Free-form notes about this inventory item.', example: 'Minor scratch on the lid.' })
	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description?: string;

	@ApiPropertyOptional({ description: 'The URL of an attachment for this inventory item.', example: 'https://example.com/receipts/1234.png' })
	@IsOptional()
	@IsString()
	@MaxLength(2048)
	attachmentUrl?: string;
}

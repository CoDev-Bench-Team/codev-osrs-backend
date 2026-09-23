import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetLocation } from '../../assets/entities/asset.entity.js';

class InventoryItemUnitDto {
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
  bitLockerIdentifier?: string;

  @ApiPropertyOptional({ description: "This inventory item's BitLocker recovery key/PIN.", example: '123456-654321-123456-654321-123456-654321-123456-654321' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recoveryPin?: string;
}

export class CreateInventoryItemBatchDto {
  @ApiProperty({ description: 'The ID of the catalog asset these inventory items belong to.', example: 1 })
  @IsDefined()
  @IsInt()
  assetId: number;

  @ApiProperty({ description: 'The office location every created inventory item is at.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(AssetLocation)
  location: AssetLocation;

  @ApiPropertyOptional({ description: 'The purchase price of each inventory item.', example: 1299.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'The supplier every inventory item was purchased from.', example: 'Amazon' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;

  @ApiPropertyOptional({ description: 'The date every inventory item was purchased.', example: '2026-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  purchasedAt?: Date;

  @ApiProperty({ description: 'The per-unit device details. One inventory item is created for each entry.', type: [InventoryItemUnitDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InventoryItemUnitDto)
  units: InventoryItemUnitDto[];
}

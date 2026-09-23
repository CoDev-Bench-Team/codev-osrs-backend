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
import { AssetLocation } from '../entities/asset.entity.js';

class AssetInventoryUnitDto {
  @ApiPropertyOptional({ description: 'The serial number of this stock unit.', example: 'PF3ABCXY' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  serialNumber?: string;

  @ApiPropertyOptional({ description: "This stock unit's BitLocker identifier.", example: '12345678-90AB-CDEF-1234-567890ABCDEF' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bitLockerIdentifier?: string;

  @ApiPropertyOptional({ description: "This stock unit's BitLocker recovery key/PIN.", example: '123456-654321-123456-654321-123456-654321-123456-654321' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recoveryPin?: string;
}

export class CreateAssetInventoryBatchDto {
  @ApiProperty({ description: 'The ID of the catalog asset the stock units belong to.', example: 1 })
  @IsDefined()
  @IsInt()
  assetId: number;

  @ApiProperty({ description: 'The office location every created stock unit is at.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(AssetLocation)
  location: AssetLocation;

  @ApiPropertyOptional({ description: 'The purchase price of each stock unit.', example: 1299.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'The supplier every stock unit was purchased from.', example: 'Amazon' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;

  @ApiPropertyOptional({ description: 'The date every stock unit was purchased.', example: '2026-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  purchasedAt?: Date;

  @ApiProperty({
    description: 'The per-unit device details. One stock unit is created for each entry.',
    type: [AssetInventoryUnitDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AssetInventoryUnitDto)
  units: AssetInventoryUnitDto[];
}

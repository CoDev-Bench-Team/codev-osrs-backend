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
import { AssetLocation } from '../entities/asset.entity.js';

export class CreateAssetInventoryDto {
  @ApiProperty({ description: 'The ID of the catalog asset this stock unit belongs to.', example: 1 })
  @IsDefined()
  @IsInt()
  assetId: number;

  @ApiPropertyOptional({ description: 'The purchase price of this stock unit.', example: 1299.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'The supplier this stock unit was purchased from.', example: 'Amazon' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;

  @ApiPropertyOptional({ description: 'The date this stock unit was purchased.', example: '2026-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  purchasedAt?: Date;

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

  @ApiPropertyOptional({
    description: 'The ID of the user to assign this stock unit to. When set, the unit is created as Assigned and assignedAt is stamped.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  assignedToId?: number;

  @ApiProperty({ description: 'The office location this stock unit is at.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(AssetLocation)
  location: AssetLocation;

  @ApiPropertyOptional({ description: 'Free-form notes about this stock unit.', example: 'Minor scratch on the lid.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @ApiPropertyOptional({ description: 'The URL of an attachment for this stock unit.', example: 'https://example.com/receipts/1234.png' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  attachmentUrl?: string;
}

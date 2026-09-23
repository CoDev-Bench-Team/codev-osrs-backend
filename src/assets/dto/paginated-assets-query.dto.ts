import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory, AssetLocation } from '../entities/asset.entity.js';
import { PaginationQueryDto } from './pagination-query.dto.js';

export enum AssetStockLevel {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

export class PaginatedAssetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by item name, model, or category name (partial match).', example: 'Latitude' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category.', enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({
    description: 'Scope available quantities (and the stock level filter) to a single office location.',
    enum: AssetLocation,
  })
  @IsOptional()
  @IsEnum(AssetLocation)
  location?: AssetLocation;

  @ApiPropertyOptional({
    description:
      'Filter by stock level, based on Available units: out_of_stock = 0, low_stock = 1 up to the low-stock threshold, in_stock = above the threshold.',
    enum: AssetStockLevel,
  })
  @IsOptional()
  @IsEnum(AssetStockLevel)
  stockLevel?: AssetStockLevel;
}

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory } from '../entities/asset.entity.js';
import { AssetInventoryStatus } from '../entities/asset-inventory.entity.js';
import { PaginationQueryDto } from './pagination-query.dto.js';

export class PaginatedAssetInventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Filter by the asset's item name, model, or category name (partial match).", example: 'Latitude' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: "Filter by the asset's category.", enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({
    description: 'Filter by stock unit status. Assigned units are the ones shown as Deployed.',
    enum: AssetInventoryStatus,
  })
  @IsOptional()
  @IsEnum(AssetInventoryStatus)
  status?: AssetInventoryStatus;
}

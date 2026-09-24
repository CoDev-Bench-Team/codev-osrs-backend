import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory } from '../../assets/entities/asset.entity.js';
import { InventoryItemStatus } from '../entities/inventory-item.entity.js';
import { PaginationQueryDto } from '../../assets/dto/pagination-query.dto.js';

export class PaginatedInventoryItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Filter by the asset's item name, model, or category name (partial match).", example: 'Latitude' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: "Filter by the asset's category.", enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({ description: 'Filter by inventory item status.', enum: InventoryItemStatus })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;
}

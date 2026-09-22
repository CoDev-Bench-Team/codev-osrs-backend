import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetLocation } from '../entities/asset.entity.js';
import { AssetInventoryStatus } from '../entities/asset-inventory.entity.js';

export class UpdateAssetInventoryDto {
  @ApiPropertyOptional({ description: 'The office location this stock unit is currently at.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsOptional()
  @IsEnum(AssetLocation)
  location?: AssetLocation;

  @ApiPropertyOptional({ description: 'The availability status of this stock unit.', enum: AssetInventoryStatus, example: AssetInventoryStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(AssetInventoryStatus)
  status?: AssetInventoryStatus;

  @ApiPropertyOptional({
    description: 'The ID of the user to assign this stock unit to. Pass null to unassign it; assignedAt is stamped/cleared automatically.',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  assignedToId?: number | null;
}

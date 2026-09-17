import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory, AssetLocation, AssetSpec } from '../entities/asset.entity.js';

class AssetSpecDto implements AssetSpec {
  @ApiPropertyOptional({ description: 'The label of the custom spec field.', example: 'Color' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'The value of the custom spec field.', example: 'Black' })
  @IsNotEmpty()
  @IsString()
  value: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'URL of the uploaded item image.', example: 'https://cdn.example.com/assets/keyboard.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'The name of the item.', example: 'External Keyboard' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'The brand or model of the item.', example: 'Logitech MX Keys' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'The category the item belongs to.', enum: AssetCategory, example: AssetCategory.KEYBOARDS })
  @IsOptional()
  @IsEnum(AssetCategory)
  type?: AssetCategory;

  @ApiPropertyOptional({ description: 'The office location the item belongs to.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsOptional()
  @IsEnum(AssetLocation)
  location?: AssetLocation;

  @ApiPropertyOptional({ description: 'Custom spec fields for the item.', type: [AssetSpecDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetSpecDto)
  specs?: AssetSpecDto[];

  @ApiPropertyOptional({ description: 'The stock quantity for the item.', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'The stock quantity at which the item is considered low in stock.', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowQtyAlert?: number;
}

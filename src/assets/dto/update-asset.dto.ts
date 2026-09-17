import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
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
  @MaxLength(255)
  key: string;

  @ApiPropertyOptional({ description: 'The value of the custom spec field.', example: 'Black' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  value: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({
    description: 'Base64-encoded image data for the item, optionally prefixed with a data URI scheme (e.g. "data:image/png;base64,...").',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({ description: 'The name of the item.', example: 'External Keyboard' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'The brand or model of the item.', example: 'Logitech MX Keys' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  @ApiPropertyOptional({ description: 'The category the item belongs to.', enum: AssetCategory, example: AssetCategory.LAPTOP })
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

import {
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory, AssetLocation, AssetSpec } from '../entities/asset.entity.js';

class AssetSpecDto implements AssetSpec {
  @ApiProperty({ description: 'The label of the custom spec field.', example: 'Color' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'The value of the custom spec field.', example: 'Black' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  value: string;
}

export class CreateAssetDto {
  @ApiPropertyOptional({ description: 'URL of the uploaded item image.', example: 'https://cdn.example.com/assets/keyboard.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'The name of the item.', example: 'External Keyboard' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'The brand or model of the item.', example: 'Logitech MX Keys' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'The category the item belongs to.', enum: AssetCategory, example: AssetCategory.KEYBOARDS })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(AssetCategory)
  type: AssetCategory;

  @ApiProperty({ description: 'The office location the item belongs to.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(AssetLocation)
  location: AssetLocation;

  @ApiPropertyOptional({ description: 'Custom spec fields for the item.', type: [AssetSpecDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetSpecDto)
  specs?: AssetSpecDto[];

  @ApiPropertyOptional({ description: 'The initial stock quantity for the item.', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number = 0;

  @ApiPropertyOptional({ description: 'The stock quantity at which the item is considered low in stock.', example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowQtyAlert?: number = 5;
}

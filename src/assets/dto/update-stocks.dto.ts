import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetLocation } from '../entities/asset.entity.js';

class StockEntryDto {
  @ApiProperty({ description: 'The office location the stock is added to.', enum: AssetLocation, example: AssetLocation.CEBU })
  @IsEnum(AssetLocation)
  location: AssetLocation;

  @ApiProperty({ description: 'The number of units to add for this location.', example: 5 })
  @IsInt()
  @Min(0)
  quantity: number;
}

export class UpdateStocksDto {
  @ApiPropertyOptional({ description: 'The stock quantity at which the item is considered low in stock.', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowQtyAlert?: number;

  @ApiProperty({ description: 'The number of units to add per office location.', type: [StockEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockEntryDto)
  stocks: StockEntryDto[];
}

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory } from '../entities/asset.entity.js';

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

  @ApiPropertyOptional({ description: 'A free-form description of the item.', example: 'Business laptop with a 14-inch display.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'The RAM spec of the item.', example: '16GB' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ram?: string;

  @ApiPropertyOptional({ description: 'The processor spec of the item.', example: 'Intel Core i7-1355U' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  processor?: string;

  @ApiPropertyOptional({ description: 'The graphics spec of the item.', example: 'Intel Iris Xe Graphics' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  graphics?: string;

  @ApiPropertyOptional({ description: 'The operating system spec of the item.', example: 'Windows 11 Pro' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  operatingSystem?: string;

  @ApiPropertyOptional({ description: 'The storage spec of the item.', example: '512GB SSD' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storage?: string;

  @ApiPropertyOptional({ description: 'The serial number of the item.', example: 'PF3ABCXY' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serialNumber?: string;

  @ApiPropertyOptional({ description: "The item's BitLocker identifier.", example: '12345678-90AB-CDEF-1234-567890ABCDEF' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bitLockerIdentifier?: string;

  @ApiPropertyOptional({ description: "The item's BitLocker recovery PIN.", example: '123456-654321-123456-654321-123456-654321-123456-654321' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recoveryPin?: string;

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

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetLocation } from '../../assets/entities/asset.entity.js';
import { CreateRequestItemDto } from './create-request-item.dto.js';

export class CreateRequestDto {
  @ApiPropertyOptional({
    description: "The requester's note to the approver.",
    example: 'temporary project setup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    description:
      "The office location the request is for. Defaults to the requester's own location if omitted.",
    enum: AssetLocation,
    example: AssetLocation.CEBU,
  })
  @IsOptional()
  @IsEnum(AssetLocation)
  location?: AssetLocation;

  @ApiProperty({
    description: 'The line items requested.',
    type: [CreateRequestItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRequestItemDto)
  items: CreateRequestItemDto[];
}

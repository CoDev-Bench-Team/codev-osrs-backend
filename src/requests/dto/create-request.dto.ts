import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateRequestItemDto } from './create-request-item.dto.js';

export class CreateRequestDto {
  @ApiPropertyOptional({
    description: "The requestor's purpose for the request.",
    example: 'temporary project setup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;

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

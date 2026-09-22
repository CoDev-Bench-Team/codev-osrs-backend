import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '../entities/request.entity.js';

export enum RequestSortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  EMPLOYEE_NAME_ASC = 'employee_name_asc',
}

export class PaginatedRequestsQueryDto {
  @ApiPropertyOptional({ description: 'The page number to retrieve.', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'The number of items to retrieve per page.', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by request status.', enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ description: 'Filter by request display ID (partial match), e.g. "REQ-2026-14".' })
  @IsOptional()
  @IsString()
  displayId?: string;

  @ApiPropertyOptional({ description: "Filter by requester's name or email (partial match)." })
  @IsOptional()
  @IsString()
  requester?: string;

  @ApiPropertyOptional({ description: 'Filter by requested item name (partial match).' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({
    description:
      'Sort order: by submission date (newest/oldest first) or by employee name (A-Z).',
    enum: RequestSortOrder,
    default: RequestSortOrder.NEWEST,
  })
  @IsOptional()
  @IsEnum(RequestSortOrder)
  sort?: RequestSortOrder = RequestSortOrder.NEWEST;
}

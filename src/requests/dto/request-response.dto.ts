import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Request } from '../entities/request.entity.js';
import { RequestAsset } from '../entities/request-asset.entity.js';

// Swagger-only shapes for what the requests endpoints actually return. The
// service decorates each line item with `availableStock` at read time (see
// `RequestsService.attachAvailableStock()`), which the entity schema alone
// can't describe.

export class RequestLineResponseDto extends OmitType(RequestAsset, [
  'request',
] as const) {
  @ApiProperty({
    description:
      "The asset's current available stock, for showing alongside the line while reviewing.",
    example: 12,
  })
  availableStock: number;
}

export class RequestResponseDto extends OmitType(Request, ['items'] as const) {
  @ApiProperty({ type: [RequestLineResponseDto] })
  items: RequestLineResponseDto[];
}

export class PaginatedRequestsResponseDto {
  @ApiProperty({ type: [RequestResponseDto] })
  data: RequestResponseDto[];

  @ApiProperty({ description: 'Requests matching the filters, across all pages.', example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

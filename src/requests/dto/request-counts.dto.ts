import { ApiProperty, OmitType } from '@nestjs/swagger';
import { RequestStatus } from '../entities/request.entity.js';
import { PaginatedRequestsQueryDto } from './paginated-requests-query.dto.js';

/** Approved and in handover: the queue's "In processing" card. */
export const IN_PROCESSING_STATUSES = [
  RequestStatus.APPROVED,
  RequestStatus.READY_FOR_PICKUP,
  RequestStatus.FOR_DELIVERY,
] as const;

/** The list's search filters, without paging, sorting or the status filter
 * (every status gets a count). */
export class RequestCountsQueryDto extends OmitType(PaginatedRequestsQueryDto, [
  'page',
  'limit',
  'sort',
  'status',
] as const) {}

export class RequestCounts {
  @ApiProperty({ description: 'All matching requests, any status.', example: 238 })
  total: number;

  @ApiProperty({
    description: 'Matching requests per status; every status is present.',
    example: {
      pending_approval: 7,
      approved: 7,
      ready_for_pickup: 7,
      for_delivery: 7,
      rejected: 12,
      completed: 190,
      cancelled: 8,
    },
  })
  byStatus: Record<RequestStatus, number>;

  @ApiProperty({
    description: 'Approved + ready for pickup + for delivery.',
    example: 21,
  })
  inProcessing: number;
}

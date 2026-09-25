import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateRequestDto } from './create-request.dto.js';
import { RequestStatus } from '../entities/request.entity.js';

/** The statuses a caller may move a request to via PATCH /requests/:id.
 * `pending_approval` is excluded — it's only ever set on submit. */
export const UPDATABLE_STATUSES = [
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
  RequestStatus.READY_FOR_PICKUP,
  RequestStatus.FOR_DELIVERY,
  RequestStatus.COMPLETED,
] as const;

// `items` is immutable after submit (data-model.md: "quantity does not
// change after submit") — omitted here rather than accepted and ignored.
export class UpdateRequestDto extends PartialType(
  OmitType(CreateRequestDto, ['items'] as const),
) {
  @ApiPropertyOptional({
    description:
      'The status to move the request to. Drives the review flow: approve, reject, release (ready_for_pickup/for_delivery), or complete.',
    enum: UPDATABLE_STATUSES,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  @IsIn(UPDATABLE_STATUSES as readonly RequestStatus[], {
    message: `status must be one of: ${UPDATABLE_STATUSES.join(', ')}`,
  })
  status?: RequestStatus;

  @ApiPropertyOptional({
    description:
      'Why the request was rejected. Required when status is "rejected".',
    example: 'Duplicate of request REQ-2026-12',
  })
  @ValidateIf((dto: UpdateRequestDto) => dto.status === RequestStatus.REJECTED)
  @IsNotEmpty({ message: 'rejectionReason is required when rejecting a request.' })
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @ApiPropertyOptional({
    description:
      'Where the requester collects the items. Required when status is "ready_for_pickup", and only accepted then.',
    example: '6th floor IT desk',
  })
  @ValidateIf(
    (dto: UpdateRequestDto) => dto.status === RequestStatus.READY_FOR_PICKUP,
  )
  @IsString()
  @Matches(/\S/, {
    message: 'pickupLocation is required when marking a request ready for pickup.',
  })
  @MaxLength(255)
  pickupLocation?: string;
}

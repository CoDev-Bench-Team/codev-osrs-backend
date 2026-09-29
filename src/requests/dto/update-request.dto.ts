import {
  ApiPropertyOptional,
  ApiSchema,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
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
@ApiSchema({
  description:
    'Administrative request update. Supply purpose to edit request details, or status to advance the workflow. Requested item lines and quantities are immutable after submission; rejection requires a reason.',
})
export class UpdateRequestDto extends PartialType(
  OmitType(CreateRequestDto, ['items'] as const),
) {
  @ApiPropertyOptional({
    description:
      'Target workflow status. Allowed transitions are pending_approval to approved/rejected, approved to ready_for_pickup/for_delivery, and either release status to completed. Invalid transitions return a conflict.',
    enum: UPDATABLE_STATUSES,
    example: RequestStatus.APPROVED,
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
    maxLength: 500,
  })
  @ValidateIf((dto: UpdateRequestDto) => dto.status === RequestStatus.REJECTED)
  @IsNotEmpty({
    message: 'rejectionReason is required when rejecting a request.',
  })
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

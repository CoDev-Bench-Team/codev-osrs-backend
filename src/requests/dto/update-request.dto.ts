import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRequestDto } from './create-request.dto.js';

// `items` is immutable after submit (data-model.md: "quantity does not
// change after submit") — omitted here rather than accepted and ignored.
export class UpdateRequestDto extends PartialType(
  OmitType(CreateRequestDto, ['items'] as const),
) {}

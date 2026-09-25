import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { RequestsService } from './requests.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
import { PaginatedRequestsQueryDto } from './dto/paginated-requests-query.dto.js';
import {
  PaginatedRequestsResponseDto,
  RequestResponseDto,
} from './dto/request-response.dto.js';
import { Request } from './entities/request.entity.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';
import { ApiProblemResponse } from '../common/api-problem-response.decorator.js';
import { Roles } from '../auth/roles.decorator.js';

const ApiRequestIdParam = () =>
  ApiParam({
    name: 'id',
    description: 'The numeric request identifier (not the REQ-… display ID).',
    type: Number,
  });

const ApiUnauthorizedProblem = () =>
  ApiProblemResponse(401, 'No valid session cookie.', 'Unauthorized');

const ApiRequestNotFoundProblem = () =>
  ApiProblemResponse(
    404,
    'No request has this ID.',
    "Request with ID '42' could not be found.",
  );

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Retrieves a paginated list of requests.',
    description:
      'Supports filtering by status, display ID, requester name/email, and requested item name, plus sorting by submission date (newest/oldest) or employee name (A-Z). Each line item carries the asset\'s live `availableStock`.',
  })
  @ApiOkResponse({
    description: 'One page of requests, plus paging totals.',
    type: PaginatedRequestsResponseDto,
  })
  @ApiValidationProblemResponse(PaginatedRequestsQueryDto)
  @ApiUnauthorizedProblem()
  @Get()
  paginate(@Query() paginatedRequestsQueryDto: PaginatedRequestsQueryDto) {
    return this.requestsService.paginate(paginatedRequestsQueryDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Fetches a single request by its numeric identifier.',
  })
  @ApiRequestIdParam()
  @ApiOkResponse({
    description: 'The request, with its requester, reviewer, line items (with live `availableStock`) and timeline.',
    type: RequestResponseDto,
  })
  @ApiUnauthorizedProblem()
  @ApiRequestNotFoundProblem()
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.find(id);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Creates a new request using the supplied item details.',
    description:
      'Submitted as the signed-in user. Reserves stock for every line in one transaction — if any line fails, nothing is created or reserved. Emails the requester and all admins.',
  })
  @ApiCreatedResponse({
    description: 'The new request, in `pending_approval`.',
    type: Request,
  })
  @ApiValidationProblemResponse(CreateRequestDto)
  @ApiUnauthorizedProblem()
  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: ExpressRequest,
  ) {
    // The global AuthGuard rejects unauthenticated requests before this
    // handler runs, so `request.user` is always populated here.
    return this.requestsService.create(createRequestDto, request.user!);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Updates an existing request, including the review flow.',
    description:
      'Admin only. Drives approve, reject (with a reason), release (`ready_for_pickup` or `for_delivery`) and complete: `pending_approval` → `approved` | `rejected`; `approved` → `ready_for_pickup` | `for_delivery`; either of those → `completed`. Any other transition is refused with a 409. Each status change emails the requester.',
  })
  @ApiRequestIdParam()
  @ApiOkResponse({
    description: 'The updated request.',
    type: RequestResponseDto,
  })
  @ApiValidationProblemResponse(UpdateRequestDto)
  @ApiUnauthorizedProblem()
  @ApiProblemResponse(403, 'The signed-in user is not an admin.', 'Insufficient permissions.')
  @ApiRequestNotFoundProblem()
  @ApiProblemResponse(
    409,
    'The requested status change is not allowed from the current status.',
    "A request with status 'approved' cannot be moved to 'completed'.",
  )
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() request: ExpressRequest,
  ) {
    // The global AuthGuard rejects unauthenticated requests before this
    // handler runs, so `request.user` is always populated here.
    return this.requestsService.update(id, updateRequestDto, request.user!);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Removes a request from the system by ID.' })
  @ApiRequestIdParam()
  @ApiOkResponse({ description: 'The removed request.', type: Request })
  @ApiUnauthorizedProblem()
  @ApiRequestNotFoundProblem()
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.delete(id);
  }
}

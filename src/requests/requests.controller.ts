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
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { RequestsService } from './requests.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
import { CancelRequestDto } from './dto/cancel-request.dto.js';
import { PaginatedRequestsQueryDto } from './dto/paginated-requests-query.dto.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiOperation({
    summary: 'Retrieves a paginated list of requests.',
    description:
      'Admins get every request (the Requests Queue); employees get only their own (My Requests). Supports filtering by status, display ID, requester name/email, and requested item name, plus sorting by submission date or employee name.',
  })
  @Get()
  paginate(
    @Query() paginatedRequestsQueryDto: PaginatedRequestsQueryDto,
    @Req() request: ExpressRequest,
  ) {
    // The global AuthGuard rejects unauthenticated requests before this
    // handler runs, so `request.user` is always populated here.
    return this.requestsService.paginate(
      paginatedRequestsQueryDto,
      request.user!,
    );
  }

  @ApiOperation({
    summary: 'Fetches a single request by its numeric identifier.',
    description:
      "Employees can only fetch their own requests; anyone else's returns 404.",
  })
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number, @Req() request: ExpressRequest) {
    return this.requestsService.find(id, request.user!);
  }

  @ApiOperation({
    summary: 'Creates a new request using the supplied item details.',
    description:
      "Employee only. Stock is reserved at the employee's own office; another office's stock can't be requested.",
  })
  @ApiValidationProblemResponse(CreateRequestDto)
  @Roles('employee')
  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: ExpressRequest,
  ) {
    // The global AuthGuard rejects unauthenticated requests before this
    // handler runs, so `request.user` is always populated here.
    return this.requestsService.create(createRequestDto, request.user!);
  }

  @ApiOperation({
    summary: 'Updates an existing request, including the review flow.',
    description:
      'Drives approve, reject (with a reason), release (ready_for_pickup or for_delivery) and complete. Stock stays reserved until the request is completed, when its units are assigned to the requester; a rejection returns them to Available. Illegal status transitions are refused with a 409.',
  })
  @ApiValidationProblemResponse(UpdateRequestDto)
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

  @ApiOperation({
    summary: 'Cancels a request, with a reason.',
    description:
      "An employee may cancel their own request while it is pending approval; an admin may cancel an approved, ready-for-pickup or for-delivery request that can't be fulfilled. The request's stock returns to Available and the requester is emailed. Any other status returns 409.",
  })
  @ApiValidationProblemResponse(CancelRequestDto)
  @HttpCode(200)
  @Post(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelRequestDto: CancelRequestDto,
    @Req() request: ExpressRequest,
  ) {
    // The global AuthGuard rejects unauthenticated requests before this
    // handler runs, so `request.user` is always populated here.
    return this.requestsService.cancel(id, cancelRequestDto, request.user!);
  }

  @ApiOperation({
    summary: 'Removes a request from the system by ID.',
    description: 'Admin only.',
  })
  @Roles('admin')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.delete(id);
  }
}

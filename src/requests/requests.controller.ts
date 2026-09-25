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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { RequestsService } from './requests.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
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
      'Supports filtering by status, display ID, requester name/email, and requested item name, plus sorting by submission date.',
  })
  @Get()
  paginate(@Query() paginatedRequestsQueryDto: PaginatedRequestsQueryDto) {
    return this.requestsService.paginate(paginatedRequestsQueryDto);
  }

  @ApiOperation({
    summary: 'Fetches a single request by its numeric identifier.',
  })
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.find(id);
  }

  @ApiOperation({
    summary: 'Creates a new request using the supplied item details.',
  })
  @ApiValidationProblemResponse(CreateRequestDto)
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
      'Drives approve, reject (with a reason), release (ready_for_pickup or for_delivery) and complete. Illegal status transitions are refused with a 409.',
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

  @ApiOperation({ summary: 'Removes a request from the system by ID.' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.delete(id);
  }
}

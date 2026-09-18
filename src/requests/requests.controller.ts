import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { RequestsService } from './requests.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  list() {
    return this.requestsService.list();
  }

  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.find(id);
  }

  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: ExpressRequest,
  ) {
    // The global AuthGuard rejects unauthenticated requests before this
    // handler runs, so `request.user` is always populated here.
    return this.requestsService.create(createRequestDto, request.user!);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestDto: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, updateRequestDto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.delete(id);
  }
}

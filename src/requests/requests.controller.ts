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
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { RequestsService } from './requests.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
import { PaginatedRequestsQueryDto } from './dto/paginated-requests-query.dto.js';
import {
  ApiBadRequestProblemResponse,
  ApiConflictProblemResponse,
  ApiExampleResponse,
  ApiForbiddenProblemResponse,
  ApiNotFoundProblemResponse,
  ApiUnauthorizedProblemResponse,
  ApiValidationProblemResponse,
} from '../common/api-validation-problem-response.decorator.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiCookieAuth('session')
  @ApiOperation({
    summary:
      'List equipment requests with requester, item, and workflow details.',
    description:
      'Returns requests with their requester, requested asset lines, available stock, and pagination metadata. Filter by status, display ID, requester name/email or user ID, and requested item name. Sort by newest, oldest, or employee name. Requires an authenticated admin or employee session.',
  })
  @ApiExampleResponse(200, 'Page of requests and pagination metadata.', {
    data: [
      {
        id: 42,
        displayId: 'REQ-2026-42',
        requestor: {
          id: 7,
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          role: 'employee',
          location: 'Cebu',
        },
        items: [
          {
            id: 81,
            asset: {
              id: 1,
              name: 'Business Laptop',
              model: 'Dell Latitude 5440',
              category: 'Laptop',
            },
            quantity: 1,
            availableStock: 8,
          },
        ],
        status: 'pending_approval',
        purpose: 'temporary project setup',
        rejectionReason: null,
        reviewedBy: null,
        timeline: [
          {
            status: 'pending_approval',
            at: '2026-02-01T09:00:00.000Z',
            byUserId: 7,
          },
        ],
        createdAt: '2026-02-01T09:00:00.000Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  })
  @ApiValidationProblemResponse(PaginatedRequestsQueryDto)
  @ApiUnauthorizedProblemResponse()
  @ApiForbiddenProblemResponse()
  @Roles('admin', 'employee')
  @Get()
  list(@Query() paginatedRequestsQueryDto: PaginatedRequestsQueryDto) {
    return this.requestsService.paginate(paginatedRequestsQueryDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Get one request with its current workflow and stock details.',
    description:
      'Looks up a request by its numeric database ID and returns the requester, requested assets, current available stock, review information, and timeline. Requires an authenticated admin or employee session.',
  })
  @ApiExampleResponse(200, 'The requested equipment request.', {
    id: 42,
    displayId: 'REQ-2026-42',
    requestor: {
      id: 7,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'employee',
      location: 'Cebu',
    },
    items: [
      {
        id: 81,
        asset: {
          id: 1,
          name: 'Business Laptop',
          model: 'Dell Latitude 5440',
          category: 'Laptop',
        },
        quantity: 1,
        availableStock: 8,
      },
    ],
    status: 'pending_approval',
    purpose: 'temporary project setup',
    rejectionReason: null,
    reviewedBy: null,
    timeline: [
      {
        status: 'pending_approval',
        at: '2026-02-01T09:00:00.000Z',
        byUserId: 7,
      },
    ],
    createdAt: '2026-02-01T09:00:00.000Z',
  })
  @ApiBadRequestProblemResponse(
    'Validation failed (numeric string is expected)',
  )
  @ApiUnauthorizedProblemResponse()
  @ApiForbiddenProblemResponse()
  @ApiNotFoundProblemResponse('Request')
  @Roles('admin', 'employee')
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.find(id);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Submit an equipment request and reserve available units.',
    description:
      'Creates a request for the signed-in employee and atomically reserves the requested inventory. Each catalog asset may appear only once, and every line must have sufficient available stock. Sends submission and approval-notification emails after the transaction commits. Admin or employee session required.',
  })
  @ApiExampleResponse(201, 'The submitted request in pending approval.', {
    id: 42,
    displayId: 'REQ-2026-42',
    requestor: {
      id: 7,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'employee',
      location: 'Cebu',
    },
    items: [
      {
        id: 81,
        asset: {
          id: 1,
          name: 'Business Laptop',
          model: 'Dell Latitude 5440',
          category: 'Laptop',
        },
        quantity: 1,
      },
    ],
    status: 'pending_approval',
    purpose: 'temporary project setup',
    rejectionReason: null,
    reviewedBy: null,
    timeline: [
      {
        status: 'pending_approval',
        at: '2026-02-01T09:00:00.000Z',
        byUserId: 7,
      },
    ],
    createdAt: '2026-02-01T09:00:00.000Z',
  })
  @ApiValidationProblemResponse(CreateRequestDto, {
    unavailableStock: {
      summary: 'An asset is missing or has insufficient available units.',
      detail:
        "Insufficient stock for 'Business Laptop': requested 2, 1 available.",
    },
    repeatedAsset: {
      summary: 'The same asset appears more than once in the request.',
      detail: 'Each asset may only appear once per request.',
    },
  })
  @ApiUnauthorizedProblemResponse()
  @ApiForbiddenProblemResponse()
  @Roles('admin', 'employee')
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
    summary: 'Edit a request or advance its fulfillment workflow.',
    description:
      'Admins may edit the purpose or advance status through pending_approval → approved/rejected → ready_for_pickup or for_delivery → completed. Rejecting requires a reason; approving assigns the reserved units and rejecting returns them to stock. Illegal transitions return 409 Conflict. Admin session required.',
  })
  @ApiExampleResponse(
    200,
    'The updated request after an allowed status transition.',
    {
      id: 42,
      displayId: 'REQ-2026-42',
      requestor: {
        id: 7,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: 'employee',
        location: 'Cebu',
      },
      items: [
        {
          id: 81,
          asset: {
            id: 1,
            name: 'Business Laptop',
            model: 'Dell Latitude 5440',
            category: 'Laptop',
          },
          quantity: 1,
          availableStock: 7,
        },
      ],
      status: 'approved',
      purpose: 'temporary project setup',
      rejectionReason: null,
      reviewedBy: {
        id: 2,
        email: 'admin@example.com',
        firstName: 'Grace',
        lastName: 'Hopper',
        role: 'admin',
        location: 'Makati',
      },
      timeline: [
        {
          status: 'pending_approval',
          at: '2026-02-01T09:00:00.000Z',
          byUserId: 7,
        },
        { status: 'approved', at: '2026-02-01T10:00:00.000Z', byUserId: 2 },
      ],
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
    },
  )
  @ApiValidationProblemResponse(UpdateRequestDto, {
    invalidId: {
      summary: 'The route ID is not an integer.',
      detail: 'Validation failed (numeric string is expected)',
    },
  })
  @ApiUnauthorizedProblemResponse()
  @ApiForbiddenProblemResponse()
  @ApiNotFoundProblemResponse('Request')
  @ApiConflictProblemResponse(
    "A request with status 'approved' cannot be moved to 'rejected'.",
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
  @ApiOperation({
    summary: 'Soft-delete an equipment request.',
    description:
      'Soft-deletes the request record and returns its current persisted fields. Admin session required.',
  })
  @ApiExampleResponse(200, 'The soft-deleted request.', {
    id: 42,
    displayId: 'REQ-2026-42',
    status: 'pending_approval',
    purpose: 'temporary project setup',
    rejectionReason: null,
    createdAt: '2026-02-01T09:00:00.000Z',
    deletedAt: '2026-02-02T10:00:00.000Z',
  })
  @ApiBadRequestProblemResponse(
    'Validation failed (numeric string is expected)',
  )
  @ApiUnauthorizedProblemResponse()
  @ApiForbiddenProblemResponse()
  @ApiNotFoundProblemResponse('Request')
  @Roles('admin')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.delete(id);
  }
}

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryItemsService } from './inventory-items.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { CreateInventoryItemBatchDto } from './dto/create-inventory-item-batch.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { PaginatedInventoryItemsQueryDto } from './dto/paginated-inventory-items-query.dto.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('Inventory Items')
@Controller('inventory-items')
export class InventoryItemsController {
  constructor(private readonly inventoryItemsService: InventoryItemsService) {}

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Retrieves a paginated list of inventory items across all assets.' })
  @Roles('admin', 'employee')
  @Get()
  list(@Query() query: PaginatedInventoryItemsQueryDto) {
    return this.inventoryItemsService.findAll(query);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Fetches a single inventory item by its numeric identifier.' })
  @Roles('admin', 'employee')
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryItemsService.findOne(id);
  }
  
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Creates a single inventory item for an existing asset.' })
  @ApiValidationProblemResponse(CreateInventoryItemDto)
  @Roles('admin')
  @Post()
  create(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryItemsService.create(createInventoryItemDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Creates multiple inventory items for an existing asset.' })
  @ApiValidationProblemResponse(CreateInventoryItemBatchDto)
  @Roles('admin')
  @Post('bulk')
  createBulk(@Body() createInventoryItemBatchDto: CreateInventoryItemBatchDto) {
    return this.inventoryItemsService.createBulk(createInventoryItemBatchDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Updates a single inventory item.' })
  @ApiValidationProblemResponse(UpdateInventoryItemDto)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInventoryItemDto: UpdateInventoryItemDto) {
    return this.inventoryItemsService.update(id, updateInventoryItemDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Removes a single inventory item.' })
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryItemsService.remove(id);
  }
}

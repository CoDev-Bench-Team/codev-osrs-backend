import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryItemsService } from './inventory-items.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { CreateInventoryItemBatchDto } from './dto/create-inventory-item-batch.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { PaginatedInventoryItemsQueryDto } from './dto/paginated-inventory-items-query.dto.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';

@ApiTags('Inventory Items')
@Controller('inventory-items')
export class InventoryItemsController {
  constructor(private readonly inventoryItemsService: InventoryItemsService) {}

  @ApiOperation({ summary: 'Retrieves a paginated list of inventory items across all assets.' })
  @Get()
  findAll(@Query() query: PaginatedInventoryItemsQueryDto) {
    return this.inventoryItemsService.findAll(query);
  }

  @ApiOperation({ summary: 'Creates a single inventory item for an existing asset.' })
  @ApiValidationProblemResponse(CreateInventoryItemDto)
  @Post()
  create(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryItemsService.create(createInventoryItemDto);
  }

  @ApiOperation({ summary: 'Creates multiple inventory items for an existing asset.' })
  @ApiValidationProblemResponse(CreateInventoryItemBatchDto)
  @Post('bulk')
  createBulk(@Body() createInventoryItemBatchDto: CreateInventoryItemBatchDto) {
    return this.inventoryItemsService.createBulk(createInventoryItemBatchDto);
  }

  @ApiOperation({ summary: 'Fetches a single inventory item by its numeric identifier.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryItemsService.findOne(id);
  }

  @ApiOperation({ summary: 'Updates a single inventory item.' })
  @ApiValidationProblemResponse(UpdateInventoryItemDto)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInventoryItemDto: UpdateInventoryItemDto) {
    return this.inventoryItemsService.update(id, updateInventoryItemDto);
  }

  @ApiOperation({ summary: 'Removes a single inventory item.' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryItemsService.remove(id);
  }
}

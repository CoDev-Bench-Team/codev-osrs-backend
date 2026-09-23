import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { CreateAssetInventoryDto } from './dto/create-asset-inventory.dto.js';
import { CreateAssetInventoryBatchDto } from './dto/create-asset-inventory-batch.dto.js';
import { UpdateAssetInventoryDto } from './dto/update-asset-inventory.dto.js';
import { PaginatedAssetsQueryDto } from './dto/paginated-assets-query.dto.js';
import { PaginatedAssetInventoryQueryDto } from './dto/paginated-asset-inventory-query.dto.js';
import { Public } from '../auth/public.decorator.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @ApiOperation({ summary: 'Retrieves a paginated list of assets, optionally filtered by search text, category, office location, and stock level.' })
  @Get()
  list(@Query() paginatedAssetsQueryDto: PaginatedAssetsQueryDto) {
    return this.assetsService.list(paginatedAssetsQueryDto);
  }

  @ApiOperation({ summary: 'Retrieves a paginated list of individual asset stock units, optionally filtered by search text, category, and status.' })
  @Get('stocks')
  listStock(@Query() paginatedAssetInventoryQueryDto: PaginatedAssetInventoryQueryDto) {
    return this.assetsService.listStock(paginatedAssetInventoryQueryDto);
  }

  @ApiOperation({ summary: 'Creates a single inventory Item for an existing asset.' })
  @ApiValidationProblemResponse(CreateAssetInventoryDto)
  @Post('stocks')
  createStock(@Body() createAssetInventoryDto: CreateAssetInventoryDto) {
    return this.assetsService.createStock(createAssetInventoryDto);
  }

  @ApiOperation({ summary: 'Creates multiple inventory item for an existing asset, one per entry in units.' })
  @ApiValidationProblemResponse(CreateAssetInventoryBatchDto)
  @Post('stocks/bulk')
  createStocks(@Body() createAssetInventoryBatchDto: CreateAssetInventoryBatchDto) {
    return this.assetsService.createStocks(createAssetInventoryBatchDto);
  }

  @ApiOperation({ summary: 'Fetches a single inventory item unit by its numeric identifier.' })
  @Get('stocks/:id')
  findStock(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.findStock(id);
  }

  @ApiOperation({
    summary: 'Fetches a single asset by its numeric identifier.',
  })
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.find(id);
  }

  @ApiOperation({
    summary: 'Creates a new asset using the supplied item details.',
  })
  @ApiValidationProblemResponse(CreateAssetDto)
  @Post()
  @Public()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @ApiOperation({
    summary: 'Updates an existing asset with the supplied item details.',
  })
  @ApiValidationProblemResponse(UpdateAssetDto)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @ApiOperation({ summary: 'Updates the details of a single stock unit.' })
  @ApiValidationProblemResponse(UpdateAssetInventoryDto)
  @Patch('stocks/:id')
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetInventoryDto: UpdateAssetInventoryDto,
  ) {
    return this.assetsService.updateStock(id, updateAssetInventoryDto);
  }

  @ApiOperation({ summary: 'Removes a single stock unit from an asset by its ID.' })
  @Delete('stocks/:id')
  deleteStock(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.deleteStock(id);
  }

  @ApiOperation({ summary: 'Removes an asset from the system by ID.' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.delete(id);
  }
}

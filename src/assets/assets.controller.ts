import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { PaginatedAssetsQueryDto } from './dto/paginated-assets-query.dto.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Retrieves a paginated list of assets, optionally filtered by search text, category, office location, and stock level.' })
  @Roles('admin', 'employee')
  @Get()
  list(@Query() paginatedAssetsQueryDto: PaginatedAssetsQueryDto) {
    return this.assetsService.list(paginatedAssetsQueryDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Fetches a single asset by its numeric identifier.',
  })
  @Roles('admin', 'employee')
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.find(id);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Creates a new asset using the supplied item details.',
  })
  @ApiValidationProblemResponse(CreateAssetDto)
  @Roles('admin')
  @Post()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Updates an existing asset with the supplied item details.',
  })
  @ApiValidationProblemResponse(UpdateAssetDto)
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, updateAssetDto);
  }
  
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Removes an asset from the system by ID.' })
  @Roles('admin')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.delete(id);
  }
}

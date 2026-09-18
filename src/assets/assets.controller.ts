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
import { PaginatedAssetsQueryDto } from './dto/paginated-assets-query.dto.js';
import { Public } from '../auth/public.decorator.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @ApiOperation({ summary: 'Retrieves a paginated list of assets.' })
  @Get()
  paginate(@Query() paginatedAssetsQueryDto: PaginatedAssetsQueryDto) {
    return this.assetsService.paginate(paginatedAssetsQueryDto);
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

  @ApiOperation({ summary: 'Removes an asset from the system by ID.' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.delete(id);
  }
}

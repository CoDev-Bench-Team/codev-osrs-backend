import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity.js';
import { AssetInventory } from './entities/asset-inventory.entity.js';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetInventory])],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}

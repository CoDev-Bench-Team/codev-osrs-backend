import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity.js';
import { Asset } from '../assets/entities/asset.entity.js';
import { RequestsService } from './requests.service.js';
import { RequestsController } from './requests.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Request, Asset])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

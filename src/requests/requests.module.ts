import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity.js';
import { RequestsService } from './requests.service.js';
import { RequestsController } from './requests.controller.js';
import { MailerModule } from '../mailer/mailer.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Request]), MailerModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

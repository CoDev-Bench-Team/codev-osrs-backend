import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { dbConfig } from './config/typeorm.config.js';
import { UsersModule } from './users/users.module.js';
import { EntitiesModule } from './entities/entities.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'bench-synergy-backend',
    }),
    TypeOrmModule.forRoot(dbConfig),
    UsersModule,
    EntitiesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

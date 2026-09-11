import { Module } from '@nestjs/common';
import { EntitiesModule } from '../entities/entities.module.js';
import { UsersService } from './users.service.js';

@Module({
    imports: [EntitiesModule],
    providers: [UsersService],
})
export class UsersModule {}

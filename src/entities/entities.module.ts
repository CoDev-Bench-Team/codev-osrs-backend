import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { Device } from './device.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([User, Device])],
    providers: [],
    exports: [TypeOrmModule]
})
export class EntitiesModule {}

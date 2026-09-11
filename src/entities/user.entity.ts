import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import type { Relation } from 'typeorm'
import { Device } from './device.entity.js';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Device, device => device.user)
    devices: Relation<Device>[];
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm'
import type { Relation } from 'typeorm'
import { User } from './user.entity.js';

@Entity()
export class Device {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    type: string;

    @ManyToOne(() => User, user => user.devices)
    user: Relation<User>;
}

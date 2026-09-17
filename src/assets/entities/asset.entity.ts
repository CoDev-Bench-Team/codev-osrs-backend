import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { AuditableEntity } from '../../common/auditable.base.js';

export enum AssetCategory {
    LAPTOPS = 'Laptops',
    MONITORS = 'Monitors',
    KEYBOARDS = 'Keyboards',
    MICE = 'Mice',
    HEADSETS = 'Headsets',
    CABLES = 'Cables',
}

export enum AssetLocation {
    CEBU = 'Cebu',
    BACOLOD = 'Bacolod',
    MAKATI = 'Makati',
    PASIG = 'Pasig',
    DAVAO = 'Davao',
}

export interface AssetSpec {
    title: string;
    value: string;
}

@Entity()
export class Asset extends AuditableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'enum', enum: AssetCategory })
    type: AssetCategory;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true })
    model: string | null;

    @Index()
    @Column({ type: 'enum', enum: AssetLocation })
    location: AssetLocation;

    @Column()
    lowQtyAlert: number;

    @Column({ type: 'varchar', nullable: true })
    imageUrl: string | null;

    @Column({ type: 'jsonb', default: [], nullable: true })
    specs?: AssetSpec[];
}

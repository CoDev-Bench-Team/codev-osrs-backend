import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { AuditableEntity } from '../../common/auditable.base.js';

export enum AssetCategory {
    LAPTOP = 'Laptop',
    HEADSET = 'Headset',
    MONITOR = 'Monitor',
    PHONE = 'Phone',
    UPS = 'UPS',
    MICE = 'Mice',
    WIFI = 'Wifi',
    TYPECHUB = 'Type C Hub',
    OTHER = 'Other Devices'
}

export enum AssetLocation {
    CEBU = 'Cebu',
    BACOLOD = 'Bacolod',
    MAKATI = 'Makati',
    PASIG = 'Pasig',
    DAVAO = 'Davao',
}

export interface AssetSpec {
    key: string;
    value: string;
}

@Entity({ name: 'assets' })
export class Asset extends AuditableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'enum', enum: AssetCategory })
    type: AssetCategory;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    model: string | null;

    @Index()
    @Column({ type: 'enum', enum: AssetLocation })
    location: AssetLocation;

    @Column()
    lowQtyAlert: number;

    @Column({ type: 'text', nullable: true })
    imageBase64: string | null;

    @Column({ type: 'jsonb', default: [], nullable: true })
    specs?: AssetSpec[];

    // Inactive items cannot be added to new requests (spec FR-005).
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}

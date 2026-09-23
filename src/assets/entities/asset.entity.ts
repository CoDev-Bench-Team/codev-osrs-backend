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
    ORTIGAS = 'Ortigas',
    DAVAO = 'Davao',
}

@Entity({ name: 'assets' })
export class Asset extends AuditableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index('IDX_assets_category')
    @Column({ type: 'enum', enum: AssetCategory })
    category: AssetCategory;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    model: string;

    @Column()
    lowQtyAlert: number;

    @Column({ type: 'text', nullable: true })
    imageBase64: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    ram: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    processor: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    graphics: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    operatingSystem: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    storage: string | null;
}

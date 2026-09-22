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

    @Index()
    @Column({ type: 'enum', enum: AssetCategory })
    type: AssetCategory;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    model: string | null;

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

    @Column({ type: 'varchar', length: 255, nullable: true })
    serialNumber: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    bitLockerIdentifier: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    recoveryPin: string | null;

    // Inactive items cannot be added to new requests (spec FR-005).
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}

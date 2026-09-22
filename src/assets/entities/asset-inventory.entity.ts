import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from "typeorm";
import type { Relation } from "typeorm";
import { User } from '../../users/entities/user.entity.js';
import { AuditableEntity } from '../../common/auditable.base.js';
import { Asset, AssetLocation } from './asset.entity.js';

export enum AssetInventoryStatus {
    AVAILABLE = 'Available',
    RESERVED = 'Reserved',
    ASSIGNED = 'Assigned',
}

@Entity({ name: 'asset_inventories' })
@Index(['asset', 'status'])
export class AssetInventory extends AuditableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => User, { nullable: true })
    assignedTo: Relation<User | null>;

    @ManyToOne(() => Asset)
    asset: Relation<Asset>;

    @Column()
    assetCode: string;

    @Column({ type: 'timestamp', nullable: true })
    assignedAt: Date | null;

    @Column({ type: 'enum', enum: AssetInventoryStatus })
    status: AssetInventoryStatus;

    @Index()
    @Column({ type: 'enum', enum: AssetLocation })
    location: AssetLocation;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value?: number | null) => value,
            from: (value: string | null) => (value === null ? null : Number(value)),
        },
    })
    price: number | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    supplier: string | null;

    @Column({ type: 'timestamp', nullable: true })
    purchasedAt: Date | null;
}

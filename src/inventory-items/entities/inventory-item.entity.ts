import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { AuditableEntity } from '../../common/auditable.base.js';
import { Asset, AssetLocation } from '../../assets/entities/asset.entity.js';

export enum InventoryItemStatus {
	AVAILABLE = 'Available',
	RESERVED = 'Reserved',
	ASSIGNED = 'Assigned',
	INACTIVE = 'Inactive',
}

@Entity({ name: 'asset_inventories' })
@Index(['asset', 'status'])
@Index('UQ_asset_inventories_serialNumber', ['serialNumber'], { unique: true, where: '"deletedAt" IS NULL' })
export class InventoryItem extends AuditableEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@ManyToOne(() => User, { nullable: true })
	assignedTo: Relation<User | null>;

	@ManyToOne(() => Asset)
	asset: Relation<Asset>;

	@Column({ type: 'varchar', length: 255, nullable: true })
	serialNumber: string | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	bitLockerIdentifier: string | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	recoveryPin: string | null;

	@Column({ type: 'text', nullable: true })
	description: string | null;

	@Column({ type: 'varchar', length: 2048, nullable: true })
	attachmentUrl: string | null;

	@Column({ type: 'timestamp', nullable: true })
	assignedAt: Date | null;

	@Column({ type: 'enum', enum: InventoryItemStatus })
	status: InventoryItemStatus;

	@Index()
	@Column({ type: 'enum', enum: AssetLocation, default: AssetLocation.CEBU })
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

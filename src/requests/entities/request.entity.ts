import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { AuditableEntity } from '../../common/auditable.base.js';

export enum RequestStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FOR_RELEASE = 'for_release',
  RELEASED = 'released',
  COMPLETED = 'completed',
}

/** One line item within `Request.items`. `assetId` references `Asset.id`,
 * but isn't a DB-level foreign key since `items` is a JSON column.
 * `itemName` is a snapshot of the asset's name at submit time, so a later
 * rename doesn't rewrite request history. */
export interface RequestAsset {
  assetId: number;
  itemName: string;
  quantity: number;
}

/** One entry in `Request.timeline`, recording each status transition. */
export interface TimelineEvent {
  status: RequestStatus;
  at: string;
  byUserId?: number;
  note?: string;
}

@Entity({ name: 'requests' })
export class Request extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  displayId: string;

  @ManyToOne(() => User)
  requestor: Relation<User>;

  @Column({ type: 'jsonb', default: [] })
  items: RequestAsset[];

  @Index()
  @Column({
    length: 20,
    default: RequestStatus.PENDING_APPROVAL,
  })
  status: RequestStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  purpose: string | null;

  @ManyToOne(() => User, { nullable: true })
  approvedBy: Relation<User | null>;

  @Column({ type: 'jsonb', default: [] })
  timeline: TimelineEvent[];
}

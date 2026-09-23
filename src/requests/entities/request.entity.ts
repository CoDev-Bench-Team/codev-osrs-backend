import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { AuditableEntity } from '../../common/auditable.base.js';
import { RequestAsset } from './request-asset.entity.js';

export enum RequestStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  READY_FOR_PICKUP = 'ready_for_pickup',
  FOR_DELIVERY = 'for_delivery',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
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

  @OneToMany(() => RequestAsset, (item) => item.request, { cascade: true })
  items: Relation<RequestAsset>[];

  @Index()
  @Column({
    length: 20,
    default: RequestStatus.PENDING_APPROVAL,
  })
  status: RequestStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  purpose: string | null;

  /** Required when the request is rejected; shown back to the requester. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason: string | null;

  /** The admin who approved or rejected the request. */
  @ManyToOne(() => User, { nullable: true })
  approvedBy: Relation<User | null>;

  @Column({ type: 'jsonb', default: [] })
  timeline: TimelineEvent[];
}

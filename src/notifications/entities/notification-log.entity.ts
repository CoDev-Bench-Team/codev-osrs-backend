import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  READY_FOR_PICKUP = 'ready_for_pickup',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum NotificationStatus {
  SENT = 'sent',
  FAILED = 'failed',
  LOGGED = 'logged',
}

/** A persisted record of one notification attempt, per FR-014/FR-015. */
@Entity({ name: 'notification_logs' })
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestId: number;

  @Column({ length: 20 })
  type: NotificationType;

  @Column({ type: 'text', array: true })
  recipients: string[];

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ length: 10 })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

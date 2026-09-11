import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ length: 320, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Index()
  @Column({ length: 10 })
  role: UserRole;

  @Column()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  createdBy: Relation<User | null>;

  @Column({ type: 'timestamp without time zone', nullable: true })
  updatedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  updatedBy: Relation<User | null>;

  @Column({ type: 'timestamp without time zone', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  deletedBy: Relation<User | null>;
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

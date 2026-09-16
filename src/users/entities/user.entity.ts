import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  googleSubject: string;

  @Column({ length: 320, unique: true })
  email: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 2048 })
  avatarUrl: string;

  @Index()
  @Column({ length: 10 })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  createdBy: Relation<User | null>;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  updatedBy: Relation<User | null>;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  deletedBy: Relation<User | null>;
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

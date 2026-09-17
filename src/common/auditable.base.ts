import { CreateDateColumn, DeleteDateColumn, ManyToOne, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../users/entities/user.entity.js";

export abstract class AuditableEntity {
    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true })
    createdBy: Relation<User | null>;

    @UpdateDateColumn({ nullable: true })
    updatedAt: Date | null;

    @ManyToOne(() => User, { nullable: true })
    updatedBy: Relation<User | null>;

    @DeleteDateColumn({ nullable: true })
    deletedAt: Date | null;

    @ManyToOne(() => User, { nullable: true })
    deletedBy: Relation<User | null>;
}
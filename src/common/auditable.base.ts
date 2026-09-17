import { Column, ManyToOne } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../users/entities/user.entity.js";

export abstract class AuditableEntity {
    @Column({ type: 'timestamp', nullable: true })
    createdAt: Date | null;

    @Column({ type: 'varchar', nullable: true })
    createdBy: string | null;

    @Column({ type: 'timestamp', nullable: true })
    updatedAt: Date | null;

    @ManyToOne(() => User, { nullable: true })
    updatedBy: Relation<User | null>;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @ManyToOne(() => User, { nullable: true })
    deletedBy: Relation<User | null>;
}
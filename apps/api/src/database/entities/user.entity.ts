import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

export type UserRole = "PREGNANT_PERSON" | "MIDWIFE" | "ADMIN";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ name: "display_name", type: "varchar", length: 120 })
  displayName!: string;

  @Column({
    name: "password_hash",
    type: "varchar",
    length: 200,
    select: false,
  })
  passwordHash!: string;

  @Column({ type: "varchar", length: 24, default: "PREGNANT_PERSON" })
  role!: UserRole;

  @Index({ unique: true, sparse: true })
  @Column({ name: "connection_code", type: "varchar", length: 8, nullable: true, default: null })
  connectionCode!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

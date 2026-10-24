import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from "typeorm";

@Entity({ name: "check_ins" })
@Index(["userId", "createdAt"])
export class CheckInEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 20 })
  mood!: string;

  @Column({ type: "text", array: true, default: "{}" })
  symptoms!: string[];

  @Column({ type: "varchar", length: 1000, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from "typeorm";

@Entity({ name: "care_messages" })
@Index(["patientId", "midwifeId", "createdAt"])
export class CareMessageEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "midwife_id", type: "uuid" })
  midwifeId!: string;

  @Column({ name: "sender_role", type: "varchar", length: 24 })
  senderRole!: "PREGNANT_PERSON" | "MIDWIFE";

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "boolean", default: false })
  read!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

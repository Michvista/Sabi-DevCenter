import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from "typeorm";

@Entity({ name: "care_links" })
@Index(["patientId", "midwifeId"], { unique: true })
export class CareLinkEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "midwife_id", type: "uuid" })
  midwifeId!: string;

  @Column({ type: "varchar", length: 16, default: "pending" })
  status!: "pending" | "active";

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

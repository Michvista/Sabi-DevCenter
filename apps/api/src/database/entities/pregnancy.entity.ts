import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "pregnancies" })
export class PregnancyEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId!: string;

  @Column({ name: "due_date", type: "date" })
  dueDate!: string;

  @Column({ name: "last_menstrual_period", type: "date", nullable: true })
  lastMenstrualPeriod!: string | null;

  @Column({ name: "next_visit_date", type: "date", nullable: true })
  nextVisitDate!: string | null;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

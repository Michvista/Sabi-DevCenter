import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

export type ClinicalReviewStatus = "APPROVED" | "CHANGES_REQUESTED";

@Entity({ name: "clinical_content_reviews" })
@Index(["week", "createdAt"])
export class ClinicalContentReviewEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "integer" })
  week!: number;

  @Column({ name: "reviewer_id", type: "uuid" })
  reviewerId!: string;

  @Column({ type: "varchar", length: 24 })
  status!: ClinicalReviewStatus;

  @Column({ type: "varchar", length: 2000, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

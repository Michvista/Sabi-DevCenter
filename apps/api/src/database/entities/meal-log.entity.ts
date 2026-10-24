import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from "typeorm";

@Entity({ name: "meal_logs" })
@Index(["userId", "createdAt"])
export class MealLogEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "food_name", type: "varchar", length: 160 })
  foodName!: string;

  @Column({ name: "meal_type", type: "varchar", length: 20 })
  mealType!: string;

  @Column({
    name: "serving_grams",
    type: "numeric",
    precision: 8,
    scale: 2,
    nullable: true,
  })
  servingGrams!: string | null;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  nutrients!: Record<string, number>;

  @Column({ type: "varchar", length: 240, nullable: true })
  source!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

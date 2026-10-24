import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from "typeorm";

@Entity({ name: "meal_plan_entries" })
@Index(["userId", "planDate"])
export class MealPlanEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "plan_date", type: "date" })
  planDate!: string;

  @Column({ name: "meal_type", type: "varchar", length: 20 })
  mealType!: string;

  @Column({ name: "dish_name", type: "varchar", length: 160 })
  dishName!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

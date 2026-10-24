import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "grocery_items" })
@Index(["userId", "checked"])
export class GroceryItemEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  quantity!: string | null;

  @Column({ type: "boolean", default: false })
  checked!: boolean;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

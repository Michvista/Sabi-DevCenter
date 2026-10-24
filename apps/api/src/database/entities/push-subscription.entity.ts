import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from "typeorm";

@Entity({ name: "push_subscriptions" })
@Index(["userId", "endpoint"], { unique: true })
export class PushSubscriptionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  endpoint!: string;

  @Column({ type: "text" })
  keys!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

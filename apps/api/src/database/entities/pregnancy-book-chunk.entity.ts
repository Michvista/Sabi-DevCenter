import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "pregnancy_book_chunks" })
export class PregnancyBookChunkEntity {
  @PrimaryColumn({ type: "integer" })
  week!: number;

  @Column({ type: "integer" })
  page!: number;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "jsonb" })
  embedding!: number[];

  @Column({ type: "varchar", length: 100 })
  model!: string;
}

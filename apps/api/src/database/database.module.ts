import { DynamicModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createPostgresOptions } from "./postgres-options";

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const options = createPostgresOptions();
    return {
      module: DatabaseModule,
      imports: options ? [TypeOrmModule.forRoot(options)] : [],
      exports: options ? [TypeOrmModule] : [],
    };
  }
}

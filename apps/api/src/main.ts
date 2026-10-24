import dns from "node:dns";
import dotenv from "dotenv";
import { resolve } from "node:path";

// Ensure global API domains (YarnGPT, Azure, Rumpty, etc.) resolve reliably
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Use system default if custom DNS cannot be bound
}

dotenv.config({ path: resolve(__dirname, "../../../.env") });

import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",") ?? true,
    exposedHeaders: ["X-Sabi-Audio-Fallback"],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(Number(process.env.PORT) || 8080, "0.0.0.0");
}
void bootstrap();

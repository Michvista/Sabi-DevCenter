import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  envDir: resolve(process.cwd(), "../.."),
  plugins: [sveltekit({ adapter: adapter() })],
});

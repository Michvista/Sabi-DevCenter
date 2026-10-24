import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  envDir: resolve(process.cwd(), "../.."),
  plugins: [tailwindcss(), sveltekit({ adapter: adapter() })],
});


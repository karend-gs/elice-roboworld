import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { explainApiPlugin } from "./explainPlugin.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), explainApiPlugin(env.OPENAI_API_KEY, env.OPENAI_MODEL || "gpt-4o-mini")],
  };
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "lib/security/{password,token}.ts",
        "features/admissions/{schemas,phase4-schemas}.ts",
        "server/whatsapp/{service,templates}.ts"
      ]
    }
  }
});

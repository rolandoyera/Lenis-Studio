import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["firestore/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});

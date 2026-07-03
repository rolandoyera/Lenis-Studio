import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["firestore/**/*.test.ts", "storage/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    // Both suites share the same emulator project and clear it between tests;
    // parallel files would race on clearFirestore/clearStorage.
    fileParallelism: false,
  },
});

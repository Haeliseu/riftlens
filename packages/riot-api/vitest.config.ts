import base from "@riftlens/config/vitest/base.config"
import { mergeConfig } from "vitest/config"

export default mergeConfig(base, {
  test: {
    coverage: {
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.config.*", "**/migrations/**", "test/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        "src/utils/**": {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
      },
    },
  },
})

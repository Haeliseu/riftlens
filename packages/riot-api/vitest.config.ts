import { mergeConfig } from "vitest/config"
import base from "@riftlens/config/vitest/base.config"

export default mergeConfig(base, {
  test: {
    coverage: {
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
        include: ["src/utils/**"],
      },
    },
  },
})

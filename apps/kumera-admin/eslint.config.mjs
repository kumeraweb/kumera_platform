import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const banCrossAppImports = {
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: ["../../apps/*", "../../../apps/*", "../../../../apps/*", "**/apps/*"]
      }
    ]
  }
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  banCrossAppImports,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])
]);

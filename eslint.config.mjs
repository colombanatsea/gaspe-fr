import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Common pattern in our codebase: loading data in useEffect on mount
      "react-hooks/set-state-in-effect": "warn",
      // Pre-existing: dynamic requires for conditional backend loading
      "@typescript-eslint/no-require-imports": "warn",
      // Pre-existing: some generic types in auth/schemas
      "@typescript-eslint/no-explicit-any": "warn",
      // React Compiler memoization — non-critical
      "react-hooks/preserve-manual-memoization": "warn",
      // Allow intentionally unused parameters/variables prefixed with _
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/assets/**",
    "workers/**",
  ]),
]);

export default eslintConfig;

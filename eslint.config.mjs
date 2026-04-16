import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Static export: <Image> not supported, <img> is correct
      "@next/next/no-img-element": "off",
      // Custom fonts loaded in layout.tsx (not _document.js) — Next.js app router pattern
      "@next/next/no-page-custom-font": "off",
      // Common pattern in our codebase: loading data in useEffect on mount
      "react-hooks/set-state-in-effect": "warn",
      // Pre-existing: dynamic requires for conditional backend loading
      "@typescript-eslint/no-require-imports": "warn",
      // Pre-existing: some generic types in auth/schemas
      "@typescript-eslint/no-explicit-any": "warn",
      // React Compiler memoization — non-critical
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  // Ported external files — different code style, relaxed linting
  {
    files: ["src/components/simulator/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
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

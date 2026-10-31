import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Reading browser-only facts (storage, media queries, WebGL) after mount is
    // what keeps server and client HTML identical, so it is intentional here.
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    // React Three Fiber works by mutating three.js objects every frame inside
    // useFrame; geometry helpers are built once per part. Both are deliberate.
    files: ["src/components/scenes/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/use-memo": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "test-results/**", "playwright-report/**"]),
]);

export default eslintConfig;

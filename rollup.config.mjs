import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export default defineConfig({
  input: "src/index.ts",
  plugins: [typescript()],
  sourcemap: true,
  external: ["prettier", "prettier/doc", "htmljs-parser"],
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
});

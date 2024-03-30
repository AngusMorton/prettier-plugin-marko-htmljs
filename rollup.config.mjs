import alias from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    input: "src/index.ts",
    plugins: [typescript()],
    external: ["prettier", "htmljs-parser"],
    output: {
      file: "./dist/plugin.mjs",
      format: "esm",
      sourcemap: true,
    },
  },
  {
    input: "src/index.ts",
    plugins: [
      alias({
        entries: [{ find: "prettier", replacement: "prettier/standalone" }],
      }),
      typescript(),
    ],
    external: [
      "prettier/standalone",
      "prettier/plugins/babel",
      "htmljs-parser",
    ],
    output: {
      file: "./dist/browser.js",
      format: "esm",
    },
  },
]);

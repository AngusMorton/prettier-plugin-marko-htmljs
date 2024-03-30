const htmljs = await import("../dist/plugin.mjs");

/** @type {import("prettier").Config} */
export default {
  parser: "marko-htmljs",
  htmlWhitespaceSensitivity: "ignore",
  plugins: [htmljs],
};

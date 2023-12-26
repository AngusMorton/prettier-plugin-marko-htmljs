// const plugins = [new URL("../dist/index.js", import.meta.url).href];

const htmljs = await import("../dist/index.js");

/** @type {import("prettier").Config} */
export default {
  parser: "htmljs",
  htmlWhitespaceSensitivity: "ignore",
  plugins: [htmljs],
};

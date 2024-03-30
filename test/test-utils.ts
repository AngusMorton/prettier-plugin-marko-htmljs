import prettier from "prettier";
import { expect, it } from "vitest";
import { writeFileSync } from "fs";
import { join } from "path";
import { parse } from "../src/parser/parser";

const plugins = [new URL("../dist/plugin.mjs", import.meta.url).href];

/**
 * format the contents of an astro file
 */
export async function format(
  contents: string,
  options: prettier.Options = {}
): Promise<string> {
  try {
    return await prettier.format(contents, {
      parser: "marko-htmljs",
      plugins,
      ...options,
    });
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    if (typeof e === "string") {
      throw new Error(e);
    }
  }
  return "";
}

/**
 * Utility to get `[input, output]` files
 */
function getFiles(file: any, path: string) {
  let input: string = file[`/test/fixtures/${path}/input.marko`];
  let output: string = file[`/test/fixtures/${path}/output.marko`];
  // workaround: normalize end of lines to pass windows ci
  if (input) input = input.replace(/(\r\n|\r)/gm, "\n");
  if (output) output = output.replace(/(\r\n|\r)/gm, "\n");
  return { input, output };
}

function getOptions(files: any, path: string) {
  if (files[`/test/fixtures/${path}/options.js`] !== undefined) {
    return files[`/test/fixtures/${path}/options.js`].default;
  }

  let opts: object;
  try {
    opts = JSON.parse(files[`/test/fixtures/${path}/options.json`]);
  } catch (e) {
    opts = {};
  }
  return opts;
}

/**
 * @param {string} name Test name.
 * @param {any} files Files from import.meta.glob.
 * @param {string} path Fixture path.
 */
export function test(name: string, files: any, path: string) {
  it(`${path}\n${name}`, async () => {
    const { input, output } = getFiles(files, path);

    expect(input, "Missing input file").to.not.be.undefined;
    expect(output, "Missing output file").to.not.be.undefined;

    const opts = getOptions(files, path);

    const formatted = await format(input, opts);
    const outPath = join("test/fixtures", path, "output-snapshot.marko");
    writeFileSync(outPath, formatted, { flag: "w" });
    expect(formatted, "Incorrect formatting").toBe(output);

    parse(formatted);

    // test that our formatting is idempotent
    const formattedTwice = await format(formatted, opts);
    // For debugging, you can write the second output to see the differences...
    // Really this should be a Vitest snapshot.
    // const outPath2 = join("test/fixtures", path, "output-snapshot-2.marko");
    // writeFileSync(outPath2, formattedTwice, { flag: "w" });
    expect(formatted === formattedTwice, "Formatting is not idempotent").toBe(
      true
    );
  });
}

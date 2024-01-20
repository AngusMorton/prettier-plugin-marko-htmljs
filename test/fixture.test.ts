import prettier from "prettier";
import { type Options } from "prettier";
import { expect, it, describe } from "vitest";
import { dirname, join, basename } from "path";
import { parse } from "../src/parser/parser";

const plugins = [new URL("../dist/index.js", import.meta.url).href];

const inputFiles = import.meta.glob(
  ["./fixtures/*/*.marko", "!./fixtures/*/*/__snapshots__"],
  {
    eager: true,
    as: "raw",
  }
);

describe.each(Object.keys(inputFiles))("%s", (path) => {
  const directory = dirname(path);
  const fileName = basename(path, ".marko");
  const snapshotDirectory = join(directory, "__snapshots__");
  const file = inputFiles[path];
  it("should format with no options", async () => {
    const result = await format(file, {});
    await expect(result, "Incorrect formatting").toMatchFileSnapshot(
      join(snapshotDirectory, `${fileName}.no-opts.marko`)
    );
    const idempotent = await format(result, {});
    expect(idempotent, "Formatting is not idempotent").toBe(result);

    expect(
      () => parse(result),
      "Formatting is invalid and does not parse"
    ).not.toThrow();
  });

  it("should format with strict html sensitivity", async () => {
    const result = await format(file, { htmlWhitespaceSensitivity: "strict" });
    await expect(result, "Incorrect formatting").toMatchFileSnapshot(
      join(snapshotDirectory, `${fileName}.strict-whitespace-sensitivity.marko`)
    );
    const idempotent = await format(result, {
      htmlWhitespaceSensitivity: "strict",
    });
    expect(idempotent, "Formatting is not idempotent").toBe(result);
  });

  it("should format with no html sensitivity", async () => {
    const result = await format(file, { htmlWhitespaceSensitivity: "ignore" });
    await expect(result, "Incorrect formatting").toMatchFileSnapshot(
      join(snapshotDirectory, `${fileName}.ignore-whitespace-sensitivity.marko`)
    );
    const idempotent = await format(result, {
      htmlWhitespaceSensitivity: "ignore",
    });
    expect(idempotent, "Formatting is not idempotent").toBe(result);
  });
});

async function format(
  contents: string,
  options: Options = {}
): Promise<string> {
  try {
    return await prettier.format(contents, {
      parser: "htmljs",
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

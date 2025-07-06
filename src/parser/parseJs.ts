import * as babelParser from "@babel/parser";

export type JSParserResult = ReturnType<typeof parseJS>;

export function parseJS(code: string): babelParser.ParseResult | undefined {
  try {
    const ast = babelParser.parse(code, {
      sourceType: "module",
      allowReturnOutsideFunction: true,
      plugins: ["typescript"],
    });

    return ast;
  } catch {
    return undefined;
  }
}

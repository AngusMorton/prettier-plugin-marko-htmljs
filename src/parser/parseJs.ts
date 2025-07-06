import * as babelParser from "@babel/parser";

export type JSParserResult = ReturnType<typeof parseJS>;

export function parseJS(code: string): babelParser.ParseResult {
  const ast = babelParser.parse(code, {
    sourceType: "module",
    allowReturnOutsideFunction: true,
    errorRecovery: true,
    plugins: ["typescript"],
  });

  return ast;
}

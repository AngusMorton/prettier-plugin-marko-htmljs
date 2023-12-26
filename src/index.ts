import {
  SupportLanguage,
  type Parser,
  type Printer,
  SupportOptions,
} from "prettier";
import * as prettierPluginBabel from "prettier/plugins/babel";
import { parse } from "./parser/parser";
import { print } from "./printer";
import type { AnyNode } from "./parser/MarkoNode";
import { embed } from "./embed";
import { getVisitorKeys } from "./printer/getVisitorKeys";

export const languages: SupportLanguage[] = [
  {
    name: "marko",
    aceMode: "text",
    parsers: ["htmljs"],
    aliases: ["markojs"],
    tmScope: "text.marko",
    codemirrorMode: "htmlmixed",
    vscodeLanguageIds: ["marko"],
    linguistLanguageId: 932782397,
    codemirrorMimeType: "text/html",
    extensions: [".marko"],
  },
];

export const options: SupportOptions = {};

const babelParser = prettierPluginBabel.parsers["babel-ts"];
export const parsers: Record<string, Parser<AnyNode>> = {
  htmljs: {
    parse: (source) => parse(source),
    astFormat: "htmljs-ast",
    locStart: (node: AnyNode) => node.start,
    locEnd: (node: AnyNode) => node.end,
  },
  htmljsExpressionParser: {
    ...babelParser,
    parse: (text: string, options: any) => {
      const ast = babelParser.parse(text, options);
      return { ...ast, program: ast.program.body[0].expression };
    },
  },
};

// https://prettier.io/docs/en/plugins.html#printers
export const printers: Record<string, Printer> = {
  "htmljs-ast": {
    print,
    embed,
    getVisitorKeys,
  },
};

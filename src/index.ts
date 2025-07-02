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
    parsers: ["marko-htmljs"],
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
  "marko-htmljs": {
    parse: (source) => parse(source),
    astFormat: "marko-htmljs",
    locStart: (node: AnyNode) => node.start,
    locEnd: (node: AnyNode) => node.end,
  },
  "marko-htmljs-expression-parser": {
    ...babelParser,
    parse: (text: string, options: Parameters<typeof babelParser.parse>[1]) => {
      const ast = babelParser.parse(text, options);
      return { ...ast, program: ast.program.body[0].expression };
    },
  },
};

// https://prettier.io/docs/en/plugins.html#printers
export const printers: Record<string, Printer> = {
  "marko-htmljs": {
    print,
    embed,
    getVisitorKeys,
  },
};

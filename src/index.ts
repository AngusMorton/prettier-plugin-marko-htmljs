import type { Parser, Printer } from "prettier";
import { parse } from "./parser/parser";
import { print } from "./printer";
import type { AnyNode } from "./parser/MarkoNode";
import { embed } from "./embed";
import { HtmlJsPrinter } from "./HtmlJsPrinter";

export const parsers: Record<string, Parser<AnyNode>> = {
  htmljs: {
    parse: (source) => parse(source),
    astFormat: "htmljs",
    locStart: (node: AnyNode) => node.start,
    locEnd: (node: AnyNode) => node.end,
  },
};

// https://prettier.io/docs/en/plugins.html#printers
export const printers: Record<string, Printer> = {
  htmljs: { print, embed },
};

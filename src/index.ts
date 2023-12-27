import {
  AstPath,
  Doc,
  doc,
  type Options,
  type Parser,
  type Printer,
} from "prettier";
import { parse } from "./parser/parser";
import { print } from "./printer";
import type { AnyNode, Comment } from "./parser/MarkoNode";
import { embed } from "./embed";
const { join, hardline } = doc.builders;

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
  htmljs: {
    print,
    embed,
    getCommentChildNodes,
    printComment,
    // canAttachComment,
    willPrintOwnComments: () => false,
  },
};

function printComment(
  // Path to the current comment node
  commentPath: AstPath<Comment>,
  // Current options
  options: Options
): Doc {
  const commentText = commentPath.node.valueLiteral;
  console.log("Printing comment", commentText);

  if (commentText.startsWith("<!--")) {
    // Convert HTML comment to JS comment.
    if (commentText.includes("\n")) {
      // It's a block comment, so convert it to a JS block comment.
      const lines = commentText.split(/\r?\n/g);
      return join(
        hardline,
        lines.map((line: string, index: number) => {
          const leading =
            index === 0 ? "/**" : index === lines.length - 1 ? " */" : " * ";

          if (index === 0) {
            line = line.slice(4);
          } else if (index === lines.length - 1) {
            line = line.slice(undefined, -3);
          }
          return leading + line.trim();
        })
      );
    } else {
      // It's a single line comment, so convert it to a JS single line comment.
      return ["//", commentText.slice(4, -3)];
    }
  } else if (commentText.startsWith("/**")) {
    const lines = commentText.split(/\r?\n/g);
    if (
      lines
        .slice(1, lines.length - 1)
        .every((line: string) => line.trim()[0] === "*")
    ) {
      return join(
        hardline,
        lines.map(
          (line: string, index: number) =>
            (index > 0 ? " " : "") +
            (index < lines.length - 1 ? line.trim() : line.trimStart())
        )
      );
    }
  }
  return [commentPath.node.valueLiteral];
}

function getCommentChildNodes(
  // The node whose children should be returned.
  node: AnyNode,
  // Current options
  options: Options
): AnyNode[] | undefined {
  console.log("Returning comment nodes");
  if ("comments" in node) {
    return node.comments ?? [];
  } else {
    return [];
  }
}

function canAttachComment(node: AnyNode) {
  return node.type && node.type !== "Comment";
}

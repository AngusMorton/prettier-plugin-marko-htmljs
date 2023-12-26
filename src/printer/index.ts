// https://prettier.io/docs/en/plugins.html#print
import { type AstPath, type Doc, type ParserOptions } from "prettier";
import { PrintFn, isEmptyTextNode } from "./tag/utils";
import { Program, Tag } from "../parser/MarkoNode";
import _doc from "prettier/doc";
import { printTag } from "./tag/tag";
import { printChildren } from "./children/children";
import { previousSibling } from "../util/previousSibling";
import { forceNextEmptyLine } from "./children/utils";
const {
  builders: {
    breakParent,
    dedent,
    fill,
    group,
    indent,
    join,
    line,
    softline,
    hardline,
    literalline,
  },
  utils: { stripTrailingHardline },
} = _doc;

export function print(path: AstPath, opts: ParserOptions, print: PrintFn): Doc {
  const node = path.node;
  if (!node) {
    return "";
  }

  switch (node.type) {
    case "Program":
      return printProgram(path as AstPath<Program>, opts, print);
    case "DocType":
      // https://www.w3.org/wiki/Doctypes_and_markup_styles
      return ["<!doctype html>", hardline];
    case "AttrNamed":
      const name = node.name.value;
      if (node.value) {
        switch (node.value.type) {
          case "AttrValue":
            return [name, "=", '"', node.value.valueLiteral.slice(1, -1), '"'];
          default:
            return [];
        }
      } else {
        return [];
      }
    case "Text":
      // Text nodes only exist as children to other nodes/tags.
      // So... I don't think we need to print them if they're whitespace only.
      // We do need to add appropriate whitespace before/after which we can do using the
      // difference in line numbers between the current node and the previous/next node.
      // e.g. if the current node is on line 5 and the next node is on line 7, we need to add
      // one newline (because we have a max of one newline). We do that in printChildren though (I think...)
      if (isEmptyTextNode(node)) {
        // TODO: Rules around preserving whitespace are complex.
        // https://prettier.io/docs/en/rationale.html#empty-lines
        // const rawText = node.value;
        // const hasTwoOrMoreNewlines = /\n\r?\s*\n\r?/.test(rawText);
        // const hasOneOrMoreNewlines = /\n/.test(rawText);
        // const hasWhiteSpace = rawText.trim().length < rawText.length;

        // if (hasTwoOrMoreNewlines) {
        //   console.log("   - two hardlines");
        //   return [hardline, hardline];
        // }
        // if (hasOneOrMoreNewlines) {
        //   console.log("   - one hardline");
        //   return hardline;
        // }
        // if (hasWhiteSpace) {
        //   return line;
        // }
        return "";
      }
      return node.value.trim();
    case "Tag":
      return printTag(path as AstPath<Tag>, opts, print);
    default:
      console.error("Unhandled NodeType:", node.type);
  }

  return "";
}

function printProgram(
  path: AstPath<Program>,
  opts: ParserOptions,
  print: PrintFn
) {
  const parentNode = path.node;
  const children = path.map((childPath, childIndex) => {
    const childNode = childPath.node;
    const nextNode = parentNode.body[childIndex + 1];

    const result: Doc[] = [print(childPath)];
    if (nextNode) {
      if (nextNode.sourceSpan.start.line - childNode.sourceSpan.end.line > 1) {
        result.push(hardline);
      }
    }
    return result;
  }, "body");

  return [stripTrailingHardline(children), hardline];
}

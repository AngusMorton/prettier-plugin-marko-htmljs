import { type AstPath, type Doc, type ParserOptions } from "prettier";
import { PrintFn, isEmptyTextNode, trimTextNodeLeft } from "./tag/utils";
import { AnyNode, Program, Tag, Comment, AttrTag, ChildNode } from "../parser/MarkoNode";
import { printTag } from "./tag/tag";
import { doc } from "prettier";
import { printComment } from "./comment";
import { isTextLike } from "../util/isTextLike";
import { splitTextToDocs } from "../util/splitTextToDocs";
import { isPrettierIgnoreComment, getOriginalSource } from "../util/prettierIgnore";

const {
  builders: { hardline, line, group, softline, ifBreak, fill },
  utils: { stripTrailingHardline },
} = doc;

export function print(
  path: AstPath<AnyNode>,
  opts: ParserOptions,
  print: PrintFn,
): Doc {
  const node = path.node;
  if (!node) {
    return "";
  }

  switch (node.type) {
    case "Program":
      return printProgram(path as AstPath<Program>, opts, print);
    case "DocType":
      // https://www.w3.org/wiki/Doctypes_and_markup_styles
      return "<!doctype html>";
    case "Declaration":
      return ["<?", node.valueLiteral, "?>"];
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
        const rawText = node.value;
        const hasTwoOrMoreNewlines = /\n\r?\s*\n\r?/.test(rawText);
        const hasOneOrMoreNewlines = /\n/.test(rawText);
        const hasWhiteSpace = rawText.trim().length < rawText.length;

        if (hasTwoOrMoreNewlines) {
          return [hardline, hardline];
        }
        if (hasOneOrMoreNewlines) {
          return hardline;
        }
        if (hasWhiteSpace) {
          return line;
        }
        return "";
      }
      const text = node.value
        .replace(/(?<!\\)\\(?!\\)/, "\\\\")
        .replace(/\${/, "\\${")
        .replace(/\$\!{/, "\\$!{");
      return fill(splitTextToDocs(text));
    case "AttrTag":
      return printTag(path as AstPath<AttrTag>, opts, print);
    case "Tag":
      return printTag(path as AstPath<Tag>, opts, print);
    case "Comment":
      return printComment(path as AstPath<Comment>, opts, print);
    default:
      console.error("Unhandled NodeType:", node.type);
      console.error(node);
  }

  return "";
}

function printProgram(
  path: AstPath<Program>,
  opts: ParserOptions,
  print: PrintFn,
) {
  const parentNode = path.node;
  const originalText = opts.originalText as string;
  
  // Track which nodes should be ignored due to prettier-ignore comments
  const ignoredNodeIndexes = new Set<number>();
  
  // First pass: identify nodes that should be ignored
  parentNode.body.forEach((node, index) => {
    if (node.type === "Comment" && isPrettierIgnoreComment(node)) {
      // Find the next non-comment node to ignore
      for (let i = index + 1; i < parentNode.body.length; i++) {
        const nextNode = parentNode.body[i];
        if (nextNode.type !== "Comment") {
          ignoredNodeIndexes.add(i);
          break;
        }
      }
    }
  });

  const children = path.map((childPath, childIndex) => {
    const childNode = childPath.node;
    let result: Doc[] = [];
    
    // If this node should be ignored, return its original source
    if (ignoredNodeIndexes.has(childIndex)) {
      const originalSource = getOriginalSource(childNode, originalText);
      result.push(originalSource);
      result.push(hardline);
      
      const nextNode = parentNode.body[childIndex + 1];
      if (nextNode) {
        if (nextNode.sourceSpan.start.line - childNode.sourceSpan.end.line > 1) {
          result.push(hardline);
        }
      }
      return result;
    }
    
    if (isTextLike(childNode) && childNode.type !== "Comment") {
      if (childNode.type === "Text") {
        // Remove leading or trailing whitespace from text nodes because
        // we handle it ourselves.
        childNode.value = childNode.value.trim();
      }
      if (!childNode.value) {
        // Skip the node if the text was just whitespace.
        return result;
      }

      result.push(
        group(["--", line, print(childPath), ifBreak([softline, "--"])]),
      );
    } else {
      result.push(print(childPath));
    }
    result.push(hardline);

    const nextNode = parentNode.body[childIndex + 1];
    if (nextNode) {
      if (nextNode.sourceSpan.start.line - childNode.sourceSpan.end.line > 1) {
        result.push(hardline);
      }
    }
    return result;
  }, "body");

  return [stripTrailingHardline(children), hardline];
}

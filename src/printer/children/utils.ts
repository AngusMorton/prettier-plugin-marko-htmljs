import { Options } from "prettier";
import { AnyNode, Text, ChildNode, StaticNode } from "../../parser/MarkoNode";
import { cssStyleDisplay } from "../../util/cssStyleDisplay";
import { previousSibling } from "../../util/previousSibling";
import {
  isTextNodeEndingWithLinebreak,
  isTextNodeStartingWithLinebreak,
} from "../tag/utils";
import { nextSibling } from "../../util/nextSibling";

export function forceBreakChildren(node: AnyNode, opts: Options) {
  return (
    node.type === "Tag" &&
    node.body &&
    node.body.length > 0 &&
    node.nameText &&
    (["html", "head", "ul", "ol", "select"].includes(node.nameText) ||
      (cssStyleDisplay(node, opts).startsWith("table") &&
        cssStyleDisplay(node, opts) !== "table-cell"))
  );
}

export function preferHardlineAsLeadingSpaces(node: ChildNode) {
  const prev = previousSibling(node);
  return prev && preferHardlineAsTrailingSpaces(prev);
}

export function preferHardlineAsTrailingSpaces(node: AnyNode) {
  return node.type === "Tag" && node.nameText === "br";
}

export function forceNextEmptyLine(node: ChildNode | StaticNode) {
  const next = nextSibling(node);
  return !!next && node.sourceSpan.end.line + 1 < next.sourceSpan.start.line;
}

function hasSurroundingLineBreak(node: Text) {
  return (
    isTextNodeStartingWithLinebreak(node) && isTextNodeEndingWithLinebreak(node)
  );
}

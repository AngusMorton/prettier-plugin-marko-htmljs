import { ChildNode } from "../parser/MarkoNode";
import { nextSibling } from "./nextSibling";

export function trailingNewlineCount(node: ChildNode) {
  const next = nextSibling(node);
  if (!next) {
    return 1;
  }

  const nodeEnd = node.sourceSpan.end.line;
  const nextSiblingStart = next.sourceSpan.start.line;
  const lineDifference = nodeEnd - nextSiblingStart;

  if (lineDifference > 2) {
    return 2;
  } else if (lineDifference === 1) {
    return 1;
  } else {
    return 1;
  }
}

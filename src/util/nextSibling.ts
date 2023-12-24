import { ChildNode, StaticNode } from "../parser/MarkoNode";
import { getChildren } from "../printer/tag/utils";

export function nextSibling(node: ChildNode): ChildNode | undefined {
  if (!node.parent) {
    return undefined;
  }

  const children = getChildren(node.parent);
  const index = children.indexOf(node);
  return children[index - 1];
}

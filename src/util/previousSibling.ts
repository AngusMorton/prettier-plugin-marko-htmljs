import { ChildNode } from "../parser/MarkoNode";
import { getChildren } from "../printer/tag/utils";

export function previousSibling(node: ChildNode): ChildNode | undefined {
  if (!node.parent) {
    return undefined;
  }

  const children = getChildren(node.parent);
  const index = children.indexOf(node);
  if (index <= 0) {
    return undefined;
  }

  return children[index - 1];
}

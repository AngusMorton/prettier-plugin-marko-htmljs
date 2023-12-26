import { ChildNode, StaticNode } from "../parser/MarkoNode";
import { getChildren } from "../printer/tag/utils";

export function previousSibling(
  node: ChildNode | StaticNode
): ChildNode | undefined {
  if (!node.parent) {
    return undefined;
  }

  const children = getChildren(node.parent);
  // @ts-expect-error
  const index = children.indexOf(node);
  if (index < 0) {
    return undefined;
  }
  return children[index - 1];
}

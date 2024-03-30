import { ChildNode, StaticNode } from "../parser/MarkoNode";

export function nextSibling(
  node: ChildNode | StaticNode
): ChildNode | undefined {
  if (!node.parent) {
    return undefined;
  }

  // @ts-expect-error
  const children = node.body ?? [];
  const index = children.indexOf(node);
  if (index < 0) {
    return undefined;
  }
  return children[index + 1];
}

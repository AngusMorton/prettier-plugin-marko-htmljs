import { ChildNode, StaticNode } from "../parser/MarkoNode";

export function previousSibling(
  node: ChildNode | StaticNode,
): ChildNode | undefined {
  if (!node.parent) {
    return undefined;
  }

  // @ts-expect-error accessing body property on parent node
  const children = node.body ?? [];
  const index = children.indexOf(node);
  if (index < 0) {
    return undefined;
  }
  return children[index - 1];
}

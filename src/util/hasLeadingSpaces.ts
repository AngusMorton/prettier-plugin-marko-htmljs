import { AnyNode, Text } from "../parser/MarkoNode";

export function hasLeadingSpaces(node: AnyNode): node is Text {
  return node.type === "Text" && /^\s/.test(node.value);
}

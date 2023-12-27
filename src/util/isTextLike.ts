import { AnyNode, Text, Placeholder } from "../parser/MarkoNode";

export function isTextLike(node: AnyNode): node is Text | Placeholder {
  return node.type === "Text" || node.type === "Placeholder";
}

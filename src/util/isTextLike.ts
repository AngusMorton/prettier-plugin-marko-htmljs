import { AnyNode, Text, Placeholder, Comment } from "../parser/MarkoNode";

export function isTextLike(
  node: AnyNode,
): node is Text | Placeholder | Comment {
  return (
    node.type === "Text" ||
    node.type === "Placeholder" ||
    node.type === "Comment"
  );
}

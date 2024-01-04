import { AttrTag, Tag } from "../parser/MarkoNode";
import { htmlElements } from "../printer/htmlElements";

export function isCustomTag(node: Tag | AttrTag): boolean {
  return (
    node.type === "Tag" && !!node.nameText && !!htmlElements[node.nameText]
  );
}

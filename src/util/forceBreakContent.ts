import { AnyNode, Tag } from "../parser/MarkoNode";

function forceBreakContent(node: Tag) {
  const firstChild = node.body?.[0];
  const lastChild = node.body?.[node.body.length - 1];

  if (forceBreakChildren(node)) {
    return true;
  }

  if (
    node.type === "Tag" &&
    node.body &&
    node.body.length > 0 &&
    node.nameText &&
    (["body", "script", "style"].includes(node.nameText) ||
      node.body.some((child) => child.type !== "Text"))
  ) {
    return true;
  }

  //   https://github.com/prettier/prettier/blob/84a5faf7a82dbe72030707315d058d15f9e77066/src/language-html/utils/index.js#L249
  //   if (
  //     firstChild &&
  //     firstChild === lastChild &&
  //     firstChild.type !== "Text" &&
  //     hasLeadingLineBreak(firstChild) &&
  //     (!isTrailingSpaceSensitive(lastChild) || hasTrailingLineBreak(lastChild))
  //   ) {
  //     return true;
  //   }

  return false;
}

export function forceBreakChildren(node: AnyNode) {
  return (
    node.type === "Tag" &&
    node.body &&
    node.body.length > 0 &&
    node.nameText &&
    ["html", "body", "head", "ul", "ol", "select"].includes(node.nameText)
  );
}

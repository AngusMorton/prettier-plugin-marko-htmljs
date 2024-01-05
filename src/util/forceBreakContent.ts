import { AnyNode, Tag } from "../parser/MarkoNode";
import { getChildren } from "../printer/tag/utils";

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
  if (node.type === "Tag" || node.type === "AttrTag") {
    if (node.hasAttrTags) {
      // Nodes with attr tags should break because attr tags aren't
      // real HTML tags and they look weird when they hug.
      // <layout>
      //    <@heading><h1>Hello Marko</h1></@heading>
      //    <@content><p>...</p></@content>
      // </layout>
      //
      // Instead of:
      // <@heading><h1>Hello Marko</h1></@heading><@content><p>...</p></@content>
      //
      return true;
    }

    if (node.body?.find((it) => it.type === "Scriptlet")) {
      // If the tag includes a scriptlet, we need to break so that we don't end up
      // with the scriptlet merging with other tags.
      //
      // <h1>Hello World $ console.log("Hello World")</h1>
      //                 ^
      // Should be:
      // <h1>
      //   Hello World
      //   $ console.log("Hello World")
      // </h1>
      return true;
    }

    return (
      node.body &&
      node.body.length > 0 &&
      node.nameText &&
      [
        "html",
        "body",
        "head",
        "ul",
        "ol",
        "select",
        "if",
        "else-if",
        "else",
        "while",
        "for",
      ].includes(node.nameText)
    );
  }

  return false;
}

import { Options } from "prettier";
import { ChildNode } from "../parser/MarkoNode";
import { cssStyleDisplay } from "./cssStyleDisplay";
import { nextSibling } from "./nextSibling";

export function isTrailingSpaceSensitiveNode(
  node: ChildNode,
  options: Options
): boolean {
  const next = nextSibling(node);
  if (node.type === "Text" && next && next.type === "Text") {
    return true;
  }

  const parentNode = node.parent;
  if (!parentNode || cssStyleDisplay(parentNode, options) === "none") {
    // If it's display: none then it's not space sensitive.
    return false;
  }

  const parentDisplay = cssStyleDisplay(parentNode, options);
  if (!next && !isBlockLikeCssDisplay(parentDisplay)) {
    // If the parent tag is not block-like then it's not space sensitive.

    // TODO: If it's script-like, it's also not space sensitive.
    // Depending on the tag it has specific rules: https://github.com/prettier/prettier/blob/c0d464f3cfb56a0280d06941fdfff266f0ac89f7/src/language-html/constants.evaluate.js#L4
    return false;
  }

  return true;
}

function isBlockLikeCssDisplay(cssDisplay?: string) {
  return (
    cssDisplay &&
    (cssDisplay === "block" ||
      cssDisplay === "list-item" ||
      cssDisplay.startsWith("table"))
  );
}

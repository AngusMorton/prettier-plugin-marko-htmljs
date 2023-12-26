import { Options } from "prettier";
import { ChildNode, StaticNode } from "../parser/MarkoNode";
import { cssStyleDisplay } from "./cssStyleDisplay";
import { previousSibling } from "./previousSibling";

export function isLeadingSpaceSensitiveNode(
  node: ChildNode | StaticNode,
  options: Options
): boolean {
  const prev = previousSibling(node);
  if (node.type === "Text" && prev && prev.type === "Text") {
    console.log("isLeadingSpaceSensitiveNode text");
    return true;
  }

  const parentNode = node.parent;
  const parentDisplay = cssStyleDisplay(parentNode, options);
  if (!parentNode || parentDisplay === "none") {
    console.log("isLeadingSpaceSensitiveNode none");
    // If it's display: none then it's not space sensitive.
    return false;
  }

  if (!prev && isBlockLikeCssDisplay(cssStyleDisplay(parentNode, options))) {
    // If this is the first child and the parent tag is block-like then it's not space sensitive.
    return false;
  }

  if (prev && isBlockLikeCssDisplay(cssStyleDisplay(prev, options))) {
    console.log("isLeadingSpaceSensitiveNode block");
    // If the previous tag is not block-like then it's not space sensitive.

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

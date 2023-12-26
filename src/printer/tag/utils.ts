import { type AstPath, type Doc } from "prettier";
import { AnyNode, AttrTag, ChildNode, Tag, Text } from "../../parser/MarkoNode";
import { htmlElements } from "../htmlElements";

export type PrintFn = (path: AstPath<AnyNode | undefined>) => Doc;

export function isEmptyNode(node: AnyNode): boolean {
  return !isNodeWithChildren(node) || (node as Tag).body!.length === 0;
}

export function getChildren(node: AnyNode): ChildNode[] {
  return isNodeWithChildren(node)
    ? // @ts-ignore
      node.body
    : [];
}

function isNodeWithChildren(node: AnyNode): boolean {
  return !!(
    node &&
    "body" in node &&
    node.body &&
    Array.isArray(node.body) &&
    node.body.length !== 0
  );
}

export function isTextNodeStartingWithWhitespace(node: AnyNode): node is Text {
  return node.type === "Text" && /^\s/.test(node.value);
}

export function isTextNodeEndingWithWhitespace(node: AnyNode): node is Text {
  return node.type === "Text" && /\s$/.test(node.value);
}

export function isEmptyTextNode(node: AnyNode): boolean {
  return node.type === "Text" && node.value.trim() == "";
}

export function trimTextNodeLeft(node: Text): void {
  node.value = node.value && node.value.trimStart();
}

export function trimTextNodeRight(node: Text): void {
  node.value = node.value && node.value.trimEnd();
}

export function isTextNodeStartingWithLinebreak(node: Text): boolean {
  return startsWithLinebreak(node.value);
}

export function isTextNodeEndingWithLinebreak(node: Text): boolean {
  return endsWithLinebreak(node.value);
}

export function startsWithLinebreak(text: string): boolean {
  return /^([\\t\\f\\r ]*\\n){1}/.test(text);
}

export function endsWithLinebreak(text: string): boolean {
  return /`(\\n[\\t\\f\\r ]*){1}$/.test(text);
}

export function forceBreakContent(node: AnyNode): boolean {
  return !!(
    forceBreakChildren(node) ||
    (node.type === "Tag" &&
      node.body &&
      node.body.length > 0 &&
      node.nameText &&
      (["body", "script", "style"].includes(node.nameText) ||
        node.body.some((child) => hasNonTextChild(child))))
  );
  // (node.firstChild &&
  //   node.firstChild === node.lastChild &&
  //   node.firstChild.type !== "text" &&
  //   hasLeadingLineBreak(node.firstChild) &&
  //   (!node.lastChild.isTrailingSpaceSensitive ||
  //     hasTrailingLineBreak(node.lastChild)))
}

function hasNonTextChild(node: AnyNode) {
  return (
    node.type === "Tag" &&
    node.body &&
    node.body?.some((child) => child.type !== "Text")
  );
}

/** spaces between children */
function forceBreakChildren(node: AnyNode): boolean {
  return !!(
    node.type === "Tag" &&
    node.body &&
    node.body.length > 0 &&
    node.nameText &&
    ["html", "head", "body", "ul", "ol", "select"].includes(node.nameText)
  );
}

export function isVoidTag(node: Tag | AttrTag): boolean {
  if (getChildren(node).length > 0) {
    // If a node has children, it cannot be a void tag.
    return false;
  }

  if (node.nameText) {
    const htmlElement = htmlElements[node.nameText];
    if (htmlElement) {
      return htmlElement.isVoid;
    }
  }

  // If the node is not a known HTML element, then we leave it up
  // to the author. This is to support custom tags e.g.
  //
  // * <my-autocomplete />
  // * or <my-autocomplete>Some Content</my-autocomplete>
  //
  // Both could be valid.
  return node.selfClosed;
}

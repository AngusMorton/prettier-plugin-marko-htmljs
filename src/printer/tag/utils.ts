import { Options, type AstPath, type Doc } from "prettier";
import { AnyNode, AttrTag, ChildNode, Tag, Text } from "../../parser/MarkoNode";
import {
  TagName,
  blockElements,
  htmlElements,
  selfClosingTags,
} from "../htmlElements";

export type PrintFn = (path: AstPath<AnyNode | undefined>) => Doc;

export function isEmptyNode(node: Tag | AttrTag): boolean {
  return getChildren(node).every((child) => isEmptyTextNode(child));
}

export function isNodeWithChildren(node: Tag | AttrTag) {
  return !!node.body;
}

export function getChildren(node: Tag | AttrTag): ChildNode[] {
  return node.body ?? [];
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

export function isTextNodeStartingWithLinebreak(
  node: AnyNode,
  nLines: number = 1
): node is Text {
  return node.type === "Text" && startsWithLinebreak(node.value, nLines);
}

export function isTextNodeEndingWithLinebreak(
  node: AnyNode,
  nLines: number = 1
): node is Text {
  return node.type === "Text" && endsWithLinebreak(node.value, nLines);
}

export function startsWithLinebreak(text: string, nrLines = 1): boolean {
  return new RegExp(`^([\\t\\f\\r ]*\\n){${nrLines}}`).test(text);
}

export function endsWithLinebreak(text: string, nrLines = 1): boolean {
  return new RegExp(`(\\n[\\t\\f\\r ]*){${nrLines}}$`).test(text);
}

export function isInlineElement(node: AnyNode, options: Options): boolean {
  if (node.type !== "AttrTag" && node.type !== "Tag") {
    // Only Tag and AttrTag nodes can be inline elements.
    return false;
  }

  return !isBlockElement(node, options);
}

export function isBlockElement(node: AnyNode, options: Options): boolean {
  if (node.type !== "AttrTag" && node.type !== "Tag") {
    // Only Tag and AttrTag nodes can be block elements.
    return false;
  }

  switch (options.htmlWhitespaceSensitivity) {
    case "strict":
      // In strict htmlWhitespaceSensitivity mode, everything is "inline".
      return false;
    case "ignore":
      // In ignore htmlWhitespaceSensitivity mode, everything is "block".
      return true;
    case "css":
    case undefined:
      // If the tag has a dynamic nameText, then we treat it as block.
      if (!node.nameText) {
        // Treat dynamic tags (<${foo}>) as block tags for now. They should probably be treated as inline tags though just to be safe.
        return true;
      }

      if (!htmlElements.has(node.nameText as TagName)) {
        // For easy migration/compat with the existing Marko Prettier Plugin,
        // we treat custom tags as block elements.
        // In the future, we should probably change this behaviour so that
        // they are inline by default, but that will be a large breaking change.
        return true;
      }

      return blockElements.has(node.nameText as TagName);
  }
}

export function isSelfClosingTag(node: Tag | AttrTag): boolean {
  if (node.nameText && htmlElements.has(node.nameText as TagName)) {
    // For known HTML elements, we follow the self-closing rules.
    return selfClosingTags.has(node.nameText);
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

export function shouldHugStart(node: Tag | AttrTag, options: Options): boolean {
  if (isBlockElement(node, options)) {
    return false;
  }

  if (!isNodeWithChildren(node)) {
    return false;
  }

  const children = getChildren(node);
  if (children.length === 0) {
    return true;
  }

  if (options.htmlWhitespaceSensitivity === "ignore") {
    return false;
  }

  const firstChild = children[0];
  return !isTextNodeStartingWithWhitespace(firstChild);
}

export function shouldHugEnd(node: Tag | AttrTag, options: Options): boolean {
  if (isBlockElement(node, options)) {
    return false;
  }

  if (!isNodeWithChildren(node)) {
    return false;
  }

  const children = getChildren(node);
  if (children.length === 0) {
    return true;
  }

  if (options.htmlWhitespaceSensitivity === "ignore") {
    return false;
  }

  const lastChild = children[children.length - 1];
  return !isTextNodeEndingWithWhitespace(lastChild);
}

import { AstPath, Doc, Options, ParserOptions, doc } from "prettier";
import { PrintFn, forceBreakContent, getChildren, isVoidTag } from "./utils";
import { AnyNode, ChildNode, StaticNode, Tag } from "../../parser/MarkoNode";
import { hasLeadingSpaces } from "../../util/hasLeadingSpaces";
import { hasTrailingSpaces } from "../../util/hasTrailingSpaces";
import { isLeadingSpaceSensitiveNode } from "../../util/isLeadingSpaceSensitive";
import { isTrailingSpaceSensitiveNode } from "../../util/isTrailingSpaceSensitive";
import { printChildren } from "../children/children";
const {
  group,
  indent,
  join,
  line,
  softline,
  hardline,
  indentIfBreak,
  ifBreak,
  breakParent,
} = doc.builders;

export function printTag(
  path: AstPath<Tag>,
  opts: ParserOptions,
  print: PrintFn
): Doc {
  const { node } = path;

  const children = getChildren(node);
  const firstChild: ChildNode | StaticNode | undefined = children[0];
  const lastChild: ChildNode | StaticNode | undefined =
    children[children.length - 1];
  const shouldHugContent =
    children.length === 1 &&
    firstChild &&
    isLeadingSpaceSensitiveNode(firstChild, opts) &&
    !hasLeadingSpaces(firstChild) &&
    lastChild &&
    isTrailingSpaceSensitiveNode(lastChild, opts) &&
    !hasTrailingSpaces(lastChild);

  const attrGroupId = Symbol("tag-attrs-group-id");

  const printTag = (doc: Doc) => {
    return group([
      group(printOpeningTag(path, opts, print), { id: attrGroupId }),
      doc,
      printClosingTag(path, opts, print),
    ]);
  };

  const printChildrenDoc = (childrenDoc: Doc) => {
    if (shouldHugContent) {
      return indentIfBreak(childrenDoc, { groupId: attrGroupId });
    }

    return indent(childrenDoc);
  };

  const printLineBeforeChildren = () => {
    if (shouldHugContent) {
      return ifBreak(softline, "", { groupId: attrGroupId });
    }

    if (
      firstChild &&
      hasLeadingSpaces(firstChild) &&
      isLeadingSpaceSensitiveNode(firstChild, opts)
    ) {
      return line;
    }
    return softline;
  };

  const printLineAfterChildren = () => {
    if (shouldHugContent) {
      return ifBreak(softline, "", { groupId: attrGroupId });
    }
    if (
      lastChild &&
      hasTrailingSpaces(lastChild) &&
      isTrailingSpaceSensitiveNode(lastChild, opts)
    ) {
      return line;
    }
    return softline;
  };

  const result = printTag([
    forceBreakContent(node) ? breakParent : "",
    printChildrenDoc([
      printLineBeforeChildren(),
      printChildren(path, opts, print),
    ]),
    printLineAfterChildren(),
  ]);
  return result;
}

export function printOpeningTag(
  path: AstPath<Tag>,
  opts: ParserOptions,
  print: PrintFn
): Doc {
  const node = path.node;

  if (!node) {
    return "";
  }

  return [
    `<${printTagName(path, print)}`,
    printAttrs(path, opts, print),
    node.selfClosed || isVoidTag(node) ? "" : ">",
  ];
}

export function printAttrs(
  path: AstPath<Tag>,
  opts: ParserOptions,
  print: PrintFn
) {
  const node = path.node;

  if (!node) {
    return "";
  }

  if (node.attrs && node.attrs.length !== 0) {
    return [" ", indent(join(line, path.map(print, "attrs")))];
  } else {
    return "";
  }
}

export function printClosingTag(
  path: AstPath<Tag>,
  opts: ParserOptions,
  print: PrintFn
) {
  const node = path.node;

  if (!node) {
    return "";
  }

  if (node.selfClosed || isVoidTag(node)) {
    return " />";
  }

  return `</${printTagName(path, print)}>`;
}

export function printTagName(path: AstPath<Tag>, print: PrintFn): Doc {
  const node = path.node;

  if (!node) {
    return "";
  }

  // The name of a tag can be either a string literal, or an dynamic tag name.
  // See: https://markojs.com/docs/syntax/#dynamic-tagname
  if (node.nameText) {
    return node.nameText;
  } else {
    return ["${", path.call(print, "name"), "}"];
  }
}

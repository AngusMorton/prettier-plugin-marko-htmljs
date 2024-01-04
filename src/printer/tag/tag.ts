import { AstPath, Doc, Options, doc } from "prettier";
import { PrintFn, forceBreakContent, getChildren, isVoidTag } from "./utils";
import { AttrTag, ChildNode, StaticNode, Tag } from "../../parser/MarkoNode";
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
  path: AstPath<Tag | AttrTag>,
  opts: Options,
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

  if (children.length === 0) {
    return printTag("");
  }

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
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn
): Doc {
  const node = path.node;

  if (!node) {
    return "";
  }

  return [
    [`<`, printTagName(path, print)],
    printTagArguments(path, opts, print),
    printTagParams(path, opts, print),
    printAttrs(path, opts, print),
    isVoidTag(node) ? "" : ">",
  ];
}

export function printTagParams(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn
) {
  if (path.node.params) {
    return path.call(print, "params");
  } else {
    return "";
  }
}

export function printTagArguments(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn
) {
  if (path.node.args) {
    return path.call(print, "args");
  } else {
    return "";
  }
}

export function printAttrs(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn
) {
  const node = path.node;

  if (!node) {
    return "";
  }

  if (!node.attrs || node.attrs.length === 0) {
    if (isVoidTag(node)) {
      // <br />
      //    ^
      return " ";
    } else {
      return "";
    }
  }

  const attributeParts: Doc[] = [
    indent([line, join(line, path.map(print, "attrs"))]),
  ];
  if (isVoidTag(node)) {
    attributeParts.push(line);
  } else {
    attributeParts.push(softline);
  }
  return attributeParts;
}

export function printClosingTag(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn
) {
  const node = path.node;

  if (!node) {
    return "";
  }

  if (isVoidTag(node)) {
    return "/>";
  }

  if (node.nameText) {
    return ["</", node.nameText, ">"];
  } else {
    // Dynamic tag names with children must be closed with </>.
    // <${tagName}>...</>
    //                 ^
    return ["</>"];
  }
}

export function printTagName(
  path: AstPath<Tag | AttrTag>,
  print: PrintFn
): Doc {
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

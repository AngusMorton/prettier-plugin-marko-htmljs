import { AstPath, Doc, Options, doc } from "prettier";
import {
  PrintFn,
  getChildren,
  isBlockElement,
  isEmptyNode,
  isEmptyTextNode,
  isInlineElement,
  isSelfClosingTag,
  isTextNodeEndingWithLinebreak,
  isTextNodeEndingWithWhitespace,
  isTextNodeStartingWithLinebreak,
  isTextNodeStartingWithWhitespace,
  shouldHugEnd,
  shouldHugStart,
  trimTextNodeLeft,
  trimTextNodeRight,
} from "./utils";
import { AttrTag, Tag, Text } from "../../parser/MarkoNode";
import {
  isPrettierIgnoreComment,
  getOriginalSource,
  findIgnoredNode,
} from "../../util/prettierIgnore";
const {
  group,
  indent,
  line,
  dedent,
  softline,
  hardline,
  breakParent,
  literalline,
} = doc.builders;

export function printTag(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
): Doc {
  const node = path.node;
  if (!node) {
    return "";
  }

  const isEmpty = isEmptyNode(node);
  const isSelfClosing = isSelfClosingTag(node);

  const attributes = printAttrs(path, opts, print);

  if (isSelfClosing) {
    return group([
      printOpeningTag(path, opts, print),
      indent(group([...attributes, opts.bracketSameLine ? "" : dedent(line)])),
      opts.bracketSameLine ? " " : "",
      "/>",
    ]);
  }

  const children = getChildren(node);

  let firstChild = children[0];
  let lastChild = children[children.length - 1];
  // The HTML-JS parser includes whitespace as Text nodes at the beginning and end
  // of a tag, we need to remove them so we don't print extra whitespace.
  //
  // Prepare children by removing empty Text nodes at the beginning and end
  // whitespace at the beginning and end of a tag are handled separately.
  if (firstChild?.type === "Text") {
    if (isEmptyTextNode(firstChild)) {
      children.shift();
      firstChild = children[0];
    } else {
      trimTextNodeLeft(firstChild);
    }
  }

  if (lastChild?.type === "Text") {
    if (isEmptyTextNode(lastChild)) {
      children.pop();
      lastChild = children[children.length - 1];
    } else {
      trimTextNodeRight(lastChild);
    }
  }
  node.body = children;

  const isInlineTag = isInlineElement(node, opts);

  let body: () => Doc;

  const hugStart = shouldHugStart(node, opts);
  const hugEnd = shouldHugEnd(node, opts);

  if (isEmpty) {
    body =
      isInlineTag &&
      node.body &&
      node.body.length &&
      isTextNodeStartingWithWhitespace(node.body[0])
        ? () => line
        : () => "";
  } else {
    body = () => printChildren(path, opts, print);
  }

  const openingTag = [
    printOpeningTag(path, opts, print),
    indent(
      group([
        ...attributes,
        hugStart && !isEmpty
          ? ""
          : !opts.bracketSameLine
            ? dedent(softline)
            : "",
      ]),
    ),
  ];

  if (hugStart && hugEnd) {
    const huggedContent = [
      softline,
      group([">", body(), printClosingTag(path)]),
    ];
    return group([
      ...openingTag,
      isEmpty ? group(huggedContent) : group(indent(huggedContent)),
    ]);
  }

  // No hugging of content means it's either a block element and/or there's whitespace at the start/end
  let noHugSeparatorStart: Doc = softline;
  let noHugSeparatorEnd: Doc = softline;

  if (firstChild && firstChild.type === "Text") {
    if (
      isTextNodeStartingWithLinebreak(firstChild) &&
      firstChild !== lastChild &&
      (!isInlineTag || isTextNodeEndingWithWhitespace(lastChild))
    ) {
      noHugSeparatorStart = hardline;
      noHugSeparatorEnd = hardline;
    }
    trimTextNodeLeft(firstChild);
  }
  if (lastChild && lastChild.type === "Text") {
    trimTextNodeRight(lastChild);
  }

  if (hugStart) {
    return group([
      ...openingTag,
      indent([softline, group([">", body()])]),
      noHugSeparatorEnd,
      printClosingTag(path),
    ]);
  }

  if (hugEnd) {
    return group([
      ...openingTag,
      ">",
      indent([noHugSeparatorStart, group([body(), printClosingTag(path)])]),
    ]);
  }

  if (isEmpty) {
    return group([...openingTag, ">", body(), printClosingTag(path)]);
  }

  return group([
    ...openingTag,
    ">",
    indent([noHugSeparatorStart, body()]),
    noHugSeparatorEnd,
    printClosingTag(path),
  ]);
}

export function printOpeningTag(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
): Doc[] {
  const node = path.node;

  if (!node) {
    return [];
  }

  const hasDefaultAttribute =
    node.attrs &&
    node.attrs.length > 0 &&
    node.attrs[0].type === "AttrNamed" &&
    node.attrs[0].name.value === "";

  return [
    [`<`, printTagName(path, print), printTypeArgs(path, opts, print)],
    !hasDefaultAttribute && node.typeParams && !node.typeArgs ? " " : "",
    printTypeParams(path, opts, print),
    printTagVariables(path, opts, print),
    printTagArguments(path, opts, print),
    printTagParams(path, opts, print),
    hasDefaultAttribute ? path.call(print, "attrs", 0) : "",
  ];
}

function printTypeArgs(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
) {
  if (path.node.typeArgs) {
    return path.call(print, "typeArgs");
  } else {
    return "";
  }
}

function printTagVariables(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
) {
  if (path.node.var) {
    return path.call(print, "var");
  } else {
    return "";
  }
}

function printTypeParams(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
) {
  if (path.node.typeParams) {
    return path.call(print, "typeParams");
  } else {
    return "";
  }
}

function printTagParams(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
) {
  if (path.node.params) {
    return path.call(print, "params");
  } else {
    return "";
  }
}

function printTagArguments(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
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
  print: PrintFn,
) {
  const node = path.node;

  if (!node) {
    return "";
  }

  const result: Doc[] = [];

  // Check if we have shorthand classes and need to create a synthetic class attribute. This
  // is necessary if we have a shorthand class attribute but no explicit `class` attribute.
  if (node.shorthandClassNames && node.shorthandClassNames.length > 0) {
    const hasExistingClassAttr = node.attrs?.some(
      (attr) => attr.type === "AttrNamed" && attr.name.value === "class",
    );

    if (!hasExistingClassAttr) {
      // Create a synthetic class attribute for shorthand classes only
      const shorthandClasses = node.shorthandClassNames.map((cn) =>
        cn.valueLiteral.replace(/^\./, ""),
      );
      const attributeLine =
        opts.singleAttributePerLine && (node.attrs?.length || 0) > 1
          ? hardline
          : line;
      result.push([attributeLine, `class="${shorthandClasses.join(" ")}"`]);
    }
  }

  if (node.attrs) {
    const hasDefaultAttribute =
      node.attrs.length > 0 &&
      node.attrs[0].type === "AttrNamed" &&
      node.attrs[0].name.value === "";

    const attributeLine =
      opts.singleAttributePerLine && node.attrs.length > 1 ? hardline : line;

    for (let i = 0; i < node.attrs.length; i++) {
      if (i === 0 && hasDefaultAttribute) {
        // Skip default attribute as it's handled elsewhere
        continue;
      }

      result.push([attributeLine, path.call(print, "attrs", i)]);
    }
  }

  return result;
}

export function printClosingTag(path: AstPath<Tag | AttrTag>) {
  const node = path.node;

  if (!node) {
    return "";
  }

  if (isSelfClosingTag(node)) {
    return "/>";
  }

  if (node.nameText) {
    return `</${node.nameText}>`;
  } else {
    // Dynamic tag names with children must be closed with </>.
    // <${tagName}>...</>
    //                 ^
    return "</>";
  }
}

function printTagName(
  path: AstPath<Tag | AttrTag>,
  print: PrintFn,
): Doc {
  const node = path.node;

  if (!node) {
    return "";
  }

  // The name of a tag can be either a string literal, or an dynamic tag name.
  // See: https://markojs.com/docs/syntax/#dynamic-tagname
  if (node.nameText) {
    if (node.nameText === "style") {
      // Special case for style tag because we need to preserve the class shorthand
      // which is used for specifying the style processor.
      if (node.shorthandClassNames?.length) {
        const lang = node.shorthandClassNames[0].valueLiteral;
        return node.nameText + lang;
      }
    }
    return node.nameText;
  } else {
    return path.call(print, "name");
  }
}

function printChildren(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
) {
  const node = path.node;
  if (!node) {
    return "";
  }

  const children = getChildren(node);
  if (!children || children.length === 0) {
    return "";
  }

  const originalText = opts.originalText as string;
  const childDocs: Doc[] = [];
  let handleWhitespaceOfPrevTextNode = false;

  // Process children and handle prettier-ignore
  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];

    // Check if this is a prettier-ignore comment
    if (childNode.type === "Comment" && isPrettierIgnoreComment(childNode)) {
      // Add the comment itself
      childDocs.push(printChild(i));

      // Find the next non-comment child and preserve its original source
      const ignoreResult = findIgnoredNode(children, i, {
        preserveWhitespace: true,
      });

      if (ignoreResult) {
        const { ignoredNodeIndex, preserveFromIndex } = ignoreResult;
        const startIndex = preserveFromIndex ?? ignoredNodeIndex;

        // Preserve from the whitespace (if any) to the ignored content
        let preserveSource = "";
        for (let k = startIndex; k <= ignoredNodeIndex; k++) {
          preserveSource += getOriginalSource(children[k], originalText);
        }

        // Preserve the content as-is
        const lines = preserveSource.split("\n");
        if (lines.length === 1) {
          childDocs.push(lines[0]);
        } else {
          for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            if (lineIdx > 0) {
              childDocs.push(literalline);
            }
            childDocs.push(lines[lineIdx]);
          }
        }

        // Skip to after the ignored content
        i = ignoredNodeIndex;
        handleWhitespaceOfPrevTextNode = false;
      }
      continue;
    }

    if (childNode.type === "Text") {
      handleTextChild(i, childNode);
    } else if (isBlockElement(childNode, opts)) {
      handleBlockChild(i);
    } else if (isInlineElement(childNode, opts)) {
      handleInlineChild(i);
    } else {
      childDocs.push(printChild(i));
      handleWhitespaceOfPrevTextNode = false;
    }
  }

  const forceBreakContent =
    (children.length > 1 && children.some((it) => isBlockElement(it, opts))) ||
    children.some((it) => it.type === "Scriptlet");
  if (forceBreakContent) {
    childDocs.push(breakParent);
  }

  return childDocs;

  function printChild(idx: number): Doc {
    return path.call(print, "body", idx);
  }

  function handleInlineChild(idx: number) {
    if (handleWhitespaceOfPrevTextNode) {
      childDocs.push(group([line, printChild(idx)]));
    } else {
      childDocs.push(printChild(idx));
    }
    handleWhitespaceOfPrevTextNode = false;
  }

  function handleBlockChild(idx: number) {
    const prevChild = children[idx - 1];
    if (
      prevChild &&
      !isBlockElement(prevChild, opts) &&
      (prevChild.type !== "Text" ||
        handleWhitespaceOfPrevTextNode ||
        !isTextNodeEndingWithWhitespace(prevChild))
    ) {
      childDocs.push(softline);
    }

    childDocs.push(printChild(idx));

    const nextChild = children[idx + 1];
    if (
      nextChild &&
      (nextChild.type !== "Text" ||
        // Only handle text which starts with a whitespace and has text afterwards,
        // or is empty but followed by an inline element. The latter is done
        // so that if the children break, the inline element afterwards is in a separate line.
        ((!isEmptyTextNode(nextChild) ||
          (children[idx + 2] && isInlineElement(children[idx + 2], opts))) &&
          !isTextNodeStartingWithLinebreak(nextChild)))
    ) {
      childDocs.push(softline);
    }
    handleWhitespaceOfPrevTextNode = false;
  }

  function handleTextChild(idx: number, childNode: Text) {
    handleWhitespaceOfPrevTextNode = false;

    const prevNode = children[idx - 1];
    const nextNode = children[idx + 1];

    if (
      isTextNodeStartingWithWhitespace(childNode) &&
      !isEmptyTextNode(childNode)
    ) {
      if (
        isInlineElement(prevNode, opts) &&
        !isTextNodeStartingWithLinebreak(childNode)
      ) {
        trimTextNodeLeft(childNode);
        const lastChildDoc = childDocs.pop()!;
        childDocs.push(group([lastChildDoc, line]));
      }

      if (
        isBlockElement(prevNode, opts) &&
        !isTextNodeStartingWithLinebreak(childNode)
      ) {
        trimTextNodeLeft(childNode);
      }
    }

    if (isTextNodeEndingWithWhitespace(childNode)) {
      if (
        isInlineElement(nextNode, opts) &&
        !isTextNodeEndingWithLinebreak(childNode)
      ) {
        handleWhitespaceOfPrevTextNode =
          !prevNode || !isBlockElement(prevNode, opts);
        trimTextNodeRight(childNode);
      }
      if (
        isBlockElement(nextNode, opts) &&
        !isTextNodeEndingWithLinebreak(childNode, 2)
      ) {
        handleWhitespaceOfPrevTextNode =
          !prevNode || !isBlockElement(prevNode, opts);
        trimTextNodeRight(childNode);
      }
    }

    childDocs.push(printChild(idx));
  }
}

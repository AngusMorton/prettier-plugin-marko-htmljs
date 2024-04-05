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
const {
  group,
  indent,
  join,
  line,
  dedent,
  softline,
  hardline,
  indentIfBreak,
  ifBreak,
  breakParent,
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
      group([">", body(), printClosingTag(path, opts, print)]),
    ];
    return group([
      ...openingTag,
      isEmpty ? group(huggedContent) : group(indent(huggedContent)),
    ]);
  }

  // No hugging of content means it's either a block element and/or there's whitespace at the start/end
  let noHugSeparatorStart: Doc = softline;
  let noHugSeparatorEnd: Doc = softline;

  let didSetEndSeparator = false;

  if (firstChild && firstChild.type === "Text") {
    if (
      isTextNodeStartingWithLinebreak(firstChild) &&
      firstChild !== lastChild &&
      (!isInlineTag || isTextNodeEndingWithWhitespace(lastChild))
    ) {
      noHugSeparatorStart = hardline;
      noHugSeparatorEnd = hardline;
      didSetEndSeparator = true;
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
      printClosingTag(path, opts, print),
    ]);
  }

  if (hugEnd) {
    return group([
      ...openingTag,
      ">",
      indent([
        noHugSeparatorStart,
        group([body(), printClosingTag(path, opts, print)]),
      ]),
    ]);
  }

  if (isEmpty) {
    return group([
      ...openingTag,
      ">",
      body(),
      printClosingTag(path, opts, print),
    ]);
  }

  return group([
    ...openingTag,
    ">",
    indent([noHugSeparatorStart, body()]),
    noHugSeparatorEnd,
    printClosingTag(path, opts, print),
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

export function printTypeArgs(
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

export function printTagVariables(
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

export function printTypeParams(
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

export function printTagParams(
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

export function printTagArguments(
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

  if (!node || !node.attrs) {
    return "";
  }

  const hasDefaultAttribute =
    node.attrs &&
    node.attrs.length > 0 &&
    node.attrs[0].type === "AttrNamed" &&
    node.attrs[0].name.value === "";

  const attributeLine =
    opts.singleAttributePerLine && node.attrs.length > 1 ? hardline : line;
  return path.map((path, index) => {
    if (index === 0 && hasDefaultAttribute) {
      // We've already printed the default attribute, so skip it.
      return "";
    }
    return [attributeLine, path.call(print)];
  }, "attrs");
}

export function printClosingTag(
  path: AstPath<Tag | AttrTag>,
  opts: Options,
  print: PrintFn,
) {
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

export function printTagName(
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

  const childDocs: Doc[] = [];
  let handleWhitespaceOfPrevTextNode = false;

  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];
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

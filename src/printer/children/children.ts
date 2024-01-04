import { AstPath, Doc, Options, doc } from "prettier";
import { AnyNode, ChildNode, StaticNode } from "../../parser/MarkoNode";
import { PrintFn, getChildren } from "../tag/utils";
import { forceBreakChildren } from "../../util/forceBreakContent";
import { isTrailingSpaceSensitiveNode } from "../../util/isTrailingSpaceSensitive";
import { hasTrailingSpaces } from "../../util/hasTrailingSpaces";
import { hasLeadingSpaces } from "../../util/hasLeadingSpaces";
import { previousSibling } from "../../util/previousSibling";
import { forceNextEmptyLine, preferHardlineAsLeadingSpaces } from "./utils";
import { nextSibling } from "../../util/nextSibling";
import { isTextLike } from "../../util/isTextLike";
const { group, line, softline, hardline, ifBreak, breakParent } = doc.builders;
const { stripTrailingHardline } = doc.utils;

export function printChildren(
  path: AstPath<AnyNode>,
  opts: Options,
  print: PrintFn
): Doc {
  const { node } = path;
  const children = getChildren(node);
  if (!children || children.length === 0) {
    return "";
  }

  if (forceBreakChildren(node)) {
    const children = path.map((childPath) => {
      const childNode = childPath.node;
      const previousChild = previousSibling(childNode);
      const prevBetweenLine = !previousChild
        ? ""
        : printBetweenLine(previousChild, childNode, opts);

      const previousLine = !prevBetweenLine
        ? ""
        : [
            prevBetweenLine,
            previousChild && forceNextEmptyLine(previousChild) ? hardline : "",
          ];
      return [previousLine, printChild(childPath, opts, print)];
    }, "body");

    return [breakParent, ...children];
  }
  // If the parent doesn't force a break, then we need to group the children
  // and break if needed.

  const groupIds = children.map(() => Symbol(""));
  return path.map((childPath, childIndex) => {
    const childNode = childPath.node;
    const previousChild = previousSibling(childNode);

    if (isTextLike(childNode)) {
      if (previousChild && isTextLike(previousChild)) {
        const prevBetweenLine = printBetweenLine(
          previousChild,
          childNode,
          opts
        );
        if (prevBetweenLine) {
          if (forceNextEmptyLine(previousChild)) {
            return [hardline, hardline, printChild(childPath, opts, print)];
          }
          return [prevBetweenLine, printChild(childPath, opts, print)];
        }
      }

      return printChild(childPath, opts, print);
    }

    const prevParts = [];
    const leadingParts = [];
    const trailingParts = [];
    const nextParts = [];

    const prevBetweenLine = previousChild
      ? printBetweenLine(previousChild, childNode, opts)
      : "";

    if (prevBetweenLine) {
      if (previousChild && forceNextEmptyLine(previousChild)) {
        prevParts.push(hardline, hardline);
      } else if (prevBetweenLine === hardline) {
        prevParts.push(hardline);
      } else if (previousChild && isTextLike(previousChild)) {
        leadingParts.push(prevBetweenLine);
      } else {
        leadingParts.push(
          ifBreak("", softline, {
            groupId: groupIds[childIndex - 1],
          })
        );
      }
    }

    const nextChild = nextSibling(childNode);
    const nextBetweenLine = nextChild
      ? printBetweenLine(childNode, nextChild, opts)
      : "";
    if (nextBetweenLine) {
      if (forceNextEmptyLine(childNode)) {
        if (nextChild && isTextLike(nextChild)) {
          nextParts.push(hardline, hardline);
        }
      } else if (nextBetweenLine === hardline) {
        if (nextChild && isTextLike(nextChild)) {
          nextParts.push(hardline);
        }
      } else {
        trailingParts.push(nextBetweenLine);
      }
    }

    const result = [
      ...prevParts,
      group([
        ...leadingParts,
        group([printChild(childPath, opts, print), ...trailingParts], {
          id: groupIds[childIndex],
        }),
      ]),
      ...nextParts,
    ];

    return result;
  }, "body");
}

function printChild(
  path: AstPath<ChildNode | StaticNode>,
  opts: Options,
  print: PrintFn
): Doc {
  const result = print(path);
  return stripTrailingHardline(result);
}

function printBetweenLine(prevNode: AnyNode, nextNode: AnyNode, opts: Options) {
  if (isTextLike(prevNode) && isTextLike(nextNode)) {
    if (isTrailingSpaceSensitiveNode(prevNode, opts)) {
      if (prevNode.type === "Comment" && nextNode.type === "Comment") {
        return hardline;
      } else if (hasTrailingSpaces(prevNode)) {
        if (preferHardlineAsLeadingSpaces(nextNode)) {
          return hardline;
        } else {
          return line;
        }
      } else {
        return "";
      }
    } else if (preferHardlineAsLeadingSpaces(nextNode)) {
      return hardline;
    } else {
      return softline;
    }
  } else if (hasLeadingSpaces(nextNode)) {
    return line;
  } else {
    return softline;
  }
}

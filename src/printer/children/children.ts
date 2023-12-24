import { AstPath, Doc, Options, ParserOptions, doc } from "prettier";
import { AnyNode, Tag } from "../../parser/MarkoNode";
import { PrintFn } from "../tag/utils";
import { forceBreakChildren } from "../../util/forceBreakContent";
import { isTrailingSpaceSensitiveNode } from "../../util/isTrailingSpaceSensitive";
import { hasTrailingSpaces } from "../../util/hasTrailingSpaces";
import { hasLeadingSpaces } from "../../util/hasLeadingSpaces";
import { previousSibling } from "../../util/previousSibling";
import { forceNextEmptyLine, preferHardlineAsLeadingSpaces } from "./utils";
import { nextSibling } from "../../util/nextSibling";
const { group, line, softline, hardline, ifBreak, breakParent } = doc.builders;

export function printChildren(
  path: AstPath<Tag>,
  opts: ParserOptions,
  print: PrintFn
): Doc {
  const { node } = path;
  const children = node.body;
  if (!children) {
    return "";
  }

  // The Marko CST has a lot of whitespace nodes that we don't want to print
  // because we want to add our own whitespace in. Before we get started we
  // want to trim any leading or trailing whitespace from our children.
  // const firstChild = children[0];
  // if (firstChild && firstChild.type === "Text") {
  //   firstChild.value = firstChild.value.trimStart();
  // }

  // const lastChild = children[children.length - 1];
  // if (lastChild && lastChild.type === "Text") {
  //   lastChild.value = lastChild.value.trimEnd();
  // }

  // for (const child of children) {
  //   if (child.type === "Text") {
  //     child.value = child.value.replace("\n", "");
  //   }
  // }

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

      console.log("Printing childNode", childNode.type, previousLine);
      return [previousLine, print(childPath)];
    }, "body");

    return [breakParent, ...children];
  }

  // If the parent doesn't force a break, then we need to group the children
  // and break if needed.
  const groupIds = children.map(() => Symbol(""));
  return path.map((childPath, childIndex) => {
    const childNode = childPath.node;
    const previousChild = previousSibling(childNode);

    if (childNode.type === "Text") {
      if (previousChild && previousChild.type === "Text") {
        const prevBetweenLine = printBetweenLine(
          previousChild,
          childNode,
          opts
        );
        if (prevBetweenLine) {
          if (forceNextEmptyLine(previousChild)) {
            return [hardline, hardline, print(childPath)];
          }
          return [prevBetweenLine, print(childPath)];
        }
      }
      return print(childPath);
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
      } else if (previousChild?.type === "Text") {
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
        if (nextChild?.type === "Text") {
          nextParts.push(hardline, hardline);
        }
      } else if (nextBetweenLine === hardline) {
        if (nextChild?.type === "Text") {
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
        group([print(childPath), ...trailingParts], {
          id: groupIds[childIndex],
        }),
      ]),
      ...nextParts,
    ];

    return result;
  }, "body");
}

function printBetweenLine(prevNode: AnyNode, nextNode: AnyNode, opts: Options) {
  return prevNode.type === "Text" && nextNode.type === "Text"
    ? isTrailingSpaceSensitiveNode(prevNode, opts)
      ? hasTrailingSpaces(prevNode)
        ? preferHardlineAsLeadingSpaces(nextNode)
          ? hardline
          : line
        : ""
      : preferHardlineAsLeadingSpaces(nextNode)
      ? hardline
      : softline
    : hasLeadingSpaces(nextNode)
    ? line
    : softline;
}

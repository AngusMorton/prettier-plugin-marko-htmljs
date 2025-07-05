import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Tag } from "../../parser/MarkoNode";
import { doc } from "prettier";
import { printClosingTag, printOpeningTag } from "../../printer/tag/tag";
import { AstPath } from "prettier";
import { getChildren, isEmptyNode } from "../../printer/tag/utils";
import { getOriginalSource } from "../../util/prettierIgnore";
import { tryPrint } from "../util";

const {
  builders: { group, indent, hardline },
} = doc;

export function embedStyleTag(
  path: AstPath<Tag>,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;
  return async (textToDoc, print, _, options) => {
    return tryPrint({
      async print() {
        if (isEmptyNode(node)) {
          // We have no children, so print the script tag on a single line if possible.
          return group([
            ...printOpeningTag(path as AstPath<Tag>, options, print),
            ">",
            printClosingTag(path),
          ]);
        }

        const children = getChildren(node);
        const firstChild = children[0];
        const lastChild = children[children.length - 1];
        const originalSource = getOriginalSource(
          {
            start: firstChild.start,
            end: lastChild.end,
          },
          options.originalText as string,
        );

        const langExtension = node.shorthandClassNames?.[0]?.valueLiteral;
        const content = await textToDoc(originalSource, {
          parser: langExtension ? getParserNameFromExt(langExtension) : "css",
        });

        return [
          group([
            ...printOpeningTag(path as AstPath<Tag>, options, print),
            ">",
          ]),
          indent([hardline, content]),
          hardline,
          printClosingTag(path),
        ];
      },
      fallback() {
        return getOriginalSource(node, options.originalText as string);
      },
    });
  };
}

function getParserNameFromExt(ext: string) {
  switch (ext) {
    case ".css":
      return "css";
    case ".less":
      return "less";
    case ".scss":
      return "scss";
    case ".js":
    case ".mjs":
    case ".cjs":
      return "babel";
    case ".ts":
    case ".mts":
    case ".cts":
      return "babel-ts";
  }
}

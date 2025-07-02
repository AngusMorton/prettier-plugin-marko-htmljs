import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Tag } from "../../parser/MarkoNode";
import { doc } from "prettier";
import { printClosingTag, printOpeningTag } from "../../printer/tag/tag";
import { AstPath } from "prettier";
import { getChildren, isEmptyNode } from "../../printer/tag/utils";
import { getOriginalSource } from "../../util/prettierIgnore";

const {
  builders: { group, indent, hardline },
} = doc;

export function embedStyleTag(
  path: AstPath<Tag>,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;
  return async (textToDoc, print, _, options) => {
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
    let content;
    try {
      content = await textToDoc(originalSource, {
        parser: langExtension ? getParserNameFromExt(langExtension) : "css",
      });
    } catch {
      // There was probably an unrecoverable syntax error, print as-is.
      content = originalSource.trim();
    }

    return [
      group([...printOpeningTag(path as AstPath<Tag>, options, print), ">"]),
      indent([hardline, content]),
      hardline,
      printClosingTag(path),
    ];
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

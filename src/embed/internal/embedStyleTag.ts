import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Tag, Text } from "../../parser/MarkoNode";
import { doc } from "prettier";
import { printClosingTag, printOpeningTag } from "../../printer/tag/tag";
import { AstPath } from "prettier";
import { isEmptyNode } from "../../printer/tag/utils";

const {
  builders: { group, indent, hardline },
} = doc;

export function embedStyleTag(
  node: Tag,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc, print, path, options) => {
    if (isEmptyNode(node)) {
      // We have no children, so print the script tag on a single line if possible.
      return group([
        ...printOpeningTag(path as AstPath<Tag>, options, print),
        ">",
        printClosingTag(path, options, print),
      ]);
    }
    const textChild = node.body?.[0]!;
    if (textChild.type !== "Text") {
      // The style tag can only have Text has children,
      throw Error("Body of script tag is not Text " + textChild.type);
    }
    let content;
    try {
      content = await textToDoc((textChild as Text).value, {
        parser: "css",
      });
    } catch (error) {
      // There was probably an unrecoverable syntax error, print as-is.
      content = (textChild as Text).value.trim();
    }

    return [
      group([...printOpeningTag(path as AstPath<Tag>, options, print), ">"]),
      indent([hardline, content]),
      hardline,
      printClosingTag(path, options, print),
    ];
  };
}

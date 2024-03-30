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
  node: Tag
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

    return [
      group([...printOpeningTag(path as AstPath<Tag>, options, print), ">"]),
      indent([
        hardline,
        await textToDoc((textChild as Text).value, {
          parser: "css",
        }),
      ]),
      hardline,
      printClosingTag(path, options, print),
    ];
  };
}

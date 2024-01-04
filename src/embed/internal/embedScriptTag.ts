import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Tag, Text } from "../../parser/MarkoNode";
import _doc from "prettier/doc";
import { printClosingTag, printOpeningTag } from "../../printer/tag/tag";
import { AstPath } from "prettier";

const {
  builders: { group, indent, hardline },
} = _doc;

export function embedScriptTag(
  node: Tag
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc, print, path, options) => {
    const textChild = node.body?.[0];
    const attrGroupId = Symbol("attrGroupId");

    if (!textChild) {
      // We have no children, so print the script tag on a single line if possible.
      return [
        group(printOpeningTag(path as AstPath<Tag>, options, print), {
          id: attrGroupId,
        }),
        printClosingTag(path, options, print),
        hardline,
      ];
    }

    if (textChild.type !== "Text") {
      // The script tag can only have Text has children,
      throw Error("Body of script tag is not Text " + textChild.type);
    }

    return group([
      group(printOpeningTag(path as AstPath<Tag>, options, print), {
        id: attrGroupId,
      }),
      indent([
        hardline,
        await textToDoc((textChild as Text).value, {
          parser: "babel-ts",
        }),
      ]),
      hardline,
      printClosingTag(path, options, print),
      hardline,
    ]);
  };
}

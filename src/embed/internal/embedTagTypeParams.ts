import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagParams, TagTypeParams } from "../../parser/MarkoNode";
import { doc } from "prettier";

const { join, line, group, ifBreak, indent, softline } = doc.builders;

export function embedTagTypeParams(
  node: TagTypeParams
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;
  return async (textToDoc, print, path, options) => {
    try {
      // We need to wrap the args in a fake function call so that babel-ts can
      // parse it. We also disable semicolons because we don't want to print
      // any semicolons because Marko doesn't use them in tag params.
      let docs = await textToDoc(`function _<${params}>(){}`, {
        parser: "babel-ts",
      });

      // @ts-expect-error - docs is always an array.
      docs = docs[1].contents;

      return docs;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}

import { Doc } from "prettier";
import { AttrSpread } from "../../parser/MarkoNode";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { forceIntoExpression } from "../forceIntoExpression";

export function embedAttrSpread(
  node: AttrSpread
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc, print, path, options) => {
    try {
    const doc = await textToDoc(forceIntoExpression(node.valueLiteral), {
      parser: "htmljsExpressionParser",
    });
    return ["...", doc];
} catch (e) {
    console.log(e)
    throw e
}
  };
}

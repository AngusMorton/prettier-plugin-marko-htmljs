import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagParams } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";
import { removeParentheses } from "../util";

export function embedTagParams(
  node: TagParams
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;
  return async (textToDoc, print, path, options) => {
    try {
      let formattedParams = await textToDoc(forceIntoExpression(params), {
        parser: "htmljsExpressionParser",
      });

      return ["|", removeParentheses(formattedParams), "|"];
    } catch (e) {
      console.log("Error printing TagParams", e);
      throw e;
    }
  };
}

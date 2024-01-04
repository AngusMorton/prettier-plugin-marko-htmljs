import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagArgs } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";
import { removeParentheses } from "../util";

export function embedTagArgs(
  node: TagArgs
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const value = node.valueLiteral;
  return async (textToDoc, print, path, options) => {
    const formattedParams = await textToDoc(forceIntoExpression(value), {
      parser: "htmljsExpressionParser",
    });

    return ["(", removeParentheses(formattedParams), ")"];
  };
}

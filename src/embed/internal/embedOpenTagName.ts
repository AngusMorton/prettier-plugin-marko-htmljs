import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { OpenTagName } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";

export function embedOpenTagName(
  node: OpenTagName
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc) => {
    const docs = await Promise.all(
      node.expressions.map((expression) =>
        textToDoc(forceIntoExpression(expression.valueLiteral), {
          parser: "htmljsExpressionParser",
        })
      )
    );

    return docs;
  };
}

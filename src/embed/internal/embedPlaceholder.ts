import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Placeholder } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";
import { tryPrint } from "../util";

export function embedPlaceholder(
  node: Placeholder,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc) => {
    return tryPrint({
      async print() {
        const body = await textToDoc(forceIntoExpression(node.valueLiteral), {
          parser: "marko-htmljs-expression-parser",
        });
        return ["$", node.escape ? "" : "!", "{", body, "}"];
      },
      fallback() {
        return ["$", node.escape ? "" : "!", "{", node.valueLiteral, "}"];
      },
    });
  };
}

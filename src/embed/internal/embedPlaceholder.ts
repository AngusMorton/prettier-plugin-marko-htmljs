import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Placeholder } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";

export function embedPlaceholder(
  node: Placeholder,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc) => {
    try {
      const body = await textToDoc(forceIntoExpression(node.valueLiteral), {
        parser: "marko-htmljs-expression-parser",
      });
      return ["$", node.escape ? "" : "!", "{", body, "}"];
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return ["$", node.escape ? "" : "!", "{", node.valueLiteral, "}"];
    }
  };
}

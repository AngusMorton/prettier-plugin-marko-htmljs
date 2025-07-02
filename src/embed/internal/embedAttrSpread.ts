import { AttrSpread } from "../../parser/MarkoNode";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { forceIntoExpression } from "../forceIntoExpression";

export function embedAttrSpread(
  node: AttrSpread,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc) => {
    try {
      const doc = await textToDoc(forceIntoExpression(node.valueLiteral), {
        parser: "marko-htmljs-expression-parser",
      });
      return ["...", doc];
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return ["...", node.valueLiteral];
    }
  };
}

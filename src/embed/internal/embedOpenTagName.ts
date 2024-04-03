import { Doc } from "prettier";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { OpenTagName } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";

export function embedOpenTagName(
  node: OpenTagName,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc) => {
    const code = `\`${node.valueLiteral}\``;
    try {
      const docs = (await textToDoc(forceIntoExpression(code), {
        parser: "marko-htmljs-expression-parser",
      })) as Doc[];
      docs.shift();
      docs[0] = (docs[0] as string).slice(1);
      docs[docs.length - 1] = (docs[docs.length - 1] as string).slice(0, -1);
      return docs;
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return node.valueLiteral;
    }
  };
}

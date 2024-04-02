import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Import } from "../../parser/MarkoNode";

export function embedImport(
  node: Import,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const statement = node.valueLiteral;
  return async (textToDoc) => {
    try {
      const doc = await textToDoc(statement, {
        parser: "babel-ts",
      });

      return doc;
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return [node.valueLiteral];
    }
  };
}

import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Export } from "../../parser/MarkoNode";

export function embedExport(
  node: Export,
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

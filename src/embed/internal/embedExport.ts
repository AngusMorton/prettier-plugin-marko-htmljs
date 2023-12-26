import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Export } from "../../parser/MarkoNode";

export function embedExport(
  node: Export
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const statement = node.valueLiteral;
  return async (textToDoc) => {
    const doc = await textToDoc(statement, {
      parser: "babel-ts",
    });

    return doc;
  };
}

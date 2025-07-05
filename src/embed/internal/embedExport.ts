import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Export } from "../../parser/MarkoNode";
import { tryPrint } from "../util";

export function embedExport(
  node: Export,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const statement = node.valueLiteral;
  return async (textToDoc) => {
    return tryPrint({
      async print() {
        const doc = await textToDoc(statement, {
          parser: "babel-ts",
        });

        return doc;
      },
      fallback() {
        return [node.valueLiteral];
      },
    });
  };
}

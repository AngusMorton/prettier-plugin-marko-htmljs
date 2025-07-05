import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagTypeArgs } from "../../parser/MarkoNode";
import { tryPrint } from "../util";

export function embedTagTypeArgs(
  node: TagTypeArgs,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;
  return async (textToDoc) => {
    return tryPrint({
      async print() {
        // We need to wrap the args in a fake function call so that babel-ts can
        // parse it. We also disable semicolons because we don't want to print
        // any semicolons because Marko doesn't use them in tag params.
        let docs = await textToDoc(`function _<${params}>(){}`, {
          parser: "babel-ts",
        });

        // @ts-expect-error - docs is always an array.
        docs = docs[1].contents;

        return docs;
      },
      fallback() {
        return ["<", node.valueLiteral, ">"];
      },
    });
  };
}

import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagArgs } from "../../parser/MarkoNode";

export function embedTagArgs(
  node: TagArgs,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const value = node.valueLiteral;
  return async (textToDoc, print, path, options) => {
    try {
      // We need to wrap the args in a fake function call so that babel-ts can
      // parse it. We also disable semicolons because we don't want to print
      // any semicolons because Marko doesn't use them in tag params.
      let docs = await textToDoc(`_(${value});`, {
        parser: "babel-ts",
      });

      // @ts-expect-error - docs is always an array.
      docs = docs[1];
      return docs;
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return ["(", node.valueLiteral, ")"];
    }
  };
}

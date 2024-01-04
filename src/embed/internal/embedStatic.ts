import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Static } from "../../parser/MarkoNode";

export function embedStatic(
  node: Static
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  // "static" at the root level is not valid JS, so we need to remove it and add it back later.
  const statement = node.valueLiteral.replace(/static/, "");
  return async (textToDoc) => {
    const doc = await textToDoc(statement, {
      parser: "babel-ts",
    });

    return ["static ", doc];
  };
}

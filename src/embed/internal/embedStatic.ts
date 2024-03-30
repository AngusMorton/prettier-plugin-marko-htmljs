import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Static } from "../../parser/MarkoNode";
import { doc } from "prettier";
import { endsWithBrace } from "../util";

const {
  builders: { group, indent, hardline, softline, ifBreak },
} = doc;

export function embedStatic(
  node: Static
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  // "static" at the root level is not valid JS, so we need to remove it and add it back later.
  const statement = node.valueLiteral.replace(/static/, "");
  return async (textToDoc) => {
    const body = await textToDoc(statement, {
      parser: "babel-ts",
    });

    if (!endsWithBrace(body)) {
      return group([
        "static ",
        ifBreak("{"),
        indent([softline, body]),
        softline,
        ifBreak("}"),
      ]);
    }

    return ["static ", body];
  };
}

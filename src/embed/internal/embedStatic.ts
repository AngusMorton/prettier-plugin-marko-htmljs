import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Static } from "../../parser/MarkoNode";
import { doc } from "prettier";
import { endsWithBrace, tryPrint } from "../util";

const {
  builders: { group, indent, softline, ifBreak },
} = doc;

export function embedStatic(
  node: Static,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const statementKindMatch = node.valueLiteral.match(/(static|client|server)/);
  if (!statementKindMatch) {
    throw new Error("Expected 'static', 'client', or 'server' in static node");
  }

  const statementPrefix = statementKindMatch[0] + " ";

  // "static" at the root level is not valid JS, so we need to remove it and add it back later.
  const statement = node.valueLiteral.replace(/static|client|server/, "");
  return async (textToDoc) => {
    return tryPrint({
      async print() {
        const body = await textToDoc(statement, {
          parser: "babel-ts",
        });

        if (!endsWithBrace(body)) {
          return group([
            statementPrefix,
            ifBreak("{"),
            indent([softline, body]),
            softline,
            ifBreak("}"),
          ]);
        }

        return [statementPrefix, body];
      },
      fallback() {
        return [statementPrefix, node.valueLiteral];
      },
    });
  };
}

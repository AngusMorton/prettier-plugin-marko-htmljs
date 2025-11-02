import { AstPath } from "prettier";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Scriptlet } from "../../parser/MarkoNode";
import {
  endsWithBrace,
  endsWithBracket,
  endsWithParenthesis,
  tryPrint,
} from "../util";
import { Doc, doc } from "prettier";
import { getOriginalSource } from "../../util/prettierIgnore";

const {
  builders: { group, indent, softline, ifBreak },
} = doc;

export function embedScriptlet(
  path: AstPath<Scriptlet>,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;
  if (!node) {
    return null;
  }

  return async (textToDoc, _print, _, opts) => {
    return tryPrint({
      async print() {
        const body = await textToDoc(node.valueLiteral, { parser: "babel-ts" });

        if (
          node.block ||
          (!endsWithBrace(body) &&
            !endsWithParenthesis(body) &&
            !endsWithBracket(body))
        ) {
          // The following scriptlet needs to have the statement wrapped
          // in braces, otherwise the html-js parser will fail to parse it.
          //
          // $ const isWebpSupported = $global.request.headers
          //     .get("accept")
          //     ?.includes("image/webp");
          //
          // Ideally, we would wrap the rhs of the assignment in braces, but we don't have the full
          // AST here, so we can't do that. Instead, we wrap the entire scriptlet in braces.
          return group([
            "$ ",
            ifBreak("{"),
            indent([softline, body]),
            softline,
            ifBreak("}"),
          ]);
        } else {
          return ["$ ", body];
        }
      },
      fallback() {
        return getOriginalSource(node, opts.originalText as string);
      },
    });
  };
}

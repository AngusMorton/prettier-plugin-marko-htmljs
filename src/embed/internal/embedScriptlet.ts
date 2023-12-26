import { AstPath, Options } from "prettier";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Scriptlet } from "../../parser/MarkoNode";
import { endsWithBrace } from "../util";
import _doc from "prettier/doc";
import { parsers } from "prettier/plugins/babel.js";

const {
  builders: { group, indent, hardline, softline, ifBreak, join },
} = _doc;

export function embedScriptlet(
  path: AstPath<Scriptlet>,
  options: Options,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node
  if (!node) {
    return null
  } 

  return async (textToDoc) => {
    const body = await textToDoc(node.valueLiteral, { parser: "babel-ts" });

    if (node.jsAst.length > 1 || node.block || !endsWithBrace(body)) {
      // The following scriptlet needs to be a block scriptlet OR have the assignment wrapped
      // in braces, otherwise the html-js parser will fail to parse it.
      //
      // $ const isWebpSupported = $global.request.headers
      //     .get("accept")
      //     ?.includes("image/webp");
      //
      // Ideally, we would wrap the rhs of the assignment in braces, but we don't have the full
      // AST here, so we can't do that. Instead, we wrap the entire scriptlet in braces.
      return [
        group([
          "$ ",
          ifBreak("{"),
          indent([softline, body]),
          softline,
          ifBreak("}"),
        ]),
        hardline,
      ];
    }

    return ["$ ", body, hardline];
  };
}

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
  builders: { group, indent, softline, ifBreak, join, hardline },
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
        if (!node.ast) {
          return getOriginalSource(node, opts.originalText as string);
        }

        const result: Doc[] = [];
        const statements = [...node.ast.program.body];

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];

          if (statement.type === "EmptyStatement") {
            // Don't render empty statements.
            continue;
          }

          if (statement.type === "BlockStatement") {
            statements.push(...statement.body);
            continue;
          }

          // Extract and output leading comments as formatted JS comments
          if (statement.leadingComments) {
            for (const comment of statement.leadingComments) {
              const commentCode = node.valueLiteral
                .slice(comment.start!, comment.end!)
                .trim();
              const formattedComment = await textToDoc(commentCode, {
                parser: "babel-ts",
              });
              result.push(formattedComment);
            }
          }

          const code = node.valueLiteral
            .slice(statement.start!, statement.end!)
            .trim();
          const body = await textToDoc(code, {
            parser: "babel-ts",
          });

          if (
            // If the body ends in a brace, parenthesis, or bracket, we can print it inline
            // because the Marko parser will be able to follow the expression.
            !endsWithBrace(body) &&
            !endsWithParenthesis(body) &&
            !endsWithBracket(body)
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
            result.push(
              group([
                "$ ",
                ifBreak("{"),
                indent([softline, body]),
                softline,
                ifBreak("}"),
              ]),
            );
          } else {
            result.push(["$ ", body]);
          }

          if (i === statements.length - 1 && statement.trailingComments) {
            // Only output trailing comments for the last statement because
            // otherwise they will be duplicated when processing leading comments.
            for (const comment of statement.trailingComments) {
              const commentCode = node.valueLiteral
                .slice(comment.start!, comment.end!)
                .trim();
              const formattedComment = await textToDoc(commentCode, {
                parser: "babel-ts",
              });
              result.push(formattedComment);
            }
          }
        }

        return join(hardline, result);
      },
      fallback() {
        return getOriginalSource(node, opts.originalText as string);
      },
    });
  };
}

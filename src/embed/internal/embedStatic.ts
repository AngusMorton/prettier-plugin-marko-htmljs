import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Static } from "../../parser/MarkoNode";
import { Doc, doc } from "prettier";
import {
  endsWithBrace,
  endsWithBracket,
  endsWithParenthesis,
  tryPrint,
} from "../util";
import { getOriginalSource } from "../../util/prettierIgnore";

const {
  builders: { group, indent, softline, join, hardline, ifBreak },
} = doc;

export function embedStatic(
  node: Static,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  return async (textToDoc, _print, _, opts) => {
    return tryPrint({
      async print() {
        if (!node.ast) {
          return getOriginalSource(node, opts.originalText as string);
        }

        const result: Doc[] = [];
        const statements = [...node.ast!.program.body];
        for (const statement of statements) {
          if (statement.type === "BlockStatement") {
            statements.push(...statement.body);
            continue;
          }

          // If the statement is allowed as a top-level statement, we can print it without a name.
          const allowedShorthandStatements =
            node.name === "static" &&
            (statement.type === "ImportDeclaration" ||
              statement.type === "ExportNamedDeclaration" ||
              statement.type === "ExportAllDeclaration" ||
              statement.type === "ExportDefaultDeclaration");

          const code = node.valueLiteral
            .slice(statement.start!, statement.end!)
            .trim();
          const body = await textToDoc(code, {
            parser: "babel-ts",
          });

          if (
            !allowedShorthandStatements &&
            // If the body ends in a brace, parenthesis, or bracket, we can print it inline
            // because the Marko parser will be able to follow the expression.
            !endsWithBrace(body) &&
            !endsWithParenthesis(body) &&
            !endsWithBracket(body)
          ) {
            result.push([
              group([
                `${node.name} `,
                ifBreak("{"),
                indent([softline, body]),
                softline,
                ifBreak("}"),
              ]),
            ]);
          } else {
            // If the body ends in a brace,
            result.push([
              allowedShorthandStatements ? "" : `${node.name} `,
              body,
            ]);
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

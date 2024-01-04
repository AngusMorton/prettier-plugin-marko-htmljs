import { AstPath, Options } from "prettier";
import { AnyNode, Tag, Text } from "../parser/MarkoNode";
import { HtmlJsPrinter } from "../HtmlJsPrinter";
import _doc from "prettier/doc";
import { printClosingTag, printOpeningTag } from "../printer/tag/tag";
import { endsWithBrace } from "./endsWithBrace";
import { isStringDoc } from "./isStringDoc";
import { needsParenthesis } from "./needsParenthesis";
import { forceIntoExpression } from "./forceIntoExpression";
import { removeParentheses, trimLeft } from "./util";

const {
  builders: { join, group, indent, hardline, softline, breakParent, ifBreak },
  utils: { stripTrailingHardline },
} = _doc;

export function embed(
  path: AstPath<AnyNode>,
  options: Options
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;

  if (node.type === "Scriptlet") {
    return async (textToDoc) => {
      const body = await textToDoc(node.valueLiteral, { parser: "babel-ts" });

      if (node.block || !endsWithBrace(body)) {
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

  if (node.type === "Placeholder") {
    return async (textToDoc) => {
      const body = await textToDoc(forceIntoExpression(node.valueLiteral), {
        parser: "htmljsExpressionParser",
      });
      return ["${", body, "}"];
    };
  }

  if (node.type === "Class") {
    // Mutate the class so that it's a valid class so that babel-ts can parse it.
    const mutatedClassBody = node.valueLiteral.replace(
      /class\s/,
      "class __PLACEHOLDER__"
    );
    return async (textToDoc) => {
      const body = await textToDoc(mutatedClassBody, {
        parser: "babel-ts",
      });

      // The first doc in the array is the class name with the placeholder.
      // It will look something like "class __PLACEHOLDER__ {" which we need
      // to transform back to "class {".
      if (Array.isArray(body)) {
        const classNameDoc = body[0];
        if (typeof classNameDoc === "string") {
          body[0] = classNameDoc.replace(/__PLACEHOLDER__\s/, "");
        }
      }

      return [body, hardline];
    };
  }

  if (node.type === "Tag" && node.nameText && node.nameText === "script") {
    return async (textToDoc, print, path, options) => {
      const textChild = node.body?.[0];
      const attrGroupId = Symbol("attrGroupId");

      if (!textChild) {
        // We have no children, so print the script tag on a single line if possible.
        return [
          group(printOpeningTag(path as AstPath<Tag>, options, print), {
            id: attrGroupId,
          }),
          printClosingTag(path, options, print),
          hardline,
        ];
      }

      if (textChild.type !== "Text") {
        // The script tag can only have Text has children,
        throw Error("Body of script tag is not Text " + textChild.type);
      }

      return group([
        group(printOpeningTag(path as AstPath<Tag>, options, print), {
          id: attrGroupId,
        }),
        indent([
          hardline,
          await textToDoc((textChild as Text).value, {
            parser: "babel-ts",
          }),
        ]),
        hardline,
        printClosingTag(path, options, print),
        hardline,
      ]);
    };
  }

  if (node.type === "Tag" && node.nameText && node.nameText === "style") {
    return async (textToDoc, print, path, options) => {
      const textChild = node.body?.[0];
      const attrGroupId = Symbol("attrGroupId");

      if (!textChild) {
        // We have no children, so print the script tag on a single line if possible.
        return [
          group(printOpeningTag(path as AstPath<Tag>, options, print), {
            id: attrGroupId,
          }),
          printClosingTag(path, options, print),
          hardline,
        ];
      }

      if (textChild.type !== "Text") {
        // The script tag can only have Text has children,
        throw Error("Body of script tag is not Text " + textChild.type);
      }

      return group([
        group(printOpeningTag(path as AstPath<Tag>, options, print), {
          id: attrGroupId,
        }),
        indent([
          hardline,
          await textToDoc((textChild as Text).value, {
            parser: "css",
          }),
        ]),
        hardline,
        printClosingTag(path, options, print),
        hardline,
      ]);
    };
  }

  if (node.type === "AttrNamed") {
    const name = node.name.value;
    if (node.value) {
      switch (node.value.type) {
        case "AttrValue":
          const value = node.value.valueLiteral;
          return async (textToDoc, print, path, options) => {
            let formattedValue = await textToDoc(forceIntoExpression(value), {
              parser: "htmljsExpressionParser",
            });

            // formattedValue = removeLeadingSemicolon(formattedValue);
            // Simple string docs don't need parenthesis because we don't break them even
            // though they exceed the line length.
            const docNeedsParenthesis =
              needsParenthesis(formattedValue) && !isStringDoc(formattedValue);

            return group([
              name,
              "=",
              docNeedsParenthesis ? ifBreak(["("]) : "",
              docNeedsParenthesis
                ? indent([softline, formattedValue])
                : formattedValue,
              docNeedsParenthesis ? ifBreak([softline, ")"]) : "",
            ]);
          };
        case "AttrMethod":
          console.log("AttrMethod");
          console.log(node);
        default:
          return [];
      }
    } else if (node.args) {
      const args = node.args.valueLiteral;
      return async (textToDoc, print, path, options) => {
        let formattedArgs = await textToDoc(forceIntoExpression(args), {
          parser: "htmljsExpressionParser",
        });
        return [name, "(", removeParentheses(formattedArgs), ")"];
      };
    } else {
      // Boolean attributes don't have a value, just print them name only.
      return name;
      // console.log(node);
      // throw Error("AttrNamed has no value");
    }
  }

  if (node.type === "TagParams") {
    const params = node.valueLiteral.trim();
    return async (textToDoc, print, path, options) => {
      try {
        let formattedParams = await textToDoc(forceIntoExpression(params), {
          parser: "htmljsExpressionParser",
        });

        return ["|", removeParentheses(formattedParams), "|"];
      } catch (e) {
        console.log("Error printing TagParams", e);
        throw e;
      }
    };
  }

  if (node.type === "TagArgs") {
    const value = node.valueLiteral;
    return async (textToDoc, print, path, options) => {
      const formattedParams = await textToDoc(forceIntoExpression(value), {
        parser: "htmljsExpressionParser",
      });

      return ["(", removeParentheses(formattedParams), ")"];
    };
  }

  if (node.type === "Import") {
    const statement = node.valueLiteral;
    return async (textToDoc, print, path, options) => {
      const doc = await textToDoc(statement, {
        parser: "babel-ts",
      });

      return doc;
    };
  }

  if (node.type === "Export") {
    const statement = node.valueLiteral;
    return async (textToDoc, print, path, options) => {
      const doc = await textToDoc(statement, {
        parser: "babel-ts",
      });

      return doc;
    };
  }

  if (node.type === "Static") {
    const statement = node.valueLiteral.replace(/static/, "");
    return async (textToDoc, print, path, options) => {
      const doc = await textToDoc(statement, {
        parser: "babel-ts",
      });

      return ["static ", doc];
    };
  }

  if (node.type === "OpenTagName") {
    return async (textToDoc, print, path, options) => {
      const docs = await Promise.all(
        node.expressions.map((expression) =>
          textToDoc(forceIntoExpression(expression.valueLiteral), {
            parser: "htmljsExpressionParser",
          })
        )
      );

      return docs;
    };
  }

  return null;
}

import { Doc } from "prettier";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { AttrNamed } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";
import { needsParenthesis } from "../needsParenthesis";
import { doc } from "prettier";

const {
  builders: { group, indent, ifBreak, softline },
} = doc;

export function emebdAttrNamed(
  node: AttrNamed
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const name = node.name.value;
  const isDefaultAttribute = !name;

  if (node.value) {
    switch (node.value.type) {
      case "AttrValue":
        const value = node.value.valueLiteral;
        return async (textToDoc) => {
          try {
            // Remove parentheses and whitespace because we're going to add our own and we don't want to double up.
            const valueWithNoParentheses = value.replace(
              /^\s*\(\s*(.*?)\s*\)\s*$/,
              "$1"
            );
            let formattedValue = await textToDoc(
              forceIntoExpression(valueWithNoParentheses),
              {
                parser: "marko-htmljs-expression-parser",
              }
            );
            // formattedValue = removeLeadingSemicolon(formattedValue);
            // Simple string docs don't need parenthesis because we don't break them even
            // though they exceed the line length.
            const docNeedsParenthesis = needsParenthesis(formattedValue);

            return group([
              name,
              "=",
              group([
                docNeedsParenthesis ? "(" : "",
                docNeedsParenthesis
                  ? indent([softline, formattedValue])
                  : formattedValue,
                docNeedsParenthesis ? [softline, ")"] : "",
              ]),
            ]);
          } catch (e) {
            console.error(e);
            throw e;
          }
        };
      case "AttrMethod":
        const methodValue = node.value;
        return async (textToDoc) => {
          try {
            const templateName = !name ? "_" : name;
            const template = `function ${templateName}${methodValue.paramsLiteral}${methodValue.bodyLiteral}`;
            const doc = await textToDoc(template, { parser: "babel-ts" });

            (doc as Doc[]).shift();
            const result = [isDefaultAttribute ? "" : name, doc];
            return result;
          } catch (e) {
            console.error(e);
            throw e;
          }
        };
    }
  } else if (node.args) {
    const args = node.args.valueLiteral;
    return async (textToDoc, print, path, options) => {
      try {
        // We need to wrap the args in a fake function call so that babel-ts can
        // parse it. We also disable semicolons because we don't want to print
        // any semicolons because Marko doesn't use them in tag params.
        let docs = await textToDoc(`_(${args})`, {
          parser: "babel-ts",
          semi: false,
        });

        if (Array.isArray(docs)) {
          // Remove the function name "_" from the fake function call.
          docs.shift();
        }

        return [name, docs];
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
  } else {
    // Boolean attributes don't have a value, just print them name only.
    return name;
  }
}

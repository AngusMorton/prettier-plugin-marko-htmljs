import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { AttrNamed } from "../../parser/MarkoNode";
import { forceIntoExpression } from "../forceIntoExpression";
import { needsParenthesis } from "../needsParenthesis";
import { isStringDoc, removeParentheses } from "../util";
import _doc from "prettier/doc";

const {
  builders: { group, indent, ifBreak, softline },
} = _doc;

export function emebdAttrNamed(
  node: AttrNamed
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const name = node.name.value;

  if (node.value) {
    switch (node.value.type) {
      case "AttrValue":
        const value = node.value.valueLiteral;
        return async (textToDoc) => {
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
  }
}

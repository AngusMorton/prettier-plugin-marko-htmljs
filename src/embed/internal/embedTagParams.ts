import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagParams } from "../../parser/MarkoNode";
import { doc } from "prettier";

const {
  builders: { group, softline },
  utils: { mapDoc },
} = doc;

export function embedTagParams(
  node: TagParams,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;

  if (params.trim() === "") {
    return "||";
  }

  return async (textToDoc, print, path, options) => {
    try {
      let doc = await textToDoc(`function _(${params}){}`, {
        parser: "babel-ts",
      });

      let removedFirstParenthesis = false;
      let removedLastParenthesis = false;

      // Remove the placeholder parts of the document so we only
      // print the argument list.
      doc = mapDoc(doc, (current) => {
        if (typeof current === "string") {
          const trimmed = current.trim();
          if (trimmed === "function _" || trimmed === "{}") {
            return "";
          }
          if (trimmed.startsWith("(") && !removedFirstParenthesis) {
            current = current.trimStart().slice(1);
            removedFirstParenthesis = true;
          } else if (trimmed.endsWith(")") && !removedLastParenthesis) {
            current = current.trimEnd().slice(0, -1);
            removedLastParenthesis = true;
          }
        }

        return current;
      });

      return group(["|", doc, "|"]);
    } catch (e) {
      console.error("Error printing TagParams", e);
      console.error(node);
      throw e;
    }
  };
}

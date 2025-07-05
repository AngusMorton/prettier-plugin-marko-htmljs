import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { doc } from "prettier";
import { tryPrint } from "../util";

const {
  builders: { group },
  utils: { mapDoc },
} = doc;

export function embedTagParams(node: {
  valueLiteral: string;
}): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;

  if (params.trim() === "") {
    return "||";
  }

  return async (textToDoc) => {
    return tryPrint({
      async print() {
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
      },
      fallback() {
        return ["|", node.valueLiteral, "|"];
      },
    });
  };
}

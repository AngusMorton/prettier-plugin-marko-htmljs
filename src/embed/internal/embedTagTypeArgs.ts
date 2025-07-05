import { builders } from "prettier/doc.js";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagTypeArgs } from "../../parser/MarkoNode";
import { tryPrint } from "../util";
import { Doc } from "prettier";

export function embedTagTypeArgs(
  node: TagTypeArgs,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;
  return async (textToDoc) => {
    return tryPrint({
      async print() {
        // We need to wrap the args in a fake function call so that babel-ts can
        // parse it. We also disable semicolons because we don't want to print
        // any semicolons because Marko doesn't use them in tag params.
        const docs = await textToDoc(`_<${params}>()`, {
          parser: "babel-ts",
        });

        if (Array.isArray(docs)) {
          if (docs.length === 1 && typeof docs[0] === "string") {
            const type = docs[0].slice(1, -3); // Remove the leading "_" and trailing "();".
            return type;
          }

          // @ts-expect-error it's always a group.
          const typeDoc: builders.Group = docs[1];
          // @ts-expect-error it's always an array of docs.
          const typeDocContents: builders.Doc[] = typeDoc.contents;

          if (typeDocContents[0] !== "<") {
            typeDocContents.unshift("<"); // Add the opening "<" to the start.
            typeDocContents.push(">"); // Add the closing ">" to the end.
          }

          return typeDoc;
        }

        throw new Error(
          "Expected textToDoc to return an array of docs, but got: " + docs,
        );
      },
      fallback() {
        return ["<", node.valueLiteral, ">"];
      },
    });
  };
}

import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagParams } from "../../parser/MarkoNode";
import _doc from "prettier/doc";

const { join, line, group, ifBreak, indent, softline } = _doc.builders;

export function embedTagParams(
  node: TagParams
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const params = node.valueLiteral;
  return async (textToDoc, print, path, options) => {
    try {
      let declarations = params
        .trim()
        .split(",")
        .filter((it) => it.trim().length > 0);

      let declarationDocs = await Promise.all(
        declarations.map((it) =>
          textToDoc(`var ${it}=_;`, {
            parser: "babel-ts",
            semi: false,
          })
        )
      );

      // The resulting doc structure is consistent with the babel-ts parser, so
      // we can reach in and pull the variable declaration out and "remove" the
      // `var ` part.
      declarationDocs = declarationDocs.map((doc) => {
        // @ts-expect-error - doc is always an array.
        return doc[0].contents[1];
      });

      for (let doc of declarationDocs) {
        // The doc is always a group, so we need to walk down to the contents.
        // @ts-expect-error - the type of doc is always a group, don't bother
        const contents = doc.contents;
        for (let i = contents.length; i--; ) {
          const item = contents[i];
          if (typeof item === "string") {
            // Walks back until we find the equals sign.
            const match = /\s*=\s*$/.exec(item);
            if (match) {
              contents[i] = item.slice(0, -match[0].length);
              contents.length = i + 1;
              break;
            }
          }
        }
      }

      return group([
        "|",
        indent([
          ifBreak(line),
          join([",", line], declarationDocs),
          ifBreak([options.trailingComma === "all" ? "," : ""]),
        ]),
        softline,
        "|",
      ]);
    } catch (e) {
      console.log("Error printing TagParams", e);
      throw e;
    }
  };
}

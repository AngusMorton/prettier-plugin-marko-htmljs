import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Style } from "../../parser/MarkoNode";
import { doc } from "prettier";
import { AstPath, Options } from "prettier";

const {
  builders: { group, indent, hardline },
} = doc;

export function embedStaticStyle(
  path: AstPath<Style>,
  options: Options,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;
  if (!node) {
    return null;
  }

  const trimmed = node.valueLiteral
    .trim()
    .replace(/^style\s*\{/, "")
    .replace(/\}$/, "");

  return async (textToDoc, print, path, options) => {
    try {
      // Format the collected code and then replace any placeholders
      // with the printed docs so they are formatted correctly.
      // This ensures that things like placeholders format correctly.
      const content = await textToDoc(trimmed, {
        parser: "css",
      });

      return group([
        "style {",
        indent([hardline, content]),
        hardline,
        "}",
        hardline,
      ]);
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return group([
        "style {",
        indent([hardline, trimmed]),
        hardline,
        "}",
        hardline,
      ]);
    }
  };
}

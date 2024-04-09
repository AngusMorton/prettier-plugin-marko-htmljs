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

  const trimmedValueLiteral = node.valueLiteral.trim();

  const trimmed = trimmedValueLiteral
    .replace(/^style(\.?[^\s]+)*\s*\{/, "")
    .replace(/\}$/, "");

  const styleParser = node.ext?.slice(1) ?? "css";

  return async (textToDoc, print, path, options) => {
    try {
      // Format the collected code and then replace any placeholders
      // with the printed docs so they are formatted correctly.
      // This ensures that things like placeholders format correctly.
      let content;
      try {
        content = await textToDoc(trimmed, {
          parser: styleParser,
        });
      } catch (error) {
        // There was probably an unrecoverable syntax error, print as-is.
        content = trimmed.trim();
      }

      return group([
        ["style", styleParser === "css" ? "" : `.${styleParser}`, " {"],
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
        ["style", styleParser === "css" ? "" : `.${styleParser}`, " {"],
        indent([hardline, trimmed]),
        hardline,
        "}",
        hardline,
      ]);
    }
  };
}

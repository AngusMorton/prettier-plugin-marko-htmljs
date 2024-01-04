import { AstPath, Doc, Options, doc } from "prettier";
import { Comment } from "../../parser/MarkoNode";
import { PrintFn } from "../tag/utils";
const { join, hardline, softline } = doc.builders;

export function printComment(
  // Path to the current comment node
  commentPath: AstPath<Comment>,
  // Current options
  options: Options,
  print: PrintFn
): Doc {
  const commentText = commentPath.node.valueLiteral;

  if (commentText.startsWith("<!--")) {
    // Convert HTML comment to JS comment.
    if (commentText.includes("\n")) {
      // It's a block comment, so convert it to a JS block comment.
      const lines = commentText
        .trim()
        .slice(4, -3)
        .split(/\r?\n/g)
        .filter((it) => it.trim() !== "");
      return [
        "/**",
        hardline,
        join(
          hardline,
          lines.map((line: string, index: number) => {
            return " * " + line.trim();
          })
        ),
        hardline,
        " */",
      ];
    } else {
      // It's a single line comment, so convert it to a JS single line comment.
      return ["//", commentText.slice(4, -3)];
    }
  } else if (commentText.startsWith("/*")) {
    const lines = commentText.split(/\r?\n/g);
    if (lines.length === 1) {
      /* Inline, block comments don't need a hardline afterwards */
      return [commentPath.node.valueLiteral];
    }

    if (
      lines
        .slice(1, lines.length - 1)
        .every((line: string) => line.trim()[0] === "*")
    ) {
      // If the block comment has a * at the beginning of every line, then we can format it.
      // Otherwise, we just return the original comment because we can't be sure how it should be formatted.
      return [
        join(
          hardline,
          lines.map(
            (line: string, index: number) =>
              (index > 0 ? " " : "") +
              (index < lines.length - 1 ? line.trim() : line.trimStart())
          )
        ),
      ];
    }
  }
  return [commentPath.node.valueLiteral];
}

import { Comment } from "../parser/MarkoNode";

// Checks if a comment node contains a prettier-ignore directive.
// Supports HTML, line, and block comment formats.
export function isPrettierIgnoreComment(comment: Comment): boolean {
  const content = comment.valueLiteral.trim();

  // Handle HTML comments
  if (content.startsWith("<!--") && content.endsWith("-->")) {
    const innerContent = content.slice(4, -3).trim();
    return innerContent.toLowerCase() === "prettier-ignore";
  }

  // Handle line comments
  if (content.startsWith("//")) {
    const innerContent = content.slice(2).trim();
    return innerContent.toLowerCase() === "prettier-ignore";
  }

  // Handle block comments
  if (content.startsWith("/*") && content.endsWith("*/")) {
    const innerContent = content.slice(2, -2).trim();
    return innerContent.toLowerCase() === "prettier-ignore";
  }

  return false;
}

// Extracts the original source text for a node from the given source code.
export function getOriginalSource(
  node: { start: number; end: number },
  sourceCode: string,
): string {
  return sourceCode.slice(node.start, node.end);
}

// Re-indents preserved content to match the current indentation context.
// This maintains the relative indentation of the original content while
// adjusting the base indentation to the current level.
export function reindentPreservedContent(
  originalContent: string,
  currentIndent: string,
): string {
  const lines = originalContent.split("\n");

  if (lines.length === 1) {
    // Single line content - no indentation needed
    return originalContent;
  }

  // Find the minimum indentation (excluding empty lines)
  let minIndent = Infinity;
  const nonEmptyLines = lines.slice(1).filter((line) => line.trim().length > 0);

  for (const line of nonEmptyLines) {
    const match = line.match(/^(\s*)/);
    if (match) {
      minIndent = Math.min(minIndent, match[1].length);
    }
  }

  // If no indentation found or infinite, use 0
  if (minIndent === Infinity) {
    minIndent = 0;
  }

  // Re-indent all lines
  const reindentedLines = lines.map((line, index) => {
    if (index === 0) {
      // First line keeps its original position
      return line;
    }

    if (line.trim().length === 0) {
      // Empty lines stay empty
      return "";
    }

    // Remove the common indentation and add the current indent
    const originalIndent = line.match(/^(\s*)/)?.[1] || "";
    const contentAfterIndent = line.slice(
      Math.min(originalIndent.length, minIndent),
    );
    const relativeIndent = originalIndent.slice(minIndent);

    return currentIndent + relativeIndent + contentAfterIndent;
  });

  return reindentedLines.join("\n");
}

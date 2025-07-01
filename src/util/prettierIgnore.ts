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

// Result of finding an ignored node after a prettier-ignore comment
export interface IgnoreResult {
  // Index of the node that should be ignored
  ignoredNodeIndex: number;
  // Index where the preserved content starts (may include whitespace before the ignored node)
  preserveFromIndex?: number;
}

// Finds the next non-comment node that should be ignored after a prettier-ignore comment
export function findIgnoredNode(
  nodes: Array<{ type: string }>,
  ignoreCommentIndex: number,
  options: {
    // For children: preserve whitespace before the ignored node
    preserveWhitespace?: boolean;
  } = {},
): IgnoreResult | null {
  const { preserveWhitespace = false } = options;

  // Find the next non-comment node to ignore
  for (let i = ignoreCommentIndex + 1; i < nodes.length; i++) {
    const candidate = nodes[i];

    if (candidate.type !== "Comment") {
      if (preserveWhitespace) {
        // For children: check if there's whitespace before the actual content
        let preserveFromIndex = i;

        // If this is whitespace-only text, check if there's content after it
        if (candidate.type === "Text" && isEmptyTextNode(candidate)) {
          // Check if there's a non-whitespace node after it
          if (i + 1 < nodes.length && nodes[i + 1].type !== "Comment") {
            // The whitespace is followed by actual content, preserve both
            return {
              ignoredNodeIndex: i + 1,
              preserveFromIndex: i,
            };
          }
          continue;
        }

        return {
          ignoredNodeIndex: i,
          preserveFromIndex,
        };
      } else {
        // For program: just return the node index
        return {
          ignoredNodeIndex: i,
        };
      }
    }
  }

  return null;
}

// Helper function to check if a text node is empty/whitespace-only
// This is used by findIgnoredNode when preserveWhitespace is true
function isEmptyTextNode(node: { type: string; value?: string }): boolean {
  return node.type === "Text" && (!node.value || node.value.trim() === "");
}

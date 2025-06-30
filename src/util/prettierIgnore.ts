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
export function getOriginalSource(node: { start: number; end: number }, sourceCode: string): string {
  return sourceCode.slice(node.start, node.end);
}

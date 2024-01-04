import { Doc } from "prettier";

export function endsWithBrace(doc: Doc): boolean {
  if (typeof doc === "string") {
    return doc[doc.length - 1] === "}";
  }

  if (!Array.isArray(doc)) {
    switch (doc.type) {
      case "align":
      case "break-parent":
      case "cursor":
      case "fill":
      case "if-break":
      case "indent":
      case "indent-if-break":
      case "label":
      case "line":
      case "line-suffix":
      case "line-suffix-boundary":
      case "trim":
        return false;
      case "group":
        return endsWithBrace(doc.contents);
    }
  }

  for (let i = doc.length - 1; i >= 0; i--) {
    if (endsWithBrace(doc[i])) {
      return true;
    }
  }

  return false;
}

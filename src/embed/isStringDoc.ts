import { Doc } from "prettier";

export function isStringDoc(doc: Doc): boolean {
  if (typeof doc === "string") {
    return true;
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
        // The group might be a group of a single string element.
        return isStringDoc(doc.contents);
    }
  }

  return doc.length === 1 && isStringDoc(doc[0]);
}

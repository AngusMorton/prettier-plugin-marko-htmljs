import { Doc } from "prettier";
import { HtmlJsPrinter } from "../HtmlJsPrinter";
import { tryCatch } from "../util/tryCatch";

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

export function endsWithBracket(doc: Doc): boolean {
  if (typeof doc === "string") {
    return doc[doc.length - 1] === "]";
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
        return endsWithBracket(doc.contents);
    }
  }

  for (let i = doc.length - 1; i >= 0; i--) {
    if (endsWithBracket(doc[i])) {
      return true;
    }
  }

  return false;
}

export function endsWithBang(doc: Doc): boolean {
  if (typeof doc === "string") {
    return doc[doc.length - 1] === "!";
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
        return endsWithBracket(doc.contents);
    }
  }

  for (let i = doc.length - 1; i >= 0; i--) {
    if (endsWithBracket(doc[i])) {
      return true;
    }
  }

  return false;
}

export function endsWithParenthesis(doc: Doc): boolean {
  if (typeof doc === "string") {
    return doc[doc.length - 1] === ")";
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
        return endsWithParenthesis(doc.contents);
    }
  }

  for (let i = doc.length - 1; i >= 0; i--) {
    if (endsWithParenthesis(doc[i])) {
      return true;
    }
  }

  return false;
}

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

export async function tryPrint({
  print,
  fallback,
}: {
  print: () => Promise<Doc>;
  fallback: () => Doc;
}): Promise<Doc> {
  const result = await tryCatch(print());
  if (result.error) {
    if (process.env.PRETTIER_DEBUG) {
      throw result.error;
    }

    console.error(result.error);
    return fallback();
  }
  return result.data;
}

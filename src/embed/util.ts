import { Doc, doc } from "prettier";

export function trim(docs: Doc[], isWhitespace: (doc: Doc) => boolean): Doc[] {
  trimLeft(docs, isWhitespace);
  trimRight(docs, isWhitespace);

  return docs;
}

/**
 * Trims the leading nodes matching `isWhitespace` independent of nesting level (though all nodes need to be a the same level).
 * If there are empty docs before the first whitespace, they are removed, too.
 */
export function trimLeft(
  group: Doc[],
  isWhitespace: (doc: Doc) => boolean
): void {
  let firstNonWhitespace = group.findIndex(
    (doc) => !isEmptyDoc(doc) && !isWhitespace(doc)
  );

  if (firstNonWhitespace < 0 && group.length) {
    firstNonWhitespace = group.length;
  }

  if (firstNonWhitespace > 0) {
    const removed = group.splice(0, firstNonWhitespace);
    if (removed.every(isEmptyDoc)) {
      return trimLeft(group, isWhitespace);
    }
  } else {
    const parts = getParts(group[0]);

    if (parts) {
      return trimLeft(parts, isWhitespace);
    }
  }
}

/**
 * Trims the trailing nodes matching `isWhitespace` independent of nesting level (though all nodes need to be a the same level).
 * If there are empty docs after the last whitespace, they are removed, too.
 */
export function trimRight(
  group: Doc[],
  isWhitespace: (doc: Doc) => boolean
): void {
  let lastNonWhitespace = group.length
    ? findLastIndex((doc) => !isEmptyDoc(doc) && !isWhitespace(doc), group)
    : 0;

  if (lastNonWhitespace < group.length - 1) {
    const removed = group.splice(lastNonWhitespace + 1);
    if (removed.every(isEmptyDoc)) {
      return trimRight(group, isWhitespace);
    }
  } else {
    const parts = getParts(group[group.length - 1]);

    if (parts) {
      return trimRight(parts, isWhitespace);
    }
  }
}

function findLastIndex<T>(
  isMatch: (item: T, idx: number) => boolean,
  items: T[]
) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (isMatch(items[i], i)) {
      return i;
    }
  }

  return -1;
}

function getParts(doc: Doc): Doc[] | undefined {
  if (typeof doc === "object") {
    if (Array.isArray(doc)) {
      return doc;
    }
    if (doc.type === "fill") {
      return doc.parts;
    }
    if (doc.type === "group") {
      return getParts(doc.contents);
    }
  }
}

/**
 * Check if the doc is empty, i.e. consists of nothing more than empty strings (possibly nested).
 */
export function isEmptyDoc(doc: Doc): boolean {
  if (typeof doc === "string") {
    return doc.length === 0;
  }

  if (isDocCommand(doc) && doc.type === "line") {
    // @ts-expect-error
    return !doc.keepIfLonely;
  }

  if (Array.isArray(doc)) {
    return doc.length === 0;
  }

  const { contents } = doc as { contents?: Doc };

  if (contents) {
    return isEmptyDoc(contents);
  }

  const { parts } = doc as { parts?: Doc[] };

  if (parts) {
    return isEmptyGroup(parts);
  }

  return false;
}

function isDocCommand(doc: Doc): doc is doc.builders.DocCommand {
  return typeof doc === "object" && doc !== null;
}

export function isEmptyGroup(group: Doc[]): boolean {
  return !group.find((doc) => !isEmptyDoc(doc));
}

/**
 * `(foo = bar)` => `foo = bar`
 */
export function removeParentheses(doc: Doc): Doc {
  return trim([doc], (_doc: Doc) => _doc === "(" || _doc === ")")[0];
}

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

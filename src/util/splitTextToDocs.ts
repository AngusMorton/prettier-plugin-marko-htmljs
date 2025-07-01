import type { Doc } from "prettier";
import { doc } from "prettier";

const {
  builders: { hardline, join, line },
} = doc;

export function splitTextToDocs(text: string): Doc[] {
  const lines = text.split(/[\t\n\f\r ]+/);

  let docs = join(line, lines).filter((doc: Doc) => doc !== "");
  if (startsWithLinebreak(text)) {
    docs[0] = hardline;
  }
  if (startsWithLinebreak(text, 2)) {
    docs = [hardline, ...docs];
  }

  if (endsWithLinebreak(text)) {
    docs[docs.length - 1] = hardline;
  }
  if (endsWithLinebreak(text, 2)) {
    docs = [...docs, hardline];
  }
  return docs;
}

export function startsWithLinebreak(text: string, nrLines = 1): boolean {
  return new RegExp(`^([\\t\\f\\r ]*\\n){${nrLines}}`).test(text);
}

export function endsWithLinebreak(text: string, nrLines = 1): boolean {
  return new RegExp(`(\\n[\\t\\f\\r ]*){${nrLines}}$`).test(text);
}

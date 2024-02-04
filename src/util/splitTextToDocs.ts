import { Doc, doc } from "prettier";

const {
  builders: { join, line },
} = doc;

export function splitTextToDocs(text: string): Doc[] {
  const lines = text.split(/[\t\n\f\r ]+/);

  let docs = join(line, lines).filter((doc) => doc !== "");
  return docs;
}

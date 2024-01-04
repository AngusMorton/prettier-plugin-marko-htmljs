import { Doc } from "prettier";
import { endsWithBrace, endsWithBracket } from "./utils";

export function needsParenthesis(doc: Doc): boolean {
  if (endsWithBrace(doc)) {
    return false;
  }

  if (endsWithBracket(doc)) {
    return false;
  }

  return true;
}

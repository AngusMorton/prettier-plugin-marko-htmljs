import { Doc } from "prettier";
import { endsWithBrace } from "./endsWithBrace";
import { endsWithBracket } from "./endsWithBracket";

export function needsParenthesis(doc: Doc): boolean {
  if (endsWithBrace(doc)) {
    return false;
  }

  if (endsWithBracket(doc)) {
    return false;
  }

  return true;
}

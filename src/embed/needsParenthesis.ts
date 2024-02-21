import { Doc } from "prettier";
import {
  endsWithBang,
  endsWithBrace,
  endsWithBracket,
  endsWithParenthesis,
  isStringDoc,
} from "./util";

export function needsParenthesis(doc: Doc): boolean {
  if (endsWithParenthesis(doc)) {
    return false;
  }

  if (endsWithBrace(doc)) {
    return false;
  }

  if (endsWithBracket(doc)) {
    return false;
  }

  if (endsWithBang(doc)) {
    // htmljs throws an error for this:
    // <div data-testid=maybe!>
    //                       ^
    return true;
  }

  // Our heuristic is pretty naive, but if the doc is a single string, then we assume it doesn't need parenthesis.
  // While if it's multiple docs, it probably does... This is probably overly cautious and will result in unnecessary
  // parenthesis, but I don't fully understand when parenthesis are required or not.
  return !isStringDoc(doc);
}

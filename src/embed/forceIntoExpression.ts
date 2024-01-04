export function forceIntoExpression(statement: string) {
  // note the trailing newline: if the statement ends in a // comment,
  // we can't add the closing bracket right afterwards
  return `(${statement}\n)`;
}

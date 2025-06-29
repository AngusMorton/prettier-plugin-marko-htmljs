import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Export } from "../../parser/MarkoNode";

export function embedExport(
  node: Export,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const statement = node.valueLiteral;
  
  // Check if this is an export type with a long generic parameter list
  // that would break across lines when formatted by TypeScript formatter
  const typeGenericMatch = statement.match(/export\s+type\s+\w+\s*<([^>]+)>/);
  const hasLongGenericList = typeGenericMatch && typeGenericMatch[1].length > 40;
  
  return async (textToDoc) => {
    try {
      if (hasLongGenericList) {
        // For export type statements with long generics, return the original text 
        // to avoid Prettier breaking the generics across lines which would break Marko parsing
        return statement;
      }
      
      const doc = await textToDoc(statement, {
        parser: "babel-ts",
      });

      return doc;
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }

      console.error(error);
      return [node.valueLiteral];
    }
  };
}

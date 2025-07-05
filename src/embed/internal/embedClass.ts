import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { Class } from "../../parser/MarkoNode";
import { tryPrint } from "../util";

export function embedClass(
  node: Class,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  // Mutate the class so that it's a valid class so that babel-ts can parse it.
  const mutatedClassBody = node.valueLiteral.replace(
    /class\s/,
    "class __PLACEHOLDER__",
  );
  return async (textToDoc) => {
    return tryPrint({
      async print() {
        const body = await textToDoc(mutatedClassBody, {
          parser: "babel-ts",
        });

        // The first doc in the array is the class name with the placeholder.
        // It will look something like "class __PLACEHOLDER__ {" which we need
        // to transform back to "class {".
        if (Array.isArray(body)) {
          const classNameDoc = body[0];
          if (typeof classNameDoc === "string") {
            body[0] = classNameDoc.replace(/__PLACEHOLDER__\s/, "");
          }
        }

        return body;
      },
      fallback() {
        return [node.valueLiteral];
      },
    });
  };
}

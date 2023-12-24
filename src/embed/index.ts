import { AstPath, Options } from "prettier";
import { AnyNode } from "../parser/MarkoNode";
import { HtmlJsPrinter } from "../HtmlJsPrinter";
import _doc from "prettier/doc";

const {
  builders: { dedent, group, indent, hardline },
} = _doc;

export function embed(
  path: AstPath<AnyNode>,
  options: Options
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;

  if (node.type === "Scriptlet") {
    return async (textToDoc) => {
      const body = await textToDoc(node.valueLiteral, { parser: "babel-ts" });

      if (node.block) {
        return [
          hardline,
          group(["$ {", indent([hardline, body]), dedent([hardline, "}"])]),
          hardline,
        ];
      } else {
        return ["$ ", body, hardline];
      }
    };
  }

  if (node.type === "Placeholder") {
    return async (textToDoc) => {
      const body = await textToDoc(node.valueLiteral, {
        parser: "babel-ts",
        semi: false,
      });
      return ["${", body, "}"];
    };
  }

  if (node.type === "Class") {
    // Mutate the class so that it's a valid class so that babel-ts can parse it.
    const mutatedClassBody = node.valueLiteral.replace(
      /class\s/,
      "class __PLACEHOLDER__"
    );
    return async (textToDoc) => {
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

      return [body, hardline];
    };
  }

  return null;
}

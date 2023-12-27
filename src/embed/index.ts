import { AstPath, Options } from "prettier";
import { AnyNode, Tag, Text } from "../parser/MarkoNode";
import { HtmlJsPrinter } from "../HtmlJsPrinter";
import _doc from "prettier/doc";
import { printClosingTag, printOpeningTag } from "../printer/tag/tag";

const {
  builders: { dedent, group, indent, hardline, breakParent },
  utils: { stripTrailingHardline },
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

  if (node.type === "Tag" && node.nameText && node.nameText === "script") {
    return async (textToDoc, print, path, options) => {
      const textChild = node.body?.[0];
      const attrGroupId = Symbol("attrGroupId");

      if (!textChild) {
        // We have no children, so print the script tag on a single line if possible.
        return [
          group(printOpeningTag(path as AstPath<Tag>, options, print), {
            id: attrGroupId,
          }),
          printClosingTag(path, options, print),
          hardline,
        ];
      }

      if (textChild.type !== "Text") {
        // The script tag can only have Text has children,
        throw Error("Body of script tag is not Text " + textChild.type);
      }

      return group([
        group(printOpeningTag(path as AstPath<Tag>, options, print), {
          id: attrGroupId,
        }),
        indent([
          hardline,
          await textToDoc((textChild as Text).value, {
            parser: "babel-ts",
          }),
        ]),
        hardline,
        printClosingTag(path, options, print),
        hardline,
      ]);
    };
  }

  if (node.type === "Tag" && node.nameText && node.nameText === "style") {
    return async (textToDoc, print, path, options) => {
      const textChild = node.body?.[0];
      const attrGroupId = Symbol("attrGroupId");

      if (!textChild) {
        // We have no children, so print the script tag on a single line if possible.
        return [
          group(printOpeningTag(path as AstPath<Tag>, options, print), {
            id: attrGroupId,
          }),
          printClosingTag(path, options, print),
          hardline,
        ];
      }

      if (textChild.type !== "Text") {
        // The script tag can only have Text has children,
        throw Error("Body of script tag is not Text " + textChild.type);
      }

      return group([
        group(printOpeningTag(path as AstPath<Tag>, options, print), {
          id: attrGroupId,
        }),
        indent([
          hardline,
          await textToDoc((textChild as Text).value, {
            parser: "css",
          }),
        ]),
        hardline,
        printClosingTag(path, options, print),
        hardline,
      ]);
    };
  }

  return null;
}

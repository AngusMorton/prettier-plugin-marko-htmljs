import { AstPath, Doc, Options } from "prettier";
import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { TagVar } from "../../parser/MarkoNode";

export function embedTagVariable(
  path: AstPath<TagVar>,
  options: Options
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;
  if (!node) {
    return "";
  }

  const variableName = node.valueLiteral;
  // @ts-ignore
  const attrs = node.parent.attrs && node.parent.attrs[0];
  const assignmentValue =
    attrs &&
    attrs.type === "AttrNamed" &&
    attrs.name.value === "" &&
    attrs.value?.valueLiteral
      ? attrs.value?.valueLiteral
      : "";

  if (assignmentValue) {
    // @ts-ignore
    node.parent.attrs = node.parent.attrs?.slice(1);
  }

  return async (textToDoc, print, path, options) => {
    try {
      // We need to wrap the args in a fake function call so that babel-ts can
      // parse it. We also disable semicolons because we don't want to print
      // any semicolons because Marko doesn't use them in tag params.
      let docs = await textToDoc(`var ${variableName}=_`, {
        parser: "babel-ts",
      });

      // @ts-ignore
      const contents = (docs as Doc[])[0].contents[1].contents;
      for (let i = contents.length; i--; ) {
        const item = contents[i];
        if (typeof item === "string") {
          // Walks back until we find the equals sign.
          const match = /\s*=\s*$/.exec(item);
          if (match) {
            contents[i] = item.slice(0, -match[0].length);
            contents.length = i + 1;
            break;
          }
        }
      }

      if (!assignmentValue) {
        return ["/", contents];
      }

      let valueDoc = await textToDoc(assignmentValue, {
        parser: "htmljsExpressionParser",
      });
      return ["/", contents, "=", valueDoc];
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}

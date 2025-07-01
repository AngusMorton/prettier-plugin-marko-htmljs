import { HtmlJsPrinter } from "../../HtmlJsPrinter";
import { AnyNode, Tag } from "../../parser/MarkoNode";
import { doc } from "prettier";
import {
  printAttrs,
  printClosingTag,
  printOpeningTag,
} from "../../printer/tag/tag";
import type { AstPath, Doc } from "prettier";
import { isEmptyNode } from "../../printer/tag/utils";

const {
  builders: { group, indent, hardline, dedent, softline },
  utils: { mapDoc },
} = doc;

export function embedScriptTag(
  path: AstPath<Tag>,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;
  if (!node) {
    return null;
  }

  return async (textToDoc, print, path, options) => {
    try {
      if (isEmptyNode(node)) {
        // We have no children, so print the script tag on a single line if possible.
        return [
          group([
            ...printOpeningTag(path as AstPath<Tag>, options, print),
            indent(
              group([
                ...printAttrs(path, options, print),
                !options.bracketSameLine ? dedent(softline) : "",
              ]),
            ),
            ">",
            options.bracketSameLine ? softline : "",
          ]),
          printClosingTag(path),
        ];
      }

      // Collect the full text of the script tag, which may be split up into multiple
      // nodes if it includes placeholders/etc.
      let embeddedCode = "";
      let placeholderId = 0;
      const placeholders: Doc[] = [];
      path.each((childPath) => {
        const childNode = childPath.node as AnyNode;
        if (childNode.type === "Text") {
          embeddedCode += childNode.value;
        } else {
          embeddedCode += `__EMBEDDED_PLACEHOLDER_${placeholderId++}__`;
          placeholders.push(print(childPath));
        }
      }, "body");

      // Format the collected code and then replace any placeholders
      // with the printed docs so they are formatted correctly.
      // This ensures that things like placeholders format correctly.
      let replacedContent: Doc;
      try {
        const content = await textToDoc(embeddedCode, {
          parser: "babel-ts",
        });
        replacedContent = replaceEmbeddedPlaceholders(content, placeholders);
      } catch {
        if (!node.body) {
          replacedContent = "";
        } else {
          // There was probably a syntax error in the embedded code, so just print
          // the tag as-is.
          replacedContent = (options.originalText as string)
            .slice(node.body[0].start, node.body[node.body.length - 1].end)
            .trim();
        }
      }

      return group([
        group([
          ...printOpeningTag(path as AstPath<Tag>, options, print),
          indent(
            group([
              ...printAttrs(path, options, print),
              !options.bracketSameLine ? dedent(softline) : "",
            ]),
          ),
          ">",
        ]),
        indent([hardline, replacedContent]),
        hardline,
        printClosingTag(path),
      ]);
    } catch (error) {
      // TODO: Fallback to a manually printed script tag if we can't parse the content.
      console.error(error);
      throw error;
    }
  };
}

const embeddedPlaceholderReg = /__EMBEDDED_PLACEHOLDER_(\d+)__/g;
function replaceEmbeddedPlaceholders(doc: Doc, placeholders: Doc[]) {
  if (!placeholders.length) return doc;

  return mapDoc(doc, (cur) => {
    if (typeof cur === "string") {
      let match = embeddedPlaceholderReg.exec(cur);

      if (match) {
        const replacementDocs = [] as Doc[];
        let index = 0;

        do {
          const placeholderIndex = +match[1];

          if (index !== match.index) {
            replacementDocs.push(cur.slice(index, match.index));
          }

          replacementDocs.push(placeholders[placeholderIndex]);
          index = match.index + match[0].length;
        } while ((match = embeddedPlaceholderReg.exec(cur)));

        if (index !== cur.length) {
          replacementDocs.push(cur.slice(index));
        }

        if (replacementDocs.length === 1) {
          return replacementDocs[0];
        }

        return replacementDocs;
      }
    }

    return cur;
  });
}

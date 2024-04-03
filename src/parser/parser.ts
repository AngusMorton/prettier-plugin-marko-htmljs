import { type Range, type Ranges, TagType, createParser } from "htmljs-parser";
import type {
  AnyNode,
  AttrName,
  AttrNamed,
  AttrNode,
  ControlFlowTag,
  Comment,
  ChildNode,
  Text,
  OpenTagName,
  ParentTag,
  Program,
  Repeatable,
  ShorthandClassName,
  StaticNode,
  Tag,
  ParentNode,
  HasChildren,
  AttrValue,
} from "./MarkoNode";

const styleBlockReg = /((?:\.[^\s\\/:*?"<>|({]+)*)\s*\{/y;

export const UNFINISHED = Number.MAX_SAFE_INTEGER;

export {
  getLines,
  getPosition,
  getLocation,
  type Ranges,
  type Position,
  type Location,
} from "htmljs-parser";

export type Parsed = ReturnType<typeof parse>;

export function parse(code: string) {
  const builder = new Builder(code);
  const parser = createParser(builder);
  builder.prepare(parser);

  parser.parse(code);
  const program = builder.end();

  return program;
}

type ParserHandlers = Parameters<typeof createParser>[0];
type MarkoParser = ReturnType<typeof createParser>;

class Builder implements ParserHandlers {
  #code: string;
  #program: Program;
  #openTagStart: Range | undefined;
  #parentNode: ParentNode;
  #staticNode: StaticNode | undefined;
  #attrNode: AttrNamed | undefined;
  #comments: Repeatable<Comment>;
  // @ts-expect-error
  #parser: MarkoParser;

  constructor(code: string) {
    this.#code = code;
    this.#program = {
      type: "Program",
      comments: undefined,
      parent: undefined,
      static: [],
      body: [],
      start: 0,
      end: this.#code.length,
    };
    this.#parentNode = this.#program;
  }

  prepare(parser: MarkoParser) {
    this.#parser = parser;
  }

  end() {
    this.#program.comments = this.#comments;
    return this.#program;
  }

  onText(range: Range) {
    pushBody(this.#parentNode, {
      type: "Text",
      parent: this.#parentNode,
      start: range.start,
      end: range.end,
      value: this.#code.slice(range.start, range.end),
      sourceSpan: this.#parser.locationAt(range),
    } satisfies Text);
  }
  onCDATA(range: Ranges.Value) {
    pushBody(this.#parentNode, {
      type: "CDATA",
      parent: this.#parentNode,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      value: range.value,
      start: range.start,
      end: range.end,
      sourceSpan: this.#parser.locationAt(range),
    });
  }
  onDoctype(range: Ranges.Value) {
    pushBody(this.#parentNode, {
      type: "DocType",
      parent: this.#parentNode,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      value: range.value,
      start: range.start,
      end: range.end,
      sourceSpan: this.#parser.locationAt(range),
    });
  }
  onDeclaration(range: Ranges.Value) {
    pushBody(this.#parentNode, {
      type: "Declaration",
      parent: this.#parentNode,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      value: range.value,
      start: range.start,
      end: range.end,
      sourceSpan: this.#parser.locationAt(range),
    });
  }
  onComment(range: Ranges.Value) {
    const comment: Comment = {
      type: "Comment",
      parent: this.#parentNode,
      value: range.value,
      valueLiteral: this.#code.slice(range.start, range.end),
      start: range.start,
      end: range.end,
      leading: false,
      // Comments are trailing by default, but are made leading if they are the found before
      // another node.
      trailing: true,
      printed: false,
      sourceSpan: this.#parser.locationAt(range),
    };
    // if (this.#comments) {
    //   this.#comments.push(comment);
    // } else {
    //   this.#comments = [comment];
    // }
    pushBody(this.#parentNode, comment);
  }
  onPlaceholder(range: Ranges.Placeholder) {
    pushBody(this.#parentNode, {
      type: "Placeholder",
      parent: this.#parentNode,
      comments: makeCommentsLeading(this.#comments),
      value: range.value,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      escape: range.escape,
      start: range.start,
      end: range.end,
      sourceSpan: this.#parser.locationAt(range),
    });

    this.#comments = undefined;
  }
  onScriptlet(range: Ranges.Scriptlet) {
    const bodyText = this.#parser.read(range.value);

    pushBody(this.#parentNode, {
      type: "Scriptlet",
      parent: this.#parentNode,
      comments: makeCommentsLeading(this.#comments),
      value: range.value,
      valueLiteral: bodyText,
      block: range.block,
      start: range.start,
      end: range.end,
      sourceSpan: this.#parser.locationAt(range),
    });
    this.#comments = undefined;
  }
  onOpenTagStart(range: Range) {
    this.#openTagStart = range;
  }
  onOpenTagName(range: Ranges.Template) {
    let concise = true;
    let start = range.start;
    let type = "Tag";
    let bodyType = TagType.html;
    let nameText: string | undefined = undefined;

    if (this.#openTagStart) {
      concise = false;
      start = this.#openTagStart.start;
      this.#openTagStart = undefined;
    }

    if (!range.expressions.length) {
      switch ((nameText = this.#code.slice(range.start, range.end))) {
        // All statement types will early return.
        case "style": {
          styleBlockReg.lastIndex = range.end;
          const styleBlockMatch = styleBlockReg.exec(this.#code);

          if (styleBlockMatch) {
            const [{ length }, ext] = styleBlockMatch;
            this.#program.static.push(
              (this.#staticNode = {
                type: "Style",
                parent: this.#program,
                comments: makeCommentsLeading(this.#comments),
                ext: ext || undefined,
                value: {
                  start: range.end + length,
                  end: UNFINISHED,
                },
                start: range.start,
                end: UNFINISHED,
                valueLiteral: "UNFINISHED",
                sourceSpan: {
                  start: this.#parser.positionAt(range.start),
                  end: {
                    character: UNFINISHED,
                    line: UNFINISHED,
                  },
                },
              }),
            );

            this.#comments = undefined;
            return TagType.statement;
          } else {
            bodyType = TagType.text;
            break;
          }
        }
        case "class":
          this.#program.static.push(
            (this.#staticNode = {
              type: "Class",
              parent: this.#program,
              comments: makeCommentsLeading(this.#comments),
              start: range.start,
              end: UNFINISHED,
              valueLiteral: "UNFINISHED",
              sourceSpan: {
                start: this.#parser.positionAt(range.start),
                end: {
                  character: UNFINISHED,
                  line: UNFINISHED,
                },
              },
            }),
          );

          this.#comments = undefined;
          return TagType.statement;
        case "export":
          this.#program.static.push(
            (this.#staticNode = {
              type: "Export",
              parent: this.#program,
              comments: makeCommentsLeading(this.#comments),
              start: range.start,
              end: UNFINISHED,
              valueLiteral: "UNFINISHED",
              sourceSpan: {
                start: this.#parser.positionAt(range.start),
                end: {
                  character: UNFINISHED,
                  line: UNFINISHED,
                },
              },
            }),
          );

          this.#comments = undefined;
          return TagType.statement;
        case "import":
          this.#program.static.push(
            (this.#staticNode = {
              type: "Import",
              parent: this.#program,
              comments: makeCommentsLeading(this.#comments),
              start: range.start,
              end: UNFINISHED,
              valueLiteral: "UNFINISHED",
              sourceSpan: {
                start: this.#parser.positionAt(range.start),
                end: {
                  character: UNFINISHED,
                  line: UNFINISHED,
                },
              },
            }),
          );

          this.#comments = undefined;
          return TagType.statement;
        case "static":
          this.#program.static.push(
            (this.#staticNode = {
              type: "Static",
              parent: this.#program,
              comments: makeCommentsLeading(this.#comments),
              start: range.start,
              end: UNFINISHED,
              valueLiteral: "UNFINISHED",
              sourceSpan: {
                start: this.#parser.positionAt(range.start),
                end: {
                  character: UNFINISHED,
                  line: UNFINISHED,
                },
              },
            }),
          );

          this.#comments = undefined;
          return TagType.statement;

        // The following are all still tags,
        // but with a different body type.
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "img":
        case "input":
        case "link":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
          bodyType = TagType.void;
          break;
        case "html-comment":
        case "script":
        case "textarea":
          bodyType = TagType.text;
          break;
        default:
          if (nameText[0] === "@") {
            type = "AttrTag";
          }
          break;
      }
    }
    const parent = this.#parentNode as ParentNode;
    const end = UNFINISHED;
    const name: OpenTagName = {
      type: "OpenTagName",
      parent: undefined as unknown as Tag,
      quasis: range.quasis,
      expressions: range.expressions.map((it) => ({
        ...it,
        valueLiteral: this.#code.slice(it.value.start, it.value.end),
      })),
      start: range.start,
      end: range.end,
      valueLiteral: this.#code.slice(range.start, range.end),
    };
    const tag =
      (this.#parentNode =
      name.parent =
        {
          type,
          parent,
          comments: makeCommentsLeading(this.#comments),
          owner: undefined,
          concise,
          selfClosed: false,
          hasAttrTags: false,
          open: { start, end },
          nameText,
          name,
          var: undefined,
          args: undefined,
          params: undefined,
          shorthandId: undefined,
          shorthandClassNames: undefined,
          typeArgs: undefined,
          typeParams: undefined,
          attrs: undefined,
          bodyType,
          body: undefined,
          close: undefined,
          start,
          end,
        } as ParentTag);

    this.#comments = undefined;

    if (tag.type === "AttrTag") {
      let parentTag = parent;
      let nameText = tag.nameText.slice(1);

      while (parentTag.type === "Tag" && isControlFlowTag(parentTag)) {
        parentTag.hasAttrTags = true;
        parentTag = parentTag.parent;
      }

      switch (parentTag.type) {
        case "AttrTag":
          tag.owner = parentTag.owner;
          parentTag.hasAttrTags = true;
          nameText = `@${nameText}`;
          break;
        case "Tag":
          tag.owner = parentTag;
          parentTag.hasAttrTags = true;
          nameText = `@${nameText}`;
          break;
      }

      tag.nameText = nameText;
    }
    pushBody(parent, tag);
    this.#openTagStart = undefined;
    return bodyType;
  }
  onTagShorthandId(range: Ranges.Template) {
    const parent = this.#parentNode as ParentTag;

    const attrNamed: AttrNamed = {
      type: "AttrNamed",
      parent,
      name: undefined as unknown as AttrName,
      value: undefined,
      args: undefined,
      start: range.start,
      end: range.end,
    };

    const name: AttrName = {
      type: "AttrName",
      parent: attrNamed,
      value: "id",
      start: range.start,
      end: range.end,
    };

    const value: AttrValue = {
      type: "AttrValue",
      parent: attrNamed,
      value: range,
      bound: false,
      // Wrap the value in backticks to make it a string literal that will be formatted correctly.
      valueLiteral: `\"${this.#code.slice(range.start + 1, range.end)}\"`,
      start: range.start,
      end: range.end,
    };

    attrNamed.name = name;
    attrNamed.value = value;

    pushAttr(parent, attrNamed);
  }
  onTagShorthandClass(range: Ranges.Template) {
    const parent = this.#parentNode as ParentTag;
    const shorthandClassName: ShorthandClassName = {
      type: "ShorthandClassName",
      parent,
      quasis: range.quasis,
      expressions: range.expressions,
      start: range.start,
      end: range.end,
      valueLiteral: this.#code.slice(range.start, range.end),
    };

    if (parent.shorthandClassNames) {
      parent.shorthandClassNames.push(shorthandClassName);
    } else {
      parent.shorthandClassNames = [shorthandClassName];
    }
  }
  onTagTypeArgs(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    parent.typeArgs = {
      type: "TagTypeArgs",
      parent,
      value: range.value,
      start: range.start,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      end: range.end,
    };
  }
  onTagTypeParams(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    parent.typeParams = {
      type: "TagTypeParams",
      parent,
      value: range.value,
      start: range.start,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      end: range.end,
    };
  }
  onTagVar(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    parent.var = {
      type: "TagVar",
      parent,
      value: range.value,
      start: range.start,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      end: range.end,
    };
  }
  onTagParams(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    parent.params = {
      type: "TagParams",
      parent,
      value: range.value,
      start: range.start,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      end: range.end,
    };
  }
  onTagArgs(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    parent.args = {
      type: "TagArgs",
      parent,
      value: range.value,
      start: range.start,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      end: range.end,
    };
  }
  onAttrName(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    const name: AttrName = {
      type: "AttrName",
      parent: undefined as unknown as AttrNamed,
      value: this.#code.slice(range.start, range.end),
      start: range.start,
      end: range.end,
    };

    pushAttr(
      parent,
      (this.#attrNode = name.parent =
        {
          type: "AttrNamed",
          parent,
          name,
          value: undefined,
          args: undefined,
          start: range.start,
          end: range.end,
        }),
    );
  }
  onAttrArgs(range: Ranges.Value) {
    const parent = this.#attrNode!;
    parent.args = {
      type: "AttrArgs",
      parent,
      value: range.value,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      start: range.start,
      end: range.end,
    };
    parent.end = range.end;
  }
  onAttrValue(range: Ranges.AttrValue) {
    const parent = this.#attrNode!;
    parent.value = {
      type: "AttrValue",
      parent,
      value: range.value,
      bound: range.bound,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      start: range.start,
      end: range.end,
    };
    parent.end = range.end;
  }
  onAttrMethod(range: Ranges.AttrMethod) {
    const parent = this.#attrNode!;
    parent.value = {
      type: "AttrMethod",
      parent,
      typeParams: range.typeParams,
      typeParamsLiteral: range.typeParams
        ? this.#code.slice(range.typeParams.start, range.typeParams.end)
        : undefined,
      params: range.params,
      paramsLiteral: this.#code.slice(range.params.start, range.params.end),
      body: range.body,
      bodyLiteral: this.#code.slice(range.body.start, range.body.end),
      start: range.start,
      end: range.end,
    };
    parent.end = range.end;
  }
  onAttrSpread(range: Ranges.Value) {
    const parent = this.#parentNode as ParentTag;
    pushAttr(parent, {
      type: "AttrSpread",
      parent,
      value: range.value,
      valueLiteral: this.#code.slice(range.value.start, range.value.end),
      start: range.start,
      end: range.end,
    });
  }
  onOpenTagEnd(range: Ranges.OpenTagEnd) {
    if (this.#staticNode) {
      if (this.#staticNode.type === "Style") {
        this.#staticNode.value.end = range.end - 1;
      }

      this.#staticNode.end = range.end;
      this.#staticNode.sourceSpan = this.#parser.locationAt({
        start: this.#staticNode.start,
        end: range.end,
      });
      this.#staticNode.valueLiteral = this.#code.slice(
        this.#staticNode.start,
        this.#staticNode.end,
      );
      this.#program.body.push(this.#staticNode);
      this.#staticNode = undefined;
    } else {
      this.#attrNode = undefined;
      const tag = this.#parentNode as ParentTag;
      tag.open.end = range.end;

      if (range.selfClosed || tag.bodyType === TagType.void) {
        this.#parentNode = tag.parent;
        tag.end = range.end;
        tag.selfClosed = range.selfClosed;
      }
      tag.sourceSpan = this.#parser.locationAt({
        start: tag.start,
        end: range.end,
      });
    }
  }
  onCloseTagStart(range: Range) {
    (this.#parentNode as ParentTag).close = {
      start: range.start,
      end: UNFINISHED,
    };
  }
  onCloseTagEnd(range: Range) {
    const parent = this.#parentNode as ParentTag;
    if (hasCloseTag(parent)) {
      parent.close.end = range.end;
    }
    parent.sourceSpan.end = this.#parser.positionAt(range.end);
    parent.end = range.end;
    this.#parentNode = parent.parent;
  }

  onError(data: Ranges.Error): void {
    const startPosition = this.#parser.positionAt(data.start);
    const endPosition = this.#parser.positionAt(data.end);

    const errorContextStart = startPosition.line - 2;
    const errorContextEnd = endPosition.line + 2;

    const errorContext = this.#code
      .split("\n")
      .slice(errorContextStart, errorContextEnd)
      .join("\n");

    const errorMessage = `Error ${data.code}: ${data.message}\n  at \n${errorContext}`;
    throw Error(errorMessage);
  }
}

function pushBody<T extends HasChildren | Program>(parent: T, node: ChildNode) {
  if (parent.body) {
    parent.body.push(node);
  } else {
    parent.body = [node];
  }
}

function pushAttr(parent: ParentTag, node: AttrNode) {
  if (parent.attrs) {
    parent.attrs.push(node);
  } else {
    parent.attrs = [node];
  }
}

function hasCloseTag(parent: AnyNode): parent is ParentTag & { close: Range } {
  return (parent as ParentTag).close !== undefined;
}

/**
 * Used to check if a node should be ignored as the parent of an attribute tag.
 * When control flow is the parent of an attribute tag, we add the attribute tag to
 * the closest non control flow ancestor attrs instead.
 */
function isControlFlowTag(node: Tag): node is ControlFlowTag {
  switch (node.nameText) {
    case "if":
    case "else":
    case "else-if":
    case "for":
    case "while":
      return true;
    default:
      return false;
  }
}

function makeCommentsLeading(
  comments: Repeatable<Comment>,
): Repeatable<Comment> {
  if (comments) {
    for (const comment of comments) {
      comment.leading = true;
      comment.trailing = false;
    }
  }

  return comments;
}

import { Statement } from "@babel/types";
import { Location, Range, Ranges, TagType } from "htmljs-parser";

export type Repeated<T> = [T, ...T[]] | [...T[], T] | [T, ...T[], T];
export type Repeatable<T> = undefined | Repeated<T>;

export type NodeType =
  | "Program"
  | "Tag"
  | "OpenTagName"
  | "ShorthandId"
  | "ShorthandClassName"
  | "TagTypeArgs"
  | "TagTypeParams"
  | "TagVar"
  | "TagArgs"
  | "TagParams"
  | "AttrNamed"
  | "AttrName"
  | "AttrArgs"
  | "AttrValue"
  | "AttrMethod"
  | "AttrSpread"
  | "AttrTag"
  | "Text"
  | "CDATA"
  | "Doctype"
  | "Declaration"
  | "Comment"
  | "Placeholder"
  | "Scriptlet"
  | "Import"
  | "Export"
  | "Class"
  | "Style"
  | "Static";

export type AnyNode =
  | Program
  | Tag
  | OpenTagName
  | ShorthandId
  | ShorthandClassName
  | TagTypeArgs
  | TagTypeParams
  | TagVar
  | TagArgs
  | TagParams
  | AttrNamed
  | AttrName
  | AttrArgs
  | AttrValue
  | AttrMethod
  | AttrSpread
  | AttrTag
  | Text
  | CDATA
  | Doctype
  | Declaration
  | Comment
  | Placeholder
  | Scriptlet
  | Import
  | Export
  | Class
  | Style
  | Static;
export type ParentNode = Program | Tag | AttrTag;
export type StaticNode = Import | Export | Class | Style | Static;
export type ParentTag = Tag | AttrTag;
export type AttrNode = AttrNamed | AttrSpread;
export type ControlFlowTag = Tag & {
  nameText: "if" | "else" | "else-if" | "for" | "while";
  bodyType: TagType.html;
};
export type ChildNode =
  | Tag
  | AttrTag
  | Text
  | Doctype
  | Declaration
  | CDATA
  | Placeholder
  | Scriptlet
  | Comment;

export interface HasChildren {
  body: ChildNode[] | undefined;
}

export interface Commentable {
  comments: Repeatable<Comment>;
}

export interface HasLocation {
  sourceSpan: Location;
}

export interface Program extends Range, Commentable {
  type: "Program";
  parent: undefined;
  static: StaticNode[];
  body: (ChildNode | StaticNode)[];
}

export interface Tag extends Range, Commentable, HasChildren, HasLocation {
  type: "Tag";
  parent: ParentNode;
  owner: undefined;
  concise: boolean;
  selfClosed: boolean;
  hasAttrTags: boolean;
  open: Range;
  close: Range | undefined;
  nameText: string | undefined;
  bodyType: Exclude<TagType, "statement">;
  name: OpenTagName;
  var: TagVar | undefined;
  args: TagArgs | undefined;
  params: TagParams | undefined;
  shorthandId: ShorthandId | undefined;
  shorthandClassNames: Repeatable<ShorthandClassName>;
  typeArgs: TagTypeArgs | undefined;
  typeParams: TagTypeParams | undefined;
  attrs: Repeatable<AttrNode>;
}

export interface AttrTag extends Range, Commentable, HasLocation {
  type: "AttrTag";
  parent: ParentTag;
  owner: ParentTag | undefined;
  concise: boolean;
  selfClosed: boolean;
  hasAttrTags: boolean;
  open: Range;
  close: Range | undefined;
  nameText: string;
  bodyType: TagType.html;
  name: OpenTagName;
  var: TagVar | undefined;
  args: TagArgs | undefined;
  params: TagParams | undefined;
  shorthandId: ShorthandId | undefined;
  shorthandClassNames: Repeatable<ShorthandClassName>;
  typeArgs: TagTypeArgs | undefined;
  typeParams: TagTypeParams | undefined;
  attrs: Repeatable<AttrNode>;
  body: Repeatable<ChildNode>;
}

export interface OpenTagName extends Ranges.Template {
  type: "OpenTagName";
  parent: ParentTag;
}

export interface ShorthandId extends Ranges.Template {
  type: "ShorthandId";
  parent: ParentTag;
}

export interface ShorthandClassName extends Ranges.Template {
  type: "ShorthandClassName";
  parent: ParentTag;
  valueLiteral: string;
}

export interface TagTypeArgs extends Ranges.Value {
  type: "TagTypeArgs";
  parent: ParentTag;
  valueLiteral: string;
}

export interface TagTypeParams extends Ranges.Value {
  type: "TagTypeParams";
  parent: ParentTag;
  valueLiteral: string;
}

export interface TagVar extends Ranges.Value {
  type: "TagVar";
  parent: ParentTag;
  valueLiteral: string;
}

export interface TagArgs extends Ranges.Value {
  type: "TagArgs";
  parent: ParentTag;
  valueLiteral: string;
}

export interface TagParams extends Ranges.Value {
  type: "TagParams";
  parent: ParentTag;
  valueLiteral: string;
}

export interface Text extends Range, HasLocation {
  type: "Text";
  parent: ParentNode;
  value: string;
}

export interface CDATA extends Ranges.Value, HasLocation {
  type: "CDATA";
  parent: ParentNode;
  valueLiteral: string;
}

export interface Doctype extends Ranges.Value, HasLocation {
  type: "DocType";
  parent: ParentNode;
  valueLiteral: string;
}

export interface Declaration extends Ranges.Value, HasLocation {
  type: "Declaration";
  parent: ParentNode;
  valueLiteral: string;
}

export interface Comment extends Ranges.Value, HasLocation {
  type: "Comment";
  parent: ParentNode;
  leading: boolean;
  trailing: boolean;
  printed: boolean;
  valueLiteral: string;
}

export interface Placeholder extends Ranges.Value, Commentable, HasLocation {
  type: "Placeholder";
  parent: ParentNode;
  escape: boolean;
  valueLiteral: string;
}

export interface Scriptlet extends Ranges.Value, Commentable, HasLocation {
  type: "Scriptlet";
  parent: ParentNode;
  block: boolean;
  valueLiteral: string;
}

export interface AttrNamed extends Range {
  type: "AttrNamed";
  parent: ParentTag;
  name: AttrName;
  args: undefined | AttrArgs;
  value: undefined | AttrValue | AttrMethod;
}

export interface AttrName extends Range {
  type: "AttrName";
  parent: AttrNamed;
  value: string;
}

export interface AttrArgs extends Ranges.Value {
  type: "AttrArgs";
  parent: AttrNamed;
  valueLiteral: string;
}

export interface AttrValue extends Range {
  type: "AttrValue";
  parent: AttrNamed;
  value: Range;
  valueLiteral: string;
  bound: boolean;
}

export interface AttrMethod extends Range {
  type: "AttrMethod";
  parent: AttrNamed;
  typeParams: undefined | Ranges.Value;
  typeParamsLiteral?: string;
  paramsLiteral: string;
  params: Range;
  body: Range;
  bodyLiteral: string;
}

export interface AttrSpread extends Ranges.Value {
  type: "AttrSpread";
  parent: ParentTag;
  valueLiteral: string;
}

export interface Import extends Range, Commentable, HasLocation {
  type: "Import";
  parent: ParentNode;
  valueLiteral: string;
}

export interface Export extends Range, Commentable, HasLocation {
  type: "Export";
  parent: ParentNode;
  valueLiteral: string;
}

export interface Class extends Range, Commentable, HasLocation {
  type: "Class";
  parent: ParentNode;
  valueLiteral: string;
}

export interface Style extends Range, Commentable, HasLocation {
  type: "Style";
  parent: ParentNode;
  ext: string | undefined;
  value: Range;
  valueLiteral: string;
}

export interface Static extends Range, Commentable, HasLocation {
  type: "Static";
  parent: ParentNode;
  valueLiteral: string;
}

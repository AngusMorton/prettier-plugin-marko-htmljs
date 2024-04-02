import { AstPath, Options } from "prettier";
import {
  AnyNode,
  AttrNamed,
  Scriptlet,
  Style,
  Tag,
  TagVar,
} from "../parser/MarkoNode";
import { HtmlJsPrinter } from "../HtmlJsPrinter";
import { embedScriptlet } from "./internal/embedScriptlet";
import { embedPlaceholder } from "./internal/embedPlaceholder";
import { embedClass } from "./internal/embedClass";
import { embedScriptTag } from "./internal/embedScriptTag";
import { embedStyleTag } from "./internal/embedStyleTag";
import { emebdAttrNamed } from "./internal/embedAttrNamed";
import { embedTagParams } from "./internal/embedTagParams";
import { embedTagArgs } from "./internal/embedTagArgs";
import { embedImport } from "./internal/embedImport";
import { embedExport } from "./internal/embedExport";
import { embedStatic } from "./internal/embedStatic";
import { embedOpenTagName } from "./internal/embedOpenTagName";
import { embedTagTypeParams } from "./internal/embedTagTypeParams";
import { embedTagTypeArgs } from "./internal/embedTagTypeArgs";
import { embedAttrSpread } from "./internal/embedAttrSpread";
import { embedStaticStyle } from "./internal/embedStaticStyle";
import { embedTagVariable } from "./internal/embedTagVariable";

export function embed(
  path: AstPath<AnyNode>,
  options: Options,
): ReturnType<NonNullable<HtmlJsPrinter["embed"]>> {
  const node = path.node;

  if (node.type === "Scriptlet") {
    return embedScriptlet(path as AstPath<Scriptlet>, options);
  }

  if (node.type === "Placeholder") {
    return embedPlaceholder(node);
  }

  if (node.type === "Class") {
    return embedClass(node);
  }

  if (node.type === "Tag" && node.nameText && node.nameText === "script") {
    return embedScriptTag(path as AstPath<Tag>, options);
  }

  if (node.type === "Tag" && node.nameText && node.nameText === "style") {
    return embedStyleTag(node);
  }

  if (node.type === "AttrNamed") {
    return emebdAttrNamed(path as AstPath<AttrNamed>, options);
  }

  if (node.type === "TagParams") {
    return embedTagParams(node);
  }

  if (node.type === "TagArgs") {
    return embedTagArgs(node);
  }

  if (node.type === "Import") {
    return embedImport(node);
  }

  if (node.type === "Export") {
    return embedExport(node);
  }

  if (node.type === "Static") {
    return embedStatic(node);
  }

  if (node.type === "OpenTagName") {
    return embedOpenTagName(node);
  }

  if (node.type === "TagTypeParams") {
    return embedTagTypeParams(node);
  }

  if (node.type === "TagTypeArgs") {
    return embedTagTypeArgs(node);
  }

  if (node.type === "AttrSpread") {
    return embedAttrSpread(node);
  }

  if (node.type === "Style") {
    return embedStaticStyle(path as AstPath<Style>, options);
  }

  if (node.type === "TagVar") {
    return embedTagVariable(path as AstPath<TagVar>, options);
  }

  return null;
}

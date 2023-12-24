import { AnyNode, Program } from "./MarkoNode";

type NodeOf<T extends string, X> = X extends { type: T } ? X : never;

type SpecialisedVisitors<T extends AnyNode> = {
  [K in T["type"]]?: Visitor<NodeOf<K, T>>;
};

export type Visitor<T extends AnyNode> = (node: T) => void;

export type Visitors = SpecialisedVisitors<AnyNode>;

export function walk(program: Program, visitor: Visitors) {
  const nodesToVisit: AnyNode[] = [program];
  while (nodesToVisit.length > 0) {
    const currentNode = nodesToVisit.pop()!;
    switch (currentNode.type) {
      case "Program":
        visitor[currentNode.type]?.(currentNode);

        if (currentNode.body) {
          nodesToVisit.push(...currentNode.body);
        }
        break;
      case "Tag":
        visitor[currentNode.type]?.(currentNode);

        if (currentNode.body) {
          nodesToVisit.push(...currentNode.body);
        }
        break;
      case "AttrTag":
        visitor[currentNode.type]?.(currentNode);

        if (currentNode.body) {
          nodesToVisit.push(...currentNode.body);
        }
        break;
      case "Text":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Placeholder":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Scriptlet":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Import":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Export":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Class":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Style":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "Static":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "OpenTagName":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "ShorthandId":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "ShorthandClassName":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "TagTypeArgs":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "TagTypeParams":
        visitor[currentNode.type]?.(currentNode);
        break;
      case "TagVar":
        visitor[currentNode.type]?.(currentNode);
        break;
    }
  }
}

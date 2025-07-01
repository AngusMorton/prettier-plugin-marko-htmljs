const dontTraverse = new Set([
  "start",
  "end",
  "type",
  "sourceSpan",
  "parent",
  "owner",
]);

export function getVisitorKeys(
  node: Record<string, unknown>,
  nonTraversableKeys: Set<string>,
): string[] {
  return Object.keys(node).filter((key) => {
    return !nonTraversableKeys.has(key) && !dontTraverse.has(key);
  });
}

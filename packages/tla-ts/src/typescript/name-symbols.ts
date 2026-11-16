import ts from "@typescript/typescript6";

declare module "@typescript/typescript6" {
  // TypeScript's own dense id of a node, which its checker keys its per-node tables by.
  function getNodeId(node: Node): number;
}

// TypeScript resolves a name's symbol again on each query, walking the scopes around it, and tla-ts
// asks for the symbols of the same names many times. So the program resolves every name of its
// files once, up front, into a table by node id: a slot per id from the files' lowest, a bit of
// whether the slot holds a name, and the symbol that each holds.
export const withNameSymbols = (
  checker: ts.TypeChecker,
  files: readonly ts.SourceFile[],
): ts.TypeChecker => {
  const names: ts.Identifier[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) names.push(node);
    ts.forEachChild(node, visit);
  };
  files.forEach(visit);
  const ids = Int32Array.from(names, (name) => ts.getNodeId(name));
  const first = ids.reduce((lowest, id) => Math.min(lowest, id), ids[0] ?? 0);
  const size = ids.reduce((highest, id) => Math.max(highest, id), first) - first + 1;
  const isName = new Uint32Array((size + 31) >>> 5);
  const symbols = new Array<ts.Symbol | undefined>(size).fill(undefined);
  names.forEach((name, position) => {
    const slot = ids[position] - first;
    isName[slot >>> 5] |= 1 << (slot & 31);
    symbols[slot] = checker.getSymbolAtLocation(name);
  });
  return {
    ...checker,
    getSymbolAtLocation: (node) => {
      const slot = ts.getNodeId(node) - first;
      return slot >= 0 && slot < size && (isName[slot >>> 5] & (1 << (slot & 31))) !== 0
        ? symbols[slot]
        : checker.getSymbolAtLocation(node);
    },
  };
};

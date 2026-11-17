import ts from "@typescript/typescript6";

declare module "@typescript/typescript6" {
  // TypeScript's own dense id of a node, which its checker keys its per-node tables by.
  function getNodeId(node: Node): number;
}

// The nodes of a program's files, in the order that a walk of each file's children visits them,
// each by its position there, as columns: the node, the position past its subtree, the position
// of its file, and an identifier's symbol. A node's position is found by its id, through a slot per
// id from the files' lowest, which holds the position plus one, or 0 for a node of no file.
export interface ProgramNodes {
  first: number;
  positions: Int32Array;
  nodes: ts.Node[];
  ends: Int32Array;
  files: Int32Array;
  symbols: (ts.Symbol | undefined)[];
}

// The position of a node of the program's files, or -1.
export const getPosition = (table: ProgramNodes, node: ts.Node) => {
  const slot = ts.getNodeId(node) - table.first;
  return slot >= 0 && slot < table.positions.length ? table.positions[slot] - 1 : -1;
};

// Walks the files once. TypeScript resolves a name's symbol again on each query, walking the
// scopes around it, so the walk resolves each identifier's once.
export const createProgramNodes = (
  checker: ts.TypeChecker,
  files: readonly ts.SourceFile[],
): ProgramNodes => {
  const nodes: ts.Node[] = [];
  const ends: number[] = [];
  const fileStarts: number[] = [];
  files.forEach((file) => {
    const start = nodes.length;
    const visit = (node: ts.Node): void => {
      const position = nodes.length;
      nodes.push(node);
      fileStarts.push(start);
      ends.push(0);
      ts.forEachChild(node, visit);
      ends[position] = nodes.length;
    };
    visit(file);
  });
  const ids = Int32Array.from(nodes, (node) => ts.getNodeId(node));
  const first = ids.reduce((lowest, id) => Math.min(lowest, id), ids[0] ?? 0);
  const size =
    nodes.length === 0 ? 0 : ids.reduce((highest, id) => Math.max(highest, id)) - first + 1;
  const positions = new Int32Array(size);
  ids.forEach((id, position) => {
    positions[id - first] = position + 1;
  });
  return {
    first,
    positions,
    nodes,
    ends: Int32Array.from(ends),
    files: Int32Array.from(fileStarts),
    symbols: nodes.map((node) =>
      ts.isIdentifier(node) ? checker.getSymbolAtLocation(node) : undefined,
    ),
  };
};

// A checker that reads an identifier's symbol from the table.
export const withNameSymbols = (checker: ts.TypeChecker, table: ProgramNodes): ts.TypeChecker => ({
  ...checker,
  getSymbolAtLocation: (node) => {
    const position = ts.isIdentifier(node) ? getPosition(table, node) : -1;
    return position < 0 ? checker.getSymbolAtLocation(node) : table.symbols[position];
  },
});

// TypeScript checks an expression again on each query of its type, so a checker reads the type of
// each expression of the program's files from a column that one pass fills.
export const withNodeTypes = (checker: ts.TypeChecker, table: ProgramNodes): ts.TypeChecker => {
  const types = table.nodes.map((node) =>
    ts.isExpression(node) ? checker.getTypeAtLocation(node) : undefined,
  );
  return {
    ...checker,
    getTypeAtLocation: (node) => {
      const position = getPosition(table, node);
      return (position < 0 ? undefined : types[position]) ?? checker.getTypeAtLocation(node);
    },
  };
};

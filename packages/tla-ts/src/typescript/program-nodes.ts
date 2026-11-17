import ts from "@typescript/typescript6";

declare module "@typescript/typescript6" {
  // TypeScript's own dense id of a node, which its checker keys its per-node tables by.
  function getNodeId(node: ts.Node): number;
  // And of a symbol.
  function getSymbolId(symbol: ts.Symbol): number;
}

// The nodes of a program's files, in the order that a walk of each file's children visits them,
// each by its position there, as columns: the node, the position past its subtree, the position
// of its file, and an identifier's symbol. A node's position is found by its id, through a slot per
// id from the files' lowest, which holds the position plus one, or 0 for a node of no file. The
// positions of each kind of node run in order, the kind's from its start to the next kind's. A walk
// that marks the nodes it has seen marks each with its own generation, so that no walk clears them.
export interface ProgramNodes {
  first: number;
  positions: Int32Array;
  nodes: ts.Node[];
  ends: Int32Array;
  files: Int32Array;
  fileStarts: Int32Array;
  symbols: (ts.Symbol | undefined)[];
  kindStarts: Int32Array;
  kindPositions: Int32Array;
  // The positions of the identifiers by their text, and then in order, with the texts.
  namePositions: Int32Array;
  nameTexts: string[];
  marks: Int32Array;
  generation: number;
  // The position of the implementation of an overloaded function or method, by the position of each
  // of its signatures, which runs nothing, or -1.
  implementations: Int32Array;
}

// tla-ts's own symbol of each identifier of the program's files, by its position, and the positions
// of the identifiers that name each symbol, by the symbol's id and then in order.
export interface References {
  symbols: (ts.Symbol | undefined)[];
  symbolIds: Int32Array;
  positions: Int32Array;
}

// The position of a node of the program's files, or -1.
export const getPosition = (table: ProgramNodes, node: ts.Node) => {
  const slot = ts.getNodeId(node) - table.first;
  return slot >= 0 && slot < table.positions.length ? table.positions[slot] - 1 : -1;
};

// The index of a node's file among the program's files, or -1 for a node of no file.
export const getFileIndex = (table: ProgramNodes, node: ts.Node) => {
  const position = getPosition(table, node);
  return position < 0
    ? -1
    : getLowerBound(table.fileStarts, 0, table.fileStarts.length, table.files[position]);
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
  const kindStarts = new Int32Array(ts.SyntaxKind.Count + 1);
  nodes.forEach((node) => {
    kindStarts[node.kind + 1] += 1;
  });
  kindStarts.forEach((count, kind) => {
    if (kind > 0) kindStarts[kind] = kindStarts[kind - 1] + count;
  });
  const kindEnds = kindStarts.slice(0, -1);
  const kindPositions = new Int32Array(nodes.length);
  nodes.forEach((node, position) => {
    kindPositions[kindEnds[node.kind]] = position;
    kindEnds[node.kind] += 1;
  });
  const endColumn = Int32Array.from(ends);
  // TypeScript requires a function's or a method's signatures to come right before its
  // implementation, in the same block, class, or file, so each is a sibling that the walk reaches
  // past the subtree of the one before.
  const isSignature = (node: ts.Node) =>
    (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.body === undefined;
  const getName = (node: ts.Node) =>
    (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name !== undefined
      ? node.name.getText()
      : undefined;
  const getImplementation = (position: number): number => {
    const next = endColumn[position];
    const node = nodes[position];
    const sibling = nodes[next];
    if (
      next >= nodes.length ||
      sibling.parent !== node.parent ||
      sibling.kind !== node.kind ||
      getName(sibling) !== getName(node)
    ) {
      return -1;
    }
    return isSignature(sibling) ? getImplementation(next) : next;
  };
  const implementations = Int32Array.from(nodes, (node, position) =>
    isSignature(node) && getName(node) !== undefined ? getImplementation(position) : -1,
  );
  const names = nodes.flatMap((node, position) =>
    ts.isIdentifier(node) ? [{ text: node.text, position }] : [],
  );
  names.sort((left, right) =>
    left.text < right.text ? -1 : left.text > right.text ? 1 : left.position - right.position,
  );
  return {
    first,
    positions,
    nodes,
    ends: endColumn,
    files: Int32Array.from(fileStarts),
    fileStarts: Int32Array.from(new Set(fileStarts)),
    symbols: nodes.map((node) =>
      ts.isIdentifier(node) ? checker.getSymbolAtLocation(node) : undefined,
    ),
    kindStarts,
    kindPositions,
    namePositions: Int32Array.from(names, (name) => name.position),
    nameTexts: names.map((name) => name.text),
    marks: new Int32Array(nodes.length),
    generation: 0,
    implementations,
  };
};

// The index of the first of a sorted run's values at or past a value.
export const getLowerBound = (
  sorted: Int32Array,
  start: number,
  end: number,
  value: number,
): number => {
  if (start >= end) return start;
  const middle = (start + end) >>> 1;
  return sorted[middle] < value
    ? getLowerBound(sorted, middle + 1, end, value)
    : getLowerBound(sorted, start, middle, value);
};

// The nodes under a root, itself too, in the order that a walk visits them, that pass a test.
const walkNodes = <T extends ts.Node>(root: ts.Node, test: (node: ts.Node) => node is T) => {
  const found: T[] = [];
  const visit = (node: ts.Node): void => {
    if (test(node)) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
};

// The nodes of some kinds under a root, itself too, in the order that a walk visits them, that pass
// a test. Under a root of the program's files, only the nodes of the kinds are tested.
export const findNodesOfKind = <T extends ts.Node>(
  table: ProgramNodes,
  root: ts.Node,
  kinds: ts.SyntaxKind | readonly ts.SyntaxKind[],
  test: (node: ts.Node) => node is T,
): T[] => {
  const all = typeof kinds === "number" ? [kinds] : kinds;
  const start = getPosition(table, root);
  if (start < 0) {
    return walkNodes(root, (node): node is T => all.includes(node.kind) && test(node));
  }
  const end = table.ends[start];
  const positions = all.flatMap((kind) => {
    const last = table.kindStarts[kind + 1];
    const first = getLowerBound(table.kindPositions, table.kindStarts[kind], last, start);
    return [
      ...table.kindPositions.subarray(first, getLowerBound(table.kindPositions, first, last, end)),
    ];
  });
  if (all.length > 1) positions.sort((left, right) => left - right);
  return positions.flatMap((position) => {
    const node = table.nodes[position];
    return test(node) ? [node] : [];
  });
};

// The index of the first of the sorted texts at or past a text.
const getTextBound = (
  texts: readonly string[],
  start: number,
  end: number,
  text: string,
): number => {
  if (start >= end) return start;
  const middle = (start + end) >>> 1;
  return texts[middle] < text
    ? getTextBound(texts, middle + 1, end, text)
    : getTextBound(texts, start, middle, text);
};

// The identifiers under a root, itself too, that have one of some texts, in the order that a walk
// visits them.
export const findNames = (
  table: ProgramNodes,
  root: ts.Node,
  texts: readonly string[],
): ts.Identifier[] => {
  const start = getPosition(table, root);
  if (start < 0) {
    return walkNodes(
      root,
      (node): node is ts.Identifier => ts.isIdentifier(node) && texts.includes(node.text),
    );
  }
  const end = table.ends[start];
  const positions = [...new Set(texts)].flatMap((text) => {
    const count = table.nameTexts.length;
    // Every text past this one, but those that start with it, sorts past it with a 0 after it.
    const last = getTextBound(table.nameTexts, 0, count, `${text}\0`);
    const first = getTextBound(table.nameTexts, 0, last, text);
    return [
      ...table.namePositions.subarray(
        getLowerBound(table.namePositions, first, last, start),
        getLowerBound(table.namePositions, first, last, end),
      ),
    ];
  });
  if (texts.length > 1) positions.sort((left, right) => left - right);
  return positions.flatMap((position) => {
    const node = table.nodes[position];
    return ts.isIdentifier(node) ? [node] : [];
  });
};

export const createReferences = (
  table: ProgramNodes,
  getSymbol: (name: ts.Identifier) => ts.Symbol | undefined,
): References => {
  const symbols = table.nodes.map((node) => (ts.isIdentifier(node) ? getSymbol(node) : undefined));
  const ids = Int32Array.from(symbols, (symbol) =>
    symbol === undefined ? -1 : ts.getSymbolId(symbol),
  );
  const positions = Int32Array.from(
    symbols.flatMap((symbol, position) => (symbol === undefined ? [] : [position])),
  ).sort((left, right) => ids[left] - ids[right] || left - right);
  return { symbols, symbolIds: positions.map((position) => ids[position]), positions };
};

// The identifiers under a root that name a symbol, as getSymbol gives it, in the order that a walk
// visits them. Under a root of the program's files, only the symbol's names are looked at.
export const getReferences = (
  table: ProgramNodes,
  references: References,
  symbol: ts.Symbol,
  root: ts.Node,
  getSymbol: (name: ts.Identifier) => ts.Symbol | undefined,
): ts.Identifier[] => {
  const start = getPosition(table, root);
  if (start < 0) {
    return walkNodes(
      root,
      (node): node is ts.Identifier => ts.isIdentifier(node) && getSymbol(node) === symbol,
    );
  }
  const end = table.ends[start];
  const id = ts.getSymbolId(symbol);
  const last = getLowerBound(references.symbolIds, 0, references.symbolIds.length, id + 1);
  const found: ts.Identifier[] = [];
  for (let index = getLowerBound(references.symbolIds, 0, last, id); index < last; index += 1) {
    const position = references.positions[index];
    const node = table.nodes[position];
    if (position >= start && position < end && ts.isIdentifier(node)) found.push(node);
  }
  return found;
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

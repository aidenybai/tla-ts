import ts from "@typescript/typescript6";
import { getPosition, type ProgramNodes, type References } from "./program-nodes";

// What a walk of each declaration that a name of the program's files names reaches by name, which
// tla-ts finds once for the program: a run of the declarations that the walk of its subtree meets,
// each once, in the order it meets them, from its start to its end by the declaration's position.
// A declaration that no file walks to, as JSDoc's, is -1 less its index among those elsewhere.
export interface ReachGraph {
  starts: Int32Array;
  ends: Int32Array;
  targets: Int32Array;
  elsewhere: ts.Node[];
}

const hasBit = (bits: Uint32Array, index: number) =>
  (bits[index >>> 5] & (1 << (index & 31))) !== 0;

const setBit = (bits: Uint32Array, index: number) => {
  bits[index >>> 5] |= 1 << (index & 31);
};

// A type runs nothing, though a class's base, which TypeScript parses as one, runs.
export const isSkippedForReach = (node: ts.Node) =>
  (ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node)) ||
  (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly === true) ||
  (ts.isImportSpecifier(node) && node.isTypeOnly);

// Visits the declarations that the names in a subtree of the program's files name, in the order
// that a walk meets them, past the subtrees that the walk skips.
export const forEachReachedName = (
  table: ProgramNodes,
  references: References,
  start: number,
  visit: (declaration: ts.Declaration, position: number) => void,
) => {
  let position = start;
  while (position < table.ends[start]) {
    if (isSkippedForReach(table.nodes[position])) {
      position = table.ends[position];
      continue;
    }
    references.symbols[position]?.declarations?.forEach((declaration) => {
      if (!ts.isSourceFile(declaration)) visit(declaration, getPosition(table, declaration));
    });
    position += 1;
  }
};

export const createReachGraph = (table: ProgramNodes, references: References): ReachGraph => {
  const count = table.nodes.length;
  const isTarget = new Uint32Array((count + 31) >>> 5);
  const elsewhere: ts.Node[] = [];
  references.symbols.forEach((symbol) =>
    symbol?.declarations?.forEach((declaration) => {
      const position = ts.isSourceFile(declaration) ? -1 : getPosition(table, declaration);
      if (position >= 0) setBit(isTarget, position);
    }),
  );
  const starts = new Int32Array(count);
  const ends = new Int32Array(count);
  const targets: number[] = [];
  // Each run keeps a declaration once, as the walk passes those it has seen.
  const lastRun = new Int32Array(count).fill(-1);
  for (let start = 0; start < count; start += 1) {
    if (!hasBit(isTarget, start)) continue;
    starts[start] = targets.length;
    forEachReachedName(table, references, start, (declaration, position) => {
      if (position >= 0) {
        if (lastRun[position] === start) return;
        lastRun[position] = start;
        targets.push(position);
        return;
      }
      if (declaration.getSourceFile().isDeclarationFile) return;
      elsewhere.push(declaration);
      targets.push(-elsewhere.length);
    });
    ends[start] = targets.length;
  }
  return {
    starts,
    ends,
    targets: Int32Array.from(targets),
    elsewhere,
  };
};

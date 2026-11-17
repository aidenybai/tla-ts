import ts from "@typescript/typescript6";
import { getLowerBound, getPosition, type ProgramNodes, type References } from "./program-nodes";

// What a walk of each declaration that a name of the program's files names reaches by name, which
// tla-ts finds once for the program: a run of the declarations that the walk of its subtree meets,
// each once, in the order it meets them, from its start to its end by the declaration's position.
// A declaration that no file walks to, as JSDoc's, is -1 less its index among those elsewhere.
// A bit by position tells each declaration that may make an object or a regexp literal, itself or
// through what it reaches, and one each that reaches a declaration elsewhere, which only a walk
// tells about.
export interface ReachGraph {
  starts: Int32Array;
  ends: Int32Array;
  targets: Int32Array;
  elsewhere: ts.Node[];
  makesObjects: Uint32Array;
  reachesElsewhere: Uint32Array;
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

// Whether a node of the program's files holds an object or a regexp literal in its subtree.
export const holdsObjectLiteral = (table: ProgramNodes, start: number) =>
  [ts.SyntaxKind.ObjectLiteralExpression, ts.SyntaxKind.RegularExpressionLiteral].some((kind) => {
    const last = table.kindStarts[kind + 1];
    const first = getLowerBound(table.kindPositions, table.kindStarts[kind], last, start);
    return first < last && table.kindPositions[first] < table.ends[start];
  });

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
  const reachesElsewhere = new Uint32Array((count + 31) >>> 5);
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
      setBit(reachesElsewhere, start);
      elsewhere.push(declaration);
      targets.push(-elsewhere.length);
    });
    ends[start] = targets.length;
  }
  // The declarations that may make objects, and that reach one elsewhere, follow the runs back from
  // those that do themselves.
  const callerStarts = new Int32Array(count + 1);
  for (let start = 0; start < count; start += 1) {
    for (let index = starts[start]; index < ends[start]; index += 1) {
      if (targets[index] >= 0) callerStarts[targets[index] + 1] += 1;
    }
  }
  callerStarts.forEach((size, position) => {
    if (position > 0) callerStarts[position] = callerStarts[position - 1] + size;
  });
  const callerEnds = callerStarts.slice(0, -1);
  const callers = new Int32Array(callerStarts[count]);
  for (let start = 0; start < count; start += 1) {
    for (let index = starts[start]; index < ends[start]; index += 1) {
      const target = targets[index];
      if (target < 0) continue;
      callers[callerEnds[target]] = start;
      callerEnds[target] += 1;
    }
  }
  const spread = (bits: Uint32Array) => {
    const pending: number[] = [];
    for (let position = 0; position < count; position += 1) {
      if (hasBit(bits, position)) pending.push(position);
    }
    while (pending.length > 0) {
      const position = pending.pop() ?? 0;
      for (let caller = callerStarts[position]; caller < callerStarts[position + 1]; caller += 1) {
        if (hasBit(bits, callers[caller])) continue;
        setBit(bits, callers[caller]);
        pending.push(callers[caller]);
      }
    }
    return bits;
  };
  const makesObjects = new Uint32Array((count + 31) >>> 5);
  for (let position = 0; position < count; position += 1) {
    if (hasBit(isTarget, position) && holdsObjectLiteral(table, position)) {
      setBit(makesObjects, position);
    }
  }
  return {
    starts,
    ends,
    targets: Int32Array.from(targets),
    elsewhere,
    makesObjects: spread(makesObjects),
    reachesElsewhere: spread(reachesElsewhere),
  };
};

export const isReachBit = hasBit;

// Ported from Zenon's eqrel.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// Finds the hypotheses that make a relation reflexive, symmetric or transitive. The prover then
// reasons with those properties directly, and drops the hypotheses that only state them.

import { type Expr, type Expressions } from "./expr";

interface RelationInfo {
  isReflexive: boolean;
  isSymmetric: boolean;
  isTransitive: boolean;
  isTransitiveSymmetric: boolean;
}

// A conjunct of a hypothesis: the variables quantified around it and the literals of its
// disjunction, when they all relate two of those variables by the same symbol.
interface Leaves {
  env: string[];
  leaves: Expr[];
}

const getLeaves = (exprs: Expressions, env: string[], formula: Expr): Leaves => {
  const leaves: Expr[] = [];
  let symbol: string | undefined = undefined;
  const isVariable = (term: Expr) => term.kind === "var" && env.includes(term.symbol);
  const visitLeaf = (leaf: Expr) => {
    const atom = leaf.kind === "not" ? leaf.args[0] : leaf;
    if (atom.kind !== "app") return false;
    const isRelation =
      atom.args.length === 2 &&
      (symbol === undefined || atom.symbol === symbol) &&
      isVariable(atom.args[0]) &&
      isVariable(atom.args[1]);
    if (!isRelation) return false;
    symbol = atom.symbol;
    leaves.unshift(leaf);
    return true;
  };
  const visit = (disjunct: Expr): boolean => {
    if (disjunct.kind === "or") return visit(disjunct.args[0]) && visit(disjunct.args[1]);
    if (disjunct.kind === "imply")
      return visit(exprs.enot(disjunct.args[0])) && visit(disjunct.args[1]);
    if (disjunct.kind === "not") {
      const operand = disjunct.args[0];
      if (operand.kind === "and")
        return visit(exprs.enot(operand.args[0])) && visit(exprs.enot(operand.args[1]));
      if (operand.kind === "not") return visit(operand.args[0]);
      if (operand.kind === "true") return true;
    }
    if (disjunct.kind === "false") return true;
    return visitLeaf(disjunct);
  };
  return visit(formula) ? { env, leaves } : { env, leaves: [] };
};

const getConjuncts = (exprs: Expressions, formula: Expr) => {
  const conjuncts: Leaves[] = [];
  const visit = (env: string[], conjunct: Expr) => {
    const operand = conjunct.kind === "not" ? conjunct.args[0] : undefined;
    if (conjunct.kind === "and") {
      visit(env, conjunct.args[0]);
      visit(env, conjunct.args[1]);
    } else if (conjunct.kind === "all") {
      visit([conjunct.args[0].symbol, ...env], conjunct.args[1]);
    } else if (operand?.kind === "or") {
      visit(env, exprs.enot(operand.args[0]));
      visit(env, exprs.enot(operand.args[1]));
    } else if (operand?.kind === "imply") {
      visit(env, operand.args[0]);
      visit(env, exprs.enot(operand.args[1]));
    } else if (operand?.kind === "ex") {
      visit([operand.args[0].symbol, ...env], exprs.enot(operand.args[1]));
    } else if (operand?.kind === "not") {
      visit(env, operand.args[0]);
    } else if (conjunct.kind === "equiv") {
      visit(env, exprs.eimply(conjunct.args[0], conjunct.args[1]));
      visit(env, exprs.eimply(conjunct.args[1], conjunct.args[0]));
    } else if (operand?.kind === "equiv") {
      visit(env, exprs.eor(operand.args[0], operand.args[1]));
      visit(env, exprs.eor(exprs.enot(operand.args[0]), exprs.enot(operand.args[1])));
    } else conjuncts.unshift(getLeaves(exprs, env, conjunct));
  };
  visit([], formula);
  return conjuncts;
};

const getPair = (leaf: Expr) => {
  const atom = leaf.kind === "not" ? leaf.args[0] : leaf;
  return [atom.args[0].symbol, atom.args[1].symbol];
};

// The leaves as Zenon's partition returns them: positive and negative, each reversed.
const partition = (leaves: Expr[]) => ({
  positive: leaves
    .filter((leaf) => leaf.kind !== "not")
    .reverse()
    .map(getPair),
  negative: leaves
    .filter((leaf) => leaf.kind === "not")
    .reverse()
    .map(getPair),
});

const isReflexive = (leaves: Expr[]) => {
  if (leaves.length !== 1 || leaves[0].kind === "not") return false;
  const pair = getPair(leaves[0]);
  return pair[0] === pair[1];
};

const isSymmetric = (leaves: Expr[]) => {
  const parts = partition(leaves);
  if (parts.positive.length !== 1 || parts.negative.length !== 1) return false;
  const positive = parts.positive[0];
  const negative = parts.negative[0];
  return positive[0] === negative[1] && positive[1] === negative[0];
};

const getTriple = (leaves: Expr[]) => {
  const parts = partition(leaves);
  return parts.positive.length === 1 && parts.negative.length === 2
    ? { result: parts.positive[0], first: parts.negative[0], second: parts.negative[1] }
    : undefined;
};

const isTransitive = (leaves: Expr[]) => {
  const triple = getTriple(leaves);
  if (triple === undefined) return false;
  const result = triple.result;
  const first = triple.first;
  const second = triple.second;
  return (
    (first[1] === second[0] && result[0] === first[0] && result[1] === second[1]) ||
    (second[1] === first[0] && result[0] === second[0] && result[1] === first[1])
  );
};

const isTransitiveSymmetric = (leaves: Expr[]) => {
  const triple = getTriple(leaves);
  if (triple === undefined) return false;
  const result = triple.result;
  const first = triple.first;
  const second = triple.second;
  return (
    (first[1] === second[0] && result[1] === first[0] && result[0] === second[1]) ||
    (second[1] === first[0] && result[1] === second[0] && result[0] === first[1])
  );
};

const getSymbol = (leaves: Expr[]) => {
  const atom = leaves[0].kind === "not" ? leaves[0].args[0] : leaves[0];
  return atom.symbol;
};

export const createRelations = (exprs: Expressions) => {
  const relations = new Map<string, RelationInfo>([
    [
      "=",
      { isReflexive: true, isSymmetric: true, isTransitive: true, isTransitiveSymmetric: true },
    ],
  ]);

  const getRecord = (symbol: string) => {
    const existing = relations.get(symbol);
    if (existing !== undefined) return existing;
    const record = {
      isReflexive: false,
      isSymmetric: false,
      isTransitive: false,
      isTransitiveSymmetric: false,
    };
    relations.set(symbol, record);
    return record;
  };

  const analyse = (formula: Expr) => {
    for (const conjunct of getConjuncts(exprs, formula)) {
      const leaves = conjunct.leaves;
      const properties = {
        isReflexive: isReflexive(leaves),
        isSymmetric: isSymmetric(leaves),
        isTransitive: isTransitive(leaves),
        isTransitiveSymmetric: isTransitiveSymmetric(leaves),
      };
      if (!Object.values(properties).some(Boolean)) continue;
      const record = getRecord(getSymbol(leaves));
      if (properties.isReflexive) record.isReflexive = true;
      if (properties.isSymmetric) record.isSymmetric = true;
      if (properties.isTransitive) record.isTransitive = true;
      if (properties.isTransitiveSymmetric) record.isTransitiveSymmetric = true;
    }
  };

  const isSubsumed = (formula: Expr) =>
    getConjuncts(exprs, formula).every((conjunct) => {
      const leaves = conjunct.leaves;
      if (isReflexive(leaves)) return getRecord(getSymbol(leaves)).isReflexive;
      if (isSymmetric(leaves)) return getRecord(getSymbol(leaves)).isSymmetric;
      if (isTransitive(leaves)) return getRecord(getSymbol(leaves)).isTransitive;
      if (isTransitiveSymmetric(leaves)) {
        const record = getRecord(getSymbol(leaves));
        return record.isSymmetric && record.isTransitive;
      }
      return false;
    });

  const get = (symbol: string) => relations.get(symbol);

  return {
    analyse,
    isSubsumed,
    isReflexive: (symbol: string) => get(symbol)?.isReflexive ?? false,
    isSymmetric: (symbol: string) => {
      const record = get(symbol);
      return (
        record !== undefined &&
        (record.isSymmetric || (record.isReflexive && record.isTransitiveSymmetric))
      );
    },
    isTransitive: (symbol: string) => {
      const record = get(symbol);
      return (
        record !== undefined &&
        (record.isTransitive || (record.isReflexive && record.isTransitiveSymmetric))
      );
    },
    isAny: (symbol: string) => {
      const record = get(symbol);
      return (
        record !== undefined && (record.isReflexive || record.isSymmetric || record.isTransitive)
      );
    },
    // The relations that hypotheses made reflexive, symmetric or transitive, for the checker.
    getRelations: () => relations,
  };
};

export type Relations = ReturnType<typeof createRelations>;

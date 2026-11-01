// Ported from Zenon's eqrel.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// Finds the hypotheses that make a relation reflexive, symmetric or transitive. The prover then
// reasons with those properties directly, and drops the hypotheses that only state them. The
// translation to Isar proves the properties again from the hypotheses that stated them.

import { TRUE, type Expr, type Expressions } from "./expr";

export type Direction = "left" | "right";

// Where a hypothesis states a property: the conjunct at `directions`, with the relation's
// arguments bound by the quantifiers at `variables`, counted from the outermost.
export interface Origin {
  formula: Expr;
  directions: Direction[];
  variables: number[];
}

export interface RelationInfo {
  reflexive: Origin | undefined;
  symmetric: Origin | undefined;
  transitive: Origin | undefined;
  transitiveSymmetric: Origin | undefined;
  // The type of the relation's arguments.
  type: string;
}

interface Bound {
  name: string;
  type: string;
}

// A conjunct of a hypothesis: the variables quantified around it and the literals of its
// disjunction, when they all relate two of those variables by the same symbol.
interface Leaves {
  directions: Direction[];
  env: Bound[];
  leaves: Expr[];
  type: string;
}

const getLeaves = (
  exprs: Expressions,
  directions: Direction[],
  env: Bound[],
  formula: Expr,
): Leaves => {
  const leaves: Expr[] = [];
  let symbol: string | undefined = undefined;
  let type = "";
  const getBound = (term: Expr) =>
    term.kind === "var" ? env.find((bound) => bound.name === term.symbol) : undefined;
  const visitLeaf = (leaf: Expr) => {
    const atom = leaf.kind === "not" ? leaf.args[0] : leaf;
    if (atom.kind !== "app") return false;
    const first = getBound(atom.args[0]);
    const isRelation =
      atom.args.length === 2 &&
      (symbol === undefined || atom.symbol === symbol) &&
      first !== undefined &&
      getBound(atom.args[1]) !== undefined;
    if (!isRelation) return false;
    if (symbol === undefined) type = first.type;
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
  return visit(formula)
    ? { directions, env, leaves, type }
    : { directions, env, leaves: [], type: "" };
};

const getConjuncts = (exprs: Expressions, formula: Expr) => {
  const conjuncts: Leaves[] = [];
  const visit = (directions: Direction[], env: Bound[], conjunct: Expr) => {
    const left: Direction[] = [...directions, "left"];
    const right: Direction[] = [...directions, "right"];
    const operand = conjunct.kind === "not" ? conjunct.args[0] : undefined;
    if (conjunct.kind === "and") {
      visit(left, env, conjunct.args[0]);
      visit(right, env, conjunct.args[1]);
    } else if (conjunct.kind === "all") {
      const bound = { name: conjunct.args[0].symbol, type: conjunct.symbol };
      visit(directions, [bound, ...env], conjunct.args[1]);
    } else if (operand?.kind === "or") {
      visit(left, env, exprs.enot(operand.args[0]));
      visit(right, env, exprs.enot(operand.args[1]));
    } else if (operand?.kind === "imply") {
      visit(left, env, operand.args[0]);
      visit(right, env, exprs.enot(operand.args[1]));
    } else if (operand?.kind === "ex") {
      const bound = { name: operand.args[0].symbol, type: operand.symbol };
      visit(directions, [bound, ...env], exprs.enot(operand.args[1]));
    } else if (operand?.kind === "not") {
      visit(directions, env, operand.args[0]);
    } else if (conjunct.kind === "equiv") {
      visit(left, env, exprs.eimply(conjunct.args[0], conjunct.args[1]));
      visit(right, env, exprs.eimply(conjunct.args[1], conjunct.args[0]));
    } else if (operand?.kind === "equiv") {
      visit(left, env, exprs.eor(operand.args[0], operand.args[1]));
      visit(right, env, exprs.eor(exprs.enot(operand.args[0]), exprs.enot(operand.args[1])));
    } else conjuncts.unshift(getLeaves(exprs, directions, env, conjunct));
  };
  visit([], [], formula);
  return conjuncts;
};

const getPair = (leaf: Expr) => {
  const atom = leaf.kind === "not" ? leaf.args[0] : leaf;
  const args: Expr[] = atom.args;
  return [args[0].symbol, args[1].symbol];
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

// Each check returns the variables that the translation instantiates to prove the property, or
// undefined when the conjunct doesn't state it.
const getReflexive = (leaves: Expr[]) => {
  if (leaves.length !== 1 || leaves[0].kind === "not") return undefined;
  const pair = getPair(leaves[0]);
  return pair[0] === pair[1] ? [pair[0]] : undefined;
};

const getSymmetric = (leaves: Expr[]) => {
  const parts = partition(leaves);
  if (parts.positive.length !== 1 || parts.negative.length !== 1) return undefined;
  const positive = parts.positive[0];
  const negative = parts.negative[0];
  return positive[0] === negative[1] && positive[1] === negative[0] ? negative : undefined;
};

const getTriple = (leaves: Expr[]) => {
  const parts = partition(leaves);
  return parts.positive.length === 1 && parts.negative.length === 2
    ? { result: parts.positive[0], first: parts.negative[0], second: parts.negative[1] }
    : undefined;
};

const getTransitive = (leaves: Expr[]) => {
  const triple = getTriple(leaves);
  if (triple === undefined) return undefined;
  const result = triple.result;
  const first = triple.first;
  const second = triple.second;
  if (first[1] === second[0] && result[0] === first[0] && result[1] === second[1])
    return [result[0], first[1], result[1]];
  if (second[1] === first[0] && result[0] === second[0] && result[1] === first[1])
    return [result[0], first[0], result[1]];
  return undefined;
};

const getTransitiveSymmetric = (leaves: Expr[]) => {
  const triple = getTriple(leaves);
  if (triple === undefined) return undefined;
  const result = triple.result;
  const first = triple.first;
  const second = triple.second;
  if (first[1] === second[0] && result[1] === first[0] && result[0] === second[1])
    return [result[1], first[1], result[0]];
  if (second[1] === first[0] && result[1] === second[0] && result[0] === first[1])
    return [result[1], first[0], result[0]];
  return undefined;
};

const getSymbol = (leaves: Expr[]) => {
  const atom = leaves[0].kind === "not" ? leaves[0].args[0] : leaves[0];
  return atom.symbol;
};

export const createRelations = (exprs: Expressions) => {
  const equalityOrigin = { formula: TRUE, directions: [], variables: [] };
  const relations = new Map<string, RelationInfo>([
    [
      "=",
      {
        reflexive: equalityOrigin,
        symmetric: equalityOrigin,
        transitive: equalityOrigin,
        transitiveSymmetric: equalityOrigin,
        type: "",
      },
    ],
  ]);

  const getRecord = (symbol: string) => {
    const existing = relations.get(symbol);
    if (existing !== undefined) return existing;
    const record: RelationInfo = {
      reflexive: undefined,
      symmetric: undefined,
      transitive: undefined,
      transitiveSymmetric: undefined,
      type: "",
    };
    relations.set(symbol, record);
    return record;
  };

  const analyse = (formula: Expr) => {
    for (const conjunct of getConjuncts(exprs, formula)) {
      const leaves = conjunct.leaves;
      const env = conjunct.env;
      const getOrigin = (names: string[] | undefined) =>
        names === undefined
          ? undefined
          : {
              formula,
              directions: conjunct.directions,
              variables: names.map(
                (name) => env.length - 1 - env.findIndex((bound) => bound.name === name),
              ),
            };
      const reflexive = getOrigin(getReflexive(leaves));
      const symmetric = getOrigin(getSymmetric(leaves));
      const transitive = getOrigin(getTransitive(leaves));
      const transitiveSymmetric = getOrigin(getTransitiveSymmetric(leaves));
      if (!reflexive && !symmetric && !transitive && !transitiveSymmetric) continue;
      const record = getRecord(getSymbol(leaves));
      if (reflexive) record.reflexive = reflexive;
      if (symmetric) record.symmetric = symmetric;
      if (transitive) record.transitive = transitive;
      if (transitiveSymmetric) record.transitiveSymmetric = transitiveSymmetric;
      record.type = conjunct.type;
    }
  };

  const isSubsumed = (formula: Expr) =>
    getConjuncts(exprs, formula).every((conjunct) => {
      const leaves = conjunct.leaves;
      if (getReflexive(leaves)) return getRecord(getSymbol(leaves)).reflexive !== undefined;
      if (getSymmetric(leaves)) return getRecord(getSymbol(leaves)).symmetric !== undefined;
      if (getTransitive(leaves)) return getRecord(getSymbol(leaves)).transitive !== undefined;
      if (getTransitiveSymmetric(leaves)) {
        const record = getRecord(getSymbol(leaves));
        return record.symmetric !== undefined && record.transitive !== undefined;
      }
      return false;
    });

  const get = (symbol: string) => relations.get(symbol);

  return {
    analyse,
    isSubsumed,
    isReflexive: (symbol: string) => get(symbol)?.reflexive !== undefined,
    isSymmetric: (symbol: string) => {
      const record = get(symbol);
      return (
        record !== undefined &&
        (record.symmetric !== undefined ||
          (record.reflexive !== undefined && record.transitiveSymmetric !== undefined))
      );
    },
    isTransitive: (symbol: string) => {
      const record = get(symbol);
      return (
        record !== undefined &&
        (record.transitive !== undefined ||
          (record.reflexive !== undefined && record.transitiveSymmetric !== undefined))
      );
    },
    isAny: (symbol: string) => {
      const record = get(symbol);
      return (
        record !== undefined &&
        (record.reflexive !== undefined ||
          record.symmetric !== undefined ||
          record.transitive !== undefined)
      );
    },
    // Where the hypotheses state a relation's properties, for the translation to Isar.
    get,
  };
};

export type Relations = ReturnType<typeof createRelations>;

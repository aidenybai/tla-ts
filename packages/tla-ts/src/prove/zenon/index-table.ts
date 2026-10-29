// Ported from Zenon's index.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// The formulas on the current branch, indexed by head symbol, by the sides of equalities and
// transitive relations, and the cache of proved lemmas. Formulas are added and removed in LIFO
// order as the search descends and backtracks. Lists keep Zenon's order, latest first.

import {
  isNegatedRelation,
  isRelation,
  type Expr,
  type Expressions,
  type NegatedRelationExpr,
  type NotExpr,
  type RelationExpr,
} from "./expr";
import type { Proof } from "./proof";
import type { Definition } from "./parse";

interface LemmaRecord {
  isPresent: boolean;
  proofs: Suspect[];
}

interface Suspect {
  proof: Proof;
  cursor: number;
  records: LemmaRecord[];
}

// A stack of values per key, as a Hashtbl with Hashtbl.add and Hashtbl.remove.
const pushValue = <Key, Value>(table: Map<Key, Value[]>, key: Key, value: Value) => {
  const values = table.get(key);
  if (values === undefined) table.set(key, [value]);
  else values.push(value);
};

const popValue = <Key, Value>(table: Map<Key, Value[]>, key: Key) => {
  const values = table.get(key);
  if (values === undefined) return;
  values.pop();
  if (values.length === 0) table.delete(key);
};

const getLatestFirst = <Key, Value>(table: Map<Key, Value[]>, key: Key) =>
  [...(table.get(key) ?? [])].reverse();

// Zenon's head of a term, or undefined for No_head. Taus and metavariables are heads by identity.
export type Head = string | Expr;

export const getHead = (expression: Expr): Head | undefined => {
  switch (expression.kind) {
    case "app":
    case "var":
      return expression.symbol;
    case "meta":
    case "tau":
      return expression;
    case "true":
      return "$true";
    case "false":
      return "$false";
    case "all":
      return "A.";
    case "ex":
      return "E.";
    default:
      return undefined;
  }
};

// Zenon indexes formulas by head under a string; every tau shares "t." and every metavariable "".
const getHeadKey = (head: Head) =>
  typeof head === "string" ? head : head.kind === "tau" ? "t." : "";

// Zenon's add_element and remove_element on a table of lists. Removing from a one-element list
// drops the key whatever the element, as Zenon does.
const addElement = <Key, Value>(table: Map<Key, Value[]>, key: Key, value: Value) => {
  const values = table.get(key);
  if (values === undefined) table.set(key, [value]);
  else values.push(value);
};

// False stands for Zenon's Not_found.
const removeElement = <Key, Value>(table: Map<Key, Value[]>, key: Key, value: Value) => {
  const values = table.get(key);
  if (values === undefined) return false;
  if (values.length === 1) table.delete(key);
  else if (values[values.length - 1] === value) values.pop();
  return true;
};

const getValues = <Key, Value>(table: Map<Key, Value[]>, key: Key) => getLatestFirst(table, key);

// Keys pair a relation with a head. Heads that are expressions are told apart by identity.
const getHeadId = (head: Head) => (typeof head === "string" ? `s${head}` : `e${head.id}`);

const getRelationKey = (relation: string, head: Head) => `${relation}\u0000${getHeadId(head)}`;

export const createIndex = (exprs: Expressions) => {
  const formulas = new Map<Expr, number[]>();
  const positive = new Map<string, Expr[]>();
  const negative = new Map<string, NotExpr[]>();
  const transLeft = new Map<string, RelationExpr[]>();
  const transRight = new Map<string, RelationExpr[]>();
  const negTransLeft = new Map<string, NegatedRelationExpr[]>();
  const negTransRight = new Map<string, NegatedRelationExpr[]>();
  const allNegTransLeft = new Map<string, NegatedRelationExpr[]>();
  const allNegTransRight = new Map<string, NegatedRelationExpr[]>();
  const equalLeftRight = new Map<Expr, Expr[]>();
  const equalRightLeft = new Map<Expr, Expr[]>();
  const unequalLeftRight = new Map<Expr, Expr[]>();
  const unequalRightLeft = new Map<Expr, Expr[]>();
  const stringEqualities: [Expr, string][] = [];
  const reversedStringEqualities: [Expr, string][] = [];
  const definitions = new Map<string, Definition>();
  const lemmas = new Map<Expr, LemmaRecord>();
  let newFormulas: Expr[] = [];
  let suspects: Suspect[][] = [];
  let formulaCount = 0;
  let topFormulaCount = 0;

  const isMember = (formula: Expr) => formulas.has(formula);

  const getGoalness = (formula: Expr) => {
    const goalnesses = formulas.get(formula);
    return goalnesses === undefined ? 0 : goalnesses[goalnesses.length - 1];
  };

  const withGoalness = <Formula extends Expr>(list: Formula[]): [Formula, number][] =>
    list.map((formula) => [formula, getGoalness(formula)]);

  // Zenon's negpos: a negation under the head of its operand, anything else under its own head.
  const actOnHead = (
    formula: Expr,
    action: <Formula extends Expr>(
      table: Map<string, Formula[]>,
      key: string,
      value: Formula,
    ) => void,
  ) => {
    if (formula.kind === "not") {
      const head = getHead(formula.args[0]);
      if (head !== undefined) action(negative, getHeadKey(head), formula);
      return;
    }
    const head = getHead(formula);
    if (head !== undefined) action(positive, getHeadKey(head), formula);
  };

  const getStringLiteral = (expression: Expr) =>
    expression.kind === "app" &&
    expression.symbol === "$string" &&
    expression.args.length === 1 &&
    expression.args[0].kind === "var"
      ? expression.args[0].symbol
      : undefined;

  const getStringEquality = (formula: Expr) => {
    if (formula.kind !== "app" || formula.symbol !== "=" || formula.args.length !== 2)
      return undefined;
    const rightString = getStringLiteral(formula.args[1]);
    if (rightString !== undefined)
      return { isReversed: false, term: formula.args[0], value: rightString };
    const leftString = getStringLiteral(formula.args[0]);
    return leftString === undefined
      ? undefined
      : { isReversed: true, term: formula.args[1], value: leftString };
  };

  const isEquality = (formula: Expr) =>
    formula.kind === "app" && formula.symbol === "=" && formula.args.length === 2;

  const add = (formula: Expr, goalness: number) => {
    pushValue(formulas, formula, goalness);
    if (isEquality(formula)) {
      pushValue(equalLeftRight, formula.args[0], formula.args[1]);
      pushValue(equalRightLeft, formula.args[1], formula.args[0]);
    } else if (formula.kind === "not" && isEquality(formula.args[0])) {
      pushValue(unequalLeftRight, formula.args[0].args[0], formula.args[0].args[1]);
      pushValue(unequalRightLeft, formula.args[0].args[1], formula.args[0].args[0]);
    }
    const stringEquality = getStringEquality(formula);
    if (stringEquality !== undefined)
      (stringEquality.isReversed ? reversedStringEqualities : stringEqualities).unshift([
        stringEquality.term,
        stringEquality.value,
      ]);
    formulaCount++;
    topFormulaCount = Math.max(topFormulaCount, formulaCount);
    actOnHead(formula, addElement);
    const lemma = lemmas.get(formula);
    if (lemma !== undefined) lemma.isPresent = true;
    newFormulas.unshift(formula);
  };

  const removeTrans = (formula: Expr) => {
    if (!isRelation(formula)) return;
    const leftHead = getHead(formula.args[0]);
    if (leftHead !== undefined)
      removeElement(transLeft, getRelationKey(formula.symbol, leftHead), formula);
    const rightHead = getHead(formula.args[1]);
    if (rightHead !== undefined)
      removeElement(transRight, getRelationKey(formula.symbol, rightHead), formula);
  };

  const removeNegTrans = (formula: Expr) => {
    if (!isNegatedRelation(formula)) return;
    const relation = formula.args[0];
    const leftHead = getHead(relation.args[0]);
    if (
      leftHead !== undefined &&
      removeElement(negTransLeft, getRelationKey(relation.symbol, leftHead), formula)
    )
      removeElement(allNegTransLeft, getHeadId(leftHead), formula);
    const rightHead = getHead(relation.args[1]);
    if (
      rightHead !== undefined &&
      removeElement(negTransRight, getRelationKey(relation.symbol, rightHead), formula)
    )
      removeElement(allNegTransRight, getHeadId(rightHead), formula);
  };

  const remove = (formula: Expr) => {
    formulaCount--;
    removeTrans(formula);
    removeNegTrans(formula);
    actOnHead(formula, removeElement);
    const stringEquality = getStringEquality(formula);
    if (stringEquality !== undefined)
      (stringEquality.isReversed ? reversedStringEqualities : stringEqualities).shift();
    if (isEquality(formula)) {
      popValue(equalLeftRight, formula.args[0]);
      popValue(equalRightLeft, formula.args[1]);
    } else if (formula.kind === "not" && isEquality(formula.args[0])) {
      popValue(unequalLeftRight, formula.args[0].args[0]);
      popValue(unequalRightLeft, formula.args[0].args[1]);
    }
    popValue(formulas, formula);
    const lemma = lemmas.get(formula);
    if (lemma !== undefined) lemma.isPresent = false;
  };

  // Zenon's add_trans, which stops at the first side without a head. False means No_head.
  const addTrans = (formula: RelationExpr) => {
    const leftHead = getHead(formula.args[0]);
    if (leftHead === undefined) return false;
    addElement(transLeft, getRelationKey(formula.symbol, leftHead), formula);
    const rightHead = getHead(formula.args[1]);
    if (rightHead === undefined) return false;
    addElement(transRight, getRelationKey(formula.symbol, rightHead), formula);
    return true;
  };

  const addNegTrans = (formula: NegatedRelationExpr) => {
    const relation = formula.args[0];
    const leftHead = getHead(relation.args[0]);
    if (leftHead !== undefined) {
      addElement(negTransLeft, getRelationKey(relation.symbol, leftHead), formula);
      addElement(allNegTransLeft, getHeadId(leftHead), formula);
    }
    const rightHead = getHead(relation.args[1]);
    if (rightHead !== undefined) {
      addElement(negTransRight, getRelationKey(relation.symbol, rightHead), formula);
      addElement(allNegTransRight, getHeadId(rightHead), formula);
    }
  };

  const addLemma = (proof: Proof) => {
    const records = proof.conclusions.map((formula) => {
      const existing = lemmas.get(formula);
      if (existing !== undefined) return existing;
      const record = { isPresent: formulas.has(formula), proofs: [] };
      lemmas.set(formula, record);
      return record;
    });
    suspects.unshift([{ proof, cursor: 0, records }]);
  };

  // A cached lemma whose conclusions are all on the branch. A lemma waits on the first conclusion
  // that is missing, and is checked again when that formula comes back.
  const searchLemma = (): Proof | undefined => {
    for (const formula of newFormulas) {
      const record = lemmas.get(formula);
      if (record !== undefined && record.isPresent) {
        suspects.unshift(record.proofs);
        record.proofs = [];
      }
    }
    newFormulas = [];
    while (suspects.length > 0) {
      const group = suspects[0];
      if (group.length === 0) {
        suspects = suspects.slice(1);
        continue;
      }
      const suspect = group[0];
      const count = suspect.records.length;
      const missing = [
        ...Array.from({ length: count - suspect.cursor }, (_, offset) => suspect.cursor + offset),
        ...Array.from({ length: suspect.cursor }, (_, offset) => offset),
      ].find((index) => !suspect.records[index].isPresent);
      if (missing === undefined) return suspect.proof;
      suspects = [group.slice(1), ...suspects.slice(1)];
      suspect.records[missing].proofs = [suspect, ...suspect.records[missing].proofs];
      suspect.cursor = missing + 1;
    }
    return undefined;
  };

  return {
    add,
    remove,
    isMember,
    getGoalness,
    findPositive: (symbol: string) => withGoalness(getValues(positive, symbol)),
    findNegative: (symbol: string) => withGoalness(getValues(negative, symbol)),
    findEqualRight: (term: Expr) => getLatestFirst(equalLeftRight, term),
    findEqualLeft: (term: Expr) => getLatestFirst(equalRightLeft, term),
    findDisequalities: (term: Expr) => [
      ...getLatestFirst(unequalLeftRight, term).map((other) =>
        exprs.enot(exprs.eapp("=", [term, other])),
      ),
      ...getLatestFirst(unequalRightLeft, term).map((other) =>
        exprs.enot(exprs.eapp("=", [other, term])),
      ),
    ],
    getStringEqualities: () => stringEqualities,
    getReversedStringEqualities: () => reversedStringEqualities,
    addTrans,
    addNegTrans,
    findTransLeft: (relation: string, head: Head) =>
      withGoalness(getValues(transLeft, getRelationKey(relation, head))),
    findTransRight: (relation: string, head: Head) =>
      withGoalness(getValues(transRight, getRelationKey(relation, head))),
    findNegTransLeft: (relation: string, head: Head) =>
      withGoalness(getValues(negTransLeft, getRelationKey(relation, head))),
    findNegTransRight: (relation: string, head: Head) =>
      withGoalness(getValues(negTransRight, getRelationKey(relation, head))),
    findAllNegTransLeft: (head: Head) => withGoalness(getValues(allNegTransLeft, getHeadId(head))),
    findAllNegTransRight: (head: Head) =>
      withGoalness(getValues(allNegTransRight, getHeadId(head))),
    addLemma,
    searchLemma,
    addDefinition: (definition: Definition) => definitions.set(definition.symbol, definition),
    getDefinition: (symbol: string) => definitions.get(symbol),
    getTopFormulaCount: () => topFormulaCount,
  };
};

export type Index = ReturnType<typeof createIndex>;

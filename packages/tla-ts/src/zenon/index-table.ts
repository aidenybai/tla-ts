// Ported from Zenon's index.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// The formulas on the current branch, indexed by head symbol, by the sides of equalities and
// transitive relations, and the cache of proved lemmas. Formulas are added and removed in LIFO
// order as the search descends and backtracks. Lists keep Zenon's order, latest first.

import { eapp, enot, type Expr } from "./expr";
import type { Proof } from "./node";
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
const addElement = <Key>(table: Map<Key, Expr[]>, key: Key, value: Expr) => {
  const values = table.get(key);
  if (values === undefined) table.set(key, [value]);
  else values.push(value);
};

// False stands for Zenon's Not_found.
const removeElement = <Key>(table: Map<Key, Expr[]>, key: Key, value: Expr) => {
  const values = table.get(key);
  if (values === undefined) return false;
  if (values.length === 1) table.delete(key);
  else if (values[values.length - 1] === value) values.pop();
  return true;
};

const getValues = <Key>(table: Map<Key, Expr[]>, key: Key) => getLatestFirst(table, key);

// Keys pair a relation with a head. Heads that are expressions are told apart by identity.
const expressionIds = new WeakMap<Expr, number>();
let nextExpressionId = 0;

const getHeadId = (head: Head) => {
  if (typeof head === "string") return `s${head}`;
  const existing = expressionIds.get(head);
  if (existing !== undefined) return `e${existing}`;
  const id = nextExpressionId++;
  expressionIds.set(head, id);
  return `e${id}`;
};

const getRelationKey = (relation: string, head: Head) => `${relation}\u0000${getHeadId(head)}`;

export const createIndex = () => {
  const formulas = new Map<Expr, number[]>();
  const positive = new Map<string, Expr[]>();
  const negative = new Map<string, Expr[]>();
  const transLeft = new Map<string, Expr[]>();
  const transRight = new Map<string, Expr[]>();
  const negTransLeft = new Map<string, Expr[]>();
  const negTransRight = new Map<string, Expr[]>();
  const allNegTransLeft = new Map<string, Expr[]>();
  const allNegTransRight = new Map<string, Expr[]>();
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

  const withGoalness = (list: Expr[]): [Expr, number][] =>
    list.map((formula) => [formula, getGoalness(formula)]);

  // Zenon's negpos: a negation under the head of its operand, anything else under its own head.
  const actOnHead = (action: (table: Map<string, Expr[]>, key: string) => void, formula: Expr) => {
    const table = formula.kind === "not" ? negative : positive;
    const head = getHead(formula.kind === "not" ? formula.args[0] : formula);
    if (head !== undefined) action(table, getHeadKey(head));
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
    actOnHead((table, key) => addElement(table, key, formula), formula);
    const lemma = lemmas.get(formula);
    if (lemma !== undefined) lemma.isPresent = true;
    newFormulas.unshift(formula);
  };

  const removeTrans = (formula: Expr) => {
    if (formula.kind !== "app" || formula.args.length !== 2) return;
    const leftHead = getHead(formula.args[0]);
    if (leftHead !== undefined)
      removeElement(transLeft, getRelationKey(formula.symbol, leftHead), formula);
    const rightHead = getHead(formula.args[1]);
    if (rightHead !== undefined)
      removeElement(transRight, getRelationKey(formula.symbol, rightHead), formula);
  };

  const removeNegTrans = (formula: Expr) => {
    if (formula.kind !== "not") return;
    const relation = formula.args[0];
    if (relation.kind !== "app" || relation.args.length !== 2) return;
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
    actOnHead((table, key) => removeElement(table, key, formula), formula);
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
  const addTrans = (formula: Expr) => {
    const leftHead = getHead(formula.args[0]);
    if (leftHead === undefined) return false;
    addElement(transLeft, getRelationKey(formula.symbol, leftHead), formula);
    const rightHead = getHead(formula.args[1]);
    if (rightHead === undefined) return false;
    addElement(transRight, getRelationKey(formula.symbol, rightHead), formula);
    return true;
  };

  const addNegTrans = (formula: Expr) => {
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
      ...getLatestFirst(unequalLeftRight, term).map((other) => enot(eapp("=", [term, other]))),
      ...getLatestFirst(unequalRightLeft, term).map((other) => enot(eapp("=", [other, term]))),
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

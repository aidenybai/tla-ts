// Ported from Isabelle2025's Pure/term_ord.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.

import { fastIndexnameOrd, fastStringOrd, indexnameOrd } from "./table";
import { mkType, sizeOfTerm, type Term, type Typ } from "./term";

const intOrd = (left: number, right: number) => (left < right ? -1 : left > right ? 1 : 0);

const dictOrd = <Item>(
  ord: (left: Item, right: Item) => number,
  left: readonly Item[],
  right: readonly Item[],
) => {
  for (let index = 0; ; index += 1) {
    if (index === left.length) return index === right.length ? 0 : -1;
    if (index === right.length) return 1;
    const order = ord(left[index], right[index]);
    if (order !== 0) return order;
  }
};

const sortOrd = (left: readonly string[], right: readonly string[]) =>
  dictOrd(fastStringOrd, left, right);

const typConsNr = (type: Typ) => (type.kind === "TVar" ? 0 : type.kind === "TFree" ? 1 : 2);

export const typOrd = (left: Typ, right: Typ): number => {
  if (left === right) return 0;
  if (left.kind === "Type" && right.kind === "Type") {
    const order = fastStringOrd(left.name, right.name);
    return order !== 0 ? order : dictOrd(typOrd, left.args, right.args);
  }
  if (left.kind === "TFree" && right.kind === "TFree") {
    const order = fastStringOrd(left.name, right.name);
    return order !== 0 ? order : sortOrd(left.sort, right.sort);
  }
  if (left.kind === "TVar" && right.kind === "TVar") {
    const order = fastIndexnameOrd(left, right);
    return order !== 0 ? order : sortOrd(left.sort, right.sort);
  }
  return intOrd(typConsNr(left), typConsNr(right));
};

const termConsNr = (term: Term) =>
  ({ Const: 0, Free: 1, Var: 2, Bound: 3, Abs: 4, App: 5 })[term.kind];

const structOrd = (left: Term, right: Term): number => {
  if (left === right) return 0;
  if (left.kind === "Abs" && right.kind === "Abs") return structOrd(left.body, right.body);
  if (left.kind === "App" && right.kind === "App") {
    const order = structOrd(left.fun, right.fun);
    return order !== 0 ? order : structOrd(left.arg, right.arg);
  }
  return intOrd(termConsNr(left), termConsNr(right));
};

const atomsOrd = (left: Term, right: Term): number => {
  if (left === right) return 0;
  if (left.kind === "Abs" && right.kind === "Abs") return atomsOrd(left.body, right.body);
  if (left.kind === "App" && right.kind === "App") {
    const order = atomsOrd(left.fun, right.fun);
    return order !== 0 ? order : atomsOrd(left.arg, right.arg);
  }
  if (left.kind === "Const" && right.kind === "Const") return fastStringOrd(left.name, right.name);
  if (left.kind === "Free" && right.kind === "Free") return fastStringOrd(left.name, right.name);
  if (left.kind === "Var" && right.kind === "Var") return fastIndexnameOrd(left, right);
  if (left.kind === "Bound" && right.kind === "Bound") return intOrd(left.index, right.index);
  return 0;
};

const typesOrd = (left: Term, right: Term): number => {
  if (left === right) return 0;
  if (left.kind === "Abs" && right.kind === "Abs") {
    const order = typOrd(left.type, right.type);
    return order !== 0 ? order : typesOrd(left.body, right.body);
  }
  if (left.kind === "App" && right.kind === "App") {
    const order = typesOrd(left.fun, right.fun);
    return order !== 0 ? order : typesOrd(left.arg, right.arg);
  }
  if (
    (left.kind === "Const" && right.kind === "Const") ||
    (left.kind === "Free" && right.kind === "Free") ||
    (left.kind === "Var" && right.kind === "Var")
  )
    return typOrd(left.type, right.type);
  return 0;
};

// Term_Ord.fast_term_ord
export const fastTermOrd = (left: Term, right: Term) => {
  const struct = structOrd(left, right);
  if (struct !== 0) return struct;
  const atoms = atomsOrd(left, right);
  return atoms !== 0 ? atoms : typesOrd(left, right);
};

const hdDepth = (term: Term): [Term, number] => {
  let current = term;
  let depth = 0;
  while (current.kind === "App") {
    current = current.fun;
    depth += 1;
  }
  return [current, depth];
};

const dummyT = mkType("dummy");

const destHd = (term: Term): [{ name: string; index: number }, Typ, number] => {
  switch (term.kind) {
    case "Const":
      return [{ name: term.name, index: 0 }, term.type, 0];
    case "Free":
      return [{ name: term.name, index: 0 }, term.type, 1];
    case "Var":
      return [{ name: term.name, index: term.index }, term.type, 2];
    case "Bound":
      return [{ name: "", index: term.index }, dummyT, 3];
    case "Abs":
      return [{ name: "", index: 0 }, term.type, 4];
    case "App":
      return [{ name: "", index: 0 }, dummyT, 5];
  }
};

const hdOrd = (left: Term, right: Term) => {
  const [leftName, leftType, leftNr] = destHd(left);
  const [rightName, rightType, rightNr] = destHd(right);
  const name = indexnameOrd(leftName, rightName);
  if (name !== 0) return name;
  const type = typOrd(leftType, rightType);
  return type !== 0 ? type : intOrd(leftNr, rightNr);
};

const argsOrd = (left: Term, right: Term): number => {
  if (left.kind === "App" && right.kind === "App") {
    const order = argsOrd(left.fun, right.fun);
    return order !== 0 ? order : termOrd(left.arg, right.arg);
  }
  return 0;
};

// Term_Ord.term_ord: a linear well-founded AC-compatible order for ordered rewriting.
export const termOrd = (left: Term, right: Term): number => {
  if (left === right) return 0;
  if (left.kind === "Abs" && right.kind === "Abs") {
    const order = termOrd(left.body, right.body);
    return order !== 0 ? order : typOrd(left.type, right.type);
  }
  const size = intOrd(sizeOfTerm(left), sizeOfTerm(right));
  if (size !== 0) return size;
  const [leftHead, leftDepth] = hdDepth(left);
  const [rightHead, rightDepth] = hdDepth(right);
  const head = hdOrd(leftHead, rightHead);
  if (head !== 0) return head;
  const depth = intOrd(leftDepth, rightDepth);
  return depth !== 0 ? depth : argsOrd(left, right);
};

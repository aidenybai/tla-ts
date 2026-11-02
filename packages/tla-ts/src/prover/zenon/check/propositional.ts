// The checks of Zenon's rules for connectives, quantifiers and the cut.

import type { PlainRuleName } from "../proof";
import {
  and,
  equiv,
  expectKind,
  expectNot,
  FALSE,
  imply,
  instantiate,
  not,
  or,
  term,
  TRUE,
  type SpecTable,
  type Term,
} from "./terms";

const getConjuncts = (formula: Term): Term[] => {
  if (formula.kind === "and") return formula.args.flatMap(getConjuncts);
  if (formula.kind !== "not") return [formula];
  const operand = formula.args[0];
  if (operand.kind === "or") return operand.args.flatMap((inner) => getConjuncts(not(inner)));
  if (operand.kind === "imply")
    return [...getConjuncts(operand.args[0]), ...getConjuncts(not(operand.args[1]))];
  if (operand.kind === "not") return getConjuncts(operand.args[0]);
  return [formula];
};

const getDisjuncts = (formula: Term): Term[] => {
  if (formula.kind === "or") return formula.args.flatMap(getDisjuncts);
  if (formula.kind === "imply")
    return [...getDisjuncts(not(formula.args[0])), ...getDisjuncts(formula.args[1])];
  if (formula.kind !== "not") return [formula];
  const operand = formula.args[0];
  if (operand.kind === "and") return operand.args.flatMap((inner) => getDisjuncts(not(inner)));
  if (operand.kind === "not") return getDisjuncts(operand.args[0]);
  return [formula];
};

// The witness of an existential: Hilbert's epsilon of its body.
const getWitness = (exists: Term) => instantiate(exists, term("tau", exists.symbol, exists.args));

export const PROPOSITIONAL_RULES = {
  close: (args) => ({ premises: [args[0], not(args[0])], branches: [] }),
  false: () => ({ premises: [FALSE], branches: [] }),
  not_true: () => ({ premises: [not(TRUE)], branches: [] }),
  conj_tree: (args) => ({ premises: [args[0]], branches: [getConjuncts(args[0])] }),
  disj_tree: (args) => ({
    premises: [args[0]],
    branches: getDisjuncts(args[0]).map((inner) => [inner]),
  }),
  and: (args) => ({ premises: [and(args[0], args[1])], branches: [[args[0], args[1]]] }),
  not_not: (args) => ({ premises: [not(not(args[0]))], branches: [[args[0]]] }),
  not_or: (args) => ({
    premises: [not(or(args[0], args[1]))],
    branches: [[not(args[0]), not(args[1])]],
  }),
  not_impl: (args) => ({
    premises: [not(imply(args[0], args[1]))],
    branches: [[args[0], not(args[1])]],
  }),
  or: (args) => ({ premises: [or(args[0], args[1])], branches: [[args[0]], [args[1]]] }),
  impl: (args) => ({ premises: [imply(args[0], args[1])], branches: [[not(args[0])], [args[1]]] }),
  equiv: (args) => ({
    premises: [equiv(args[0], args[1])],
    branches: [
      [not(args[0]), not(args[1])],
      [args[0], args[1]],
    ],
  }),
  not_and: (args) => ({
    premises: [not(and(args[0], args[1]))],
    branches: [[not(args[0])], [not(args[1])]],
  }),
  not_equiv: (args) => ({
    premises: [not(equiv(args[0], args[1]))],
    branches: [
      [not(args[0]), args[1]],
      [args[0], not(args[1])],
    ],
  }),
  ex: (args) => {
    expectKind(args[0], "ex");
    return { premises: [args[0]], branches: [[getWitness(args[0])]] };
  },
  not_all_ex: (args) => {
    const forAll = expectNot(args[0]);
    expectKind(forAll, "all");
    const negated = term("ex", forAll.symbol, [forAll.args[0], not(forAll.args[1])]);
    return { premises: [args[0]], branches: [[getWitness(negated), negated]] };
  },
  all: (args) => {
    expectKind(args[0], "all");
    return { premises: [args[0]], branches: [[instantiate(args[0], args[1])]] };
  },
  not_ex: (args) => {
    const exists = expectNot(args[0]);
    expectKind(exists, "ex");
    return { premises: [args[0]], branches: [[not(instantiate(exists, args[1]))]] };
  },
  cut: (args) => ({ premises: [], branches: [[args[0]], [not(args[0])]] }),
} satisfies Partial<SpecTable<PlainRuleName>>;

// The checks of the TLA+ extension's rules for booleans, CHOOSE, natural numbers, bounded
// quantifiers and equal propositions, after the lemmas in Zenon.thy that justify them.

import type { PlainRuleName } from "../proof";
import {
  ensure,
  equal,
  equiv,
  expectApp,
  expectNot,
  instantiate,
  isVariable,
  member,
  not,
  term,
  type RuleSpec,
  type SpecTable,
  type Term,
} from "./terms";

// From P and a = b, or ~P and a = b, where P is one side: P differs from that side, or the other
// side holds.
const getPropositionEqualitySpec = (
  args: Term[],
  isNegated: boolean,
  isLeft: boolean,
): RuleSpec => {
  const proposition = isNegated ? expectNot(args[0]) : args[0];
  const sides = expectApp(args[1], "=", 2);
  const matched = isLeft ? sides[0] : sides[1];
  const other = isLeft ? sides[1] : sides[0];
  return {
    premises: [args[0], args[1]],
    branches: [[not(equal(proposition, matched))], [isNegated ? not(other) : other]],
  };
};

export const TLA_RULES = {
  eq_x_true: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(sides[1].kind === "true");
    return { premises: [args[0]], branches: [[sides[0]]] };
  },
  eq_true_x: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(sides[0].kind === "true");
    return { premises: [args[0]], branches: [[sides[1]]] };
  },
  noteq_x_true: (args) => {
    const sides = expectApp(expectNot(args[0]), "=", 2);
    ensure(sides[1].kind === "true");
    return { premises: [args[0]], branches: [[not(sides[0])]] };
  },
  noteq_true_x: (args) => {
    const sides = expectApp(expectNot(args[0]), "=", 2);
    ensure(sides[0].kind === "true");
    return { premises: [args[0]], branches: [[not(sides[1])]] };
  },
  eq_x_false: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(sides[1].kind === "false");
    return { premises: [args[0]], branches: [[not(sides[0])]] };
  },
  eq_false_x: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(sides[0].kind === "false");
    return { premises: [args[0]], branches: [[not(sides[1])]] };
  },
  choose_diff_choose: (args, checker) => {
    const left = args[2];
    const right = args[3];
    ensure(left.kind === "lam" && right.kind === "lam" && left.symbol === right.symbol);
    const choice = (lambda: Term) => term("tau", lambda.symbol, lambda.args);
    ensure(checker.isSame(args[0], not(equal(choice(left), choice(right)))));
    const differ = checker.bind("ex", left.symbol, (bound) =>
      not(equiv(instantiate(left, bound), instantiate(right, bound))),
    );
    return { premises: [args[0]], branches: [[differ]] };
  },
  // Zenon writes ~(P <=> Q) as $notequiv(P, Q).
  notequivdef: (_args, _checker, uses) => {
    ensure(uses.length === 1);
    const sides = expectApp(uses[0], "$notequiv", 2);
    return { premises: [uses[0]], branches: [[not(equiv(sides[0], sides[1]))]] };
  },
  notequalchoose: (args) => {
    const predicate = args[3];
    ensure(predicate.kind === "lam");
    const exists = term("ex", predicate.symbol, predicate.args);
    return {
      premises: [],
      branches: [[exists], [not(exists), not(instantiate(predicate, args[4]))]],
    };
  },
  in_nat_0: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    ensure(isVariable(sides[0], "0") && isVariable(sides[1], "arith.N"));
    return { premises: [args[0]], branches: [] };
  },
  in_nat_succ: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    const successor = expectApp(sides[0], "TLA.fapply", 2);
    ensure(isVariable(successor[0], "TLA.Succ") && isVariable(sides[1], "arith.N"));
    return { premises: [args[0]], branches: [[not(member(successor[1], sides[1]))]] };
  },
  box_p: (args) => ({ premises: [args[0]], branches: [[expectApp(args[0], "TLA.box", 1)[0]]] }),
  all_in: (args, checker) => {
    const bounded = expectApp(args[0], "TLA.bAll", 2);
    const sides = expectApp(args[1], "TLA.in", 2);
    ensure(checker.isSame(bounded[0], sides[1]) && bounded[1].kind === "lam");
    return { premises: [args[0], args[1]], branches: [[instantiate(bounded[1], sides[0])]] };
  },
  notex_in: (args, checker) => {
    const bounded = expectApp(expectNot(args[0]), "TLA.bEx", 2);
    const sides = expectApp(args[1], "TLA.in", 2);
    ensure(checker.isSame(bounded[0], sides[1]) && bounded[1].kind === "lam");
    return {
      premises: [args[0], args[1]],
      branches: [[not(instantiate(bounded[1], sides[0]))]],
    };
  },
  p_eq_l: (args) => getPropositionEqualitySpec(args, false, true),
  p_eq_r: (args) => getPropositionEqualitySpec(args, false, false),
  np_eq_l: (args) => getPropositionEqualitySpec(args, true, true),
  np_eq_r: (args) => getPropositionEqualitySpec(args, true, false),
} satisfies Partial<SpecTable<PlainRuleName>>;

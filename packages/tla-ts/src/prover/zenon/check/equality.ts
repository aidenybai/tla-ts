// The checks of Zenon's rules for equality, strings and the relations that the hypotheses make
// reflexive, symmetric or transitive.

import type { PlainRuleName, Rule, RelationRuleName } from "../proof";
import {
  app,
  ensure,
  equal,
  expectApp,
  expectKind,
  expectNot,
  getStringText,
  instantiate,
  not,
  type Checker,
  type RuleSpec,
  type SpecTable,
  type Term,
} from "./terms";

const relate = (symbol: string, left: Term, right: Term) => app(symbol, [left, right]);

// The two branches that the relation fails to link and the ends differ. The ends come from
// r(a, b) and ~r(c, d) in the order that Zenon's Trans or Trans_sym takes them.
const getTransitivitySpec = (
  checker: Checker,
  args: [Term, Term],
  isSymmetric: boolean,
): RuleSpec => {
  const negated = expectNot(args[1]);
  const symbol = negated.symbol;
  const positive = expectApp(args[0], symbol, 2);
  const negative = expectApp(negated, symbol, 2);
  checker.ensureRelation(symbol, isSymmetric ? ["transitive", "symmetric"] : ["transitive"]);
  const left = positive[0];
  const right = positive[1];
  const negatedLeft = negative[0];
  const negatedRight = negative[1];
  const ends = isSymmetric
    ? [negatedRight, left, right, negatedLeft]
    : [negatedLeft, left, right, negatedRight];
  return {
    premises: [args[0], args[1]],
    branches: [
      [not(equal(ends[0], ends[1])), not(relate(symbol, ends[0], ends[1]))],
      [not(equal(ends[2], ends[3])), not(relate(symbol, ends[2], ends[3]))],
    ],
  };
};

// a = b against ~r(c, d), in the order of Zenon's TransEq, TransEq_sym or TransEq2.
const getTransitiveEqualitySpec = (
  checker: Checker,
  args: [Term, Term, Term],
  order: "trans_eq" | "trans_eq_sym" | "trans_eq2",
): RuleSpec => {
  const left = args[0];
  const right = args[1];
  const negated = expectNot(args[2]);
  const symbol = negated.symbol;
  const negative = expectApp(negated, symbol, 2);
  checker.ensureRelation(
    symbol,
    order === "trans_eq_sym" ? ["transitive", "symmetric"] : ["transitive"],
  );
  const negatedLeft = negative[0];
  const negatedRight = negative[1];
  const ends =
    order === "trans_eq"
      ? [negatedLeft, left, right, negatedRight]
      : order === "trans_eq_sym"
        ? [negatedRight, left, right, negatedLeft]
        : [negatedLeft, right, left, negatedRight];
  const first = not(relate(symbol, ends[0], ends[1]));
  const second = not(relate(symbol, ends[2], ends[3]));
  return {
    premises: [equal(left, right), args[2]],
    branches: [
      [not(equal(ends[0], ends[1])), first],
      [first, second],
      [not(equal(ends[2], ends[3])), second],
    ],
  };
};

// Of t1 = s1 and t2 = s2 with distinct strings s1 and s2, in the order of the rule's sides.
const getStringDifferenceSpec = (args: Term[], sides: "ll" | "lr" | "rl" | "rr"): RuleSpec => {
  const term1 = args[0];
  const string1 = args[1];
  const term2 = args[2];
  const string2 = args[3];
  ensure(getStringText(string1) !== getStringText(string2));
  return {
    premises: [
      sides[0] === "l" ? equal(term1, string1) : equal(string1, term1),
      sides[1] === "l" ? equal(term2, string2) : equal(string2, term2),
    ],
    branches: [[not(equal(term1, term2))]],
  };
};

// Of f(a1, ..., an) and ~g(b1, ..., bn) with f and g the same: some argument differs.
const getArgumentsDifferSpec = (premises: Term[], left: Term, right: Term): RuleSpec => {
  const leftArgs = expectKind(left, "app");
  const rightArgs = expectKind(right, "app");
  ensure(left.symbol === right.symbol && leftArgs.length === rightArgs.length);
  return {
    premises,
    branches: leftArgs.map((inner, index) => [not(equal(inner, rightArgs[index]))]),
  };
};

export const EQUALITY_RULES = {
  not_equal: (args) => getArgumentsDifferSpec([not(equal(args[0], args[1]))], args[0], args[1]),
  p_not_p: (args) => getArgumentsDifferSpec([args[0], args[1]], args[0], expectNot(args[1])),
  trans: (args, checker) => getTransitivitySpec(checker, args, false),
  trans_sym: (args, checker) => getTransitivitySpec(checker, args, true),
  trans_eq: (args, checker) => getTransitiveEqualitySpec(checker, args, "trans_eq"),
  trans_eq_sym: (args, checker) => getTransitiveEqualitySpec(checker, args, "trans_eq_sym"),
  trans_eq2: (args, checker) => getTransitiveEqualitySpec(checker, args, "trans_eq2"),
  congruence_lr: (args) => {
    ensure(args[0].kind === "lam");
    return {
      premises: [instantiate(args[0], args[1]), equal(args[1], args[2])],
      branches: [[instantiate(args[0], args[2])]],
    };
  },
  congruence_rl: (args) => {
    ensure(args[0].kind === "lam");
    return {
      premises: [instantiate(args[0], args[1]), equal(args[2], args[1])],
      branches: [[instantiate(args[0], args[2])]],
    };
  },
  stringequal: (args) => {
    ensure(getStringText(app("$string", [args[0]])) !== getStringText(app("$string", [args[1]])));
    return {
      premises: [equal(app("$string", [args[0]]), app("$string", [args[1]]))],
      branches: [],
    };
  },
  stringdiffll: (args) => getStringDifferenceSpec(args, "ll"),
  stringdifflr: (args) => getStringDifferenceSpec(args, "lr"),
  stringdiffrl: (args) => getStringDifferenceSpec(args, "rl"),
  stringdiffrr: (args) => getStringDifferenceSpec(args, "rr"),
} satisfies Partial<SpecTable<PlainRuleName>>;

export const getRelationRuleSpec = (
  rule: Extract<Rule<Term>, { name: RelationRuleName }>,
  checker: Checker,
): RuleSpec => {
  const symbol = rule.relation;
  switch (rule.name) {
    case "close_refl":
      checker.ensureRelation(symbol, ["reflexive"]);
      return { premises: [not(relate(symbol, rule.args[0], rule.args[0]))], branches: [] };
    case "close_sym":
      checker.ensureRelation(symbol, ["symmetric"]);
      return {
        premises: [
          relate(symbol, rule.args[0], rule.args[1]),
          not(relate(symbol, rule.args[1], rule.args[0])),
        ],
        branches: [],
      };
    case "refl":
      checker.ensureRelation(symbol, ["reflexive"]);
      return {
        premises: [not(relate(symbol, rule.args[0], rule.args[1]))],
        branches: [[not(equal(rule.args[0], rule.args[1]))]],
      };
    case "p_not_p_sym": {
      checker.ensureRelation(symbol, ["symmetric"]);
      const left = expectApp(rule.args[0], symbol, 2);
      const right = expectApp(expectNot(rule.args[1]), symbol, 2);
      return {
        premises: [rule.args[0], rule.args[1]],
        branches: [[not(equal(left[1], right[0]))], [not(equal(left[0], right[1]))]],
      };
    }
  }
};

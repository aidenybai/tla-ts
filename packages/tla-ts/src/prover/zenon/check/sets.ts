// The checks of the TLA+ extension's rules for set membership, set equality and subsets, after the
// lemmas in Zenon.thy that justify them.

import type { PlainRuleName } from "../proof";
import {
  and,
  app,
  ensure,
  equal,
  equiv,
  expectApp,
  expectNot,
  fapply,
  imply,
  instantiate,
  isApp,
  isVariable,
  member,
  not,
  domain,
  type Checker,
  type RuleSpec,
  type SpecTable,
  type Term,
} from "./terms";

const getMembershipSpec = (
  formula: Term,
  isNegated: boolean,
  constructor: string,
  arity: number,
) => {
  const atom = isNegated ? expectNot(formula) : formula;
  const sides = expectApp(atom, "TLA.in", 2);
  return { element: sides[0], operands: expectApp(sides[1], constructor, arity), set: sides[1] };
};

const getSetEqualSpec = (formula: Term, isNegated: boolean, checker: Checker): RuleSpec => {
  const sides = expectApp(isNegated ? expectNot(formula) : formula, "=", 2);
  const extensional = checker.bind("all", "", (bound) =>
    equiv(member(bound, sides[0]), member(bound, sides[1])),
  );
  return { premises: [formula], branches: [[isNegated ? not(extensional) : extensional]] };
};

export const SET_RULES = {
  in_emptyset: (args) => {
    ensure(isVariable(expectApp(args[0], "TLA.in", 2)[1], "TLA.emptyset"));
    return { premises: [args[0]], branches: [] };
  },
  in_upair: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.upair", 2);
    return {
      premises: [args[0]],
      branches: spec.operands.map((inner) => [equal(spec.element, inner)]),
    };
  },
  notin_upair: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.upair", 2);
    return {
      premises: [args[0]],
      branches: [spec.operands.map((inner) => not(equal(spec.element, inner)))],
    };
  },
  in_addElt: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.addElt", 2);
    const branches: Term[][] = [];
    let rest = spec.set;
    while (isApp(rest, "TLA.addElt", 2)) {
      branches.push([equal(spec.element, rest.args[0])]);
      rest = rest.args[1];
    }
    return {
      premises: [args[0]],
      branches: isVariable(rest, "TLA.emptyset")
        ? branches
        : [...branches, [member(spec.element, rest)]],
    };
  },
  notin_addElt: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.addElt", 2);
    const formulas: Term[] = [];
    let rest = spec.set;
    while (isApp(rest, "TLA.addElt", 2)) {
      formulas.push(not(equal(spec.element, rest.args[0])));
      rest = rest.args[1];
    }
    if (!isVariable(rest, "TLA.emptyset")) formulas.push(not(member(spec.element, rest)));
    return { premises: [args[0]], branches: [formulas] };
  },
  in_set: (args) => {
    const sides = expectApp(args[0], "TLA.in", 2);
    const elements = expectApp(sides[1], "TLA.set");
    return { premises: [args[0]], branches: elements.map((inner) => [equal(sides[0], inner)]) };
  },
  notin_set: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    const elements = expectApp(sides[1], "TLA.set");
    return {
      premises: [args[0]],
      branches: [elements.map((inner) => not(equal(sides[0], inner)))],
    };
  },
  in_SUBSET: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.SUBSET", 1);
    return {
      premises: [args[0]],
      branches: [[app("TLA.subseteq", [spec.element, spec.operands[0]])]],
    };
  },
  notin_SUBSET: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.SUBSET", 1);
    return {
      premises: [args[0]],
      branches: [[not(app("TLA.subseteq", [spec.element, spec.operands[0]]))]],
    };
  },
  in_UNION: (args, checker) => {
    const spec = getMembershipSpec(args[0], false, "TLA.UNION", 1);
    const exists = checker.bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), member(spec.element, bound)),
    );
    return { premises: [args[0]], branches: [[exists]] };
  },
  notin_UNION: (args, checker) => {
    const spec = getMembershipSpec(args[0], true, "TLA.UNION", 1);
    const exists = checker.bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), member(spec.element, bound)),
    );
    return { premises: [args[0]], branches: [[not(exists)]] };
  },
  in_cup: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.cup", 2);
    return {
      premises: [args[0]],
      branches: spec.operands.map((inner) => [member(spec.element, inner)]),
    };
  },
  notin_cup: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.cup", 2);
    return {
      premises: [args[0]],
      branches: [spec.operands.map((inner) => not(member(spec.element, inner)))],
    };
  },
  in_cap: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.cap", 2);
    return {
      premises: [args[0]],
      branches: [spec.operands.map((inner) => member(spec.element, inner))],
    };
  },
  notin_cap: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.cap", 2);
    return {
      premises: [args[0]],
      branches: spec.operands.map((inner) => [not(member(spec.element, inner))]),
    };
  },
  in_setminus: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.setminus", 2);
    return {
      premises: [args[0]],
      branches: [
        [member(spec.element, spec.operands[0]), not(member(spec.element, spec.operands[1]))],
      ],
    };
  },
  notin_setminus: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.setminus", 2);
    return {
      premises: [args[0]],
      branches: [
        [not(member(spec.element, spec.operands[0]))],
        [member(spec.element, spec.operands[1])],
      ],
    };
  },
  in_subsetof: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.subsetOf", 2);
    const predicate = spec.operands[1];
    ensure(predicate.kind === "lam");
    return {
      premises: [args[0]],
      branches: [[member(spec.element, spec.operands[0]), instantiate(predicate, spec.element)]],
    };
  },
  notin_subsetof: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.subsetOf", 2);
    const predicate = spec.operands[1];
    ensure(predicate.kind === "lam");
    return {
      premises: [args[0]],
      branches: [
        [not(member(spec.element, spec.operands[0]))],
        [not(instantiate(predicate, spec.element))],
      ],
    };
  },
  in_setofall: (args, checker) => {
    const spec = getMembershipSpec(args[0], false, "TLA.setOfAll", 2);
    const mapping = spec.operands[1];
    ensure(mapping.kind === "lam");
    const exists = checker.bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), equal(spec.element, instantiate(mapping, bound))),
    );
    return { premises: [args[0]], branches: [[exists]] };
  },
  notin_setofall: (args, checker) => {
    const spec = getMembershipSpec(args[0], true, "TLA.setOfAll", 2);
    const mapping = spec.operands[1];
    ensure(mapping.kind === "lam");
    const exists = checker.bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), equal(spec.element, instantiate(mapping, bound))),
    );
    return { premises: [args[0]], branches: [[not(exists)]] };
  },
  in_funcset: (args, checker) => {
    const spec = getMembershipSpec(args[0], false, "TLA.FuncSet", 2);
    const fcn = spec.element;
    const maps = checker.bind("all", "", (bound) =>
      imply(member(bound, spec.operands[0]), member(fapply(fcn, bound), spec.operands[1])),
    );
    return {
      premises: [args[0]],
      branches: [[app("TLA.isAFcn", [fcn]), equal(domain(fcn), spec.operands[0]), maps]],
    };
  },
  notin_funcset: (args, checker) => {
    const spec = getMembershipSpec(args[0], true, "TLA.FuncSet", 2);
    const fcn = spec.element;
    const maps = checker.bind("all", "", (bound) =>
      imply(member(bound, spec.operands[0]), member(fapply(fcn, bound), spec.operands[1])),
    );
    return {
      premises: [args[0]],
      branches: [
        [not(app("TLA.isAFcn", [fcn]))],
        [not(equal(domain(fcn), spec.operands[0]))],
        [not(maps)],
      ],
    };
  },
  except_notin_funcset: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.FuncSet", 2);
    const except = expectApp(spec.element, "TLA.except", 3);
    return {
      premises: [args[0]],
      branches: [[not(member(except[0], spec.set))], [not(member(except[2], spec.operands[1]))]],
    };
  },
  setequalempty: (args, checker) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(isVariable(sides[1], "TLA.emptyset"));
    return {
      premises: [args[0]],
      branches: [[checker.bind("all", "", (bound) => not(member(bound, sides[0])))]],
    };
  },
  setemptyequal: (args, checker) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(isVariable(sides[0], "TLA.emptyset"));
    return {
      premises: [args[0]],
      branches: [[checker.bind("all", "", (bound) => not(member(bound, sides[1])))]],
    };
  },
  setequal: (args, checker) => getSetEqualSpec(args[0], false, checker),
  notsetequal: (args, checker) => getSetEqualSpec(args[0], true, checker),
  cup_subseteq: (args) => {
    const sides = expectApp(args[0], "TLA.subseteq", 2);
    const union = expectApp(sides[0], "TLA.cup", 2);
    return {
      premises: [args[0]],
      branches: [union.map((inner) => app("TLA.subseteq", [inner, sides[1]]))],
    };
  },
  not_cup_subseteq: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.subseteq", 2);
    const union = expectApp(sides[0], "TLA.cup", 2);
    return {
      premises: [args[0]],
      branches: union.map((inner) => [not(app("TLA.subseteq", [inner, sides[1]]))]),
    };
  },
  subseteq_cap: (args) => {
    const sides = expectApp(args[0], "TLA.subseteq", 2);
    const intersection = expectApp(sides[1], "TLA.cap", 2);
    return {
      premises: [args[0]],
      branches: [intersection.map((inner) => app("TLA.subseteq", [sides[0], inner]))],
    };
  },
  not_subseteq_cap: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.subseteq", 2);
    const intersection = expectApp(sides[1], "TLA.cap", 2);
    return {
      premises: [args[0]],
      branches: intersection.map((inner) => [not(app("TLA.subseteq", [sides[0], inner]))]),
    };
  },
} satisfies Partial<SpecTable<PlainRuleName>>;

// An independent check of the proofs that the Zenon port finds. It shares no code with the search:
// formulas compare by their own alpha-equivalence, substitution and unfolding are rebuilt here, and
// each rule's branches come from the lemma that justifies the rule in tlapm's Zenon.thy rather than
// from the prover. The check walks the proof bottom up and computes the formulas each subproof
// needs. A proof is valid when every rule is one of the lemmas and the root needs only hypotheses.

import type { ExprKind } from "./expr";
import type { Proof } from "./node";
import type { Definition } from "./parse";

type TermKind = ExprKind | "subst";

// A formula as the checker sees it. The prover's expressions fit this shape. "subst" stands for
// its first argument with the variable named `symbol` replaced by its second argument.
interface Term {
  kind: TermKind;
  symbol: string;
  args: Term[];
}

interface RuleSpec {
  premises: Term[];
  branches: Term[][];
}

export interface CheckContext {
  hypotheses: Term[];
  definitions: Definition[];
}

let freshCount = 0;

const term = (kind: TermKind, symbol: string, args: Term[]): Term => ({ kind, symbol, args });
const variable = (name: string) => term("var", name, []);
const app = (symbol: string, args: Term[]) => term("app", symbol, args);
const not = (operand: Term) => term("not", "", [operand]);
const and = (left: Term, right: Term) => term("and", "", [left, right]);
const imply = (left: Term, right: Term) => term("imply", "", [left, right]);
const equiv = (left: Term, right: Term) => term("equiv", "", [left, right]);
const equal = (left: Term, right: Term) => app("=", [left, right]);
const member = (element: Term, set: Term) => app("TLA.in", [element, set]);
const fapply = (fcn: Term, argument: Term) => app("TLA.fapply", [fcn, argument]);
const domain = (fcn: Term) => app("TLA.DOMAIN", [fcn]);
const subst = (body: Term, name: string, value: Term) => term("subst", name, [body, value]);
const TRUE = term("true", "", []);
const FALSE = term("false", "", []);

// A binder whose variable can't clash with any name in the input.
const bind = (kind: "all" | "ex", type: string, build: (bound: Term) => Term) => {
  const bound = variable(`\u0000${freshCount++}`);
  return term(kind, type, [bound, build(bound)]);
};

// Instantiates the body of a binder with a term.
const instantiate = (binder: Term, value: Term) =>
  subst(binder.args[1], binder.args[0].symbol, value);

// What a variable stands for while printing a key: the depth of its binder, or a term substituted
// for it with the environment where the substitution was made. A substituted term prints where it
// lands, so its own binders get depths below the binders around it.
type Binding = number | { formula: Term; env: Env; operators?: Operators };

type Env = Map<string, Binding>;

type Operators = Map<string, Term>;

const freeNames = new WeakMap<Term, Set<string>>();

// The variables and applied symbols that a formula doesn't bind, which are the names an
// environment can change.
const getFreeNames = (formula: Term): Set<string> => {
  const cached = freeNames.get(formula);
  if (cached !== undefined) return cached;
  const names = new Set<string>();
  const bound =
    formula.kind === "subst"
      ? formula.symbol
      : formula.kind === "all" ||
          formula.kind === "ex" ||
          formula.kind === "tau" ||
          formula.kind === "lam"
        ? formula.args[0].symbol
        : undefined;
  if (formula.kind === "var" || formula.kind === "app") names.add(formula.symbol);
  if (formula.kind !== "meta")
    formula.args.forEach((inner, index) => {
      for (const name of getFreeNames(inner))
        if (name !== bound || (formula.kind === "subst" && index === 1)) names.add(name);
    });
  freeNames.set(formula, names);
  return names;
};

// A canonical text for a formula up to the names of bound variables: a bound variable prints as
// the number of binders between it and its own. `operators` replaces applied symbols, for
// definitions whose parameters are operators.
const getKey = (formula: Term, env: Env, depth: number, operators?: Operators): string => {
  for (const name of getFreeNames(formula))
    if (env.has(name) || operators?.has(name) === true)
      return getEnvKey(formula, env, depth, operators);
  return getTopKey(formula);
};

const getEnvKey = (formula: Term, env: Env, depth: number, operators?: Operators): string => {
  const recurse = (inner: Term) => getKey(inner, env, depth, operators);
  const named = (tag: string, name: string) => `${tag}${name.length}:${name}`;
  const without = (name: string) => {
    if (operators === undefined || !operators.has(name)) return operators;
    const inner = new Map(operators);
    inner.delete(name);
    return inner;
  };
  switch (formula.kind) {
    case "var": {
      const binding = env.get(formula.symbol);
      if (binding === undefined) return named("v", formula.symbol);
      if (typeof binding === "number") return `#${depth - binding}`;
      return getKey(binding.formula, binding.env, depth, binding.operators);
    }
    case "meta":
      return `m(${getTopKey(formula.args[0])})`;
    case "true":
      return "T";
    case "false":
      return "F";
    case "subst": {
      const inner = new Map(env);
      inner.set(formula.symbol, { formula: formula.args[1], env, operators });
      return getKey(formula.args[0], inner, depth, without(formula.symbol));
    }
    case "app": {
      const args = formula.args.map(recurse);
      if (formula.symbol === "$notequiv" && args.length === 2)
        return `~(equiv(${args[0]},${args[1]}))`;
      const operator = operators?.get(formula.symbol);
      if (operator === undefined) return `${named("a", formula.symbol)}(${args.join(",")})`;
      if (operator.kind === "lam" && args.length === 1) {
        const inner: Env = new Map([
          [operator.args[0].symbol, { formula: formula.args[0], env, operators }],
        ]);
        return getKey(operator.args[1], inner, depth);
      }
      if (operator.kind === "var") return `${named("a", operator.symbol)}(${args.join(",")})`;
      if (operator.kind === "app")
        return `${named("a", operator.symbol)}(${[
          ...operator.args.map((inner) => getKey(inner, new Map(), depth)),
          ...args,
        ].join(",")})`;
      throw new UncheckedError();
    }
    case "not":
      return `~(${recurse(formula.args[0])})`;
    case "and":
    case "or":
    case "imply":
    case "equiv":
      return `${formula.kind}(${recurse(formula.args[0])},${recurse(formula.args[1])})`;
    default: {
      const inner = new Map(env);
      inner.set(formula.args[0].symbol, depth);
      const body = getKey(formula.args[1], inner, depth + 1, without(formula.args[0].symbol));
      return `${formula.kind}${named("", formula.symbol)}{${body}}`;
    }
  }
};

// Raised inside a rule check to reject the proof.
class UncheckedError extends Error {}

const topKeys = new WeakMap<Term, string>();

const getTopKey = (formula: Term) => {
  const cached = topKeys.get(formula);
  if (cached !== undefined) return cached;
  // Keys count binders from the variable, so a formula's key doesn't depend on where it sits.
  const key = getEnvKey(formula, new Map(), 0);
  topKeys.set(formula, key);
  return key;
};

const isSame = (left: Term, right: Term) => getTopKey(left) === getTopKey(right);

const ensure: (condition: boolean) => asserts condition = (condition) => {
  if (!condition) throw new UncheckedError();
};

const isApp = (formula: Term, symbol: string, arity?: number) =>
  formula.kind === "app" &&
  formula.symbol === symbol &&
  (arity === undefined || formula.args.length === arity);

const expectApp = (formula: Term, symbol: string, arity?: number) => {
  ensure(isApp(formula, symbol, arity));
  return formula.args;
};

const expectKind = (formula: Term, kind: TermKind) => {
  ensure(formula.kind === kind);
  return formula.args;
};

const expectNot = (formula: Term) => expectKind(formula, "not")[0];

const isVariable = (formula: Term, name: string) =>
  formula.kind === "var" && formula.symbol === name;

// The text of a string literal. Escapes could spell one string two ways, so they don't count.
const getStringText = (formula: Term) => {
  ensure(isApp(formula, "$string", 1) && formula.args[0].kind === "var");
  const text = formula.args[0].symbol;
  ensure(!text.includes("\\"));
  return text;
};

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

const getPairs = (args: Term[]) => {
  ensure(args.length % 2 === 0);
  const pairs: [Term, Term][] = [];
  for (let index = 0; index < args.length; index += 2) pairs.push([args[index], args[index + 1]]);
  return pairs;
};

// A record's fields, whose labels must be distinct string literals.
const getFields = (record: Term) => {
  const fields = getPairs(expectApp(record, "TLA.record"));
  const labels = fields.map((field) => getStringText(field[0]));
  ensure(new Set(labels).size === labels.length);
  return fields;
};

const getRecordSetFields = (set: Term) => {
  const fields = getPairs(expectApp(set, "TLA.recordset"));
  const labels = fields.map((field) => getStringText(field[0]));
  ensure(new Set(labels).size === labels.length);
  return fields;
};

const makeNatural = (count: number) => {
  let result = variable("0");
  for (let index = 0; index < count; index++) result = fapply(variable("TLA.Succ"), result);
  return result;
};

const getNatural = (formula: Term): number => {
  let count = 0;
  let current = formula;
  while (isApp(current, "TLA.fapply", 2) && isVariable(current.args[0], "TLA.Succ")) {
    count++;
    current = current.args[1];
  }
  ensure(current.kind === "var" && /^(0|[1-9][0-9]*)$/.test(current.symbol));
  return count + Number(current.symbol);
};

// Checks that a branch formula lists exactly the formulas of a set, and returns them as branches.
const expectSameSet = (given: Term[], expected: Term[]) => {
  const keys = new Set(expected.map(getTopKey));
  ensure(given.length === keys.size && given.every((formula) => keys.has(getTopKey(formula))));
  return given.map((formula) => [formula]);
};

// The term that fills the hole of a context to give a formula, from `lambda` = (\x. context).
const getFilled = (lambda: Term, formula: Term) => {
  ensure(lambda.kind === "lam");
  const hole = lambda.args[0].symbol;
  const find = (context: Term, candidate: Term): Term | undefined => {
    if (context.kind === "var" && context.symbol === hole) return candidate;
    if (context.kind !== candidate.kind || context.symbol !== candidate.symbol) return undefined;
    if (context.args.length !== candidate.args.length) return undefined;
    if (context.kind !== "app" && context.kind !== "not") return undefined;
    for (let index = 0; index < context.args.length; index++) {
      const found = find(context.args[index], candidate.args[index]);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  const filled = find(lambda.args[1], formula);
  ensure(filled !== undefined);
  return filled;
};

const getRewriteSpec = (
  args: Term[],
  lambda: Term,
  build: (filled: Term) => Term[][],
): RuleSpec => {
  const filled = getFilled(lambda, args[0]);
  ensure(isSame(args[0], instantiate(lambda, filled)));
  return { premises: [args[0]], branches: build(filled) };
};

const getCaseBranches = (lambda: Term, args: Term[], condition: Term): Term[][] => {
  if (args.length === 0) return [[condition]];
  if (args.length === 1) return [[condition, instantiate(lambda, args[0])]];
  return [
    [args[0], instantiate(lambda, args[1])],
    ...getCaseBranches(lambda, args.slice(2), and(not(args[0]), condition)),
  ];
};

const getBoolCaseSpec = (args: Term[], isKind: (operand: Term) => boolean): RuleSpec => {
  const operand = expectApp(args[1], "=", 2)[0];
  ensure(isKind(operand));
  const lambda = args[5];
  const filled = getFilled(lambda, args[0]);
  ensure(isSame(filled, operand) && isSame(args[0], instantiate(lambda, operand)));
  return {
    premises: [args[0]],
    branches: [
      [equal(operand, TRUE), instantiate(lambda, TRUE)],
      [equal(operand, FALSE), instantiate(lambda, FALSE)],
    ],
  };
};

const BOOL_CASES: Record<string, (operand: Term) => boolean> = {
  boolcase_not: (operand) => operand.kind === "not",
  boolcase_and: (operand) => operand.kind === "and",
  boolcase_or: (operand) => operand.kind === "or",
  boolcase_imply: (operand) => operand.kind === "imply",
  boolcase_equiv: (operand) => operand.kind === "equiv",
  boolcase_equal: (operand) => isApp(operand, "=", 2),
  boolcase_all: (operand) => operand.kind === "all",
  boolcase_ex: (operand) => operand.kind === "ex",
};

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

const getSetEqualSpec = (args: Term[], isNegated: boolean): RuleSpec => {
  const sides = expectApp(isNegated ? expectNot(args[0]) : args[0], "=", 2);
  const extensional = bind("all", "", (bound) =>
    equiv(member(bound, sides[0]), member(bound, sides[1])),
  );
  return { premises: [args[0]], branches: [[isNegated ? not(extensional) : extensional]] };
};

// The rules of Zenon's TLA+ extension, after the lemmas in Zenon.thy that justify them.
const EXTENSION_RULES: Record<string, (args: Term[], uses: Term[]) => RuleSpec> = {
  stringequal: (args) => {
    ensure(getStringText(app("$string", [args[0]])) !== getStringText(app("$string", [args[1]])));
    return {
      premises: [equal(app("$string", [args[0]]), app("$string", [args[1]]))],
      branches: [],
    };
  },
  ...Object.fromEntries(
    (["ll", "lr", "rl", "rr"] as const).map((sides) => [
      `stringdiff${sides}`,
      (args: Term[]): RuleSpec => {
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
      },
    ]),
  ),
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
  in_UNION: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.UNION", 1);
    const exists = bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), member(spec.element, bound)),
    );
    return { premises: [args[0]], branches: [[exists]] };
  },
  notin_UNION: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.UNION", 1);
    const exists = bind("ex", "", (bound) =>
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
  in_setofall: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.setOfAll", 2);
    const mapping = spec.operands[1];
    ensure(mapping.kind === "lam");
    const exists = bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), equal(spec.element, instantiate(mapping, bound))),
    );
    return { premises: [args[0]], branches: [[exists]] };
  },
  notin_setofall: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.setOfAll", 2);
    const mapping = spec.operands[1];
    ensure(mapping.kind === "lam");
    const exists = bind("ex", "", (bound) =>
      and(member(bound, spec.operands[0]), equal(spec.element, instantiate(mapping, bound))),
    );
    return { premises: [args[0]], branches: [[not(exists)]] };
  },
  in_funcset: (args) => {
    const spec = getMembershipSpec(args[0], false, "TLA.FuncSet", 2);
    const fcn = spec.element;
    const maps = bind("all", "", (bound) =>
      imply(member(bound, spec.operands[0]), member(fapply(fcn, bound), spec.operands[1])),
    );
    return {
      premises: [args[0]],
      branches: [[app("TLA.isAFcn", [fcn]), equal(domain(fcn), spec.operands[0]), maps]],
    };
  },
  notin_funcset: (args) => {
    const spec = getMembershipSpec(args[0], true, "TLA.FuncSet", 2);
    const fcn = spec.element;
    const maps = bind("all", "", (bound) =>
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
  setequalempty: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(isVariable(sides[1], "TLA.emptyset"));
    return {
      premises: [args[0]],
      branches: [[bind("all", "", (bound) => not(member(bound, sides[0])))]],
    };
  },
  setemptyequal: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(isVariable(sides[0], "TLA.emptyset"));
    return {
      premises: [args[0]],
      branches: [[bind("all", "", (bound) => not(member(bound, sides[1])))]],
    };
  },
  setequal: (args) => getSetEqualSpec(args, false),
  notsetequal: (args) => getSetEqualSpec(args, true),
  notisafcn_fcn: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isAFcn", 1)[0], "TLA.Fcn", 2);
    return { premises: [args[0]], branches: [] };
  },
  notisafcn_except: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isAFcn", 1)[0], "TLA.except", 3);
    return { premises: [args[0]], branches: [] };
  },
  notisafcn_onearg: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isAFcn", 1)[0], "TLA.oneArg", 2);
    return { premises: [args[0]], branches: [] };
  },
  notisafcn_extend: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isAFcn", 1)[0], "TLA.extend", 2);
    return { premises: [args[0]], branches: [] };
  },
  funequal: (args) => {
    const sides = expectApp(args[0], "=", 2);
    const left = sides[0];
    const right = sides[1];
    const result = and(
      and(
        equiv(app("TLA.isAFcn", [left]), app("TLA.isAFcn", [right])),
        equal(domain(left), domain(right)),
      ),
      bind("all", "", (bound) => equal(fapply(left, bound), fapply(right, bound))),
    );
    return { premises: [args[0]], branches: [[result]] };
  },
  notfunequal: (args) => {
    const sides = expectApp(expectNot(args[0]), "=", 2);
    const left = sides[0];
    const right = sides[1];
    const result = not(
      and(
        and(
          and(app("TLA.isAFcn", [left]), app("TLA.isAFcn", [right])),
          equal(domain(left), domain(right)),
        ),
        bind("all", "", (bound) =>
          imply(member(bound, domain(right)), equal(fapply(left, bound), fapply(right, bound))),
        ),
      ),
    );
    return { premises: [args[0]], branches: [[result]] };
  },
  choose_diff_choose: (args) => {
    const left = args[2];
    const right = args[3];
    ensure(left.kind === "lam" && right.kind === "lam" && left.symbol === right.symbol);
    const choice = (lambda: Term) => term("tau", lambda.symbol, lambda.args);
    ensure(isSame(args[0], not(equal(choice(left), choice(right)))));
    const differ = bind("ex", left.symbol, (bound) =>
      not(equiv(instantiate(left, bound), instantiate(right, bound))),
    );
    return { premises: [args[0]], branches: [[differ]] };
  },
  // Zenon writes ~(P <=> Q) as $notequiv(P, Q).
  notequivdef: (_args, uses) => {
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
  tuple_eq_match: (args) => {
    const sides = expectApp(args[0], "=", 2);
    const left = expectApp(sides[0], "TLA.tuple");
    const right = expectApp(sides[1], "TLA.tuple");
    ensure(left.length === right.length);
    return {
      premises: [args[0]],
      branches: [left.map((inner, index) => equal(inner, right[index]))],
    };
  },
  tuple_eq_mismatch: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(expectApp(sides[0], "TLA.tuple").length !== expectApp(sides[1], "TLA.tuple").length);
    return { premises: [args[0]], branches: [] };
  },
  in_product: (args) => {
    const sides = expectApp(args[0], "TLA.in", 2);
    const element = sides[0];
    const components = expectApp(expectApp(sides[1], "TLA.Product", 1)[0], "TLA.tuple");
    return {
      premises: [args[0]],
      branches: [
        [
          app("TLA.isASeq", [element]),
          equal(app("TLA.Len", [element]), makeNatural(components.length)),
          ...components.map((inner, index) =>
            member(fapply(element, makeNatural(index + 1)), inner),
          ),
        ],
      ],
    };
  },
  notin_product: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    const element = sides[0];
    const components = expectApp(expectApp(sides[1], "TLA.Product", 1)[0], "TLA.tuple");
    return {
      premises: [args[0]],
      branches: [
        [not(app("TLA.isASeq", [element]))],
        [not(equal(app("TLA.Len", [element]), makeNatural(components.length)))],
        ...components.map((inner, index) => [
          not(member(fapply(element, makeNatural(index + 1)), inner)),
        ]),
      ],
    };
  },
  tuple_notisaseq: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isASeq", 1)[0], "TLA.tuple");
    return { premises: [args[0]], branches: [] };
  },
  record_eq_match: (args) => {
    const sides = expectApp(args[0], "=", 2);
    const left = getFields(sides[0]);
    const right = getFields(sides[1]);
    const valuesByLabel = new Map(right.map((field) => [getStringText(field[0]), field[1]]));
    const equalities = left.flatMap((field) => {
      const other = valuesByLabel.get(getStringText(field[0]));
      return other === undefined ? [] : [equal(field[1], other)];
    });
    const keys = new Set(equalities.map(getTopKey));
    ensure(args.slice(1).every((formula) => keys.has(getTopKey(formula))));
    return { premises: [args[0]], branches: [args.slice(1)] };
  },
  record_eq_mismatch: (args) => {
    const sides = expectApp(args[0], "=", 2);
    const leftLabels = getFields(sides[0]).map((field) => getStringText(field[0]));
    const rightLabels = new Set(getFields(sides[1]).map((field) => getStringText(field[0])));
    ensure(
      leftLabels.length !== rightLabels.size || leftLabels.some((label) => !rightLabels.has(label)),
    );
    return { premises: [args[0]], branches: [] };
  },
  record_neq_match: (args) => {
    const sides = expectApp(expectNot(args[0]), "=", 2);
    const left = getFields(sides[0]);
    const right = getFields(sides[1]);
    const valuesByLabel = new Map(right.map((field) => [getStringText(field[0]), field[1]]));
    ensure(left.length === right.length);
    const inequalities = left.map((field) => {
      const other = valuesByLabel.get(getStringText(field[0]));
      ensure(other !== undefined);
      return not(equal(field[1], other));
    });
    return { premises: [args[0]], branches: expectSameSet(args.slice(1), inequalities) };
  },
  neq_record: (args) => getRecordInequalitySpec(args, true),
  record_neq: (args) => getRecordInequalitySpec(args, false),
  in_recordset: (args) => {
    const sides = expectApp(args[0], "TLA.in", 2);
    const element = sides[0];
    const fields = getRecordSetFields(sides[1]);
    return {
      premises: [args[0]],
      branches: [
        [
          app("TLA.isAFcn", [element]),
          equal(
            domain(element),
            app(
              "TLA.set",
              fields.map((field) => field[0]),
            ),
          ),
          ...fields.map((field) => member(fapply(element, field[0]), field[1])),
        ],
      ],
    };
  },
  notin_recordset: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    const element = sides[0];
    const fields = getRecordSetFields(sides[1]);
    return {
      premises: [args[0]],
      branches: [
        [not(app("TLA.isAFcn", [element]))],
        [
          not(
            equal(
              domain(element),
              app(
                "TLA.set",
                fields.map((field) => field[0]),
              ),
            ),
          ),
        ],
        ...fields.map((field) => [not(member(fapply(element, field[0]), field[1]))]),
      ],
    };
  },
  record_notisafcn: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isAFcn", 1)[0], "TLA.record");
    return { premises: [args[0]], branches: [] };
  },
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
  all_in: (args) => {
    const bounded = expectApp(args[0], "TLA.bAll", 2);
    const sides = expectApp(args[1], "TLA.in", 2);
    ensure(isSame(bounded[0], sides[1]) && bounded[1].kind === "lam");
    return { premises: [args[0], args[1]], branches: [[instantiate(bounded[1], sides[0])]] };
  },
  notex_in: (args) => {
    const bounded = expectApp(expectNot(args[0]), "TLA.bEx", 2);
    const sides = expectApp(args[1], "TLA.in", 2);
    ensure(isSame(bounded[0], sides[1]) && bounded[1].kind === "lam");
    return {
      premises: [args[0], args[1]],
      branches: [[not(instantiate(bounded[1], sides[0]))]],
    };
  },
  p_eq_l: (args) => getPropositionEqualitySpec(args, false, true),
  p_eq_r: (args) => getPropositionEqualitySpec(args, false, false),
  np_eq_l: (args) => getPropositionEqualitySpec(args, true, true),
  np_eq_r: (args) => getPropositionEqualitySpec(args, true, false),
  trueistrue: (args) => {
    const lambda = args[3];
    const subterm = args[1];
    ensure(lambda.kind === "lam" && isSame(args[0], instantiate(lambda, subterm)));
    return { premises: [args[0], subterm], branches: [[instantiate(lambda, TRUE)]] };
  },
  fapplyfcn: (args) =>
    getRewriteSpec(args, args[3], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const fcn = expectApp(applied[0], "TLA.Fcn", 2);
      ensure(fcn[1].kind === "lam");
      return [
        [not(member(applied[1], fcn[0]))],
        [instantiate(args[3], instantiate(fcn[1], applied[1]))],
      ];
    }),
  fapplyexcept: (args) =>
    getRewriteSpec(args, args[8], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const except = expectApp(applied[0], "TLA.except", 3);
      const argument = applied[1];
      const inDomain = member(argument, domain(except[0]));
      return [
        [inDomain, equal(except[1], argument), instantiate(args[8], except[2])],
        [
          inDomain,
          not(equal(except[1], argument)),
          instantiate(args[8], fapply(except[0], argument)),
        ],
        [not(inDomain)],
      ];
    }),
  tuple_access: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const components = expectApp(applied[0], "TLA.tuple");
      const position = getNatural(applied[1]);
      ensure(position >= 1 && position <= components.length);
      return [[instantiate(args[2], components[position - 1])]];
    }),
  record_access: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const label = getStringText(applied[1]);
      const field = getFields(applied[0]).find((inner) => getStringText(inner[0]) === label);
      ensure(field !== undefined);
      return [[instantiate(args[2], field[1])]];
    }),
  domain_fcn: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const fcn = expectApp(expectApp(filled, "TLA.DOMAIN", 1)[0], "TLA.Fcn", 2);
      return [[instantiate(args[2], fcn[0])]];
    }),
  domain_except: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const except = expectApp(expectApp(filled, "TLA.DOMAIN", 1)[0], "TLA.except", 3);
      return [[instantiate(args[2], domain(except[0]))]];
    }),
  record_domain: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const record = expectApp(filled, "TLA.DOMAIN", 1)[0];
      const fields = getPairs(expectApp(record, "TLA.record"));
      return [
        [
          instantiate(
            args[2],
            app(
              "TLA.set",
              fields.map((field) => field[0]),
            ),
          ),
        ],
      ];
    }),
  ...Object.fromEntries(
    Object.entries(BOOL_CASES).map((entry) => [
      entry[0],
      (args: Term[]) => getBoolCaseSpec(args, entry[1]),
    ]),
  ),
  iftrue: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const operands = expectApp(filled, "TLA.cond", 3);
      ensure(operands[0].kind === "true");
      return [[instantiate(args[2], operands[1])]];
    }),
  iffalse: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const operands = expectApp(filled, "TLA.cond", 3);
      ensure(operands[0].kind === "false");
      return [[instantiate(args[2], operands[2])]];
    }),
  ifthenelse: (args) =>
    getRewriteSpec(args, args[5], (filled) => {
      const operands = expectApp(filled, "TLA.cond", 3);
      return [
        [operands[0], instantiate(args[5], operands[1])],
        [not(operands[0]), instantiate(args[5], operands[2])],
      ];
    }),
  case: (args) =>
    getRewriteSpec(args, args[1], (filled) =>
      getCaseBranches(args[1], expectApp(filled, "TLA.CASE"), TRUE),
    ),
  tuple_len: (args) =>
    getRewriteSpec(args, args[2], (filled) => {
      const components = expectApp(expectApp(filled, "TLA.Len", 1)[0], "TLA.tuple");
      return [[instantiate(args[2], makeNatural(components.length))]];
    }),
};

const getRecordInequalitySpec = (args: Term[], isRecordRight: boolean): RuleSpec => {
  const sides = expectApp(expectNot(args[0]), "=", 2);
  const other = isRecordRight ? sides[0] : sides[1];
  const fields = getFields(isRecordRight ? sides[1] : sides[0]);
  return {
    premises: [args[0]],
    branches: [
      [not(app("TLA.isAFcn", [other]))],
      [
        not(
          equal(
            domain(other),
            app(
              "TLA.set",
              fields.map((field) => field[0]),
            ),
          ),
        ),
      ],
      ...fields.map((field) => [not(equal(fapply(other, field[0]), field[1]))]),
    ],
  };
};

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

const getTransitivitySpec = (args: Term[], isSymmetric: boolean): RuleSpec => {
  const positive = expectApp(args[0], "=", 2);
  const negative = expectApp(expectNot(args[1]), "=", 2);
  const left = positive[0];
  const right = positive[1];
  const negatedLeft = negative[0];
  const negatedRight = negative[1];
  const ends = isSymmetric
    ? [negatedRight, left, right, negatedLeft]
    : [negatedLeft, left, right, negatedRight];
  return {
    premises: [args[0], args[1]],
    branches: [[not(equal(ends[0], ends[1]))], [not(equal(ends[2], ends[3]))]],
  };
};

const getTransitiveEqualitySpec = (
  args: Term[],
  order: "trans_eq" | "trans_eq_sym" | "trans_eq2",
) => {
  const left = args[0];
  const right = args[1];
  const negative = expectApp(expectNot(args[2]), "=", 2);
  const negatedLeft = negative[0];
  const negatedRight = negative[1];
  const ends =
    order === "trans_eq"
      ? [negatedLeft, left, right, negatedRight]
      : order === "trans_eq_sym"
        ? [negatedRight, left, right, negatedLeft]
        : [negatedLeft, right, left, negatedRight];
  const first = not(equal(ends[0], ends[1]));
  const second = not(equal(ends[2], ends[3]));
  return {
    premises: [equal(left, right), args[2]],
    branches: [[first], [first, second], [second]],
  };
};

// Checks that `unfolded` is `folded` with occurrences of the defined symbol replaced by its body,
// going through applications and negations as Zenon does.
const isUnfolding = (
  definition: Definition,
  folded: Term,
  unfolded: Term,
  isFormulaOnly: boolean,
  isInTerm = false,
): boolean => {
  if (isSame(folded, unfolded)) return true;
  const isApplication = folded.kind === "app" && folded.symbol === definition.symbol;
  const isConstant = folded.kind === "var" && folded.symbol === definition.symbol;
  if (isApplication || isConstant) {
    if (isFormulaOnly && isInTerm) return false;
    const actuals = folded.args;
    const body = definition.body;
    if (definition.params.length === 0 && isApplication && body.kind === "var")
      return definition.kind === "real" && isSame(unfolded, app(body.symbol, actuals));
    if (definition.params.length !== actuals.length) return false;
    const env: Env = new Map();
    const operators: Operators = new Map();
    definition.params.forEach((param, index) => {
      env.set(param.symbol, { formula: actuals[index], env: new Map() });
      operators.set(param.symbol, actuals[index]);
    });
    return getKey(body, env, 0, operators) === getTopKey(unfolded);
  }
  if (folded.kind !== unfolded.kind || folded.symbol !== unfolded.symbol) return false;
  if (folded.kind !== "app" && folded.kind !== "not") return false;
  if (folded.args.length !== unfolded.args.length) return false;
  return folded.args.every((inner, index) =>
    isUnfolding(
      definition,
      inner,
      unfolded.args[index],
      isFormulaOnly,
      isInTerm || folded.kind === "app",
    ),
  );
};

const getBound = (origin: Term) => {
  const bound: string[] = [];
  let matrix = origin;
  while (matrix.kind === "all") {
    bound.push(matrix.args[0].symbol);
    matrix = matrix.args[1];
  }
  return { bound, matrix };
};

const getMatrix = (origin: Term) => getBound(origin).matrix;

// A pseudo-definition stands for its hypothesis, \A params : f(params) = body or <=> body.
const isDefinedBy = (definition: Definition, origin: Term) => {
  const quantified = getBound(origin);
  const bound = quantified.bound;
  const matrix = quantified.matrix;
  if (!isApp(matrix, "=", 2) && matrix.kind !== "equiv") return false;
  const names = definition.params.map((param) => param.symbol);
  if (new Set(names).size !== names.length || new Set(bound).size !== bound.length) return false;
  if (names.length !== bound.length || names.some((name) => !bound.includes(name))) return false;
  const params = definition.params;
  const heads = [
    app(
      definition.symbol,
      params.map((param) => variable(param.symbol)),
    ),
  ];
  if (params.length === 0) heads.push(variable(definition.symbol));
  const sides = matrix.args;
  // The parameters are free in the head and the body, so compare them under the same names.
  const env: Env = new Map(bound.map((name, index) => [name, index]));
  const keyOf = (formula: Term) => getKey(formula, env, bound.length);
  const headKeys = heads.map(keyOf);
  const bodyKey = keyOf(definition.body);
  return (
    (headKeys.includes(keyOf(sides[0])) && keyOf(sides[1]) === bodyKey) ||
    (headKeys.includes(keyOf(sides[1])) && keyOf(sides[0]) === bodyKey)
  );
};

const getFreeSymbols = (formula: Term, symbols: Set<string>) => {
  if (formula.kind === "var" || formula.kind === "app") symbols.add(formula.symbol);
  for (const inner of formula.args) getFreeSymbols(inner, symbols);
  return symbols;
};

// Real definitions are sound when each symbol has one and they don't refer to themselves.
const isWellFounded = (definition: Definition, definitions: Definition[]) => {
  const reals = definitions.filter((candidate) => candidate.kind === "real");
  const bySymbol = new Map(reals.map((candidate) => [candidate.symbol, candidate]));
  if (reals.filter((candidate) => candidate.symbol === definition.symbol).length !== 1)
    return false;
  const visiting = new Set<string>();
  const visit = (current: Definition): boolean => {
    if (visiting.has(current.symbol)) return false;
    visiting.add(current.symbol);
    const params = new Set(current.params.map((param) => param.symbol));
    for (const symbol of getFreeSymbols(current.body, new Set())) {
      const next = bySymbol.get(symbol);
      if (!params.has(symbol) && next !== undefined && !visit(next)) return false;
    }
    visiting.delete(current.symbol);
    return true;
  };
  return visit(definition);
};

const getRuleSpec = (proof: Proof, context: CheckContext): RuleSpec => {
  const rule = proof.rule;
  const args: Term[] = rule.args;
  const pair = (left: Term, right: Term) => [left, right];
  switch (rule.name) {
    case "close":
      return { premises: [args[0], not(args[0])], branches: [] };
    case "false":
      return { premises: [FALSE], branches: [] };
    case "not_true":
      return { premises: [not(TRUE)], branches: [] };
    case "close_refl":
      ensure(rule.symbol === "=");
      return { premises: [not(equal(args[0], args[0]))], branches: [] };
    case "close_sym":
      ensure(rule.symbol === "=");
      return {
        premises: [equal(args[0], args[1]), not(equal(args[1], args[0]))],
        branches: [],
      };
    case "conj_tree":
      return { premises: [args[0]], branches: [getConjuncts(args[0])] };
    case "disj_tree":
      return { premises: [args[0]], branches: getDisjuncts(args[0]).map((inner) => [inner]) };
    case "and":
      return { premises: [and(args[0], args[1])], branches: [pair(args[0], args[1])] };
    case "not_not":
      return { premises: [not(not(args[0]))], branches: [[args[0]]] };
    case "not_or":
      return {
        premises: [not(term("or", "", [args[0], args[1]]))],
        branches: [[not(args[0]), not(args[1])]],
      };
    case "not_impl":
      return { premises: [not(imply(args[0], args[1]))], branches: [[args[0], not(args[1])]] };
    case "or":
      return { premises: [term("or", "", [args[0], args[1]])], branches: [[args[0]], [args[1]]] };
    case "impl":
      return { premises: [imply(args[0], args[1])], branches: [[not(args[0])], [args[1]]] };
    case "equiv":
      return {
        premises: [equiv(args[0], args[1])],
        branches: [
          [not(args[0]), not(args[1])],
          [args[0], args[1]],
        ],
      };
    case "not_and":
      return { premises: [not(and(args[0], args[1]))], branches: [[not(args[0])], [not(args[1])]] };
    case "not_equiv":
      return {
        premises: [not(equiv(args[0], args[1]))],
        branches: [
          [not(args[0]), args[1]],
          [args[0], not(args[1])],
        ],
      };
    case "ex": {
      const exists = args[0];
      expectKind(exists, "ex");
      return {
        premises: [exists],
        branches: [[instantiate(exists, term("tau", exists.symbol, exists.args))]],
      };
    }
    case "not_all_ex": {
      const forAll = expectNot(args[0]);
      expectKind(forAll, "all");
      const negated = term("ex", forAll.symbol, [forAll.args[0], not(forAll.args[1])]);
      return {
        premises: [args[0]],
        branches: [[instantiate(negated, term("tau", negated.symbol, negated.args)), negated]],
      };
    }
    case "all":
      expectKind(args[0], "all");
      return { premises: [args[0]], branches: [[instantiate(args[0], args[1])]] };
    case "not_ex": {
      const exists = expectNot(args[0]);
      expectKind(exists, "ex");
      return { premises: [args[0]], branches: [[not(instantiate(exists, args[1]))]] };
    }
    case "definition": {
      const definition = rule.definition;
      ensure(definition !== undefined && context.definitions.includes(definition));
      // An equivalence only says the two sides have the same truth value, so it unfolds where a
      // formula is expected, not inside a term.
      const isEquivalence =
        definition.kind === "pseudo" && getMatrix(definition.origin).kind === "equiv";
      ensure(isUnfolding(definition, args[0], args[1], isEquivalence));
      if (definition.kind === "real") {
        ensure(isWellFounded(definition, context.definitions));
        return { premises: [args[0]], branches: [[args[1]]] };
      }
      ensure(isDefinedBy(definition, definition.origin));
      return { premises: [args[0], definition.origin], branches: [[args[1]]] };
    }
    case "not_equal": {
      const left = expectKind(args[0], "app");
      const right = expectKind(args[1], "app");
      ensure(args[0].symbol === args[1].symbol && left.length === right.length);
      return {
        premises: [not(equal(args[0], args[1]))],
        branches: left.map((inner, index) => [not(equal(inner, right[index]))]),
      };
    }
    case "p_not_p": {
      const left = expectKind(args[0], "app");
      const negated = expectNot(args[1]);
      const right = expectKind(negated, "app");
      ensure(args[0].symbol === negated.symbol && left.length === right.length);
      return {
        premises: [args[0], args[1]],
        branches: left.map((inner, index) => [not(equal(inner, right[index]))]),
      };
    }
    case "trans":
    case "trans_sym":
      return getTransitivitySpec(args, rule.name === "trans_sym");
    case "trans_eq":
    case "trans_eq_sym":
    case "trans_eq2":
      return getTransitiveEqualitySpec(args, rule.name);
    case "cut":
      return { premises: [], branches: [[args[0]], [not(args[0])]] };
    case "congruence_lr":
    case "congruence_rl": {
      const lambda = args[0];
      ensure(lambda.kind === "lam");
      const equality =
        rule.name === "congruence_lr" ? equal(args[1], args[2]) : equal(args[2], args[1]);
      return {
        premises: [instantiate(lambda, args[1]), equality],
        branches: [[instantiate(lambda, args[2])]],
      };
    }
    case "ext": {
      const check = EXTENSION_RULES[rule.symbol];
      ensure(check !== undefined);
      return check(args, proof.uses);
    }
    default:
      throw new UncheckedError();
  }
};

// True when the proof refutes the hypotheses.
export const checkProof = (root: Proof, context: CheckContext) => {
  const needed = new Map<Proof, Set<string>>();
  const getNeeded = (proof: Proof) => {
    const spec = getRuleSpec(proof, context);
    ensure(spec.branches.length === proof.subproofs.length);
    const result = new Set(spec.premises.map(getTopKey));
    proof.subproofs.forEach((subproof, index) => {
      const branch = new Set(spec.branches[index].map(getTopKey));
      for (const key of needed.get(subproof) ?? []) if (!branch.has(key)) result.add(key);
    });
    return result;
  };
  try {
    // Subproofs before their parents, without recursion: proofs can be deep.
    const stack: [Proof, boolean][] = [[root, false]];
    while (stack.length > 0) {
      const top = stack.pop();
      if (top === undefined) break;
      const proof = top[0];
      if (needed.has(proof)) continue;
      if (top[1]) {
        needed.set(proof, getNeeded(proof));
        continue;
      }
      stack.push([proof, true]);
      for (const subproof of proof.subproofs)
        if (!needed.has(subproof)) stack.push([subproof, false]);
    }
    const hypotheses = new Set(context.hypotheses.map(getTopKey));
    const missing = [...(needed.get(root) ?? [])].filter((key) => !hypotheses.has(key));
    return missing.length === 0;
  } catch (error) {
    if (error instanceof UncheckedError) return false;
    throw error;
  }
};

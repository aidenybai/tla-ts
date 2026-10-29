// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// The TLA+ extension: rules for set theory, functions, records, tuples, CHOOSE, IF and CASE, and
// rewriting a subterm with an equality on the branch.

import { TlaZenonError } from "../errors";
import {
  apply,
  compareExprs,
  eall,
  eand,
  eapp,
  eequiv,
  eex,
  eimply,
  elam,
  enot,
  etau,
  evar,
  FALSE,
  newVar,
  substitute,
  substituteSecondOrder,
  TRUE,
  type Expr,
} from "./expr";
import type { Index } from "./index-table";
import { makeRule, type Node, type Priority, type Rule } from "./node";
import { stableSort } from "./ocaml";
import type { Phrase } from "./parse";

// A node, or Zenon's Stop: the rules after it don't apply to the formula.
type Item = Node | "stop";

const SET_CONSTRUCTORS = [
  "TLA.emptyset",
  "TLA.upair",
  "TLA.addElt",
  "TLA.set",
  "TLA.infinity",
  "TLA.SUBSET",
  "TLA.UNION",
  "TLA.INTER",
  "TLA.cup",
  "TLA.cap",
  "TLA.setminus",
  "TLA.subsetOf",
  "TLA.setOfAll",
  "TLA.FuncSet",
  "TLA.DOMAIN",
  "TLA.Product",
  "arith.N",
  "arith.Z",
  "arith.R",
  "arith.natrange",
  "arith.intrange",
  "TLA.Seq",
  "TLA.recordset",
];

const FUNCTION_CONSTRUCTORS = ["TLA.Fcn", "TLA.except", "TLA.oneArg", "TLA.extend"];

const OTHER_SYMBOLS = [
  "TLA.in",
  "TLA.isAFcn",
  "TLA.cond",
  "TLA.CASE",
  "TLA.tuple",
  "TLA.record",
  "TLA.fapply",
  "TLA.box",
];

// The symbols that hypotheses can't define, as Zenon's predef with the tla extension.
export const PREDEFINED_SYMBOLS = [
  "=",
  ...SET_CONSTRUCTORS,
  ...FUNCTION_CONSTRUCTORS,
  ...OTHER_SYMBOLS,
];

const variable = (name: string) => evar(name);

const definition = (symbol: string, params: string[], body: Expr): Phrase => ({
  kind: "def",
  definition: { kind: "real", symbol, params: params.map(variable), body },
});

// Zenon's built_in_defs. Expressions belong to one run of the prover, so each run builds them.
export const getBuiltInDefinitions = (): Phrase[] => {
  const bound = variable("x");
  const isInSet = eapp("TLA.in", [bound, variable("S")]);
  const holds = eapp("P", [bound]);
  return [
    definition(
      "TLA.subseteq",
      ["A", "B"],
      eapp("TLA.bAll", [variable("A"), elam(bound, "", eapp("TLA.in", [bound, variable("B")]))]),
    ),
    definition("TLA.bAll", ["S", "P"], eall(bound, "", eimply(isInSet, holds))),
    definition("TLA.bEx", ["S", "P"], eex(bound, "", eand(isInSet, holds))),
    definition("TLA.bChoice", ["S", "P"], etau(bound, "", eand(isInSet, holds))),
    definition(
      "TLA.prod",
      ["A", "B"],
      eapp("TLA.Product", [eapp("TLA.tuple", [variable("A"), variable("B")])]),
    ),
  ];
};

const isApp = (expression: Expr, symbol: string, arity?: number) =>
  expression.kind === "app" &&
  expression.symbol === symbol &&
  (arity === undefined || expression.args.length === arity);

const isVariable = (expression: Expr, name: string) =>
  expression.kind === "var" && expression.symbol === name;

const isConstructor = (constructors: string[], expression: Expr) =>
  (expression.kind === "var" || expression.kind === "app") &&
  constructors.includes(expression.symbol);

const isNotEquiv = (expression: Expr) => isApp(expression, "$notequiv");

const isString = (expression: Expr) => isApp(expression, "$string");

const equal = (left: Expr, right: Expr) => eapp("=", [left, right]);

const member = (element: Expr, set: Expr) => eapp("TLA.in", [element, set]);

const fapply = (fcn: Expr, argument: Expr) => eapp("TLA.fapply", [fcn, argument]);

const domain = (fcn: Expr) => eapp("TLA.DOMAIN", [fcn]);

const getBranches = (formulas: Expr[]) => formulas.map((formula) => [formula]);

const decomposeAdd = (set: Expr): [Expr[], Expr] => {
  const elements: Expr[] = [];
  let rest = set;
  while (isApp(rest, "TLA.addElt", 2)) {
    elements.push(rest.args[0]);
    rest = rest.args[1];
  }
  return [elements, rest];
};

// The elements of a set given by enumeration, and whether it may hold more.
const getSetValues = (set: Expr): [Expr[], boolean] => {
  if (isVariable(set, "TLA.emptyset")) return [[], false];
  if (isApp(set, "TLA.upair", 2)) return [set.args, false];
  if (isApp(set, "TLA.set")) return [set.args, false];
  if (isApp(set, "TLA.addElt", 2)) {
    const rest = getSetValues(set.args[1]);
    return [[set.args[0], ...rest[0]], rest[1]];
  }
  if (isApp(set, "TLA.union", 2)) {
    const left = getSetValues(set.args[0]);
    const right = getSetValues(set.args[1]);
    return [[...left[0], ...right[0]], left[1] || right[1]];
  }
  return [[], true];
};

const makeNatural = (count: number) => {
  let result = variable("0");
  for (let index = 0; index < count; index++) result = fapply(variable("TLA.Succ"), result);
  return result;
};

const isTriviallyNotIn = (element: Expr, set: Expr) =>
  isString(element) &&
  isApp(set, "TLA.set") &&
  set.args.every((inner) => isString(inner) && inner !== element);

const getPairs = (args: Expr[]) => {
  const pairs: [Expr, Expr][] = [];
  for (let index = 0; index + 1 < args.length; index += 2)
    pairs.push([args[index], args[index + 1]]);
  return pairs;
};

const getStringName = (expression: Expr) =>
  isApp(expression, "$string", 1) && expression.args[0].kind === "var"
    ? expression.args[0].symbol
    : undefined;

// Zenon's check_record_labels on sorted fields: false for Invalid_record, a repeated label.
const hasDistinctLabels = (pairs: [Expr, Expr][]) => {
  for (let index = 0; index + 1 < pairs.length; index++) {
    const left = pairs[index][0];
    const right = pairs[index + 1][0];
    const leftName = getStringName(left);
    if (leftName !== undefined && leftName === getStringName(right)) return false;
    if (left === right) return false;
  }
  return true;
};

const sortPairs = (pairs: [Expr, Expr][]) =>
  stableSort(pairs, (left, right) => compareExprs(left[0], right[0]));

const getSortedLabels = (args: Expr[]) => {
  const sorted = stableSort(
    getPairs(args).map((pair) => pair[0]),
    compareExprs,
  );
  return sorted.filter(
    (label, index) => index === 0 || compareExprs(sorted[index - 1], label) !== 0,
  );
};

// OCaml's int_of_string, for the numerals that tlapm writes as variables.
const parseInteger = (text: string) =>
  /^[-+]?(0[xX][0-9a-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|0[uU][0-9_]+|[0-9][0-9_]*)$/.test(text)
    ? Number(text.replace(/_/g, "").replace(/^([-+]?)0[uU]/, "$1"))
    : undefined;

const getNaturalConstant = (expression: Expr): number | undefined => {
  let accumulator = 0;
  let current = expression;
  while (isApp(current, "TLA.fapply", 2) && isVariable(current.args[0], "TLA.Succ")) {
    accumulator++;
    current = current.args[1];
  }
  if (current.kind !== "var") return undefined;
  const value = parseInteger(current.symbol);
  return value === undefined ? undefined : accumulator + value;
};

interface Context {
  index: Index;
}

const getPropNodes = (context: Context, formula: Expr, goalness: number): Item[] => {
  const index = context.index;
  const node = (priority: Priority, name: string, args: Expr[], branches: Expr[][]): Node[] => [
    {
      conclusions: [formula],
      rule: makeRule("ext", args, name),
      priority,
      goalness,
      branches,
    },
  ];
  const instance = (priority: Priority, quantified: Expr, term: Expr): Node[] => {
    if (quantified.kind === "all")
      return [
        {
          conclusions: [quantified],
          rule: makeRule("all", [quantified, term]),
          priority,
          goalness,
          branches: [[substitute([[quantified.args[0], term]], quantified.args[1])]],
        },
      ];
    if (quantified.kind === "ex") {
      const negated = enot(quantified);
      return [
        {
          conclusions: [negated],
          rule: makeRule("not_ex", [negated, term]),
          priority,
          goalness,
          branches: [[substitute([[quantified.args[0], term]], enot(quantified.args[1]))]],
        },
      ];
    }
    throw new TlaZenonError("Zenon: instantiating a formula that isn't quantified");
  };
  const isNegated = formula.kind === "not";
  const atom = isNegated ? formula.args[0] : formula;
  const left = atom.args[0];
  const right = atom.args[1];
  const isEquality = isApp(atom, "=", 2);
  const isMembership = isApp(atom, "TLA.in", 2);

  if (isEquality && right.kind === "true")
    return isNegated
      ? node("prop", "noteq_x_true", [formula, enot(left), left], [[enot(left)]])
      : node("prop", "eq_x_true", [formula, left, left], [[left]]);
  if (isEquality && left.kind === "true")
    return isNegated
      ? node("prop", "noteq_true_x", [formula, enot(right), right], [[enot(right)]])
      : node("prop", "eq_true_x", [formula, right, right], [[right]]);
  if (!isNegated && isEquality && right.kind === "false")
    return node("prop", "eq_x_false", [formula, enot(left), left], [[enot(left)]]);
  if (!isNegated && isEquality && left.kind === "false")
    return node("prop", "eq_false_x", [formula, enot(right), right], [[enot(right)]]);
  if (atom.kind === "meta") return instance("arity", atom.args[0], isNegated ? TRUE : FALSE);

  if (isMembership) {
    const element = left;
    const set = right;
    if (!isNegated && isVariable(set, "TLA.emptyset"))
      return node("prop", "in_emptyset", [formula, element], []);
    if (isApp(set, "TLA.upair", 2)) {
      const first = equal(element, set.args[0]);
      const second = equal(element, set.args[1]);
      return isNegated
        ? node(
            "prop",
            "notin_upair",
            [formula, enot(first), enot(second), element, set.args[0], set.args[1]],
            [[enot(first), enot(second)]],
          )
        : node(
            "prop",
            "in_upair",
            [formula, first, second, element, set.args[0], set.args[1]],
            [[first], [second]],
          );
    }
    if (isApp(set, "TLA.addElt", 2)) {
      const decomposed = decomposeAdd(set);
      const isEmptyRest = decomposed[1] === variable("TLA.emptyset");
      if (!isNegated) {
        const equalities = decomposed[0].map((inner) => equal(element, inner));
        const formulas = isEmptyRest ? equalities : [...equalities, member(element, decomposed[1])];
        return node("prop", "in_addElt", [formula, element, set], getBranches(formulas));
      }
      const inequalities = decomposed[0].map((inner) => enot(equal(element, inner)));
      const formulas = isEmptyRest
        ? inequalities
        : [enot(member(element, decomposed[1])), ...inequalities];
      return node("prop", "notin_addElt", [formula, element, set], [formulas]);
    }
    if (isApp(set, "TLA.set"))
      return isNegated
        ? node(
            "prop",
            "notin_set",
            [formula, element, set],
            [set.args.map((inner) => enot(equal(element, inner)))],
          )
        : node(
            "prop",
            "in_set",
            [formula, element, set],
            getBranches(set.args.map((inner) => equal(element, inner))),
          );
    if (isNegated && set.kind === "meta")
      return instance({ instance: set.args[0] }, set.args[0], eapp("TLA.set", [element]));
    if (isApp(set, "TLA.SUBSET", 1)) {
      const subset = eapp("TLA.subseteq", [element, set.args[0]]);
      return isNegated
        ? node(
            "prop",
            "notin_SUBSET",
            [formula, enot(subset), element, set.args[0]],
            [[enot(subset)]],
          )
        : node("prop", "in_SUBSET", [formula, subset, element, set.args[0]], [[subset]]);
    }
    if (isApp(set, "TLA.UNION", 1)) {
      const bound = newVar();
      const exists = eex(bound, "", eand(member(bound, set.args[0]), member(element, bound)));
      return isNegated
        ? node(
            "arity",
            "notin_UNION",
            [formula, enot(exists), element, set.args[0]],
            [[enot(exists)]],
          )
        : node("prop", "in_UNION", [formula, exists, element, set.args[0]], [[exists]]);
    }
    const binarySetRules: Record<string, [string, string, boolean, boolean]> = {
      "TLA.cup": ["in_cup", "notin_cup", true, false],
      "TLA.cap": ["in_cap", "notin_cap", false, true],
      "TLA.setminus": ["in_setminus", "notin_setminus", false, true],
    };
    const binarySetRule = set.kind === "app" ? binarySetRules[set.symbol] : undefined;
    if (binarySetRule !== undefined && set.args.length === 2) {
      const first = member(element, set.args[0]);
      const secondPositive = member(element, set.args[1]);
      const isMinus = set.symbol === "TLA.setminus";
      const second = isMinus !== isNegated ? enot(secondPositive) : secondPositive;
      const firstLiteral = isNegated ? enot(first) : first;
      const args = [formula, firstLiteral, second, element, set.args[0], set.args[1]];
      const isSplit = isNegated ? binarySetRule[3] : binarySetRule[2];
      return node(
        "prop",
        isNegated ? binarySetRule[1] : binarySetRule[0],
        args,
        isSplit ? [[firstLiteral], [second]] : [[firstLiteral, second]],
      );
    }
    if (isApp(set, "TLA.subsetOf", 2) && set.args[1].kind === "lam") {
      const predicate = set.args[1];
      const inBase = member(element, set.args[0]);
      const holds = substitute([[predicate.args[0], element]], predicate.args[1]);
      return isNegated
        ? node(
            "prop",
            "notin_subsetof",
            [formula, enot(inBase), enot(holds), element, set.args[0], predicate],
            [[enot(inBase)], [enot(holds)]],
          )
        : node(
            "prop",
            "in_subsetof",
            [formula, inBase, holds, element, set.args[0], predicate],
            [[inBase, holds]],
          );
    }
    if (isApp(set, "TLA.setOfAll", 2) && set.args[1].kind === "lam") {
      const predicate = set.args[1];
      const bound = newVar();
      const exists = eex(
        bound,
        "",
        eand(
          member(bound, set.args[0]),
          equal(element, substitute([[predicate.args[0], bound]], predicate.args[1])),
        ),
      );
      const result = isNegated ? enot(exists) : exists;
      return node(
        { instance: result },
        isNegated ? "notin_setofall" : "in_setofall",
        [formula, result, element, set.args[0], predicate],
        [[result]],
      );
    }
    if (isApp(set, "TLA.FuncSet", 2)) {
      const fcn = element;
      const source = set.args[0];
      const target = set.args[1];
      const isFcn = eapp("TLA.isAFcn", [fcn]);
      const hasDomain = equal(domain(fcn), source);
      const bound = newVar();
      const maps = eall(
        bound,
        "",
        eimply(member(bound, source), member(fapply(fcn, bound), target)),
      );
      if (!isNegated) {
        const args = [formula, isFcn, hasDomain, maps, fcn, source, target];
        return [
          ...node("arity", "in_funcset", args, [[isFcn, hasDomain]]),
          ...node({ instance: maps }, "in_funcset", args, [[isFcn, hasDomain, maps]]),
        ];
      }
      const notFcn = enot(isFcn);
      const notDomain = enot(hasDomain);
      const notMaps = enot(maps);
      const priority: Priority =
        fcn.kind === "app" && FUNCTION_CONSTRUCTORS.includes(fcn.symbol)
          ? "arity"
          : { instance: notMaps };
      const shortcut = isApp(fcn, "TLA.except", 3)
        ? node(
            "arity",
            "except_notin_funcset",
            [
              formula,
              enot(member(fcn.args[0], eapp("TLA.FuncSet", [source, target]))),
              enot(member(fcn.args[2], target)),
              fcn.args[0],
              fcn.args[1],
              fcn.args[2],
              source,
              target,
            ],
            [
              [enot(member(fcn.args[0], eapp("TLA.FuncSet", [source, target])))],
              [enot(member(fcn.args[2], target))],
            ],
          )
        : [];
      return [
        ...shortcut,
        ...node(
          priority,
          "notin_funcset",
          [formula, notFcn, notDomain, notMaps, fcn, source, target],
          [[notFcn], [notDomain], [notMaps]],
        ),
      ];
    }
  }

  if (!isNegated && isEquality && isVariable(right, "TLA.emptyset")) {
    const bound = newVar();
    const empty = eall(bound, "", enot(member(bound, left)));
    return node("arity", "setequalempty", [formula, empty, left], [[empty]]);
  }
  if (!isNegated && isEquality && isVariable(left, "TLA.emptyset")) {
    const bound = newVar();
    const empty = eall(bound, "", enot(member(bound, right)));
    return node("arity", "setemptyequal", [formula, empty, right], [[empty]]);
  }
  if (
    isEquality &&
    (isConstructor(SET_CONSTRUCTORS, left) || isConstructor(SET_CONSTRUCTORS, right))
  ) {
    const bound = newVar();
    const extensional = eall(bound, "", eequiv(member(bound, left), member(bound, right)));
    const result = isNegated ? enot(extensional) : extensional;
    return node(
      { instance: result },
      isNegated ? "notsetequal" : "setequal",
      [formula, result, left, right],
      [[result]],
    );
  }
  if (isNegated && isApp(atom, "TLA.isAFcn", 1)) {
    const fcn = atom.args[0];
    if (isApp(fcn, "TLA.Fcn", 2)) return node("prop", "notisafcn_fcn", [formula, ...fcn.args], []);
    if (isApp(fcn, "TLA.except", 3))
      return node("prop", "notisafcn_except", [formula, ...fcn.args], []);
    if (isApp(fcn, "TLA.oneArg", 2))
      return node("prop", "notisafcn_onearg", [formula, ...fcn.args], []);
    if (isApp(fcn, "TLA.extend", 2))
      return node("prop", "notisafcn_extend", [formula, ...fcn.args], []);
  }
  if (
    isEquality &&
    (isConstructor(FUNCTION_CONSTRUCTORS, left) || isConstructor(FUNCTION_CONSTRUCTORS, right))
  ) {
    const bound = newVar();
    const sameDomain = equal(domain(left), domain(right));
    const sameValue = equal(fapply(left, bound), fapply(right, bound));
    if (!isNegated) {
      const isFcn = eequiv(eapp("TLA.isAFcn", [left]), eapp("TLA.isAFcn", [right]));
      const values = eall(bound, "", sameValue);
      const result = eand(eand(isFcn, sameDomain), values);
      return node({ instance: values }, "funequal", [formula, result, left, right], [[result]]);
    }
    const values = eall(bound, "", eimply(member(bound, domain(right)), sameValue));
    const result = enot(
      eand(eand(eand(eapp("TLA.isAFcn", [left]), eapp("TLA.isAFcn", [right])), sameDomain), values),
    );
    return node({ instance: values }, "notfunequal", [formula, result, left, right], [[result]]);
  }
  if (
    isNegated &&
    isEquality &&
    left.kind === "tau" &&
    right.kind === "tau" &&
    !isNotEquiv(left.args[1]) &&
    !isNotEquiv(right.args[1])
  ) {
    const bound = newVar();
    const leftBody = substitute([[left.args[0], bound]], left.args[1]);
    const rightBody = substitute([[right.args[0], bound]], right.args[1]);
    const differ = eex(bound, left.symbol, eapp("$notequiv", [leftBody, rightBody]));
    return node(
      { instance: differ },
      "choose_diff_choose",
      [
        formula,
        differ,
        elam(left.args[0], left.symbol, left.args[1]),
        elam(right.args[0], right.symbol, right.args[1]),
      ],
      [[differ]],
    );
  }
  if (!isNegated && isApp(atom, "$notequiv", 2))
    return node("arity", "notequivdef", [], [[enot(eequiv(left, right))]]);
  if (isNegated && isEquality && (right.kind === "tau" || left.kind === "tau")) {
    const choice = right.kind === "tau" ? right : left;
    const term = right.kind === "tau" ? left : right;
    const exists = eex(choice.args[0], choice.symbol, choice.args[1]);
    const notExists = enot(exists);
    const notHolds = enot(substitute([[choice.args[0], term]], choice.args[1]));
    return [
      {
        conclusions: [],
        rule: makeRule(
          "ext",
          [exists, notExists, notHolds, elam(choice.args[0], choice.symbol, choice.args[1]), term],
          "notequalchoose",
        ),
        priority: { instance: notExists },
        goalness,
        branches: [[exists], [notExists, notHolds]],
      },
    ];
  }
  const enumerated = getEnumeratedQuantifier(formula);
  if (enumerated !== undefined) {
    const values = getSetValues(enumerated.set);
    const nodes: Item[] = values[0].flatMap((value) =>
      instance("arity", enumerated.quantified, value),
    );
    return values[1] ? nodes : [...nodes, "stop"];
  }
  if (isNegated && isMembership && isVariable(right, "arith.N")) {
    if (isVariable(left, "0")) return node("prop", "in_nat_0", [formula], []);
    if (isApp(left, "TLA.fapply", 2) && isVariable(left.args[0], "TLA.Succ")) {
      const previous = enot(member(left.args[1], variable("arith.N")));
      return node("prop", "in_nat_succ", [formula, previous, left.args[1]], [[previous]]);
    }
    if (left.kind === "meta")
      return instance({ instance: left.args[0] }, left.args[0], variable("0"));
  }
  if (isMembership && left.kind === "meta") {
    const bound = newVar();
    return index.findDisequalities(right).flatMap((disequality) => {
      const sides = disequality.args[0].args;
      const different = enot(
        eall(bound, "", eequiv(member(bound, sides[0]), member(bound, sides[1]))),
      );
      return node(
        { instance: different },
        "notsetequal",
        [disequality, different, sides[0], sides[1]],
        [[different]],
      );
    });
  }
  if (!isNegated && isApp(atom, "TLA.box", 1))
    return node("prop", "box_p", [formula, left], [[left]]);

  if (!isNegated && isEquality && isApp(left, "TLA.tuple") && isApp(right, "TLA.tuple")) {
    if (left.args.length !== right.args.length)
      return node("prop", "tuple_eq_mismatch", [formula, formula], []);
    const equalities = left.args.map((inner, position) => equal(inner, right.args[position]));
    return node("prop", "tuple_eq_match", [formula, ...equalities], [equalities]);
  }
  if (isMembership && isApp(right, "TLA.Product", 1) && isApp(right.args[0], "TLA.tuple")) {
    const element = left;
    const tuple = right.args[0];
    if (!isNegated) {
      const components = tuple.args.map((inner, position) =>
        member(fapply(element, makeNatural(position + 1)), inner),
      );
      const isSequence = eapp("TLA.isASeq", [element]);
      const hasLength = equal(eapp("TLA.Len", [element]), makeNatural(tuple.args.length));
      return node(
        "prop",
        "in_product",
        [formula, element, tuple, isSequence, hasLength, ...components],
        [[isSequence, hasLength, ...components]],
      );
    }
    if (
      isApp(element, "TLA.tuple") &&
      (element.args.length !== tuple.args.length ||
        element.args.some((inner, position) => isTriviallyNotIn(inner, tuple.args[position])))
    )
      return [];
    const components = tuple.args.map((inner, position) =>
      enot(member(fapply(element, makeNatural(position + 1)), inner)),
    );
    const formulas = [
      enot(eapp("TLA.isASeq", [element])),
      enot(equal(eapp("TLA.Len", [element]), makeNatural(tuple.args.length))),
      ...components,
    ];
    return node(
      "prop",
      "notin_product",
      [formula, element, tuple, ...formulas],
      getBranches(formulas),
    );
  }
  if (isNegated && isApp(atom, "TLA.isASeq", 1) && isApp(left, "TLA.tuple"))
    return node("prop", "tuple_notisaseq", [formula], []);

  if (isEquality && isApp(left, "TLA.record") && isApp(right, "TLA.record")) {
    const leftFields = sortPairs(getPairs(left.args));
    const rightFields = sortPairs(getPairs(right.args));
    if (!hasDistinctLabels(leftFields) || !hasDistinctLabels(rightFields)) return [];
    const isMatch =
      leftFields.length === rightFields.length &&
      leftFields.every((field, position) => field[0] === rightFields[position][0]);
    if (!isMatch)
      return isNegated ? [] : node("prop", "record_eq_mismatch", [formula, formula], []);
    const equalities = leftFields.map((field, position) =>
      equal(field[1], rightFields[position][1]),
    );
    if (!isNegated) return node("prop", "record_eq_match", [formula, ...equalities], [equalities]);
    const inequalities = equalities.map((inner) => enot(inner));
    return node("prop", "record_neq_match", [formula, ...inequalities], getBranches(inequalities));
  }
  if (isNegated && isEquality && (isApp(right, "TLA.record") || isApp(left, "TLA.record"))) {
    const record = isApp(right, "TLA.record") ? right : left;
    const other = isApp(right, "TLA.record") ? left : right;
    const pairs = getPairs(record.args);
    const formulas = [
      enot(eapp("TLA.isAFcn", [other])),
      enot(
        equal(
          domain(other),
          eapp(
            "TLA.set",
            pairs.map((pair) => pair[0]),
          ),
        ),
      ),
      ...pairs.map((pair) => enot(equal(fapply(other, pair[0]), pair[1]))),
    ];
    return node(
      "prop",
      record === right ? "neq_record" : "record_neq",
      [formula, other, record, ...formulas],
      getBranches(formulas),
    );
  }
  if (isMembership && isApp(right, "TLA.recordset")) {
    const pairs = getPairs(right.args);
    const labels = eapp(
      "TLA.set",
      pairs.map((pair) => pair[0]),
    );
    if (!isNegated) {
      const formulas = [
        eapp("TLA.isAFcn", [left]),
        equal(domain(left), labels),
        ...pairs.map((pair) => member(fapply(left, pair[0]), pair[1])),
      ];
      return node("prop", "in_recordset", [formula, left, right, ...formulas], [formulas]);
    }
    if (isApp(left, "TLA.record")) {
      const leftLabels = getSortedLabels(left.args);
      const rightLabels = getSortedLabels(right.args);
      const isSameLabels =
        leftLabels.length === rightLabels.length &&
        leftLabels.every((label, position) => label === rightLabels[position]);
      const isFieldNotIn = getPairs(left.args).some((field) => {
        const type = pairs.find((pair) => pair[0] === field[0]);
        return type === undefined || isTriviallyNotIn(field[1], type[1]);
      });
      if (!isSameLabels || isFieldNotIn) return [];
    }
    const formulas = [
      enot(eapp("TLA.isAFcn", [left])),
      enot(equal(domain(left), labels)),
      ...pairs.map((pair) => enot(member(fapply(left, pair[0]), pair[1]))),
    ];
    return node(
      "prop",
      "notin_recordset",
      [formula, left, right, ...formulas],
      getBranches(formulas),
    );
  }
  if (isNegated && isApp(atom, "TLA.isAFcn", 1) && isApp(left, "TLA.record"))
    return node("prop", "record_notisafcn", [formula], []);

  if (isApp(atom, "TLA.subseteq", 2)) {
    if (isApp(left, "TLA.cup", 2)) {
      const first = eapp("TLA.subseteq", [left.args[0], right]);
      const second = eapp("TLA.subseteq", [left.args[1], right]);
      return isNegated
        ? node(
            "arity",
            "not_cup_subseteq",
            [formula, enot(first), enot(second)],
            [[enot(first)], [enot(second)]],
          )
        : node("arity", "cup_subseteq", [formula, first, second], [[first, second]]);
    }
    if (isApp(right, "TLA.cap", 2)) {
      // Zenon builds the same subset twice here, from the second set.
      const subset = eapp("TLA.subseteq", [left, right.args[1]]);
      return isNegated
        ? node(
            "arity",
            "not_subseteq_cap",
            [formula, enot(subset), enot(subset)],
            [[enot(subset)], [enot(subset)]],
          )
        : node("arity", "subseteq_cap", [formula, subset, subset], [[subset, subset]]);
    }
  }
  return [];
};

// The bounded quantifier over an enumerated set in \A x : x \in S => P or ~\E x : x \in S /\ P.
const getEnumeratedQuantifier = (formula: Expr) => {
  const isEnumerated = (set: Expr) =>
    isVariable(set, "TLA.emptyset") ||
    (set.kind === "app" &&
      ["TLA.addElt", "TLA.upair", "TLA.set", "TLA.union"].includes(set.symbol));
  if (formula.kind === "all") {
    const body = formula.args[1];
    if (
      body.kind === "imply" &&
      isApp(body.args[0], "TLA.in", 2) &&
      isEnumerated(body.args[0].args[1])
    )
      return { quantified: formula, set: body.args[0].args[1] };
  }
  if (formula.kind === "not" && formula.args[0].kind === "ex") {
    const body = formula.args[0].args[1];
    if (
      body.kind === "and" &&
      isApp(body.args[0], "TLA.in", 2) &&
      isEnumerated(body.args[0].args[1])
    )
      return { quantified: formula.args[0], set: body.args[0].args[1] };
  }
  return undefined;
};

// Zenon's newnodes_inst_bounded: instantiates \A x \in S : P and ~\E x \in S : P with the terms
// known to be in S.
const getBoundedInstances = (context: Context, formula: Expr, goalness: number): Node[] => {
  const index = context.index;
  const makeNode = (
    name: string,
    bounded: Expr,
    membership: Expr,
    set: Expr,
    predicate: Expr,
    term: Expr,
  ): Node => {
    const instance = name === "all_in" ? apply(predicate, term) : enot(apply(predicate, term));
    return {
      conclusions: bounded === formula ? [membership, formula] : [formula, bounded],
      rule: makeRule("ext", [bounded, membership, instance, set, predicate], name),
      priority: { instance: formula },
      goalness,
      branches: [[instance]],
    };
  };
  const getTermsIn = (set: Expr) =>
    index
      .findPositive("TLA.in")
      .map((entry) => entry[0])
      .filter(
        (membership) =>
          isApp(membership, "TLA.in", 2) &&
          membership.args[0].metas.length === 0 &&
          membership.args[1] === set,
      );
  if (isApp(formula, "TLA.in", 2) && formula.args[0].metas.length === 0) {
    const term = formula.args[0];
    const set = formula.args[1];
    const universals = index
      .findPositive("TLA.bAll")
      .map((entry) => entry[0])
      .filter((bounded) => isApp(bounded, "TLA.bAll", 2) && bounded.args[0] === set);
    const existentials = index
      .findNegative("TLA.bEx")
      .map((entry) => entry[0])
      .filter(
        (bounded) =>
          bounded.kind === "not" &&
          isApp(bounded.args[0], "TLA.bEx", 2) &&
          bounded.args[0].args[0] === set,
      );
    const notExists = existentials.map((bounded) =>
      makeNode("notex_in", bounded, formula, set, bounded.args[0].args[1], term),
    );
    const forAll = universals.map((bounded) =>
      makeNode("all_in", bounded, formula, set, bounded.args[1], term),
    );
    return [...forAll.reverse(), ...notExists];
  }
  if (isApp(formula, "TLA.bAll", 2))
    return getTermsIn(formula.args[0]).map((membership) =>
      makeNode("all_in", formula, membership, formula.args[0], formula.args[1], membership.args[0]),
    );
  if (formula.kind === "not" && isApp(formula.args[0], "TLA.bEx", 2)) {
    const bounded = formula.args[0];
    return getTermsIn(bounded.args[0]).map((membership) =>
      makeNode(
        "notex_in",
        formula,
        membership,
        bounded.args[0],
        bounded.args[1],
        membership.args[0],
      ),
    );
  }
  return [];
};

const makePropositionEqualityNode = (
  name: "p_eq_l" | "p_eq_r" | "np_eq_l" | "np_eq_r",
  formula: Expr,
  left: Expr,
  right: Expr,
  goalness: number,
): Node => {
  const isNegated = name === "np_eq_l" || name === "np_eq_r";
  const isLeft = name === "p_eq_l" || name === "np_eq_l";
  const proposition = isNegated ? formula.args[0] : formula;
  const equality = equal(left, right);
  const differ = enot(equal(proposition, isLeft ? left : right));
  const other = isLeft ? right : left;
  const rest = isNegated ? enot(other) : other;
  return {
    conclusions: [formula, equality],
    rule: makeRule(
      "ext",
      isNegated
        ? [formula, equality, differ, rest, proposition, left, right]
        : [formula, equality, differ, other, formula, left, right],
      name,
    ),
    priority: "arity_eq",
    goalness,
    branches: [[differ], [rest]],
  };
};

const getPropositionEqualityNodes = (context: Context, formula: Expr, goalness: number) => {
  const index = context.index;
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  if (atom.kind !== "app") return [];
  const isNegated = formula.kind === "not";
  const make = (isLeft: boolean) => (entry: [Expr, number]) =>
    makePropositionEqualityNode(
      isNegated ? (isLeft ? "np_eq_l" : "np_eq_r") : isLeft ? "p_eq_l" : "p_eq_r",
      formula,
      entry[0].args[0],
      entry[0].args[1],
      goalness,
    );
  return [
    ...index.findTransLeft("=", atom.symbol).map(make(true)),
    ...index.findTransRight("=", atom.symbol).map(make(false)),
  ];
};

const getEqualityPropositionNodes = (context: Context, formula: Expr, isLeft: boolean): Node[] => {
  if (!isApp(formula, "=", 2)) return [];
  const term = formula.args[isLeft ? 0 : 1];
  if (term.kind !== "app") return [];
  const index = context.index;
  const make = (isNegated: boolean) => (entry: [Expr, number]) =>
    makePropositionEqualityNode(
      isNegated ? (isLeft ? "np_eq_l" : "np_eq_r") : isLeft ? "p_eq_l" : "p_eq_r",
      entry[0],
      formula.args[0],
      formula.args[1],
      entry[1],
    );
  return [
    ...index.findPositive(term.symbol).map(make(false)),
    ...index.findNegative(term.symbol).map(make(true)),
  ];
};

const isInOneTo = (term: Expr, maximum: number) => {
  const value = getNaturalConstant(term);
  return value !== undefined && value > 0 && value <= maximum;
};

const getCaseBranches = (fill: (term: Expr) => Expr, args: Expr[], condition: Expr): Expr[][] => {
  if (args.length === 0) return [[condition]];
  if (args.length === 1) return [[condition, fill(args[0])]];
  const rest = getCaseBranches(fill, args.slice(2), eand(enot(args[0]), condition));
  return [[args[0], fill(args[1])], ...rest];
};

type MakeRewrite = (name: string, args: Expr[], added: Expr[], branches: Expr[][]) => Item[];

const SET_HEADS = [
  "TLA.emptyset",
  "TLA.upair",
  "TLA.addElt",
  "TLA.set",
  "TLA.SUBSET",
  "TLA.UNION",
  "TLA.cup",
  "TLA.cap",
  "TLA.setminus",
  "TLA.subsetOf",
  "TLA.setOfAll",
  "TLA.FuncSet",
  "TLA.Product",
];

const getRewrites = (
  context: Context,
  isInTerm: boolean,
  hole: Expr,
  frame: Expr,
  term: Expr,
  make: MakeRewrite,
): Item[] => {
  const index = context.index;
  const lambda = elam(hole, "", frame);
  const fill = (inner: Expr) => substitute([[hole, inner]], frame);
  const makeBoolCase = (name: string, operands: Expr[]) => {
    const isTrue = equal(term, TRUE);
    const whenTrue = fill(TRUE);
    const isFalse = equal(term, FALSE);
    const whenFalse = fill(FALSE);
    return make(
      `boolcase_${name}`,
      [fill(term), isTrue, whenTrue, isFalse, whenFalse, lambda, ...operands],
      [],
      [
        [isTrue, whenTrue],
        [isFalse, whenFalse],
      ],
    );
  };
  // Rewrites the term with the equalities on the branch whose other side has one of these heads.
  const makeEqualityRewrites = (wrapped: Expr, heads: string[], subterm: Expr) => {
    const hasGoodHead = (other: Expr) =>
      (other.kind === "app" || other.kind === "var") &&
      (heads.length === 0 || heads.includes(other.symbol));
    const rights = index.findEqualRight(subterm).filter(hasGoodHead);
    const lefts = index.findEqualLeft(subterm).filter(hasGoodHead);
    const leftToRight = rights.flatMap((other) =>
      make(
        "rewrite_lr",
        [wrapped, subterm, other],
        [equal(subterm, other)],
        [[apply(wrapped, other)]],
      ),
    );
    const rightToLeft = lefts.flatMap((other) =>
      make(
        "rewrite_rl",
        [wrapped, subterm, other],
        [equal(other, subterm)],
        [[apply(wrapped, other)]],
      ),
    );
    return [...leftToRight, ...rightToLeft];
  };
  const makeHoleRewrites = (symbol: string, heads: string[], subterm: Expr, other?: Expr) => {
    const inner = newVar();
    const wrapped = elam(
      inner,
      "",
      fill(eapp(symbol, other === undefined ? [inner] : [other, inner])),
    );
    return makeEqualityRewrites(wrapped, heads, subterm);
  };

  if (isInTerm && index.isMember(term)) {
    const replaced = fill(TRUE);
    return make("trueistrue", [fill(term), term, replaced, lambda, term], [term], [[replaced]]);
  }
  if (isApp(term, "$notequiv", 2)) return [];
  if (isInTerm && (term.kind === "var" || term.kind === "app")) {
    const definition = index.getDefinition(term.symbol);
    if (definition !== undefined) {
      if (term.kind === "var") {
        if (definition.params.length !== 0) return [];
        const unfolded = fill(definition.body);
        return make("definition", [fill(term), unfolded, term], [], [[unfolded]]);
      }
      if (definition.params.length !== term.args.length) return [];
      const body = substituteSecondOrder(
        definition.params.map((param, position) => [param, term.args[position]]),
        definition.body,
      );
      if (body === undefined) throw new TlaZenonError("Zenon: higher-order definition");
      const unfolded = fill(body);
      return make("definition", [fill(term), unfolded, term], [], [[unfolded]]);
    }
  }
  if (isApp(term, "TLA.fapply", 2)) {
    const fcn = term.args[0];
    const argument = term.args[1];
    if (isApp(fcn, "TLA.Fcn", 2) && fcn.args[1].kind === "lam") {
      const body = fcn.args[1];
      const outside = enot(member(argument, fcn.args[0]));
      const applied = fill(substitute([[body.args[0], argument]], body.args[1]));
      return make(
        "fapplyfcn",
        [fill(term), outside, applied, lambda, fcn.args[0], body, argument],
        [],
        [[outside], [applied]],
      );
    }
    if (isApp(fcn, "TLA.except", 3)) {
      const base = fcn.args[0];
      const point = fcn.args[1];
      const value = fcn.args[2];
      const inDomain = member(argument, domain(base));
      const isPoint = equal(point, argument);
      const changed = fill(value);
      const isOther = enot(equal(point, argument));
      const unchanged = fill(fapply(base, argument));
      const outside = enot(inDomain);
      return make(
        "fapplyexcept",
        [
          fill(term),
          inDomain,
          isPoint,
          changed,
          inDomain,
          isOther,
          unchanged,
          outside,
          lambda,
          base,
          point,
          value,
          argument,
        ],
        [],
        [[inDomain, isPoint, changed], [inDomain, isOther, unchanged], [outside]],
      );
    }
    if (isApp(fcn, "TLA.tuple") && isInOneTo(argument, fcn.args.length)) {
      const component = fcn.args[(getNaturalConstant(argument) ?? 0) - 1];
      const replaced = fill(component);
      return make(
        "tuple_access",
        [fill(term), replaced, lambda, term, component],
        [],
        [[replaced]],
      );
    }
    if (isApp(fcn, "TLA.record")) {
      const field = getPairs(fcn.args).find((pair) => pair[0] === argument);
      if (field === undefined) return [];
      const replaced = fill(field[1]);
      return make(
        "record_access",
        [fill(term), replaced, lambda, term, field[1]],
        [],
        [[replaced]],
      );
    }
  }
  if (isApp(term, "TLA.DOMAIN", 1)) {
    const fcn = term.args[0];
    if (isApp(fcn, "TLA.Fcn", 2)) {
      const replaced = fill(fcn.args[0]);
      return make(
        "domain_fcn",
        [fill(term), replaced, lambda, fcn.args[0], fcn.args[1]],
        [],
        [[replaced]],
      );
    }
    if (isApp(fcn, "TLA.except", 3)) {
      const replaced = fill(domain(fcn.args[0]));
      return make("domain_except", [fill(term), replaced, lambda, ...fcn.args], [], [[replaced]]);
    }
    if (isApp(fcn, "TLA.record")) {
      const labels = eapp(
        "TLA.set",
        getPairs(fcn.args).map((pair) => pair[0]),
      );
      const replaced = fill(labels);
      return make("record_domain", [fill(term), replaced, lambda, term, labels], [], [[replaced]]);
    }
    return makeHoleRewrites("TLA.DOMAIN", ["TLA.Fcn", "TLA.except", "TLA.record"], fcn);
  }
  if (isInTerm) {
    if (term.kind === "not") return makeBoolCase("not", [term.args[0]]);
    if (term.kind === "and") return makeBoolCase("and", term.args);
    if (term.kind === "or") return makeBoolCase("or", term.args);
    if (term.kind === "imply") return makeBoolCase("imply", term.args);
    if (term.kind === "equiv") return makeBoolCase("equiv", term.args);
    if (isApp(term, "=", 2)) return makeBoolCase("equal", term.args);
    if (term.kind === "all" || term.kind === "ex")
      return makeBoolCase(term.kind, [elam(term.args[0], term.symbol, term.args[1])]);
  }
  if (isApp(term, "TLA.cond", 3)) {
    const condition = term.args[0];
    const whenTrue = term.args[1];
    const whenFalse = term.args[2];
    if (condition.kind === "true") {
      const replaced = fill(whenTrue);
      return make("iftrue", [fill(term), replaced, lambda, whenTrue, whenFalse], [], [[replaced]]);
    }
    if (condition.kind === "false") {
      const replaced = fill(whenFalse);
      return make("iffalse", [fill(term), replaced, lambda, whenTrue, whenFalse], [], [[replaced]]);
    }
    const thenBranch = fill(whenTrue);
    const negated = enot(condition);
    const elseBranch = fill(whenFalse);
    return make(
      "ifthenelse",
      [fill(term), condition, thenBranch, negated, elseBranch, lambda, ...term.args],
      [],
      [
        [condition, thenBranch],
        [negated, elseBranch],
      ],
    );
  }
  if (isApp(term, "TLA.CASE")) {
    const branches = getCaseBranches(fill, term.args, TRUE);
    const filled = fill(term);
    return make("case", [filled, lambda, ...branches.flat()], [filled], branches);
  }
  if (term.kind === "tau" && !hasExistential(index, term)) {
    const exists = eex(term.args[0], term.symbol, term.args[1]);
    return make("cut", [exists], [], [[exists], [enot(exists)]]);
  }
  if (isApp(term, "TLA.Len", 1)) {
    const sequence = term.args[0];
    if (isApp(sequence, "TLA.tuple")) {
      const length = makeNatural(sequence.args.length);
      const replaced = fill(length);
      return make("tuple_len", [fill(term), replaced, lambda, term, length], [], [[replaced]]);
    }
    return makeHoleRewrites("TLA.Len", ["TLA.tuple"], sequence);
  }
  if (isApp(term, "TLA.isASeq", 1))
    return makeHoleRewrites("TLA.isASeq", ["TLA.tuple"], term.args[0]);
  if (isApp(term, "TLA.in", 2)) {
    const set = term.args[1];
    return makeHoleRewrites("TLA.in", set.kind === "var" ? [] : SET_HEADS, set, term.args[0]);
  }
  if (isApp(term, "TLA.isAFcn", 1))
    return makeHoleRewrites(
      "TLA.isAFcn",
      ["TLA.Fcn", "TLA.except", "TLA.oneArg", "TLA.extend", "TLA.record"],
      term.args[0],
    );
  return [];
};

const hasExistential = (index: Index, choice: Expr) => {
  const body = choice.args[1];
  if (body.kind === "not")
    return (
      index.isMember(eex(choice.args[0], choice.symbol, body)) ||
      index.isMember(enot(eall(choice.args[0], choice.symbol, body.args[0])))
    );
  return index.isMember(eex(choice.args[0], choice.symbol, body));
};

// Zenon's find_rewrites: the rewrites of the outermost subterm that has some, looking through
// applications and negations.
const findRewrites = (
  context: Context,
  isInTerm: boolean,
  hole: Expr,
  frame: Expr,
  term: Expr,
  make: MakeRewrite,
): Item[] => {
  const local = getRewrites(context, isInTerm, hole, frame, term, make);
  if (local.length > 0) return local;
  if (isApp(term, "$notequiv", 2)) return [];
  if (term.kind === "app") {
    for (let position = 0; position < term.args.length; position++) {
      const args = [...term.args];
      args[position] = hole;
      const inner = substitute([[hole, eapp(term.symbol, args)]], frame);
      const found = findRewrites(context, true, hole, inner, term.args[position], make);
      if (found.length > 0) return found;
    }
    return [];
  }
  if (term.kind === "not")
    return findRewrites(
      context,
      false,
      hole,
      substitute([[hole, enot(hole)]], frame),
      term.args[0],
      make,
    );
  return [];
};

const getRewriteNodes = (context: Context, formula: Expr, goalness: number): Item[] => {
  const make: MakeRewrite = (name, args, added, branches) => {
    const node = (conclusions: Expr[], rule: Rule): Node => ({
      conclusions,
      rule,
      priority: "arity",
      goalness,
      branches,
    });
    if (name === "definition") {
      const definition = context.index.getDefinition(args[2].symbol);
      if (definition === undefined) throw new TlaZenonError("Zenon: unfolding an undefined symbol");
      return [
        node([formula, ...added], {
          ...makeRule("definition", [args[0], args[1]]),
          definition,
        }),
      ];
    }
    if (name === "cut") return [node(added, makeRule("cut", args))];
    if (name === "rewrite_lr") return [node([formula, ...added], makeRule("congruence_lr", args))];
    if (name === "rewrite_rl") return [node([formula, ...added], makeRule("congruence_rl", args))];
    const result: Item[] = [node([formula, ...added], makeRule("ext", args, name))];
    return name === "ifthenelse" ? [...result, "stop"] : result;
  };
  const hole = newVar();
  return findRewrites(context, false, hole, hole, formula, make);
};

export interface ExtensionNodes {
  nodes: Node[];
  isStopped: boolean;
}

export const getExtensionNodes = (
  context: Context,
  formula: Expr,
  goalness: number,
): ExtensionNodes => {
  // OCaml evaluates the operands of @ right to left, so the last rules run first. The order
  // decides the names of fresh variables.
  const bounded = getBoundedInstances(context, formula, goalness);
  const right = getEqualityPropositionNodes(context, formula, false);
  const left = getEqualityPropositionNodes(context, formula, true);
  const propositions = getPropositionEqualityNodes(context, formula, goalness);
  const rewrites = getRewriteNodes(context, formula, goalness);
  const props = getPropNodes(context, formula, goalness);
  const items = [...props, ...rewrites, ...propositions, ...left, ...right, ...bounded];
  const stop = items.indexOf("stop");
  const kept = stop === -1 ? items : items.slice(0, stop);
  return { nodes: kept.filter((item): item is Node => item !== "stop"), isStopped: stop !== -1 };
};

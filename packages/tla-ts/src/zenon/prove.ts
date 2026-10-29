// Ported from Zenon's prove.ml, as shipped in tlapm. Copyright 2002 INRIA, see LICENSE.
//
// The tableau search. Each formula added to a branch suggests nodes, which wait in the queue by
// priority. The search takes the next node, and refutes each of its branches in turn. A branch is
// closed when it holds a formula and its negation. Zenon's mutually recursive search functions are
// one loop here, with an explicit stack of frames.

import { TlaZenonError } from "../errors";
import {
  difference,
  eapp,
  eex,
  emeta,
  enot,
  etau,
  evar,
  isDisjoint,
  substitute,
  substituteSecondOrder,
  union,
  type Expr,
} from "./expr";
import { getExtensionNodes } from "./ext-tla";
import { getHead, type Index } from "./index-table";
import {
  EMPTY_QUEUE,
  getQueueHead,
  insertNode,
  makeRule,
  removeNode,
  type Node,
  type Priority,
  type Proof,
  type Queue,
  type Rule,
} from "./node";
import { stableSort } from "./ocaml";
import type { Definition } from "./parse";
import type { Hypothesis } from "./phrase";
import type { Relations } from "./eqrel";

export interface SearchContext {
  index: Index;
  relations: Relations;
}

type RuleResult = [Queue, boolean];

type SearchRule = (
  context: SearchContext,
  queue: Queue,
  formula: Expr,
  goalness: number,
) => RuleResult;

const node = (
  conclusions: Expr[],
  rule: Rule,
  priority: Priority,
  goalness: number,
  branches: Expr[][],
): Node => ({ conclusions, rule, priority, goalness, branches });

const isApp = (expression: Expr, symbol: string, arity?: number) =>
  expression.kind === "app" &&
  expression.symbol === symbol &&
  (arity === undefined || expression.args.length === arity);

const isMeta = (expression: Expr) => expression.kind === "meta";

const unequal = (left: Expr, right: Expr) => enot(eapp("=", [left, right]));

export const makeInstance = (
  queue: Queue,
  quantified: Expr,
  term: Expr,
  goalness: number,
): Queue => {
  if (quantified.kind === "all") {
    const instance = substitute([[quantified.args[0], term]], quantified.args[1]);
    return insertNode(
      queue,
      node([quantified], makeRule("all", [quantified, term]), { instance: quantified }, goalness, [
        [instance],
      ]),
    );
  }
  if (quantified.kind === "ex") {
    const instance = substitute([[quantified.args[0], term]], enot(quantified.args[1]));
    const negated = enot(quantified);
    return insertNode(
      queue,
      node([negated], makeRule("not_ex", [negated, term]), { instance: quantified }, goalness, [
        [instance],
      ]),
    );
  }
  // Zenon hands applications to the extension named by the symbol's prefix, and tla has none.
  if (quantified.kind === "app") return queue;
  throw new TlaZenonError("Zenon: make_inst on a formula that isn't quantified");
};

const makeInequalities = (left: Expr[], right: Expr[]) =>
  left.map((inner, index) => [unequal(inner, right[index])]);

const isGoodMatch = (left: Expr, right: Expr): boolean => {
  if (left.kind === "meta" || right.kind === "meta") return true;
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "var":
      return left.symbol === right.symbol;
    case "app":
      return left.symbol === right.symbol;
    case "not":
      return isGoodMatch(left.args[0], right.args[0]);
    case "and":
    case "or":
    case "imply":
    case "equiv":
      return isGoodMatch(left.args[0], right.args[0]) || isGoodMatch(left.args[1], right.args[1]);
    case "true":
    case "false":
      return true;
    case "tau":
      return left === right;
    default:
      return false;
  }
};

const makeNotEquiv = (
  queue: Queue,
  isSymmetric: boolean,
  positive: [Expr, number],
  negative: [Expr, number],
): Queue => {
  const atom = positive[0];
  const negation = negative[0];
  const negated = negation.args[0];
  if (
    isApp(atom, "TLA.in", 2) &&
    atom.args[1].kind === "var" &&
    negated.args.length === 2 &&
    atom.args[1] !== negated.args[1] &&
    !isMeta(atom.args[0]) &&
    !isMeta(atom.args[1]) &&
    !isMeta(negated.args[0]) &&
    !isMeta(negated.args[1]) &&
    atom.args[0] !== negated.args[0]
  )
    return queue;
  const args = atom.args;
  const negatedArgs = negated.args;
  if ((isSymmetric && negatedArgs.length !== 2) || args.length !== negatedArgs.length) return queue;
  const isGood = args.every((inner, index) => isGoodMatch(inner, negatedArgs[index]));
  const priority: Priority = isGood
    ? atom.symbol === "="
      ? "arity_eq"
      : "arity"
    : { instance: atom };
  return insertNode(
    queue,
    node(
      [atom, negation],
      isSymmetric
        ? makeRule("p_not_p_sym", [atom, negation], atom.symbol)
        : makeRule("p_not_p", [atom, negation]),
      priority,
      Math.min(positive[1], negative[1]),
      makeInequalities(isSymmetric ? [...args].reverse() : args, negatedArgs),
    ),
  );
};

// Zenon's is_conj and is_disj: how many more conjuncts or disjuncts a formula needs to reach m.
const countConjuncts = (formula: Expr, needed: number): number => {
  if (needed <= 0) return 0;
  if (formula.kind === "and")
    return countConjuncts(formula.args[1], countConjuncts(formula.args[0], needed));
  if (formula.kind === "not") return countDisjuncts(formula.args[0], needed);
  return needed - 1;
};

const countDisjuncts = (formula: Expr, needed: number): number => {
  if (needed <= 0) return 0;
  if (formula.kind === "or")
    return countDisjuncts(formula.args[1], countDisjuncts(formula.args[0], needed));
  if (formula.kind === "imply")
    return countDisjuncts(formula.args[1], countConjuncts(formula.args[0], needed));
  if (formula.kind === "not") return countConjuncts(formula.args[0], needed);
  return needed - 1;
};

const decomposeConjunction = (isNegated: boolean, accumulator: Expr[], formula: Expr): Expr[] => {
  if (formula.kind === "and")
    return decomposeConjunction(
      isNegated,
      decomposeConjunction(isNegated, accumulator, formula.args[1]),
      formula.args[0],
    );
  if (formula.kind === "not") return decomposeDisjunction(!isNegated, accumulator, formula.args[0]);
  return [isNegated ? enot(formula) : formula, ...accumulator];
};

const decomposeDisjunction = (isNegated: boolean, accumulator: Expr[], formula: Expr): Expr[] => {
  if (formula.kind === "or")
    return decomposeDisjunction(
      isNegated,
      decomposeDisjunction(isNegated, accumulator, formula.args[1]),
      formula.args[0],
    );
  if (formula.kind === "imply")
    return decomposeConjunction(
      !isNegated,
      decomposeDisjunction(isNegated, accumulator, formula.args[1]),
      formula.args[0],
    );
  if (formula.kind === "not") return decomposeConjunction(!isNegated, accumulator, formula.args[0]);
  return [isNegated ? enot(formula) : formula, ...accumulator];
};

const addAbsurd: SearchRule = (context, queue, formula, goalness) => {
  if (formula.kind === "not" && context.index.isMember(formula.args[0]))
    return [
      insertNode(
        queue,
        node(
          [formula, formula.args[0]],
          makeRule("close", [formula.args[0]]),
          "prop",
          goalness,
          [],
        ),
      ),
      true,
    ];
  const negation = enot(formula);
  if (!context.index.isMember(negation)) return [queue, false];
  return [
    insertNode(
      queue,
      node([formula, negation], makeRule("close", [formula]), "prop", goalness, []),
    ),
    true,
  ];
};

const getStringValue = (expression: Expr) =>
  isApp(expression, "$string", 1) ? expression.args[0] : undefined;

const addClosure: SearchRule = (context, queue, formula, goalness) => {
  const close = (conclusions: Expr[], rule: Rule): RuleResult => [
    insertNode(queue, node(conclusions, rule, "prop", goalness, [])),
    true,
  ];
  if (formula.kind === "false") return close([formula], makeRule("false", []));
  const operand = formula.kind === "not" ? formula.args[0] : undefined;
  if (operand?.kind === "true") return close([formula], makeRule("not_true", []));
  const relations = context.relations;
  if (
    operand?.kind === "app" &&
    operand.args.length === 2 &&
    relations.isReflexive(operand.symbol) &&
    operand.args[0] === operand.args[1]
  )
    return close([formula], makeRule("close_refl", [operand.args[0]], operand.symbol));
  if (
    formula.kind === "app" &&
    formula.args.length === 2 &&
    relations.isSymmetric(formula.symbol)
  ) {
    const reversed = enot(eapp(formula.symbol, [formula.args[1], formula.args[0]]));
    if (context.index.isMember(reversed))
      return close(
        [formula, reversed],
        makeRule("close_sym", [formula.args[0], formula.args[1]], formula.symbol),
      );
  }
  if (
    operand?.kind === "app" &&
    operand.args.length === 2 &&
    relations.isSymmetric(operand.symbol)
  ) {
    const reversed = eapp(operand.symbol, [operand.args[1], operand.args[0]]);
    if (context.index.isMember(reversed))
      return close(
        [formula, reversed],
        makeRule("close_sym", [operand.args[1], operand.args[0]], operand.symbol),
      );
  }
  if (isApp(formula, "=", 2)) {
    const left = getStringValue(formula.args[0]);
    const right = getStringValue(formula.args[1]);
    if (left !== undefined && right !== undefined && left !== right)
      return close([formula], makeRule("ext", [left, right], "stringequal"));
  }
  return [queue, false];
};

const addStringEqualities: SearchRule = (context, queue, formula, goalness) => {
  if (!isApp(formula, "=", 2)) return [queue, false];
  const isRightString = getStringValue(formula.args[1]) !== undefined;
  if (!isRightString && getStringValue(formula.args[0]) === undefined) return [queue, false];
  const string = isRightString ? formula.args[1] : formula.args[0];
  const term = isRightString ? formula.args[0] : formula.args[1];
  const names = isRightString ? ["stringdiffll", "stringdifflr"] : ["stringdiffrl", "stringdiffrr"];
  let current = queue;
  const visit = (name: string, isReversed: boolean, pairs: [Expr, string][]) => {
    for (const pair of pairs) {
      const otherString = eapp("$string", [evar(pair[1])]);
      const equality = eapp("=", isReversed ? [otherString, pair[0]] : [pair[0], otherString]);
      if (string === otherString) continue;
      current = insertNode(
        current,
        node(
          [formula, equality],
          makeRule("ext", [term, string, pair[0], otherString], name),
          "prop",
          goalness,
          [[unequal(term, pair[0])]],
        ),
      );
    }
  };
  visit(names[0], false, context.index.getStringEqualities());
  visit(names[1], true, context.index.getReversedStringEqualities());
  return [current, false];
};

const addJunctionTree: SearchRule = (_context, queue, formula, goalness) => {
  const operand = formula.kind === "not" ? formula.args[0] : undefined;
  const isConjunctive =
    formula.kind === "and" || operand?.kind === "or" || operand?.kind === "imply";
  if (isConjunctive && countConjuncts(formula, 3) === 0)
    return [
      insertNode(
        queue,
        node([formula], makeRule("conj_tree", [formula]), "prop", goalness, [
          decomposeConjunction(false, [], formula),
        ]),
      ),
      true,
    ];
  const isDisjunctive =
    formula.kind === "or" || operand?.kind === "and" || formula.kind === "imply";
  if (isDisjunctive && countDisjuncts(formula, 3) === 0)
    return [
      insertNode(
        queue,
        node(
          [formula],
          makeRule("disj_tree", [formula]),
          "prop",
          goalness,
          decomposeDisjunction(false, [], formula).map((inner) => [inner]),
        ),
      ),
      true,
    ];
  return [queue, false];
};

const addAlpha: SearchRule = (_context, queue, formula, goalness) => {
  const add = (rule: Rule, branch: Expr[]): RuleResult => [
    insertNode(queue, node([formula], rule, "prop", goalness, [branch])),
    true,
  ];
  if (formula.kind === "and")
    return add(makeRule("and", formula.args), [formula.args[0], formula.args[1]]);
  if (formula.kind !== "not") return [queue, false];
  const operand = formula.args[0];
  if (operand.kind === "not") return add(makeRule("not_not", [operand.args[0]]), [operand.args[0]]);
  if (operand.kind === "or")
    return add(makeRule("not_or", operand.args), [enot(operand.args[0]), enot(operand.args[1])]);
  if (operand.kind === "imply")
    return add(makeRule("not_impl", operand.args), [operand.args[0], enot(operand.args[1])]);
  return [queue, false];
};

const addBeta: SearchRule = (_context, queue, formula, goalness) => {
  const add = (rule: Rule, branches: Expr[][]): RuleResult => [
    insertNode(queue, node([formula], rule, "prop", goalness, branches)),
    true,
  ];
  const left = formula.args[0];
  const right = formula.args[1];
  if (formula.kind === "or") return add(makeRule("or", formula.args), [[left], [right]]);
  if (formula.kind === "imply") return add(makeRule("impl", formula.args), [[enot(left)], [right]]);
  if (formula.kind === "equiv")
    return add(makeRule("equiv", formula.args), [
      [enot(left), enot(right)],
      [left, right],
    ]);
  if (formula.kind !== "not") return [queue, false];
  const operand = formula.args[0];
  const first = operand.args[0];
  const second = operand.args[1];
  if (operand.kind === "and")
    return add(makeRule("not_and", operand.args), [[enot(first)], [enot(second)]]);
  if (operand.kind === "equiv")
    return add(makeRule("not_equiv", operand.args), [
      [enot(first), second],
      [first, enot(second)],
    ]);
  return [queue, false];
};

const addDelta: SearchRule = (_context, queue, formula, goalness) => {
  if (formula.kind === "ex") {
    const variable = formula.args[0];
    const body = formula.args[1];
    const witness = substitute([[variable, etau(variable, formula.symbol, body)]], body);
    return [
      insertNode(queue, node([formula], makeRule("ex", [formula]), "prop", goalness, [[witness]])),
      true,
    ];
  }
  if (formula.kind !== "not" || formula.args[0].kind !== "all") return [queue, false];
  const quantified = formula.args[0];
  const variable = quantified.args[0];
  const negatedBody = enot(quantified.args[1]);
  const witness = substitute(
    [[variable, etau(variable, quantified.symbol, negatedBody)]],
    negatedBody,
  );
  const existential = eex(variable, quantified.symbol, negatedBody);
  return [
    insertNode(
      queue,
      node([formula], makeRule("not_all_ex", [formula]), "prop", goalness, [
        [witness, existential],
      ]),
    ),
    true,
  ];
};

const addGamma: SearchRule = (_context, queue, formula, goalness) => {
  if (formula.kind === "all") {
    const meta = emeta(formula);
    const instance = substitute([[formula.args[0], meta]], formula.args[1]);
    return [
      insertNode(
        queue,
        node([formula], makeRule("all", [formula, meta]), "arity", goalness, [[instance]]),
      ),
      true,
    ];
  }
  if (formula.kind !== "not" || formula.args[0].kind !== "ex") return [queue, false];
  const quantified = formula.args[0];
  const meta = emeta(quantified);
  const instance = enot(substitute([[quantified.args[0], meta]], quantified.args[1]));
  return [
    insertNode(
      queue,
      node([formula], makeRule("not_ex", [formula, meta]), "arity", goalness, [[instance]]),
    ),
    true,
  ];
};

const unfold = (
  queue: Queue,
  formula: Expr,
  goalness: number,
  definition: Definition,
  args: Expr[] | undefined,
  wrap: (unfolded: Expr) => Expr,
): RuleResult => {
  const params = definition.params;
  const body = definition.body;
  const add = (unfolded: Expr): RuleResult => {
    const rule: Rule = { ...makeRule("definition", [formula, unfolded]), definition };
    return [insertNode(queue, node([formula], rule, "prop", goalness, [[unfolded]])), true];
  };
  if (params.length === 0 && args !== undefined && body.kind === "var")
    return add(wrap(eapp(body.symbol, args)));
  const actuals = args ?? [];
  if (params.length !== actuals.length) return [queue, false];
  const unfolded = substituteSecondOrder(
    params.map((param, index) => [param, actuals[index]]),
    body,
  );
  return unfolded === undefined ? [queue, false] : add(wrap(unfolded));
};

const addUnfold: SearchRule = (context, queue, formula, goalness) => {
  const index = context.index;
  const isAny = context.relations.isAny;
  const isNegated = formula.kind === "not";
  const atom = isNegated ? formula.args[0] : formula;
  const negate = (inner: Expr) => (isNegated ? enot(inner) : inner);
  const tryUnfold = (term: Expr, wrap: (unfolded: Expr) => Expr) => {
    const definition =
      term.kind === "app" || term.kind === "var" ? index.getDefinition(term.symbol) : undefined;
    return definition === undefined
      ? undefined
      : unfold(
          queue,
          formula,
          goalness,
          definition,
          term.kind === "app" ? term.args : undefined,
          wrap,
        );
  };
  // Zenon tries applications before variables, each first as the formula itself, then as either
  // side of a relation that is reflexive, symmetric or transitive.
  for (const kind of ["app", "var"]) {
    if (atom.kind === kind) {
      const result = tryUnfold(atom, negate);
      if (result !== undefined) return result;
    }
    if (atom.kind !== "app" || atom.args.length !== 2 || !isAny(atom.symbol)) continue;
    const left = atom.args[0];
    const right = atom.args[1];
    if (left.kind === kind) {
      const result = tryUnfold(left, (unfolded) => negate(eapp(atom.symbol, [unfolded, right])));
      if (result !== undefined) return result;
    }
    if (right.kind === kind) {
      const result = tryUnfold(right, (unfolded) => negate(eapp(atom.symbol, [left, unfolded])));
      if (result !== undefined) return result;
    }
  }
  return [queue, false];
};

const addReflexivity: SearchRule = (context, queue, formula, goalness) => {
  if (formula.kind !== "not") return [queue, false];
  const atom = formula.args[0];
  if (atom.kind !== "app" || atom.args.length !== 2) return [queue, false];
  const left = atom.args[0];
  const right = atom.args[1];
  if (atom.symbol !== "=") {
    if (!context.relations.isReflexive(atom.symbol)) return [queue, false];
    return [
      insertNode(
        queue,
        node([formula], makeRule("refl", [left, right], atom.symbol), "arity", goalness, [
          [unequal(left, right)],
        ]),
      ),
      false,
    ];
  }
  if (left.kind === "meta" && right.kind === "meta")
    return [
      makeInstance(
        makeInstance(queue, right.args[0], left, goalness),
        left.args[0],
        right,
        goalness,
      ),
      false,
    ];
  if (left.kind === "meta") return [makeInstance(queue, left.args[0], right, goalness), false];
  if (right.kind === "meta") return [makeInstance(queue, right.args[0], left, goalness), false];
  return [queue, false];
};

const addCongruence: SearchRule = (_context, queue, formula, goalness) => {
  if (formula.kind !== "not" || !isApp(formula.args[0], "=", 2)) return [queue, false];
  const left = formula.args[0].args[0];
  const right = formula.args[0].args[1];
  const leftString = getStringValue(left);
  const rightString = getStringValue(right);
  if (leftString !== undefined && rightString !== undefined && leftString !== rightString)
    return [queue, false];
  if (left.kind !== "app" || right.kind !== "app" || left.symbol !== right.symbol)
    return [queue, false];
  if (left.args.length !== right.args.length) return [queue, false];
  return [
    insertNode(
      queue,
      node(
        [formula],
        makeRule("not_equal", [left, right]),
        "arity",
        goalness,
        makeInequalities(left.args, right.args),
      ),
    ),
    false,
  ];
};

const makeTransNode = (
  isSymmetric: boolean,
  positive: [Expr, number],
  negative: [Expr, number],
) => {
  const atom = positive[0];
  const negated = negative[0].args[0];
  const relation = atom.symbol;
  const left = atom.args[0];
  const right = atom.args[1];
  const negatedLeft = negated.args[0];
  const negatedRight = negated.args[1];
  const terms = isSymmetric
    ? [negatedRight, left, right, negatedLeft]
    : [negatedLeft, left, right, negatedRight];
  return node(
    [atom, negative[0]],
    makeRule(isSymmetric ? "trans_sym" : "trans", [atom, negative[0]]),
    relation === "=" ? "arity_eq" : "arity",
    Math.min(positive[1], negative[1]),
    [
      [unequal(terms[0], terms[1]), enot(eapp(relation, [terms[0], terms[1]]))],
      [unequal(terms[2], terms[3]), enot(eapp(relation, [terms[2], terms[3]]))],
    ],
  );
};

const makeTransEqualityNode = (
  context: SearchContext,
  isSymmetric: boolean,
  equality: [Expr, number],
  negative: [Expr, number],
) => {
  const left = equality[0].args[0];
  const right = equality[0].args[1];
  const negated = negative[0].args[0];
  const relation = negated.symbol;
  const negatedLeft = negated.args[0];
  const negatedRight = negated.args[1];
  const isRelationSymmetric = context.relations.isSymmetric(relation);
  const terms = isSymmetric
    ? isRelationSymmetric
      ? [negatedRight, left, right, negatedLeft]
      : [negatedLeft, right, left, negatedRight]
    : [negatedLeft, left, right, negatedRight];
  const first = enot(eapp(relation, [terms[0], terms[1]]));
  const second = enot(eapp(relation, [terms[2], terms[3]]));
  const name = isSymmetric ? (isRelationSymmetric ? "trans_eq_sym" : "trans_eq2") : "trans_eq";
  return node(
    [equality[0], negative[0]],
    makeRule(name, [left, right, negative[0]]),
    relation === "=" ? "arity_eq" : "arity",
    Math.min(equality[1], negative[1]),
    [
      [unequal(terms[0], terms[1]), first],
      [first, second],
      [unequal(terms[2], terms[3]), second],
    ],
  );
};

const insertAll = (queue: Queue, nodes: Node[]) => nodes.reduce(insertNode, queue);

const addTransitivity: SearchRule = (context, queue, formula, goalness) => {
  const index = context.index;
  const relations = context.relations;
  const entry: [Expr, number] = [formula, goalness];
  const transEq = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransEqualityNode(context, isSymmetric, entry, match);
  const trans = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransNode(isSymmetric, entry, match);
  const negTrans = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransNode(isSymmetric, match, entry);
  const negTransEq = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransEqualityNode(context, isSymmetric, match, entry);
  if (isApp(formula, "=", 2)) {
    const left = formula.args[0];
    const right = formula.args[1];
    if (left.kind === "meta" && right.kind === "meta")
      return [insertAll(queue, index.findNegative("=").map(transEq(false))), false];
    if (!index.addTrans(formula)) return [queue, false];
    const leftHead = getHead(left);
    const rightHead = getHead(right);
    if (leftHead === undefined || rightHead === undefined) return [queue, false];
    return [
      insertAll(queue, [
        ...index.findAllNegTransLeft(leftHead).map(transEq(false)),
        ...index.findAllNegTransLeft(rightHead).map(transEq(true)),
        ...index.findAllNegTransRight(leftHead).map(transEq(true)),
        ...index.findAllNegTransRight(rightHead).map(transEq(false)),
      ]),
      false,
    ];
  }
  if (
    formula.kind === "app" &&
    formula.args.length === 2 &&
    relations.isTransitive(formula.symbol)
  ) {
    if (!index.addTrans(formula)) return [queue, false];
    const relation = formula.symbol;
    const leftHead = getHead(formula.args[0]);
    const rightHead = getHead(formula.args[1]);
    if (leftHead === undefined || rightHead === undefined) return [queue, false];
    const isSymmetric = relations.isSymmetric(relation);
    return [
      insertAll(queue, [
        ...index.findNegTransLeft(relation, leftHead).map(trans(false)),
        ...(isSymmetric ? index.findNegTransLeft(relation, rightHead) : []).map(trans(true)),
        ...(isSymmetric ? index.findNegTransRight(relation, leftHead) : []).map(trans(true)),
        ...index.findNegTransRight(relation, rightHead).map(trans(false)),
      ]),
      false,
    ];
  }
  if (formula.kind !== "not") return [queue, false];
  const atom = formula.args[0];
  if (atom.kind !== "app" || atom.args.length !== 2 || !relations.isTransitive(atom.symbol))
    return [queue, false];
  const relation = atom.symbol;
  index.addNegTrans(formula);
  const leftHead = getHead(atom.args[0]);
  const rightHead = getHead(atom.args[1]);
  if (leftHead === undefined || rightHead === undefined) return [queue, false];
  const isSymmetric = relations.isSymmetric(relation);
  const nodes = [
    ...index.findTransLeft(relation, leftHead).map(negTrans(false)),
    ...(isSymmetric ? index.findTransRight(relation, leftHead) : []).map(negTrans(true)),
    ...(isSymmetric ? index.findTransLeft(relation, rightHead) : []).map(negTrans(true)),
    ...index.findTransRight(relation, rightHead).map(negTrans(false)),
  ];
  const equalityNodes =
    relation === "="
      ? []
      : [
          ...index.findTransLeft("=", leftHead).map(negTransEq(false)),
          ...index.findTransRight("=", leftHead).map(negTransEq(true)),
          ...index.findTransLeft("=", rightHead).map(negTransEq(true)),
          ...index.findTransRight("=", rightHead).map(negTransEq(false)),
        ];
  return [insertAll(queue, [...equalityNodes.reverse(), ...nodes]), false];
};

const addSymmetricMatches: SearchRule = (context, queue, formula, goalness) => {
  const entry: [Expr, number] = [formula, goalness];
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  if (atom.kind !== "app" || atom.args.length !== 2 || atom.symbol === "=") return [queue, false];
  if (!context.relations.isSymmetric(atom.symbol)) return [queue, false];
  if (formula.kind === "not")
    return [
      context.index
        .findPositive(atom.symbol)
        .reduce((current, match) => makeNotEquiv(current, true, match, entry), queue),
      false,
    ];
  return [
    context.index
      .findNegative(atom.symbol)
      .reduce((current, match) => makeNotEquiv(current, true, entry, match), queue),
    false,
  ];
};

const addMatches: SearchRule = (context, queue, formula, goalness) => {
  const entry: [Expr, number] = [formula, goalness];
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  if (atom.kind !== "app" || atom.symbol === "=") return [queue, false];
  if (formula.kind === "not")
    return [
      context.index
        .findPositive(atom.symbol)
        .reduce((current, match) => makeNotEquiv(current, false, match, entry), queue),
      true,
    ];
  return [
    context.index
      .findNegative(atom.symbol)
      .reduce((current, match) => makeNotEquiv(current, false, entry, match), queue),
    true,
  ];
};

const addUseless: SearchRule = (_context, queue, formula) => {
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  const isUseless =
    atom.kind === "var" ||
    atom.kind === "tau" ||
    formula.kind === "true" ||
    (formula.kind === "not" && atom.kind === "false");
  return [queue, isUseless];
};

const addExtensions: SearchRule = (context, queue, formula, goalness) => {
  const result = getExtensionNodes(context, formula, goalness);
  return [insertAll(queue, result.nodes), result.isStopped];
};

// Zenon's newnodes_preunif comes after addReflexivity, but it never adds a node: it preunifies a
// formula with its negation, whose heads always differ.
const RULES: SearchRule[] = [
  addAbsurd,
  addClosure,
  addExtensions,
  addJunctionTree,
  addAlpha,
  addBeta,
  addStringEqualities,
  addDelta,
  addGamma,
  addUnfold,
  addReflexivity,
  addCongruence,
  addTransitivity,
  addSymmetricMatches,
  addMatches,
  addUseless,
];

const addNodes = (context: SearchContext, queue: Queue, formula: Expr, goalness: number) => {
  let current = queue;
  for (const rule of RULES) {
    const result = rule(context, current, formula, goalness);
    current = result[0];
    if (result[1]) break;
  }
  return current;
};

const isTrivial = (context: SearchContext, formula: Expr) =>
  formula.kind === "true" ||
  (formula.kind === "not" && formula.args[0].kind === "false") ||
  (formula.kind === "app" &&
    formula.args.length === 2 &&
    formula.args[0] === formula.args[1] &&
    context.relations.isReflexive(formula.symbol));

// Zenon's reduce_list: drops the formulas a branch already has, and reverses the rest.
const reduceBranch = (context: SearchContext, branch: Expr[]) => {
  const index = context.index;
  const relations = context.relations;
  const kept: Expr[] = [];
  const isKnown = (formula: Expr) => index.isMember(formula) || kept.includes(formula);
  for (const formula of branch) {
    if (
      formula.kind === "true" ||
      (formula.kind === "not" && formula.args[0].kind === "false") ||
      (formula.kind === "not" &&
        isApp(formula.args[0], "TLA.in", 2) &&
        formula.args[0].args[1].kind === "var" &&
        formula.args[0].args[1].symbol === "TLA.emptyset")
    )
      continue;
    const atom = formula.kind === "not" ? formula.args[0] : formula;
    const isRelation = atom.kind === "app" && atom.args.length === 2;
    if (
      formula.kind === "app" &&
      isRelation &&
      formula.args[0] === formula.args[1] &&
      relations.isReflexive(formula.symbol)
    )
      continue;
    if (isRelation && relations.isSymmetric(atom.symbol)) {
      const swapped = eapp(atom.symbol, [atom.args[1], atom.args[0]]);
      const reversed = formula.kind === "not" ? enot(swapped) : swapped;
      if (!isKnown(formula) && !isKnown(reversed)) kept.unshift(formula);
      continue;
    }
    if (!isKnown(formula)) kept.unshift(formula);
  }
  return kept;
};

const isNotMetaEquality = (formula: Expr): boolean => {
  if (formula.kind === "app" && formula.args.length === 2 && formula.symbol === "=")
    return !isMeta(formula.args[0]) && !isMeta(formula.args[1]);
  if (formula.kind === "app" && formula.args.length === 3 && formula.args[0].kind === "var")
    return !(formula.args[0].symbol === "_" && isMeta(formula.args[1]));
  if (formula.kind === "app" && formula.args.length === 2) return !isMeta(formula.args[1]);
  if (formula.kind === "and" || formula.kind === "or")
    return isNotMetaEquality(formula.args[0]) || isNotMetaEquality(formula.args[1]);
  return true;
};

const isNotTrivial = (formula: Expr): boolean => {
  if (formula.kind === "not" && isApp(formula.args[0], "=", 2)) {
    const atom = formula.args[0];
    return !isMeta(atom.args[0]) && !isMeta(atom.args[1]);
  }
  if (formula.kind === "not" && isApp(formula.args[0], "TLA.in", 2)) {
    const atom = formula.args[0];
    if (isMeta(atom.args[0]) && atom.args[1].kind === "var")
      return atom.args[1].symbol === "TLA.emptyset";
    return true;
  }
  if (formula.kind === "and" || formula.kind === "or")
    return isNotTrivial(formula.args[0]) || isNotTrivial(formula.args[1]);
  return true;
};

const countMetas = (formulas: Expr[]) => {
  const metas = new Set(formulas.filter(isNotMetaEquality).flatMap((formula) => formula.metas));
  return [...metas].filter((meta) => meta.metas.length === 0).length;
};

type BranchState = "open" | Proof;

const findOpenBranch = (searchNode: Node, states: BranchState[]) => {
  const last = states.length - 1;
  if (last < 0) return undefined;
  if (states[last] === "open" && searchNode.branches[last].some(isNotMetaEquality)) return last;
  const open: number[] = [];
  for (let index = 0; index <= last; index++) if (states[index] === "open") open.push(index);
  if (open.length <= 1) return open[0];
  const scores = open
    .map((index) => {
      const formulas = searchNode.branches[index];
      return {
        index,
        nontrivial: formulas.filter(isNotTrivial).length,
        metas: countMetas(formulas),
        size: formulas.reduce((total, formula) => total + formula.size, 0),
      };
    })
    .reverse();
  const sorted = stableSort(scores, (left, right) => {
    if (left.nontrivial === 0) return 1;
    if (right.nontrivial === 0) return -1;
    if (left.metas !== right.metas) return right.metas - left.metas;
    return left.size - right.size;
  });
  return sorted[0].index;
};

const isGoodLemma = (rule: Rule) =>
  rule.name !== "close" &&
  rule.name !== "close_refl" &&
  rule.name !== "close_sym" &&
  rule.name !== "false" &&
  rule.name !== "not_true";

interface Frame {
  node: Node;
  queue: Queue;
  states: BranchState[];
  current: number;
}

export interface SearchStatistics {
  inferences: number;
  proofNodes: number;
}

// The proof of the hypotheses' inconsistency, or undefined when the search space is exhausted or
// the deadline passes.
export const search = (
  context: SearchContext,
  definitions: Definition[],
  hypotheses: Hypothesis[],
  deadline: number,
  statistics: SearchStatistics,
): Proof | undefined => {
  const index = context.index;
  definitions.forEach(index.addDefinition);
  const initial: [Expr, number][] = [];
  for (const hypothesis of hypotheses)
    if (!initial.some((entry) => entry[0] === hypothesis.formula))
      initial.unshift([hypothesis.formula, hypothesis.goalness]);

  const stack: Frame[] = [];
  let forms = initial;
  let formIndex = 0;
  let queue = EMPTY_QUEUE;

  const makeResult = (searchNode: Node, states: BranchState[]): Proof => {
    let conclusions: Expr[] = [];
    const subproofs: Proof[] = [];
    states.forEach((state, branchIndex) => {
      if (state === "open") throw new TlaZenonError("Zenon: an open branch in a closed node");
      subproofs.push(state);
      conclusions = union(
        difference(state.conclusions, searchNode.branches[branchIndex]),
        conclusions,
      );
    });
    statistics.proofNodes++;
    const proof: Proof = {
      conclusions: union(searchNode.conclusions, conclusions),
      rule: searchNode.rule,
      uses: searchNode.conclusions,
      subproofs,
    };
    if (isGoodLemma(searchNode.rule)) index.addLemma(proof);
    return proof;
  };

  // Zenon's next_branch and unwind: descend into the next open branch of a node, or close the node
  // and pop frames until one has an open branch left.
  const advance = (
    searchNode: Node,
    nodeQueue: Queue,
    states: BranchState[],
  ): Proof | undefined => {
    let currentNode = searchNode;
    let currentQueue = nodeQueue;
    let currentStates = states;
    for (;;) {
      const open = findOpenBranch(currentNode, currentStates);
      if (open !== undefined) {
        stack.push({
          node: currentNode,
          queue: currentQueue,
          states: currentStates,
          current: open,
        });
        forms = currentNode.branches[open].map((formula) => [formula, currentNode.goalness]);
        formIndex = 0;
        queue = currentQueue;
        return undefined;
      }
      const result = makeResult(currentNode, currentStates);
      const closed = unwind(result);
      if (closed !== undefined) return closed;
      const frame = stack[stack.length - 1];
      currentNode = frame.node;
      currentQueue = frame.queue;
      currentStates = frame.states;
      stack.pop();
    }
  };

  // Pops the frames that the proof closes. Returns the proof when it closes the root, and leaves the
  // frame to continue on top of the stack otherwise, with the proof recorded.
  const unwind = (proof: Proof): Proof | undefined => {
    for (;;) {
      const frame = stack.pop();
      if (frame === undefined) return proof;
      const branch = frame.node.branches[frame.current];
      for (let position = branch.length - 1; position >= 0; position--)
        if (index.isMember(branch[position])) index.remove(branch[position]);
      if (isDisjoint(branch, proof.conclusions)) continue;
      frame.states[frame.current] = proof;
      stack.push(frame);
      return undefined;
    }
  };

  for (;;) {
    if (Date.now() > deadline) return undefined;
    if (formIndex < forms.length) {
      const entry = forms[formIndex++];
      const formula = entry[0];
      if (isTrivial(context, formula)) continue;
      index.add(formula, entry[1]);
      queue = addNodes(context, queue, formula, entry[1]);
      continue;
    }
    const head = getQueueHead(queue);
    const lemma = head === undefined || isGoodLemma(head.rule) ? index.searchLemma() : undefined;
    if (lemma !== undefined) {
      const closed = unwind(lemma);
      if (closed !== undefined) return closed;
      const frame = stack[stack.length - 1];
      stack.pop();
      const result = advance(frame.node, frame.queue, frame.states);
      if (result !== undefined) return result;
      continue;
    }
    // Zenon's next_node: the next node whose branches all add something new.
    for (;;) {
      statistics.inferences++;
      const removed = removeNode(queue);
      if (removed === undefined) return undefined;
      queue = removed[1];
      const reduced = removed[0].branches.map((branch) => reduceBranch(context, branch));
      if (reduced.some((branch) => branch.length === 0)) continue;
      const searchNode = { ...removed[0], branches: reduced };
      const result = advance(
        searchNode,
        queue,
        reduced.map((): BranchState => "open"),
      );
      if (result !== undefined) return result;
      break;
    }
  }
};

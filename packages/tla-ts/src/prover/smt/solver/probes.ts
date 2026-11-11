// Ported from Z3 (src/tactic/probe.cpp, src/tactic/arith/probe_arith.cpp), MIT license, see
// z3-license.txt.
import { SmtParseError, SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_FPA,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_ALGEBRAIC_NUM,
  OP_BSDIV0,
  OP_BSMOD0,
  OP_BSREM0,
  OP_BUDIV0,
  OP_BUREM0,
  OP_BV_NUM,
  OP_CONCAT,
  OP_DISTINCT,
  OP_DIV,
  OP_EQ,
  OP_EXTRACT,
  OP_FPA_TO_REAL,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IS_INT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_POWER,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { getAckrBound } from "./ackr-helper";
import { BoundManager } from "./bound-manager";
import type { Goal } from "./goal";
import { isSymbol, type SExpr, type SmtToken } from "./smtlib-parser";

export interface Probe {
  (goal: Goal): number;
}

const forEachExpr = (goal: Goal, visit: (expr: number) => void) => {
  const manager = goal.manager;
  const visited = new Set<number>();
  const todo = [...goal.forms.items].reverse();
  while (todo.length > 0) {
    const expr = todo.pop() as number;
    if (visited.has(expr)) continue;
    visited.add(expr);
    visit(expr);
    if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
    else if (manager.kinds[expr] === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      todo.push(data.body, ...data.patterns, ...data.noPatterns);
    }
  }
};

const countExprs = (goal: Goal, isCounted: (expr: number) => boolean) => {
  let count = 0;
  forEachExpr(goal, (expr) => {
    if (isCounted(expr)) count++;
  });
  return count;
};

const isNone = (goal: Goal, isFound: (expr: number) => boolean) => countExprs(goal, isFound) === 0;

const mkTest =
  (isFound: (manager: AstManager, expr: number) => boolean): Probe =>
  (goal) =>
    Number(isNone(goal, (expr) => isFound(goal.manager, expr)));

const isConst = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP && manager.getNumArgs(expr) === 0 && !manager.isValue(expr);

const isArithSort = (sort: number) => sort === SORT_INT || sort === SORT_REAL;

const isApp = (manager: AstManager, expr: number) => manager.kinds[expr] === KIND_APP;

const isNonPropositional = (manager: AstManager, expr: number) =>
  !isApp(manager, expr) ||
  manager.sorts[expr] !== SORT_BOOL ||
  (manager.getFamily(expr) !== FAMILY_BASIC && !manager.isUninterpretedConst(expr));

const BV_DIV0_OPS = [OP_BSDIV0, OP_BUDIV0, OP_BSREM0, OP_BUREM0, OP_BSMOD0];

const isNonQfbv = (manager: AstManager, expr: number) => {
  if (!isApp(manager, expr)) return true;
  if (manager.sorts[expr] !== SORT_BOOL && !manager.isBvSort(manager.sorts[expr])) return true;
  const family = manager.getFamily(expr);
  if (family === FAMILY_BASIC) return false;
  if (family === FAMILY_BV) return BV_DIV0_OPS.includes(manager.getOp(expr));
  return !manager.isUninterpretedConst(expr);
};

const isNonQfaufbv = (manager: AstManager, expr: number) => {
  if (!isApp(manager, expr)) return true;
  const sort = manager.sorts[expr];
  if (sort !== SORT_BOOL && !manager.isBvSort(sort) && !manager.isArraySort(sort)) return true;
  const family = manager.getFamily(expr);
  return (
    family !== FAMILY_BASIC &&
    family !== FAMILY_BV &&
    family !== FAMILY_ARRAY &&
    !manager.isUninterpreted(expr)
  );
};

const isNonQfufbv = (manager: AstManager, expr: number) => {
  if (!isApp(manager, expr)) return true;
  if (manager.sorts[expr] !== SORT_BOOL && !manager.isBvSort(manager.sorts[expr])) return true;
  const family = manager.getFamily(expr);
  return family !== FAMILY_BASIC && family !== FAMILY_BV && !manager.isUninterpreted(expr);
};

export const isQfufbv = mkTest(isNonQfufbv);

const isNonQfbvEq = (manager: AstManager, expr: number) =>
  manager.kinds[expr] !== KIND_APP ||
  (manager.getFamily(expr) === FAMILY_BV &&
    ![OP_BV_NUM, OP_EXTRACT, OP_CONCAT].includes(manager.getOp(expr)));

const mkNonQffp = (isLra: boolean) => (manager: AstManager, expr: number) => {
  if (!isApp(manager, expr)) return true;
  const sort = manager.sorts[expr];
  if (
    sort !== SORT_BOOL &&
    !manager.isFpSort(sort) &&
    !manager.isRmSort(sort) &&
    !manager.isBvSort(sort) &&
    sort !== SORT_REAL
  )
    return true;
  const family = manager.getFamily(expr);
  if (family === FAMILY_BASIC || family === FAMILY_FPA || family === FAMILY_BV) return false;
  if ((isLra && family === FAMILY_ARITH) || manager.isUninterpretedConst(expr)) return false;
  return isLra ? sort !== SORT_REAL : !(sort === SORT_REAL && manager.isNumeral(expr));
};

// Ported from Z3 (src/tactic/fpa/qffp_tactic.cpp). Z3 rejects every application of the basic family
// before it would accept one, so the goal must not have a Boolean connective.
const isNonFpQfnra = (manager: AstManager, expr: number) => {
  if (!isApp(manager, expr)) return true;
  const family = manager.getFamily(expr);
  const sort = manager.sorts[expr];
  if (family === FAMILY_FPA)
    return (
      !manager.isFpSort(sort) && !manager.isRmSort(sort) && manager.getOp(expr) !== OP_FPA_TO_REAL
    );
  return (
    family !== FAMILY_USER ||
    (!manager.isFpSort(sort) && !manager.isRmSort(sort) && sort !== SORT_BOOL)
  );
};

// Z3 builds these probes into its tactics without registering them by name.
const INTERNAL_PROBES = new Map<string, Probe>([["is-fp-qfnra", mkTest(isNonFpQfnra)]]);

const LINEAR_OPS = [OP_LE, OP_GE, OP_LT, OP_GT, OP_ADD, OP_NUM];

const isLinearMul = (manager: AstManager, expr: number) =>
  manager.getNumArgs(expr) === 2 && manager.isNumeral(manager.getArg(expr, 0));

const mkNonLira =
  (isInt: boolean, isReal: boolean, isArray: boolean) => (manager: AstManager, expr: number) => {
    if (!isApp(manager, expr)) return true;
    const sort = manager.sorts[expr];
    if (
      sort !== SORT_BOOL &&
      !(isInt && sort === SORT_INT) &&
      !(isReal && sort === SORT_REAL) &&
      !(isArray && manager.isArraySort(sort))
    )
      return true;
    const family = manager.getFamily(expr);
    if (family === FAMILY_BASIC || (isArray && family === FAMILY_ARRAY)) return false;
    if (family !== FAMILY_ARITH)
      return isArray ? !manager.isUninterpreted(expr) : !manager.isUninterpretedConst(expr);
    const op = manager.getOp(expr);
    if (LINEAR_OPS.includes(op)) return false;
    if (op === OP_MUL) return !isLinearMul(manager, expr);
    return op !== OP_TO_REAL || !isReal;
  };

const isNonQflia = mkNonLira(true, false, false);

const isTermIte = (manager: AstManager, expr: number) =>
  manager.getOp(expr) === OP_ITE && manager.sorts[expr] !== SORT_BOOL;

const isLp = (goal: Goal) => {
  const manager = goal.manager;
  return goal.forms.items.every((form) => {
    let atom = form;
    let isNegated = false;
    while (manager.isNot(atom)) {
      atom = manager.getArg(atom, 0);
      isNegated = !isNegated;
    }
    if (manager.getOp(atom) === OP_EQ && !isNegated)
      return isArithSort(manager.sorts[manager.getArg(atom, 0)]);
    return [OP_LE, OP_GE, OP_LT, OP_GT].includes(manager.getOp(atom));
  });
};

const isIlp: Probe = (goal) =>
  Number(
    isNone(goal, (expr) => isNonQflia(goal.manager, expr)) &&
      isNone(goal, (expr) => isTermIte(goal.manager, expr)) &&
      isLp(goal),
  );

const hasNonlinearMul = (manager: AstManager, expr: number) => {
  if (!isApp(manager, expr) || manager.getFamily(expr) !== FAMILY_ARITH) return false;
  const op = manager.getOp(expr);
  if (op === OP_MUL) return !isLinearMul(manager, expr);
  if (op === OP_IDIV || op === OP_DIV || op === OP_MOD)
    return !manager.isNumeral(manager.getArg(expr, 1));
  return op === OP_POWER;
};

const NIRA_OPS = [OP_LE, OP_GE, OP_LT, OP_GT, OP_ADD, OP_UMINUS, OP_SUB, OP_ABS, OP_NUM];

const mkNonNira =
  (isInt: boolean, isReal: boolean, isQuantified: boolean, isLinear: boolean) =>
  (manager: AstManager, expr: number) => {
    const sort = manager.sorts[expr];
    const isCompatible =
      sort === SORT_BOOL || (isInt && sort === SORT_INT) || (isReal && sort === SORT_REAL);
    if (manager.kinds[expr] === KIND_VAR) return !isQuantified || !isCompatible;
    if (manager.kinds[expr] === KIND_QUANTIFIER) return !isQuantified;
    if (!isCompatible) return true;
    const family = manager.getFamily(expr);
    if (family === FAMILY_BASIC) return false;
    if (family !== FAMILY_ARITH) return !manager.isUninterpretedConst(expr);
    const op = manager.getOp(expr);
    if (NIRA_OPS.includes(op)) return false;
    if (op === OP_MUL)
      return (
        isLinear &&
        (manager.getNumArgs(expr) !== 2 ||
          (!manager.isNumeral(manager.getArg(expr, 0)) &&
            !manager.isNumeral(manager.getArg(expr, 1))))
      );
    if (op === OP_IDIV || op === OP_DIV || op === OP_MOD) {
      const divisor = manager.getArg(expr, 1);
      if (isLinear)
        return !manager.isNumeral(divisor) || manager.getRationalValue(divisor).isZero();
      return !manager.isGround(manager.getArg(expr, 0)) || !manager.isGround(divisor);
    }
    if (op === OP_IS_INT) return isReal;
    if (op === OP_TO_INT || op === OP_TO_REAL) return false;
    if (op === OP_POWER) return isLinear;
    if (op === OP_ALGEBRAIC_NUM) return isLinear || !isReal;
    return true;
  };

const mkNiraProbe =
  (isInt: boolean, isReal: boolean, isQuantified: boolean, isLinear: boolean): Probe =>
  (goal) => {
    const isNonNira = mkNonNira(isInt, isReal, isQuantified, isLinear);
    return Number(
      isNone(goal, (expr) => isNonNira(goal.manager, expr)) &&
        (isLinear || !isNone(goal, (expr) => hasNonlinearMul(goal.manager, expr))),
    );
  };

const isQfufnra: Probe = (goal) => {
  const manager = goal.manager;
  let isNonlinear = false;
  const isFound = (expr: number) => {
    if (manager.kinds[expr] !== KIND_APP) return true;
    if (manager.getFamily(expr) !== FAMILY_ARITH) return false;
    const op = manager.getOp(expr);
    if (NIRA_OPS.includes(op) || op === OP_ALGEBRAIC_NUM) return false;
    if (op === OP_MUL) {
      const first = manager.getArg(expr, 0);
      if (
        manager.getNumArgs(expr) === 2 &&
        manager.sorts[first] === SORT_REAL &&
        !manager.isNumeral(first) &&
        !manager.isNumeral(manager.getArg(expr, 1))
      )
        isNonlinear = true;
      return false;
    }
    if (op === OP_IDIV || op === OP_DIV || op === OP_MOD)
      return !manager.isNumeral(manager.getArg(expr, 1));
    if (op === OP_POWER) {
      if (!manager.isNumeral(manager.getArg(expr, 1))) return true;
      isNonlinear = true;
      return false;
    }
    return true;
  };
  return Number(
    !goal.isProofsEnabled && !goal.isCoresEnabled && isNone(goal, isFound) && isNonlinear,
  );
};

const getBounds = (goal: Goal) => {
  const bounds = new BoundManager(goal.manager);
  if (!goal.isProofsEnabled) for (const form of goal.forms.items) bounds.add(form);
  return bounds;
};

const isUnbounded: Probe = (goal) => {
  const manager = goal.manager;
  const bounds = getBounds(goal);
  return Number(
    !isNone(
      goal,
      (expr) =>
        manager.kinds[expr] === KIND_APP &&
        manager.isUninterpretedConst(expr) &&
        isArithSort(manager.sorts[expr]) &&
        (!bounds.lowers.has(expr) || !bounds.uppers.has(expr)),
    ),
  );
};

const isQuasiPb: Probe = (goal) => {
  if (isUnbounded(goal) !== 0) return 0;
  const bounds = getBounds(goal);
  return Number(bounds.boundedVars.filter((variable) => !bounds.isZeroOne(variable)).length <= 1);
};

const isPb: Probe = (goal) => {
  const manager = goal.manager;
  const bounds = getBounds(goal);
  const visited = new Set<number>();
  const todo = [...goal.forms.items];
  while (todo.length > 0) {
    const expr = todo.pop() as number;
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] !== KIND_APP) return 0;
    manager.pushArgs(expr, todo);
    const family = manager.getFamily(expr);
    if (family === FAMILY_BASIC) {
      if (isTermIte(manager, expr) || manager.getOp(expr) === OP_DISTINCT) return 0;
      continue;
    }
    if (family === FAMILY_ARITH) {
      const op = manager.getOp(expr);
      if (LINEAR_OPS.includes(op) || (op === OP_MUL && isLinearMul(manager, expr))) continue;
      return 0;
    }
    if (manager.isUninterpretedConst(expr)) {
      if (manager.sorts[expr] === SORT_BOOL) continue;
      if (manager.sorts[expr] === SORT_INT && bounds.isZeroOne(expr)) continue;
    }
    return 0;
  }
  return 1;
};

const hasQuantifiers: Probe = (goal) =>
  Number(!isNone(goal, (expr) => goal.manager.kinds[expr] === KIND_QUANTIFIER));

const hasPatterns: Probe = (goal) => {
  const manager = goal.manager;
  return Number(
    !isNone(
      goal,
      (expr) =>
        manager.kinds[expr] === KIND_QUANTIFIER && manager.getQuantifier(expr).patterns.length > 0,
    ),
  );
};

const NAMED_PROBES = new Map<string, Probe>([
  ["depth", (goal) => goal.depth],
  ["size", (goal) => goal.forms.size],
  ["num-exprs", (goal) => countExprs(goal, () => true)],
  [
    "num-consts",
    (goal) =>
      countExprs(
        goal,
        (expr) => isConst(goal.manager, expr) && goal.manager.sorts[expr] !== SORT_BOOL,
      ),
  ],
  [
    "num-bool-consts",
    (goal) =>
      countExprs(
        goal,
        (expr) => isConst(goal.manager, expr) && goal.manager.sorts[expr] === SORT_BOOL,
      ),
  ],
  [
    "num-arith-consts",
    (goal) =>
      countExprs(
        goal,
        (expr) => isConst(goal.manager, expr) && isArithSort(goal.manager.sorts[expr]),
      ),
  ],
  [
    "num-bv-consts",
    (goal) =>
      countExprs(
        goal,
        (expr) => isConst(goal.manager, expr) && goal.manager.isBvSort(goal.manager.sorts[expr]),
      ),
  ],
  ["produce-proofs", (goal) => Number(goal.isProofsEnabled)],
  ["produce-model", () => 1],
  ["produce-unsat-cores", (goal) => Number(goal.isCoresEnabled)],
  ["has-quantifiers", hasQuantifiers],
  ["has-patterns", hasPatterns],
  ["is-propositional", mkTest(isNonPropositional)],
  ["is-qfbv", mkTest(isNonQfbv)],
  ["is-qfaufbv", mkTest(isNonQfaufbv)],
  ["is-qfbv-eq", mkTest(isNonQfbvEq)],
  ["is-quasi-pb", isQuasiPb],
  ["is-unbounded", isUnbounded],
  ["is-pb", isPb],
  ["is-qflia", mkTest(isNonQflia)],
  ["is-qfauflia", mkTest(mkNonLira(true, false, true))],
  ["is-qflra", mkTest(mkNonLira(false, true, false))],
  ["is-qflira", mkTest(mkNonLira(true, true, false))],
  ["is-ilp", isIlp],
  ["is-qfnia", mkNiraProbe(true, false, false, false)],
  ["is-qfnra", mkNiraProbe(false, true, false, false)],
  ["is-nia", mkNiraProbe(true, false, true, false)],
  ["is-nra", mkNiraProbe(false, true, true, false)],
  ["is-nira", mkNiraProbe(true, true, true, false)],
  ["is-lia", mkNiraProbe(true, false, true, true)],
  ["is-lra", mkNiraProbe(false, true, true, true)],
  ["is-lira", mkNiraProbe(true, true, true, true)],
  ["is-qfufnra", isQfufnra],
  ["is-qffp", mkTest(mkNonQffp(false))],
  ["is-qffpbv", mkTest(mkNonQffp(false))],
  ["is-qffplra", mkTest(mkNonQffp(true))],
  ["ackr-bound-probe", getAckrBound],
]);

const UNPORTED_PROBES = new Set(
  "memory arith-max-deg arith-avg-deg arith-max-bw arith-avg-bw".split(" "),
);

const BINARY_PROBES = new Map<string, (first: number, second: number) => number>([
  ["=", (first, second) => Number(first === second)],
  ["<=", (first, second) => Number(first <= second)],
  [">=", (first, second) => Number(first >= second)],
  ["<", (first, second) => Number(first < second)],
  [">", (first, second) => Number(first > second)],
  ["=>", (first, second) => Number(first === 0 || second !== 0)],
  ["implies", (first, second) => Number(first === 0 || second !== 0)],
  ["-", (first, second) => first - second],
  ["/", (first, second) => first / second],
]);

const NARY_PROBES = new Map<string, (first: number, second: number) => number>([
  ["and", (first, second) => Number(first !== 0 && second !== 0)],
  ["or", (first, second) => Number(first !== 0 || second !== 0)],
  ["+", (first, second) => first + second],
  ["*", (first, second) => first * second],
]);

export const compileProbe = (sexpr: SExpr, end: SmtToken, isInternal = false): Probe => {
  if (sexpr.kind === "numeral") {
    const value = Number(sexpr.text);
    if (value > 2 ** 31 - 1)
      throw new SmtParseError(
        "invalid probe, constant is too big to fit in a fixed size integer",
        end,
      );
    return () => value;
  }
  if (sexpr.kind !== "list") {
    if (!isSymbol(sexpr)) throw new SmtParseError("invalid probe, unexpected input", end);
    const named =
      NAMED_PROBES.get(sexpr.text) ?? (isInternal ? INTERNAL_PROBES.get(sexpr.text) : undefined);
    if (named !== undefined) return named;
    if (UNPORTED_PROBES.has(sexpr.text)) throw new SmtUnsupportedError(`the probe ${sexpr.text}`);
    throw new SmtParseError(`invalid probe, unknown builtin probe ${sexpr.text}`, end);
  }
  const head = sexpr.items[0];
  if (head === undefined) throw new SmtParseError("invalid probe, arguments expected", end);
  if (!isSymbol(head)) throw new SmtParseError("invalid probe, symbol expected", end);
  const children = sexpr.items.slice(1);
  if (head.text === "not") {
    if (children.length !== 1)
      throw new SmtParseError("invalid probe expression, one argument expected", end);
    const child = compileProbe(children[0], end, isInternal);
    return (goal) => Number(child(goal) === 0);
  }
  const binary = BINARY_PROBES.get(head.text);
  if (binary !== undefined) {
    if (children.length !== 2)
      throw new SmtParseError("invalid probe expression, two arguments expected", end);
    const first = compileProbe(children[0], end, isInternal);
    const second = compileProbe(children[1], end, isInternal);
    return (goal) => binary(first(goal), second(goal));
  }
  const nary = NARY_PROBES.get(head.text);
  if (nary === undefined)
    throw new SmtParseError(`invalid probe, unknown probe expression ${head.text}`, end);
  if (children.length === 0)
    throw new SmtParseError("invalid probe, at least one argument expected", end);
  const probes = children.map((child) => compileProbe(child, end, isInternal));
  return (goal) => probes.map((probe) => probe(goal)).reduce(nary);
};

export const formatProbeValue = (value: number) =>
  Number.isInteger(value) && Math.abs(value) < 1e6
    ? String(value)
    : String(Number(value.toPrecision(6)));

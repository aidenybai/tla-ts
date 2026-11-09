// Ported from Z3 (src/solver/check_logic.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_CHAR,
  FAMILY_DATATYPE,
  FAMILY_FINITE_SET,
  FAMILY_FPA,
  FAMILY_MODEL_VALUE,
  FAMILY_SEQ,
  FAMILY_USER,
  KIND_APP,
  KIND_VAR,
  OP_ADD,
  OP_DISTINCT,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_REM,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";

interface LogicFlags {
  isUf: boolean;
  isDt: boolean;
  isArrays: boolean;
  isBvArrays: boolean;
  isReals: boolean;
  isInts: boolean;
  isDiff: boolean;
  isNonlinear: boolean;
  isBvs: boolean;
  isQuantifiers: boolean;
  isAllowingCasts: boolean;
}

const NO_FLAGS: LogicFlags = {
  isUf: false,
  isDt: false,
  isArrays: false,
  isBvArrays: false,
  isReals: false,
  isInts: false,
  isDiff: false,
  isNonlinear: false,
  isBvs: false,
  isQuantifiers: false,
  isAllowingCasts: false,
};

const STRING_FLAGS = {
  isUf: true,
  isBvs: true,
  isInts: true,
  isArrays: true,
  isReals: true,
  isQuantifiers: true,
};

const LOGICS = new Map<string, Partial<LogicFlags>>([
  ["AUFLIA", { isUf: true, isArrays: true, isInts: true, isQuantifiers: true }],
  ["AUFLIRA", { isUf: true, isArrays: true, isReals: true, isInts: true, isQuantifiers: true }],
  [
    "AUFNIRA",
    {
      isUf: true,
      isArrays: true,
      isReals: true,
      isInts: true,
      isNonlinear: true,
      isQuantifiers: true,
    },
  ],
  ["LRA", { isReals: true, isQuantifiers: true }],
  ["QF_ABV", { isBvArrays: true, isBvs: true }],
  ["QF_AUFBV", { isUf: true, isBvArrays: true, isBvs: true }],
  ["QF_UFBV", { isUf: true, isBvs: true }],
  ["QF_UFDT", { isUf: true, isDt: true }],
  ["QF_DT", { isDt: true }],
  ["QF_AUFLIA", { isUf: true, isArrays: true, isInts: true }],
  ["QF_AX", { isArrays: true }],
  ["QF_FF", {}],
  ["QF_FFA", {}],
  ["QF_BV", { isBvs: true }],
  ["QF_IDL", { isInts: true, isDiff: true }],
  ["QF_RDL", { isReals: true, isDiff: true }],
  ["QF_LIA", { isInts: true }],
  ["QF_LRA", { isReals: true }],
  ["QF_NIA", { isInts: true, isNonlinear: true }],
  ["QF_NRA", { isReals: true, isNonlinear: true }],
  ["QF_NTA", { isReals: true, isNonlinear: true, isAllowingCasts: true }],
  ["QF_UF", { isUf: true }],
  ["QF_UFIDL", { isUf: true, isInts: true, isDiff: true }],
  ["QF_UFLIA", { isUf: true, isInts: true }],
  ["QF_UFLRA", { isUf: true, isReals: true }],
  ["QF_UFNRA", { isUf: true, isReals: true, isNonlinear: true }],
  ["UFLRA", { isUf: true, isReals: true, isQuantifiers: true }],
  ["UFNIA", { isUf: true, isInts: true, isQuantifiers: true, isNonlinear: true }],
  ["UFBV", { isUf: true, isBvs: true, isQuantifiers: true }],
  ["QF_S", STRING_FLAGS],
  ["QF_SLIA", STRING_FLAGS],
  ["QF_FD", { isBvs: true, isUf: true, isInts: true, isDt: true, isNonlinear: true }],
  ["SMTFD", { isBvs: true, isUf: true, isArrays: true }],
]);

const FAMILY_NAMES = new Map([
  [FAMILY_FINITE_SET, "finite_set"],
  [FAMILY_DATATYPE, "datatype"],
  [FAMILY_FPA, "fpa"],
  [FAMILY_CHAR, "char"],
]);

const NONLINEAR = "logic does not support nonlinear arithmetic";
const NON_DIFF = "logic only supports difference arithmetic";

export const createLogicChecker = (manager: AstManager, logic: string | undefined) => {
  const known = logic === undefined ? undefined : LOGICS.get(logic);
  const flags = { ...NO_FLAGS, ...known };

  const checkSort = (sort: number): string | undefined => {
    if (manager.isUninterpretedSort(sort))
      return flags.isUf ? undefined : "logic does not support uninterpreted sorts";
    if (sort === SORT_BOOL) return undefined;
    if (sort === SORT_INT) return flags.isInts ? undefined : "logic does not support integers";
    if (sort === SORT_REAL) return flags.isReals ? undefined : "logic does not support reals";
    if (manager.isBvSort(sort))
      return flags.isBvs ? undefined : "logic does not support bitvectors";
    if (manager.isDatatypeSort(sort))
      return flags.isDt ? undefined : "logic does not support algebraic datatypes";
    if (!manager.isArraySort(sort) || flags.isArrays) return undefined;
    if (!flags.isBvArrays) return "logic does not support arrays";
    const parameters = manager.getSortParameters(sort);
    if (parameters.slice(0, -1).some((domain) => !manager.isBvSort(domain)))
      return "logic supports only arrays from bitvectors to bitvectors";
    return checkSort(manager.getArrayRange(sort));
  };

  const isIntNumeral = (expr: number) => {
    const negated = manager.getOp(expr) === OP_UMINUS ? manager.getArg(expr, 0) : expr;
    const real = manager.getOp(negated) === OP_TO_REAL ? manager.getArg(negated, 0) : negated;
    return manager.getOp(real) === OP_NUM;
  };

  const isNumeral = (expr: number) => {
    const negated = manager.getOp(expr) === OP_UMINUS ? manager.getArg(expr, 0) : expr;
    return (
      isIntNumeral(negated) ||
      (manager.getOp(negated) === OP_DIV &&
        isIntNumeral(manager.getArg(negated, 0)) &&
        isIntNumeral(manager.getArg(negated, 1)))
    );
  };

  const isArith = (expr: number) =>
    manager.sorts[expr] === SORT_INT || manager.sorts[expr] === SORT_REAL;

  const isDiffVar = (expr: number) =>
    (manager.kinds[expr] === KIND_APP && manager.getFamily(expr) === FAMILY_USER) ||
    manager.getOp(expr) === OP_ITE;

  const isAddOrSub = (expr: number) =>
    manager.getOp(expr) === OP_ADD || manager.getOp(expr) === OP_SUB;

  const isOffset = (expr: number) => {
    for (let current = expr; ;) {
      const nonNumerals = manager.getArgs(current).filter((arg) => !isNumeral(arg));
      if (nonNumerals.length > 1) return false;
      if (nonNumerals.length === 0 || isDiffVar(nonNumerals[0])) return true;
      if (!isAddOrSub(nonNumerals[0])) return false;
      current = nonNumerals[0];
    }
  };

  const isDiffArg = (expr: number) =>
    isDiffVar(expr) || isNumeral(expr) || (isAddOrSub(expr) && isOffset(expr));

  const hasSameArgs = (expr: number) => {
    const args = manager.getArgs(expr);
    return args.length > 0 && args.every((arg) => arg === args[0]);
  };

  const checkDiffPredicate = (expr: number) => {
    const first = manager.getArg(expr, 0);
    const second = manager.getArg(expr, 1);
    if (!isArith(first) || (isDiffArg(first) && isDiffArg(second))) return undefined;
    const [lhs, rhs] = isNumeral(first) ? [second, first] : [first, second];
    if (!isNumeral(rhs) || manager.getOp(lhs) !== OP_SUB || manager.getNumArgs(lhs) !== 2)
      return NON_DIFF;
    const minuend = manager.getArg(lhs, 0);
    const subtrahend = manager.getArg(lhs, 1);
    if (isDiffVar(minuend) && isDiffVar(subtrahend)) return undefined;
    if (manager.getOp(minuend) !== OP_ADD || manager.getOp(subtrahend) !== OP_ADD) return NON_DIFF;
    return manager.getNumArgs(minuend) === manager.getNumArgs(subtrahend) &&
      hasSameArgs(minuend) &&
      hasSameArgs(subtrahend)
      ? undefined
      : NON_DIFF;
  };

  // check_diff_args tests the application itself once for each argument.
  const checkDiffArgs = (expr: number) =>
    manager.getNumArgs(expr) > 0 && isArith(expr) && !isDiffArg(expr) ? NON_DIFF : undefined;

  const checkArith = (expr: number) => {
    const op = manager.getOp(expr);
    const args = manager.getArgs(expr);
    if (op === OP_MUL && !flags.isNonlinear && args.filter((arg) => !isNumeral(arg)).length > 1)
      return NONLINEAR;
    if (
      (op === OP_DIV || op === OP_IDIV || op === OP_REM || op === OP_MOD) &&
      (args.length !== 2 || (!flags.isNonlinear && !isNumeral(args[1])))
    )
      return NONLINEAR;
    if (flags.isDiff && (op === OP_LE || op === OP_LT || op === OP_GE || op === OP_GT)) {
      const error = checkDiffPredicate(expr);
      if (error !== undefined) return error;
    }
    if (
      (!flags.isInts || !flags.isReals) &&
      !flags.isAllowingCasts &&
      (op === OP_TO_REAL || op === OP_TO_INT)
    )
      return "logic does not support casting operators";
    return undefined;
  };

  const checkApp = (expr: number) => {
    const sortError = checkSort(manager.sorts[expr]);
    if (sortError !== undefined) return sortError;
    const family = manager.getFamily(expr);
    if (family === FAMILY_USER) {
      if (!flags.isUf && manager.getNumArgs(expr) > 0)
        return "logic does not support uninterpreted functions";
      return flags.isDiff ? checkDiffArgs(expr) : undefined;
    }
    if (family === FAMILY_ARITH) return checkArith(expr);
    if (family === FAMILY_BV) return undefined;
    if (family === FAMILY_ARRAY) return flags.isDiff ? checkDiffArgs(expr) : undefined;
    if (family === FAMILY_BASIC) {
      if (!flags.isDiff) return undefined;
      const op = manager.getOp(expr);
      if (op === OP_EQ) return checkDiffPredicate(expr);
      return op === OP_DISTINCT || op === OP_ITE ? checkDiffArgs(expr) : undefined;
    }
    if (family === FAMILY_MODEL_VALUE) return undefined;
    if (family === FAMILY_SEQ || manager.isCharSort(manager.sorts[expr])) return undefined;
    if (family === FAMILY_DATATYPE && flags.isDt) return undefined;
    return `logic does not support theory ${FAMILY_NAMES.get(family)}`;
  };

  const checkNode = (expr: number) => {
    const kind = manager.kinds[expr];
    if (kind === KIND_APP) return checkApp(expr);
    if (!flags.isQuantifiers) return "logic does not support quantifiers";
    return kind === KIND_VAR ? checkSort(manager.sorts[expr]) : undefined;
  };

  const getChildren = (expr: number) => {
    if (manager.kinds[expr] === KIND_APP) return manager.getArgs(expr);
    if (manager.kinds[expr] === KIND_VAR) return [];
    const data = manager.getQuantifier(expr);
    return [data.body, ...data.patterns, ...data.noPatterns];
  };

  // quick_for_each_expr visits each term once, after its arguments, and a quantifier's body
  // before its patterns.
  const checkExpr = (expr: number) => {
    if (known === undefined) return undefined;
    const visited = new Set([expr]);
    const exprs = [expr];
    const children = [getChildren(expr)];
    const nextChildren = [0];
    while (exprs.length > 0) {
      const top = exprs.length - 1;
      const child = children[top][nextChildren[top]++];
      if (child === undefined) {
        const error = checkNode(exprs.pop() as number);
        if (error !== undefined) return error;
        children.pop();
        nextChildren.pop();
        continue;
      }
      if (visited.has(child)) continue;
      visited.add(child);
      exprs.push(child);
      children.push(getChildren(child));
      nextChildren.push(0);
    }
    return undefined;
  };

  const checkDecl = (decl: number) => {
    if (known === undefined) return undefined;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.domain.length > 0 && !flags.isUf && funcDecl.family === FAMILY_USER)
      return "logic does not support uninterpreted functions";
    for (const sort of funcDecl.domain) {
      const error = checkSort(sort);
      if (error !== undefined) return error;
    }
    return checkSort(funcDecl.range);
  };

  return { checkExpr, checkDecl };
};

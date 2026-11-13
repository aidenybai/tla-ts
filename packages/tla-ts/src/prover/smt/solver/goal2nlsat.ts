// Ported from Z3 (src/nlsat/tactic/goal2nlsat.cpp, src/ast/expr2polynomial.cpp), MIT license, see
// z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_AND,
  OP_ATAN2,
  OP_DISTINCT,
  OP_EQ,
  OP_FALSE,
  OP_GE,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_NOT,
  OP_OR,
  OP_PI,
  OP_TRUE,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { toPolynomial } from "./expr2polynomial";
import { getLcm } from "./rational";
import { flipKind } from "./nlsat/atoms";
import type { NlsatSolver } from "./nlsat/solver";
import { TRANSCENDENTAL_OPS } from "./nlsat/transcendental-eval";
import type { IneqKind } from "./nlsat/types";

export const goal2nlsat = (
  manager: AstManager,
  forms: readonly number[],
  solver: NlsatSolver,
  t2x: Map<number, number>,
  a2b: Map<number, number>,
  assumption: number | null,
  isFactoring = true,
) => {
  const pm = solver.pm;

  const mkVar = (term: number) => {
    let variable = t2x.get(term);
    if (variable === undefined) {
      variable = solver.mkVar(manager.sorts[term] === SORT_INT);
      t2x.set(term, variable);
    }
    return variable;
  };

  const processIneq = (atom: number, kind: IneqKind) => {
    const lhs = toPolynomial(manager, pm, manager.getArg(atom, 0), mkVar);
    const rhs = toPolynomial(manager, pm, manager.getArg(atom, 1), mkVar);
    const lcm = getLcm(lhs.denominator, rhs.denominator);
    const polynomial = pm.addmul(
      lcm / lhs.denominator,
      lhs.polynomial,
      -(lcm / rhs.denominator),
      rhs.polynomial,
    );
    if (pm.isConst(polynomial)) {
      const sign = pm.isZero(polynomial) ? 0 : polynomial.as[0] > 0n ? 1 : -1;
      const isTrue = kind === "EQ" ? sign === 0 : kind === "LT" ? sign < 0 : sign > 0;
      return isTrue ? 0 : 1;
    }
    if (!isFactoring) return solver.mkIneqLiteral(kind, [polynomial], [false]);
    const factors = pm.factor(polynomial);
    return solver.mkIneqLiteral(
      factors.constant < 0n ? flipKind(kind) : kind,
      factors.factors,
      factors.degrees.map((degree) => degree % 2 === 0),
    );
  };

  const processBoolVar = (atom: number) => {
    const existing = a2b.get(atom);
    if (existing !== undefined) return 2 * existing;
    const boolVar = solver.mkBoolVar();
    a2b.set(atom, boolVar);
    return 2 * boolVar;
  };

  const processAtom = (atom: number) => {
    if (manager.kinds[atom] !== KIND_APP) return processBoolVar(atom);
    const op = manager.getOp(atom);
    const family = manager.getFamily(atom);
    if (op === OP_EQ) {
      const sort = manager.sorts[manager.getArg(atom, 0)];
      return sort === SORT_INT || sort === SORT_REAL
        ? processIneq(atom, "EQ")
        : processBoolVar(atom);
    }
    if (op === OP_LE) return processIneq(atom, "GT") ^ 1;
    if (op === OP_GE) return processIneq(atom, "LT") ^ 1;
    if (family === FAMILY_BASIC) {
      if (op === OP_TRUE || op === OP_FALSE)
        throw new SmtTacticError("apply simplify before applying nlsat");
      if ([OP_AND, OP_OR, OP_XOR, OP_NOT, OP_IMPLIES, OP_ITE].includes(op))
        throw new SmtTacticError("convert goal into cnf before applying nlsat");
      if (op === OP_DISTINCT)
        throw new SmtTacticError(
          "eliminate distinct operator (use tactic '(using-params simplify :blast-distinct true)') before applying nlsat",
        );
    }
    if (family === FAMILY_ARITH)
      throw new SmtTacticError("apply purify-arith before applying nlsat");
    return processBoolVar(atom);
  };

  const processLiteral = (form: number) => {
    let atom = form;
    let isNeg = false;
    while (manager.isNot(atom)) {
      atom = manager.getArg(atom, 0);
      isNeg = !isNeg;
    }
    const literal = processAtom(atom);
    return isNeg ? literal ^ 1 : literal;
  };

  if (forms.some((form) => hasTermIte(manager, form)))
    throw new SmtTacticError("eliminate term-ite before applying nlsat");
  for (const form of forms) {
    const literals = manager.getOp(form) === OP_OR ? manager.getArgs(form) : [form];
    solver.mkExternalClause(literals.map(processLiteral), assumption);
  }

  // The polynomial conversion treats a transcendental application, argument included, as one
  // variable, so its argument gets a variable here, through an equation unless it is one already.
  const mkArgVar = (term: number) => {
    const result = toPolynomial(manager, pm, term, mkVar);
    const polynomial = result.polynomial;
    const monomial = polynomial.ms[0];
    if (
      result.denominator === 1n &&
      polynomial.ms.length === 1 &&
      polynomial.as[0] === 1n &&
      monomial.size === 1 &&
      monomial.degrees[0] === 1
    )
      return monomial.vars[0];
    const variable = solver.mkVar(false);
    const equation = pm.addmul(result.denominator, pm.mkVar(variable), -1n, polynomial);
    solver.mkExternalClause([solver.mkIneqLiteral("EQ", [equation], [false])], null);
    return variable;
  };

  // An argument can bring in applications nested inside it, so this repeats to a fixed point.
  const seen = new Set<number>();
  let piVar: number | undefined;
  for (let isChanged = true; isChanged;) {
    const found = [...t2x].filter(
      (entry) =>
        !seen.has(entry[0]) &&
        manager.kinds[entry[0]] === KIND_APP &&
        manager.getFamily(entry[0]) === FAMILY_ARITH,
    );
    const atan2Found = found.filter((entry) => manager.getOp(entry[0]) === OP_ATAN2);
    piVar = found.find((entry) => manager.getOp(entry[0]) === OP_PI)?.[1] ?? piVar;
    isChanged = false;
    for (const [term, variable] of found) {
      const op = TRANSCENDENTAL_OPS.get(manager.getOp(term));
      if (op === undefined) continue;
      seen.add(term);
      solver.transcendentals.add(op, mkArgVar(manager.getArg(term, 0)), variable);
      isChanged = true;
    }
    for (const [term, variable] of atan2Found) {
      seen.add(term);
      const y = mkArgVar(manager.getArg(term, 0));
      solver.transcendentals.addAtan2(y, mkArgVar(manager.getArg(term, 1)), variable);
      isChanged = true;
    }
  }
  if (piVar !== undefined) solver.transcendentals.addPi(piVar);
};

const hasTermIte = (manager: AstManager, form: number) => {
  const seen = new Set<number>();
  const todo = [form];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (seen.has(expr) || manager.kinds[expr] !== KIND_APP) continue;
    seen.add(expr);
    if (manager.getOp(expr) === OP_ITE && manager.sorts[expr] !== SORT_BOOL) return true;
    manager.pushArgs(expr, todo);
  }
  return false;
};

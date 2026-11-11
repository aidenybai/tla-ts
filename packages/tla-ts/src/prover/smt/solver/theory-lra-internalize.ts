// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt.
import {
  FAMILY_ARITH,
  KIND_APP,
  OP_ADD,
  OP_DIV,
  OP_DIV0,
  OP_IDIV,
  OP_IDIV0,
  OP_MOD,
  OP_MOD0,
  OP_MUL,
  OP_NUM,
  OP_POWER,
  OP_REM,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { getExtendedNumeral } from "./ast-util";
import { BoolVar, getVar, Literal } from "./literal";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { type ConstraintKind, KIND_GE, KIND_LE } from "./lp/constraints";
import { NULL_LPVAR } from "./lp/lar-solver";
import { NlaCore } from "./lp/nla-core";
import type { Division } from "./lp/nla-divisions";
import { TheoryLraAxioms } from "./theory-lra-axioms";

export interface ApiBound {
  readonly boolVar: BoolVar;
  readonly thVar: number;
  readonly column: number;
  readonly isInt: boolean;
  readonly value: Rational;
  readonly isLower: boolean;
  readonly constraintTrue: number;
  readonly constraintFalse: number;
}

interface Scope {
  boundsLimit: number;
  assertedQhead: number;
  assertedAtomsLimit: number;
  numVars: number;
}

const MAX_POWER_DEGREE = 10n;

interface LinearizedSum {
  vars: number[];
  coeffs: Rational[];
}

export abstract class TheoryLraInternalize extends TheoryLraAxioms {
  protected abstract reportEqualityOfFixedVars(first: number, second: number): void;

  protected oneVar = NULL_LPVAR;
  protected zeroVar = NULL_LPVAR;
  protected realOneVar = NULL_LPVAR;
  protected realZeroVar = NULL_LPVAR;

  protected constraintSources: (Literal | null)[] = [];

  protected bounds: ApiBound[][] = [];
  protected unassignedBounds: number[] = [];
  protected isNewDef = false;

  // The terms of each depth hold references until the next one at that depth resets them.
  private internalizeStates: RefVector[] = [];

  protected internalizeHead = 0;
  protected scopes: Scope[] = [];
  protected value2var = new Map<string, number>();

  // m_not_handled: terms that the theory treats as uninterpreted, so a model may not satisfy them.
  // Their arguments have variables, as the factors of an nla monomial do.
  protected unsupportedTerms: number[] = [];

  protected underspecifiedTerms: number[] = [];
  protected nla: NlaCore | undefined;

  // The constants 1 and 0, integer and then real, each in a scope of its own.
  init() {
    const manager = this.manager;
    this.oneVar = this.addConst(manager.mkNumeral(1n));
    this.realOneVar = this.addConst(manager.mkRealNumeral(Rational.one));
    this.zeroVar = this.addConst(manager.mkNumeral(0n));
    this.realZeroVar = this.addConst(manager.mkRealNumeral(Rational.zero));
  }

  private addConst(expr: number) {
    const value = this.manager.getRationalValue(expr);
    this.mkEnode(expr);
    const column = this.solver.addVar(this.mkVar(expr), this.isIntExpr(expr));
    this.solver.push();
    this.addDefConstraintAndEquality(column, KIND_GE, value);
    this.addDefConstraintAndEquality(column, KIND_LE, value);
    return column;
  }

  protected mkVar(expr: number) {
    const node = this.getInternalizedEnode(expr);
    if (this.isAttachedToVar(node)) return node.getThVar(this.id);
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    while (this.bounds.length <= thVar) {
      this.bounds.push([]);
      this.unassignedBounds.push(0);
    }
    this.context.attachThVar(node, this, thVar);
    return thVar;
  }

  protected registerVar(thVar: number) {
    const column = this.solver.externalToLocalColumn(thVar);
    return column !== NULL_LPVAR ? column : this.solver.addVar(thVar, this.isIntVar(thVar));
  }

  // The arguments, which become relevant, then the term.
  protected mkEnode(expr: number) {
    const context = this.context;
    for (let index = 0; index < this.manager.getNumArgs(expr); index++) {
      const arg = this.manager.getArg(expr, index);
      if (context.isEInternalized(arg)) continue;
      context.internalize(arg, false);
      context.markAsRelevant(arg);
    }
    if (context.isEInternalized(expr)) return;
    const op = this.manager.getOp(expr);
    const isArith = this.manager.getFamily(expr) === FAMILY_ARITH;
    context.mkEnode(expr, false, false, !(isArith && (op === OP_ADD || op === OP_MUL)));
  }

  private internalizeArgs(expr: number) {
    const context = this.context;
    for (let index = 0; index < this.manager.getNumArgs(expr); index++) {
      const arg = this.manager.getArg(expr, index);
      if (!context.isEInternalized(arg)) context.internalize(arg, false);
    }
  }

  protected foundUnsupported(expr: number) {
    this.unsupportedTerms.push(expr);
    this.context.pushTrail(() => this.unsupportedTerms.pop());
  }

  // found_underspecified: a division by a term or by zero equals the division by zero it stands
  // for, which the model interprets freely.
  private foundUnderspecified(expr: number) {
    const manager = this.manager;
    const context = this.context;
    this.underspecifiedTerms.push(expr);
    context.pushTrail(() => this.underspecifiedTerms.pop());
    const op = manager.getOp(expr);
    const zero = manager.mkNumeral(0n);
    const dividend =
      op === OP_MOD || op === OP_REM
        ? manager.mkApp(op, [manager.getArg(expr, 0), zero], SORT_INT)
        : expr;
    const byZero =
      op === OP_DIV
        ? manager.mkApp(OP_DIV0, manager.getArgs(expr), SORT_REAL)
        : op === OP_IDIV
          ? manager.mkApp(OP_IDIV0, manager.getArgs(expr), SORT_INT)
          : manager.mkApp(OP_MOD0, [manager.getArg(expr, 0), zero], SORT_INT);
    const literal = this.mkEq(byZero, dividend);
    if (context.relevancy.isEnabled)
      context.relevancy.addDependency(dividend, context.boolVar2Expr[getVar(literal)]);
    context.assign(literal, null);
  }

  private registerFixedVar(thVar: number, value: Rational) {
    const key = `${this.isIntVar(thVar)}:${value}`;
    if (this.value2var.has(key)) return;
    this.value2var.set(key, thVar);
    this.context.pushTrail(() => this.value2var.delete(key));
  }

  private internalizeNumeral(expr: number, value: Rational) {
    if (!this.context.isEInternalized(expr)) this.mkEnode(expr);
    const thVar = this.mkVar(expr);
    if (this.solver.externalToLocalColumn(thVar) === NULL_LPVAR) {
      const column = this.solver.addVar(thVar, this.isIntExpr(expr));
      this.addDefConstraintAndEquality(column, KIND_GE, value);
      this.addDefConstraintAndEquality(column, KIND_LE, value);
      this.registerFixedVar(thVar, value);
    }
    return thVar;
  }

  private internalizeMul(expr: number) {
    this.internalizeArgs(expr);
    const hasVar = this.context.isEInternalized(expr) && this.isAttachedExpr(expr);
    this.mkEnode(expr);
    const thVar = this.mkVar(expr);
    if (!hasVar) {
      const vars = this.manager.mapArgs(expr, (arg) => {
        this.internalizeTermCore(arg);
        return this.registerVar(this.mkVar(arg));
      });
      this.solver.registerExistingTerms();
      this.ensureNla().addMonic(this.registerVar(thVar), vars);
    }
    return thVar;
  }

  private getPowerDegree(power: number) {
    const manager = this.manager;
    if (manager.kinds[manager.getArg(power, 0)] !== KIND_APP) return undefined;
    const degree = getExtendedNumeral(manager, manager.getArg(power, 1));
    return degree !== undefined &&
      degree.isInt() &&
      degree.num > 0n &&
      degree.num <= MAX_POWER_DEGREE
      ? Number(degree.num)
      : undefined;
  }

  private internalizePower(power: number, degree: number) {
    this.internalizeArgs(power);
    const hasVar = this.context.isEInternalized(power) && this.isAttachedExpr(power);
    this.mkEnode(power);
    const thVar = this.mkVar(power);
    if (hasVar) return thVar;
    const base = this.manager.getArg(power, 0);
    this.internalizeTermCore(base);
    const baseVar = this.mkVar(base);
    const vars = Array.from({ length: degree }, () => this.registerVar(baseVar));
    const nla = this.ensureNla();
    this.solver.registerExistingTerms();
    nla.addMonic(this.registerVar(thVar), vars);
    return thVar;
  }

  private ensureNla() {
    if (this.nla !== undefined) return this.nla;
    const nla = new NlaCore(this.solver, this.manager.limit);
    for (let index = 0; index < this.scopes.length; index++) nla.push();
    nla.isRelevant = (lpVar) =>
      this.context.isRelevant(this.getExpr(this.solver.getExternal(lpVar)));
    this.nla = nla;
    return nla;
  }

  // The columns of a quotient, its dividend and divisor, and the remainder, internalized in that
  // order.
  private registerDivision(quotient: number, remainder: number): Division {
    const register = (expr: number) => {
      this.internalizeTermCore(expr);
      return this.registerVar(this.mkVar(expr));
    };
    return {
      quotient: register(quotient),
      dividend: register(this.manager.getArg(quotient, 0)),
      divisor: register(this.manager.getArg(quotient, 1)),
      remainder: register(remainder),
    };
  }

  private isNonzeroNumeral(expr: number) {
    return this.manager.isNumeral(expr) && !this.manager.getRationalValue(expr).isZero();
  }

  private isBounded(expr: number): boolean {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op === OP_IDIV && manager.isNumeral(manager.getArg(expr, 1)))
      return this.isBounded(manager.getArg(expr, 0));
    return (op === OP_MOD && manager.isNumeral(manager.getArg(expr, 1))) || manager.isNumeral(expr);
  }

  private isAttachedExpr(expr: number) {
    const node = this.context.getEnode(expr);
    return node !== undefined && this.isAttachedToVar(node);
  }

  // The caller decrements the head.
  protected pushInternalizeState() {
    const terms = (this.internalizeStates[this.internalizeHead] ??= new RefVector(this.manager));
    this.internalizeHead++;
    terms.reset();
    return terms;
  }

  private linearize(terms: RefVector, coeffs: Rational[]) {
    const manager = this.manager;
    const context = this.context;
    const vars: number[] = [];
    const toEnsureEnode: number[] = [];
    const toEnsureVar: number[] = [];
    const push = (term: number, coeff: Rational) => {
      terms.push(term);
      coeffs.push(coeff);
    };
    const addVar = (index: number, thVar: number) => {
      coeffs[vars.length] = coeffs[index];
      vars.push(thVar);
    };
    let index = 0;
    while (index < terms.size) {
      const term = terms.items[index];
      toEnsureEnode.push(term);
      const op = manager.getOp(term);
      if (op === OP_ADD) {
        for (let argIndex = 0; argIndex < manager.getNumArgs(term); argIndex++) {
          const arg = manager.getArg(term, argIndex);
          push(arg, coeffs[index]);
        }
        if (terms.size !== index + 1) {
          terms.set(index, terms.items[terms.size - 1]);
          coeffs[index] = coeffs[coeffs.length - 1];
          terms.pop();
          coeffs.pop();
        }
      } else if (op === OP_SUB) {
        terms.set(index, manager.getArg(term, 0));
        for (let position = 1; position < manager.getNumArgs(term); position++)
          push(manager.getArg(term, position), coeffs[index].neg());
      } else if (
        op === OP_MUL &&
        manager.getNumArgs(term) === 2 &&
        manager.isNumeral(manager.getArg(term, 0))
      ) {
        coeffs[index] = coeffs[index].mul(manager.getRationalValue(manager.getArg(term, 0)));
        terms.set(index, manager.getArg(term, 1));
        toEnsureEnode.push(manager.getArg(term, 0));
      } else if (
        op === OP_MUL &&
        manager.getNumArgs(term) === 2 &&
        manager.isNumeral(manager.getArg(term, 1))
      ) {
        coeffs[index] = coeffs[index].mul(manager.getRationalValue(manager.getArg(term, 1)));
        terms.set(index, manager.getArg(term, 0));
        toEnsureEnode.push(manager.getArg(term, 1));
      } else if (op === OP_MUL) {
        addVar(index, this.internalizeMul(term));
        index++;
      } else if (op === OP_POWER && this.getPowerDegree(term) !== undefined) {
        addVar(index, this.internalizePower(term, this.getPowerDegree(term)!));
        index++;
      } else if (op === OP_NUM) {
        addVar(index, this.internalizeNumeral(term, manager.getRationalValue(term)));
        index++;
      } else if (op === OP_UMINUS) {
        coeffs[index] = coeffs[index].neg();
        terms.set(index, manager.getArg(term, 0));
      } else if (op === OP_TO_REAL) {
        terms.set(index, manager.getArg(term, 0));
        if (!context.isEInternalized(term)) {
          this.internalizeTermCore(manager.getArg(term, 0));
          this.mkEnode(term);
          const column = this.registerVar(this.mkVar(term));
          const argColumn = this.registerVar(this.mkVar(manager.getArg(term, 0)));
          for (const constraint of this.solver.addEquality(column, argColumn))
            this.constraintSources[constraint] = null;
        }
      } else if (manager.getFamily(term) === FAMILY_ARITH) {
        const isFirst = !context.isEInternalized(term);
        this.internalizeArgs(term);
        this.mkEnode(term);
        addVar(index, this.mkVar(term));
        index++;
        if (isFirst) {
          if (op === OP_DIV) {
            const divisor = context.rewriter.rewrite(manager.getArg(term, 1));
            if (!this.isNonzeroNumeral(divisor)) this.foundUnderspecified(term);
            for (let argIndex = 0; argIndex < manager.getNumArgs(term); argIndex++) {
              const arg = manager.getArg(term, argIndex);
              toEnsureVar.push(arg);
            }
          } else if (op === OP_IDIV) {
            if (!this.isNonzeroNumeral(manager.getArg(term, 1))) this.foundUnderspecified(term);
            const remainder = manager.mkApp(OP_MOD, manager.getArgs(term), SORT_INT);
            context.internalize(remainder, false);
            if (context.relevancy.isEnabled) context.relevancy.addDependency(term, remainder);
            if (this.nla !== undefined && !manager.isNumeral(manager.getArg(term, 1)))
              this.nla.divisions.addIdivision(this.registerDivision(term, remainder));
            if (
              manager.isNumeral(manager.getArg(term, 1)) &&
              this.isBounded(manager.getArg(term, 0))
            ) {
              const nla = this.ensureNla();
              nla.divisions.addBoundedDivision(this.registerDivision(term, remainder));
            }
          } else if (op === OP_MOD) {
            const isNonzeroDivisor = this.isNonzeroNumeral(manager.getArg(term, 1));
            if (!isNonzeroDivisor) this.foundUnderspecified(term);
            // Without relevancy, Z3 makes the axioms before it registers the division with nla.
            if (!context.relevancy.isEnabled)
              this.mkIdivModAxioms(manager.getArg(term, 0), manager.getArg(term, 1));
            if (this.nla !== undefined && isNonzeroDivisor) {
              const quotient = manager.mkApp(OP_IDIV, manager.getArgs(term), SORT_INT);
              context.internalize(quotient, false);
              this.nla.divisions.addBoundedDivision(this.registerDivision(quotient, term));
            }
            if (
              !manager.isNumeral(manager.getArg(term, 1)) &&
              !this.isZeroNumeral(manager.getArg(term, 0))
            ) {
              const nla = this.ensureNla();
              const quotient = manager.mkApp(OP_IDIV, manager.getArgs(term), SORT_INT);
              context.internalize(quotient, false);
              nla.divisions.addDivisibility(this.registerDivision(quotient, term));
            }
          } else if (op === OP_REM) {
            if (!this.isNonzeroNumeral(manager.getArg(term, 1))) this.foundUnderspecified(term);
          } else if (op === OP_IDIV0 || op === OP_MOD0) {
            for (let argIndex = 0; argIndex < manager.getNumArgs(term); argIndex++) {
              const arg = manager.getArg(term, argIndex);
              toEnsureVar.push(arg);
            }
          } else if (op !== OP_TO_INT && op !== OP_DIV0) {
            if (op === OP_POWER) this.ensureNla();
            this.foundUnsupported(term);
            for (let argIndex = 0; argIndex < manager.getNumArgs(term); argIndex++) {
              const arg = manager.getArg(term, argIndex);
              toEnsureVar.push(arg);
            }
          }
          if (!context.relevancy.isEnabled && op !== OP_MOD) this.relevantEh(term);
        }
      } else {
        this.internalizeArgs(term);
        addVar(index, this.mkVar(term));
        index++;
      }
    }
    for (let position = toEnsureEnode.length; position-- > 0;)
      this.mkEnode(toEnsureEnode[position]);
    for (let position = toEnsureVar.length; position-- > 0;)
      this.internalizeTermCore(toEnsureVar[position]);
    return { vars, coeffs: coeffs.slice(0, vars.length) };
  }

  private initLeftSide(vars: number[], coeffs: Rational[]) {
    const sums = new Map<number, Rational>();
    vars.forEach((thVar, index) =>
      sums.set(thVar, (sums.get(thVar) ?? Rational.zero).add(coeffs[index])),
    );
    const leftSide: [number, Rational][] = [];
    for (const thVar of vars) {
      const sum = sums.get(thVar);
      if (sum === undefined || sum.isZero()) continue;
      leftSide.push([this.registerVar(thVar), sum]);
      sums.delete(thVar);
    }
    return leftSide;
  }

  protected internalizeDef(expr: number) {
    const terms = this.pushInternalizeState();
    terms.push(expr);
    const thVar = this.internalizeLinearizedDef(expr, this.linearize(terms, [Rational.one]));
    this.internalizeHead--;
    return thVar;
  }

  private internalizeLinearizedDef(expr: number, linearized: LinearizedSum) {
    const thVar = this.mkVar(expr);
    if (
      linearized.vars.length === 1 &&
      linearized.coeffs[0].equals(Rational.one) &&
      thVar === linearized.vars[0]
    )
      return thVar;
    const leftSide = this.initLeftSide(linearized.vars, linearized.coeffs);
    if (this.solver.externalToLocalColumn(thVar) !== NULL_LPVAR) return thVar;
    if (leftSide.length === 0) {
      const column = this.solver.addVar(thVar, this.isIntExpr(expr));
      this.addDefConstraintAndEquality(column, KIND_GE, Rational.zero);
      this.addDefConstraintAndEquality(column, KIND_LE, Rational.zero);
    } else this.solver.addTerm(leftSide, thVar);
    return thVar;
  }

  private internalizeTermCore(expr: number) {
    if (this.manager.getFamily(expr) !== FAMILY_ARITH && this.manager.isBool(expr)) return;
    if (this.context.isEInternalized(expr) && this.isAttachedExpr(expr)) return;
    this.internalizeDef(expr);
  }

  internalizeTerm(expr: number) {
    this.internalizeTermCore(expr);
    return true;
  }

  private addDefConstraintAndEquality(column: number, kind: ConstraintKind, bound: Rational) {
    const index = this.solver.mkVarBound(column, kind, bound);
    const equal = this.solver.activateCheckOnEqual(index);
    this.constraintSources[index] = null;
    if (equal !== NULL_LPVAR) this.reportEqualityOfFixedVars(column, equal);
    this.isNewDef = true;
  }
}

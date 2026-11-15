// Ported from Z3 (src/sat/smt/arith_solver.h, src/sat/smt/arith_internalize.cpp,
// src/math/lp/lp_api.h), MIT license, see z3-license.txt.
import {
  FAMILY_ARITH,
  OP_ABS,
  OP_ADD,
  OP_DIV,
  OP_DIV0,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IDIV0,
  OP_IS_INT,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MOD0,
  OP_MUL,
  OP_NUM,
  OP_POWER,
  OP_POWER0,
  OP_REM,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_INT,
} from "../ast";
import { getExtendedNumeral } from "../ast-util";
import { type ConstraintKind, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "../lp/constraints";
import { LarSolver, NULL_LPVAR } from "../lp/lar-solver";
import { NlaCore } from "../lp/nla-core";
import { Rational } from "../rational";
import { type Enode, NULL_THEORY_VAR } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { ThSolver } from "./th-solver";

// lp_api::bound<sat::literal>: lit means that the variable is at least, or at most, the value.
export interface ArithBound {
  readonly lit: number;
  readonly thVar: number;
  readonly column: number;
  readonly isInt: boolean;
  readonly value: Rational;
  readonly isLower: boolean;
  readonly constraintTrue: number;
  readonly constraintFalse: number;
}

export const SOURCE_INEQUALITY = 0;
export const SOURCE_EQUALITY = 1;
const SOURCE_DEFINITION = 2;

interface InternalizeState {
  terms: number[];
  coeffs: Rational[];
  vars: number[];
  toEnsureEnode: number[];
  toEnsureVar: number[];
}

const mkInternalizeState = (): InternalizeState => ({
  terms: [],
  coeffs: [],
  vars: [],
  toEnsureEnode: [],
  toEnsureVar: [],
});

const MAX_POWER_DEGREE = 10;

export const isUnderspecified = (op: number) =>
  op === OP_DIV ||
  op === OP_IDIV ||
  op === OP_REM ||
  op === OP_MOD ||
  op === OP_DIV0 ||
  op === OP_IDIV0 ||
  op === OP_MOD0;

export abstract class ArithInternalize extends ThSolver {
  protected abstract mkToIntAxiom(expr: number): void;
  protected abstract mkAbsAxiom(expr: number): void;
  protected abstract mkIdivModAxioms(dividend: number, divisor: number): void;
  protected abstract mkRemAxiom(dividend: number, divisor: number): void;
  protected abstract mkDivAxiom(dividend: number, divisor: number): void;
  protected abstract mkPowerAxiom(power: number, base: number, exponent: number): void;
  protected abstract mkPower0Axioms(power: number, base: number): void;
  protected abstract mkIsIntAxiom(expr: number): void;
  protected abstract reportEqualityOfFixedVars(first: number, second: number): void;

  protected readonly solver: LarSolver;
  protected nla: NlaCore | undefined;
  private isInternalizeInitialized = false;
  protected oneVar = NULL_LPVAR;
  protected zeroVar = NULL_LPVAR;
  protected realOneVar = NULL_LPVAR;
  protected realZeroVar = NULL_LPVAR;
  protected constraintSources: number[] = [];
  protected inequalities: number[] = [];
  protected equalities: ([Enode, Enode] | undefined)[] = [];
  protected notHandled: number | null = null;
  protected underspecified: number[] = [];
  protected idivTerms: number[] = [];
  protected boolVar2bound = new Map<number, ArithBound>();
  protected bounds: ArithBound[][] = [];
  protected unassignedBounds: number[] = [];
  protected boundsTrail: number[] = [];
  protected newBounds: ArithBound[] = [];
  protected isNewEq = false;
  protected value2var = new Map<string, number>();
  protected scopes: { boundsLim: number; assertedQhead: number; assertedLim: number }[] = [];

  constructor(ctx: EufSolver, id: number) {
    super(ctx, "arith", id);
    this.solver = new LarSolver(() => !ctx.manager.limit.inc());
  }

  protected isIntVar(thVar: number) {
    return this.manager.isInt(this.var2expr(thVar));
  }

  protected isBoolVar(thVar: number) {
    return this.manager.isBool(this.var2expr(thVar));
  }

  internalize(expr: number, isSign: boolean, _isRoot: boolean) {
    this.initInternalize();
    this.internalizeAtom(expr);
    const lit = this.expr2literal(expr);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.initInternalize();
    if (this.manager.isBool(expr)) this.internalizeAtom(expr);
    else this.internalizeArithTerm(expr);
  }

  private initInternalize() {
    this.forcePush();
    if (this.isInternalizeInitialized) return;
    this.getOne(true);
    this.getOne(false);
    this.getZero(true);
    this.getZero(false);
    this.ctx.trail.push(() => {
      this.isInternalizeInitialized = false;
    });
    this.isInternalizeInitialized = true;
  }

  protected getOne(isInt: boolean) {
    if (isInt)
      return this.oneVar !== NULL_LPVAR ? this.oneVar : (this.oneVar = this.addConst(1n, true));
    return this.realOneVar !== NULL_LPVAR
      ? this.realOneVar
      : (this.realOneVar = this.addConst(1n, false));
  }

  protected getZero(isInt: boolean) {
    if (isInt)
      return this.zeroVar !== NULL_LPVAR ? this.zeroVar : (this.zeroVar = this.addConst(0n, true));
    return this.realZeroVar !== NULL_LPVAR
      ? this.realZeroVar
      : (this.realZeroVar = this.addConst(0n, false));
  }

  private addConst(value: bigint, isInt: boolean) {
    const manager = this.manager;
    const constant = isInt ? manager.mkNumeral(value) : manager.mkRealNumeral(Rational.of(value));
    const restore = () => {
      if (isInt) {
        if (value === 1n) this.oneVar = NULL_LPVAR;
        else this.zeroVar = NULL_LPVAR;
      } else if (value === 1n) this.realOneVar = NULL_LPVAR;
      else this.realZeroVar = NULL_LPVAR;
    };
    this.ctx.trail.push(restore);
    this.mkArithEnode(constant);
    const thVar = this.mkEvar(constant);
    const column = this.solver.addVar(thVar, isInt);
    this.addDefConstraintAndEquality(column, KIND_GE, Rational.of(value));
    this.addDefConstraintAndEquality(column, KIND_LE, Rational.of(value));
    return column;
  }

  protected ensureNla() {
    if (this.nla !== undefined) return this.nla;
    const nla = new NlaCore(this.solver, this.manager.limit);
    for (let index = 0; index < this.scopes.length; index++) nla.push();
    this.nla = nla;
    return nla;
  }

  protected foundUnsupported(expr: number) {
    const saved = this.notHandled;
    this.ctx.trail.push(() => {
      this.notHandled = saved;
    });
    this.notHandled = expr;
  }

  private foundUnderspecified(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (isUnderspecified(op)) {
      this.ctx.trail.push(() => this.underspecified.pop());
      this.underspecified.push(expr);
    }
    const dividend = manager.getArg(expr, 0);
    const zero = manager.mkNumeral(0n);
    const sort = manager.sorts[expr];
    const pair =
      op === OP_DIV
        ? [expr, manager.mkApp(OP_DIV0, manager.getArgs(expr), sort)]
        : op === OP_IDIV
          ? [expr, manager.mkApp(OP_IDIV0, manager.getArgs(expr), sort)]
          : op === OP_REM
            ? [
                manager.mkApp(OP_REM, [dividend, zero], sort),
                manager.mkApp(OP_MOD0, [dividend, zero], sort),
              ]
            : op === OP_MOD
              ? [
                  manager.mkApp(OP_MOD, [dividend, zero], sort),
                  manager.mkApp(OP_MOD0, [dividend, zero], sort),
                ]
              : op === OP_POWER
                ? [expr, manager.mkApp(OP_POWER0, manager.getArgs(expr), sort)]
                : null;
    if (pair !== null) this.addUnit(this.eqInternalize(pair[0], pair[1]));
  }

  protected registerVar(thVar: number) {
    const column = this.solver.externalToLocalColumn(thVar);
    return column !== NULL_LPVAR ? column : this.solver.addVar(thVar, this.isIntVar(thVar));
  }

  private linearize(state: InternalizeState) {
    const manager = this.manager;
    const terms = state.terms;
    const coeffs = state.coeffs;
    const vars = state.vars;
    const push = (term: number, coeff: Rational) => {
      terms.push(term);
      coeffs.push(coeff);
    };
    const addVar = (index: number, thVar: number) => {
      coeffs[vars.length] = coeffs[index];
      vars.push(thVar);
    };
    let index = 0;
    while (index < terms.length) {
      const term = terms[index];
      state.toEnsureEnode.push(term);
      const op = manager.getFamily(term) === FAMILY_ARITH ? manager.getOp(term) : -1;
      const numArgs = op === -1 ? 0 : manager.getNumArgs(term);
      const firstFactor =
        op === OP_MUL && numArgs === 2
          ? getExtendedNumeral(manager, manager.getArg(term, 0))
          : undefined;
      const secondFactor =
        op === OP_MUL && numArgs === 2 && firstFactor === undefined
          ? getExtendedNumeral(manager, manager.getArg(term, 1))
          : undefined;
      const degree =
        op === OP_POWER && manager.isApp(manager.getArg(term, 0))
          ? getExtendedNumeral(manager, manager.getArg(term, 1))
          : undefined;
      if (op === OP_ADD) {
        for (const arg of manager.getArgs(term)) push(arg, coeffs[index]);
        if (terms.length !== index + 1) {
          terms[index] = terms[terms.length - 1];
          coeffs[index] = coeffs[coeffs.length - 1];
          terms.pop();
          coeffs.pop();
        }
      } else if (op === OP_SUB) {
        terms[index] = manager.getArg(term, 0);
        for (let position = 1; position < numArgs; position++)
          push(manager.getArg(term, position), coeffs[index].neg());
      } else if (firstFactor !== undefined) {
        coeffs[index] = coeffs[index].mul(firstFactor);
        terms[index] = manager.getArg(term, 1);
        state.toEnsureEnode.push(manager.getArg(term, 0));
      } else if (secondFactor !== undefined) {
        coeffs[index] = coeffs[index].mul(secondFactor);
        terms[index] = manager.getArg(term, 0);
        state.toEnsureEnode.push(manager.getArg(term, 1));
      } else if (op === OP_MUL) {
        addVar(index, this.internalizeMul(term));
        index++;
      } else if (
        degree !== undefined &&
        degree.isInt() &&
        !degree.isNegative() &&
        degree.compare(Rational.of(BigInt(MAX_POWER_DEGREE))) <= 0
      ) {
        addVar(index, this.internalizePower(term, manager.getArg(term, 0), Number(degree.num)));
        index++;
      } else if (op === OP_NUM) {
        addVar(index, this.internalizeNumeral(term, manager.getRationalValue(term)));
        index++;
      } else if (op === OP_UMINUS) {
        coeffs[index] = coeffs[index].neg();
        terms[index] = manager.getArg(term, 0);
      } else if (op === OP_TO_REAL) {
        const arg = manager.getArg(term, 0);
        terms[index] = arg;
        if (this.expr2enode(term) === undefined) {
          this.internalizeArithTerm(arg);
          this.mkArithEnode(term);
          const column = this.registerVar(this.mkEvar(term));
          const argColumn = this.registerVar(this.mkEvar(arg));
          for (const constraint of this.solver.addEquality(column, argColumn))
            this.addDefConstraint(constraint);
        }
      } else if (op !== -1) {
        const isFirst = this.expr2enode(term) === undefined;
        this.internalizeArgs(term);
        this.mkArithEnode(term);
        addVar(index, this.mkEvar(term));
        index++;
        if (isFirst) this.internalizeArithApp(term, op, state);
      } else {
        if (manager.isApp(term)) {
          this.internalizeArgs(term);
          this.ensureArgVars(term);
        }
        addVar(index, this.mkEvar(term));
        index++;
      }
    }
    for (let position = state.toEnsureEnode.length; position-- > 0;) {
      const expr = state.toEnsureEnode[position];
      if (manager.isApp(expr)) this.mkArithEnode(expr);
    }
    state.toEnsureEnode = [];
    for (let position = state.toEnsureVar.length; position-- > 0;) {
      const expr = state.toEnsureVar[position];
      if (manager.isApp(expr)) this.internalizeArithTerm(expr);
    }
    state.toEnsureVar = [];
  }

  private internalizeArithApp(term: number, op: number, state: InternalizeState) {
    const manager = this.manager;
    const isNonzeroNumeral = (expr: number) =>
      manager.isNumeral(expr) && !manager.getRationalValue(expr).isZero();
    const pushArgs = () => manager.pushArgs(term, state.toEnsureVar);
    if (op === OP_TO_INT) this.mkToIntAxiom(term);
    else if (op === OP_ABS) this.mkAbsAxiom(term);
    else if (op === OP_IDIV) {
      if (!isNonzeroNumeral(manager.getArg(term, 1))) this.foundUnderspecified(term);
      this.ctx.trail.push(() => this.idivTerms.pop());
      this.idivTerms.push(term);
      this.internalizeTerm(manager.mkApp(OP_MOD, manager.getArgs(term), SORT_INT));
      pushArgs();
    } else if (op === OP_MOD) {
      if (!isNonzeroNumeral(manager.getArg(term, 1))) this.foundUnderspecified(term);
      this.mkIdivModAxioms(manager.getArg(term, 0), manager.getArg(term, 1));
      pushArgs();
    } else if (op === OP_REM) {
      if (!isNonzeroNumeral(manager.getArg(term, 1))) this.foundUnderspecified(term);
      this.mkRemAxiom(manager.getArg(term, 0), manager.getArg(term, 1));
      pushArgs();
    } else if (op === OP_DIV) {
      if (!isNonzeroNumeral(this.rewrite(manager.getArg(term, 1)))) this.foundUnderspecified(term);
      this.mkDivAxiom(manager.getArg(term, 0), manager.getArg(term, 1));
      pushArgs();
    } else if (op === OP_POWER) {
      this.foundUnsupported(term);
      this.mkPowerAxiom(term, manager.getArg(term, 0), manager.getArg(term, 1));
      pushArgs();
    } else if (op !== OP_DIV0 && op !== OP_MOD0 && op !== OP_IDIV0 && op !== OP_POWER0) {
      this.foundUnsupported(term);
      this.ensureArgVars(term);
    } else this.ensureArgVars(term);
  }

  eqInternalized(node: Enode) {
    this.internalizeArithTerm(node.getArg(0).owner);
    this.internalizeArithTerm(node.getArg(1).owner);
  }

  private mkSub(first: number, second: number) {
    const manager = this.manager;
    if (manager.isNumeral(second) && manager.getRationalValue(second).isZero()) return first;
    return manager.mkApp(OP_SUB, [first, second], manager.sorts[first]);
  }

  protected internalizeAtom(atom: number) {
    const manager = this.manager;
    const boolVar = this.ctx.si.addBoolVar(atom);
    this.boolVar2bound.delete(boolVar);
    let lit = 2 * boolVar;
    this.ctx.attachLit(lit, atom);
    const op = manager.getFamily(atom) === FAMILY_ARITH ? manager.getOp(atom) : -1;
    if (op === OP_IS_INT) {
      this.mkIsIntAxiom(atom);
      return;
    }
    if (op !== OP_LE && op !== OP_GE && op !== OP_LT && op !== OP_GT) {
      this.foundUnsupported(atom);
      return;
    }
    const left = manager.getArg(atom, 0);
    const right = manager.getArg(atom, 1);
    const rightValue =
      op === OP_LE || op === OP_GE ? getExtendedNumeral(manager, right) : undefined;
    const leftValue =
      rightValue === undefined && (op === OP_LE || op === OP_GE)
        ? getExtendedNumeral(manager, left)
        : undefined;
    let thVar: number;
    let isLower: boolean;
    let value: Rational;
    if (rightValue !== undefined) {
      thVar = this.internalizeDef(left);
      isLower = op === OP_GE;
      value = rightValue;
    } else if (leftValue !== undefined) {
      thVar = this.internalizeDef(right);
      isLower = op === OP_LE;
      value = leftValue;
    } else {
      thVar = this.internalizeDef(this.mkSub(left, right));
      isLower = op === OP_GE || op === OP_LT;
      value = Rational.zero;
      if (op === OP_LT || op === OP_GT) lit ^= 1;
    }
    const node = this.expr2enode(atom) as Enode;
    const atomVar = this.mkVar(node);
    this.ctx.egraph.addThVar(node, atomVar, this.id);
    this.ctx.egraph.setCgcEnabled(node, false);
    if (this.isIntVar(thVar) && !value.isInt()) value = isLower ? value.ceil() : value.floor();
    const bound = this.mkVarBound(lit, thVar, isLower, value);
    this.bounds[thVar].push(bound);
    this.updateUnassignedBounds(thVar, 1);
    this.boundsTrail.push(thVar);
    this.boolVar2bound.set(boolVar, bound);
    this.newBounds.push(bound);
  }

  protected updateUnassignedBounds(thVar: number, increment: number) {
    const saved = this.unassignedBounds[thVar];
    this.ctx.trail.push(() => {
      this.unassignedBounds[thVar] = saved;
    });
    this.unassignedBounds[thVar] = saved + increment;
  }

  protected boundToConstraintKind(
    isInt: boolean,
    isLower: boolean,
    isTrue: boolean,
  ): ConstraintKind {
    if (isLower) return isTrue ? KIND_GE : isInt ? KIND_LE : KIND_LT;
    return isTrue ? KIND_LE : isInt ? KIND_GE : KIND_GT;
  }

  private mkVarBound(lit: number, thVar: number, isLower: boolean, value: Rational): ArithBound {
    const solver = this.solver;
    const isInt = this.isIntVar(thVar);
    const column = this.registerVar(thVar);
    const constraintTrue = solver.mkVarBound(
      column,
      this.boundToConstraintKind(isInt, isLower, true),
      value,
    );
    const constraintFalse = solver.mkVarBound(
      column,
      this.boundToConstraintKind(isInt, isLower, false),
      isInt ? (isLower ? value.sub(Rational.one) : value.add(Rational.one)) : value,
    );
    this.addIneqConstraint(constraintTrue, lit);
    this.addIneqConstraint(constraintFalse, lit ^ 1);
    return { lit, thVar, column, isInt, value, isLower, constraintTrue, constraintFalse };
  }

  protected internalizeArithTerm(term: number) {
    if (!this.hasVar(term)) this.registerVar(this.internalizeDef(term));
  }

  protected internalizeDef(term: number) {
    const state = mkInternalizeState();
    state.terms.push(term);
    state.coeffs.push(Rational.one);
    this.linearize(state);
    return this.internalizeLinearizedDef(term, state);
  }

  private internalizeArgs(term: number) {
    for (const arg of this.manager.getArgs(term)) this.eInternalize(arg);
  }

  private ensureArgVars(term: number) {
    const manager = this.manager;
    for (const arg of manager.getArgs(term))
      if (manager.isReal(arg) || manager.isInt(arg)) this.internalizeArithTerm(arg);
  }

  private internalizePower(term: number, base: number, degree: number) {
    this.internalizeArgs(term);
    const hasVar = this.hasVar(term);
    this.mkArithEnode(term);
    const thVar = this.mkEvar(term);
    if (hasVar) return thVar;
    this.internalizeArithTerm(base);
    const baseVar = this.mkEvar(base);
    if (degree === 0) {
      this.mkPower0Axioms(term, base);
      return thVar;
    }
    const vars = Array.from({ length: degree }, () => this.registerVar(baseVar));
    const nla = this.ensureNla();
    this.solver.registerExistingTerms();
    nla.addMonic(this.registerVar(thVar), vars);
    return thVar;
  }

  private internalizeNumeral(term: number, value: Rational) {
    const thVar = this.mkEvar(term);
    if (this.solver.externalToLocalColumn(thVar) === NULL_LPVAR) {
      const column = this.solver.addVar(thVar, this.manager.isInt(term));
      this.addDefConstraintAndEquality(column, KIND_GE, value);
      this.addDefConstraintAndEquality(column, KIND_LE, value);
      this.registerFixedVar(thVar, value);
    }
    return thVar;
  }

  private internalizeMul(term: number) {
    this.internalizeArgs(term);
    const hasVar = this.hasVar(term);
    this.mkArithEnode(term);
    const thVar = this.mkEvar(term);
    if (!hasVar) {
      const vars = this.manager.mapArgs(term, (arg) => {
        if (this.manager.isApp(arg)) this.internalizeArithTerm(arg);
        return this.registerVar(this.mkEvar(arg));
      });
      this.solver.registerExistingTerms();
      this.ensureNla().addMonic(this.registerVar(thVar), vars);
    }
    return thVar;
  }

  private internalizeLinearizedDef(term: number, state: InternalizeState) {
    const thVar = this.mkEvar(term);
    if (state.vars.length === 1 && state.coeffs[0].equals(Rational.one) && thVar === state.vars[0])
      return thVar;
    const leftSide = this.initLeftSide(state);
    if (this.solver.externalToLocalColumn(thVar) !== NULL_LPVAR) return thVar;
    if (leftSide.length === 0) {
      const column = this.solver.addVar(thVar, this.manager.isInt(term));
      this.addDefConstraintAndEquality(column, KIND_GE, Rational.zero);
      this.addDefConstraintAndEquality(column, KIND_LE, Rational.zero);
    } else this.solver.addTerm(leftSide, thVar);
    return thVar;
  }

  private initLeftSide(state: InternalizeState) {
    const sums = new Map<number, Rational>();
    state.vars.forEach((thVar, index) =>
      sums.set(thVar, (sums.get(thVar) ?? Rational.zero).add(state.coeffs[index])),
    );
    const leftSide: [number, Rational][] = [];
    for (const thVar of state.vars) {
      const sum = sums.get(thVar);
      if (sum === undefined || sum.isZero()) continue;
      leftSide.push([this.registerVar(thVar), sum]);
      sums.delete(thVar);
    }
    return leftSide;
  }

  protected mkArithEnode(expr: number) {
    const existing = this.expr2enode(expr);
    if (existing !== undefined) return existing;
    if (this.manager.getFamily(expr) !== FAMILY_ARITH) return this.eInternalize(expr);
    const args = this.manager.getArgs(expr).map((arg) => this.eInternalize(arg));
    const node = this.ctx.mkEnode(expr, args);
    this.ctx.attachNode(node);
    return node;
  }

  protected mkEvar(expr: number) {
    const node = this.mkArithEnode(expr);
    const existing = node.getThVar(this.id);
    if (existing !== NULL_THEORY_VAR) return existing;
    const thVar = this.mkVar(node);
    this.reserveBounds(thVar);
    this.ctx.egraph.addThVar(node, thVar, this.id);
    return thVar;
  }

  protected hasVar(expr: number) {
    const node = this.expr2enode(expr);
    return node !== undefined && node.getThVar(this.id) !== NULL_THEORY_VAR;
  }

  protected reserveBounds(thVar: number) {
    while (this.bounds.length <= thVar) {
      this.bounds.push([]);
      this.unassignedBounds.push(0);
    }
  }

  protected addEqConstraint(index: number, first: Enode, second: Enode) {
    this.constraintSources[index] = SOURCE_EQUALITY;
    this.equalities[index] = [first, second];
  }

  private addIneqConstraint(index: number, lit: number) {
    this.constraintSources[index] = SOURCE_INEQUALITY;
    this.inequalities[index] = lit;
  }

  protected addDefConstraint(index: number) {
    this.constraintSources[index] = SOURCE_DEFINITION;
  }

  protected addDefConstraintAndEquality(column: number, kind: ConstraintKind, bound: Rational) {
    const index = this.solver.mkVarBound(column, kind, bound);
    const equal = this.solver.activateCheckOnEqual(index);
    this.addDefConstraint(index);
    if (equal !== NULL_LPVAR) this.reportEqualityOfFixedVars(column, equal);
    this.isNewEq = true;
  }

  override isShared(thVar: number) {
    const count = this.underspecified.length;
    if (count === 0) return false;
    const root = this.var2enodeOf(thVar).root;
    const manager = this.manager;
    if (root.parents.length > 2 * count)
      return this.underspecified.some((term) =>
        manager.someArg(term, (arg) => this.expr2enode(arg)?.root === root),
      );
    return root.parents.some(
      (parent) =>
        manager.getFamily(parent.owner) === FAMILY_ARITH &&
        isUnderspecified(manager.getOp(parent.owner)),
    );
  }

  private registerFixedVar(thVar: number, value: Rational) {
    const key = value.toString();
    if (this.value2var.has(key)) return;
    this.value2var.set(key, thVar);
    this.ctx.trail.push(() => this.value2var.delete(key));
  }
}

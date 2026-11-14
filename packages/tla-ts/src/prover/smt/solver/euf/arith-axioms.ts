// Ported from Z3 (src/sat/smt/arith_axioms.cpp), MIT license, see z3-license.txt.
import {
  OP_ADD,
  OP_DIV,
  OP_GE,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_POWER,
  OP_POWER0,
  OP_REM,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "../ast";
import { getExtendedNumeral } from "../ast-util";
import { type Dependency, linearize } from "../lp/dependency";
import { Explanation } from "../lp/explanation";
import { NULL_LPVAR } from "../lp/lar-solver";
import { getEuclideanDiv, Rational } from "../rational";
import type { Enode, ThEq } from "./egraph";
import {
  type ArithBound,
  ArithInternalize,
  SOURCE_EQUALITY,
  SOURCE_INEQUALITY,
} from "./arith-internalize";

export abstract class ArithAxioms extends ArithInternalize {
  protected core: number[] = [];
  protected eqs: [Enode, Enode][] = [];
  protected explanation = new Explanation();
  protected delayedEqs: { eq: ThEq; isEq: boolean }[] = [];

  private mkArith(op: number, args: number[], sort: number) {
    return this.manager.mkApp(op, args, sort);
  }

  private mkIneq(op: number, left: number, right: number) {
    return this.mkArith(op, [left, right], SORT_BOOL);
  }

  private isZero(expr: number) {
    const manager = this.manager;
    return manager.isNumeral(expr) && manager.getRationalValue(expr).isZero();
  }

  protected mkDivAxiom(dividend: number, divisor: number) {
    if (this.isZero(divisor)) return;
    const manager = this.manager;
    const eqz = this.eqInternalize(divisor, manager.mkRealNumeral(Rational.zero));
    const quotient = this.mkArith(OP_DIV, [dividend, divisor], SORT_REAL);
    const eq = this.eqInternalize(this.mkArith(OP_MUL, [divisor, quotient], SORT_REAL), dividend);
    this.addClause([eqz, eq]);
  }

  protected mkToIntAxiom(expr: number) {
    const manager = this.manager;
    const arg = manager.getArg(expr, 0);
    if (manager.getOp(arg) === OP_TO_REAL) {
      this.addClause([this.eqInternalize(manager.getArg(arg, 0), expr)]);
      return;
    }
    const toReal = this.mkArith(OP_TO_REAL, [expr], SORT_REAL);
    const lo = this.mkIneq(
      OP_LE,
      this.mkArith(OP_SUB, [toReal, arg], SORT_REAL),
      manager.mkRealNumeral(Rational.zero),
    );
    const hi = this.mkIneq(
      OP_GE,
      this.mkArith(OP_SUB, [arg, toReal], SORT_REAL),
      manager.mkRealNumeral(Rational.one),
    );
    const loLit = this.mkLiteral(lo);
    const hiLit = this.mkLiteral(hi);
    this.addClause([loLit]);
    this.addClause([hiLit ^ 1]);
  }

  protected mkAbsAxiom(expr: number) {
    const manager = this.manager;
    const arg = manager.getArg(expr, 0);
    const sort = manager.sorts[expr];
    const isNonneg = this.mkLiteral(
      this.mkIneq(OP_GE, arg, manager.mkNumeralOfSort(Rational.zero, sort)),
    );
    this.addClause([isNonneg ^ 1, this.eqInternalize(expr, arg)]);
    this.addClause([isNonneg, this.eqInternalize(expr, this.mkArith(OP_UMINUS, [arg], sort))]);
  }

  protected mkPower0Axioms(power: number, base: number) {
    const manager = this.manager;
    const power0 = this.mkArith(OP_POWER0, [base, manager.getArg(power, 1)], manager.sorts[power]);
    const eq = this.eqInternalize(
      base,
      manager.mkNumeralOfSort(Rational.zero, manager.sorts[base]),
    );
    this.addClause([eq ^ 1, this.eqInternalize(power, power0)]);
    this.addClause([
      eq,
      this.eqInternalize(power, manager.mkNumeralOfSort(Rational.one, manager.sorts[power])),
    ]);
  }

  protected mkPowerAxiom(power: number, base: number, exponent: number) {
    if (this.isZero(exponent)) {
      this.mkPower0Axioms(power, base);
      return;
    }
    const manager = this.manager;
    const zero = manager.mkRealNumeral(Rational.zero);
    const baseValue = getExtendedNumeral(manager, base);
    if (baseValue?.isPositive() === true)
      this.addClause([this.mkLiteral(this.mkIneq(OP_LE, power, zero)) ^ 1]);
    const exponentValue = getExtendedNumeral(manager, exponent);
    if (exponentValue?.isPositive() !== true || exponentValue.den <= 1n) return;
    const isBaseNonneg = this.mkIneq(OP_GE, base, zero);
    const baseToNum =
      exponentValue.num > 1n
        ? this.mkArith(
            OP_POWER,
            [base, manager.mkRealNumeral(Rational.of(exponentValue.num))],
            manager.sorts[power],
          )
        : base;
    const isEq = manager.mkEq(
      baseToNum,
      this.mkArith(
        OP_POWER,
        [power, manager.mkRealNumeral(Rational.of(exponentValue.den))],
        manager.sorts[power],
      ),
    );
    this.addClause([this.mkLiteral(isBaseNonneg) ^ 1, this.mkLiteral(isEq)]);
  }

  protected mkIsIntAxiom(expr: number) {
    const arg = this.manager.getArg(expr, 0);
    const toReal = this.mkArith(OP_TO_REAL, [this.mkArith(OP_TO_INT, [arg], SORT_INT)], SORT_REAL);
    const eq = this.eqInternalize(toReal, arg);
    this.addEquiv(this.expr2literal(expr), eq);
  }

  protected mkIdivModAxioms(dividend: number, divisor: number) {
    if (this.isZero(divisor)) return;
    const manager = this.manager;
    const quotient = this.mkArith(OP_IDIV, [dividend, divisor], SORT_INT);
    const remainder = this.mkArith(OP_MOD, [dividend, divisor], SORT_INT);
    const zero = manager.mkNumeral(0n);
    if (this.isZero(dividend)) {
      const qGe0 = this.mkLiteral(this.mkIneq(OP_GE, divisor, zero));
      const qLe0 = this.mkLiteral(this.mkIneq(OP_LE, divisor, zero));
      const dGe0 = this.mkLiteral(this.mkIneq(OP_GE, quotient, zero));
      const dLe0 = this.mkLiteral(this.mkIneq(OP_LE, quotient, zero));
      const mGe0 = this.mkLiteral(this.mkIneq(OP_GE, remainder, zero));
      const mLe0 = this.mkLiteral(this.mkIneq(OP_LE, remainder, zero));
      for (const qLit of [qGe0, qLe0])
        for (const lit of [dGe0, dLe0, mGe0, mLe0]) this.addClause([qLit, lit]);
      return;
    }
    const eq = this.eqInternalize(
      this.mkArith(
        OP_ADD,
        [this.mkArith(OP_MUL, [divisor, quotient], SORT_INT), remainder],
        SORT_INT,
      ),
      dividend,
    );
    const modGe0 = this.mkLiteral(this.mkIneq(OP_GE, remainder, zero));
    const divisorValue = manager.isNumeral(divisor)
      ? manager.getRationalValue(divisor)
      : Rational.zero;
    if (!divisorValue.isZero()) {
      const upper = manager.mkNumeral(divisorValue.abs().sub(Rational.one).num);
      this.addClause([eq]);
      this.addClause([modGe0]);
      this.addClause([this.mkLiteral(this.mkIneq(OP_LE, remainder, upper))]);
      return;
    }
    const minusOne = manager.mkNumeral(-1n);
    const isNonneg = this.mkIneq(OP_GE, divisor, zero);
    const negDivisor = this.mkArith(OP_UMINUS, [divisor], SORT_INT);
    const absDivisor = this.mkArith(OP_ITE, [isNonneg, divisor, negDivisor], SORT_INT);
    const eqz = this.mkLiteral(manager.mkEq(divisor, zero));
    const modGe0Again = this.mkLiteral(this.mkIneq(OP_GE, remainder, zero));
    const modLtQ = this.mkLiteral(
      this.mkIneq(OP_LE, this.mkArith(OP_SUB, [remainder, absDivisor], SORT_INT), minusOne),
    );
    this.addClause([eqz, eq]);
    this.addClause([eqz, modGe0Again]);
    this.addClause([eqz, modLtQ]);
    if (manager.getOp(divisor) !== OP_UMINUS)
      this.addClause([
        this.mkLiteral(
          manager.mkEq(remainder, this.mkArith(OP_MOD, [dividend, negDivisor], SORT_INT)),
        ),
      ]);
    if (!manager.isNumeral(divisor))
      this.addClause([
        eqz,
        this.mkLiteral(
          this.mkIneq(OP_LE, this.mkArith(OP_MUL, [divisor, quotient], SORT_INT), dividend),
        ),
      ]);
  }

  protected mkRemAxiom(dividend: number, divisor: number) {
    const manager = this.manager;
    const zero = manager.mkNumeral(0n);
    const rem = this.mkArith(OP_REM, [dividend, divisor], SORT_INT);
    const mod = this.mkArith(OP_MOD, [dividend, divisor], SORT_INT);
    const negMod = this.mkArith(OP_UMINUS, [mod], SORT_INT);
    const dgez = this.mkLiteral(this.mkIneq(OP_GE, divisor, zero));
    const pos = this.eqInternalize(rem, mod);
    const neg = this.eqInternalize(rem, negMod);
    this.addClause([dgez ^ 1, pos]);
    this.addClause([dgez, neg]);
  }

  protected mkBoundAxiom(first: ArithBound, second: ArithBound) {
    const l1 = first.lit;
    const l2 = second.lit;
    const k1 = first.value;
    const k2 = second.value;
    if (k1.equals(k2) && first.isLower === second.isLower) return;
    if (first.isLower) {
      if (second.isLower) {
        if (k2.compare(k1) <= 0) this.addClause([l1 ^ 1, l2]);
        else this.addClause([l1, l2 ^ 1]);
      } else if (k1.compare(k2) <= 0) this.addClause([l1, l2]);
      else {
        this.addClause([l1 ^ 1, l2 ^ 1]);
        if (first.isInt && k1.equals(k2.add(Rational.one))) this.addClause([l1, l2]);
      }
    } else if (second.isLower) {
      if (k1.compare(k2) >= 0) this.addClause([l1, l2]);
      else {
        this.addClause([l1 ^ 1, l2 ^ 1]);
        if (first.isInt && k1.equals(k2.sub(Rational.one))) this.addClause([l1, l2]);
      }
    } else if (k1.compare(k2) >= 0) this.addClause([l1, l2 ^ 1]);
    else this.addClause([l1 ^ 1, l2]);
  }

  override newEqEh(eq: ThEq) {
    const v1 = eq.v1;
    const v2 = eq.v2;
    if (this.isBoolVar(v1)) return;
    this.forcePush();
    if (this.var2expr(v1) === this.var2expr(v2)) return;
    this.isNewEq = true;
    const first = this.var2enodeOf(v1);
    const second = this.var2enodeOf(v2);
    const w1 = this.registerVar(v1);
    const w2 = this.registerVar(v2);
    if (this.solver.areEqual(w1, w2)) return;
    const constraints = this.solver.addEquality(w1, w2);
    this.addEqConstraint(constraints[0], first, second);
    this.addEqConstraint(constraints[1], first, second);
  }

  override useDiseqs() {
    return true;
  }

  override newDiseqEh(eq: ThEq) {
    this.ensureColumn(eq.v1);
    this.ensureColumn(eq.v2);
    this.delayedEqs.push({ eq, isEq: false });
    this.ctx.trail.push(() => this.delayedEqs.pop());
  }

  protected ensureColumn(thVar: number) {
    if (this.solver.externalToLocalColumn(thVar) === NULL_LPVAR) this.registerVar(thVar);
  }

  protected mkDiseqAxiom(v1: number, v2: number) {
    if (this.isBoolVar(v1)) return;
    this.forcePush();
    const manager = this.manager;
    let first = this.var2expr(v1);
    let second = this.var2expr(v2);
    if (manager.ids[first] > manager.ids[second]) [first, second] = [second, first];
    if (manager.areDistinct(first, second)) return;
    if (manager.isNumeral(first)) [first, second] = [second, first];
    const eq = this.eqInternalize(first, second);
    let le: number;
    let ge: number;
    if (manager.isNumeral(second)) {
      le = this.mkLiteral(this.mkIneq(OP_LE, first, second));
      ge = this.mkLiteral(this.mkIneq(OP_GE, first, second));
    } else {
      const sort = manager.sorts[first];
      const diff = this.rewrite(this.mkArith(OP_SUB, [first, second], sort));
      const zero = manager.mkNumeralOfSort(Rational.zero, sort);
      if (manager.isNumeral(diff)) {
        if (!manager.getRationalValue(diff).isZero()) return;
        this.addUnit(eq);
        return;
      }
      le = this.mkLiteral(this.mkIneq(OP_LE, diff, zero));
      ge = this.mkLiteral(this.mkIneq(OP_GE, diff, zero));
    }
    this.addClause([eq ^ 1, le]);
    this.addClause([eq ^ 1, ge]);
    this.addClause([le ^ 1, ge ^ 1, eq]);
  }

  protected checkIdivBounds() {
    const manager = this.manager;
    let isAllValid = true;
    for (let index = 0; index < this.idivTerms.length; index++) {
      const term = this.idivTerms[index];
      let dividend = manager.getArg(term, 0);
      const divisor = manager.getArg(term, 1);
      const v1 = this.internalizeDef(dividend);
      this.ensureColumn(v1);
      const r1 = this.getIvalue(v1);
      if (!r1.x.isInt() || r1.x.isNegative() || !r1.y.isZero()) continue;
      if (!manager.isNumeral(divisor) || !manager.getRationalValue(divisor).isPositive()) continue;
      const r2 = manager.getRationalValue(divisor);
      if (!this.isBounded(term)) continue;
      const thVar = this.internalizeDef(term);
      const value = this.getIvalue(thVar);
      const quotient = Rational.of(getEuclideanDiv(r1.x.num, r2.num));
      if (value.y.isZero() && value.x.equals(quotient)) continue;
      let hi = r2.mul(quotient).add(r2).sub(Rational.one);
      let lo = r2.mul(quotient);
      if (manager.getOp(dividend) === OP_MUL && manager.getNumArgs(dividend) === 2) {
        const factor = getExtendedNumeral(manager, manager.getArg(dividend, 0));
        if (factor?.isPositive() === true) {
          dividend = manager.getArg(dividend, 1);
          hi = hi.div(factor).floor();
          lo = lo.div(factor).ceil();
        }
      }
      const pLeR1 = this.mkLiteral(this.mkIneq(OP_LE, dividend, manager.mkNumeral(hi.num)));
      const pGeR1 = this.mkLiteral(this.mkIneq(OP_GE, dividend, manager.mkNumeral(lo.num)));
      const nLeDiv = this.mkLiteral(this.mkIneq(OP_LE, term, manager.mkNumeral(quotient.num)));
      const nGeDiv = this.mkLiteral(this.mkIneq(OP_GE, term, manager.mkNumeral(quotient.num)));
      this.addClause([pLeR1 ^ 1, nLeDiv]);
      this.addClause([pGeR1 ^ 1, nGeDiv]);
      isAllValid = false;
    }
    return isAllValid;
  }

  private isBounded(expr: number): boolean {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op === OP_IDIV && manager.isNumeral(manager.getArg(expr, 1)))
      return this.isBounded(manager.getArg(expr, 0));
    return (op === OP_MOD && manager.isNumeral(manager.getArg(expr, 1))) || manager.isNumeral(expr);
  }

  protected getIvalue(thVar: number) {
    return this.solver.getValue(this.solver.externalToLocalColumn(thVar));
  }

  protected fixedVarEh(thVar: number, dep: Dependency, bound: Rational) {
    const manager = this.manager;
    const solver = this.solver;
    const node = this.var2enodeOf(thVar);
    const isInt = manager.isInt(node.owner);
    const other = bound.isZero()
      ? solver.getExternal(this.getZero(isInt))
      : bound.equals(Rational.one)
        ? solver.getExternal(this.getOne(isInt))
        : this.value2var.get(bound.toString());
    if (other === undefined) return;
    const otherNode = this.var2enodeOf(other);
    if (manager.sorts[node.owner] !== manager.sorts[otherNode.owner]) return;
    if (node.root === otherNode.root) return;
    this.resetEvidence();
    this.explanation.clear();
    for (const constraint of linearize([dep])) this.consume(Rational.one, constraint);
    this.propagateEq(this.core, this.eqs, node, otherNode);
  }

  protected resetEvidence() {
    this.core = [];
    this.eqs = [];
  }

  protected consume(coeff: Rational, constraint: number) {
    this.setEvidence(constraint);
    this.explanation.addPair(constraint, coeff);
  }

  protected setEvidence(constraint: number) {
    if (constraint === -1) return;
    const source = this.constraintSources[constraint];
    if (source === SOURCE_INEQUALITY) this.core.push(this.inequalities[constraint]);
    else if (source === SOURCE_EQUALITY)
      this.eqs.push(this.equalities[constraint] as [Enode, Enode]);
  }
}

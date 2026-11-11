// Ported from Z3 (src/tactic/arith/pb2bv_tactic.cpp, src/tactic/arith/pb2bv_model_converter.cpp),
// MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_ADD,
  OP_BADD,
  OP_DISTINCT,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NOT,
  OP_NUM,
  OP_OR,
  OP_ULEQ,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { checkPbFree } from "./card2bv";
import type { Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { getGcd, Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import { DEFAULT_PRINT_OPTIONS, printExpr } from "./smt2-printer";

const LINEAR_OPS = [OP_LE, OP_GE, OP_LT, OP_GT, OP_ADD, OP_NUM];

const PRINT_ENVIRONMENT = {
  options: DEFAULT_PRINT_OPTIONS,
  isUsed: () => false,
  isClashing: () => false,
};

// only_01_visitor, which visits each subterm after its arguments: the first expression outside
// pseudo-Boolean constraints over Booleans and 0-1 integers, or undefined.
export const findNonPb = (manager: AstManager, forms: number[], bounds: BoundManager) => {
  const isNonPb = (expr: number) => {
    if (manager.kinds[expr] !== KIND_APP) return true;
    const family = manager.getFamily(expr);
    const op = manager.getOp(expr);
    if (family === FAMILY_BASIC)
      return (op === OP_ITE && manager.sorts[expr] !== SORT_BOOL) || op === OP_DISTINCT;
    if (family === FAMILY_ARITH)
      return !(
        LINEAR_OPS.includes(op) ||
        (op === OP_MUL &&
          manager.getNumArgs(expr) === 2 &&
          manager.isNumeral(manager.getArg(expr, 0)))
      );
    if (manager.isUninterpretedConst(expr)) {
      if (manager.sorts[expr] === SORT_BOOL) return false;
      if (manager.sorts[expr] === SORT_INT && bounds.isZeroOne(expr)) return false;
    }
    return true;
  };
  const visited = new Set<number>();
  for (const form of forms) {
    const todo = [{ expr: form, isExpanded: false }];
    for (let frame = todo.pop(); frame !== undefined; frame = todo.pop()) {
      if (frame.isExpanded) {
        if (isNonPb(frame.expr)) return frame.expr;
        continue;
      }
      if (visited.has(frame.expr)) continue;
      visited.add(frame.expr);
      todo.push({ expr: frame.expr, isExpanded: true });
      if (manager.kinds[frame.expr] === KIND_APP)
        for (let index = manager.getNumArgs(frame.expr) - 1; index >= 0; index--)
          todo.push({ expr: manager.getArg(frame.expr, index), isExpanded: false });
    }
  }
  return undefined;
};

interface Lit {
  variable: number;
  isSigned: boolean;
}

interface Monomial {
  coeff: Rational;
  lit: Lit;
}

const EQ = 0;
const GE = 1;
const LE = 2;

const getNumBits = (value: Rational) => value.num.toString(2).length;

class ConstraintRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private converter: Pb2Bv,
  ) {
    super(manager);
  }

  getSubst(expr: number) {
    return this.converter.isConstraintCore(expr) ? this.converter.convertSaved(expr) : undefined;
  }
}

class Pb2Bv {
  private bounds: BoundManager;
  private boolRewriter: Rewriter;
  readonly const2bit: ObjMap<number>;
  private notConst2bit: ObjMap<number>;
  readonly temporaryInts: RefVector;
  readonly terms: RefVector;
  private allClausesLimit: number;
  private cardinalityLimit: number;
  private rewriter: ConstraintRewriter | undefined;
  private results: RefVector | undefined;

  constructor(
    private manager: AstManager,
    params: ReadonlyMap<string, boolean | number | string>,
    options: RewriterOptions,
  ) {
    this.bounds = new BoundManager(manager);
    this.boolRewriter = new Rewriter(manager, options);
    this.const2bit = new ObjMap((decl) => manager.getDeclHash(decl));
    this.notConst2bit = new ObjMap((decl) => manager.getDeclHash(decl));
    this.temporaryInts = new RefVector(manager);
    this.terms = new RefVector(manager);
    const getUint = (name: string, defaultValue: number) => {
      const value = params.get(name);
      return typeof value === "number" ? value : defaultValue;
    };
    this.allClausesLimit = getUint("pb2bv_all_clauses_limit", 8);
    this.cardinalityLimit = getUint("pb2bv_cardinality_limit", 4294967295);
  }

  private hold(expr: number) {
    this.terms.push(expr);
    return expr;
  }

  private int2lit(variable: number, isSigned = false) {
    const manager = this.manager;
    const decl = manager.decls[variable];
    const found = (isSigned ? this.notConst2bit : this.const2bit).get(decl);
    if (found !== undefined) return found;
    const bit = this.hold(manager.mkFreshConst(null, SORT_BOOL));
    const notBit = this.hold(manager.mkApp(OP_NOT, [bit], SORT_BOOL));
    this.const2bit.set(decl, bit);
    this.notConst2bit.set(decl, notBit);
    manager.incDeclRef(decl);
    return isSigned ? notBit : bit;
  }

  private monLit2lit(lit: Lit) {
    return this.int2lit(lit.variable, lit.isSigned);
  }

  private mkAnd(args: number[]) {
    return this.hold(this.boolRewriter.mkAnd(args));
  }

  private mkNot(arg: number) {
    return this.hold(this.boolRewriter.mkNot(arg));
  }

  private mkIte(condition: number, thenExpr: number, elseExpr: number) {
    const result = this.boolRewriter.mkIte(condition, thenExpr, elseExpr);
    return this.hold(typeof result === "number" ? result : result.expr);
  }

  private mkAllClauses(polynomial: Monomial[], bound: Rational) {
    const manager = this.manager;
    const size = polynomial.length;
    const sums: Rational[] = [];
    for (let index = size - 1; index >= 0; index--)
      sums[index] =
        index === size - 1 ? polynomial[index].coeff : polynomial[index].coeff.add(sums[index + 1]);
    const lits = polynomial.map((monomial) => this.monLit2lit(monomial.lit));
    const clause: number[] = [];
    const result: number[] = [];
    const process = (index: number, remaining: Rational) => {
      if (!remaining.isPositive()) return;
      if (index === size || sums[index].compare(remaining) < 0) {
        result.push(
          clause.length === 0
            ? manager.falseExpr
            : clause.length === 1
              ? clause[0]
              : this.hold(manager.mkApp(OP_OR, [...clause], SORT_BOOL)),
        );
        return;
      }
      clause.push(lits[index]);
      process(index + 1, remaining);
      clause.pop();
      process(index + 1, remaining.sub(polynomial[index].coeff));
    };
    process(0, bound);
    return this.mkAnd(result);
  }

  private bitblastPbc(polynomial: Monomial[], bound: Rational): number {
    const manager = this.manager;
    const size = polynomial.length;
    const isCard = polynomial.every((monomial) => monomial.coeff.equals(Rational.one));
    const sizeValue = Rational.fromNumber(size);
    if (isCard && sizeValue.compare(bound) < 0) return manager.falseExpr;
    if (isCard && bound.equals(Rational.one))
      return this.hold(manager.mkOr(polynomial.map((monomial) => this.monLit2lit(monomial.lit))));
    if (isCard && bound.equals(sizeValue))
      return this.mkAnd(polynomial.map((monomial) => this.monLit2lit(monomial.lit)));
    if (size <= this.allClausesLimit) return this.mkAllClauses(polynomial, bound);
    if (isCard) {
      const k = Number(bound.num);
      const rowSize = size - k + 1;
      if ((k * rowSize) % 4294967296 <= this.cardinalityLimit) {
        const row: number[] = Array.from({ length: rowSize }, () => manager.trueExpr);
        for (let index = 0; index < k; index++)
          for (let column = 0; column < rowSize; column++)
            row[column] = this.mkIte(
              this.monLit2lit(polynomial[index + column].lit),
              row[column],
              column === 0 ? manager.falseExpr : row[column - 1],
            );
        return row[rowSize - 1];
      }
    }
    const sum = polynomial.reduce((total, monomial) => total.add(monomial.coeff), Rational.zero);
    if (sum.compare(bound) < 0) return manager.falseExpr;
    const bits = getNumBits(sum);
    const sort = manager.mkBvSort(bits);
    const zero = manager.mkBvNumeral(0n, bits);
    const summands = polynomial.map((monomial) =>
      manager.mkApp(
        OP_ITE,
        [this.monLit2lit(monomial.lit), manager.mkBvNumeral(monomial.coeff.num, bits), zero],
        sort,
      ),
    );
    return this.hold(
      mkBvApp(manager, OP_ULEQ, [
        manager.mkBvNumeral(bound.num, bits),
        mkBvApp(manager, OP_BADD, summands),
      ]),
    );
  }

  private split(polynomial: Monomial[], bound: Rational, clause: Monomial[]) {
    const manager = this.manager;
    if (polynomial.length <= 2 || bound.equals(Rational.one)) return polynomial;
    if (!polynomial[0].coeff.equals(bound) || !polynomial[1].coeff.equals(bound)) return polynomial;
    const end = polynomial.findIndex(
      (monomial, index) => index >= 2 && !monomial.coeff.equals(bound),
    );
    if (end === -1) return polynomial;
    for (const monomial of polynomial.slice(0, end))
      clause.push({ coeff: Rational.one, lit: monomial.lit });
    const fresh = manager.mkFreshConst(null, SORT_INT);
    this.temporaryInts.push(fresh);
    clause.push({ coeff: Rational.one, lit: { variable: fresh, isSigned: true } });
    return [{ coeff: bound, lit: { variable: fresh, isSigned: false } }, ...polynomial.slice(end)];
  }

  private mkPbc(input: Monomial[], inputBound: Rational, isSplitting: boolean) {
    const manager = this.manager;
    if (!inputBound.isPositive()) return manager.trueExpr;
    let gcd = input[0].coeff.compare(inputBound) > 0 ? inputBound.num : input[0].coeff.num;
    let polynomial = input.map((monomial) => {
      const coeff = monomial.coeff.compare(inputBound) > 0 ? inputBound : monomial.coeff;
      gcd = getGcd(gcd, coeff.num);
      return { coeff, lit: monomial.lit };
    });
    let bound = inputBound;
    if (gcd !== 1n) {
      const divisor = Rational.of(gcd);
      polynomial = polynomial.map((monomial) => ({
        coeff: monomial.coeff.div(divisor),
        lit: monomial.lit,
      }));
      bound = bound.div(divisor).ceil();
    }
    // Z3's a_sum adds the bound rather than each coefficient, so only an empty polynomial is false.
    if (polynomial.length === 0) return manager.falseExpr;
    const clause: Monomial[] = [];
    if (isSplitting) polynomial = this.split(polynomial, bound, clause);
    if (clause.length === 0) return this.bitblastPbc(polynomial, bound);
    const first = this.bitblastPbc(polynomial, bound);
    const second = this.bitblastPbc(clause, Rational.one);
    return this.mkAnd([first, second]);
  }

  private isEqVector(polynomial: Monomial[], bound: Rational) {
    const size = polynomial.length;
    if (size % 2 === 1) return false;
    const half = size / 2;
    if (!bound.equals(Rational.of(2n ** BigInt(half) - 1n))) return false;
    for (let index = 0; index < half; index++) {
      const first = polynomial[index * 2];
      const second = polynomial[index * 2 + 1];
      if (first.lit.isSigned === second.lit.isSigned) return false;
      if (!first.coeff.equals(second.coeff)) return false;
      if (!first.coeff.equals(Rational.of(2n ** BigInt(half - index - 1)))) return false;
    }
    return true;
  }

  private mkUnit(variable: number, isSigned: boolean) {
    return this.monLit2lit({ variable, isSigned });
  }

  convert(atom: number, isPositive: boolean, isRoot: boolean): number {
    const manager = this.manager;
    const op = manager.getOp(atom);
    const [lhs, rhs] = manager.getArgs(atom);
    let kind: number;
    let pos = isPositive;
    if (op === OP_EQ) {
      if (manager.isUninterpretedConst(lhs) && manager.isUninterpretedConst(rhs)) {
        const lhsLit = this.mkUnit(lhs, false);
        const rhsLit = this.mkUnit(rhs, !pos);
        return this.hold(manager.mkEq(lhsLit, rhsLit));
      }
      kind = EQ;
    } else if (op === OP_LE) kind = LE;
    else if (op === OP_GE) kind = GE;
    else this.throwNonPb(atom);
    const adjust = (value: Rational) => {
      if (pos) return value;
      if (kind === LE) {
        pos = true;
        kind = GE;
        return value.add(Rational.one);
      }
      if (kind === GE) {
        pos = true;
        kind = LE;
        return value.sub(Rational.one);
      }
      return value;
    };
    if (manager.isNumeral(lhs)) {
      const value = adjust(manager.getRationalValue(lhs));
      if (!manager.isUninterpretedConst(rhs)) this.throwNonPb(atom);
      if (kind === EQ) return this.mkUnit(rhs, value.isZero() !== !pos);
      if ((value.isZero() && kind === LE) || (value.equals(Rational.one) && kind === GE))
        return manager.trueExpr;
      if ((value.isZero() && kind === GE) || (value.equals(Rational.one) && kind === LE))
        return this.mkUnit(rhs, kind === GE);
      this.throwNonPb(atom);
    }
    if (!manager.isNumeral(rhs) || manager.sorts[rhs] !== SORT_INT) this.throwNonPb(atom);
    const value = adjust(manager.getRationalValue(rhs));
    if (manager.isUninterpretedConst(lhs)) {
      if (kind === EQ) {
        if (!value.isZero() && !value.equals(Rational.one))
          return pos ? manager.falseExpr : manager.trueExpr;
        return this.mkUnit(lhs, value.isZero() !== !pos);
      }
      if (kind === LE) {
        if (value.compare(Rational.one) >= 0) return manager.trueExpr;
        if (value.isNegative()) return manager.falseExpr;
      } else {
        if (!value.isPositive()) return manager.trueExpr;
        if (value.compare(Rational.one) > 0) return manager.falseExpr;
      }
      return this.mkUnit(lhs, kind === LE);
    }
    if (manager.getOp(lhs) !== OP_ADD) this.throwNonPb(atom);
    const monomials = manager.getArgs(lhs);
    const getMulArgs = (monomial: number) =>
      manager.getOp(monomial) === OP_MUL && manager.getNumArgs(monomial) === 2
        ? manager.getArgs(monomial)
        : undefined;
    for (const monomial of monomials) {
      if (manager.isUninterpretedConst(monomial)) continue;
      const args = getMulArgs(monomial);
      if (args !== undefined && manager.isNumeral(args[0]) && manager.isUninterpretedConst(args[1]))
        continue;
      this.throwNonPb(atom);
    }
    let bound = value;
    const polynomial: Monomial[] = monomials.map((monomial) => {
      if (manager.isUninterpretedConst(monomial))
        return { coeff: Rational.one, lit: { variable: monomial, isSigned: false } };
      const [coeffExpr, variable] = getMulArgs(monomial) as number[];
      const coeff = manager.getRationalValue(coeffExpr);
      if (!coeff.isNegative()) return { coeff, lit: { variable, isSigned: false } };
      bound = bound.add(coeff.neg());
      return { coeff: coeff.neg(), lit: { variable, isSigned: true } };
    });
    const sorted = polynomial
      .map((monomial, index) => ({ monomial, index }))
      .sort(
        (first, second) =>
          second.monomial.coeff.compare(first.monomial.coeff) || first.index - second.index,
      )
      .map((entry) => entry.monomial);
    const negate = (monomials: Monomial[], total: Rational) => ({
      polynomial: monomials.map((monomial) => ({
        coeff: monomial.coeff,
        lit: { variable: monomial.lit.variable, isSigned: !monomial.lit.isSigned },
      })),
      bound: monomials.reduce((sum, monomial) => sum.add(monomial.coeff), total.neg()),
    });
    if (kind === GE) return this.mkPbc(sorted, bound, isRoot);
    if (kind === LE) {
      const negated = negate(sorted, bound);
      return this.mkPbc(negated.polynomial, negated.bound, isRoot);
    }
    if (this.isEqVector(sorted, bound)) {
      const eqs: number[] = [];
      for (let index = 0; index < sorted.length; index += 2)
        eqs.push(
          this.hold(
            manager.mkEq(
              this.int2lit(sorted[index].lit.variable),
              this.int2lit(sorted[index + 1].lit.variable),
            ),
          ),
        );
      const conjunction = this.mkAnd(eqs);
      return pos ? conjunction : this.mkNot(conjunction);
    }
    const negated = negate(sorted, bound);
    const first = this.mkPbc(sorted, bound, false);
    const second = this.mkPbc(negated.polynomial, negated.bound, false);
    const conjunction = this.mkAnd([first, second]);
    return pos ? conjunction : this.mkNot(conjunction);
  }

  convertSaved(atom: number) {
    return this.convert(atom, true, false);
  }

  isConstraintCore(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    return (
      (op === OP_EQ && manager.sorts[manager.getArg(expr, 0)] === SORT_INT) ||
      op === OP_LE ||
      op === OP_GE
    );
  }

  run(goal: Goal) {
    const manager = this.manager;
    for (const form of goal.forms.items) this.bounds.add(form);
    const failed = findNonPb(manager, goal.forms.items, this.bounds);
    if (failed !== undefined) this.throwNonPb(failed);
    const rewriter = new ConstraintRewriter(manager, this);
    this.rewriter = rewriter;
    const results = new RefVector(manager);
    this.results = results;
    for (const form of goal.forms.items) {
      let atom = form;
      let isPositive = true;
      while (manager.isNot(atom)) {
        atom = manager.getArg(atom, 0);
        isPositive = !isPositive;
      }
      if (this.isConstraintCore(atom)) {
        results.push(this.convert(atom, isPositive, true));
        continue;
      }
      const rewritten = rewriter.rewrite(form);
      checkPbFree(manager, rewritten);
      results.pushOwned(rewritten);
    }
    for (const [index, result] of results.items.entries()) goal.update(index, result);
    results.reset();
    const hidden: Definition[] = [];
    for (const [, bit] of this.const2bit) hidden.push({ decl: manager.decls[bit], def: -1 });
    for (const fresh of this.temporaryInts.items)
      hidden.push({ decl: manager.decls[fresh], def: -1 });
    goal.addDefinitions(hidden);
    const c2bit: { decl: number; bit: number }[] = [];
    for (const [decl, bit] of this.const2bit) {
      manager.incDeclRef(decl);
      manager.incDeclRef(manager.decls[bit]);
      c2bit.push({ decl, bit: manager.decls[bit] });
    }
    for (const variable of this.bounds.boundedVars) {
      const decl = manager.decls[variable];
      if (this.const2bit.has(decl)) continue;
      manager.incDeclRef(decl);
      c2bit.push({ decl, bit: -1 });
    }
    goal.addModelConversion((model) => {
      for (const entry of c2bit) {
        const value = entry.bit === -1 ? undefined : model.constInterps.get(entry.bit);
        const isOne = value !== undefined && !manager.isFalse(value);
        model.registerConst(entry.decl, manager.mkNumeral(isOne ? 1n : 0n));
      }
      return model;
    });
    goal.depth++;
  }

  private throwNonPb(expr: number): never {
    throw new SmtTacticError(
      `goal is in a fragment not supported by pb2bv. Offending expression: ${printExpr(this.manager, PRINT_ENVIRONMENT, expr)}`,
    );
  }

  release() {
    this.results?.reset();
    this.rewriter?.release();
    for (const [decl] of this.const2bit) this.manager.decDeclRef(decl);
    this.terms.reset();
    this.temporaryInts.reset();
    this.boolRewriter.release();
  }
}

export const runPb2Bv =
  (
    manager: AstManager,
    params: ReadonlyMap<string, boolean | number | string>,
    options: RewriterOptions,
  ) =>
  (goal: Goal) => {
    if (goal.isProofsEnabled) throw new SmtTacticError("pb2bv does not support proof production");
    if (!goal.isInconsistent) {
      const converter = new Pb2Bv(manager, params, options);
      try {
        converter.run(goal);
      } finally {
        converter.release();
      }
    }
    return [goal];
  };

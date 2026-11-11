// Ported from Z3 (src/qe/qe_arith_plugin.cpp, src/smt/arith_eq_solver.cpp), MIT license, see
// z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  OP_ADD,
  OP_AND,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UBV2INT,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { isAppOf } from "./ast-util";
import { ArithRewriter, TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { mkBvApp } from "./bv-decl-plugin";
import { ExprSafeReplace } from "./expr-safe-replace";
import type { ContainsApp, QeSolverContext, QeSolverPlugin } from "./qe";
import { getEuclideanMod, getGcd, getLcm, Rational } from "./rational";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import type { Rewrite } from "./rewriter-tpl";

const getExpr = (result: number | Rewrite | undefined, fallback: () => number) =>
  result === undefined ? fallback() : typeof result === "number" ? result : result.expr;

const isOne = (value: Rational) => value.equals(Rational.one);

const isArith = (manager: AstManager, expr: number) =>
  manager.sorts[expr] === SORT_INT || manager.sorts[expr] === SORT_REAL;

// k*x + rest, where k is not zero.
interface Coeff {
  k: Rational;
  rest: number;
}

class ArithQeUtil {
  readonly manager: AstManager;
  private rewriter: Rewriter;
  private arithRewriter: ArithRewriter;
  varsAdded: number[] = [];

  constructor(readonly context: QeSolverContext) {
    this.manager = context.manager;
    this.rewriter = new Rewriter(this.manager, TACTIC_REWRITER_OPTIONS);
    this.arithRewriter = new ArithRewriter(this.manager, TACTIC_ARITH_OPTIONS);
  }

  release() {
    this.rewriter.release();
  }

  pin(expr: number) {
    return this.context.pin(expr);
  }

  simplify(expr: number) {
    return this.context.pinOwned(this.rewriter.rewrite(expr));
  }

  replace(source: number, target: number, formula: number) {
    const replace = new ExprSafeReplace(this.manager);
    replace.insert(source, target);
    const result = this.context.pinOwned(replace.apply(formula));
    replace.release();
    return result;
  }

  getNumeral(expr: number) {
    const manager = this.manager;
    return manager.isNumeral(expr) && isArith(manager, expr)
      ? manager.getRationalValue(expr)
      : undefined;
  }

  mkNumeral(value: Rational, isInt = true) {
    return this.pin(this.manager.mkNumeralOfSort(value, isInt ? SORT_INT : SORT_REAL));
  }

  mkApp(op: number, args: number[], sort: number) {
    return this.pin(this.manager.mkApp(op, args, sort));
  }

  mkAddN(args: number[]) {
    return args.length === 1 ? args[0] : this.mkApp(OP_ADD, args, this.manager.sorts[args[0]]);
  }

  mkAdd(first: number, second: number) {
    return this.mkApp(OP_ADD, [first, second], this.manager.sorts[first]);
  }

  mkSub(first: number, second: number) {
    return this.mkApp(OP_SUB, [first, second], this.manager.sorts[first]);
  }

  mkMulApp(first: number, second: number) {
    return this.mkApp(OP_MUL, [first, second], this.manager.sorts[second]);
  }

  mkMul(value: Rational, expr: number) {
    return isOne(value)
      ? expr
      : this.mkMulApp(this.mkNumeral(value, this.manager.isInt(expr)), expr);
  }

  mkUminus(expr: number) {
    return this.mkApp(OP_UMINUS, [expr], this.manager.sorts[expr]);
  }

  mkLeApp(first: number, second: number) {
    return this.mkApp(OP_LE, [first, second], SORT_BOOL);
  }

  mkZero(sort: number) {
    return this.mkNumeral(Rational.zero, sort === SORT_INT);
  }

  mkOne(sort: number) {
    return this.mkNumeral(Rational.one, sort === SORT_INT);
  }

  mkAnd(args: number[]) {
    return this.context.pinOwned(this.manager.withTemporaries(() => this.rewriter.mkAnd(args)));
  }

  mkOr(args: number[]) {
    return this.context.pinOwned(this.manager.withTemporaries(() => this.rewriter.mkOr(args)));
  }

  mkNotRewrite(expr: number) {
    return this.context.pinOwned(this.manager.withTemporaries(() => this.rewriter.mkNot(expr)));
  }

  mkEqRewrite(first: number, second: number) {
    return this.context.pinOwned(
      this.manager.withTemporaries(() => this.rewriter.mkEq(first, second)),
    );
  }

  // arith_rewriter's mk_le, which keeps a rewrite without rewriting it further.
  mkLeRewrite(first: number, second: number) {
    return this.pin(
      getExpr(this.arithRewriter.mkLe(first, second), () =>
        this.manager.mkApp(OP_LE, [first, second], SORT_BOOL),
      ),
    );
  }

  mkModRewrite(first: number, second: number) {
    return this.pin(
      getExpr(this.arithRewriter.mkMod(first, second), () =>
        this.manager.mkApp(OP_MOD, [first, second], SORT_INT),
      ),
    );
  }

  mkSubRewrite(first: number, second: number) {
    return this.pin(
      getExpr(this.arithRewriter.mkSub([first, second]), () => this.mkSub(first, second)),
    );
  }

  getCoeff(contains: ContainsApp, p: number): Coeff | undefined {
    const manager = this.manager;
    const x = contains.x;
    const restList: number[] = [];
    const todo = [p];
    let k: Rational | undefined;
    while (todo.length > 0) {
      const expr = todo.pop() as number;
      if (isAppOf(manager, expr, OP_ADD)) {
        todo.push(...manager.getArgs(expr));
        continue;
      }
      if (expr === x) {
        k = Rational.one;
        break;
      }
      if (isAppOf(manager, expr, OP_MUL) && manager.getNumArgs(expr) === 2) {
        const [first, second] = manager.getArgs(expr);
        const firstValue = this.getNumeral(first);
        const secondValue = this.getNumeral(second);
        if (first === x && secondValue !== undefined) {
          k = secondValue;
          break;
        }
        if (second === x && firstValue !== undefined) {
          k = firstValue;
          break;
        }
      }
      restList.push(expr);
    }
    if (k === undefined) return undefined;
    while (todo.length > 0) restList.push(todo.pop() as number);
    const rest = restList.length === 0 ? this.mkZero(manager.sorts[x]) : this.mkAddN(restList);
    return contains.has(rest) ? undefined : { k, rest };
  }

  // The p of an inequality written as p <= 0 for isLe, or as p >= 0 otherwise.
  private getLeGe(expr: number, isLe: boolean) {
    const manager = this.manager;
    const first = isLe ? 0 : 1;
    const second = 1 - first;
    if (isAppOf(manager, expr, OP_LE))
      return this.getSide(manager.getArg(expr, first), manager.getArg(expr, second));
    if (isAppOf(manager, expr, OP_GE))
      return this.getSide(manager.getArg(expr, second), manager.getArg(expr, first));
    return undefined;
  }

  private getSide(p: number, other: number) {
    return this.getNumeral(other)?.isZero() === true ? p : this.simplify(this.mkSub(p, other));
  }

  isLe(expr: number) {
    return this.getLeGe(expr, true);
  }

  isGe(expr: number) {
    return this.getLeGe(expr, false);
  }

  // The p of a strict inequality written as p < 0.
  isLt(expr: number) {
    const manager = this.manager;
    if (isAppOf(manager, expr, OP_LT))
      return this.getSide(manager.getArg(expr, 0), manager.getArg(expr, 1));
    if (isAppOf(manager, expr, OP_GT))
      return this.getSide(manager.getArg(expr, 1), manager.getArg(expr, 0));
    return undefined;
  }

  // Matches 0 = p mod k and p mod k = 0.
  isDivides(expr: number) {
    const manager = this.manager;
    if (!isAppOf(manager, expr, OP_EQ)) return undefined;
    const [first, second] = manager.getArgs(expr);
    return this.isDividesSides(first, second) ?? this.isDividesSides(second, first);
  }

  private isDividesSides(zero: number, mod: number) {
    const manager = this.manager;
    if (!isAppOf(manager, mod, OP_MOD) || this.getNumeral(zero)?.isZero() !== true)
      return undefined;
    const k = this.getNumeral(manager.getArg(mod, 1));
    return k === undefined ? undefined : { k, p: manager.getArg(mod, 0) };
  }

  isNotDivides(expr: number) {
    const manager = this.manager;
    if (!manager.isNot(expr)) return undefined;
    const atom = manager.getArg(expr, 0);
    const divides = this.isDivides(atom);
    return divides === undefined ? undefined : { ...divides, atom };
  }

  isReal(x: number) {
    return this.manager.isReal(x);
  }

  // b*t <= a*s, or b*t < a*s when isStrict.
  mkBoundAux(isStrict: boolean, a: Rational, t: number, b: Rational, s: number) {
    const manager = this.manager;
    const ss = this.mkMul(a.abs(), s);
    const tt = this.mkMul(b.abs(), t);
    const e = a.isNegative() ? this.mkSub(tt, ss) : this.mkSub(ss, tt);
    if (!isStrict) return this.mkLe(e);
    return manager.isInt(e) ? this.mkLe(this.mkAdd(e, this.mkOne(SORT_INT))) : this.mkLt(e);
  }

  mkDivides(n: Rational, expr: number) {
    const simplified = this.simplify(expr);
    const mod = this.mkModRewrite(simplified, this.mkNumeral(n));
    return this.mkEqRewrite(this.mkZero(SORT_INT), mod);
  }

  mkDiv(expr: number, k: Rational) {
    return this.simplify(this.mkApp(OP_DIV, [expr, this.mkNumeral(k, false)], SORT_REAL));
  }

  mkLe(expr: number) {
    return this.mkLeRewrite(this.simplify(expr), this.mkZero(this.manager.sorts[expr]));
  }

  mkLt(expr: number) {
    const manager = this.manager;
    const value = this.getNumeral(expr);
    if (value !== undefined) return value.isNegative() ? manager.trueExpr : manager.falseExpr;
    const result = manager.isInt(expr)
      ? this.mkLeApp(expr, this.mkNumeral(Rational.minusOne))
      : this.pin(manager.mkNot(this.mkLeApp(this.mkZero(manager.sorts[expr]), expr)));
    return this.simplify(result);
  }

  // a*x + t = 0
  mkEq(a: Rational, x: number, t: number) {
    return this.pin(
      this.manager.mkEq(this.mkAdd(this.mkMul(a, x), t), this.mkZero(this.manager.sorts[x])),
    );
  }

  mkFlatAnd(first: number, second: number) {
    const manager = this.manager;
    return this.mkAnd(
      [first, second].flatMap((expr) =>
        isAppOf(manager, expr, OP_AND) ? manager.getArgs(expr) : [expr],
      ),
    );
  }

  // b*t <= a*s, with the cases of integer resolution.
  mkResolve(x: number, isStrict: boolean, a: Rational, t: number, b: Rational, s: number) {
    const manager = this.manager;
    const bt = this.mkMul(b.abs(), t);
    const as = this.mkMul(a.abs(), s);
    const asBt = this.mkAdd(as, bt);
    const result = isStrict ? this.mkLt(asBt) : this.mkLe(asBt);
    if (isOne(a.abs()) || isOne(b.abs())) return result;
    // a*s + b*t + (a-1)(b-1) <= 0
    const slack = this.mkNumeral(a.abs().sub(Rational.one).mul(b.abs().sub(Rational.one)));
    const result1 = this.mkLe(this.mkApp(OP_ADD, [asBt, slack], manager.sorts[asBt]));
    // Swap so that |a| >= |b|.
    const isSwapped = a.abs().compare(b.abs()) < 0;
    const a1 = isSwapped ? b : a;
    const b1 = isSwapped ? a : b;
    const s1 = isSwapped ? t : s;
    const bt1 = isSwapped ? as : bt;
    // exists z in [0 .. |b|-2] . |b| | (z + s) && a*n_sign(b)(s + z) + |b|t <= 0
    const sum = this.mkAdd(s1, x);
    const sz = b1.isPositive() ? this.mkUminus(sum) : sum;
    const aszBtLe0 = this.mkLe(this.mkAdd(this.mkMul(a1, sz), bt1));
    const isZBound =
      manager.getNumArgs(aszBtLe0) === 2 &&
      manager.getArg(aszBtLe0, 0) === x &&
      this.getNumeral(manager.getArg(aszBtLe0, 1))?.isZero() === true;
    const tmp2 = isZBound
      ? this.mkDivides(b1.abs(), s1)
      : this.mkBigOr(
          b1.abs().sub(Rational.of(2n)),
          x,
          this.mkAnd([this.mkDivides(b1.abs(), sz), aszBtLe0]),
        );
    return this.simplify(this.mkOr([result1, this.mkFlatAnd(result, tmp2)]));
  }

  normalizeSum(p: number) {
    const manager = this.manager;
    const simplified = this.simplify(p);
    if (!isAppOf(manager, simplified, OP_ADD)) return simplified;
    const strip = (expr: number) => {
      if (!isAppOf(manager, expr, OP_MUL) || manager.getNumArgs(expr) !== 2) return expr;
      return this.getNumeral(manager.getArg(expr, 0)) !== undefined
        ? manager.getArg(expr, 1)
        : expr;
    };
    const args = [...manager.getArgs(simplified)].sort(
      (first, second) => strip(first) - strip(second),
    );
    return this.mkAddN(args);
  }

  mkAtom(expr: number, isPositive: boolean) {
    const manager = this.manager;
    if (this.isDivides(expr) !== undefined) return isPositive ? expr : this.mkNotRewrite(expr);
    const [a0, a1] = manager.getArgs(expr);
    if (isAppOf(manager, expr, OP_EQ) && isArith(manager, a0)) {
      if (isPositive) {
        const t1 = this.simplify(this.mkSub(a0, a1));
        const t2 = this.simplify(this.mkSub(a1, a0));
        return this.mkAnd([this.mkLe(t1), this.mkLe(t2)]);
      }
      if (manager.isInt(a0)) {
        const difference = this.mkSub(a0, a1);
        const t1 = this.simplify(this.mkAdd(this.mkOne(SORT_INT), difference));
        const t2 = this.simplify(this.mkSub(this.mkOne(SORT_INT), difference));
        return this.mkOr([this.mkLe(t1), this.mkLe(t2)]);
      }
      const t1 = this.simplify(this.mkSub(a0, a1));
      const t2 = this.simplify(this.mkSub(a1, a0));
      return this.mkOr([this.mkLt(t1), this.mkLt(t2)]);
    }
    const isLe = isAppOf(manager, expr, OP_LE);
    const isGe = isAppOf(manager, expr, OP_GE);
    if (isLe || isGe) {
      if (isPositive) return expr;
      // a0 <= a1, or a1 >= a0.
      const [low, high] = isLe ? [a0, a1] : [a1, a0];
      return this.mkLt(this.mkSub(high, low));
    }
    const isLt = isAppOf(manager, expr, OP_LT);
    if (isLt || isAppOf(manager, expr, OP_GT)) {
      const [low, high] = isLt ? [a0, a1] : [a1, a0];
      return isPositive ? this.mkLt(this.mkSub(low, high)) : this.mkLe(this.mkSub(high, low));
    }
    return undefined;
  }

  mkBoundedVar(n: Rational) {
    const manager = this.manager;
    let size = 0;
    let b = n.num;
    do {
      size++;
      b /= 2n;
    } while (b > 0n);
    const zBv = this.pin(manager.mkFreshConst("z", manager.mkBvSort(size)));
    return { zBv, z: this.pin(mkBvApp(manager, OP_UBV2INT, [zBv])) };
  }

  solve(conjs: readonly number[], formula: number) {
    return this.extractEqualities(conjs).some((eq) => this.reduceEquation(eq, formula));
  }

  private extractEqualities(conjs: readonly number[]) {
    const manager = this.manager;
    const leqs = new Set<number>();
    const eqs: number[] = [];
    for (const conj of conjs) {
      if (isAppOf(manager, conj, OP_EQ) && isArith(manager, manager.getArg(conj, 0))) {
        eqs.push(
          this.simplify(this.mkSubRewrite(manager.getArg(conj, 0), manager.getArg(conj, 1))),
        );
        continue;
      }
      const isLe = isAppOf(manager, conj, OP_LE);
      if (!isLe && !isAppOf(manager, conj, OP_GE)) continue;
      const [first, second] = manager.getArgs(conj);
      const difference = this.normalizeSum(
        isLe ? this.mkSubRewrite(first, second) : this.mkSubRewrite(second, first),
      );
      const negated = this.normalizeSum(this.mkUminus(difference));
      if (leqs.has(negated)) eqs.push(difference);
      else leqs.add(difference);
    }
    return eqs;
  }

  addVar(x: number, isTracked = true) {
    this.context.addVar(x);
    if (isTracked) this.varsAdded.push(x);
  }

  private mkBigOr(up: Rational, x: number, body: number) {
    return Rational.one.compare(up) >= 0
      ? this.mkBigOrBlast(up, x, body)
      : this.mkBigOrSymbolicBlast(up, x, body);
  }

  private mkBigOrBlast(up: Rational, x: number, body: number) {
    const ors: number[] = [];
    for (let index = 0n; index <= up.num; index++)
      ors.push(this.replace(x, this.mkNumeral(Rational.of(index)), body));
    return this.mkOr(ors);
  }

  private mkBigOrSymbolicBlast(up: Rational, x: number, body: number) {
    const bound = this.mkLeApp(x, this.mkNumeral(up));
    const bounded = this.mkFlatAnd(bound, body);
    const { zBv, z } = this.mkBoundedVar(up);
    return this.context.blastOr(zBv, this.replace(x, z, bounded));
  }

  // The coefficient of x, when x occurs in exactly one summand of p.
  private isolateX(p: number, x: number, contains: ContainsApp) {
    const manager = this.manager;
    let current = p;
    while (isAppOf(manager, current, OP_ADD)) {
      const withX = manager.getArgs(current).filter((arg) => contains.has(arg));
      if (withX.length !== 1) return undefined;
      current = withX[0];
    }
    if (current === x) return Rational.one;
    if (!isAppOf(manager, current, OP_MUL) || manager.getNumArgs(current) !== 2) return undefined;
    const [first, second] = manager.getArgs(current);
    const firstValue = this.getNumeral(first);
    if (firstValue !== undefined && second === x) return firstValue;
    const secondValue = this.getNumeral(second);
    return secondValue !== undefined && first === x ? secondValue : undefined;
  }

  private solveSingular(index: number, p: number, formula: number) {
    const manager = this.manager;
    const context = this.context;
    const x = context.getVar(index);
    const k = this.isolateX(p, x, context.contains(index));
    if (k === undefined) return false;
    if (manager.isInt(x) && !isOne(k.abs())) return false;
    const sort = manager.sorts[x];
    const e = isOne(k.abs())
      ? k.isNegative()
        ? this.mkApp(OP_ADD, [p, x], sort)
        : this.mkApp(OP_SUB, [x, p], sort)
      : (() => {
          // p = p' + k*x = 0, so x = (p - k*x) / -k.
          const ke = this.mkNumeral(k.neg(), false);
          return this.mkApp(
            OP_DIV,
            [this.mkApp(OP_ADD, [p, this.mkMulApp(ke, x)], sort), ke],
            sort,
          );
        })();
    context.elimVar(index, this.simplify(this.replace(x, e, formula)));
    return true;
  }

  private solveLinear(p: number, formula: number) {
    const manager = this.manager;
    const context = this.context;
    const vars = context.getVars();
    const values = this.getLinear(p, vars);
    if (values === undefined || values.slice(1).every((value) => value.isZero())) return false;
    const solved = solveIntegerEquation(values);
    if (solved === undefined) return false;
    const x = vars[solved.index - 1];
    const sort = manager.sorts[p];
    let p1: number;
    if (solved.isAux) {
      // A fresh variable stands for x, with the coefficient values[index].
      const z = this.pin(manager.mkFreshConst("x", sort));
      this.addVar(z);
      p1 = this.mkMulApp(this.pin(manager.mkNumeralOfSort(values[solved.index], sort)), z);
    } else p1 = this.pin(manager.mkNumeralOfSort(Rational.zero, sort));
    for (let index = 1; index <= vars.length; index++) {
      const k = values[index];
      if (k.isZero() || index === solved.index) continue;
      const term = this.mkMulApp(this.pin(manager.mkNumeralOfSort(k, sort)), vars[index - 1]);
      p1 = this.mkApp(OP_ADD, [p1, term], sort);
    }
    p1 = this.mkApp(OP_ADD, [p1, this.pin(manager.mkNumeralOfSort(values[0], sort))], sort);
    context.elimVar(solved.index - 1, this.simplify(this.replace(x, p1, formula)));
    return true;
  }

  private reduceEquation(p: number, formula: number) {
    if (this.getNumeral(p)?.isZero() === true) return false;
    for (let index = 0; index < this.context.getNumVars(); index++)
      if (this.solveSingular(index, p, formula)) return true;
    return this.solveLinear(p, formula);
  }

  // The constant of p, then the coefficient of each variable, when p is linear in them.
  private getLinear(p: number, vars: readonly number[]) {
    const manager = this.manager;
    if (vars.length === 0) return undefined;
    const values = Array.from({ length: vars.length + 1 }, () => Rational.zero);
    const addToVar = (expr: number, k: Rational) => {
      if (manager.getNumArgs(expr) > 0) return false;
      const index = vars.indexOf(expr);
      if (index === -1) return false;
      values[index + 1] = values[index + 1].add(k);
      return true;
    };
    const todo = [p];
    while (todo.length > 0) {
      const expr = todo.pop() as number;
      if (isAppOf(manager, expr, OP_ADD)) {
        todo.push(...manager.getArgs(expr));
        continue;
      }
      if (isAppOf(manager, expr, OP_MUL) && manager.getNumArgs(expr) === 2) {
        const [first, second] = manager.getArgs(expr);
        const firstValue = this.getNumeral(first);
        if (firstValue !== undefined && addToVar(second, firstValue)) continue;
        const secondValue = this.getNumeral(second);
        if (secondValue !== undefined && addToVar(first, secondValue)) continue;
      }
      // Z3 adds a stale coefficient here, zero or that of an earlier product, instead of one.
      if (addToVar(expr, Rational.one)) continue;
      const value = this.getNumeral(expr);
      if (value === undefined) return undefined;
      values[0] = values[0].add(value);
    }
    return values;
  }
}

// One step of the omega test's equality elimination on a1*x1 + ... + an*xn + a0 = 0, where
// values[0] is a0: it picks the variable of least absolute coefficient, whose coefficient becomes
// -1, or a fresh one's coefficient when it is not a unit.
const solveIntegerEquation = (values: Rational[]) => {
  if (!values.every((value) => value.isInt())) return undefined;
  let gcd = 0n;
  for (const value of values) {
    gcd =
      gcd === 0n
        ? value.num < 0n
          ? -value.num
          : value.num
        : getGcd(value.num < 0n ? -value.num : value.num, gcd);
    if (gcd === 1n) break;
  }
  if (gcd !== 0n && gcd !== 1n)
    values.forEach((value, index) => (values[index] = Rational.of(value.num / gcd)));
  let testGcd = 0n;
  for (let index = 1; testGcd !== 1n && index < values.length; index++) {
    const value = values[index].num < 0n ? -values[index].num : values[index].num;
    if (value !== 0n) testGcd = testGcd === 0n ? value : getGcd(value, testGcd);
  }
  if (testGcd === 0n ? !values[0].isZero() : testGcd !== 1n && values[0].num % testGcd !== 0n)
    return undefined;
  let index = 0;
  let least = 0n;
  for (let candidate = 1; candidate < values.length; candidate++) {
    const value = values[candidate].num < 0n ? -values[candidate].num : values[candidate].num;
    if (least === 0n || (value !== 0n && value < least)) {
      index = candidate;
      least = value;
    }
  }
  if (least === 0n) return { index, isAux: false };
  const negate = () => values.forEach((value, position) => (values[position] = value.neg()));
  if (values[index].num === 1n) negate();
  const isAux = least !== 1n;
  if (isAux) {
    const modulus = least + 1n;
    values.forEach((value, position) => {
      const remainder = getEuclideanMod(value.num, modulus);
      values[position] = Rational.of(2n * remainder > modulus ? remainder - modulus : remainder);
    });
    if (values[index].num === 1n) negate();
    values[index] = Rational.of(modulus);
  }
  return { index, isAux };
};

interface Bound {
  term: number;
  coeff: Rational;
  atom: number;
}

interface Div {
  term: number;
  coeff: Rational;
  divisor: Rational;
  atom: number;
}

interface NestedDiv extends Div {
  z: number;
  zBv: number;
}

class BoundsProc {
  private marked = new Set<number>();
  readonly le: Bound[] = [];
  readonly ge: Bound[] = [];
  readonly lt: Bound[] = [];
  readonly gt: Bound[] = [];
  readonly divs: Div[] = [];
  readonly nestedDivs: NestedDiv[] = [];
  private divZ: { d: Rational; z: number; zBv: number } | undefined;

  constructor(private util: ArithQeUtil) {}

  getBound(contains: ContainsApp, atom: number) {
    const hasBound =
      this.marked.has(atom) ||
      this.getLeBound(contains, atom) ||
      this.getLtBound(contains, atom) ||
      this.getDivides(contains, atom) ||
      this.getNestedDivs(contains, atom);
    if (hasBound) this.marked.add(atom);
    return hasBound;
  }

  get(isStrict: boolean, isLower: boolean) {
    return isStrict ? (isLower ? this.lt : this.gt) : isLower ? this.le : this.ge;
  }

  getDivZ() {
    if (this.divZ !== undefined) return this.divZ;
    if (this.divs.length === 0 && this.nestedDivs.length === 0) return undefined;
    let d = 1n;
    for (const div of [...this.divs, ...this.nestedDivs]) d = getLcm(div.divisor.num, d);
    if (d === 1n || d === -1n) return undefined;
    this.divZ = { d: Rational.of(d), ...this.util.mkBoundedVar(Rational.of(d)) };
    return this.divZ;
  }

  private getNestedDivs(contains: ContainsApp, atom: number) {
    const util = this.util;
    const manager = util.manager;
    const todo = [atom];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (this.marked.has(expr)) continue;
      this.marked.add(expr);
      if (!contains.has(expr)) continue;
      if (contains.x === expr) return false;
      if (isAppOf(manager, expr, OP_MOD)) {
        const k1 = util.getNumeral(manager.getArg(expr, 1));
        const coeff =
          k1 === undefined ? undefined : util.getCoeff(contains, manager.getArg(expr, 0));
        if (k1 !== undefined && coeff !== undefined) {
          this.nestedDivs.push({
            term: coeff.rest,
            coeff: coeff.k,
            divisor: k1,
            atom: expr,
            ...util.mkBoundedVar(k1),
          });
          continue;
        }
      }
      todo.push(...manager.getArgs(expr));
    }
    return true;
  }

  private getLeBound(contains: ContainsApp, atom: number) {
    const util = this.util;
    const p = util.isLe(atom);
    const coeff = p === undefined ? undefined : util.getCoeff(contains, p);
    if (coeff === undefined) return false;
    // k*x + rest <= 0
    let k = coeff.k;
    let rest = coeff.rest;
    if (util.isReal(contains.x)) {
      rest = util.mkDiv(rest, k.abs());
      k = k.isPositive() ? Rational.one : Rational.minusOne;
    }
    (k.isNegative() ? this.le : this.ge).push({ term: rest, coeff: k, atom });
    return true;
  }

  private getLtBound(contains: ContainsApp, atom: number) {
    const util = this.util;
    const manager = util.manager;
    const p = util.isLt(atom);
    let coeff = p === undefined ? undefined : util.getCoeff(contains, p);
    if (coeff === undefined && manager.isNot(atom)) {
      // not (k*x + rest >= 0), that is k*x + rest < 0.
      const negatedP = util.isGe(manager.getArg(atom, 0));
      coeff = negatedP === undefined ? undefined : util.getCoeff(contains, negatedP);
    }
    if (coeff === undefined) return false;
    const rest = util.mkDiv(coeff.rest, coeff.k.abs());
    if (coeff.k.isNegative()) this.lt.push({ term: rest, coeff: Rational.minusOne, atom });
    else this.gt.push({ term: rest, coeff: Rational.one, atom });
    return true;
  }

  private getDivides(contains: ContainsApp, atom: number) {
    const util = this.util;
    const divides = util.isDivides(atom);
    const coeff = divides === undefined ? undefined : util.getCoeff(contains, divides.p);
    if (divides !== undefined && coeff !== undefined) {
      this.divs.push({ term: coeff.rest, divisor: divides.k, coeff: coeff.k, atom });
      return true;
    }
    const notDivides = util.isNotDivides(atom);
    const notCoeff = notDivides === undefined ? undefined : util.getCoeff(contains, notDivides.p);
    if (notDivides === undefined || notCoeff === undefined) return false;
    this.divs.push({
      term: notCoeff.rest,
      divisor: notDivides.k,
      coeff: notCoeff.k,
      atom: notDivides.atom,
    });
    return true;
  }
}

// x is coeff*x' + term after a substitution.
class XSubst {
  term = -1;
  coeff = Rational.one;

  constructor(private util: ArithQeUtil) {}

  mkTerm(c: Rational, t: number) {
    return this.term === -1 ? t : this.util.mkAdd(this.util.mkMul(c, this.term), t);
  }

  mkCoeff(k: Rational) {
    return k.mul(this.coeff);
  }
}

interface BranchFormula {
  result: number;
  vars: number[];
}

export class ArithPlugin implements QeSolverPlugin {
  readonly family = FAMILY_ARITH;
  private util: ArithQeUtil;
  private boundsCache = new Map<string, BoundsProc>();
  private substCache = new Map<string, BranchFormula>();

  constructor(private context: QeSolverContext) {
    this.util = new ArithQeUtil(context);
  }

  release() {
    this.util.release();
  }

  assign(contains: ContainsApp, formula: number, value: bigint) {
    const util = this.util;
    const x = contains.x;
    if (this.getCache(x, formula, value) !== undefined) return;
    util.varsAdded = [];
    const bounds = this.getBounds(x, formula);
    const sizes = this.getBoundSizes(bounds, x);
    const isLower = sizes.isLower;
    const xT = new XSubst(util);
    let result = this.assignNestedDivs(bounds, formula);
    result = this.assignDivs(contains, bounds, xT, result);
    if (value === 0n) {
      // The case where x is unbounded.
      result = this.mkNonBounds(bounds, true, isLower, result);
      result = this.mkNonBounds(bounds, false, isLower, result);
      result = this.mkNonResolve(bounds, true, isLower, result);
      result = this.mkNonResolve(bounds, false, isLower, result);
      this.addCache(x, formula, value, util.simplify(result));
      return;
    }
    // Strict bounds come after the others, and a non-strict bound of a real is two cases: x equals
    // it, or x is below it.
    const position = Number(value) - 1;
    const isStrict = sizes.eSize <= position;
    const isEq = !isStrict && util.isReal(x) && position % 2 === 0;
    const index = isStrict
      ? position - sizes.eSize
      : util.isReal(x)
        ? Math.floor(position / 2)
        : position;
    const bound = bounds.get(isStrict, isLower)[index];
    let t = bound.term;
    let a = bound.coeff;
    const context = { bounds, x, isEq, isStrictCtx: isStrict, isLower, index };
    result = this.mkBounds(context, true, a, t, result);
    result = this.mkBounds(context, false, a, t, result);
    t = xT.mkTerm(a, t);
    a = xT.mkCoeff(a);
    result = this.mkResolve(context, xT, true, a, t, result);
    result = this.mkResolve(context, xT, false, a, t, result);
    this.addCache(x, formula, value, util.simplify(result));
  }

  getNumBranches(contains: ContainsApp, formula: number) {
    if (!this.updateBounds(contains, formula)) return undefined;
    const sizes = this.getBoundSizes(this.getBounds(contains.x, formula), contains.x);
    return BigInt(sizes.tSize + sizes.eSize + 1);
  }

  subst(contains: ContainsApp, value: bigint, formula: number) {
    const result = this.getCache(contains.x, formula, value);
    if (result === undefined) throw new SmtInvariantError("quantifier elimination lost a branch");
    return result;
  }

  solve(conjs: readonly number[], formula: number) {
    return this.util.solve(conjs, formula);
  }

  mkAtom(expr: number, isPositive: boolean) {
    return this.util.mkAtom(expr, isPositive);
  }

  isUninterpreted(app: number) {
    const manager = this.util.manager;
    const op = manager.getOp(app);
    if ([OP_NUM, OP_LE, OP_LT, OP_GE, OP_GT, OP_ADD, OP_SUB, OP_UMINUS].includes(op)) return false;
    if (op === OP_MOD) return this.util.getNumeral(manager.getArg(app, 1)) === undefined;
    if (op === OP_MUL && manager.getNumArgs(app) === 2)
      return manager.getArgs(app).every((arg) => this.util.getNumeral(arg) === undefined);
    return true;
  }

  private getBoundSizes(bounds: BoundsProc, x: number) {
    const factor = this.util.isReal(x) ? 2 : 1;
    const leSize = bounds.le.length * factor;
    const geSize = bounds.ge.length * factor;
    return leSize + bounds.lt.length < geSize + bounds.gt.length
      ? { eSize: leSize, tSize: bounds.lt.length, isLower: true }
      : { eSize: geSize, tSize: bounds.gt.length, isLower: false };
  }

  private addCache(x: number, formula: number, value: bigint, result: number) {
    this.context.pin(x);
    this.context.pin(formula);
    this.substCache.set(`${formula}:${x}:${value}`, {
      result: this.context.pin(result),
      vars: [...this.util.varsAdded],
    });
  }

  private getCache(x: number, formula: number, value: bigint) {
    const cached = this.substCache.get(`${formula}:${x}:${value}`);
    if (cached === undefined) return undefined;
    for (const variable of cached.vars) this.util.addVar(variable, false);
    return cached.result;
  }

  private assignDivs(contains: ContainsApp, bounds: BoundsProc, xT: XSubst, formula: number) {
    const util = this.util;
    const x = contains.x;
    const divZ = bounds.getDivZ();
    if (divZ === undefined) return formula;
    util.addVar(divZ.zBv);
    // z < d, d | (x - z) and (c | ax + t <-> c | az + t) for each divisor.
    const d1 = divZ.d.sub(Rational.one);
    this.context.addConstraint(false, util.mkLeApp(divZ.z, util.mkNumeral(d1)));
    const zLeD1 = util.mkLeRewrite(divZ.z, util.mkNumeral(d1));
    let result = util.mkAnd([formula, zLeD1]);
    this.context.addConstraint(false, util.mkDivides(divZ.d, util.mkSub(x, divZ.z)));
    for (const div of bounds.divs) {
      const newAtom = util.mkDivides(
        div.divisor,
        util.mkAdd(util.mkMul(div.coeff, divZ.z), div.term),
      );
      result = util.replace(div.atom, newAtom, result);
      this.context.addConstraint(false, this.mkNot(div.atom), newAtom);
      this.context.addConstraint(false, this.mkNot(newAtom), div.atom);
    }
    xT.term = divZ.z;
    xT.coeff = divZ.d;
    return result;
  }

  private assignNestedDivs(bounds: BoundsProc, formula: number) {
    const util = this.util;
    const manager = util.manager;
    if (bounds.nestedDivs.length === 0) return formula;
    const divZ = bounds.getDivZ();
    if (divZ === undefined) throw new SmtInvariantError("quantifier elimination found no divisor");
    let result = formula;
    for (const nested of bounds.nestedDivs) {
      // mod_term = arg_0 mod k, with z1 < k and (coeff*x + rest - z1) mod k = 0.
      util.addVar(nested.zBv);
      const k1 = nested.divisor.sub(Rational.one);
      this.context.addConstraint(false, util.mkLeApp(nested.z, util.mkNumeral(k1)));
      const [dividend, divisor] = manager.getArgs(nested.atom);
      const modTerm = util.simplify(
        util.mkApp(OP_MOD, [util.mkSub(dividend, nested.z), divisor], SORT_INT),
      );
      this.context.addConstraint(false, util.pin(manager.mkEq(modTerm, util.mkZero(SORT_INT))));
      result = util.replace(nested.atom, nested.z, result);
      // (coeff*z + rest - z1) mod k = 0
      const scaled = util.mkMulApp(util.mkNumeral(nested.coeff), nested.z);
      const sum = util.mkAdd(scaled, util.mkSub(nested.term, divZ.z));
      const modEq = util.simplify(
        util.pin(manager.mkEq(util.mkApp(OP_MOD, [sum, divisor], SORT_INT), util.mkZero(SORT_INT))),
      );
      result = util.pin(manager.mkAnd([result, modEq]));
    }
    return result;
  }

  private getBounds(x: number, formula: number) {
    return this.boundsCache.get(`${x}:${formula}`) as BoundsProc;
  }

  private mkNot(expr: number) {
    const manager = this.util.manager;
    return manager.isNot(expr) ? manager.getArg(expr, 0) : this.util.pin(manager.mkNot(expr));
  }

  private mkNonBounds(bounds: BoundsProc, isStrict: boolean, isLower: boolean, formula: number) {
    let result = formula;
    for (const bound of bounds.get(isStrict, isLower)) {
      this.context.addConstraint(true, this.mkNot(bound.atom));
      result = this.util.replace(bound.atom, this.util.manager.falseExpr, result);
    }
    return result;
  }

  private mkNonResolve(bounds: BoundsProc, isStrict: boolean, isLower: boolean, formula: number) {
    let result = formula;
    for (const bound of bounds.get(isStrict, !isLower)) {
      this.context.addConstraint(true, bound.atom);
      result = this.util.replace(bound.atom, this.util.manager.trueExpr, result);
    }
    return result;
  }

  private mkBound(
    isStrict: boolean,
    isLower: boolean,
    a: Rational,
    t: number,
    b: Rational,
    s: number,
  ) {
    const util = this.util;
    const result = isLower
      ? util.mkBoundAux(isStrict, b, s, a, t)
      : util.mkBoundAux(isStrict, a, t, b, s);
    return util.simplify(result);
  }

  // The bounds of the same direction as the chosen one at index, which is a*x <= t.
  private mkBounds(
    context: BoundContext,
    isStrict: boolean,
    a: Rational,
    t: number,
    formula: number,
  ) {
    const util = this.util;
    const manager = util.manager;
    const bounds = context.bounds.get(isStrict, context.isLower);
    const isSameStrict = isStrict === context.isStrictCtx;
    const isNonStrictReal = util.isReal(context.x) && !context.isStrictCtx;
    const atom = context.bounds.get(context.isStrictCtx, context.isLower)[context.index].atom;
    let result = formula;
    for (const [index, bound] of bounds.entries()) {
      if (isSameStrict && index === context.index) {
        if (isNonStrictReal) {
          const eq = util.mkEq(a, context.x, t);
          if (context.isEq) this.context.addConstraint(true, eq);
          else {
            this.context.addConstraint(true, this.mkNot(eq));
            this.context.addConstraint(true, bound.atom);
          }
        } else this.context.addConstraint(true, bound.atom);
        result = util.replace(atom, manager.trueExpr, result);
        continue;
      }
      // Substitutions keep the exact value of an atom, which may occur in both polarities.
      const isResultStrict = isNonStrictReal && context.isEq && isStrict;
      const tmp = this.mkBound(isResultStrict, context.isLower, a, t, bound.coeff, bound.term);
      result = util.replace(bound.atom, tmp, result);
      this.context.addConstraint(true, this.mkNot(bound.atom), tmp);
    }
    return result;
  }

  // The bounds of the other direction, resolved against the chosen one.
  private mkResolve(
    context: BoundContext,
    xT: XSubst,
    isStrict: boolean,
    a: Rational,
    t: number,
    formula: number,
  ) {
    const util = this.util;
    const isStrictReal = !context.isEq && util.isReal(context.x) && !context.isStrictCtx;
    const isStrictResolve = isStrict || context.isStrictCtx || isStrictReal;
    let result = formula;
    for (const bound of context.bounds.get(isStrict, !context.isLower)) {
      const s = xT.mkTerm(bound.coeff, bound.term);
      const b = xT.mkCoeff(bound.coeff);
      const tmp = util.mkResolve(context.x, isStrictResolve, a, t, b, s);
      result = util.replace(bound.atom, tmp, result);
      this.context.addConstraint(true, this.mkNot(bound.atom), tmp);
    }
    return result;
  }

  private updateBoundsIn(
    bounds: BoundsProc,
    contains: ContainsApp,
    atoms: Iterable<number>,
    isPositive: boolean,
  ) {
    const manager = this.util.manager;
    for (const atom of atoms) {
      if (!contains.has(atom)) continue;
      const literal = isPositive ? atom : this.util.pin(manager.mkNot(atom));
      if (!bounds.getBound(contains, literal)) return false;
    }
    return true;
  }

  private updateBounds(contains: ContainsApp, formula: number) {
    const key = `${contains.x}:${formula}`;
    if (this.boundsCache.has(key)) return true;
    const bounds = new BoundsProc(this.util);
    if (!this.updateBoundsIn(bounds, contains, this.context.posAtoms(), true)) return false;
    if (!this.updateBoundsIn(bounds, contains, this.context.negAtoms(), false)) return false;
    this.context.pin(contains.x);
    this.context.pin(formula);
    this.boundsCache.set(key, bounds);
    return true;
  }
}

interface BoundContext {
  bounds: BoundsProc;
  x: number;
  isEq: boolean;
  isStrictCtx: boolean;
  isLower: boolean;
  index: number;
}

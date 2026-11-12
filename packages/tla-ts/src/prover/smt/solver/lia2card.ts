// Ported from Z3 (src/tactic/arith/lia2card_tactic.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  OP_ADD,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NOT,
  OP_SUB,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { BoundManager } from "./bound-manager";
import { mkPbEq, mkPbGe, mkPbLe } from "./pb-rewriter";
import { ExprSafeReplace } from "./expr-safe-replace";
import type { Definition, Goal } from "./goal";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

const UINT_LIMIT = 2n ** 32n;

interface PbSum {
  args: number[];
  coeffs: Rational[];
  coeff: Rational;
}

class PbRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private terms: RefVector,
    private maxIteNesting: number,
    private isCompilingEquality: boolean,
  ) {
    super(manager);
  }

  isRewritingPatterns() {
    return false;
  }

  private pin(expr: number) {
    this.terms.push(expr);
    return expr;
  }

  private getNumeral(expr: number): Rational | undefined {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op === OP_UMINUS) return this.getNumeral(manager.getArg(expr, 0))?.neg();
    if (op === OP_TO_REAL) return this.getNumeral(manager.getArg(expr, 0));
    return manager.isNumeral(expr) ? manager.getRationalValue(expr) : undefined;
  }

  private insertArg(value: Rational, conds: number[], sum: PbSum) {
    const manager = this.manager;
    const cond = this.pin(manager.mkAnd(conds));
    if (manager.isTrue(cond)) sum.coeff = sum.coeff.add(value);
    else if (value.isNegative()) {
      sum.args.push(this.pin(manager.mkApp(OP_NOT, [cond], SORT_BOOL)));
      sum.coeffs.push(value.neg());
      sum.coeff = sum.coeff.add(value);
    } else if (value.isPositive()) {
      sum.args.push(cond);
      sum.coeffs.push(value);
    }
  }

  private getSum(
    nesting: number,
    expr: number,
    factor: Rational,
    conds: number[],
    sum: PbSum,
  ): boolean {
    const manager = this.manager;
    manager.limit.checkpoint();
    if (manager.kinds[expr] !== KIND_APP) return false;
    const numeral = this.getNumeral(expr);
    if (nesting > this.maxIteNesting && numeral === undefined) return false;
    if (numeral !== undefined) {
      this.insertArg(factor.mul(numeral), conds, sum);
      return true;
    }
    const op = manager.getOp(expr);
    const args = manager.getArgs(expr);
    if (op === OP_ADD) return args.every((arg) => this.getSum(nesting, arg, factor, conds, sum));
    if (op === OP_SUB && args.length === 2)
      return (
        this.getSum(nesting, args[0], factor, conds, sum) &&
        this.getSum(nesting, args[1], factor.neg(), conds, sum)
      );
    if (op === OP_UMINUS) return this.getSum(nesting, args[0], factor.neg(), conds, sum);
    if (op === OP_MUL && args.length === 2) {
      const first = this.getNumeral(args[0]);
      if (first !== undefined) return this.getSum(nesting, args[1], first.mul(factor), conds, sum);
      const second = this.getNumeral(args[1]);
      if (second !== undefined)
        return this.getSum(nesting, args[0], second.mul(factor), conds, sum);
      return false;
    }
    if (op === OP_TO_REAL) return this.getSum(nesting, args[0], factor, conds, sum);
    if (op !== OP_ITE) return false;
    const isThen = this.getSum(nesting + 1, args[1], factor, [...conds, args[0]], sum);
    const negated = this.pin(manager.mkApp(OP_NOT, [args[0]], SORT_BOOL));
    const isElse = this.getSum(nesting + 1, args[2], factor, [...conds, negated], sum);
    return isThen && isElse;
  }

  getPbSum(term: number) {
    const sum: PbSum = { args: [], coeffs: [], coeff: Rational.zero };
    return this.getSum(0, term, Rational.one, [], sum) ? sum : undefined;
  }

  private getPb(first: number, second: number) {
    const sum: PbSum = { args: [], coeffs: [], coeff: Rational.zero };
    const isPb =
      this.getSum(0, first, Rational.one, [], sum) &&
      this.getSum(0, second, Rational.minusOne, [], sum);
    return isPb ? sum : undefined;
  }

  private mkLe(sum: PbSum) {
    const manager = this.manager;
    const bound = sum.coeff.neg();
    if (sum.args.length === 0) return bound.isNegative() ? manager.falseExpr : manager.trueExpr;
    const isSingleOne = sum.args.length === 1 && sum.coeffs[0].equals(Rational.one);
    if (isSingleOne && bound.compare(Rational.one) >= 0) return manager.trueExpr;
    if (isSingleOne && bound.isZero()) return manager.mkApp(OP_NOT, [sum.args[0]], SORT_BOOL);
    if (bound.isNegative()) return manager.falseExpr;
    return mkPbLe(manager, sum.coeffs, sum.args, bound);
  }

  // Only mkEq uses it, so a single 0-1 term at least zero is its negation, as in Z3.
  private mkGe(sum: PbSum) {
    const manager = this.manager;
    const bound = sum.coeff.neg();
    if (sum.args.length === 0) return bound.isPositive() ? manager.falseExpr : manager.trueExpr;
    const isSingleOne = sum.args.length === 1 && sum.coeffs[0].equals(Rational.one);
    if (isSingleOne && bound.equals(Rational.one)) return sum.args[0];
    if (isSingleOne && bound.isZero()) return manager.mkApp(OP_NOT, [sum.args[0]], SORT_BOOL);
    if (bound.isNegative()) return manager.trueExpr;
    return mkPbGe(manager, sum.coeffs, sum.args, bound);
  }

  private mkEq(sum: PbSum) {
    const manager = this.manager;
    const bound = sum.coeff.neg();
    if (bound.isNegative()) return manager.falseExpr;
    if (!this.isCompilingEquality)
      return manager.mkAnd([this.pin(this.mkGe(sum)), this.pin(this.mkLe(sum))]);
    return mkPbEq(manager, sum.coeffs, sum.args, bound);
  }

  reduceApp(decl: number, args: number[]) {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    const isLe = op === OP_LE || op === OP_GT;
    const isGe = op === OP_GE || op === OP_LT;
    const sum =
      isLe || isGe
        ? this.getPb(isLe ? args[0] : args[1], isLe ? args[1] : args[0])
        : op === OP_EQ
          ? this.getPb(args[0], args[1])
          : undefined;
    if (sum === undefined) return -1;
    const result =
      op === OP_EQ
        ? this.mkEq(sum)
        : op === OP_LE || op === OP_GE
          ? this.mkLe(sum)
          : manager.mkApp(OP_NOT, [this.pin(this.mkLe(sum))], SORT_BOOL);
    manager.incRef(result);
    return result;
  }
}

// The terms of the sum stay in terms.
export const getPbSum = (manager: AstManager, term: number, terms: RefVector) =>
  new PbRewriter(manager, terms, 4, true).getPbSum(term);

export const lia2card = (
  manager: AstManager,
  goal: Goal,
  maxRange: number,
  maxIteNesting: number,
  isCompilingEquality: boolean,
) => {
  if (manager.hasRecDefs) return;
  const terms = new RefVector(manager);
  const pin = (expr: number) => {
    terms.push(expr);
    return expr;
  };
  const bounds = new BoundManager(manager);
  if (!goal.isProofsEnabled) for (const form of goal.forms.items) bounds.add(form);
  const replace = new ExprSafeReplace(manager);
  const definitions: Definition[] = [];
  const axioms: number[] = [];
  for (const variable of bounds.boundedVars) {
    manager.limit.checkpoint();
    const lower = bounds.lowers.get(variable);
    const upper = bounds.uppers.get(variable);
    if (
      manager.sorts[variable] !== SORT_INT ||
      !manager.isUninterpretedConst(variable) ||
      lower === undefined ||
      lower.isStrict ||
      !lower.value.isInt() ||
      lower.value.num < 0n ||
      lower.value.num >= UINT_LIMIT ||
      upper === undefined ||
      upper.isStrict ||
      !upper.value.isInt() ||
      upper.value.num < 0n ||
      upper.value.num >= UINT_LIMIT ||
      (((upper.value.num - lower.value.num) % UINT_LIMIT) + UINT_LIMIT) % UINT_LIMIT >
        BigInt(maxRange)
    )
      continue;
    const low = Number(lower.value.num);
    const high = Number(upper.value.num);
    const decl = manager.decls[variable];
    const summands: number[] = low > 0 ? [pin(manager.mkNumeral(BigInt(low)))] : [];
    let last = -1;
    for (let index = low; index < high; index++) {
      manager.limit.checkpoint();
      const fresh = pin(manager.mkFreshConst(manager.funcDecls[decl].name, SORT_BOOL));
      if (last !== -1) axioms.push(pin(manager.mkApp(OP_IMPLIES, [fresh, last], SORT_BOOL)));
      const one = pin(manager.mkNumeral(1n));
      const zero = pin(manager.mkNumeral(0n));
      summands.push(pin(manager.mkApp(OP_ITE, [fresh, one, zero], SORT_INT)));
      definitions.push({ decl: manager.decls[fresh], def: -1 });
      last = fresh;
    }
    const sum =
      high === 0
        ? pin(manager.mkNumeral(0n))
        : summands.length === 1
          ? summands[0]
          : pin(manager.mkApp(OP_ADD, summands, SORT_INT));
    definitions.push({ decl, def: sum });
    replace.insert(variable, sum);
  }
  const rewriter = new PbRewriter(manager, terms, maxIteNesting, isCompilingEquality);
  for (let index = 0; !goal.isInconsistent && index < goal.forms.size; index++) {
    manager.limit.checkpoint();
    const replaced = replace.apply(goal.forms.items[index]);
    const rewritten = rewriter.rewrite(replaced);
    manager.decRef(replaced);
    goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  for (const axiom of axioms) goal.assert(axiom);
  if (definitions.length > 0) goal.addDefinitions(definitions);
  goal.depth++;
  rewriter.release();
  replace.release();
  terms.reset();
};

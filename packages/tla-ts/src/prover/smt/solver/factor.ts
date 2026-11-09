// Ported from Z3 (src/ast/simplifiers/factor_simplifier.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_OR,
  OP_POWER,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { runSimplifier } from "./dependent-expr-state";
import { Expr2Polynomial } from "./expr2polynomial";
import type { Goal } from "./goal";
import { getLcm, Rational } from "./rational";
import { PolynomialManager } from "./nlsat/polynomial";
import type { Rewrite } from "./rewriter-tpl";
import { RewriterTpl } from "./rewriter-tpl";

const FLIPPED = new Map([
  [OP_LT, OP_GT],
  [OP_LE, OP_GE],
  [OP_GT, OP_LT],
  [OP_GE, OP_LE],
]);

class FactorRewriter extends RewriterTpl {
  readonly expr2poly: Expr2Polynomial;

  constructor(
    manager: AstManager,
    private isSplittingFactors: boolean,
  ) {
    super(manager);
    this.expr2poly = new Expr2Polynomial(manager, new PolynomialManager());
  }

  private mkZeroFor(expr: number) {
    const sort = this.manager.sorts[expr] === SORT_INT ? SORT_INT : SORT_REAL;
    return this.manager.mkNumeralOfSort(Rational.of(0n), sort);
  }

  private mkMul(args: number[]) {
    return args.length === 1
      ? args[0]
      : this.manager.mkApp(OP_MUL, args, this.manager.sorts[args[0]]);
  }

  private factor(op: number, lhs: number, rhs: number): number {
    const manager = this.manager;
    const pm = this.expr2poly.pm;
    const first = this.expr2poly.toPolynomial(lhs);
    const second = this.expr2poly.toPolynomial(rhs);
    const lcm = getLcm(first.denominator, second.denominator);
    const polynomial = pm.addmul(
      lcm / first.denominator,
      first.polynomial,
      -(lcm / second.denominator),
      second.polynomial,
    );
    if (pm.isConst(polynomial)) return -1;
    const factors = pm.factor(polynomial);
    if (factors.factors.length === 1 && factors.degrees[0] === 1) return -1;
    const terms = factors.factors.map((factor) => this.expr2poly.toExpr(factor, true));
    if (op === OP_EQ) {
      if (!this.isSplittingFactors)
        return manager.mkEq(this.mkMul(terms), this.mkZeroFor(terms[terms.length - 1]));
      const eqs = terms.map((term) => manager.mkEq(term, this.mkZeroFor(term)));
      return eqs.length === 1 ? eqs[0] : manager.mkApp(OP_OR, eqs, SORT_BOOL);
    }
    const kind = factors.constant < 0n ? (FLIPPED.get(op) as number) : op;
    if (!this.isSplittingFactors) {
      const args = terms.map((term, index) =>
        factors.degrees[index] % 2 === 0
          ? manager.mkApp(
              OP_POWER,
              [term, manager.mkNumeralOfSort(Rational.of(2n), manager.sorts[term])],
              SORT_REAL,
            )
          : term,
      );
      const product = this.mkMul(args);
      return manager.mkApp(kind, [product, this.mkZeroFor(product)], SORT_BOOL);
    }
    const isStrict = kind === OP_LT || kind === OP_GT;
    const args: number[] = [];
    const oddFactors: number[] = [];
    for (const [index, term] of terms.entries()) {
      if (factors.degrees[index] % 2 !== 0) {
        oddFactors.push(term);
        continue;
      }
      const eq = manager.mkEq(term, this.mkZeroFor(term));
      args.push(isStrict ? manager.mkNot(eq) : eq);
    }
    if (oddFactors.length === 0) {
      if (kind === OP_LT) return manager.falseExpr;
      if (kind === OP_GE) return manager.trueExpr;
    } else {
      const product = this.mkMul(oddFactors);
      args.push(manager.mkApp(kind, [product, this.mkZeroFor(oddFactors[0])], SORT_BOOL));
    }
    if (args.length === 1) return args[0];
    return manager.mkApp(isStrict ? OP_AND : OP_OR, args, SORT_BOOL);
  }

  reduceApp(decl: number, args: number[]): number | Rewrite {
    const manager = this.manager;
    if (args.length !== 2) return -1;
    const funcDecl = manager.funcDecls[decl];
    const isArith = (expr: number) => manager.getFamily(expr) === FAMILY_ARITH;
    const isFactoring =
      (funcDecl.op === OP_EQ &&
        (isArith(args[0]) || isArith(args[1])) &&
        !manager.isBool(args[0])) ||
      (funcDecl.family === FAMILY_ARITH && FLIPPED.has(funcDecl.op));
    if (!isFactoring) return -1;
    const outer = manager.beginTemporaries();
    const result = this.factor(funcDecl.op, args[0], args[1]);
    if (result !== -1) manager.incRef(result);
    manager.endTemporaries(outer);
    return result;
  }
}

export const factor = (manager: AstManager, goal: Goal, isSplittingFactors: boolean) =>
  runSimplifier(goal, false, (state) => {
    const rewriter = new FactorRewriter(manager, isSplittingFactors);
    return {
      reduce: () => {
        let rewritten = -1;
        state.forEachIndex((index) => {
          const form = state.get(index);
          const next = rewriter.rewrite(form);
          if (rewritten !== -1) manager.decRef(rewritten);
          rewritten = next;
          if (rewritten !== form) goal.update(index, rewritten);
        });
        if (rewritten !== -1) manager.decRef(rewritten);
      },
      release: () => {
        rewriter.expr2poly.release();
        rewriter.release();
      },
    };
  });

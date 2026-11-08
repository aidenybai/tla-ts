// Ported from Z3 (src/smt/theory_fpa.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  FAMILY_FPA,
  OP_CONCAT,
  OP_FPA_BV2RM,
  OP_FPA_BVWRAP,
  OP_FPA_FP,
  OP_FPA_TO_FP,
  OP_FPA_TO_IEEE_BV,
  OP_FPA_TO_REAL,
  OP_FPA_TO_SBV,
  OP_FPA_TO_UBV,
  OP_IMPLIES,
  OP_ITE,
  OP_ULEQ,
  SORT_BOOL,
} from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { mkBvApp } from "./bv-decl-plugin";
import type { Context } from "./context";
import type { Enode } from "./enode";
import {
  getFpNumeral,
  getRmNumeral,
  mkFpNumeral,
  mkFpNumeralOfBits,
  mkRmNumeral,
} from "./fpa-decl-plugin";
import { WrappedFpa2BvConverter } from "./fpa2bv-converter";
import { Fpa2BvRewriter } from "./fpa2bv-rewriter";
import type { BoolVar } from "./literal";
import { mkZero } from "./mpf";
import { Rewriter } from "./rewriter";
import { type DependentValue, Theory } from "./theory";

const CONVERTED_OPS = new Set([
  OP_FPA_TO_FP,
  OP_FPA_TO_UBV,
  OP_FPA_TO_SBV,
  OP_FPA_TO_REAL,
  OP_FPA_TO_IEEE_BV,
]);

export class TheoryFpa extends Theory {
  readonly name = "fpa";
  private theoryRewriter: Rewriter;
  private converter: WrappedFpa2BvConverter;
  private rewriter: Fpa2BvRewriter;
  private conversions = new Map<number, number>();
  private trail: number[] = [];
  private trailLimits: number[] = [];

  constructor(context: Context) {
    super(context, FAMILY_FPA);
    const manager = context.manager;
    this.theoryRewriter = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: { ...TACTIC_ARITH_OPTIONS, isArithIneqLhs: true },
      isRewritingPatterns: true,
    });
    const simp = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: TACTIC_ARITH_OPTIONS,
      isRewritingPatterns: false,
    });
    this.converter = new WrappedFpa2BvConverter(manager, simp, this.theoryRewriter);
    this.rewriter = new Fpa2BvRewriter(manager, this.converter);
  }

  private isFloat(expr: number) {
    const sort = this.manager.sorts[expr];
    return this.manager.isFpSort(sort) || this.manager.isRmSort(sort);
  }

  private convert(expr: number) {
    const existing = this.conversions.get(expr);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const result = this.rewriter.convert(this.theoryRewriter, expr);
    this.conversions.set(expr, result);
    manager.incRef(expr);
    this.trail.push(expr);
    return result;
  }

  private mkSideConditions() {
    const manager = this.manager;
    const converter = this.converter;
    const formulas = converter.extraAssertions.items.map((assertion) => {
      const rewritten = this.context.rewriter.rewrite(assertion);
      manager.releaseLater(rewritten);
      return rewritten;
    });
    converter.extraAssertions.reset();
    const result = this.theoryRewriter.rewrite(manager.mkAnd(formulas));
    manager.releaseLater(result);
    return result;
  }

  private rewrite(expr: number) {
    const result = this.theoryRewriter.rewrite(expr);
    this.manager.releaseLater(result);
    return result;
  }

  private assertCnstr(expr: number) {
    const context = this.context;
    if (expr === this.manager.trueExpr) return;
    context.internalize(expr, false);
    const literal = context.getLiteral(expr);
    context.markLiteralAsRelevant(literal);
    context.mkThAxiom([literal]);
  }

  private attachNewThVar(node: Enode) {
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.context.attachThVar(node, this, thVar);
  }

  internalizeAtom(atom: number) {
    const context = this.context;
    const manager = this.manager;
    if (context.isBInternalized(atom)) return true;
    const boolVar = context.mkBoolVar(atom);
    context.setVarTheory(boolVar, this.id);
    for (let index = 0; index < manager.getNumArgs(atom); index++)
      context.internalize(manager.getArg(atom, index), false);
    manager.withTemporaries(
      () => {
        const bvAtom = this.rewriter.convert(this.theoryRewriter, atom);
        manager.releaseLater(bvAtom);
        const withSideConditions = this.rewrite(manager.mkAnd([bvAtom, this.mkSideConditions()]));
        this.assertCnstr(manager.mkEq(atom, withSideConditions));
      },
      () => [],
    );
    return true;
  }

  internalizeTerm(term: number) {
    const context = this.context;
    const manager = this.manager;
    for (let index = 0; index < manager.getNumArgs(term); index++)
      context.internalize(manager.getArg(term, index), false);
    const node = context.getEnode(term) ?? context.mkEnode(term, false, false, true);
    if (this.isAttachedToVar(node)) return true;
    this.attachNewThVar(node);
    if (CONVERTED_OPS.has(manager.getOp(term)))
      manager.withTemporaries(
        () => {
          this.assertCnstr(manager.mkEq(term, this.convert(term)));
          this.assertCnstr(this.mkSideConditions());
        },
        () => [],
      );
    if (!context.relevancy.isEnabled) this.relevantEh(term);
    return true;
  }

  applySortCnstr(node: Enode) {
    const manager = this.manager;
    if (this.isAttachedToVar(node)) return;
    this.attachNewThVar(node);
    const owner = node.owner;
    if (manager.isRmSort(manager.sorts[owner]) && manager.getOp(owner) !== OP_FPA_BV2RM)
      manager.withTemporaries(
        () => {
          const limit = manager.mkBvNumeral(4n, 3);
          this.assertCnstr(mkBvApp(manager, OP_ULEQ, [this.converter.wrap(owner), limit]));
        },
        () => [],
      );
    if (!this.context.relevancy.isEnabled) this.relevantEh(owner);
  }

  newEqEh(first: number, second: number) {
    this.assertEquality(first, second, false);
  }

  newDiseqEh(first: number, second: number) {
    this.assertEquality(first, second, true);
  }

  private assertEquality(first: number, second: number, isNegated: boolean) {
    const manager = this.manager;
    const firstExpr = this.getExpr(first);
    const secondExpr = this.getExpr(second);
    if (manager.getOp(firstExpr) === OP_FPA_BVWRAP || manager.getOp(secondExpr) === OP_FPA_BVWRAP)
      return;
    manager.withTemporaries(
      () => {
        const firstConverted = this.convert(firstExpr);
        const secondConverted = this.convert(secondExpr);
        const isFloatPair = this.isFloat(firstExpr) && this.isFloat(secondExpr);
        const eq = isFloatPair
          ? this.converter.mkEq(firstConverted, secondConverted)
          : manager.mkEq(firstConverted, secondConverted);
        const condition = this.rewrite(isNegated ? manager.mkNot(eq) : eq);
        const exprEq = manager.mkEq(firstExpr, secondExpr);
        this.assertCnstr(manager.mkEq(isNegated ? manager.mkNot(exprEq) : exprEq, condition));
        this.assertCnstr(this.mkSideConditions());
      },
      () => [],
    );
  }

  override assignEh(boolVar: BoolVar, isTrue: boolean) {
    const manager = this.manager;
    const expr = this.context.boolVar2Expr[boolVar];
    manager.withTemporaries(
      () => {
        const converted = manager.mkAnd([this.convert(expr), this.mkSideConditions()]);
        const constraint = isTrue
          ? manager.mkApp(OP_IMPLIES, [expr, converted], SORT_BOOL)
          : manager.mkApp(OP_IMPLIES, [converted, expr], SORT_BOOL);
        this.assertCnstr(this.rewrite(constraint));
      },
      () => [],
    );
  }

  override relevantEh(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (!this.isFloat(expr)) {
      if (manager.getFamily(expr) === FAMILY_FPA && CONVERTED_OPS.has(op))
        manager.withTemporaries(
          () => {
            this.assertCnstr(manager.mkEq(expr, this.convert(expr)));
            this.assertCnstr(this.mkSideConditions());
          },
          () => [],
        );
      return;
    }
    if (op === OP_FPA_FP) return;
    manager.withTemporaries(
      () => this.assertValueConstraints(expr),
      () => [],
    );
  }

  private assertValueConstraints(expr: number) {
    const manager = this.manager;
    const converter = this.converter;
    const wrapped = converter.wrap(expr);
    const rm = getRmNumeral(manager, expr);
    if (rm !== undefined) {
      this.assertCnstr(manager.mkEq(wrapped, manager.mkBvNumeral(BigInt(rm), 3)));
      return;
    }
    if (getFpNumeral(manager, expr) !== undefined) {
      const value = this.convert(expr);
      const concatenation = mkBvApp(manager, OP_CONCAT, converter.splitFp(value));
      this.assertCnstr(manager.mkEq(wrapped, concatenation));
      this.assertCnstr(this.mkSideConditions());
      this.assertCnstr(manager.mkEq(expr, value));
      return;
    }
    this.assertCnstr(manager.mkEq(converter.unwrap(wrapped, manager.sorts[expr]), expr));
    if (manager.getFamily(expr) === FAMILY_FPA) return;
    const converted = this.convert(expr);
    if (manager.getOp(converted) !== OP_FPA_FP) return;
    const [, exp, sig] = converter.splitFp(converted);
    this.assertCnstr(
      manager.mkEq(wrapped, mkBvApp(manager, OP_CONCAT, converter.splitFp(converted))),
    );
    this.assertCnstr(this.mkSideConditions());
    const ebits = manager.getBvSize(manager.sorts[exp]);
    const sbits = manager.getBvSize(manager.sorts[sig]);
    const topExp = manager.mkBvNumeral((1n << BigInt(ebits)) - 1n, ebits);
    const sigZero = manager.mkBvNumeral(0n, sbits);
    const expIsAllOnes = manager.mkEq(exp, topExp);
    const sigIsZero = manager.mkEq(sig, sigZero);
    const sigIsNonzero = manager.mkNot(sigIsZero);
    const isNan = manager.mkAnd([expIsAllOnes, sigIsNonzero]);
    const canonicalSgn = manager.mkBvNumeral(0n, 1);
    const canonicalSig = manager.mkBvNumeral(1n, sbits);
    const canonicalNan = mkBvApp(manager, OP_CONCAT, [canonicalSgn, topExp, canonicalSig]);
    this.assertCnstr(
      manager.mkApp(OP_IMPLIES, [isNan, manager.mkEq(wrapped, canonicalNan)], SORT_BOOL),
    );
  }

  override pushScopeEh() {
    super.pushScopeEh();
    this.trailLimits.push(this.trail.length);
  }

  override popScopeEh(numScopes: number) {
    const manager = this.manager;
    const newLevel = this.trailLimits.length - numScopes;
    const limit = this.trailLimits[newLevel];
    for (let index = this.trail.length - 1; index >= limit; index--) {
      const expr = this.trail[index];
      const converted = this.conversions.get(expr);
      this.conversions.delete(expr);
      if (converted !== undefined) manager.decRef(converted);
      manager.decRef(expr);
    }
    this.trail.length = limit;
    this.trailLimits.length = newLevel;
    this.rewriter.reset();
    super.popScopeEh(numScopes);
  }

  private getIteValue(expr: number) {
    const context = this.context;
    const manager = this.manager;
    let current = expr;
    while (manager.getOp(current) === OP_ITE && context.isEInternalized(current)) {
      const root = context.getEnode(current)?.root;
      const thenExpr = manager.getArg(current, 1);
      const elseExpr = manager.getArg(current, 2);
      if (context.getEnode(thenExpr)?.root === root) current = thenExpr;
      else if (context.getEnode(elseExpr)?.root === root) current = elseExpr;
      else break;
    }
    return current;
  }

  override mkValue(node: Enode): number | DependentValue | undefined {
    const context = this.context;
    const manager = this.manager;
    const owner = this.getIteValue(node.owner);
    const sort = manager.sorts[owner];
    if (getRmNumeral(manager, owner) !== undefined || getFpNumeral(manager, owner) !== undefined)
      return owner;
    const getEnodes = (exprs: number[]) =>
      exprs.map((expr) => {
        const argNode = context.getEnode(expr);
        if (argNode === undefined) throw new SmtInvariantError("the term was not internalized");
        return argNode;
      });
    const op = manager.getOp(owner);
    if (op === OP_FPA_FP)
      return {
        dependencies: getEnodes(this.converter.splitFp(owner)),
        mkValue: (values) => this.mkFpValue(sort, values),
      };
    if (op === OP_FPA_BV2RM)
      return {
        dependencies: getEnodes([manager.getArg(owner, 0)]),
        mkValue: (values) => this.mkRmValue(values[0]),
      };
    const wrapped = this.converter.wrap(owner);
    if (context.isEInternalized(wrapped))
      return {
        dependencies: getEnodes([wrapped]),
        mkValue: (values) =>
          manager.isRmSort(sort) ? this.mkRmValue(values[0]) : this.mkFpValue(sort, values),
      };
    return mkFpNumeral(manager, mkZero(manager.getEbits(sort), manager.getSbits(sort), false));
  }

  private mkRmValue(value: number) {
    const rm = Number(this.manager.getBvNumeralValue(value));
    return mkRmNumeral(this.manager, rm <= 3 ? rm : 4);
  }

  private mkFpValue(sort: number, values: number[]) {
    const manager = this.manager;
    const sbits = BigInt(manager.getSbits(sort));
    const parts = values.map((value) => manager.getBvNumeralValue(value));
    const bits =
      parts.length === 1
        ? parts[0]
        : (parts[0] << (BigInt(manager.getEbits(sort)) + sbits - 1n)) |
          (parts[1] << (sbits - 1n)) |
          parts[2];
    return mkFpNumeralOfBits(manager, sort, bits);
  }
}

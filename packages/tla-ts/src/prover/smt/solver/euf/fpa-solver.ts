// Ported from Z3 (src/sat/smt/fpa_solver.h, src/sat/smt/fpa_solver.cpp), MIT license, see
// z3-license.txt.
import {
  type AstManager,
  OP_CONCAT,
  OP_FPA_BV2RM,
  OP_FPA_BVWRAP,
  OP_FPA_FP,
  OP_FPA_TO_FP,
  OP_FPA_TO_IEEE_BV,
  OP_FPA_TO_REAL,
  OP_FPA_TO_SBV,
  OP_FPA_TO_UBV,
  OP_ITE,
  OP_ULEQ,
} from "../ast";
import { mkBvApp } from "../bv-decl-plugin";
import { getFpNumeral, getRmNumeral, mkRmNumeral } from "../fpa-decl-plugin";
import type { WrappedFpa2BvConverter } from "../fpa2bv-converter";
import type { Fpa2BvRewriter } from "../fpa2bv-rewriter";
import type { ProtoModel } from "../proto-model";
import type { Rewriter } from "../rewriter";
import { NULL_LITERAL } from "../sat/clause";
import { CR_CONTINUE, CR_DONE } from "../sat/solver";
import { finalizeFpaModel, mkFpaConversion, mkFpValue, mkFpZero, mkRmValue } from "../theory-fpa";
import { type Enode, NULL_THEORY_VAR, type ThEq } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { addDependency, type Dependencies, ThSolver } from "./th-solver";

const BV_RM_TO_ZERO = 4;

const CONVERTED_OPS: ReadonlySet<number> = new Set([
  OP_FPA_TO_FP,
  OP_FPA_TO_UBV,
  OP_FPA_TO_SBV,
  OP_FPA_TO_REAL,
  OP_FPA_TO_IEEE_BV,
]);

interface FpaNode {
  readonly node: Enode;
  readonly isSign: boolean;
  readonly isRoot: boolean;
}

export class FpaSolver extends ThSolver {
  private theoryRewriter: Rewriter;
  private converter: WrappedFpa2BvConverter;
  private rewriter: Fpa2BvRewriter;
  private conversions = new Map<number, number>();
  private nodes: FpaNode[] = [];
  private nodesQhead = 0;

  constructor(ctx: EufSolver, id: number) {
    super(ctx, "fpa", id);
    const conversion = mkFpaConversion(ctx.manager);
    this.theoryRewriter = conversion.theoryRewriter;
    this.converter = conversion.converter;
    this.rewriter = conversion.rewriter;
  }

  private isFloat(expr: number) {
    return this.manager.isFpSort(this.manager.sorts[expr]);
  }

  private isRm(expr: number) {
    return this.manager.isRmSort(this.manager.sorts[expr]);
  }

  private isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  private convert(expr: number) {
    const existing = this.conversions.get(expr);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const result = this.rewriter.convert(this.theoryRewriter, expr);
    this.conversions.set(expr, result);
    manager.incRef(expr);
    this.ctx.trail.push(() => {
      this.conversions.delete(expr);
      manager.decRef(result);
      manager.decRef(expr);
    });
    return result;
  }

  private mkSideConditions() {
    const manager = this.manager;
    const extraAssertions = this.converter.extraAssertions;
    const conds = extraAssertions.items.map((assertion) => {
      const rewritten = this.ctx.rewrite(assertion);
      manager.releaseLater(rewritten);
      const simplified = this.theoryRewriter.rewrite(rewritten);
      manager.releaseLater(simplified);
      return this.mkLiteral(simplified);
    });
    extraAssertions.reset();
    return conds;
  }

  private addUnits(lits: readonly number[]) {
    for (const lit of lits) this.addUnit(lit);
  }

  override check() {
    return this.unitPropagate() ? CR_CONTINUE : CR_DONE;
  }

  private attachNewThVar(node: Enode) {
    this.ctx.egraph.addThVar(node, this.mkVar(node), this.id);
  }

  internalize(expr: number, isSign: boolean, isRoot: boolean) {
    if (!this.visitRec(expr, isSign, isRoot)) return NULL_LITERAL;
    const lit = this.expr2literal(expr);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.visitRec(expr, false, false);
  }

  protected override visited(expr: number) {
    const node = this.expr2enode(expr);
    return node !== undefined && node.getThVar(this.id) !== NULL_THEORY_VAR;
  }

  protected override visit(expr: number) {
    if (this.visited(expr)) return true;
    const manager = this.manager;
    if (!manager.isApp(expr) || manager.getFamily(expr) !== this.id) {
      this.ctx.internalizeTerm(expr);
      return true;
    }
    this.stack.push({ expr, index: 0 });
    return false;
  }

  protected override postVisit(expr: number, isSign: boolean, isRoot: boolean) {
    const node = this.expr2enode(expr) ?? this.mkEnode(expr);
    this.attachNewThVar(node);
    this.nodes.push({ node, isSign, isRoot });
    this.ctx.trail.push(() => this.nodes.pop());
    return true;
  }

  override applySortCnstr(node: Enode) {
    const manager = this.manager;
    if (this.isAttachedToVar(node)) return;
    const owner = node.owner;
    if (this.isOp(owner, OP_ITE)) return;
    this.attachNewThVar(node);
    manager.withTemporaries(
      () => {
        if (this.isRm(owner) && !this.isOp(owner, OP_FPA_BV2RM)) {
          const limit = manager.mkBvNumeral(4n, 3);
          this.addUnit(
            this.mkLiteral(mkBvApp(manager, OP_ULEQ, [this.converter.wrap(owner), limit])),
          );
        }
        this.activate(owner);
      },
      () => [],
    );
  }

  override unitPropagate() {
    if (this.nodes.length <= this.nodesQhead) return false;
    const qhead = this.nodesQhead;
    this.ctx.trail.push(() => {
      this.nodesQhead = qhead;
    });
    for (; this.nodesQhead < this.nodes.length; this.nodesQhead++)
      this.manager.withTemporaries(
        () => this.propagateNode(this.nodes[this.nodesQhead]),
        () => [],
      );
    return true;
  }

  private propagateNode(item: FpaNode) {
    const manager = this.manager;
    const ctx = this.ctx;
    const expr = item.node.owner;
    if (manager.isBool(expr)) {
      const atom = ctx.attachLit(2 * ctx.si.addBoolVar(expr), expr);
      const converted = this.rewriter.convert(this.theoryRewriter, expr);
      manager.releaseLater(converted);
      const bvAtom = this.mkLiteral(converted);
      const conds = this.mkSideConditions();
      conds.push(bvAtom);
      this.addEquivAnd(atom, conds);
      if (item.isRoot) this.addUnit(item.isSign ? atom ^ 1 : atom);
    } else if (CONVERTED_OPS.has(manager.getOp(expr))) {
      this.addUnit(this.eqInternalize(expr, this.convert(expr)));
      this.addUnits(this.mkSideConditions());
    }
    this.activate(expr);
  }

  private activate(expr: number) {
    const manager = this.manager;
    if (this.isOp(expr, OP_ITE)) return;
    if ((!this.isFloat(expr) && !this.isRm(expr)) || this.isOp(expr, OP_FPA_FP)) return;
    const converter = this.converter;
    const wrapped = converter.wrap(expr);
    const rm = getRmNumeral(manager, expr);
    if (rm !== undefined) {
      this.addUnit(this.eqInternalize(wrapped, manager.mkBvNumeral(BigInt(rm), 3)));
      return;
    }
    if (getFpNumeral(manager, expr) !== undefined) {
      const value = this.convert(expr);
      const concatenation = mkBvApp(manager, OP_CONCAT, converter.splitFp(value));
      this.addUnit(this.eqInternalize(wrapped, concatenation));
      this.addUnit(this.eqInternalize(value, expr));
      this.addUnits(this.mkSideConditions());
      return;
    }
    this.addUnit(this.eqInternalize(converter.unwrap(wrapped, manager.sorts[expr]), expr));
  }

  private ensureEqualityRelation(first: number, second: number) {
    const manager = this.manager;
    const firstExpr = this.var2expr(first);
    const secondExpr = this.var2expr(second);
    if (this.isOp(firstExpr, OP_FPA_BVWRAP) || this.isOp(secondExpr, OP_FPA_BVWRAP)) return;
    manager.withTemporaries(
      () => {
        const firstConverted = this.convert(firstExpr);
        const secondConverted = this.convert(secondExpr);
        const isFloatPair =
          (this.isFloat(firstExpr) && this.isFloat(secondExpr)) ||
          (this.isRm(firstExpr) && this.isRm(secondExpr));
        const eq = isFloatPair
          ? this.converter.mkEq(firstConverted, secondConverted)
          : manager.mkEq(firstConverted, secondConverted);
        const condition = this.theoryRewriter.rewrite(eq);
        manager.releaseLater(condition);
        this.addEquiv(this.eqInternalize(firstExpr, secondExpr), this.mkLiteral(condition));
        this.addUnits(this.mkSideConditions());
      },
      () => [],
    );
  }

  override newEqEh(eq: ThEq) {
    this.ensureEqualityRelation(eq.v1, eq.v2);
  }

  override useDiseqs() {
    return true;
  }

  override newDiseqEh(eq: ThEq) {
    this.ensureEqualityRelation(eq.v1, eq.v2);
  }

  override asserted(lit: number) {
    this.manager.withTemporaries(
      () => {
        const converted = this.mkLiteral(this.convert(this.boolVar2expr(lit >> 1) as number));
        const conds = this.mkSideConditions();
        conds.push(converted);
        if ((lit & 1) === 1) {
          for (const cond of conds) this.addClause([lit, cond]);
          return;
        }
        this.addClause([...conds.map((cond) => cond ^ 1), lit]);
      },
      () => [],
    );
  }

  private getWrappedNode(expr: number) {
    return this.manager.withTemporaries(
      () => this.expr2enode(this.converter.wrap(expr)),
      () => [],
    );
  }

  override addValue(node: Enode, _model: ProtoModel, values: (number | undefined)[]) {
    const manager = this.manager;
    const expr = node.owner;
    const sort = manager.sorts[expr];
    const getValue = (arg: Enode) => values[arg.root.owner] as number;
    const getWrappedValue = () => {
      const wrapped = this.getWrappedNode(expr);
      return wrapped === undefined ? undefined : getValue(wrapped);
    };
    const value =
      getRmNumeral(manager, expr) !== undefined || getFpNumeral(manager, expr) !== undefined
        ? expr
        : this.isOp(expr, OP_FPA_FP)
          ? mkFpValue(manager, sort, node.args.map(getValue))
          : this.isOp(expr, OP_FPA_BV2RM)
            ? mkRmValue(manager, getValue(node.getArg(0)))
            : this.isRm(expr)
              ? mkRmOrZero(manager, getWrappedValue())
              : this.isFloat(expr)
                ? mkFpOrZero(manager, sort, getWrappedValue())
                : mkFpZero(manager, sort);
    values[node.root.owner] = value;
  }

  override addDep(node: Enode, deps: Dependencies) {
    const expr = node.owner;
    if (this.isOp(expr, OP_FPA_FP)) {
      for (const arg of node.args) addDependency(deps, node, arg);
      return true;
    }
    if (this.isOp(expr, OP_FPA_BV2RM)) {
      addDependency(deps, node, node.getArg(0));
      return true;
    }
    if (!this.isRm(expr) && !this.isFloat(expr)) return false;
    const wrapped = this.getWrappedNode(expr);
    if (wrapped !== undefined) addDependency(deps, node, wrapped);
    return wrapped !== undefined;
  }

  override finalizeModel(model: ProtoModel) {
    finalizeFpaModel(this.manager, this.converter, model);
  }
}

const mkRmOrZero = (manager: AstManager, value: number | undefined) =>
  value === undefined ? mkRmNumeral(manager, BV_RM_TO_ZERO) : mkRmValue(manager, value);

const mkFpOrZero = (manager: AstManager, sort: number, value: number | undefined) =>
  value === undefined ? mkFpZero(manager, sort) : mkFpValue(manager, sort, [value]);

// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp), MIT
// license, see z3-license.txt.
import { ArrayRewriter } from "./array-rewriter";
import { mkDatatypeAppCore, mkDatatypeEqCore } from "./datatype-rewriter";
import { ArithRewriter, KERNEL_ARITH_OPTIONS, TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { type BvRewriterOptions, BvRewriter, DEFAULT_BV_OPTIONS } from "./bv-rewriter";
import type { ArithRewriterOptions } from "./poly-rewriter";
import { isAstLess } from "./ast-lt";
import { Der } from "./der";
import { mkFpaAppCore, mkFpaEqCore } from "./fpa-rewriter";
import { SeqRewriter } from "./seq-rewriter";
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_CHAR,
  FAMILY_DATATYPE,
  FAMILY_FPA,
  FAMILY_SEQ,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_BADD,
  OP_BAND,
  OP_BOR,
  OP_BXOR,
  OP_DISTINCT,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_IS_INT,
  OP_POWER,
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UBV2INT,
  OP_UMINUS,
  OP_UNINTERPRETED,
  OP_XOR,
  SORT_BOOL,
  isArithSort,
} from "./ast";
import { getRewriteDepth, type Rewrite, RewriterTpl } from "./rewriter-tpl";
import { sortByKey } from "./sort";
import { UnusedVarsEliminator } from "./var-subst";

export interface RewriterOptions {
  // Replaces (and a b) with (not (or (not a) (not b))), as Z3's asserted_formulas does after NNF.
  readonly isEliminatingAnd: boolean;
  readonly arith: ArithRewriterOptions;
  readonly isRewritingPatterns: boolean;
  readonly isPullingCheapIte?: boolean;
  readonly isKeepingDistinct?: boolean;
  readonly blastDistinctThreshold?: number;
  readonly bv?: BvRewriterOptions;
  readonly isFlatAndOr?: boolean;
  readonly localCtxLimit?: number;
  readonly isCoalescingChars?: boolean;
}

export const KERNEL_REWRITER_OPTIONS: RewriterOptions = {
  isEliminatingAnd: false,
  arith: KERNEL_ARITH_OPTIONS,
  isRewritingPatterns: true,
};

export const TACTIC_REWRITER_OPTIONS: RewriterOptions = {
  isEliminatingAnd: false,
  arith: TACTIC_ARITH_OPTIONS,
  isRewritingPatterns: false,
};

interface ReduceFrame {
  expr: number;
  depth: number;
  childIndex: number;
  spos: number;
}

export class Rewriter extends RewriterTpl {
  private arith: ArithRewriter;
  private bv: BvRewriter;
  private array: ArrayRewriter;
  private seq: SeqRewriter;
  private substitution = new Map<number, number>();
  private unusedVarsEliminator: UnusedVarsEliminator;
  private der: Der;
  // try_ite_value writes the result of reduce_app, which is the m_r of the rewriter that applies
  // this one, as it goes: the first write releases what m_r held.
  releaseResult = () => this.setLastResult(-1);
  private localCtxCost = 0;

  constructor(
    manager: AstManager,
    private options: RewriterOptions,
    private isNestedDer = false,
  ) {
    super(manager);
    this.arith = new ArithRewriter(manager, options.arith);
    const bvOptions = options.bv ?? { ...DEFAULT_BV_OPTIONS, isHiDiv0: manager.isHiDiv0 };
    this.bv = new BvRewriter(manager, options.arith, bvOptions, {
      mkEq: (left, right) => this.mkEq(left, right),
      mkIte: (condition, thenExpr, elseExpr) => {
        const result = this.mkIte(condition, thenExpr, elseExpr);
        return typeof result === "number" ? result : result.expr;
      },
    });
    this.array = new ArrayRewriter(manager);
    this.seq = new SeqRewriter(manager, options.isCoalescingChars ?? true);
    this.unusedVarsEliminator = new UnusedVarsEliminator(manager);
    this.der = new Der(manager);
  }

  // ~imp: the members of th_rewriter_cfg go before the caches of rewriter_tpl.
  release() {
    this.unusedVarsEliminator.release();
    this.der.release();
    super.release();
  }

  // Like rewriter_tpl, it keeps its frames on an explicit stack, so a deep term or a long chain
  // of rewrites cannot overflow the call stack.
  private reduceTo(expr: number, depth: number): number {
    const manager = this.manager;
    const frames: ReduceFrame[] = [];
    const results: number[] = [];
    const visit = (term: number, termDepth: number) => {
      if (termDepth === 0 || manager.kinds[term] !== KIND_APP || manager.getNumArgs(term) === 0)
        results.push(term);
      else frames.push({ expr: term, depth: termDepth - 1, childIndex: 0, spos: results.length });
    };
    visit(expr, depth);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (frame.childIndex < manager.getNumArgs(frame.expr)) {
        visit(manager.getArg(frame.expr, frame.childIndex++), frame.depth);
        continue;
      }
      frames.pop();
      const decl = manager.decls[frame.expr];
      const newArgs = results.splice(frame.spos);
      const reduced = this.reduceAppTop(decl, newArgs, manager.sorts[frame.expr]);
      if (reduced === -1) results.push(manager.mkApp(decl, newArgs, manager.sorts[frame.expr]));
      else if (typeof reduced === "number") results.push(reduced);
      else visit(reduced.expr, getRewriteDepth(reduced));
    }
    return results[0];
  }

  // The caller resets the rewriter.
  setEliminatingAnd(isEliminatingAnd: boolean) {
    this.options = { ...this.options, isEliminatingAnd };
  }

  // The caller may extend the substitution between rewrites without a reset.
  setSubstitution(substitution: Map<number, number>) {
    this.substitution = substitution;
    this.reset();
  }

  getSubst(expr: number) {
    return this.substitution.size === 0 ? undefined : this.substitution.get(expr);
  }

  isFlatAssoc(decl: number) {
    const op = this.manager.funcDecls[decl].op;
    return (
      op === OP_AND ||
      op === OP_OR ||
      op === OP_ADD ||
      op === OP_BADD ||
      op === OP_BOR ||
      op === OP_BAND ||
      op === OP_BXOR
    );
  }

  isRewritingPatterns() {
    return this.options.isRewritingPatterns;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    // An uninterpreted application only reduces by pull_ite, which needs two arguments.
    if (
      manager.funcDecls[decl].op === OP_UNINTERPRETED &&
      (args.length !== 2 || this.options.isPullingCheapIte !== true)
    )
      return -1;
    const outer = manager.beginTemporaries();
    const result = this.reduceAppTop(decl, args, sort);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    return this.manager.withTemporaries(() => this.reduceQuantifierCore(expr, body, patterns));
  }

  private reduceQuantifierCore(expr: number, body: number, newPatterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const isNegated = manager.isNot(body);
    const junction = isNegated ? manager.getArg(body, 0) : body;
    if (
      manager.getOp(junction) === (data.isForall !== isNegated ? OP_AND : OP_OR) &&
      manager.someArg(junction, (arg) => {
        const atom = manager.isNot(arg) ? manager.getArg(arg, 0) : arg;
        return manager.kinds[atom] === KIND_VAR && manager.values[atom] < data.sorts.length;
      })
    )
      return data.isForall ? manager.falseExpr : manager.trueExpr;
    const nested =
      manager.kinds[body] === KIND_QUANTIFIER ? manager.getQuantifier(body) : undefined;
    const patterns = newPatterns.filter((pattern, index) => newPatterns.indexOf(pattern) === index);
    const merged =
      nested !== undefined &&
      nested.isForall === data.isForall &&
      data.patterns.length + data.noPatterns.length === 0 &&
      nested.patterns.length + nested.noPatterns.length === 0
        ? manager.mkQuantifier({
            ...data,
            sorts: [...data.sorts, ...nested.sorts],
            names: [...data.names, ...nested.names],
            body: nested.body,
            patterns: [],
            weight: Math.min(data.weight, nested.weight),
          })
        : manager.mkQuantifier({
            ...data,
            body,
            patterns: this.substitutePatterns(patterns),
            noPatterns: data.noPatterns.filter(
              (noPattern, index) => data.noPatterns.indexOf(noPattern) === index,
            ),
          });
    const reduced = this.unusedVarsEliminator.apply(merged);
    manager.releaseLater(reduced);
    if (
      manager.kinds[reduced] !== KIND_QUANTIFIER ||
      manager.getQuantifier(reduced).patterns.length > 0
    )
      return reduced;
    const eliminated = this.der.apply(reduced);
    if (eliminated === reduced || this.isNestedDer) return eliminated;
    const nestedRewriter = new Rewriter(manager, this.options, true);
    const rewritten = nestedRewriter.rewrite(eliminated);
    nestedRewriter.release();
    manager.releaseLater(rewritten);
    return rewritten;
  }

  // th_rewriter_cfg::apply_subst: the substitution replaces terms in the patterns without rewriting
  // them, like expr_safe_replace.
  private substitutePatterns(patterns: number[]) {
    const manager = this.manager;
    if (this.substitution.size === 0) return patterns;
    const cache = new Map<number, number>();
    const replace = (expr: number): number => {
      const replacement = this.substitution.get(expr);
      if (replacement !== undefined) return replacement;
      if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) return expr;
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const result = manager.mkApp(
        manager.decls[expr],
        manager.mapArgs(expr, replace),
        manager.sorts[expr],
      );
      cache.set(expr, result);
      return result;
    };
    return patterns.map((pattern) => manager.mkPattern(manager.mapArgs(pattern, replace)));
  }

  // th_rewriter::mk_app: one reduction, without rewriting what it returns.
  mkApp(decl: number, args: number[], sort: number) {
    const reduced = this.reduceAppTop(decl, args, sort);
    return reduced === -1
      ? this.manager.mkApp(decl, args, sort)
      : typeof reduced === "number"
        ? reduced
        : reduced.expr;
  }

  mkAppCore(decl: number, args: number[], sort: number): number {
    const reduced = this.reduceAppTop(decl, args, sort);
    return reduced === -1
      ? this.manager.mkApp(decl, args, sort)
      : typeof reduced === "number"
        ? reduced
        : this.reduceTo(reduced.expr, getRewriteDepth(reduced));
  }

  // -1 is BR_FAILED.
  private reduceAppTop(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const reduced = this.reduceAppCore(decl, args);
    if (typeof reduced !== "number" || this.options.isPullingCheapIte !== true) return reduced;
    if (reduced === -1)
      return (args.length === 2 ? this.pullIte(decl, args[0], args[1], sort) : undefined) ?? -1;
    return manager.kinds[reduced] === KIND_APP && manager.getNumArgs(reduced) === 2
      ? (this.pullIte(
          manager.decls[reduced],
          manager.getArg(reduced, 0),
          manager.getArg(reduced, 1),
          manager.sorts[reduced],
        ) ?? reduced)
      : reduced;
  }

  private pullIte(decl: number, first: number, second: number, sort: number): Rewrite | undefined {
    const manager = this.manager;
    if (sort === SORT_BOOL && manager.sorts[first] !== SORT_BOOL) {
      if (this.isIte(first)) {
        if (manager.isUniqueValue(second) && manager.getRefCount(first) === 1)
          return this.pullIteCore(decl, first, second, sort, false);
        if (this.isIte(second) && manager.getArg(first, 0) === manager.getArg(second, 0)) {
          const branches = [1, 2].map((index) =>
            manager.mkApp(
              decl,
              [manager.getArg(first, index), manager.getArg(second, index)],
              sort,
            ),
          );
          return {
            expr: manager.mkApp(OP_ITE, [manager.getArg(first, 0), ...branches], SORT_BOOL),
            depth: 2,
          };
        }
      }
      if (this.isIte(second) && manager.isUniqueValue(first) && manager.getRefCount(second) === 1)
        return this.pullIteCore(decl, second, first, sort, true);
    }
    const family = manager.funcDecls[decl].family;
    if (family !== FAMILY_BASIC && family !== FAMILY_ARITH && family !== FAMILY_BV)
      return undefined;
    if (manager.isUniqueValue(first) && this.isIteValueTree(second))
      return this.pullIteCore(decl, second, first, sort, true);
    if (manager.isUniqueValue(second) && this.isIteValueTree(first))
      return this.pullIteCore(decl, first, second, sort, false);
    return undefined;
  }

  private pullIteCore(
    decl: number,
    ite: number,
    value: number,
    sort: number,
    isSwapped: boolean,
  ): Rewrite {
    const manager = this.manager;
    const branches = [manager.getArg(ite, 1), manager.getArg(ite, 2)].map((branch) =>
      manager.funcDecls[decl].op === OP_EQ
        ? branch === value
          ? manager.trueExpr
          : this.areDistinct(branch, value)
            ? manager.falseExpr
            : manager.mkEq(branch, value)
        : manager.mkApp(decl, isSwapped ? [value, branch] : [branch, value], sort),
    );
    return { expr: manager.mkApp(OP_ITE, [manager.getArg(ite, 0), ...branches], sort), depth: 2 };
  }

  private isIteValueTree(expr: number) {
    const manager = this.manager;
    if (!this.isIte(expr) || manager.getRefCount(expr) !== 1) return false;
    const todo = [expr];
    for (let ite = todo.pop(); ite !== undefined; ite = todo.pop()) {
      for (const branch of [manager.getArg(ite, 1), manager.getArg(ite, 2)]) {
        if (this.isIte(branch) && manager.getRefCount(branch) === 1) todo.push(branch);
        else if (!manager.isUniqueValue(branch)) return false;
      }
    }
    return true;
  }

  private reduceEq(left: number, right: number) {
    const manager = this.manager;
    const sort = manager.sorts[left];
    const theoryResult = isArithSort(sort)
      ? this.arith.mkEq(left, right)
      : manager.isBvSort(sort)
        ? this.bv.mkEqCore(left, right)
        : manager.isDatatypeSort(sort)
          ? mkDatatypeEqCore(manager, left, right)
          : manager.isArraySort(sort)
            ? this.array.mkEqCore(left, right)
            : manager.getSortFamily(sort) === FAMILY_FPA
              ? mkFpaEqCore(manager, left, right)
              : manager.getSortFamily(sort) === FAMILY_SEQ
                ? this.seq.mkEqCore(left, right)
                : undefined;
    if (theoryResult !== undefined) return theoryResult;
    if (manager.getOp(left) === OP_UBV2INT || manager.getOp(right) === OP_UBV2INT) {
      const bv2intResult = this.bv.mkEqBv2int(left, right);
      if (bv2intResult !== undefined) return bv2intResult;
    }
    return this.applyTamagotchi(left, right) ?? this.applyTamagotchi(right, left);
  }

  private applyTamagotchi(eq: number, other: number): Rewrite | undefined {
    const manager = this.manager;
    const eqBit = this.bv.getEqBit(eq);
    if (eqBit === undefined) return undefined;
    const bit = manager.mkBvNumeral(eqBit.bit, 1);
    const otherBit = manager.mkBvNumeral(1n - eqBit.bit, 1);
    const ite = manager.mkApp(OP_ITE, [other, bit, otherBit], manager.sorts[bit]);
    return { expr: manager.mkEq(eqBit.term, ite), depth: 2 };
  }

  reduceAppCore(decl: number, args: number[]): number | Rewrite {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.family === FAMILY_BV) return this.bv.mkAppCore(decl, args) ?? -1;
    if (funcDecl.family === FAMILY_ARRAY) return this.array.mkAppCore(funcDecl.op, args) ?? -1;
    if (funcDecl.family === FAMILY_DATATYPE) return mkDatatypeAppCore(manager, decl, args) ?? -1;
    if (funcDecl.family === FAMILY_FPA) return mkFpaAppCore(manager, decl, args) ?? -1;
    if (funcDecl.family === FAMILY_SEQ || funcDecl.family === FAMILY_CHAR)
      return this.seq.mkAppCore(decl, args) ?? -1;
    const op = funcDecl.op;
    switch (op) {
      case OP_AND:
        return (
          (manager.isReUsed ? this.seq.mkBoolApp(true, args) : undefined) ?? this.mkAndCore(args)
        );
      case OP_OR:
        return (manager.isReUsed ? this.seq.mkBoolApp(false, args) : undefined) ?? this.mkOr(args);
      case OP_NOT:
        return this.mkNot(args[0]);
      case OP_IMPLIES:
        return this.mkOr([this.mkNot(args[0]), args[1]]);
      case OP_XOR:
        return this.mkEq(this.mkNot(args[0]), args[1]);
      case OP_EQ:
        return (
          this.reduceEq(args[0], args[1]) ??
          (manager.isSeqUsed && manager.getFamily(args[0]) === FAMILY_SEQ
            ? this.seq.mkEqCore(args[0], args[1])
            : undefined) ??
          this.mkEqCore(args[0], args[1]) ??
          -1
        );
      case OP_DISTINCT:
        return (
          (args.length > 0 && manager.isBvSort(manager.sorts[args[0]])
            ? this.bv.mkDistinct(args)
            : undefined) ?? this.mkDistinct(args)
        );
      case OP_ITE:
        return (
          (manager.isBvSort(manager.sorts[args[1]])
            ? this.bv.mkIteCore(args[0], args[1], args[2])
            : undefined) ?? this.mkIte(args[0], args[1], args[2])
        );
      case OP_LE:
        return this.arith.mkLe(args[0], args[1]) ?? -1;
      case OP_GE:
        return this.arith.mkGe(args[0], args[1]) ?? -1;
      case OP_LT:
        return this.arith.mkLt(args[0], args[1]);
      case OP_GT:
        return this.arith.mkGt(args[0], args[1]);
      case OP_ADD:
        return this.arith.mkAdd(args) ?? -1;
      case OP_SUB:
        return this.arith.mkSub(args);
      case OP_UMINUS:
        return this.arith.mkUminus(args[0]);
      case OP_MUL:
        return this.arith.mkMul(args) ?? -1;
      case OP_IDIV:
        return this.arith.mkIdiv(args[0], args[1]) ?? -1;
      case OP_MOD:
        return this.arith.mkMod(args[0], args[1]) ?? -1;
      case OP_ABS:
        return this.arith.mkAbs(args[0]);
      case OP_DIV:
        return this.arith.mkDiv(args[0], args[1]) ?? -1;
      case OP_TO_REAL:
        return this.arith.mkToReal(args[0]) ?? -1;
      case OP_TO_INT:
        return this.arith.mkToInt(args[0]) ?? -1;
      case OP_IS_INT:
        return this.arith.mkIsInt(args[0]);
      case OP_POWER:
        return this.arith.mkPower(args[0], args[1]) ?? -1;
      case OP_SIN:
        return this.arith.mkSin(args[0]) ?? -1;
      case OP_COS:
        return this.arith.mkCos(args[0]) ?? -1;
      case OP_TAN:
        return this.arith.mkTan(args[0]) ?? -1;
      case OP_ASIN:
        return this.arith.mkAsin(args[0]) ?? -1;
      case OP_ACOS:
        return this.arith.mkAcos(args[0]) ?? -1;
      case OP_ATAN:
        return this.arith.mkAtan(args[0]) ?? -1;
      case OP_SINH:
      case OP_COSH:
      case OP_TANH:
        return this.arith.mkHyperbolic(op, args[0]) ?? -1;
      default:
        return -1;
    }
  }

  mkNot(arg: number): number {
    const manager = this.manager;
    if (manager.isNot(arg)) return manager.getArg(arg, 0);
    if (manager.getOp(arg) === OP_EQ && manager.sorts[manager.getArg(arg, 0)] === SORT_BOOL)
      return this.mkEq(this.mkNot(manager.getArg(arg, 0)), manager.getArg(arg, 1));
    return manager.mkNot(arg);
  }

  // With sort_disjunctions, a disjunction that changed or is out of ast_lt's order is stably
  // sorted by id.
  mkOr(args: number[]): number {
    const manager = this.manager;
    const isNested =
      this.options.isFlatAndOr !== false && args.some((arg) => manager.getOp(arg) === OP_OR);
    const flatArgs = isNested ? this.flattenArgs(args, OP_OR) : args;
    const literals = manager.flatLiterals;
    literals.clear();
    for (const arg of flatArgs) {
      if (manager.isTrue(arg)) return manager.trueExpr;
      if (manager.isFalse(arg)) continue;
      if (literals.add(arg)) return manager.trueExpr;
    }
    const result = literals.list;
    const limit = this.options.localCtxLimit;
    if (result.length > 1 && limit !== undefined && this.localCtxCost <= limit) {
      const simplified = manager.withTemporaries(() => this.simplifyLocalCtx([...result]));
      if (simplified !== -1) {
        manager.releaseLater(simplified);
        return simplified;
      }
    }
    const isOutOfOrder = result.some(
      (arg, index) => index > 0 && isAstLess(manager, arg, result[index - 1]),
    );
    // Dropping false or a duplicate disjunct also sets mk_nflat_or_core's s.
    if (isNested || result.length !== flatArgs.length || isOutOfOrder)
      sortByKey(result, (arg) => manager.ids[arg]);
    return manager.mkOr(result);
  }

  private simplifyNestedNotOr(args: number[], negatives: Set<number>, positives: Set<number>) {
    const manager = this.manager;
    this.localCtxCost += args.length;
    const kept: number[] = [];
    let isSimplified = false;
    for (const arg of args) {
      if (negatives.has(arg)) return manager.falseExpr;
      if (positives.has(arg)) {
        isSimplified = true;
        continue;
      }
      if (manager.isNot(arg)) {
        const atom = manager.getArg(arg, 0);
        if (negatives.has(atom)) {
          isSimplified = true;
          continue;
        }
        if (positives.has(atom)) return manager.falseExpr;
      }
      kept.push(arg);
    }
    if (!isSimplified) return -1;
    if (kept.length === 0) return manager.trueExpr;
    return kept.length === 1 ? this.mkNot(kept[0]) : manager.mkNot(manager.mkOr(kept));
  }

  private simplifyLiteral(arg: number, negatives: Set<number>, positives: Set<number>) {
    const manager = this.manager;
    const isNegated = manager.isNot(arg);
    const atom = isNegated ? manager.getArg(arg, 0) : arg;
    if (negatives.has(atom)) return isNegated ? manager.falseExpr : manager.trueExpr;
    if (positives.has(atom)) return isNegated ? manager.trueExpr : manager.falseExpr;
    return arg;
  }

  private mkNestedIte(condition: number, thenExpr: number, elseExpr: number) {
    const manager = this.manager;
    if (manager.isTrue(condition)) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    if (thenExpr === elseExpr) return thenExpr;
    if (manager.sorts[thenExpr] === SORT_BOOL) {
      if (manager.isTrue(thenExpr))
        return manager.isFalse(elseExpr) ? condition : manager.mkOr([condition, elseExpr]);
      if (manager.isFalse(thenExpr))
        return manager.isTrue(elseExpr)
          ? this.mkNot(condition)
          : manager.mkNot(manager.mkOr([condition, this.mkNot(elseExpr)]));
      if (manager.isTrue(elseExpr)) return manager.mkOr([this.mkNot(condition), thenExpr]);
      if (manager.isFalse(elseExpr) || condition === elseExpr)
        return manager.mkNot(manager.mkOr([this.mkNot(condition), this.mkNot(thenExpr)]));
      if (condition === thenExpr) return manager.mkOr([condition, elseExpr]);
      if (
        (manager.isNot(thenExpr) && manager.getArg(thenExpr, 0) === elseExpr) ||
        (manager.isNot(elseExpr) && manager.getArg(elseExpr, 0) === thenExpr)
      )
        return this.mkEq(condition, thenExpr);
    }
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], manager.sorts[thenExpr]);
  }

  private simplifyNestedEqIte(form: number, negatives: Set<number>, positives: Set<number>) {
    const manager = this.manager;
    this.localCtxCost += 3;
    const isNegated = manager.isNot(form);
    const atom = isNegated ? manager.getArg(form, 0) : form;
    const op = manager.getOp(atom);
    if (op !== OP_EQ && op !== OP_ITE) return -1;
    const args = manager.getArgs(atom);
    const simplified = args.map((arg) => this.simplifyLiteral(arg, negatives, positives));
    if (simplified.every((arg, index) => arg === args[index])) return -1;
    const result =
      op === OP_EQ
        ? this.mkEq(simplified[0], simplified[1])
        : this.mkNestedIte(simplified[0], simplified[1], simplified[2]);
    return isNegated ? this.mkNot(result) : result;
  }

  private simplifyLocalCtx(initialArgs: number[]) {
    const manager = this.manager;
    let args = initialArgs;
    let isSimplified = false;
    let isModified = false;
    let isForward = true;
    for (;;) {
      const negatives = new Set<number>();
      const positives = new Set<number>();
      const kept: number[] = [];
      const push = (arg: number) => {
        const isNegated = manager.isNot(arg);
        const marks = isNegated ? negatives : positives;
        const atom = isNegated ? manager.getArg(arg, 0) : arg;
        if (marks.has(atom)) return;
        marks.add(atom);
        kept.push(arg);
      };
      this.localCtxCost += 2 * args.length;
      const order = isForward ? args : [...args].reverse();
      for (const original of order) {
        let arg = original;
        if (manager.isNot(arg) && manager.getOp(manager.getArg(arg, 0)) === OP_OR) {
          const nested = this.simplifyNestedNotOr(
            manager.getArgs(manager.getArg(arg, 0)),
            negatives,
            positives,
          );
          if (nested !== -1) {
            isModified = true;
            isSimplified = true;
            arg = nested;
          }
        }
        const nested = this.simplifyNestedEqIte(arg, negatives, positives);
        if (nested !== -1) {
          isModified = true;
          isSimplified = true;
          arg = nested;
        }
        if (manager.isFalse(arg)) continue;
        if (manager.isTrue(arg)) return arg;
        if (this.options.isFlatAndOr !== false && manager.getOp(arg) === OP_OR)
          for (const inner of manager.getArgs(arg)) push(inner);
        else push(arg);
      }
      if (!isForward) {
        if (!isModified) return isSimplified ? manager.mkOr(args) : -1;
        kept.reverse();
        isModified = false;
      }
      isForward = !isForward;
      args = kept;
    }
  }

  private mkAndCore(args: number[]): number | Rewrite {
    const manager = this.manager;
    if (this.options.isEliminatingAnd) return this.mkAndAsOr(args);
    if (this.options.isFlatAndOr === false || !args.some((arg) => manager.getOp(arg) === OP_AND))
      return this.mkNflatAnd(args);
    return { expr: this.mkNflatAnd(this.flattenArgs(args, OP_AND)), depth: 1 };
  }

  private flattenArgs(args: number[], op: number) {
    const manager = this.manager;
    const flatArgs: number[] = [];
    for (const arg of args)
      if (manager.getOp(arg) === op) manager.pushArgs(arg, flatArgs);
      else flatArgs.push(arg);
    return flatArgs;
  }

  mkAnd(args: number[]): number {
    const result = this.mkAndCore(args);
    return typeof result === "number" ? result : result.expr;
  }

  private mkNflatAnd(args: number[]) {
    const manager = this.manager;
    const literals = manager.flatLiterals;
    literals.clear();
    for (const arg of args) {
      if (manager.isTrue(arg)) continue;
      if (manager.isFalse(arg) || literals.add(arg)) return manager.falseExpr;
    }
    const result = literals.list;
    if (result.length === 0) return manager.trueExpr;
    return result.length === 1 ? result[0] : manager.mkAnd(result);
  }

  // Each negation is built with its own temporaries, and the negations outlive the disjunction.
  private mkAndAsOr(args: number[]) {
    const manager = this.manager;
    const negations = args.map((arg) => manager.withTemporaries(() => this.mkNot(arg)));
    const result = manager.withTemporaries(() => this.mkNot(this.mkOr(negations)));
    for (const negation of negations) manager.decRef(negation);
    manager.releaseLater(result);
    return result;
  }

  private tryIteEq(ite: number, other: number): Rewrite | undefined {
    const manager = this.manager;
    if (!this.isIte(ite)) return undefined;
    if (manager.getArg(ite, 1) === other && this.areDistinct(manager.getArg(ite, 2), other))
      return { expr: manager.getArg(ite, 0), depth: 1 };
    if (manager.getArg(ite, 2) === other && this.areDistinct(manager.getArg(ite, 1), other))
      return { expr: manager.mkNot(manager.getArg(ite, 0)), depth: 1 };
    return undefined;
  }

  private isIte(expr: number) {
    return this.manager.getOp(expr) === OP_ITE;
  }

  private areDistinct(first: number, second: number) {
    const manager = this.manager;
    return first !== second && manager.isUniqueValue(first) && manager.isUniqueValue(second);
  }

  private mkIteValueEq(left: number, right: number): number | Rewrite | undefined {
    const manager = this.manager;
    if (this.isIte(left) && manager.isUniqueValue(right)) return this.tryIteValue(left, right);
    if (this.isIte(right) && manager.isUniqueValue(left)) return this.tryIteValue(right, left);
    if (
      !this.isIte(left) ||
      !this.isIte(right) ||
      ![
        manager.getArg(left, 1),
        manager.getArg(left, 2),
        manager.getArg(right, 1),
        manager.getArg(right, 2),
      ].every((arg) => manager.isUniqueValue(arg))
    )
      return undefined;
    const mkOr = (args: number[]) => manager.mkApp(OP_OR, args, SORT_BOOL);
    const clauses = [
      mkOr([
        manager.getArg(left, 0),
        manager.getArg(right, 0),
        manager.mkEq(manager.getArg(left, 2), manager.getArg(right, 2)),
      ]),
    ];
    const leftNot = manager.mkNot(manager.getArg(left, 0));
    const rightNot = manager.mkNot(manager.getArg(right, 0));
    clauses.push(
      mkOr([leftNot, rightNot, manager.mkEq(manager.getArg(left, 1), manager.getArg(right, 1))]),
      mkOr([
        leftNot,
        manager.getArg(right, 0),
        manager.mkEq(manager.getArg(left, 1), manager.getArg(right, 2)),
      ]),
      mkOr([
        manager.getArg(left, 0),
        rightNot,
        manager.mkEq(manager.getArg(left, 2), manager.getArg(right, 1)),
      ]),
    );
    return { expr: manager.mkApp(OP_AND, clauses, SORT_BOOL), depth: Infinity };
  }

  // It builds its results without rewriting them, and the main loop rewrites them again.
  private tryIteValue(ite: number, value: number): number | Rewrite | undefined {
    const manager = this.manager;
    const condition = manager.getArg(ite, 0);
    const thenExpr = manager.getArg(ite, 1);
    const elseExpr = manager.getArg(ite, 2);
    // An equality of a branch is the first write to the result.
    const write = (result: number) => {
      this.releaseResult();
      return result;
    };
    // Z3 rewrites the equality of a branch only below depth 500.
    const mkBranchEq = (branch: number) =>
      write(manager.depths[branch] < 500 ? this.mkEq(branch, value) : manager.mkEq(branch, value));
    const mkPlainEq = (branch: number) =>
      branch === value
        ? manager.trueExpr
        : this.areDistinct(branch, value)
          ? manager.falseExpr
          : manager.mkEq(branch, value);
    const mkAnd = (first: number, second: number) =>
      manager.mkApp(OP_AND, [first, second], SORT_BOOL);
    const mkOr = (first: number, second: number) =>
      manager.mkApp(OP_OR, [first, second], SORT_BOOL);
    if (this.areDistinct(value, elseExpr))
      return { expr: mkAnd(mkBranchEq(thenExpr), condition), depth: 2 };
    if (this.areDistinct(value, thenExpr))
      return { expr: mkAnd(mkBranchEq(elseExpr), manager.mkNot(condition)), depth: 2 };
    if (value === thenExpr)
      return value === elseExpr
        ? manager.trueExpr
        : { expr: mkOr(write(this.mkEq(elseExpr, value)), condition), depth: 2 };
    if (value === elseExpr)
      return { expr: mkOr(write(this.mkEq(thenExpr, value)), manager.mkNot(condition)), depth: 2 };
    const isValueIte = (expr: number) =>
      this.isIte(expr) &&
      manager.isUniqueValue(manager.getArg(expr, 1)) &&
      manager.isUniqueValue(manager.getArg(expr, 2));
    const getExpr = (result: number | Rewrite) =>
      typeof result === "number" ? result : result.expr;
    const thenEq = isValueIte(thenExpr) ? this.tryIteValue(thenExpr, value) : undefined;
    if (thenEq !== undefined) {
      const branches = [getExpr(thenEq), mkPlainEq(elseExpr)];
      return { expr: manager.mkApp(OP_ITE, [condition, ...branches], SORT_BOOL), depth: 2 };
    }
    const elseEq = isValueIte(elseExpr) ? this.tryIteValue(elseExpr, value) : undefined;
    if (elseEq !== undefined) {
      const branches = [mkPlainEq(thenExpr), getExpr(elseEq)];
      return { expr: manager.mkApp(OP_ITE, [condition, ...branches], SORT_BOOL), depth: 2 };
    }
    // simplify_eq_ite's result is written even when it is null.
    this.releaseResult();
    return this.isDisjointFrom(ite, value) ? manager.falseExpr : undefined;
  }

  private isDisjointFrom(ite: number, value: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [ite];
    while (todo.length > 0) {
      const expr = todo.pop() ?? ite;
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (this.areDistinct(expr, value)) continue;
      if (!this.isIte(expr)) return false;
      todo.push(manager.getArg(expr, 1), manager.getArg(expr, 2));
    }
    return true;
  }

  mkEq(left: number, right: number): number {
    const result = this.mkEqCore(left, right);
    return result === undefined
      ? this.manager.mkEq(left, right)
      : typeof result === "number"
        ? result
        : result.expr;
  }

  private mkEqCore(inputLeft: number, inputRight: number): number | Rewrite | undefined {
    const manager = this.manager;
    if (inputLeft === inputRight) return manager.trueExpr;
    if (manager.isUniqueValue(inputLeft) && manager.isUniqueValue(inputRight))
      return manager.falseExpr;
    const iteEq = this.tryIteEq(inputLeft, inputRight) ?? this.tryIteEq(inputRight, inputLeft);
    if (iteEq !== undefined) return iteEq;
    const iteValueEq = this.mkIteValueEq(inputLeft, inputRight);
    if (iteValueEq !== undefined) return iteValueEq;
    if (manager.sorts[inputLeft] !== SORT_BOOL) return undefined;
    const isUnfolded = manager.isNot(inputLeft) && manager.isNot(inputRight);
    const left = isUnfolded ? manager.getArg(inputLeft, 0) : inputLeft;
    const right = isUnfolded ? manager.getArg(inputRight, 0) : inputRight;
    if (manager.isTrue(left)) return right;
    if (manager.isFalse(left)) return this.mkNot(right);
    if (manager.isTrue(right)) return left;
    if (manager.isFalse(right)) return this.mkNot(left);
    if (manager.isComplement(left, right)) return manager.falseExpr;
    const isSwapped = manager.isNot(right);
    const lhs = isSwapped ? right : left;
    const rhs = isSwapped ? left : right;
    if (manager.isNot(lhs))
      return { expr: manager.mkNot(manager.mkEq(manager.getArg(lhs, 0), rhs)), depth: 2 };
    if (isUnfolded) return { expr: manager.mkEq(lhs, rhs), depth: 1 };
    if (manager.getOp(lhs) === OP_EQ && manager.getOp(rhs) === OP_EQ) {
      const isNegationOf = (expr: number, other: number) =>
        manager.isNot(expr) && manager.getArg(expr, 0) === other;
      if (
        (manager.getArg(lhs, 0) === manager.getArg(rhs, 0) &&
          (isNegationOf(manager.getArg(rhs, 1), manager.getArg(lhs, 1)) ||
            isNegationOf(manager.getArg(lhs, 1), manager.getArg(rhs, 1)))) ||
        (manager.getArg(lhs, 1) === manager.getArg(rhs, 1) &&
          (isNegationOf(manager.getArg(rhs, 0), manager.getArg(lhs, 0)) ||
            isNegationOf(manager.getArg(lhs, 0), manager.getArg(rhs, 0))))
      )
        return manager.falseExpr;
    }
    return undefined;
  }

  // bool_rewriter::mk_distinct_core. The port's kernel cannot internalize a distinct of more than two
  // arguments, so the solver's rewriters blast every one.
  private mkDistinct(args: number[]): number | Rewrite {
    const manager = this.manager;
    if (args.length <= 1) return manager.trueExpr;
    if (args.length === 2) return { expr: this.mkNot(this.mkEq(args[0], args[1])), depth: 2 };
    if (new Set(args).size < args.length) return manager.falseExpr;
    const firstNonValue = args.findIndex((arg) => !manager.isUniqueValue(arg));
    const isAllDifferent = args.every(
      (arg, index) =>
        firstNonValue === -1 ||
        index < firstNonValue ||
        args.slice(0, index).every((previous) => manager.areDistinct(arg, previous)),
    );
    if (isAllDifferent) return manager.trueExpr;
    if (manager.sorts[args[0]] === SORT_BOOL) return manager.falseExpr;
    if (
      this.options.isKeepingDistinct === true ||
      args.length >= (this.options.blastDistinctThreshold ?? Infinity)
    )
      return -1;
    const pairs: number[] = [];
    for (let left = 0; left < args.length; left++)
      for (let right = left + 1; right < args.length; right++)
        pairs.push(manager.mkNot(manager.mkEq(args[left], args[right])));
    return { expr: manager.mkAnd(pairs), depth: 3 };
  }

  mkIte(inputCondition: number, inputThen: number, inputElse: number): number | Rewrite {
    const manager = this.manager;
    const isNegated = manager.isNot(inputCondition);
    const condition = isNegated ? manager.getArg(inputCondition, 0) : inputCondition;
    const elseCandidate = isNegated ? inputThen : inputElse;
    const thenCandidate = isNegated ? inputElse : inputThen;
    // (ite c (ite c t1 t2) t3) is (ite c t1 t3).
    const thenExpr =
      this.isIte(thenCandidate) && manager.getArg(thenCandidate, 0) === condition
        ? manager.getArg(thenCandidate, 1)
        : thenCandidate;
    const sort = manager.sorts[thenExpr];
    // (ite c t1 (ite c2 t1 t2)) is (ite (or c c2) t1 t2).
    if (this.isIte(elseCandidate) && manager.getArg(elseCandidate, 1) === thenExpr) {
      const disjunction = manager.mkApp(
        OP_OR,
        [condition, manager.getArg(elseCandidate, 0)],
        SORT_BOOL,
      );
      return {
        expr: manager.mkApp(
          OP_ITE,
          [disjunction, thenExpr, manager.getArg(elseCandidate, 2)],
          sort,
        ),
        depth: 3,
      };
    }
    // (ite c t1 (ite c t2 t3)) is (ite c t1 t3).
    const elseExpr =
      this.isIte(elseCandidate) && manager.getArg(elseCandidate, 0) === condition
        ? manager.getArg(elseCandidate, 2)
        : elseCandidate;
    if (manager.isTrue(condition)) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    if (thenExpr === elseExpr) return thenExpr;
    if (sort === SORT_BOOL) {
      if (manager.isTrue(thenExpr))
        return manager.isFalse(elseExpr) ? condition : this.mkOr([condition, elseExpr]);
      if (manager.isFalse(thenExpr))
        return manager.isTrue(elseExpr)
          ? this.mkNot(condition)
          : { expr: this.mkAnd([this.mkNot(condition), elseExpr]), depth: 1 };
      if (manager.isTrue(elseExpr)) return this.mkOr([this.mkNot(condition), thenExpr]);
      if (manager.isFalse(elseExpr) || elseExpr === condition)
        return { expr: this.mkAnd([condition, thenExpr]), depth: 1 };
      if (thenExpr === condition) return this.mkOr([condition, elseExpr]);
      if (
        (manager.isNot(thenExpr) && manager.getArg(thenExpr, 0) === elseExpr) ||
        (manager.isNot(elseExpr) && manager.getArg(elseExpr, 0) === thenExpr)
      )
        return this.mkEq(condition, thenExpr);
    }
    const isElseIte = this.isIte(elseExpr);
    if (this.isIte(thenExpr)) {
      // (ite c1 (ite c2 t1 t2) t1) is (ite (and c1 (not c2)) t2 t1).
      if (elseExpr === manager.getArg(thenExpr, 1)) {
        const conjunction = this.mkAnd([condition, this.mkNot(manager.getArg(thenExpr, 0))]);
        return {
          expr: manager.mkApp(OP_ITE, [conjunction, manager.getArg(thenExpr, 2), elseExpr], sort),
          depth: 2,
        };
      }
      // (ite c1 (ite c2 t1 t2) t2) is (ite (and c1 c2) t1 t2).
      if (elseExpr === manager.getArg(thenExpr, 2)) {
        const conjunction = this.mkAnd([condition, manager.getArg(thenExpr, 0)]);
        return {
          expr: manager.mkApp(OP_ITE, [conjunction, manager.getArg(thenExpr, 1), elseExpr], sort),
          depth: 2,
        };
      }
      // (ite c1 (ite c2 t1 t2) (ite c3 t1 t2)) is (ite (or (and c1 c2) (and (not c1) c3)) t1 t2),
      // and with (ite c3 t2 t1) the last conjunct is (not c3).
      const isSameBranches =
        isElseIte &&
        manager.getArg(thenExpr, 1) === manager.getArg(elseExpr, 1) &&
        manager.getArg(thenExpr, 2) === manager.getArg(elseExpr, 2);
      const isSwappedBranches =
        isElseIte &&
        manager.getArg(thenExpr, 1) === manager.getArg(elseExpr, 2) &&
        manager.getArg(thenExpr, 2) === manager.getArg(elseExpr, 1);
      if (isSameBranches || isSwappedBranches) {
        const first = this.mkAnd([condition, manager.getArg(thenExpr, 0)]);
        const negation = this.mkNot(condition);
        const second = this.mkAnd([
          negation,
          isSameBranches ? manager.getArg(elseExpr, 0) : this.mkNot(manager.getArg(elseExpr, 0)),
        ]);
        const disjunction = this.mkOr([first, second]);
        return {
          expr: manager.mkApp(
            OP_ITE,
            [disjunction, manager.getArg(thenExpr, 1), manager.getArg(thenExpr, 2)],
            sort,
          ),
          depth: 3,
        };
      }
    }
    if (isElseIte) {
      // (ite c1 t1 (ite c2 t1 t2)) is (ite (or c1 c2) t1 t2).
      if (thenExpr === manager.getArg(elseExpr, 1)) {
        const disjunction = this.mkOr([condition, manager.getArg(elseExpr, 0)]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, manager.getArg(elseExpr, 2)], sort),
          depth: 1,
        };
      }
      // (ite c1 t1 (ite c2 t2 t1)) is (ite (or c1 (not c2)) t1 t2).
      if (thenExpr === manager.getArg(elseExpr, 2)) {
        const disjunction = this.mkOr([condition, this.mkNot(manager.getArg(elseExpr, 0))]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, manager.getArg(elseExpr, 1)], sort),
          depth: 1,
        };
      }
    }
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], sort);
  }

  mkAdd(args: number[]) {
    return this.arith.mkAdd(args) ?? this.arith.mkAddApp(args);
  }

  mkSub(first: number, second: number) {
    const result = this.arith.mkSub([first, second]);
    return typeof result === "number" ? result : result.expr;
  }
}

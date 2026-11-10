// Ported from Z3 (src/ast/rewriter/seq_rewriter.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  FAMILY_SEQ,
  OP_AND,
  OP_CHAR_LE,
  OP_EQ,
  OP_GE,
  OP_ITE,
  OP_LT,
  OP_NOT,
  OP_OR,
  OP_RE_COMPLEMENT,
  OP_RE_CONCAT,
  OP_RE_DERIVATIVE,
  OP_RE_DIFF,
  OP_RE_INTERSECT,
  OP_RE_LOOP,
  OP_RE_OF_PRED,
  OP_RE_OPTION,
  OP_RE_PLUS,
  OP_RE_POWER,
  OP_RE_RANGE,
  OP_RE_REVERSE,
  OP_RE_STAR,
  OP_RE_UNION,
  OP_RE_XOR,
  OP_SEQ_AT,
  OP_SEQ_CONCAT,
  OP_SEQ_IN_RE,
  OP_SEQ_LENGTH,
  OP_SEQ_NTH_I,
  OP_SEQ_PREFIX,
  OP_SEQ_REPLACE_ALL,
  OP_SEQ_SUFFIX,
  OP_SEQ_TO_RE,
  OP_SEQ_UNIT,
  OP_STRING_LE,
  SORT_BOOL,
} from "./ast";
import { flattenAndVector } from "./ast-util";
import { ExprSafeReplace } from "./expr-safe-replace";
import { L_FALSE, L_TRUE } from "./lbool";
import { RefVector } from "./ref-vector";
import { KERNEL_REWRITER_OPTIONS, Rewriter } from "./rewriter";
import type { Rewrite } from "./rewriter-tpl";
import { isEmptySeq, mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import { DERIVATIVE_ANTIMIROV, Derive } from "./seq-derive";
import {
  intersectRanges,
  rangePredicateToRegex,
  regexToRangePredicate,
  subtractRanges,
  uniteRanges,
} from "./seq-range-predicate";
import { RegexBisim } from "./seq-regex-bisim";
import { RegexWitness } from "./seq-regex-witness";
import {
  UINT_MAX,
  canBeMember,
  getCharConstRange,
  getLoopBounds,
  getLoopLower,
  getMaxChar,
  getRangeChars,
  ReInfoCache,
  isDotPlus,
  isEpsilon,
  isFullChar,
  isFullSeq,
  isReBinary,
  isReEmpty,
  isReGround,
  isReOp,
  isReUnary,
  mkEpsilon,
  mkFullChar,
  mkFullSeq,
  mkReEmpty,
  mkReLoop,
  mkReRange,
} from "./seq-re-util";
import type { Result, SeqRewriter } from "./seq-rewriter";
import { isReSubset } from "./seq-subset";

const BR_REWRITE1 = 1;
const BR_REWRITE2 = 2;
const BR_REWRITE3 = 3;
const BR_REWRITE_FULL = 4;
const MAX_OP_CACHE_SIZE = 10000;

export interface BoolRewriter {
  mkAnd(args: number[]): number;
  mkOr(args: number[]): number;
  mkNot(arg: number): number;
  mkEq(left: number, right: number): number;
  mkIte(condition: number, thenExpr: number, elseExpr: number): number | Rewrite;
}

interface ReSplit {
  head: number;
  tail: number;
}

const rewrite = (expr: number, depth: number): Rewrite => ({ expr, depth });

export const getResultExpr = (result: number | Rewrite) =>
  typeof result === "number" ? result : result.expr;

export class ReRewriter {
  private nullableCache = new Map<number, number>();
  private opCacheTrail: RefVector;
  private isInBisim = false;
  private derive: Derive | undefined;
  private ownBool: Rewriter | undefined;

  readonly info: ReInfoCache;

  constructor(
    private manager: AstManager,
    private seq: SeqRewriter,
    private bool?: BoolRewriter,
  ) {
    this.info = new ReInfoCache(manager);
    this.opCacheTrail = new RefVector(manager);
  }

  release() {
    this.opCacheTrail.reset();
    this.nullableCache.clear();
    this.derive?.release();
    if (this.ownBool !== undefined) this.ownBool.release();
    this.info.release();
  }

  private getBool() {
    if (this.bool !== undefined) return this.bool;
    this.ownBool ??= new Rewriter(this.manager, KERNEL_REWRITER_OPTIONS);
    return this.ownBool;
  }

  getDerive() {
    this.derive ??= new Derive(this.manager, this);
    return this.derive;
  }

  mkAppCore(decl: number, op: number, args: number[]): Result {
    switch (op) {
      case OP_RE_PLUS:
        return this.mkRePlus(args[0]);
      case OP_RE_STAR:
        return this.mkReStar(args[0]);
      case OP_RE_OPTION:
        return this.mkReOpt(args[0]);
      case OP_RE_REVERSE:
        return this.mkReReverse(args[0]);
      case OP_RE_DERIVATIVE:
        return this.mkDerivative(args[0], args[1]);
      case OP_RE_CONCAT:
        return args.length === 1 ? args[0] : this.mkReConcat(args[0], args[1]);
      case OP_RE_UNION:
        return args.length === 1 ? args[0] : this.mkReUnion(args[0], args[1]);
      case OP_RE_RANGE:
        return this.mkReRange(args[0], args[1]);
      case OP_RE_DIFF:
        return args.length === 2
          ? this.mkReDiff(args[0], args[1])
          : args.length === 1
            ? args[0]
            : undefined;
      case OP_RE_XOR:
        return args.length === 2
          ? this.mkReXor(args[0], args[1])
          : args.length === 1
            ? args[0]
            : undefined;
      case OP_RE_INTERSECT:
        return args.length === 1 ? args[0] : this.mkReInter(args[0], args[1]);
      case OP_RE_COMPLEMENT:
        return this.mkReComplement(args[0]);
      case OP_RE_LOOP:
        return this.mkReLoop(decl, args);
      case OP_RE_POWER: {
        const power = this.manager.funcDecls[decl].parameters[0] >>> 0;
        return this.mkLoop(args[0], power, power);
      }
      case OP_SEQ_TO_RE:
        return this.mkStrToRegexp(args[0]);
      case OP_SEQ_IN_RE:
        return this.mkStrInRegexp(args[0], args[1]);
      default:
        return undefined;
    }
  }

  private mkRe(op: number, args: number[], parameters: number[] = []) {
    return mkSeqApp(this.manager, op, args, parameters);
  }

  private mkRawIte(condition: number, thenExpr: number, elseExpr: number) {
    return this.manager.mkApp(
      OP_ITE,
      [condition, thenExpr, elseExpr],
      this.manager.sorts[thenExpr],
    );
  }

  private mkBool(op: number, args: number[]) {
    return this.manager.mkApp(op, args, SORT_BOOL);
  }

  private mkBoolIte(condition: number, thenExpr: number, elseExpr: number) {
    return getResultExpr(this.getBool().mkIte(condition, thenExpr, elseExpr));
  }

  private getResult(result: Result, op: number, args: number[]) {
    return result === undefined ? this.mkRe(op, args) : getResultExpr(result);
  }

  private getUnary(expr: number, op: number) {
    return isReUnary(this.manager, expr, op) ? this.manager.getArg(expr, 0) : -1;
  }

  private getSplit(expr: number, op: number): ReSplit | undefined {
    const manager = this.manager;
    return isReBinary(manager, expr, op)
      ? { head: manager.getArg(expr, 0), tail: manager.getArg(expr, 1) }
      : undefined;
  }

  private getIte(expr: number) {
    return this.manager.getOp(expr) === OP_ITE ? this.manager.getArgs(expr) : undefined;
  }

  private getSeqSort(regex: number) {
    return this.manager.getReSeqSort(this.manager.sorts[regex]);
  }

  private mkEmptyOf(regex: number) {
    return mkReEmpty(this.manager, this.manager.sorts[regex]);
  }

  private mkFullSeqOf(regex: number) {
    return mkFullSeq(this.manager, this.manager.sorts[regex]);
  }

  private mkEqEmpty(regex: number) {
    return this.manager.mkEq(regex, this.mkEmptyOf(regex));
  }

  mkUnion(first: number, second: number) {
    return this.getResult(this.mkReUnion(first, second), OP_RE_UNION, [first, second]);
  }

  mkInter(first: number, second: number) {
    return this.getResult(this.mkReInter(first, second), OP_RE_INTERSECT, [first, second]);
  }

  mkComplement(regex: number) {
    return this.getResult(this.mkReComplement(regex), OP_RE_COMPLEMENT, [regex]);
  }

  mkToRe(seq: number) {
    return this.getResult(this.mkStrToRegexp(seq), OP_SEQ_TO_RE, [seq]);
  }

  mkStar(regex: number) {
    return this.getResult(this.mkReStar(regex), OP_RE_STAR, [regex]);
  }

  mkPlus(regex: number) {
    return this.getResult(this.mkRePlus(regex), OP_RE_PLUS, [regex]);
  }

  mkOpt(regex: number) {
    return this.getResult(this.mkReOpt(regex), OP_RE_OPTION, [regex]);
  }

  mkDiff(first: number, second: number) {
    return this.getResult(this.mkReDiff(first, second), OP_RE_DIFF, [first, second]);
  }

  mkReverse(regex: number) {
    return this.getResult(this.mkReReverse(regex), OP_RE_REVERSE, [regex]);
  }

  mkReAppend(first: number, second: number) {
    return this.getResult(this.mkReConcat(first, second), OP_RE_CONCAT, [first, second]);
  }

  mkXor0(first: number, second: number) {
    return this.getResult(this.mkReXor0(first, second), OP_RE_XOR, [first, second]);
  }

  mkReXorSimplified(first: number, second: number) {
    return this.getResult(this.mkReXor(first, second), OP_RE_XOR, [first, second]);
  }

  mkLoop(regex: number, lo: number, hi?: number) {
    return this.mkApp(this.manager.decls[mkReLoop(this.manager, regex, lo, hi)], [regex]);
  }

  mkApp(decl: number, args: number[]) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    const result = funcDecl.family === FAMILY_SEQ ? this.seq.mkAppCore(decl, args) : undefined;
    return result === undefined ? manager.mkApp(decl, args, funcDecl.range) : getResultExpr(result);
  }

  mkSeqConcat(first: number, second: number) {
    const result = this.seq.mkSeqConcat(first, second);
    return result === undefined
      ? mkSeqApp(this.manager, OP_SEQ_CONCAT, [first, second])
      : getResultExpr(result);
  }

  isNullable(regex: number) {
    const cached = this.nullableCache.get(regex);
    if (cached !== undefined) return cached;
    const result = this.getDerive().isNullable(regex);
    if (this.nullableCache.size >= MAX_OP_CACHE_SIZE) {
      this.opCacheTrail.reset();
      this.nullableCache.clear();
    }
    this.opCacheTrail.push(regex);
    this.opCacheTrail.push(result);
    this.nullableCache.set(regex, result);
    return result;
  }

  mkDerivative(element: number, regex: number) {
    return this.getDerive().derive(DERIVATIVE_ANTIMIROV, element, regex);
  }

  mkSymbolicDerivative(regex: number) {
    return this.getDerive().deriveSymbolic(DERIVATIVE_ANTIMIROV, regex);
  }

  isSubset(first: number, second: number) {
    return isReSubset(this.info, first, second);
  }

  areComplements(first: number, second: number) {
    return (
      this.getUnary(first, OP_RE_COMPLEMENT) === second ||
      this.getUnary(second, OP_RE_COMPLEMENT) === first
    );
  }

  private mkReReverse(regex: number): Result {
    const manager = this.manager;
    const concat = this.getSplit(regex, OP_RE_CONCAT);
    if (concat !== undefined) {
      const tailReverse = this.mkReverse(concat.tail);
      const headReverse = this.mkReverse(concat.head);
      return this.mkReAppend(tailReverse, headReverse);
    }
    const star = this.getUnary(regex, OP_RE_STAR);
    if (star !== -1) return this.mkStar(this.mkReverse(star));
    const plus = this.getUnary(regex, OP_RE_PLUS);
    if (plus !== -1) return this.mkPlus(this.mkReverse(plus));
    const binaryOps = [OP_RE_UNION, OP_RE_INTERSECT, OP_RE_DIFF, OP_RE_XOR];
    for (const op of binaryOps) {
      const split = this.getSplit(regex, op);
      if (split === undefined) continue;
      const first = this.mkReverse(split.head);
      const second = this.mkReverse(split.tail);
      return op === OP_RE_UNION
        ? this.mkUnion(first, second)
        : op === OP_RE_INTERSECT
          ? this.mkInter(first, second)
          : op === OP_RE_DIFF
            ? this.mkDiff(first, second)
            : this.mkReXorSimplified(first, second);
    }
    const ite = this.getIte(regex);
    if (ite !== undefined) {
      const thenReverse = this.mkReverse(ite[1]);
      const elseReverse = this.mkReverse(ite[2]);
      return this.mkBoolIte(ite[0], thenReverse, elseReverse);
    }
    const opt = this.getUnary(regex, OP_RE_OPTION);
    if (opt !== -1) return this.mkOpt(this.mkReverse(opt));
    const complement = this.getUnary(regex, OP_RE_COMPLEMENT);
    if (complement !== -1) return this.mkComplement(this.mkReverse(complement));
    const loopLower = getLoopLower(manager, regex);
    if (loopLower !== undefined) return this.mkLoop(this.mkReverse(loopLower.body), loopLower.lo);
    const loop = getLoopBounds(manager, regex);
    if (loop !== undefined) return this.mkLoop(this.mkReverse(loop.body), loop.lo, loop.hi);
    const reverse = this.getUnary(regex, OP_RE_REVERSE);
    if (reverse !== -1) return reverse;
    if (
      isFullSeq(manager, regex) ||
      isReEmpty(manager, regex) ||
      isReOp(manager, regex, OP_RE_RANGE) ||
      isFullChar(manager, regex) ||
      isReOp(manager, regex, OP_RE_OF_PRED)
    )
      return regex;
    const seq = this.getUnary(regex, OP_SEQ_TO_RE);
    if (seq === -1) return undefined;
    const chars = manager.getString(seq);
    if (chars !== undefined) return this.mkToRe(manager.mkString([...chars].reverse()));
    if (manager.getOp(seq) === OP_SEQ_UNIT) return regex;
    if (manager.getOp(seq) !== OP_SEQ_CONCAT || manager.getNumArgs(seq) !== 2) return undefined;
    const tailReverse = this.mkReverse(this.mkToRe(manager.getArg(seq, 1)));
    const headReverse = this.mkReverse(this.mkToRe(manager.getArg(seq, 0)));
    return this.mkReAppend(tailReverse, headReverse);
  }

  mkRegexUnionNormalize(first: number, second: number) {
    const manager = this.manager;
    if (first === second || isReEmpty(manager, second) || isFullSeq(manager, first)) return first;
    if (isReEmpty(manager, first) || isFullSeq(manager, second)) return second;
    if (isDotPlus(manager, first) && this.info.getInfo(second).lo > 0) return first;
    if (isDotPlus(manager, second) && this.info.getInfo(first).lo > 0) return second;
    const firstRange = getRangeChars(manager, first);
    const secondRange = getRangeChars(manager, second);
    if (
      firstRange !== undefined &&
      secondRange !== undefined &&
      secondRange[0] <= firstRange[1] + 1 &&
      firstRange[0] <= secondRange[1] + 1
    )
      return mkReRange(
        manager,
        manager.sorts[first],
        Math.min(firstRange[0], secondRange[0]),
        Math.max(firstRange[1], secondRange[1]),
      );
    return this.mergeRegexSets(
      first,
      second,
      this.mkFullSeqOf(first),
      OP_RE_UNION,
      (left, right) =>
        this.isSubset(left, right)
          ? right
          : this.isSubset(right, left)
            ? left
            : this.mkRe(OP_RE_UNION, [left, right]),
    );
  }

  mkRegexInterNormalize(inputFirst: number, inputSecond: number) {
    const manager = this.manager;
    const isSwapped = isEpsilon(manager, inputSecond);
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const compose = (left: number, right: number) =>
      this.isSubset(left, right)
        ? left
        : this.isSubset(right, left)
          ? right
          : this.mkRe(OP_RE_INTERSECT, [left, right]);
    if (first === second || isReEmpty(manager, first) || isFullSeq(manager, second)) return first;
    if (isReEmpty(manager, second) || isFullSeq(manager, first)) return second;
    if (isEpsilon(manager, first)) {
      const nullable = this.info.getInfo(second).nullable;
      if (nullable === L_TRUE) return first;
      if (nullable === L_FALSE) return this.mkEmptyOf(first);
      return this.mergeRegexSets(first, second, this.mkEmptyOf(first), OP_RE_INTERSECT, compose);
    }
    if (isDotPlus(manager, first) && this.info.getInfo(second).lo > 0) return second;
    if (isDotPlus(manager, second) && this.info.getInfo(first).lo > 0) return first;
    const firstRange = getRangeChars(manager, first);
    const secondRange = getRangeChars(manager, second);
    if (firstRange !== undefined && secondRange !== undefined)
      return mkReRange(
        manager,
        manager.sorts[first],
        Math.max(firstRange[0], secondRange[0]),
        Math.min(firstRange[1], secondRange[1]),
      );
    return this.mergeRegexSets(first, second, this.mkEmptyOf(first), OP_RE_INTERSECT, compose);
  }

  private mergeRegexSets(
    first: number,
    second: number,
    unit: number,
    op: number,
    compose: (left: number, right: number) => number,
  ) {
    const manager = this.manager;
    const prefix: number[] = [];
    const getId = (expr: number) => {
      const complemented = this.getUnary(expr, OP_RE_COMPLEMENT);
      return manager.ids[complemented === -1 ? expr : complemented];
    };
    const compare = (left: number, right: number) =>
      left === right ? 0 : getId(left) < getId(right) ? -1 : 1;
    const composeResult = (suffix: number) => {
      let result = suffix;
      while (prefix.length > 0) result = compose(prefix.pop()!, result);
      return result;
    };
    let left = first;
    let right = second;
    for (;;) {
      if (left === right) return composeResult(left);
      if (this.areComplements(left, right)) return unit;
      if (this.getSplit(right, op) !== undefined && this.getSplit(left, op) === undefined)
        [left, right] = [right, left];
      const leftSplit = this.getSplit(left, op);
      const rightSplit = this.getSplit(right, op);
      if (leftSplit !== undefined && rightSplit !== undefined) {
        if (this.areComplements(leftSplit.head, rightSplit.head)) return unit;
        const order = compare(leftSplit.head, rightSplit.head);
        if (order === 0) {
          prefix.push(leftSplit.head);
          left = leftSplit.tail;
          right = rightSplit.tail;
        } else if (order === -1) {
          prefix.push(leftSplit.head);
          left = leftSplit.tail;
        } else {
          prefix.push(rightSplit.head);
          right = rightSplit.tail;
        }
        continue;
      }
      if (leftSplit !== undefined) {
        if (this.areComplements(leftSplit.head, right)) return unit;
        const order = compare(leftSplit.head, right);
        if (order === 0) return composeResult(left);
        if (order === -1) {
          prefix.push(leftSplit.head);
          left = leftSplit.tail;
          continue;
        }
        prefix.push(right);
        return composeResult(left);
      }
      if (compare(left, right) === -1) [left, right] = [right, left];
      prefix.push(right);
      return composeResult(left);
    }
  }

  isReContainsPattern(regex: number): number[][] | undefined {
    const manager = this.manager;
    const first = this.getSplit(regex, OP_RE_CONCAT);
    if (first === undefined || !isFullSeq(manager, first.head)) return undefined;
    const patterns: number[][] = [[]];
    let current = first.tail;
    for (
      let split = this.getSplit(current, OP_RE_CONCAT);
      split !== undefined;
      split = this.getSplit(current, OP_RE_CONCAT)
    ) {
      const seq = this.getUnary(split.head, OP_SEQ_TO_RE);
      if (seq !== -1) patterns[patterns.length - 1].push(seq);
      else if (isFullSeq(manager, split.head)) patterns.push([]);
      else return undefined;
      current = split.tail;
    }
    return isFullSeq(manager, current) ? patterns : undefined;
  }

  private isConcreteChar(expr: number) {
    const manager = this.manager;
    const chars = manager.getString(expr);
    if (chars !== undefined) return chars.length === 1;
    return manager.getOp(expr) === OP_SEQ_UNIT && manager.getChar(manager.getArg(expr, 0)) !== -1;
  }

  private mkStrInRegexp(seq: number, regex: number): Result {
    const manager = this.manager;
    if (isReEmpty(manager, regex)) return manager.falseExpr;
    if (isFullSeq(manager, regex)) return manager.trueExpr;
    const range = this.getSplit(regex, OP_RE_RANGE);
    if (
      range !== undefined &&
      (!this.isConcreteChar(range.head) || !this.isConcreteChar(range.tail))
    ) {
      const one = manager.mkNumeral(1n);
      const mkLengthIsOne = (expr: number) => manager.mkEq(this.mkRe(OP_SEQ_LENGTH, [expr]), one);
      const conjuncts = [
        mkLengthIsOne(range.head),
        mkLengthIsOne(range.tail),
        mkLengthIsOne(seq),
        this.mkRe(OP_STRING_LE, [range.head, seq]),
        this.mkRe(OP_STRING_LE, [seq, range.tail]),
      ];
      return rewrite(this.mkBool(OP_AND, conjuncts), BR_REWRITE_FULL);
    }
    const chars = manager.getString(seq);
    if (chars !== undefined && isReGround(this.info, regex)) {
      let current = regex;
      for (const code of chars) {
        if (isReEmpty(manager, current)) return manager.falseExpr;
        current = this.mkDerivative(manager.mkChar(code), current);
      }
      const nullable = this.info.getInfo(current).nullable;
      if (nullable === L_TRUE) return manager.trueExpr;
      if (nullable === L_FALSE) return manager.falseExpr;
    }
    const isReplaceAll = manager.getOp(seq) === OP_SEQ_REPLACE_ALL && manager.getNumArgs(seq) === 3;
    const replaced = isReplaceAll ? manager.getArg(seq, 0) : -1;
    const source = isReplaceAll ? manager.getArg(seq, 1) : -1;
    const target = isReplaceAll ? manager.getArg(seq, 2) : -1;
    // Z3 returns the string x itself, which is not a Boolean.
    if (isReplaceAll && source === target)
      return rewrite(this.mkRe(OP_SEQ_IN_RE, [replaced, regex]), BR_REWRITE1);
    const sourceChars = isReplaceAll ? manager.getString(source) : undefined;
    const targetChars = isReplaceAll ? manager.getString(target) : undefined;
    if (
      sourceChars?.length === 1 &&
      targetChars?.length === 1 &&
      sourceChars[0] !== targetChars[0] &&
      isReGround(this.info, regex) &&
      this.info.getInfo(regex).isClassical
    ) {
      const newRegex = this.reReplaceChar(regex, sourceChars[0], targetChars[0], source, target);
      return rewrite(this.mkRe(OP_SEQ_IN_RE, [replaced, newRegex]), BR_REWRITE_FULL);
    }
    const lifted = this.liftStrFromToRe(regex);
    if (lifted !== undefined) return rewrite(this.getBool().mkEq(seq, lifted), BR_REWRITE_FULL);
    const concat = this.getSplit(regex, OP_RE_CONCAT);
    if (concat !== undefined) {
      const prefix = this.getUnary(concat.head, OP_SEQ_TO_RE);
      if (prefix !== -1 && isFullSeq(manager, concat.tail))
        return rewrite(this.mkRe(OP_SEQ_PREFIX, [prefix, seq]), BR_REWRITE1);
      const suffix = this.getUnary(concat.tail, OP_SEQ_TO_RE);
      if (suffix !== -1 && isFullSeq(manager, concat.head))
        return rewrite(this.mkRe(OP_SEQ_SUFFIX, [suffix, seq]), BR_REWRITE1);
    }
    const union = this.getSplit(regex, OP_RE_UNION);
    const optional =
      this.getUnary(regex, OP_RE_OPTION) !== -1
        ? this.getUnary(regex, OP_RE_OPTION)
        : union !== undefined && isEpsilon(manager, union.tail)
          ? union.head
          : union !== undefined && isEpsilon(manager, union.head)
            ? union.tail
            : -1;
    if (optional !== -1) {
      const isEmpty = manager.mkEq(this.mkRe(OP_SEQ_LENGTH, [seq]), manager.mkNumeral(0n));
      const isMember = this.mkRe(OP_SEQ_IN_RE, [seq, optional]);
      return rewrite(this.mkRawIte(isEmpty, manager.trueExpr, isMember), BR_REWRITE_FULL);
    }
    if (isEmptySeq(manager, seq)) {
      const nullable = this.isNullable(regex);
      return manager.getOp(nullable) === OP_SEQ_IN_RE
        ? nullable
        : rewrite(nullable, BR_REWRITE_FULL);
    }
    if (!canBeMember(this.info, seq, regex)) return manager.falseExpr;
    return undefined;
  }

  private reReplaceChar(
    regex: number,
    source: number,
    target: number,
    sourceStr: number,
    targetStr: number,
  ): number {
    const manager = this.manager;
    const replace = (expr: number) =>
      this.reReplaceChar(expr, source, target, sourceStr, targetStr);
    const mkSourceOrTarget = () =>
      this.mkRe(OP_RE_UNION, [
        this.mkRe(OP_SEQ_TO_RE, [sourceStr]),
        this.mkRe(OP_SEQ_TO_RE, [targetStr]),
      ]);
    const seq = this.getUnary(regex, OP_SEQ_TO_RE);
    const chars = seq === -1 ? undefined : manager.getString(seq);
    if (chars !== undefined) {
      const parts: number[] = [];
      for (const code of chars) {
        if (code === source) return mkReEmpty(manager, manager.mkReSort(manager.sorts[seq]));
        parts.push(
          code === target
            ? mkSourceOrTarget()
            : this.mkRe(OP_SEQ_TO_RE, [manager.mkString([code])]),
        );
      }
      if (parts.length === 0) return mkEpsilon(manager, manager.sorts[seq]);
      let result = parts[parts.length - 1];
      for (let index = parts.length - 1; index-- > 0;)
        result = this.mkRe(OP_RE_CONCAT, [parts[index], result]);
      return result;
    }
    const rangeArgs = this.getSplit(regex, OP_RE_RANGE);
    if (rangeArgs !== undefined) {
      const loChars = manager.getString(rangeArgs.head);
      const hiChars = manager.getString(rangeArgs.tail);
      if (loChars?.length !== 1 || hiChars?.length !== 1) return regex;
      const lo = loChars[0];
      const hi = hiChars[0];
      const parts: number[] = [];
      const mkRange = (from: number, to: number) =>
        this.mkRe(OP_RE_RANGE, [manager.mkString([from]), manager.mkString([to])]);
      if (lo <= hi) {
        let previous = lo;
        for (let code = lo; code <= hi; code++) {
          if (code !== source && code !== target) continue;
          if (previous < code) parts.push(mkRange(previous, code - 1));
          if (code === target) parts.push(mkSourceOrTarget());
          previous = code + 1;
        }
        if (previous <= hi) parts.push(mkRange(previous, hi));
      }
      if (parts.length === 0) return this.mkEmptyOf(regex);
      let result = parts[0];
      for (let index = 1; index < parts.length; index++)
        result = this.mkRe(OP_RE_UNION, [result, parts[index]]);
      return result;
    }
    for (const op of [OP_RE_UNION, OP_RE_INTERSECT, OP_RE_CONCAT]) {
      const split = this.getSplit(regex, op);
      if (split === undefined) continue;
      const first = replace(split.head);
      const second = replace(split.tail);
      return this.mkRe(op, [first, second]);
    }
    for (const op of [OP_RE_STAR, OP_RE_PLUS, OP_RE_OPTION]) {
      const body = this.getUnary(regex, op);
      if (body !== -1) return this.mkRe(op, [replace(body)]);
    }
    const loop = getLoopBounds(manager, regex);
    if (loop !== undefined) return mkReLoop(manager, replace(loop.body), loop.lo, loop.hi);
    const loopLower = getLoopLower(manager, regex);
    if (loopLower !== undefined) return mkReLoop(manager, replace(loopLower.body), loopLower.lo);
    if (isReOp(manager, regex, OP_RE_COMPLEMENT))
      throw new SmtInvariantError("a classical regular expression has no complement");
    return regex;
  }

  private liftStrFromToRe(regex: number): number | undefined {
    const seq = this.getUnary(regex, OP_SEQ_TO_RE);
    if (seq !== -1) return seq;
    const ite = this.getIte(regex);
    if (ite === undefined) return undefined;
    const thenSeq = this.liftStrFromToRe(ite[1]);
    if (thenSeq === undefined) return undefined;
    const elseSeq = this.liftStrFromToRe(ite[2]);
    return elseSeq === undefined ? undefined : this.mkRawIte(ite[0], thenSeq, elseSeq);
  }

  private mkStrToRegexp(seq: number): Result {
    const manager = this.manager;
    if (manager.getOp(seq) !== OP_SEQ_AT || manager.getNumArgs(seq) !== 2) return undefined;
    const base = manager.getArg(seq, 0);
    const index = manager.getArg(seq, 1);
    const zero = manager.mkNumeral(0n);
    const isNonNegative = this.mkBool(OP_GE, [index, zero]);
    const isBelowLength = this.mkBool(OP_LT, [index, this.mkRe(OP_SEQ_LENGTH, [base])]);
    const isValid = this.mkBool(OP_AND, [isNonNegative, isBelowLength]);
    const nth = this.mkRe(OP_SEQ_UNIT, [this.mkRe(OP_SEQ_NTH_I, [base, index])]);
    const nonEmpty = this.mkRe(OP_SEQ_TO_RE, [nth]);
    const empty = mkEpsilon(manager, manager.sorts[seq]);
    return rewrite(this.mkRawIte(isValid, nonEmpty, empty), BR_REWRITE_FULL);
  }

  private mkReConcat(inputFirst: number, inputSecond: number): Result {
    const manager = this.manager;
    const isAcceptingEmptyWord = (regex: number) => {
      const info = this.info.getInfo(regex);
      return info.isInterpreted && info.nullable === L_TRUE && info.lo === 0;
    };
    const isStartingWithFullSeq = (regex: number) => {
      const split = this.getSplit(regex, OP_RE_CONCAT);
      return isFullSeq(manager, regex) || (split !== undefined && isFullSeq(manager, split.head));
    };
    const isEndingWithFullSeq = (regex: number) => {
      let current = regex;
      for (
        let split = this.getSplit(current, OP_RE_CONCAT);
        split !== undefined;
        split = this.getSplit(current, OP_RE_CONCAT)
      )
        current = split.tail;
      return isFullSeq(manager, current);
    };
    const isEveryInterArmEndingWithFullSeq = (regex: number) => {
      const todo = [regex];
      while (todo.length > 0) {
        const current = todo.pop()!;
        const split = this.getSplit(current, OP_RE_INTERSECT);
        if (split !== undefined) todo.push(split.head, split.tail);
        else if (!isEndingWithFullSeq(current)) return false;
      }
      return true;
    };
    let first = inputFirst;
    let second = inputSecond;
    const isFirstFull = isFullSeq(manager, first);
    const isSecondFull = isFullSeq(manager, second);
    if (isFirstFull && isSecondFull) return first;
    if (isFirstFull && isAcceptingEmptyWord(second)) return first;
    if (isSecondFull && isAcceptingEmptyWord(first)) return second;
    if (isSecondFull && isEndingWithFullSeq(first)) return first;
    if (isFirstFull && isStartingWithFullSeq(second)) return second;
    const union = this.getSplit(second, OP_RE_UNION);
    if (
      isFirstFull &&
      union !== undefined &&
      (isStartingWithFullSeq(union.head) || isStartingWithFullSeq(union.tail))
    ) {
      const headConcat = this.mkReAppend(first, union.head);
      const tailConcat = this.mkReAppend(first, union.tail);
      return rewrite(this.mkRegexUnionNormalize(headConcat, tailConcat), BR_REWRITE2);
    }
    if (
      this.getSplit(first, OP_RE_INTERSECT) !== undefined &&
      isSecondFull &&
      isEveryInterArmEndingWithFullSeq(first)
    )
      return first;
    if (isReEmpty(manager, first)) return first;
    if (isReEmpty(manager, second)) return second;
    if (isEpsilon(manager, first)) return second;
    if (isEpsilon(manager, second)) return first;
    if (isFullChar(manager, first) && isSecondFull) return this.mkPlus(first);
    if (isFullChar(manager, second) && isFirstFull) return this.mkPlus(second);
    const firstSeq = this.liftStrFromToRe(first);
    const secondSeq = firstSeq === undefined ? undefined : this.liftStrFromToRe(second);
    if (firstSeq !== undefined && secondSeq !== undefined)
      return this.mkToRe(this.mkSeqConcat(firstSeq, secondSeq));
    const firstStar = this.getUnary(first, OP_RE_STAR);
    if (firstStar !== -1) {
      if (this.getUnary(second, OP_RE_STAR) === firstStar) return first;
      const secondConcat = this.getSplit(second, OP_RE_CONCAT);
      if (secondConcat !== undefined && this.getUnary(secondConcat.head, OP_RE_STAR) === firstStar)
        return second;
      if (firstStar === second) return this.mkReAppend(second, first);
    }
    const firstLoop = getLoopBounds(manager, first);
    const secondLoop = getLoopBounds(manager, second);
    if (
      firstLoop !== undefined &&
      firstLoop.lo <= firstLoop.hi &&
      secondLoop !== undefined &&
      secondLoop.lo <= secondLoop.hi &&
      firstLoop.body === secondLoop.body &&
      firstLoop.hi <= UINT_MAX - secondLoop.hi
    )
      return this.mkLoop(
        firstLoop.body,
        firstLoop.lo + secondLoop.lo,
        firstLoop.hi + secondLoop.hi,
      );
    const firstLower = getLoopLower(manager, first);
    const secondLower = getLoopLower(manager, second);
    if (
      firstLower !== undefined &&
      secondLower !== undefined &&
      firstLower.body === secondLower.body &&
      firstLower.lo <= UINT_MAX - secondLower.lo
    )
      return this.mkLoop(firstLower.body, firstLower.lo + secondLower.lo);
    for (let round = 0; round < 2; round++) {
      const lower = getLoopLower(manager, first);
      const bounds = getLoopBounds(manager, first);
      const otherBounds = getLoopBounds(manager, second);
      const otherStar = this.getUnary(second, OP_RE_STAR);
      if (
        lower !== undefined &&
        otherBounds !== undefined &&
        otherBounds.lo <= otherBounds.hi &&
        lower.body === otherBounds.body &&
        lower.lo <= UINT_MAX - otherBounds.lo
      )
        return this.mkLoop(lower.body, lower.lo + otherBounds.lo);
      if (bounds !== undefined && bounds.lo <= bounds.hi && bounds.body === otherStar)
        return this.mkLoop(bounds.body, bounds.lo);
      if (lower !== undefined && lower.body === otherStar) return first;
      if (
        bounds !== undefined &&
        bounds.lo <= bounds.hi &&
        bounds.hi < UINT_MAX &&
        bounds.body === second
      )
        return this.mkLoop(bounds.body, bounds.lo + 1, bounds.hi + 1);
      [first, second] = [second, first];
    }
    const firstIte = this.getIte(first);
    if (firstIte !== undefined) {
      const thenConcat = this.mkReAppend(firstIte[1], second);
      const elseConcat = this.mkReAppend(firstIte[2], second);
      return this.mkBoolIte(firstIte[0], thenConcat, elseConcat);
    }
    const secondIte = this.getIte(second);
    if (secondIte !== undefined) {
      const thenConcat = this.mkReAppend(first, secondIte[1]);
      const elseConcat = this.mkReAppend(first, secondIte[2]);
      return this.mkBoolIte(secondIte[0], thenConcat, elseConcat);
    }
    const concat = this.getSplit(first, OP_RE_CONCAT);
    if (concat !== undefined)
      return this.mkReAppend(concat.head, this.mkReAppend(concat.tail, second));
    return undefined;
  }

  private tryCollapse(first: number, second: number, op: number) {
    const manager = this.manager;
    if (!manager.isReSort(manager.sorts[first])) return undefined;
    const firstRanges = regexToRangePredicate(manager, first);
    if (firstRanges === undefined) return undefined;
    const secondRanges = regexToRangePredicate(manager, second);
    if (secondRanges === undefined) return undefined;
    const ranges =
      op === OP_RE_UNION
        ? uniteRanges(firstRanges, secondRanges)
        : op === OP_RE_INTERSECT
          ? intersectRanges(firstRanges, secondRanges)
          : subtractRanges(firstRanges, secondRanges);
    return rangePredicateToRegex(manager, ranges, this.getSeqSort(first));
  }

  private mkReUnion(first: number, second: number): Result {
    return (
      this.tryCollapse(first, second, OP_RE_UNION) ?? this.mkRegexUnionNormalize(first, second)
    );
  }

  private mkReComplement(regex: number): Result {
    const manager = this.manager;
    const inter = this.getSplit(regex, OP_RE_INTERSECT);
    if (inter !== undefined) {
      const first = this.mkComplement(inter.head);
      const second = this.mkComplement(inter.tail);
      return this.mkUnion(first, second);
    }
    const union = this.getSplit(regex, OP_RE_UNION);
    if (union !== undefined) {
      const first = this.mkComplement(union.head);
      const second = this.mkComplement(union.tail);
      return this.mkInter(first, second);
    }
    if (isReEmpty(manager, regex)) return this.mkFullSeqOf(regex);
    if (isFullSeq(manager, regex)) return this.mkEmptyOf(regex);
    const complement = this.getUnary(regex, OP_RE_COMPLEMENT);
    if (complement !== -1) return complement;
    if (isEpsilon(manager, regex)) return this.mkPlus(mkFullChar(manager, manager.sorts[regex]));
    const ite = this.getIte(regex);
    if (ite === undefined) return undefined;
    const thenComplement = this.mkComplement(ite[1]);
    const elseComplement = this.mkComplement(ite[2]);
    return this.mkBoolIte(ite[0], thenComplement, elseComplement);
  }

  private mkReInter(first: number, second: number): Result {
    return (
      this.tryCollapse(first, second, OP_RE_INTERSECT) ?? this.mkRegexInterNormalize(first, second)
    );
  }

  private mkReDiff(first: number, second: number): Result {
    return (
      this.tryCollapse(first, second, OP_RE_DIFF) ?? this.mkInter(first, this.mkComplement(second))
    );
  }

  private mkReXor0(first: number, second: number): Result {
    if (first === second) return this.mkEmptyOf(first);
    if (isReEmpty(this.manager, first)) return second;
    if (isReEmpty(this.manager, second)) return first;
    return undefined;
  }

  private mkReXor(first: number, second: number): Result {
    const manager = this.manager;
    const reduced = this.mkReXor0(first, second);
    if (reduced !== undefined) return reduced;
    if (isFullSeq(manager, first)) return this.mkComplement(second);
    if (isFullSeq(manager, second)) return this.mkComplement(first);
    const firstComplement = this.getUnary(first, OP_RE_COMPLEMENT);
    const secondComplement = this.getUnary(second, OP_RE_COMPLEMENT);
    if (firstComplement !== -1 && secondComplement !== -1)
      return this.mkReXorSimplified(firstComplement, secondComplement);
    if (firstComplement !== -1)
      return this.mkComplement(this.mkReXorSimplified(firstComplement, second));
    if (secondComplement !== -1)
      return this.mkComplement(this.mkReXorSimplified(first, secondComplement));
    if (manager.ids[first] > manager.ids[second]) return this.mkRe(OP_RE_XOR, [second, first]);
    return undefined;
  }

  private mkReLoop(decl: number, args: number[]): Result {
    const manager = this.manager;
    const body = args[0];
    if (args.length === 2) {
      const lower = manager.getNumeral(args[1]);
      if (lower !== undefined && lower >= 0n && lower <= BigInt(UINT_MAX))
        return this.mkLoop(body, Number(lower));
      if (lower !== undefined && lower < 0n) return this.mkEmptyOf(body);
      return undefined;
    }
    if (args.length === 3) {
      const lower = manager.getNumeral(args[1]);
      const upper = manager.getNumeral(args[2]);
      const isUnsigned = (value: bigint | undefined) =>
        value !== undefined && value >= 0n && value <= BigInt(UINT_MAX);
      return isUnsigned(lower) && isUnsigned(upper)
        ? this.mkLoop(body, Number(lower), Number(upper))
        : undefined;
    }
    if (args.length !== 1) return undefined;
    const parameters = manager.funcDecls[decl].parameters;
    const lo = parameters.length > 0 ? parameters[0] >>> 0 : 0;
    const hi = parameters.length > 1 ? parameters[1] >>> 0 : lo;
    if (parameters.length === 2 && lo > hi) return this.mkEmptyOf(body);
    if (parameters.length === 2 && lo === 0 && hi === 0)
      return this.mkToRe(mkEmptySeq(manager, this.getSeqSort(body)));
    if (parameters.length === 1 && lo === 0) return this.mkStar(body);
    if (parameters.length === 2 && lo === 1 && hi === 1) return body;
    const innerLower = getLoopLower(manager, body);
    if (
      innerLower !== undefined &&
      parameters.length === 1 &&
      (innerLower.lo === 0 || lo <= Math.floor(UINT_MAX / innerLower.lo))
    )
      return this.mkLoop(innerLower.body, lo * innerLower.lo);
    const inner = getLoopBounds(manager, body);
    if (
      inner !== undefined &&
      parameters.length === 2 &&
      inner.lo === inner.hi &&
      lo === hi &&
      (inner.lo === 0 || lo <= Math.floor(UINT_MAX / inner.lo))
    )
      return this.mkLoop(inner.body, lo * inner.lo, hi * inner.hi);
    return undefined;
  }

  private mkReStar(regex: number): Result {
    const manager = this.manager;
    if (isReOp(manager, regex, OP_RE_STAR) || isFullSeq(manager, regex)) return regex;
    if (isFullChar(manager, regex)) return this.mkFullSeqOf(regex);
    if (isReEmpty(manager, regex)) return this.mkToRe(mkEmptySeq(manager, this.getSeqSort(regex)));
    if (isEpsilon(manager, regex)) return regex;
    const plus = this.getUnary(regex, OP_RE_PLUS);
    if (plus !== -1) return isFullChar(manager, plus) ? this.mkFullSeqOf(regex) : this.mkStar(plus);
    const union = this.getSplit(regex, OP_RE_UNION);
    if (union !== undefined) {
      const headStar = this.getUnary(union.head, OP_RE_STAR);
      if (headStar !== -1) return this.mkStar(this.mkUnion(headStar, union.tail));
      const tailStar = this.getUnary(union.tail, OP_RE_STAR);
      if (tailStar !== -1) return this.mkStar(this.mkUnion(union.head, tailStar));
      if (isEpsilon(manager, union.head)) return this.mkStar(union.tail);
      if (isEpsilon(manager, union.tail)) return this.mkStar(union.head);
    }
    const concat = this.getSplit(regex, OP_RE_CONCAT);
    if (concat !== undefined) {
      const headStar = this.getUnary(concat.head, OP_RE_STAR);
      const tailStar = this.getUnary(concat.tail, OP_RE_STAR);
      if (headStar !== -1 && tailStar !== -1) return this.mkStar(this.mkUnion(headStar, tailStar));
      if (isFullSeq(manager, concat.head))
        return this.mkUnion(mkEpsilon(manager, this.getSeqSort(regex)), regex);
    }
    const ite = this.getIte(regex);
    if (ite === undefined) return undefined;
    const isFullCharOrSeq = (expr: number) => isFullChar(manager, expr) || isFullSeq(manager, expr);
    if (isFullCharOrSeq(ite[1]) && isFullCharOrSeq(ite[2]))
      return rewrite(this.mkFullSeqOf(ite[1]), BR_REWRITE2);
    const thenStar = this.mkStar(ite[1]);
    const elseStar = this.mkStar(ite[2]);
    return this.mkBoolIte(ite[0], thenStar, elseStar);
  }

  private getRangeBound(bound: number) {
    const manager = this.manager;
    const chars = manager.getString(bound);
    if (chars !== undefined && chars.length === 1) return chars[0];
    return manager.getOp(bound) === OP_SEQ_UNIT ? manager.getChar(manager.getArg(bound, 0)) : -1;
  }

  private mkReRange(lo: number, hi: number): Result {
    const manager = this.manager;
    const isNeverChar = (bound: number) => {
      const maxLength = this.seq.getMaxLength(bound);
      return (
        this.seq.getMinLength([bound]).length > 1 ||
        (maxLength.isBounded && maxLength.length === 0n)
      );
    };
    const isLoEmpty = isNeverChar(lo);
    if (isLoEmpty || isNeverChar(hi))
      return mkReEmpty(manager, manager.mkReSort(manager.sorts[lo]));
    const loChar = this.getRangeBound(lo);
    const hiChar = this.getRangeBound(hi);
    if (loChar === -1 || hiChar === -1) return undefined;
    if (loChar > hiChar) return mkReEmpty(manager, manager.mkReSort(manager.sorts[lo]));
    if (loChar === hiChar) return this.mkRe(OP_SEQ_TO_RE, [manager.mkString([loChar])]);
    return undefined;
  }

  private mkRePlus(regex: number): Result {
    const manager = this.manager;
    if (isFullChar(manager, regex)) return undefined;
    if (
      isReEmpty(manager, regex) ||
      isFullSeq(manager, regex) ||
      isEpsilon(manager, regex) ||
      isReOp(manager, regex, OP_RE_PLUS) ||
      isReOp(manager, regex, OP_RE_STAR)
    )
      return regex;
    return this.mkReAppend(regex, this.mkStar(regex));
  }

  private mkReOpt(regex: number): Result {
    return this.mkUnion(this.mkToRe(mkEmptySeq(this.manager, this.getSeqSort(regex))), regex);
  }

  elimCondition(element: number, inputCondition: number) {
    const manager = this.manager;
    const maxChar = getMaxChar();
    const conds = new RefVector(manager);
    const rangeConds = new RefVector(manager);
    conds.push(inputCondition);
    flattenAndVector(manager, conds);
    let isAllRanges = false;
    if (manager.isCharSort(manager.sorts[element])) {
      isAllRanges = true;
      let ranges = [0, maxChar];
      const intersect = (lo: number, hi: number, current: number[]) => {
        const result: number[] = [];
        for (let index = 0; index < current.length; index += 2) {
          if (hi < current[index]) break;
          if (current[index + 1] >= lo)
            result.push(Math.max(current[index], lo), Math.min(current[index + 1], hi));
        }
        return result;
      };
      const excludeRange = (lower: number, upper: number) => {
        if (lower === 0) ranges = upper === maxChar ? [] : intersect(upper + 1, maxChar, ranges);
        else if (upper === maxChar) ranges = intersect(0, lower - 1, ranges);
        else
          ranges = [...intersect(0, lower - 1, ranges), ...intersect(upper + 1, maxChar, ranges)];
      };
      const getConstChars = (expr: number, op: number) => {
        if (manager.getOp(expr) !== op || manager.getNumArgs(expr) !== 2) return undefined;
        const first = manager.getChar(manager.getArg(expr, 0));
        const second = manager.getChar(manager.getArg(expr, 1));
        return first !== -1 && second !== -1 ? [first, second] : undefined;
      };
      const isSelfEq = (expr: number) =>
        manager.getOp(expr) === OP_EQ && manager.getArg(expr, 0) === manager.getArg(expr, 1);
      for (const cond of conds.items) {
        const range = getCharConstRange(manager, element, cond);
        const negated = manager.getOp(cond) === OP_NOT ? manager.getArg(cond, 0) : -1;
        const charsEq = negated === -1 ? undefined : getConstChars(negated, OP_EQ);
        const charsLe = getConstChars(cond, OP_CHAR_LE);
        const negatedCharsLe = negated === -1 ? undefined : getConstChars(negated, OP_CHAR_LE);
        if (range !== undefined) {
          if (range.lo > range.hi) {
            if (range.isNegated) continue;
            ranges = [];
          } else if (range.isNegated) excludeRange(range.lo, range.hi);
          else ranges = intersect(range.lo, range.hi, ranges);
          rangeConds.push(cond);
        } else if (manager.isTrue(cond) || isSelfEq(cond)) continue;
        else if (charsEq !== undefined && charsEq[0] !== charsEq[1]) continue;
        else if (charsLe !== undefined && charsLe[0] <= charsLe[1]) continue;
        else if (negatedCharsLe !== undefined && negatedCharsLe[0] > negatedCharsLe[1]) continue;
        else if (
          manager.isFalse(cond) ||
          (negated !== -1 && isSelfEq(negated)) ||
          charsLe !== undefined ||
          negatedCharsLe !== undefined
        )
          ranges = [];
        else {
          isAllRanges = false;
          break;
        }
        if (ranges.length === 0) break;
      }
      if (isAllRanges) {
        const trivial =
          ranges.length === 0
            ? manager.falseExpr
            : manager.isUninterpretedConst(element)
              ? manager.trueExpr
              : -1;
        if (trivial !== -1) {
          rangeConds.reset();
          conds.reset();
          return trivial;
        }
        conds.reset();
        for (const cond of rangeConds.items) conds.push(cond);
      }
    }
    let solution = -1;
    for (const cond of conds.items) {
      if (manager.getOp(cond) !== OP_EQ) continue;
      const lhs = manager.getArg(cond, 0);
      const rhs = manager.getArg(cond, 1);
      if (lhs !== element && rhs !== element) continue;
      solution = rhs === element ? lhs : rhs;
      break;
    }
    let result = inputCondition;
    if (solution !== -1) {
      const replace = new ExprSafeReplace(manager);
      replace.insert(element, solution);
      result = replace.apply(inputCondition);
      replace.release();
      manager.releaseLater(result);
      if (!manager.isUninterpretedConst(element))
        result = this.mkBool(OP_AND, [manager.mkEq(element, solution), result]);
    } else if (isAllRanges)
      result =
        conds.size === 0
          ? manager.trueExpr
          : conds.size === 1
            ? conds.items[0]
            : this.mkBool(OP_AND, [...conds.items]);
    rangeConds.reset();
    conds.reset();
    return result;
  }

  private reduceReIsEmpty(regex: number): Result {
    const manager = this.manager;
    const union = this.getSplit(regex, OP_RE_UNION);
    if (union !== undefined) {
      const first = this.mkEqEmpty(union.head);
      const second = this.mkEqEmpty(union.tail);
      return rewrite(this.mkBool(OP_AND, [first, second]), BR_REWRITE2);
    }
    if (
      isReOp(manager, regex, OP_RE_STAR) ||
      isReOp(manager, regex, OP_SEQ_TO_RE) ||
      isFullChar(manager, regex) ||
      isFullSeq(manager, regex)
    )
      return manager.falseExpr;
    const concat = this.getSplit(regex, OP_RE_CONCAT);
    if (concat !== undefined) {
      const first = this.mkEqEmpty(concat.head);
      const second = this.mkEqEmpty(concat.tail);
      return rewrite(this.mkBool(OP_OR, [first, second]), BR_REWRITE2);
    }
    const range = this.getSplit(regex, OP_RE_RANGE);
    if (range !== undefined) {
      const loChars = manager.getString(range.head);
      const hiChars = manager.getString(range.tail);
      if (loChars?.length === 1 && hiChars?.length === 1)
        return loChars[0] > hiChars[0] ? manager.trueExpr : manager.falseExpr;
      if (loChars !== undefined && loChars.length !== 1) return manager.trueExpr;
      if (hiChars !== undefined && hiChars.length !== 1) return manager.trueExpr;
    }
    const loop = getLoopLower(manager, regex) ?? getLoopBounds(manager, regex);
    if (loop !== undefined && loop.lo === 0) return manager.falseExpr;
    if (loop !== undefined && loop.lo <= loop.hi)
      return rewrite(this.mkEqEmpty(loop.body), BR_REWRITE1);
    const inter = this.getSplit(regex, OP_RE_INTERSECT);
    if (inter === undefined) return undefined;
    for (const [union, other] of [
      [inter.head, inter.tail],
      [inter.tail, inter.head],
    ]) {
      const split = this.getSplit(union, OP_RE_UNION);
      if (split === undefined) continue;
      const first = this.mkRe(OP_RE_INTERSECT, [split.head, other]);
      const second = this.mkRe(OP_RE_INTERSECT, [split.tail, other]);
      return rewrite(this.mkEqEmpty(this.mkRe(OP_RE_UNION, [first, second])), BR_REWRITE3);
    }
    return undefined;
  }

  reduceReEq(inputLeft: number, inputRight: number): Result {
    const manager = this.manager;
    const isSwapped = isReEmpty(manager, inputLeft);
    const left = isSwapped ? inputRight : inputLeft;
    const right = isSwapped ? inputLeft : inputRight;
    if (isReEmpty(manager, right)) return this.reduceReIsEmpty(left);
    if (left === right) return manager.trueExpr;
    if (this.isInBisim || !isReGround(this.info, left) || !isReGround(this.info, right))
      return undefined;
    this.isInBisim = true;
    const bisim = new RegexBisim(manager, this);
    const status = bisim.areEquivalent(left, right);
    bisim.release();
    this.isInBisim = false;
    return status === L_TRUE
      ? manager.trueExpr
      : status === L_FALSE
        ? manager.falseExpr
        : undefined;
  }

  someStringInRe(regex: number) {
    const witness = new RegexWitness(this.manager, this);
    const result = witness.getWitness(regex);
    witness.release();
    return result;
  }
}

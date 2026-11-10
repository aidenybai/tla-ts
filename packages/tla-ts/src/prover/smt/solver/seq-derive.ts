// Ported from Z3 (src/ast/rewriter/seq_derive.cpp, src/ast/rewriter/bool_rewriter.cpp), MIT
// license, see z3-license.txt.
import { mkArrayApp } from "./array-decl-plugin";
import {
  type AstManager,
  KIND_APP,
  OP_AND,
  OP_CHAR_LE,
  OP_EQ,
  OP_GE,
  OP_ITE,
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
  OP_RE_RANGE,
  OP_RE_REVERSE,
  OP_RE_STAR,
  OP_RE_UNION,
  OP_RE_XOR,
  OP_SELECT,
  OP_SEQ_CONCAT,
  OP_SEQ_EXTRACT,
  OP_SEQ_IN_RE,
  OP_SEQ_LENGTH,
  OP_SEQ_NTH_I,
  OP_SEQ_TO_RE,
  OP_SEQ_UNIT,
  OP_STRING_ITOS,
  OP_SUB,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { assign } from "./expr-ref";
import { ExprSafeReplace } from "./expr-safe-replace";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { KERNEL_REWRITER_OPTIONS, Rewriter } from "./rewriter";
import { isEmptySeq, mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import {
  getCharConstRange,
  getLoopBounds,
  getLoopLower,
  getMaxChar,
  ReInfoCache,
  getUnitStringChar,
  isDotPlus,
  isEpsilon,
  isFullChar,
  isFullSeq,
  isReBinary,
  isReEmpty,
  isReOp,
  isReUnary,
  mkCharLe,
  mkFullSeq,
  mkReEmpty,
} from "./seq-re-util";
import { type ReRewriter, getResultExpr } from "./seq-re-rewriter";

export const DERIVATIVE_ANTIMIROV = 0;
export const DERIVATIVE_BRZOZOWSKI = 1;
export const TRANSITION_BRZOZOWSKI = 0;
export const TRANSITION_LIGHT_ANTIMIROV = 1;

const MAX_DEPTH = 512;
const MAX_TRAIL_SIZE = 500000;
const MAX_OP_TRAIL_SIZE = 100000;

type PairMap = Map<number, Map<number, number>>;
type TripleMap = Map<number, PairMap>;

const getPair = (map: PairMap, first: number, second: number) => map.get(first)?.get(second);

const setPair = (map: PairMap, first: number, second: number, value: number) => {
  const inner = map.get(first);
  if (inner === undefined) map.set(first, new Map([[second, value]]));
  else inner.set(second, value);
};

const getTriple = (map: TripleMap, first: number, second: number, third: number) =>
  map.get(first)?.get(second)?.get(third);

const setTriple = (map: TripleMap, first: number, second: number, third: number, value: number) => {
  const inner = map.get(first);
  if (inner === undefined) map.set(first, new Map([[second, new Map([[third, value]])]]));
  else setPair(inner, second, third, value);
};

const mkPairMaps = (): PairMap[] => [new Map(), new Map()];
const mkTripleMaps = (): TripleMap[] => [new Map(), new Map()];

interface Decomposed {
  condition: number;
  thenExpr: number;
  elseExpr: number;
}

class CofactorCache {
  readonly cofactors = new Map<number, RefVector>();
  private pins: RefVector;

  constructor(manager: AstManager) {
    this.pins = new RefVector(manager);
  }

  insert(regex: number, cofactors: RefVector) {
    this.pins.push(regex);
    this.cofactors.set(regex, cofactors);
  }

  reset() {
    for (const cofactors of this.cofactors.values()) cofactors.reset();
    this.cofactors.clear();
    this.pins.reset();
  }

  maybeReset(cap: number) {
    if (this.cofactors.size > cap) this.reset();
  }
}

export class Derive {
  private bool: Rewriter;
  private info: ReInfoCache;
  private caches = mkPairMaps();
  private topCaches = mkPairMaps();
  private unionCaches = mkTripleMaps();
  private interCaches = mkTripleMaps();
  private xorCaches = mkTripleMaps();
  private concatCaches = mkPairMaps();
  private complementCaches = mkPairMaps();
  private trail: RefVector;
  private brzCofactorCache: CofactorCache;
  private antCofactorCache: CofactorCache;
  private firstReplace: ExprSafeReplace;
  private secondReplace: ExprSafeReplace;
  private depth = 0;
  private kind = DERIVATIVE_ANTIMIROV;
  private element = -1;
  private pathConds: number[] = [];
  private pathSigns: boolean[] = [];
  private intervals: number[] = [];
  private intervalsStart = 0;
  private pathStack: number[] = [];
  private pathExpr = -1;

  constructor(
    private manager: AstManager,
    private re: ReRewriter,
  ) {
    this.bool = new Rewriter(manager, { ...KERNEL_REWRITER_OPTIONS, isFlatAndOr: false });
    this.info = new ReInfoCache(manager);
    this.trail = new RefVector(manager);
    this.brzCofactorCache = new CofactorCache(manager);
    this.antCofactorCache = new CofactorCache(manager);
    this.firstReplace = new ExprSafeReplace(manager);
    this.secondReplace = new ExprSafeReplace(manager);
  }

  release() {
    this.pathExpr = assign(this.manager, this.pathExpr, -1);
    this.element = assign(this.manager, this.element, -1);
    this.antCofactorCache.reset();
    this.brzCofactorCache.reset();
    this.trail.reset();
    this.secondReplace.release();
    this.firstReplace.release();
    this.bool.release();
    this.info.release();
  }

  private reset() {
    for (const cache of [...this.caches, ...this.topCaches]) cache.clear();
    this.resetOpCaches();
    this.trail.reset();
    this.element = assign(this.manager, this.element, -1);
  }

  private resetOpCaches() {
    for (const cache of [
      this.unionCaches[DERIVATIVE_ANTIMIROV],
      this.interCaches[DERIVATIVE_ANTIMIROV],
      this.concatCaches[DERIVATIVE_ANTIMIROV],
      this.complementCaches[DERIVATIVE_ANTIMIROV],
      this.unionCaches[DERIVATIVE_BRZOZOWSKI],
      this.interCaches[DERIVATIVE_BRZOZOWSKI],
      this.concatCaches[DERIVATIVE_BRZOZOWSKI],
      this.complementCaches[DERIVATIVE_BRZOZOWSKI],
    ])
      cache.clear();
    this.element = assign(this.manager, this.element, -1);
  }

  private resetPath() {
    this.pathConds.length = 0;
    this.pathSigns.length = 0;
    this.intervals = [0, getMaxChar()];
    this.intervalsStart = 0;
    this.pathExpr = assign(this.manager, this.pathExpr, this.manager.trueExpr);
  }

  derive(kind: number, element: number, regex: number) {
    const manager = this.manager;
    this.kind = kind;
    if (this.trail.size > MAX_TRAIL_SIZE) this.reset();
    else if (this.trail.size > MAX_OP_TRAIL_SIZE || element !== this.element) this.resetOpCaches();
    const cached = getPair(this.topCaches[kind], element, regex);
    if (cached !== undefined) return cached;
    this.trail.push(element);
    this.trail.push(regex);
    this.element = assign(manager, this.element, element);
    this.depth = 0;
    this.resetPath();
    const result = this.deriveRec(regex);
    setPair(this.topCaches[kind], element, regex, result);
    this.trail.push(result);
    return result;
  }

  deriveSymbolic(kind: number, regex: number) {
    const manager = this.manager;
    const elementSort = manager.getSeqElementSort(manager.getReSeqSort(manager.sorts[regex]));
    return this.derive(kind, manager.mkVar(0, elementSort), regex);
  }

  isNullable(regex: number): number {
    const manager = this.manager;
    const bool = this.bool;
    const isRe = manager.isReSort(manager.sorts[regex]);
    if (isRe) {
      const nullable = this.info.getInfo(regex).nullable;
      if (nullable === L_TRUE) return manager.trueExpr;
      if (nullable === L_FALSE) return manager.falseExpr;
    }
    const first =
      manager.kinds[regex] === KIND_APP && manager.getNumArgs(regex) > 0
        ? manager.getArg(regex, 0)
        : -1;
    const second =
      manager.kinds[regex] === KIND_APP && manager.getNumArgs(regex) > 1
        ? manager.getArg(regex, 1)
        : -1;
    if (isReBinary(manager, regex, OP_RE_CONCAT) || isReBinary(manager, regex, OP_RE_INTERSECT)) {
      const firstNullable = this.isNullable(first);
      return bool.mkAnd([firstNullable, this.isNullable(second)]);
    }
    if (isReBinary(manager, regex, OP_RE_UNION)) {
      const firstNullable = this.isNullable(first);
      return bool.mkOr([firstNullable, this.isNullable(second)]);
    }
    if (isReBinary(manager, regex, OP_RE_DIFF)) {
      const negated = bool.mkNot(this.isNullable(second));
      return bool.mkAnd([negated, this.isNullable(first)]);
    }
    if (isReBinary(manager, regex, OP_RE_XOR)) {
      const firstNullable = this.isNullable(first);
      return bool.mkEq(bool.mkNot(firstNullable), this.isNullable(second));
    }
    const loop = getLoopLower(manager, regex) ?? getLoopBounds(manager, regex);
    if (
      isReOp(manager, regex, OP_RE_STAR) ||
      isReOp(manager, regex, OP_RE_OPTION) ||
      isFullSeq(manager, regex) ||
      isEpsilon(manager, regex) ||
      loop?.lo === 0
    )
      return manager.trueExpr;
    if (
      isFullChar(manager, regex) ||
      isReEmpty(manager, regex) ||
      isReOp(manager, regex, OP_RE_OF_PRED) ||
      isReOp(manager, regex, OP_RE_RANGE)
    )
      return manager.falseExpr;
    if (
      isReUnary(manager, regex, OP_RE_PLUS) ||
      loop !== undefined ||
      isReUnary(manager, regex, OP_RE_REVERSE)
    )
      return this.isNullable(first);
    if (isReUnary(manager, regex, OP_RE_COMPLEMENT)) return bool.mkNot(this.isNullable(first));
    if (isReUnary(manager, regex, OP_SEQ_TO_RE)) return this.isNullable(first);
    if (manager.getOp(regex) === OP_ITE) {
      const thenNullable = this.isNullable(second);
      const elseNullable = this.isNullable(manager.getArg(regex, 2));
      return getResultExpr(bool.mkIte(first, thenNullable, elseNullable));
    }
    if (isRe)
      return this.isNullableSymbolicRegex(regex, manager.getReSeqSort(manager.sorts[regex]));
    if (isReBinary(manager, regex, OP_SEQ_CONCAT)) {
      const firstNullable = this.isNullable(first);
      return bool.mkAnd([firstNullable, this.isNullable(second)]);
    }
    if (isEmptySeq(manager, regex)) return manager.trueExpr;
    if (manager.getOp(regex) === OP_SEQ_UNIT) return manager.falseExpr;
    if (manager.getString(regex) !== undefined) return manager.falseExpr;
    return manager.mkEq(mkEmptySeq(manager, manager.sorts[regex]), regex);
  }

  private isNullableSymbolicRegex(regex: number, seqSort: number) {
    const manager = this.manager;
    let elements = mkEmptySeq(manager, seqSort);
    let current = regex;
    while (isReBinary(manager, current, OP_RE_DERIVATIVE)) {
      const unit = mkSeqApp(manager, OP_SEQ_UNIT, [manager.getArg(current, 0)]);
      elements = isEmptySeq(manager, elements)
        ? unit
        : mkSeqApp(manager, OP_SEQ_CONCAT, [unit, elements]);
      current = manager.getArg(current, 1);
    }
    if (isReUnary(manager, current, OP_SEQ_TO_RE))
      return manager.mkEq(elements, manager.getArg(current, 0));
    return mkSeqApp(manager, OP_SEQ_IN_RE, [mkEmptySeq(manager, seqSort), regex]);
  }

  private deriveRec(regex: number): number {
    const cached = getPair(this.caches[this.kind], this.element, regex);
    if (cached !== undefined) return cached;
    if (this.depth >= MAX_DEPTH) return this.mkStuckDerivative(regex);
    this.depth++;
    const result = this.deriveCore(regex);
    this.depth--;
    setPair(this.caches[this.kind], this.element, regex, result);
    this.trail.push(this.element);
    this.trail.push(regex);
    this.trail.push(result);
    return result;
  }

  private mkStuckDerivative(regex: number) {
    return mkSeqApp(this.manager, OP_RE_DERIVATIVE, [this.element, regex]);
  }

  private deriveCore(regex: number): number {
    const manager = this.manager;
    const re = this.re;
    const sort = manager.sorts[regex];
    const seqSort = manager.getReSeqSort(sort);
    const nothing = () => mkReEmpty(manager, sort);
    if (isReEmpty(manager, regex) || isEpsilon(manager, regex)) return nothing();
    if (isFullSeq(manager, regex) || isDotPlus(manager, regex)) return mkFullSeq(manager, sort);
    if (isFullChar(manager, regex)) return re.mkToRe(mkEmptySeq(manager, seqSort));
    const numArgs = manager.kinds[regex] === KIND_APP ? manager.getNumArgs(regex) : 0;
    const first = numArgs > 0 ? manager.getArg(regex, 0) : -1;
    const second = numArgs > 1 ? manager.getArg(regex, 1) : -1;
    if (isReUnary(manager, regex, OP_SEQ_TO_RE)) return this.deriveToRe(first, seqSort);
    if (isReBinary(manager, regex, OP_RE_RANGE)) return this.deriveRange(first, second, seqSort);
    if (isReUnary(manager, regex, OP_RE_OF_PRED)) return this.deriveOfPred(first, seqSort);
    if (isReBinary(manager, regex, OP_RE_CONCAT)) {
      if (isReOp(manager, first, OP_RE_CONCAT)) {
        const normalized = this.mkConcat(first, second);
        if (normalized !== regex) return this.deriveRec(normalized);
      }
      const firstDerivative = this.deriveRec(first);
      const concat = this.mkDerivConcat(firstDerivative, second);
      const nullable = this.isNullable(first);
      if (manager.isTrue(nullable)) return this.mkUnion(concat, this.deriveRec(second));
      if (manager.isFalse(nullable)) return concat;
      const secondDerivative = this.deriveRec(second);
      const guarded = this.mkIte(nullable, secondDerivative, nothing());
      return this.mkUnion(concat, guarded);
    }
    for (const op of [OP_RE_UNION, OP_RE_XOR, OP_RE_INTERSECT]) {
      if (!isReBinary(manager, regex, op)) continue;
      const firstDerivative = this.deriveRec(first);
      const secondDerivative = this.deriveRec(second);
      return op === OP_RE_UNION
        ? this.mkUnion(firstDerivative, secondDerivative)
        : op === OP_RE_XOR
          ? this.mkXor(firstDerivative, secondDerivative)
          : this.mkInter(firstDerivative, secondDerivative);
    }
    for (const op of [OP_RE_UNION, OP_RE_INTERSECT, OP_RE_CONCAT, OP_RE_XOR])
      if (isReUnary(manager, regex, op)) return this.deriveRec(first);
    if (isReUnary(manager, regex, OP_RE_COMPLEMENT))
      return this.mkComplement(this.deriveRec(first));
    if (isReUnary(manager, regex, OP_RE_STAR) || isReUnary(manager, regex, OP_RE_PLUS)) {
      const firstDerivative = this.deriveRec(first);
      return this.mkDerivConcat(firstDerivative, re.mkStar(first));
    }
    if (isReUnary(manager, regex, OP_RE_OPTION)) return this.deriveRec(first);
    const bounds = getLoopBounds(manager, regex);
    if (bounds !== undefined) {
      if (bounds.hi === 0 || bounds.hi < bounds.lo) return nothing();
      const firstDerivative = this.deriveRec(bounds.body);
      const tail = re.mkLoop(bounds.body, bounds.lo === 0 ? 0 : bounds.lo - 1, bounds.hi - 1);
      return this.mkDerivConcat(firstDerivative, tail);
    }
    const lower = getLoopLower(manager, regex);
    if (lower !== undefined) {
      const firstDerivative = this.deriveRec(lower.body);
      const tail = re.mkLoop(lower.body, lower.lo === 0 ? 0 : lower.lo - 1);
      return this.mkDerivConcat(firstDerivative, tail);
    }
    if (isReOp(manager, regex, OP_RE_LOOP)) {
      const getUnsigned = (expr: number) => {
        const value = manager.getNumeral(expr);
        return value !== undefined && value >= 0n && value <= 0xffffffffn ? Number(value) : -1;
      };
      if (
        numArgs === 3 &&
        getUnsigned(second) !== -1 &&
        getUnsigned(manager.getArg(regex, 2)) !== -1
      )
        return this.deriveRec(
          re.mkLoop(first, getUnsigned(second), getUnsigned(manager.getArg(regex, 2))),
        );
      if (numArgs === 2 && getUnsigned(second) !== -1)
        return this.deriveRec(re.mkLoop(first, getUnsigned(second)));
    }
    if (isReBinary(manager, regex, OP_RE_DIFF)) {
      const firstDerivative = this.deriveRec(first);
      const secondDerivative = this.deriveRec(second);
      return this.mkInter(firstDerivative, this.mkComplement(secondDerivative));
    }
    if (manager.getOp(regex) === OP_ITE) {
      const thenDerivative = this.deriveRec(second);
      const elseDerivative = this.deriveRec(manager.getArg(regex, 2));
      return this.mkIte(first, thenDerivative, elseDerivative);
    }
    if (isReUnary(manager, regex, OP_RE_REVERSE)) {
      const normalized = re.mkReverse(first);
      if (normalized !== regex) return this.deriveRec(normalized);
    }
    return this.mkStuckDerivative(regex);
  }

  private mkEqElement(expr: number) {
    return this.manager.mkEq(this.element, expr);
  }

  private mkRestAfterFirst(seq: number) {
    const manager = this.manager;
    const one = manager.mkNumeral(1n);
    const length = mkSeqApp(manager, OP_SEQ_LENGTH, [seq]);
    const restLength = manager.mkApp(OP_SUB, [length, one], SORT_INT);
    return mkSeqApp(manager, OP_SEQ_EXTRACT, [seq, one, restLength]);
  }

  private deriveToRe(seq: number, seqSort: number) {
    const manager = this.manager;
    const re = this.re;
    const reSort = manager.mkReSort(seqSort);
    if (isEmptySeq(manager, seq)) return mkReEmpty(manager, reSort);
    const chars = manager.getString(seq);
    if (chars !== undefined) {
      const condition = this.mkEqElement(manager.mkChar(chars[0]));
      const tail = re.mkToRe(manager.mkString(chars.slice(1)));
      return this.mkIte(condition, tail, mkReEmpty(manager, reSort));
    }
    if (manager.getOp(seq) === OP_SEQ_UNIT) {
      const epsilon = re.mkToRe(mkEmptySeq(manager, seqSort));
      const empty = mkReEmpty(manager, reSort);
      return this.mkIte(this.mkEqElement(manager.getArg(seq, 0)), epsilon, empty);
    }
    if (isReBinary(manager, seq, OP_SEQ_CONCAT)) {
      const split = this.getHeadTail(manager.getArg(seq, 0), manager.getArg(seq, 1));
      if (split !== undefined) {
        const condition = this.mkEqElement(split[0]);
        const tail = re.mkToRe(split[1]);
        return this.mkIte(condition, tail, mkReEmpty(manager, reSort));
      }
    }
    if (manager.getOp(seq) === OP_STRING_ITOS) {
      const empty = mkReEmpty(manager, reSort);
      const isNonNegative = manager.mkApp(
        OP_GE,
        [manager.getArg(seq, 0), manager.mkNumeral(0n)],
        SORT_BOOL,
      );
      const zeroChar = manager.mkChar(48);
      const nineChar = manager.mkChar(57);
      const isAboveZero = mkCharLe(manager, zeroChar, this.element);
      const isBelowNine = mkCharLe(manager, this.element, nineChar);
      const isDigit = manager.mkApp(OP_AND, [isAboveZero, isBelowNine], SORT_BOOL);
      const zero = manager.mkNumeral(0n);
      const isFirst = this.mkEqElement(mkSeqApp(manager, OP_SEQ_NTH_I, [seq, zero]));
      const guard = manager.mkApp(
        OP_AND,
        [isNonNegative, manager.mkApp(OP_AND, [isDigit, isFirst], SORT_BOOL)],
        SORT_BOOL,
      );
      return this.mkIte(guard, re.mkToRe(this.mkRestAfterFirst(seq)), empty);
    }
    const isNonEmpty = manager.mkApp(
      OP_NOT,
      [manager.mkEq(seq, mkEmptySeq(manager, seqSort))],
      SORT_BOOL,
    );
    const zero = manager.mkNumeral(0n);
    const isFirst = this.mkEqElement(mkSeqApp(manager, OP_SEQ_NTH_I, [seq, zero]));
    const guard = manager.mkApp(OP_AND, [isNonEmpty, isFirst], SORT_BOOL);
    const rest = re.mkToRe(this.mkRestAfterFirst(seq));
    return this.mkIte(guard, rest, mkReEmpty(manager, reSort));
  }

  private deriveRange(lo: number, hi: number, seqSort: number) {
    const manager = this.manager;
    const reSort = manager.mkReSort(seqSort);
    const empty = mkReEmpty(manager, reSort);
    const epsilon = this.re.mkToRe(mkEmptySeq(manager, seqSort));
    const loUnit = getUnitStringChar(manager, lo);
    const hiUnit = loUnit === -1 ? -1 : getUnitStringChar(manager, hi);
    if (loUnit !== -1 && hiUnit !== -1) {
      const isLoTrivial = manager.getChar(loUnit) === 0;
      const isHiTrivial = manager.getChar(hiUnit) === getMaxChar();
      if (isLoTrivial && isHiTrivial) return epsilon;
      const isInRange = isLoTrivial
        ? mkCharLe(manager, this.element, hiUnit)
        : isHiTrivial
          ? mkCharLe(manager, loUnit, this.element)
          : manager.mkApp(
              OP_AND,
              [mkCharLe(manager, loUnit, this.element), mkCharLe(manager, this.element, hiUnit)],
              SORT_BOOL,
            );
      return this.mkIte(isInRange, epsilon, empty);
    }
    const conds: number[] = [];
    const zero = manager.mkNumeral(0n);
    const getBound = (bound: number) => {
      const unit = getUnitStringChar(manager, bound);
      if (unit !== -1) return unit;
      const length = mkSeqApp(manager, OP_SEQ_LENGTH, [bound]);
      conds.push(manager.mkEq(length, manager.mkNumeral(1n)));
      return mkSeqApp(manager, OP_SEQ_NTH_I, [bound, zero]);
    };
    const loChar = getBound(lo);
    const hiChar = getBound(hi);
    conds.push(mkCharLe(manager, loChar, this.element));
    conds.push(mkCharLe(manager, this.element, hiChar));
    return this.mkIte(this.bool.mkAnd(conds), epsilon, empty);
  }

  private deriveOfPred(predicate: number, seqSort: number) {
    const manager = this.manager;
    const empty = mkReEmpty(manager, manager.mkReSort(seqSort));
    const epsilon = this.re.mkToRe(mkEmptySeq(manager, seqSort));
    const condition = mkArrayApp(manager, OP_SELECT, [predicate, this.element]);
    return this.mkIte(condition, epsilon, empty);
  }

  private getHeadTail(first: number, second: number): [number, number] | undefined {
    const manager = this.manager;
    if (manager.getOp(first) === OP_SEQ_UNIT) return [manager.getArg(first, 0), second];
    if (isReBinary(manager, first, OP_SEQ_CONCAT)) {
      const tail = this.re.mkSeqConcat(manager.getArg(first, 1), second);
      return this.getHeadTail(manager.getArg(first, 0), tail);
    }
    const chars = manager.getString(first);
    if (chars === undefined || chars.length === 0) return undefined;
    const head = manager.mkChar(chars[0]);
    return [
      head,
      chars.length === 1 ? second : this.re.mkSeqConcat(manager.mkString(chars.slice(1)), second),
    ];
  }

  private isPredImplying(
    isFirstNegated: boolean,
    first: number,
    isSecondNegated: boolean,
    second: number,
  ): boolean {
    if (first === second) return isFirstNegated === isSecondNegated;
    if (isFirstNegated && isSecondNegated) return this.isPredImplying(false, second, false, first);
    const manager = this.manager;
    const firstRange = getCharConstRange(manager, this.element, first);
    const secondRange =
      firstRange === undefined || firstRange.isNegated
        ? undefined
        : getCharConstRange(manager, this.element, second);
    if (firstRange === undefined || secondRange === undefined || secondRange.isNegated)
      return false;
    if (!isFirstNegated && !isSecondNegated)
      return secondRange.lo <= firstRange.lo && firstRange.hi <= secondRange.hi;
    if (!isFirstNegated) return firstRange.hi < secondRange.lo || secondRange.hi < firstRange.lo;
    return secondRange.lo === 0 && secondRange.hi >= getMaxChar();
  }

  private mkXor(first: number, second: number): number {
    return this.mkCore(OP_RE_XOR, first, second);
  }

  private mkCore(op: number, first: number, second: number): number {
    const pathExpr = this.pathExpr;
    const cache =
      op === OP_RE_UNION
        ? this.unionCaches[this.kind]
        : op === OP_RE_INTERSECT
          ? this.interCaches[this.kind]
          : this.xorCaches[this.kind];
    const cached = getTriple(cache, first, second, pathExpr);
    if (cached !== undefined) return cached;
    const apply = (left: number, right: number) =>
      op === OP_RE_UNION
        ? this.mkUnion(left, right)
        : op === OP_RE_INTERSECT
          ? this.mkInter(left, right)
          : this.mkXor(left, right);
    const hoisted =
      op !== OP_RE_UNION || this.kind === DERIVATIVE_BRZOZOWSKI
        ? this.hoistIte(first, second, apply)
        : -1;
    const result =
      hoisted !== -1
        ? hoisted
        : op === OP_RE_UNION
          ? this.mkUnionCore(first, second)
          : op === OP_RE_INTERSECT
            ? this.mkInterCore(first, second)
            : this.re.mkXor0(first, second);
    setTriple(cache, first, second, pathExpr, result);
    this.trail.push(first);
    this.trail.push(second);
    this.trail.push(pathExpr);
    this.trail.push(result);
    return result;
  }

  private mkUnion(first: number, second: number): number {
    return this.mkCore(OP_RE_UNION, first, second);
  }

  private mkUnionCore(first: number, second: number) {
    const manager = this.manager;
    const sort = manager.sorts[first];
    if (isReEmpty(manager, first)) return second;
    if (isReEmpty(manager, second)) return first;
    if (first === second) return first;
    if (isFullSeq(manager, first) || isFullSeq(manager, second)) return mkFullSeq(manager, sort);
    const elements: number[] = [];
    const todo = [second, first];
    while (todo.length > 0) {
      const expr = todo.pop()!;
      if (isReBinary(manager, expr, OP_RE_UNION)) {
        todo.push(manager.getArg(expr, 1), manager.getArg(expr, 0));
        continue;
      }
      if (isReEmpty(manager, expr)) continue;
      if (isFullSeq(manager, expr)) return mkFullSeq(manager, sort);
      this.addUnionElement(elements, expr);
    }
    if (elements.length === 0) return mkReEmpty(manager, sort);
    let result = elements[0];
    for (let index = 1; index < elements.length; index++)
      result = this.re.mkUnion(result, elements[index]);
    return result;
  }

  private addUnionElement(elements: number[], input: number) {
    const manager = this.manager;
    let element = input;
    let isChanged = true;
    while (isChanged) {
      isChanged = false;
      for (let index = 0; index < elements.length; index++) {
        const other = elements[index];
        if (other === element || this.re.isSubset(element, other)) return;
        if (this.re.isSubset(other, element)) {
          elements[index] = elements[elements.length - 1];
          elements.pop();
          isChanged = true;
          break;
        }
        if (
          manager.getOp(element) === OP_ITE &&
          manager.getOp(other) === OP_ITE &&
          manager.getArg(element, 0) === manager.getArg(other, 0)
        ) {
          const [condition, firstThen, firstElse] = manager.getArgs(element);
          const secondThen = manager.getArg(other, 1);
          const secondElse = manager.getArg(other, 2);
          elements[index] = elements[elements.length - 1];
          elements.pop();
          const thenUnion = this.mkUnion(firstThen, secondThen);
          const elseUnion = this.mkUnion(firstElse, secondElse);
          element = this.mkIte(condition, thenUnion, elseUnion);
          isChanged = true;
          break;
        }
      }
    }
    elements.push(element);
  }

  private mkInter(first: number, second: number): number {
    return this.mkCore(OP_RE_INTERSECT, first, second);
  }

  private mkInterCore(first: number, second: number): number {
    const manager = this.manager;
    if (this.re.isSubset(first, second)) return first;
    if (this.re.isSubset(second, first)) return second;
    if (this.re.areComplements(first, second)) return mkReEmpty(manager, manager.sorts[first]);
    if (this.kind === DERIVATIVE_ANTIMIROV) {
      if (isReBinary(manager, first, OP_RE_UNION)) {
        const left = this.mkInter(manager.getArg(first, 0), second);
        const right = this.mkInter(manager.getArg(first, 1), second);
        return this.mkUnion(left, right);
      }
      if (isReBinary(manager, second, OP_RE_UNION)) {
        const left = this.mkInter(first, manager.getArg(second, 0));
        const right = this.mkInter(first, manager.getArg(second, 1));
        return this.mkUnion(left, right);
      }
    }
    return this.re.mkInter(first, second);
  }

  private mkConcat(first: number, second: number) {
    return this.re.mkReAppend(first, second);
  }

  private mkComplement(regex: number): number {
    const pathExpr = this.pathExpr;
    const cache = this.complementCaches[this.kind];
    const cached = getPair(cache, regex, pathExpr);
    if (cached !== undefined) return cached;
    const result = this.mkComplementCore(regex);
    setPair(cache, regex, pathExpr, result);
    this.trail.push(regex);
    this.trail.push(pathExpr);
    this.trail.push(result);
    return result;
  }

  private mkComplementCore(regex: number): number {
    const manager = this.manager;
    const sort = manager.sorts[regex];
    if (isReUnary(manager, regex, OP_RE_COMPLEMENT)) return manager.getArg(regex, 0);
    if (isReEmpty(manager, regex)) return mkFullSeq(manager, sort);
    if (isFullSeq(manager, regex)) return mkReEmpty(manager, sort);
    if (manager.getOp(regex) === OP_ITE) {
      const [condition, thenExpr, elseExpr] = manager.getArgs(regex);
      const result = this.applyIte(condition, thenExpr, elseExpr, (expr) =>
        this.mkComplement(expr),
      );
      return result === -1 ? mkFullSeq(manager, sort) : result;
    }
    for (const op of [OP_RE_UNION, OP_RE_INTERSECT]) {
      if (!isReBinary(manager, regex, op)) continue;
      const first = this.mkComplement(manager.getArg(regex, 0));
      const second = this.mkComplement(manager.getArg(regex, 1));
      return op === OP_RE_UNION ? this.mkInter(first, second) : this.mkUnion(first, second);
    }
    return this.re.mkComplement(regex);
  }

  private mkIte(condition: number, thenExpr: number, elseExpr: number) {
    const manager = this.manager;
    if (manager.isTrue(condition) || thenExpr === elseExpr) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    const value = this.evalPathCond(condition);
    if (value === L_TRUE) return thenExpr;
    if (value === L_FALSE) return elseExpr;
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], manager.sorts[thenExpr]);
  }

  private mkDerivConcat(derivative: number, tail: number): number {
    const cache = this.concatCaches[this.kind];
    const cached = getPair(cache, derivative, tail);
    if (cached !== undefined) return cached;
    const result = this.mkDerivConcatCore(derivative, tail);
    setPair(cache, derivative, tail, result);
    this.trail.push(derivative);
    this.trail.push(tail);
    this.trail.push(result);
    return result;
  }

  private mkDerivConcatCore(derivative: number, tail: number): number {
    const manager = this.manager;
    if (isReEmpty(manager, derivative)) return derivative;
    if (isEpsilon(manager, derivative)) return tail;
    if (manager.getOp(derivative) === OP_ITE) {
      const thenConcat = this.mkDerivConcat(manager.getArg(derivative, 1), tail);
      const elseConcat = this.mkDerivConcat(manager.getArg(derivative, 2), tail);
      return this.mkIte(manager.getArg(derivative, 0), thenConcat, elseConcat);
    }
    if (this.kind === DERIVATIVE_ANTIMIROV && isReBinary(manager, derivative, OP_RE_UNION)) {
      const left = this.mkDerivConcat(manager.getArg(derivative, 0), tail);
      const right = this.mkDerivConcat(manager.getArg(derivative, 1), tail);
      return this.mkUnion(left, right);
    }
    return this.mkConcat(derivative, tail);
  }

  private restorePath(pathSize: number, intervalsSize: number, intervalsStart: number) {
    this.pathConds.length = pathSize;
    this.pathSigns.length = pathSize;
    this.intervals.length = 2 * intervalsSize;
    this.intervalsStart = intervalsStart;
  }

  private push(condition: number, isNegated: boolean) {
    const manager = this.manager;
    const value = this.evalPathCond(condition);
    if (value !== L_UNDEF) return (value === L_TRUE) !== isNegated ? L_TRUE : L_FALSE;
    const pathSize = this.pathConds.length;
    const intervalsSize = this.intervals.length / 2;
    const intervalsStart = this.intervalsStart;
    const pathExpr = this.pathExpr;
    let result = this.pushPathAtoms(condition, isNegated);
    if (result === L_UNDEF) result = this.pushIntervals(condition, isNegated);
    if (result !== L_UNDEF) {
      this.restorePath(pathSize, intervalsSize, intervalsStart);
      return result;
    }
    const atom = isNegated ? manager.mkApp(OP_NOT, [condition], SORT_BOOL) : condition;
    this.pathExpr = assign(manager, pathExpr, manager.mkApp(OP_AND, [pathExpr, atom], SORT_BOOL));
    this.trail.push(this.pathExpr);
    this.pathStack.push(pathSize, intervalsSize, intervalsStart, pathExpr);
    return L_UNDEF;
  }

  private pop() {
    const stack = this.pathStack;
    const pathExpr = stack.pop()!;
    const intervalsStart = stack.pop()!;
    const intervalsSize = stack.pop()!;
    const pathSize = stack.pop()!;
    this.restorePath(pathSize, intervalsSize, intervalsStart);
    this.pathExpr = assign(this.manager, this.pathExpr, pathExpr);
  }

  private applyIteBranches(condition: number, getThen: () => number, getElse: () => number) {
    let thenBranch = -1;
    let elseBranch = -1;
    const thenStatus = this.push(condition, false);
    if (thenStatus === L_TRUE) return getThen();
    if (thenStatus === L_UNDEF) {
      thenBranch = getThen();
      this.pop();
    }
    const elseStatus = this.push(condition, true);
    if (elseStatus === L_TRUE) return getElse();
    if (elseStatus === L_UNDEF) {
      elseBranch = getElse();
      this.pop();
    }
    if (thenBranch !== -1 && elseBranch !== -1)
      return this.mkIte(condition, thenBranch, elseBranch);
    return thenBranch !== -1 ? thenBranch : elseBranch;
  }

  private applyIte(
    condition: number,
    thenExpr: number,
    elseExpr: number,
    apply: (expr: number) => number,
  ) {
    return this.applyIteBranches(
      condition,
      () => apply(thenExpr),
      () => apply(elseExpr),
    );
  }

  private hoistIte(
    inputFirst: number,
    inputSecond: number,
    apply: (first: number, second: number) => number,
  ) {
    const manager = this.manager;
    const isIte = (expr: number) => manager.getOp(expr) === OP_ITE;
    const isSwapped =
      isIte(inputFirst) &&
      isIte(inputSecond) &&
      manager.ids[manager.getArg(inputFirst, 0)] > manager.ids[manager.getArg(inputSecond, 0)];
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const getOr = (result: number) =>
      result === -1 ? mkReEmpty(manager, manager.sorts[first]) : result;
    if (isIte(first) && isIte(second)) {
      const [condition, firstThen, firstElse] = manager.getArgs(first);
      if (condition === manager.getArg(second, 0))
        return getOr(
          this.applyIteBranches(
            condition,
            () => apply(firstThen, manager.getArg(second, 1)),
            () => apply(firstElse, manager.getArg(second, 2)),
          ),
        );
      return getOr(
        this.applyIteBranches(
          condition,
          () => apply(firstThen, second),
          () => apply(firstElse, second),
        ),
      );
    }
    if (isIte(first)) {
      const [condition, thenExpr, elseExpr] = manager.getArgs(first);
      return getOr(
        this.applyIteBranches(
          condition,
          () => apply(thenExpr, second),
          () => apply(elseExpr, second),
        ),
      );
    }
    if (isIte(second)) {
      const [condition, thenExpr, elseExpr] = manager.getArgs(second);
      return getOr(
        this.applyIteBranches(
          condition,
          () => apply(thenExpr, first),
          () => apply(elseExpr, first),
        ),
      );
    }
    return -1;
  }

  private pushPathAtoms(condition: number, isNegated: boolean): number {
    const manager = this.manager;
    const getEqSides = (expr: number) => {
      if (manager.getOp(expr) !== OP_EQ) return undefined;
      const lhs = manager.getArg(expr, 0);
      const rhs = manager.getArg(expr, 1);
      return manager.isValue(lhs) ? [rhs, lhs] : [lhs, rhs];
    };
    for (let index = 0; index < this.pathConds.length; index++) {
      const cond = this.pathConds[index];
      const isCondNegated = this.pathSigns[index];
      if (condition === cond) return isCondNegated === isNegated ? L_TRUE : L_FALSE;
      const first = isCondNegated ? undefined : getEqSides(cond);
      const second = first === undefined ? undefined : getEqSides(condition);
      if (
        first !== undefined &&
        second !== undefined &&
        first[0] === second[0] &&
        manager.areDistinct(first[1], second[1])
      )
        return isNegated ? L_TRUE : L_FALSE;
    }
    const op = manager.getOp(condition);
    if ((!isNegated && op === OP_AND) || (isNegated && op === OP_OR)) {
      let isAllImplied = true;
      for (const arg of manager.getArgs(condition)) {
        const result = this.pushPathAtoms(arg, isNegated);
        if (result === L_FALSE) return L_FALSE;
        if (result === L_UNDEF) isAllImplied = false;
      }
      return isAllImplied ? L_TRUE : L_UNDEF;
    }
    this.pathConds.push(condition);
    this.pathSigns.push(isNegated);
    return L_UNDEF;
  }

  private getIntervalsCount() {
    return this.intervals.length / 2 - this.intervalsStart;
  }

  private pushIntervals(condition: number, isNegated: boolean): number {
    const manager = this.manager;
    const range = getCharConstRange(manager, this.element, condition);
    const intervals = this.intervals;
    const end = intervals.length / 2;
    const op = manager.getOp(condition);
    if (range !== undefined) {
      if (range.isNegated === isNegated) {
        if (range.lo > range.hi) return L_FALSE;
        let isSubset = true;
        for (let index = this.intervalsStart; index < end; index++)
          if (intervals[2 * index] < range.lo || intervals[2 * index + 1] > range.hi) {
            isSubset = false;
            break;
          }
        if (isSubset) return L_TRUE;
        this.intersectIntervals(range.lo, range.hi);
      } else if (range.lo <= range.hi) {
        let isExcluded = true;
        for (let index = this.intervalsStart; index < end; index++)
          if (intervals[2 * index] <= range.hi && intervals[2 * index + 1] >= range.lo) {
            isExcluded = false;
            break;
          }
        if (isExcluded) return L_TRUE;
        this.excludeInterval(range.lo, range.hi);
      }
    } else if ((!isNegated && op === OP_AND) || (isNegated && op === OP_OR)) {
      let isAllImplied = true;
      for (const arg of manager.getArgs(condition)) {
        const result = this.pushIntervals(arg, isNegated);
        if (result === L_FALSE) return L_FALSE;
        if (result === L_UNDEF) isAllImplied = false;
      }
      return isAllImplied ? L_TRUE : this.getIntervalsCount() === 0 ? L_FALSE : L_UNDEF;
    }
    return this.getIntervalsCount() === 0 ? L_FALSE : L_UNDEF;
  }

  private evalPathCond(condition: number) {
    const value = this.evalCond(condition);
    if (value !== L_UNDEF) return value;
    for (let index = 0; index < this.pathConds.length; index++)
      if (this.pathConds[index] === condition) return this.pathSigns[index] ? L_FALSE : L_TRUE;
    const rangeValue = this.evalRangeCond(condition);
    if (rangeValue !== L_UNDEF) return rangeValue;
    for (let index = 0; index < this.pathConds.length; index++) {
      if (this.isPredImplying(this.pathSigns[index], this.pathConds[index], false, condition))
        return L_TRUE;
      if (this.isPredImplying(this.pathSigns[index], this.pathConds[index], true, condition))
        return L_FALSE;
    }
    return L_UNDEF;
  }

  private evalCond(condition: number): number {
    const manager = this.manager;
    if (manager.isTrue(condition)) return L_TRUE;
    if (manager.isFalse(condition)) return L_FALSE;
    const range = getCharConstRange(manager, this.element, condition);
    const elementCode = manager.getChar(this.element);
    if (range !== undefined && elementCode !== -1)
      return (range.lo <= elementCode && elementCode <= range.hi) !== range.isNegated
        ? L_TRUE
        : L_FALSE;
    const op = manager.getOp(condition);
    if (op === OP_EQ && manager.getArg(condition, 0) === manager.getArg(condition, 1))
      return L_TRUE;
    if (op === OP_CHAR_LE) {
      const lhs = manager.getChar(manager.getArg(condition, 0));
      const rhs = manager.getChar(manager.getArg(condition, 1));
      if (lhs !== -1 && rhs !== -1) return lhs <= rhs ? L_TRUE : L_FALSE;
      if (lhs === 0 || rhs === getMaxChar()) return L_TRUE;
    }
    if (op === OP_NOT) return -this.evalCond(manager.getArg(condition, 0));
    if (op !== OP_AND && op !== OP_OR) return L_UNDEF;
    const absorbing = op === OP_AND ? L_FALSE : L_TRUE;
    let result = -absorbing;
    for (const arg of manager.getArgs(condition)) {
      const value = this.evalCond(arg);
      if (value === absorbing) return absorbing;
      if (value === L_UNDEF) result = L_UNDEF;
    }
    return result;
  }

  private evalRangeCond(condition: number) {
    if (this.getIntervalsCount() === 0) return L_FALSE;
    const range = getCharConstRange(this.manager, this.element, condition);
    if (range === undefined) return L_UNDEF;
    if (range.lo > range.hi) return range.isNegated ? L_TRUE : L_FALSE;
    let isAnyOverlap = false;
    let isAllContained = true;
    const intervals = this.intervals;
    for (let index = this.intervalsStart; index < intervals.length / 2; index++) {
      const lo = intervals[2 * index];
      const hi = intervals[2 * index + 1];
      if (Math.max(lo, range.lo) <= Math.min(hi, range.hi)) isAnyOverlap = true;
      if (lo < range.lo || hi > range.hi) isAllContained = false;
    }
    if (!range.isNegated) {
      if (!isAnyOverlap) return L_FALSE;
      if (isAllContained) return L_TRUE;
    } else {
      if (isAllContained) return L_FALSE;
      if (!isAnyOverlap) return L_TRUE;
    }
    return L_UNDEF;
  }

  private intersectIntervals(lo: number, hi: number) {
    const intervals = this.intervals;
    const oldSize = intervals.length / 2;
    for (let index = this.intervalsStart; index < oldSize; index++)
      intervals.push(intervals[2 * index], intervals[2 * index + 1]);
    this.intervalsStart = oldSize;
    let next = oldSize;
    for (let index = oldSize; index < intervals.length / 2; index++) {
      const intervalLo = intervals[2 * index];
      const intervalHi = intervals[2 * index + 1];
      if (hi < intervalLo || lo > intervalHi) continue;
      intervals[2 * next] = Math.max(intervalLo, lo);
      intervals[2 * next + 1] = Math.min(intervalHi, hi);
      next++;
    }
    intervals.length = 2 * next;
  }

  private excludeInterval(lo: number, hi: number) {
    const maxChar = getMaxChar();
    const intervals = this.intervals;
    if (lo === 0 && hi >= maxChar) {
      this.intervalsStart = intervals.length / 2;
      return;
    }
    if (lo === 0) {
      this.intersectIntervals(hi + 1, maxChar);
      return;
    }
    if (hi >= maxChar) {
      this.intersectIntervals(0, lo - 1);
      return;
    }
    const oldSize = intervals.length / 2;
    for (let index = this.intervalsStart; index < oldSize; index++) {
      const intervalLo = intervals[2 * index];
      const intervalHi = intervals[2 * index + 1];
      if (intervalHi < lo || intervalLo > hi) {
        intervals.push(intervalLo, intervalHi);
        continue;
      }
      if (intervalLo < lo) intervals.push(intervalLo, lo - 1);
      if (intervalHi > hi) intervals.push(hi + 1, intervalHi);
    }
    this.intervalsStart = oldSize;
  }

  private cleanLeaf(regex: number) {
    const manager = this.manager;
    const cache = new Map<number, number>();
    const todo = [regex];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (cache.has(expr)) {
        todo.pop();
        continue;
      }
      if (
        manager.kinds[expr] !== KIND_APP ||
        !manager.isReSort(manager.sorts[expr]) ||
        isReOp(manager, expr, OP_RE_DERIVATIVE)
      ) {
        cache.set(expr, expr);
        todo.pop();
        continue;
      }
      const exprArgs = manager.getArgs(expr);
      let isReady = true;
      for (const arg of exprArgs)
        if (!cache.has(arg)) {
          todo.push(arg);
          isReady = false;
        }
      if (!isReady) continue;
      const args = exprArgs.map((arg) => cache.get(arg)!);
      const result =
        args.length === 2 && isReOp(manager, expr, OP_RE_UNION)
          ? this.mkUnion(args[0], args[1])
          : args.length === 2 && isReOp(manager, expr, OP_RE_INTERSECT)
            ? this.mkInter(args[0], args[1])
            : args.length === 2 && isReOp(manager, expr, OP_RE_XOR)
              ? this.mkXor(args[0], args[1])
              : isReOp(manager, expr, OP_RE_COMPLEMENT)
                ? this.mkComplement(args[0])
                : this.re.mkApp(manager.decls[expr], args);
      cache.set(expr, result);
      todo.pop();
    }
    return cache.get(regex)!;
  }

  private decomposeIte(regex: number): Decomposed | undefined {
    const manager = this.manager;
    if (manager.getOp(regex) === OP_ITE) {
      const parts = manager.getArgs(regex);
      for (const part of parts) manager.incRef(part);
      return { condition: parts[0], thenExpr: parts[1], elseExpr: parts[2] };
    }
    const visited = new Set<number>();
    const stack = [regex];
    while (stack.length > 0) {
      const expr = stack[stack.length - 1];
      if (manager.getOp(expr) === OP_ITE) {
        const first = this.firstReplace;
        const second = this.secondReplace;
        first.reset();
        second.reset();
        first.insert(expr, manager.getArg(expr, 1));
        second.insert(expr, manager.getArg(expr, 2));
        const condition = manager.getArg(expr, 0);
        manager.incRef(condition);
        return { condition, thenExpr: first.apply(regex), elseExpr: second.apply(regex) };
      }
      visited.add(expr);
      if (manager.kinds[expr] === KIND_APP) stack.push(...manager.getArgs(expr));
      while (stack.length > 0 && visited.has(stack[stack.length - 1])) stack.pop();
    }
    return undefined;
  }

  private getCofactorsRec(regex: number, result: RefVector) {
    const manager = this.manager;
    let decomposed = this.decomposeIte(regex);
    if (decomposed === undefined) {
      const cleaned = this.cleanLeaf(regex);
      manager.incRef(cleaned);
      decomposed = this.decomposeIte(cleaned);
      if (decomposed === undefined && !isReEmpty(manager, cleaned)) {
        result.push(this.pathExpr);
        result.push(cleaned);
      }
      manager.decRef(cleaned);
      if (decomposed === undefined) return;
    }
    const parts = decomposed;
    const thenStatus = this.push(parts.condition, false);
    if (thenStatus !== L_FALSE) this.getCofactorsRec(parts.thenExpr, result);
    if (thenStatus === L_UNDEF) this.pop();
    const elseStatus = this.push(parts.condition, true);
    if (elseStatus !== L_FALSE) this.getCofactorsRec(parts.elseExpr, result);
    if (elseStatus === L_UNDEF) this.pop();
    for (const part of [parts.elseExpr, parts.thenExpr, parts.condition]) manager.decRef(part);
  }

  getCofactors(element: number, regex: number, result: RefVector) {
    if (element !== this.element) this.resetOpCaches();
    this.element = assign(this.manager, this.element, element);
    this.trail.push(element);
    this.trail.push(regex);
    this.pathStack.length = 0;
    this.resetPath();
    this.getCofactorsRec(regex, result);
  }

  getCachedCofactors(mode: number, regex: number) {
    const cache =
      mode === TRANSITION_LIGHT_ANTIMIROV ? this.antCofactorCache : this.brzCofactorCache;
    const cached = cache.cofactors.get(regex);
    if (cached !== undefined) return cached;
    const cofactors = new RefVector(this.manager);
    if (mode === TRANSITION_LIGHT_ANTIMIROV) this.lightAntDerivativeCofactors(regex, cofactors);
    else this.derivativeCofactors(regex, cofactors);
    cache.insert(regex, cofactors);
    return cofactors;
  }

  maybeResetCachedCofactors(cap: number) {
    this.brzCofactorCache.maybeReset(cap);
    this.antCofactorCache.maybeReset(cap);
  }

  derivativeCofactors(regex: number, result: RefVector) {
    const manager = this.manager;
    const elementSort = manager.getSeqElementSort(manager.getReSeqSort(manager.sorts[regex]));
    const element = manager.mkVar(0, elementSort);
    const derivative = this.derive(DERIVATIVE_BRZOZOWSKI, element, regex);
    this.getCofactors(element, derivative, result);
  }

  lightAntDerivativeCofactors(regex: number, result: RefVector) {
    const manager = this.manager;
    const brzozowski = new RefVector(manager);
    this.derivativeCofactors(regex, brzozowski);
    const targetIndex = new Map<number, number>();
    const guards: number[] = [];
    const targets: number[] = [];
    const add = (guard: number, target: number) => {
      const index = targetIndex.get(target);
      if (index !== undefined) {
        guards[index] = this.bool.mkOr([guards[index], guard]);
        return;
      }
      targetIndex.set(target, targets.length);
      targets.push(target);
      guards.push(guard);
    };
    for (let pair = 0; pair < brzozowski.size; pair += 2) {
      const guard = brzozowski.items[pair];
      const pending = [brzozowski.items[pair + 1]];
      while (pending.length > 0) {
        const target = pending.pop()!;
        if (isReBinary(manager, target, OP_RE_UNION)) {
          pending.push(manager.getArg(target, 1), manager.getArg(target, 0));
          continue;
        }
        const isSplit =
          isReBinary(manager, target, OP_RE_CONCAT) &&
          isReOp(manager, manager.getArg(target, 0), OP_RE_UNION);
        if (!isSplit) {
          add(guard, target);
          continue;
        }
        const tail = manager.getArg(target, 1);
        const heads = [manager.getArg(target, 0)];
        while (heads.length > 0) {
          const current = heads.pop()!;
          if (isReBinary(manager, current, OP_RE_UNION))
            heads.push(manager.getArg(current, 1), manager.getArg(current, 0));
          else add(guard, this.re.mkReAppend(current, tail));
        }
      }
    }
    result.reset();
    for (let index = 0; index < targets.length; index++) {
      result.push(guards[index]);
      result.push(targets[index]);
    }
    brzozowski.reset();
  }
}

// Ported from Z3 (src/ast/seq/seq_axioms.cpp, src/smt/seq_axioms.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  OP_ADD,
  OP_CHAR_IS_DIGIT,
  OP_CHAR_LE,
  OP_CHAR_TO_INT,
  OP_EQ,
  OP_GE,
  OP_LE,
  OP_MUL,
  OP_NOT,
  OP_SEQ_AT,
  OP_SEQ_CONCAT,
  OP_SEQ_CONTAINS,
  OP_SEQ_EMPTY,
  OP_SEQ_EXTRACT,
  OP_SEQ_INDEX,
  OP_SEQ_LENGTH,
  OP_SEQ_NTH_I,
  OP_SEQ_POWER,
  OP_SEQ_PREFIX,
  OP_SEQ_UNIT,
  OP_STRING_FROM_CODE,
  OP_STRING_ITOS,
  OP_STRING_LT,
  OP_STRING_STOI,
  OP_STRING_TO_CODE,
  OP_SUB,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { FALSE_LITERAL, type Literal, TRUE_LITERAL, negate } from "./literal";
import { isBinaryApp, isEmptySeq, mkConcatOf, mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import { SeqSkolem } from "./seq-skolem";

export interface SeqAxiomsHost {
  rewrite(expr: number): number;
  mkEqLiteral(first: number, second: number): Literal;
  ensureEnode(expr: number): void;
  getLiteral(expr: number): Literal;
  forcePhase(literal: Literal): void;
  addAxiom(literals: Literal[]): void;
  pushTrail(undo: () => void): void;
}

export const getMinLengthOf = (manager: AstManager, seq: number): number => {
  const getLength = (expr: number) =>
    manager.getOp(expr) === OP_SEQ_UNIT ? 1 : (manager.getString(expr)?.length ?? 0);
  let result = 0;
  let current = seq;
  while (isBinaryApp(manager, current, OP_SEQ_CONCAT)) {
    const first = manager.getArg(current, 0);
    result +=
      manager.getOp(first) === OP_SEQ_CONCAT ? getMinLengthOf(manager, first) : getLength(first);
    current = manager.getArg(current, 1);
  }
  return result + getLength(current);
};

const UINT_MAX = 0xffffffff;

export const getMaxLengthOf = (manager: AstManager, seq: number): number => {
  const getLength = (expr: number) => {
    if (isEmptySeq(manager, expr)) return 0;
    const op = manager.getOp(expr);
    if (op === OP_SEQ_UNIT || op === OP_SEQ_AT) return 1;
    if (op === OP_SEQ_EXTRACT) {
      const length = manager.getNumeral(manager.getArg(expr, 2));
      return length !== undefined && length >= 0n && length <= BigInt(UINT_MAX)
        ? Number(length)
        : UINT_MAX;
    }
    return manager.getString(expr)?.length ?? UINT_MAX;
  };
  const add = (first: number, second: number) => Math.min(UINT_MAX, first + second);
  let result = 0;
  let current = seq;
  while (isBinaryApp(manager, current, OP_SEQ_CONCAT)) {
    const first = manager.getArg(current, 0);
    result = add(
      manager.getOp(first) === OP_SEQ_CONCAT ? getMaxLengthOf(manager, first) : getLength(first),
      result,
    );
    current = manager.getArg(current, 1);
  }
  return add(getLength(current), result);
};

export class SeqAxioms {
  readonly skolem: SeqSkolem;
  private purified = new Map<number, number>();
  private purifyTrail: number[] = [];
  private isDigitsInitialized = false;

  constructor(
    private manager: AstManager,
    private host: SeqAxiomsHost,
  ) {
    this.skolem = new SeqSkolem(manager, (expr) => host.rewrite(expr));
  }

  private mkInt(value: number | bigint) {
    return this.manager.mkNumeral(BigInt(value));
  }

  private mkArith(op: number, args: number[]) {
    return this.manager.mkApp(op, args, op === OP_GE || op === OP_LE ? SORT_BOOL : SORT_INT);
  }

  private mkSeq(op: number, args: number[]) {
    return mkSeqApp(this.manager, op, args);
  }

  private mkEq(first: number, second: number) {
    return this.manager.mkApp(OP_EQ, [first, second], SORT_BOOL);
  }

  rewrite(expr: number) {
    return this.host.rewrite(expr);
  }

  mkNot(expr: number) {
    const manager = this.manager;
    return manager.isNot(expr) ? manager.getArg(expr, 0) : manager.mkApp(OP_NOT, [expr], SORT_BOOL);
  }

  private mkConcat(...args: number[]) {
    return mkConcatOf(this.manager, args, this.manager.sorts[args[0]]);
  }

  private mkNth(seq: number, index: number) {
    return this.mkSeq(OP_SEQ_NTH_I, [seq, this.mkInt(index)]);
  }

  private mkUnit(expr: number) {
    return this.mkSeq(OP_SEQ_UNIT, [expr]);
  }

  private mkEmpty(sort: number) {
    return mkEmptySeq(this.manager, sort);
  }

  mkSub(first: number, second: number) {
    return this.host.rewrite(this.mkArith(OP_SUB, [first, second]));
  }

  private mkGeE(first: number, second: number) {
    return this.host.rewrite(this.mkArith(OP_GE, [first, second]));
  }

  private mkLeE(first: number, second: number) {
    return this.host.rewrite(this.mkArith(OP_LE, [first, second]));
  }

  mkGe(expr: number, bound: number | bigint) {
    return this.mkGeE(expr, this.mkInt(bound));
  }

  mkLe(expr: number, bound: number | bigint) {
    return this.mkLeE(expr, this.mkInt(bound));
  }

  private mkSeqEq(first: number, second: number) {
    const result = this.skolem.mkEq(first, second);
    this.host.forcePhase(this.mkLiteral(result));
    return result;
  }

  private mkEqEmpty(expr: number) {
    return this.mkSeqEq(this.mkEmpty(this.manager.sorts[expr]), expr);
  }

  private mkLenAxiom(seq: number) {
    const length = this.mkSeq(OP_SEQ_LENGTH, [seq]);
    const result = this.host.rewrite(length);
    if (result !== length) this.addClause([this.mkEq(length, result)]);
    return result;
  }

  mkLen(seq: number) {
    return this.host.rewrite(this.mkSeq(OP_SEQ_LENGTH, [seq]));
  }

  private purify(expr: number | undefined) {
    const manager = this.manager;
    if (expr === undefined) return undefined;
    if (manager.depths[expr] === 1 || manager.isValue(expr)) return expr;
    if (this.host.rewrite(expr) === expr) return expr;
    let result = this.purified.get(expr);
    if (result === undefined) {
      if (this.purifyTrail.length === 4000) {
        const kept = this.purifyTrail.slice(2000);
        for (const dropped of this.purifyTrail.slice(0, 2000)) manager.decRef(dropped);
        this.purified.clear();
        for (let index = 0; index < 2000; index += 2)
          this.purified.set(kept[index], kept[index + 1]);
        this.purifyTrail = kept;
      }
      result = manager.mkFreshConst("seq.purify", manager.sorts[expr]);
      manager.incRef(expr);
      manager.incRef(result);
      this.purified.set(expr, result);
      this.purifyTrail.push(expr, result);
    }
    this.addClause([this.mkEq(result, expr)]);
    return result;
  }

  mkLiteral(input: number): Literal {
    const manager = this.manager;
    if (manager.isNot(input)) return negate(this.mkLiteral(manager.getArg(input, 0)));
    if (manager.getOp(input) === OP_EQ)
      return this.host.mkEqLiteral(manager.getArg(input, 0), manager.getArg(input, 1));
    const expr =
      manager.kinds[input] === KIND_APP && manager.getFamily(input) === FAMILY_ARITH
        ? this.host.rewrite(input)
        : input;
    this.host.ensureEnode(expr);
    return this.host.getLiteral(expr);
  }

  private addClause(clause: number[]) {
    const literals: Literal[] = [];
    for (const expr of clause) {
      const literal = this.mkLiteral(expr);
      if (literal === TRUE_LITERAL) return;
      if (literal !== FALSE_LITERAL) literals.push(this.mkLiteral(expr));
    }
    this.host.addAxiom(literals);
  }

  isDigit(char: number) {
    return this.mkSeq(OP_CHAR_IS_DIGIT, [char]);
  }

  private mkDigit2int(char: number) {
    this.ensureDigitAxiom();
    return this.skolem.mkDigit2int(char);
  }

  private ensureDigitAxiom() {
    if (this.isDigitsInitialized) return;
    for (let digit = 0; digit < 10; digit++) {
      const value = this.skolem.mkDigit2int(this.manager.mkChar(48 + digit));
      this.host.addAxiom([this.host.mkEqLiteral(value, this.mkInt(digit))]);
    }
    this.host.pushTrail(() => {
      this.isDigitsInitialized = false;
    });
    this.isDigitsInitialized = true;
  }

  extractAxiom(expr: number) {
    const manager = this.manager;
    const [seqArg, indexArg, lengthArg] = manager.getArgs(expr);
    const seq = this.purify(seqArg)!;
    const index = this.purify(indexArg)!;
    const length = this.purify(lengthArg)!;
    if (this.smallSegmentAxiom(expr, seqArg, indexArg, lengthArg)) return;
    if (this.isTail(seq, indexArg, lengthArg)) {
      this.tailAxiom(expr, seq);
      return;
    }
    if (this.isDropLast(seq, indexArg, lengthArg)) {
      this.dropLastAxiom(expr, seq);
      return;
    }
    if (manager.getNumeral(indexArg) === 0n) {
      this.extractPrefixAxiom(expr, seq, length);
      return;
    }
    if (this.isExtractSuffix(seq, indexArg, lengthArg)) {
      this.extractSuffixAxiom(expr, seq, index);
      return;
    }
    const skolem = this.skolem;
    const prefix = skolem.mkPre(seq, index);
    const seqLength = this.mkLenAxiom(seqArg);
    const prefixLength = this.mkLenAxiom(prefix);
    const exprLength = this.mkLenAxiom(expr);
    const remaining = this.mkSub(this.mkSub(seqLength, indexArg), lengthArg);
    const suffix = skolem.mkPost(seq, this.mkArith(OP_ADD, [index, length]));
    this.mkConcat(prefix, expr);
    const whole = this.mkConcat(prefix, expr, suffix);
    const zero = this.mkInt(0);
    const isIndexNonNegative = this.mkGe(indexArg, 0);
    const isIndexAtMostLength = this.mkLe(this.mkSub(indexArg, seqLength), 0);
    const isLengthAtMostIndex = this.mkLe(this.mkSub(seqLength, indexArg), 0);
    const isRemainingNonNegative = this.mkGe(remaining, 0);
    const isLengthNonNegative = this.mkGe(length, 0);
    const isLengthNonPositive = this.mkLe(length, 0);
    const isSeqLengthNonPositive = this.mkLe(seqLength, 0);
    const isExprEmpty = this.mkEq(exprLength, zero);
    const isIndexNegative = this.mkNot(isIndexNonNegative);
    const isIndexAboveLength = this.mkNot(isIndexAtMostLength);
    const isLengthNegative = this.mkNot(isLengthNonNegative);
    this.addClause([
      isIndexNegative,
      isIndexAboveLength,
      isLengthNegative,
      this.mkSeqEq(whole, seq),
    ]);
    this.addClause([isIndexNegative, isIndexAboveLength, this.mkEq(prefixLength, index)]);
    const isRemainingNegative = this.mkNot(isRemainingNonNegative);
    this.addClause([
      isIndexNegative,
      isIndexAboveLength,
      isLengthNegative,
      isRemainingNegative,
      this.mkEq(exprLength, length),
    ]);
    this.addClause([
      isIndexNegative,
      isIndexAboveLength,
      isLengthNegative,
      isRemainingNonNegative,
      this.mkEq(exprLength, this.mkSub(seqLength, index)),
    ]);
    this.addClause([isIndexNonNegative, isExprEmpty]);
    this.addClause([this.mkNot(isLengthAtMostIndex), isExprEmpty]);
    this.addClause([this.mkNot(isSeqLengthNonPositive), isExprEmpty]);
    this.addClause([this.mkNot(isLengthNonPositive), isExprEmpty]);
    this.addClause([
      this.mkNot(isExprEmpty),
      isIndexNegative,
      isLengthAtMostIndex,
      isSeqLengthNonPositive,
      isLengthNonPositive,
    ]);
  }

  private tailAxiom(expr: number, seq: number) {
    const parts = this.skolem.decompose(seq);
    const isEmpty = this.mkEqEmpty(seq);
    this.addClause([isEmpty, this.mkSeqEq(seq, this.mkConcat(parts.head, expr))]);
    this.addClause([this.mkNot(isEmpty), this.mkEqEmpty(expr)]);
  }

  private dropLastAxiom(expr: number, seq: number) {
    const isEmpty = this.mkEqEmpty(seq);
    this.addClause([
      isEmpty,
      this.mkSeqEq(seq, this.mkConcat(expr, this.mkUnit(this.skolem.mkLast(seq)))),
    ]);
    this.addClause([this.mkNot(isEmpty), this.mkEqEmpty(expr)]);
  }

  private isDropLast(seq: number, index: number, length: number) {
    if (this.manager.getNumeral(index) !== 0n) return false;
    const seqLength = this.mkLenAxiom(seq);
    const expected = this.mkSub(seqLength, this.mkInt(1));
    return this.host.rewrite(length) === this.host.rewrite(expected);
  }

  private smallSegmentAxiom(expr: number, seq: number, index: number, length: number) {
    const start = this.manager.getNumeral(index);
    const count = this.manager.getNumeral(length);
    if (start === undefined || start < 0n || count === undefined || count > 5n) return false;
    const elements: number[] = [];
    for (let offset = 0n; offset < count; offset++)
      elements.push(
        this.mkSeq(OP_SEQ_AT, [seq, this.mkArith(OP_ADD, [index, this.mkInt(offset)])]),
      );
    const result = mkConcatOf(this.manager, elements, this.manager.sorts[seq]);
    this.addClause([this.mkSeqEq(result, expr)]);
    return true;
  }

  private isTail(seq: number, index: number, length: number) {
    if (this.manager.getNumeral(index) !== 1n) return false;
    const seqLength = this.mkLenAxiom(seq);
    const expected = this.mkSub(seqLength, this.mkInt(1));
    return this.host.rewrite(length) === this.host.rewrite(expected);
  }

  private isExtractSuffix(seq: number, index: number, length: number) {
    const sum = this.host.rewrite(this.mkArith(OP_ADD, [length, index]));
    return this.manager.getOp(sum) === OP_SEQ_LENGTH && this.manager.getArg(sum, 0) === seq;
  }

  private extractPrefixAxiom(expr: number, seq: number, length: number) {
    const exprLength = this.mkLenAxiom(expr);
    const seqLength = this.mkLenAxiom(seq);
    this.mkSub(seqLength, length);
    const suffix = this.skolem.mkPost(seq, length);
    const whole = this.mkConcat(expr, suffix);
    const isWithin = this.mkLe(this.mkSub(length, seqLength), 0);
    this.addClause([this.mkSeqEq(seq, whole)]);
    const isPositive = this.mkNot(this.mkLe(length, 0));
    this.addClause([isPositive, this.mkEqEmpty(expr)]);
    const isNegative = this.mkNot(this.mkGe(length, 0));
    const isAbove = this.mkNot(isWithin);
    this.addClause([isNegative, isAbove, this.mkEq(exprLength, length)]);
    this.addClause([isWithin, this.mkEq(expr, seq)]);
  }

  private extractSuffixAxiom(expr: number, seq: number, index: number) {
    const prefix = this.skolem.mkPre(seq, index);
    const prefixLength = this.mkLenAxiom(prefix);
    const seqLength = this.mkLenAxiom(seq);
    const whole = this.mkConcat(prefix, expr);
    const isEmpty = this.mkEqEmpty(expr);
    const isIndexNonNegative = this.mkGe(index, 0);
    const isIndexWithin = this.mkLe(this.mkSub(index, seqLength), 0);
    this.addClause([this.mkEq(seq, whole)]);
    this.addClause([
      this.mkNot(isIndexNonNegative),
      this.mkNot(isIndexWithin),
      this.mkEq(index, prefixLength),
    ]);
    this.addClause([isIndexNonNegative, isEmpty]);
    this.addClause([isIndexWithin, isEmpty]);
  }

  private tightestPrefix(pattern: number, prefix: number) {
    const isEmpty = this.mkEqEmpty(pattern);
    if (getMaxLengthOf(this.manager, pattern) <= 1) {
      this.addClause([isEmpty, this.mkNot(this.mkSeq(OP_SEQ_CONTAINS, [prefix, pattern]))]);
      return;
    }
    const first = this.skolem.mkFirst(pattern);
    const last = this.skolem.mkLast(pattern);
    const whole = this.mkConcat(first, this.mkUnit(last));
    this.addClause([isEmpty, this.mkSeqEq(pattern, whole)]);
    this.addClause([
      isEmpty,
      this.mkNot(this.mkSeq(OP_SEQ_CONTAINS, [this.mkConcat(prefix, first), pattern])),
    ]);
  }

  indexofAxiom(index: number) {
    const manager = this.manager;
    const args = manager.getArgs(index);
    const minusOne = this.mkInt(-1);
    const zero = this.mkInt(0);
    const offset = this.purify(args[2]);
    const pattern = this.purify(args[1])!;
    const text = this.purify(args[0])!;
    const contains = this.mkSeq(OP_SEQ_CONTAINS, [text, pattern]);
    const isMinusOne = this.mkEq(index, minusOne);
    const isZero = this.mkEq(index, zero);
    const isPatternEmpty = this.mkEq(pattern, this.mkEmpty(manager.sorts[pattern]));
    const isTextEmpty = this.mkEqEmpty(text);
    this.addClause([this.mkGe(index, -1)]);
    this.addClause([contains, isMinusOne]);
    this.addClause([this.mkNot(isTextEmpty), isPatternEmpty, isMinusOne]);
    const skolem = this.skolem;
    if (offset === undefined || manager.getNumeral(offset) === 0n) {
      this.addClause([this.mkNot(isPatternEmpty), isZero]);
      const left = skolem.mkIndexofLeft(text, pattern);
      const right = skolem.mkIndexofRight(text, pattern);
      const whole = this.mkConcat(left, pattern, right);
      const leftLength = this.mkLenAxiom(left);
      this.addClause([this.mkNot(contains), isPatternEmpty, this.mkSeqEq(text, whole)]);
      const notContains = this.mkNot(contains);
      this.addClause([notContains, isPatternEmpty, this.mkEq(index, leftLength)]);
      const notContainsAgain = this.mkNot(contains);
      this.addClause([notContainsAgain, this.mkGe(index, 0)]);
      this.tightestPrefix(pattern, left);
      return;
    }
    const textLength = this.mkLenAxiom(text);
    const isOffsetAtLeastLength = this.mkGe(this.mkSub(offset, textLength), 0);
    const isOffsetAtMostLength = this.mkLe(this.mkSub(offset, textLength), 0);
    const isIndexOffset = this.mkEq(index, offset);
    this.addClause([this.mkNot(isOffsetAtLeastLength), isPatternEmpty, isMinusOne]);
    this.addClause([isOffsetAtMostLength, isMinusOne]);
    this.addClause([
      this.mkNot(isOffsetAtLeastLength),
      this.mkNot(isOffsetAtMostLength),
      this.mkNot(isPatternEmpty),
      isIndexOffset,
    ]);
    const left = skolem.mkIndexofLeft(text, pattern, offset);
    const right = skolem.mkIndexofRight(text, pattern, offset);
    const indexof0 = this.mkSeq(OP_SEQ_INDEX, [right, pattern, zero]);
    const shifted = this.mkArith(OP_ADD, [offset, indexof0]);
    const isOffsetNonNegative = this.mkGe(offset, 0);
    this.addClause([
      this.mkNot(isOffsetNonNegative),
      isOffsetAtLeastLength,
      this.mkSeqEq(text, this.mkConcat(left, right)),
    ]);
    const notNonNegative = this.mkNot(isOffsetNonNegative);
    this.addClause([
      notNonNegative,
      isOffsetAtLeastLength,
      this.mkEq(this.mkLenAxiom(left), offset),
    ]);
    const notNonNegativeAgain = this.mkNot(isOffsetNonNegative);
    this.addClause([
      notNonNegativeAgain,
      isOffsetAtLeastLength,
      this.mkNot(this.mkEq(indexof0, minusOne)),
      isMinusOne,
    ]);
    const isOffsetNegative = this.mkNot(isOffsetNonNegative);
    const isIndexof0Negative = this.mkNot(this.mkGe(indexof0, 0));
    this.addClause([
      isOffsetNegative,
      isOffsetAtLeastLength,
      isIndexof0Negative,
      this.mkEq(shifted, index),
    ]);
    this.addClause([isOffsetNonNegative, isMinusOne]);
  }

  lastIndexofAxiom(index: number) {
    const manager = this.manager;
    const [textArg, patternArg] = manager.getArgs(index);
    const text = this.purify(textArg)!;
    const pattern = this.purify(patternArg)!;
    const minusOne = this.mkInt(-1);
    const zero = this.mkInt(0);
    const skolem = this.skolem;
    const left = skolem.mkLastIndexofLeft(text, pattern);
    const right = skolem.mkLastIndexofRight(text, pattern);
    const parts = skolem.decompose(pattern);
    const contains = this.mkSeq(OP_SEQ_CONTAINS, [text, pattern]);
    const containsTail = this.mkSeq(OP_SEQ_CONTAINS, [this.mkConcat(parts.tail, right), pattern]);
    const isMinusOne = this.mkEq(index, minusOne);
    this.mkEq(index, zero);
    const isPatternEmpty = this.mkEqEmpty(pattern);
    const isTextEmpty = this.mkEqEmpty(text);
    const whole = this.mkConcat(left, pattern, right);
    this.addClause([contains, isMinusOne]);
    this.addClause([this.mkNot(isTextEmpty), isPatternEmpty, isMinusOne]);
    this.addClause([this.mkNot(isPatternEmpty), this.mkEq(index, this.mkLenAxiom(text))]);
    this.addClause([isTextEmpty, this.mkNot(contains), this.mkSeqEq(text, whole)]);
    const notContains = this.mkNot(contains);
    this.addClause([isTextEmpty, notContains, this.mkEq(index, this.mkLenAxiom(left))]);
    this.addClause([isPatternEmpty, this.mkEq(pattern, this.mkConcat(parts.head, parts.tail))]);
    this.addClause([isPatternEmpty, this.mkNot(containsTail)]);
  }

  replaceAxiom(replace: number) {
    const manager = this.manager;
    const [source, patternArg, targetArg] = manager.getArgs(replace);
    const text = this.purify(source)!;
    const pattern = this.purify(patternArg)!;
    const target = this.purify(targetArg)!;
    const skolem = this.skolem;
    const left = skolem.mkIndexofLeft(text, pattern);
    const right = skolem.mkIndexofRight(text, pattern);
    const replaced = this.mkConcat(left, target, right);
    const whole = this.mkConcat(left, pattern, right);
    const isTextEmpty = this.mkEqEmpty(text);
    const isPatternEmpty = this.mkEqEmpty(pattern);
    const contains = this.mkSeq(OP_SEQ_CONTAINS, [text, pattern]);
    this.addClause([
      this.mkNot(isPatternEmpty),
      this.mkSeqEq(replace, this.mkConcat(target, text)),
    ]);
    this.addClause([this.mkNot(isTextEmpty), isPatternEmpty, this.mkSeqEq(replace, text)]);
    this.addClause([contains, this.mkSeqEq(replace, text)]);
    this.addClause([this.mkNot(contains), isTextEmpty, isPatternEmpty, this.mkSeqEq(text, whole)]);
    const notContains = this.mkNot(contains);
    this.addClause([notContains, isTextEmpty, isPatternEmpty, this.mkSeqEq(replace, replaced)]);
    this.tightestPrefix(pattern, left);
  }

  atAxiom(expr: number) {
    const manager = this.manager;
    const [seqArg, indexArg] = manager.getArgs(expr);
    const seq = this.purify(seqArg)!;
    const index = this.purify(indexArg)!;
    this.mkInt(0);
    const one = this.mkInt(1);
    const empty = this.mkEmpty(manager.sorts[expr]);
    this.mkLenAxiom(seq);
    const isIndexNonNegative = this.mkGe(index, 0);
    const isIndexBeyond = this.mkGe(this.mkSub(index, this.mkLenAxiom(seq)), 0);
    const exprLength = this.mkLenAxiom(expr);
    const value = manager.getNumeral(index);
    if (value !== undefined && value >= 0n && value <= BigInt(UINT_MAX)) {
      const elements: number[] = [];
      for (let offset = 0; offset <= Number(value); offset++)
        elements.push(this.mkUnit(this.mkNth(seq, offset)));
      const nth = elements[elements.length - 1];
      elements.push(this.skolem.mkTail(seq, index));
      this.addClause([
        this.mkNot(isIndexNonNegative),
        isIndexBeyond,
        this.mkSeqEq(seq, mkConcatOf(manager, elements, manager.sorts[expr])),
      ]);
      const isNegative = this.mkNot(isIndexNonNegative);
      this.addClause([isNegative, isIndexBeyond, this.mkSeqEq(nth, expr)]);
    } else {
      const prefix = this.skolem.mkPre(seq, index);
      const suffix = this.skolem.mkTail(seq, index);
      const whole = this.mkConcat(prefix, expr, suffix);
      const prefixLength = this.mkLenAxiom(prefix);
      this.addClause([this.mkNot(isIndexNonNegative), isIndexBeyond, this.mkSeqEq(seq, whole)]);
      const isNegative = this.mkNot(isIndexNonNegative);
      this.addClause([isNegative, isIndexBeyond, this.mkEq(index, prefixLength)]);
    }
    this.addClause([isIndexNonNegative, this.mkEq(expr, empty)]);
    const isNotBeyond = this.mkNot(isIndexBeyond);
    this.addClause([isNotBeyond, this.mkEq(expr, empty)]);
    this.addClause([this.mkNot(isIndexNonNegative), isIndexBeyond, this.mkEq(one, exprLength)]);
    this.addClause([this.mkLe(exprLength, 1)]);
  }

  nthAxiom(expr: number) {
    const manager = this.manager;
    const [seq, index] = manager.getArgs(expr);
    const chars = manager.getString(seq);
    const value = manager.getNumeral(index);
    if (chars !== undefined && value !== undefined && value >= 0n && value < BigInt(chars.length)) {
      this.addClause([this.mkEq(manager.mkChar(chars[Number(value)]), expr)]);
      return;
    }
    const zero = this.mkInt(0);
    const isIndexNonNegative = this.mkGe(index, 0);
    const isIndexBeyond = this.mkGe(this.mkSub(index, this.mkLenAxiom(seq)), 0);
    const unit = this.mkUnit(expr);
    const at =
      manager.getOp(seq) !== OP_SEQ_AT || zero !== index
        ? this.mkSeq(OP_SEQ_AT, [seq, index])
        : seq;
    const rhs = this.host.rewrite(at);
    this.addClause([this.mkNot(isIndexNonNegative), isIndexBeyond, this.mkEq(unit, rhs)]);
  }

  itosAxiom(expr: number) {
    const manager = this.manager;
    const number = manager.getArg(expr, 0);
    const zero = this.mkInt(0);
    const isEmpty = this.mkEq(expr, this.mkEmpty(manager.sorts[expr]));
    const isNonNegative = this.mkGe(number, 0);
    this.addClause([this.mkNot(isEmpty), this.mkNot(isNonNegative)]);
    this.addClause([isEmpty, isNonNegative]);
    this.addClause([this.mkGe(this.mkLenAxiom(expr), 0)]);
    const stoi = this.mkSeq(OP_STRING_STOI, [expr]);
    const isInverse = this.mkEq(stoi, number);
    this.addClause([this.mkNot(isNonNegative), isInverse]);
    this.host.forcePhase(this.mkLiteral(isInverse));
    const zeroString = this.host.rewrite(manager.mkString([48]));
    const isZero = this.mkEq(number, zero);
    const isAtZero = this.mkEq(this.mkSeq(OP_SEQ_AT, [expr, zero]), zeroString);
    this.addClause([isZero, this.mkNot(isAtZero)]);
    this.addClause([this.mkNot(isZero), this.mkEq(expr, zeroString)]);
  }

  stoiAxiom(expr: number) {
    const manager = this.manager;
    const isNonNegative = this.mkGe(expr, 0);
    const seq = manager.getArg(expr, 0);
    this.addClause([this.mkGe(expr, -1)]);
    const stoiEmpty = this.mkSeq(OP_STRING_STOI, [this.mkEmpty(manager.sorts[seq])]);
    this.addClause([this.mkEq(stoiEmpty, this.mkInt(-1))]);
    const isNegative = this.mkNot(isNonNegative);
    this.addClause([isNegative, this.isDigit(this.mkNth(seq, 0))]);
    this.addClause([isNegative, this.mkGe(this.mkLenAxiom(seq), 1)]);
  }

  stoiAxiomOf(expr: number, limit: number) {
    const seq = this.host.rewrite(this.manager.getArg(expr, 0));
    const stoi = (index: number) => this.skolem.mk("seq.stoi", [seq, this.mkInt(index)], SORT_INT);
    const digit = (index: number) => this.mkDigit2int(this.mkNth(seq, index));
    const isDigitAt = (index: number) => this.isDigit(this.mkNth(seq, index));
    const length = this.mkLenAxiom(seq);
    const isNonNegative = this.mkGe(expr, 0);
    const isShort = this.mkLe(length, limit);
    this.addClause([this.mkNot(isShort), this.mkEq(expr, stoi(limit - 1))]);
    {
      const isEmpty = this.mkLe(length, 0);
      const isNotDigit = this.mkNot(isDigitAt(0));
      const value = stoi(0);
      this.addClause([isEmpty, isNotDigit, this.mkEq(value, digit(0))]);
    }
    {
      const isEmpty = this.mkLe(length, 0);
      const isDigitFirst = isDigitAt(0);
      const value = stoi(0);
      this.addClause([isEmpty, isDigitFirst, this.mkEq(value, this.mkInt(-1))]);
    }
    for (let index = 1; index < limit; index++) {
      {
        const isLonger = this.mkNot(this.mkLe(length, index));
        const value = stoi(index);
        this.addClause([isLonger, this.mkEq(value, stoi(index - 1))]);
      }
      {
        const isShortEnough = this.mkLe(length, index);
        const isPreviousNegative = this.mkNot(this.mkGe(stoi(index - 1), 0));
        const isNotDigit = this.mkNot(isDigitAt(index));
        const value = stoi(index);
        const ten = this.mkInt(10);
        const previous = stoi(index - 1);
        const scaled = this.mkArith(OP_MUL, [ten, previous]);
        this.addClause([
          isShortEnough,
          isPreviousNegative,
          isNotDigit,
          this.mkEq(value, this.mkArith(OP_ADD, [scaled, digit(index)])),
        ]);
      }
      {
        const isShortEnough = this.mkLe(length, index);
        const isDigitHere = isDigitAt(index);
        const value = stoi(index);
        this.addClause([isShortEnough, isDigitHere, this.mkEq(value, this.mkInt(-1))]);
      }
      {
        const isShortEnough = this.mkLe(length, index);
        const isPreviousNonNegative = this.mkGe(stoi(index - 1), 0);
        const value = stoi(index);
        this.addClause([isShortEnough, isPreviousNonNegative, this.mkEq(value, this.mkInt(-1))]);
      }
      {
        const isNegative = this.mkNot(isNonNegative);
        const isShortEnough = this.mkLe(length, index);
        this.addClause([isNegative, isShortEnough, isDigitAt(index)]);
      }
    }
  }

  itosAxiomOf(expr: number, limit: number) {
    const number = this.manager.getArg(expr, 0);
    const length = this.mkLenAxiom(expr);
    {
      const isAtLeastTen = this.mkGe(number, 10);
      this.addClause([isAtLeastTen, this.mkLe(length, 1)]);
    }
    {
      const isNegative = this.mkLe(number, -1);
      this.addClause([isNegative, this.mkGe(length, 1)]);
    }
    let low = 1n;
    for (let index = 1; index <= limit; index++) {
      low *= 10n;
      {
        const isAtLeastLow = this.mkGe(number, low);
        this.addClause([isAtLeastLow, this.mkLe(length, index)]);
      }
      {
        const isBelowLow = this.mkLe(number, low - 1n);
        this.addClause([isBelowLow, this.mkGe(length, index + 1)]);
      }
    }
  }

  ltAxiom(expr: number) {
    const manager = this.manager;
    const [firstArg, secondArg] = manager.getArgs(expr);
    const first = this.purify(firstArg)!;
    const second = this.purify(secondArg)!;
    const charSort = manager.getSeqElementSort(manager.sorts[first]);
    const lt = expr;
    const gt = this.mkSeq(OP_STRING_LT, [second, first]);
    const skolem = this.skolem;
    const x = skolem.mk("str.<.x", [first, second]);
    const y = skolem.mk("str.<.y", [first, second]);
    const z = skolem.mk("str.<.z", [first, second]);
    const c = skolem.mk("str.<.c", [first, second], charSort);
    const d = skolem.mk("str.<.d", [first, second], charSort);
    const xcy = this.mkConcat(x, this.mkUnit(c), y);
    const xdz = this.mkConcat(x, this.mkUnit(d), z);
    const eq = this.mkEq(first, second);
    const prefix21 = this.mkSeq(OP_SEQ_PREFIX, [second, first]);
    const prefix12 = this.mkSeq(OP_SEQ_PREFIX, [first, second]);
    const isFirstXcy = this.mkEq(first, xcy);
    const isSecondXdz = this.mkEq(second, xdz);
    const isCLessD = this.mkNot(this.mkSeq(OP_CHAR_LE, [d, c]));
    const isDLessC = this.mkNot(this.mkSeq(OP_CHAR_LE, [c, d]));
    this.addClause([this.mkNot(lt), prefix12, isSecondXdz]);
    this.addClause([this.mkNot(lt), prefix12, isFirstXcy]);
    this.addClause([this.mkNot(lt), prefix12, isCLessD]);
    this.addClause([lt, prefix21, isFirstXcy]);
    this.addClause([lt, prefix21, isDLessC]);
    this.addClause([lt, prefix21, isSecondXdz]);
    this.addClause([this.mkNot(eq), this.mkNot(lt)]);
    this.addClause([eq, lt, gt]);
  }

  leAxiom(expr: number) {
    const [first, second] = this.manager.getArgs(expr);
    const lt = this.mkSeq(OP_STRING_LT, [first, second]);
    const eq = this.mkEq(first, second);
    this.addClause([this.mkNot(expr), lt, eq]);
    this.addClause([this.mkNot(eq), expr]);
    this.addClause([this.mkNot(lt), expr]);
  }

  isDigitAxiom(expr: number) {
    const code = this.mkSeq(OP_STRING_TO_CODE, [this.manager.getArg(expr, 0)]);
    const isAtLeastZero = this.mkGe(code, 48);
    const isAtMostNine = this.mkLe(code, 57);
    this.addClause([this.mkNot(expr), isAtLeastZero]);
    this.addClause([this.mkNot(expr), isAtMostNine]);
    const isBelow = this.mkNot(isAtLeastZero);
    this.addClause([expr, isBelow, this.mkNot(isAtMostNine)]);
  }

  strToCodeAxiom(expr: number) {
    const manager = this.manager;
    const seq = manager.getArg(expr, 0);
    const length = this.mkLenAxiom(seq);
    const isLengthOne = this.mkEq(length, this.mkInt(1));
    this.addClause([this.mkNot(isLengthOne), this.mkGe(expr, 0)]);
    {
      const notOne = this.mkNot(isLengthOne);
      this.addClause([notOne, this.mkLe(expr, this.manager.maxChar)]);
    }
    {
      const notOne = this.mkNot(isLengthOne);
      const value = this.mkEq(expr, this.mkSeq(OP_CHAR_TO_INT, [this.mkNth(seq, 0)]));
      this.addClause([notOne, value]);
    }
    if (manager.getOp(seq) !== OP_STRING_FROM_CODE) {
      const notOne = this.mkNot(isLengthOne);
      const inverse = this.mkEq(seq, this.mkSeq(OP_STRING_FROM_CODE, [expr]));
      this.addClause([notOne, inverse]);
    }
    this.addClause([isLengthOne, this.mkEq(expr, this.mkInt(-1))]);
  }

  strFromCodeAxiom(expr: number) {
    const manager = this.manager;
    const code = manager.getArg(expr, 0);
    const isNonNegative = this.mkGe(code, 0);
    const isAtMostMax = this.mkLe(code, this.manager.maxChar);
    const isEmpty = this.mkEq(expr, this.mkEmpty(manager.sorts[expr]));
    {
      const length = this.mkLenAxiom(expr);
      const one = this.mkInt(1);
      this.addClause([this.mkNot(isNonNegative), this.mkNot(isAtMostMax), this.mkEq(length, one)]);
    }
    if (manager.getOp(code) !== OP_STRING_TO_CODE) {
      const notNonNegative = this.mkNot(isNonNegative);
      const notAtMostMax = this.mkNot(isAtMostMax);
      const inverse = this.mkEq(this.mkSeq(OP_STRING_TO_CODE, [expr]), code);
      this.addClause([notNonNegative, notAtMostMax, inverse]);
    }
    this.addClause([isNonNegative, isEmpty]);
    this.addClause([isAtMostMax, isEmpty]);
  }

  unitAxiom(expr: number) {
    this.addClause([this.mkEq(this.manager.getArg(expr, 0), this.skolem.mkUnitInv(expr))]);
  }

  powerAxiom(expr: number) {
    const manager = this.manager;
    const [seq, exponent] = manager.getArgs(expr);
    const empty = this.mkEmpty(manager.sorts[expr]);
    const isPositive = this.mkGe(exponent, 1);
    const exprLength = this.mkLenAxiom(expr);
    this.addClause([isPositive, this.mkEq(expr, empty)]);
    {
      const notEmpty = this.mkNot(this.mkEq(seq, empty));
      this.addClause([notEmpty, this.mkEq(expr, empty)]);
    }
    this.addClause([
      this.mkNot(isPositive),
      this.mkEq(exprLength, this.mkArith(OP_MUL, [exponent, this.mkLenAxiom(seq)])),
    ]);
    {
      const notPositive = this.mkNot(isPositive);
      const isSeqEmpty = this.mkEq(seq, empty);
      this.addClause([notPositive, isSeqEmpty, this.mkGeE(exprLength, exponent)]);
    }
  }

  powerUnfoldAxiom(expr: number, limit: number) {
    const manager = this.manager;
    const [seq, exponent] = manager.getArgs(expr);
    let power = seq;
    const count = manager.getNumeral(exponent);
    if (count !== undefined) {
      if (count <= 0n || count > BigInt(limit)) return;
      for (let index = 1n; index < count; index++) power = this.mkConcat(seq, power);
      this.addClause([this.mkSeqEq(expr, power)]);
      return;
    }
    for (let index = 1; index <= limit; index++) {
      const isOther = this.mkNot(this.mkEq(exponent, this.mkInt(index)));
      this.addClause([isOther, this.mkSeqEq(expr, power)]);
      power = this.mkConcat(seq, power);
    }
  }

  suffixAxiom(expr: number) {
    this.affixAxiom(expr, "seq.suffix", false);
  }

  prefixAxiom(expr: number) {
    this.affixAxiom(expr, "seq.prefix", true);
  }

  private affixAxiom(expr: number, name: string, isPrefix: boolean) {
    const manager = this.manager;
    const [firstArg, secondArg] = manager.getArgs(expr);
    const first = this.purify(firstArg)!;
    const second = this.purify(secondArg)!;
    const firstLength = this.mkLenAxiom(first);
    const secondLength = this.mkLenAxiom(second);
    const isLonger = this.mkGe(this.mkSub(firstLength, secondLength), 1);
    const charSort = manager.getSeqElementSort(manager.sorts[first]);
    const skolem = this.skolem;
    const x = skolem.mk(`${name}.x`, [first, second]);
    const y = skolem.mk(`${name}.y`, [first, second]);
    const z = skolem.mk(`${name}.z`, [first, second]);
    const c = skolem.mk(`${name}.c`, [first, second], charSort);
    const d = skolem.mk(`${name}.d`, [first, second], charSort);
    this.addClause([
      expr,
      isLonger,
      this.mkSeqEq(
        first,
        isPrefix ? this.mkConcat(x, this.mkUnit(c), y) : this.mkConcat(y, this.mkUnit(c), x),
      ),
    ]);
    this.addClause([
      expr,
      isLonger,
      this.mkSeqEq(
        second,
        isPrefix ? this.mkConcat(x, this.mkUnit(d), z) : this.mkConcat(z, this.mkUnit(d), x),
      ),
    ]);
    this.addClause([expr, isLonger, this.mkNot(this.mkEq(c, d))]);
  }

  lengthAxiom(expr: number) {
    const manager = this.manager;
    const seq = manager.getArg(expr, 0);
    const op = manager.getOp(seq);
    if (op === OP_SEQ_EXTRACT) {
      const [source, offset, length] = manager.getArgs(seq);
      const sourceLength = this.mkLenAxiom(source);
      const zero = this.mkInt(0);
      const isLongEnough = this.mkGe(
        this.mkArith(OP_SUB, [sourceLength, this.mkArith(OP_ADD, [offset, length])]),
        0,
      );
      const isOffsetWithin = this.mkGe(this.mkArith(OP_SUB, [sourceLength, offset]), 0);
      const isOffsetNonNegative = this.mkGe(offset, 0);
      const isLengthNonNegative = this.mkGe(length, 0);
      this.addClause([
        this.mkNot(isOffsetNonNegative),
        this.mkNot(isLengthNonNegative),
        this.mkNot(isLongEnough),
        this.mkEq(expr, length),
      ]);
      this.addClause([isOffsetNonNegative, this.mkEq(expr, zero)]);
      this.addClause([isLengthNonNegative, this.mkEq(expr, zero)]);
      this.addClause([isOffsetWithin, this.mkEq(expr, zero)]);
      this.addClause([
        this.mkNot(isOffsetNonNegative),
        this.mkNot(isOffsetWithin),
        isLongEnough,
        this.mkEq(expr, this.mkArith(OP_SUB, [sourceLength, offset])),
      ]);
      return;
    }
    if (
      op === OP_SEQ_UNIT ||
      op === OP_SEQ_EMPTY ||
      op === OP_SEQ_CONCAT ||
      manager.getString(seq) !== undefined
    ) {
      this.addClause([this.mkEq(this.host.rewrite(expr), expr)]);
      return;
    }
    this.addClause([this.mkGe(expr, 0)]);
  }

  unrollNotContains(expr: number) {
    const manager = this.manager;
    const [text, pattern] = manager.getArgs(expr);
    const parts = this.skolem.decompose(text);
    const prefix = this.mkSeq(OP_SEQ_PREFIX, [pattern, text]);
    const tailContains = this.mkSeq(OP_SEQ_CONTAINS, [parts.tail, pattern]);
    const isEmpty = this.mkEqEmpty(text);
    this.addClause([expr, this.mkNot(prefix)]);
    this.addClause([expr, isEmpty, this.mkNot(tailContains)]);
    this.addClause([this.mkNot(isEmpty), this.mkEqEmpty(parts.tail)]);
    this.addClause([isEmpty, this.mkEq(text, this.mkConcat(parts.head, parts.tail))]);
    if (this.skolem.isTail(parts.tail))
      this.addClause([
        isEmpty,
        this.mkGeE(this.mkLenAxiom(manager.getArg(parts.tail, 0)), manager.getArg(parts.tail, 1)),
      ]);
  }

  lengthLimit(seq: number, limit: number) {
    const manager = this.manager;
    const tracker = this.skolem.mkLengthLimit(seq, limit);
    if (manager.getOp(seq) === OP_SEQ_POWER) {
      this.addClause([this.mkNot(tracker), this.mkLe(manager.getArg(seq, 1), limit)]);
      return tracker;
    }
    const target = manager.getOp(seq) === OP_STRING_STOI ? manager.getArg(seq, 0) : seq;
    this.addClause([this.mkNot(tracker), this.mkLe(this.mkLenAxiom(target), limit)]);
    return tracker;
  }

  ubvAxiom(): never {
    throw new SmtUnsupportedError("str.from_ubv in the theory of sequences");
  }

  isItos(expr: number) {
    return this.manager.getOp(expr) === OP_STRING_ITOS;
  }
}

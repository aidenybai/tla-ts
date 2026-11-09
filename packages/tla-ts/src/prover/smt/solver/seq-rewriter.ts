// Ported from Z3 (src/ast/rewriter/seq_rewriter.cpp, src/ast/rewriter/char_rewriter.cpp), MIT
// license, see z3-license.txt.
import { mkArrayApp } from "./array-decl-plugin";
import {
  type AstManager,
  FAMILY_CHAR,
  KIND_APP,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_BNEG,
  OP_CHAR_FROM_BV,
  OP_CHAR_IS_DIGIT,
  OP_CHAR_LE,
  OP_CHAR_TO_INT,
  OP_EQ,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_RE_COMPLEMENT,
  OP_RE_CONCAT,
  OP_RE_DERIVATIVE,
  OP_RE_DIFF,
  OP_RE_INTERSECT,
  OP_RE_LOOP,
  OP_RE_OPTION,
  OP_RE_PLUS,
  OP_RE_POWER,
  OP_RE_RANGE,
  OP_RE_REVERSE,
  OP_RE_STAR,
  OP_RE_UNION,
  OP_RE_XOR,
  OP_SELECT,
  OP_SEQ_AT,
  OP_SEQ_CONCAT,
  OP_SEQ_CONTAINS,
  OP_SEQ_EXTRACT,
  OP_SEQ_FOLDL,
  OP_SEQ_FOLDLI,
  OP_SEQ_IN_RE,
  OP_SEQ_INDEX,
  OP_SEQ_LAST_INDEX,
  OP_SEQ_LENGTH,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_NTH,
  OP_SEQ_NTH_I,
  OP_SEQ_NTH_U,
  OP_SEQ_POWER,
  OP_SEQ_PREFIX,
  OP_SEQ_REPLACE,
  OP_SEQ_REPLACE_ALL,
  OP_SEQ_REPLACE_RE,
  OP_SEQ_REPLACE_RE_ALL,
  OP_SEQ_SUFFIX,
  OP_SEQ_TO_RE,
  OP_SEQ_UNIT,
  OP_STRING_CONST,
  OP_SLT,
  OP_STRING_FROM_CODE,
  OP_STRING_IS_DIGIT,
  OP_STRING_ITOS,
  OP_STRING_LE,
  OP_STRING_LT,
  OP_STRING_SBVTOS,
  OP_STRING_STOI,
  OP_STRING_TO_CODE,
  OP_STRING_UBVTOS,
  OP_SUB,
  OP_UBV2INT,
  SORT_BOOL,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import { getCompositeHash } from "./hash";
import { ObjMap } from "./hashtable";
import type { Rewrite } from "./rewriter-tpl";
import {
  MAX_CHAR,
  getConcat,
  getConcatUnits,
  isBinaryApp,
  isEmptySeq,
  mkConcatOf,
  mkEmptySeq,
  mkSeqApp,
} from "./seq-decl-plugin";

const BR_REWRITE1 = 1;
const BR_REWRITE2 = 2;
const BR_REWRITE3 = 3;
const BR_REWRITE_FULL = 4;
const MAX_POWER_EXPANSION = 2n;
const UINT_MAX = 0xffffffffn;

const SHORTER = 0;
const LONGER = 1;
const SAME_LENGTH = 2;
const UNKNOWN_LENGTH = 3;

const SIGN_ZERO = 0;
const SIGN_POS = 1;
const SIGN_NEG = 2;

const L_FALSE = -1;
const L_UNDEF = 0;
const L_TRUE = 1;

const UNPORTED_OPS = new Set([
  OP_RE_PLUS,
  OP_RE_STAR,
  OP_RE_OPTION,
  OP_RE_REVERSE,
  OP_RE_DERIVATIVE,
  OP_RE_CONCAT,
  OP_RE_UNION,
  OP_RE_RANGE,
  OP_RE_DIFF,
  OP_RE_XOR,
  OP_RE_INTERSECT,
  OP_RE_COMPLEMENT,
  OP_RE_LOOP,
  OP_RE_POWER,
  OP_SEQ_TO_RE,
  OP_SEQ_IN_RE,
]);

const LIFTING_OPS = new Set([
  OP_SEQ_UNIT,
  OP_SEQ_CONCAT,
  OP_SEQ_LENGTH,
  OP_SEQ_POWER,
  OP_SEQ_EXTRACT,
  OP_SEQ_CONTAINS,
  OP_SEQ_AT,
  OP_SEQ_PREFIX,
  OP_SEQ_SUFFIX,
  OP_SEQ_INDEX,
  OP_SEQ_LAST_INDEX,
  OP_SEQ_REPLACE,
  OP_SEQ_REPLACE_ALL,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_FOLDL,
  OP_SEQ_FOLDLI,
  OP_SEQ_REPLACE_RE,
  OP_SEQ_REPLACE_RE_ALL,
  OP_STRING_LE,
  OP_STRING_LT,
  OP_STRING_FROM_CODE,
  OP_STRING_TO_CODE,
  OP_STRING_IS_DIGIT,
  OP_STRING_ITOS,
  OP_STRING_STOI,
  OP_STRING_UBVTOS,
  OP_STRING_SBVTOS,
]);

type Result = number | Rewrite | undefined;

export interface SeqPair {
  left: number[];
  right: number[];
}

export interface EqPair {
  left: number;
  right: number;
}

interface MinLength {
  isBounded: boolean;
  length: number;
}

const rewrite = (expr: number, depth: number): Rewrite => ({ expr, depth });

const isUnsigned = (value: bigint) => value >= 0n && value <= UINT_MAX;

const isPrefixOf = (prefix: readonly number[], chars: readonly number[]) =>
  prefix.length <= chars.length && prefix.every((code, index) => code === chars[index]);

const isSuffixOf = (suffix: readonly number[], chars: readonly number[]) =>
  suffix.length <= chars.length &&
  suffix.every((code, index) => code === chars[chars.length - suffix.length + index]);

const isMatchAt = (chars: readonly number[], other: readonly number[], index: number) =>
  other.every((code, inner) => chars[index + inner] === code);

const getIndexOf = (chars: readonly number[], other: readonly number[], offset: number) => {
  if (offset <= chars.length && other.length === 0) return offset;
  if (offset === chars.length || other.length + offset > chars.length) return -1;
  for (let index = offset; index <= chars.length - other.length; index++)
    if (isMatchAt(chars, other, index)) return index;
  return -1;
};

const getLastIndexOf = (chars: readonly number[], other: readonly number[]) => {
  if (other.length === 0) return chars.length;
  if (other.length > chars.length) return -1;
  for (let last = chars.length - other.length; last >= 0; last--)
    if (isMatchAt(chars, other, last)) return last;
  return -1;
};

const isContaining = (chars: readonly number[], other: readonly number[]) =>
  other.length <= chars.length && getIndexOf(chars, other, 0) !== -1;

const getReplaced = (
  chars: readonly number[],
  source: readonly number[],
  target: readonly number[],
) => {
  if (chars.length < source.length) return [...chars];
  if (source.length === 0) return [...target, ...chars];
  const index = getIndexOf(chars, source, 0);
  return index === -1
    ? [...chars]
    : [...chars.slice(0, index), ...target, ...chars.slice(index + source.length)];
};

const getExtract = (chars: readonly number[], offset: number, length: number) =>
  chars.slice(offset, Math.min(offset + length, chars.length));

const getCodes = (text: string) => [...text].map((char) => char.codePointAt(0)!);

const isDigit = (code: number) => code >= 48 && code <= 57;

const getCount = (bag: Map<number, number>, key: number) => bag.get(key) ?? 0;

const isSameBag = (first: Map<number, number>, second: Map<number, number>) =>
  first.size === second.size && [...first].every(([key, count]) => second.get(key) === count);

export class SeqRewriter {
  constructor(
    private manager: AstManager,
    private isCoalescingChars = true,
  ) {}

  private isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  private getArg(expr: number, index: number) {
    return this.manager.getArg(expr, index);
  }

  private getInt(expr: number) {
    return this.manager.getNumeral(expr);
  }

  private mkInt(value: bigint | number) {
    return this.manager.mkNumeral(BigInt(value));
  }

  private mkArith(op: number, args: number[]) {
    return this.manager.mkApp(op, args, this.manager.sorts[args[0]]);
  }

  private mkAdd(first: number, second: number) {
    return this.mkArith(OP_ADD, [first, second]);
  }

  private mkAddOf(args: number[]) {
    return args.length === 1 && this.manager.kinds[args[0]] === KIND_APP
      ? args[0]
      : this.mkArith(OP_ADD, args);
  }

  private mkSub(first: number, second: number) {
    return this.mkArith(OP_SUB, [first, second]);
  }

  private mkMul(first: number, second: number) {
    return this.mkArith(OP_MUL, [first, second]);
  }

  private mkCompare(op: number, first: number, second: number) {
    return this.manager.mkApp(op, [first, second], SORT_BOOL);
  }

  private mkLe(first: number, second: number) {
    return this.mkCompare(OP_LE, first, second);
  }

  private mkGe(first: number, second: number) {
    return this.mkCompare(OP_GE, first, second);
  }

  private mkLt(first: number, second: number) {
    return this.mkCompare(OP_LT, first, second);
  }

  private mkEq(first: number, second: number) {
    return this.mkCompare(OP_EQ, first, second);
  }

  private mkNot(arg: number) {
    return this.manager.mkApp(OP_NOT, [arg], SORT_BOOL);
  }

  private mkIte(condition: number, thenExpr: number, elseExpr: number) {
    return this.manager.mkApp(
      OP_ITE,
      [condition, thenExpr, elseExpr],
      this.manager.sorts[thenExpr],
    );
  }

  private mkBool(value: boolean) {
    return value ? this.manager.trueExpr : this.manager.falseExpr;
  }

  private mkSeq(op: number, args: number[]) {
    return mkSeqApp(this.manager, op, args);
  }

  private mkConcat(first: number, second: number) {
    return this.mkSeq(OP_SEQ_CONCAT, [first, second]);
  }

  private mkConcatOf(args: readonly number[], sort: number) {
    return mkConcatOf(this.manager, args, sort);
  }

  private mkEmpty(sort: number) {
    return mkEmptySeq(this.manager, sort);
  }

  private mkLength(arg: number) {
    return this.mkSeq(OP_SEQ_LENGTH, [arg]);
  }

  private mkSubstr(seq: number, offset: number, length: number) {
    return this.mkSeq(OP_SEQ_EXTRACT, [seq, offset, length]);
  }

  private mkIsEmpty(arg: number) {
    return this.mkEq(arg, this.mkEmpty(this.manager.sorts[arg]));
  }

  private mkUnit(code: number) {
    return this.mkSeq(OP_SEQ_UNIT, [this.manager.mkChar(code)]);
  }

  private isUnit(expr: number) {
    return this.isOp(expr, OP_SEQ_UNIT);
  }

  private isEmpty(expr: number) {
    return isEmptySeq(this.manager, expr);
  }

  private isConcat2(expr: number) {
    return isBinaryApp(this.manager, expr, OP_SEQ_CONCAT);
  }

  private isApp(expr: number, op: number, numArgs: number) {
    return this.isOp(expr, op) && this.manager.getNumArgs(expr) === numArgs;
  }

  private isValue(expr: number) {
    return this.manager.isValue(expr);
  }

  private areDistinct(first: number, second: number) {
    return this.manager.areDistinct(first, second);
  }

  private zero() {
    return this.mkInt(0);
  }

  private minusOne() {
    return this.mkInt(-1);
  }

  mkAppCore(decl: number, args: number[]): Result {
    const funcDecl = this.manager.funcDecls[decl];
    if (funcDecl.family === FAMILY_CHAR) return this.mkCharAppCore(funcDecl.op, args);
    const op = funcDecl.op;
    if (op === OP_STRING_CONST)
      return this.isCoalescingChars
        ? undefined
        : this.mkConcatOf(
            this.manager
              .getString(this.manager.mkApp(decl, [], funcDecl.range))!
              .map((code) => this.mkUnit(code)),
            funcDecl.range,
          );
    if (UNPORTED_OPS.has(op)) return undefined;
    const result = this.mkSeqAppCore(op, args);
    if (result !== undefined || !LIFTING_OPS.has(op)) return result;
    return this.liftItesThrottled(decl, args);
  }

  private mkSeqAppCore(op: number, args: number[]): Result {
    switch (op) {
      case OP_SEQ_UNIT: {
        const code = this.manager.getChar(args[0]);
        return code === -1 || !this.isCoalescingChars ? undefined : this.manager.mkString([code]);
      }
      case OP_SEQ_CONCAT:
        return args.length === 1 ? args[0] : this.mkSeqConcat(args[0], args[1]);
      case OP_SEQ_LENGTH:
        return this.mkSeqLength(args[0]);
      case OP_SEQ_POWER:
        return this.mkSeqPower(args[0], args[1]);
      case OP_SEQ_EXTRACT:
        return this.mkSeqExtract(args[0], args[1], args[2]);
      case OP_SEQ_CONTAINS:
        return this.mkSeqContains(args[0], args[1]);
      case OP_SEQ_AT:
        return this.mkSeqAt(args[0], args[1]);
      case OP_SEQ_NTH:
        return this.mkSeqNth(args[0], args[1]);
      case OP_SEQ_NTH_I:
        return this.mkSeqNthI(args[0], args[1]);
      case OP_SEQ_PREFIX:
        return this.mkSeqPrefix(args[0], args[1]);
      case OP_SEQ_SUFFIX:
        return this.mkSeqSuffix(args[0], args[1]);
      case OP_SEQ_INDEX:
        return args.length === 2
          ? rewrite(this.mkSeq(OP_SEQ_INDEX, [args[0], args[1], this.zero()]), BR_REWRITE1)
          : this.mkSeqIndex(args[0], args[1], args[2]);
      case OP_SEQ_LAST_INDEX:
        return this.mkSeqLastIndex(args[0], args[1]);
      case OP_SEQ_REPLACE:
        return this.mkSeqReplace(args[0], args[1], args[2]);
      case OP_SEQ_REPLACE_ALL:
        return this.mkSeqReplaceAll(args[0], args[1], args[2]);
      case OP_SEQ_MAP:
        return this.mkSeqMap(args[0], args[1]);
      case OP_SEQ_MAPI:
        return this.mkSeqMapi(args[0], args[1], args[2]);
      case OP_SEQ_FOLDL:
        return this.mkSeqFoldl(args[0], args[1], args[2]);
      case OP_SEQ_FOLDLI:
        return this.mkSeqFoldli(args[0], args[1], args[2], args[3]);
      case OP_STRING_LE:
        return rewrite(this.mkNot(this.mkSeq(OP_STRING_LT, [args[1], args[0]])), BR_REWRITE2);
      case OP_STRING_LT:
        return this.mkStrLt(args[0], args[1]);
      case OP_STRING_FROM_CODE:
        return this.mkStrFromCode(args[0]);
      case OP_STRING_TO_CODE:
        return this.mkStrToCode(args[0]);
      case OP_STRING_IS_DIGIT:
        return this.mkStrIsDigit(args[0]);
      case OP_STRING_ITOS:
        return this.mkStrItos(args[0]);
      case OP_STRING_STOI:
        return this.mkStrStoi(args[0]);
      case OP_STRING_UBVTOS:
        return this.mkStrUbv2s(args[0]);
      case OP_STRING_SBVTOS:
        return this.mkStrSbv2s(args[0]);
      default:
        return undefined;
    }
  }

  private mkCharAppCore(op: number, args: number[]): Result {
    const manager = this.manager;
    switch (op) {
      case OP_CHAR_LE: {
        const first = manager.getChar(args[0]);
        if (first === 0) return manager.trueExpr;
        const second = manager.getChar(args[1]);
        if (second === -1) return undefined;
        if (first > 0) return this.mkBool(first <= second);
        return second === MAX_CHAR ? manager.trueExpr : undefined;
      }
      case OP_CHAR_TO_INT: {
        const code = manager.getChar(args[0]);
        return code === -1 ? undefined : this.mkInt(code);
      }
      case OP_CHAR_FROM_BV: {
        if (!manager.isBvNumeral(args[0])) return undefined;
        const value = manager.getBvNumeralValue(args[0]);
        return value <= BigInt(MAX_CHAR) ? manager.mkChar(Number(value)) : undefined;
      }
      case OP_CHAR_IS_DIGIT: {
        const code = manager.getChar(args[0]);
        return code === -1 ? undefined : this.mkBool(isDigit(code));
      }
      default:
        return undefined;
    }
  }

  private liftItesThrottled(decl: number, args: number[]): Result {
    const manager = this.manager;
    const getDepth = (expr: number) =>
      manager.kinds[expr] === KIND_VAR ? 1 : manager.depths[expr];
    const range = manager.funcDecls[decl].range;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (!this.isOp(arg, OP_ITE)) continue;
      if (manager.isReSort(range) && manager.isSeqSort(manager.sorts[arg])) continue;
      const thenExpr = this.getArg(arg, 1);
      const elseExpr = this.getArg(arg, 2);
      if (
        getDepth(thenExpr) > 2 &&
        manager.getRefCount(thenExpr) !== 1 &&
        getDepth(elseExpr) > 2 &&
        manager.getRefCount(elseExpr) !== 1
      )
        continue;
      const newArgs = [...args];
      newArgs[index] = thenExpr;
      const first = manager.mkApp(decl, [...newArgs], range);
      newArgs[index] = elseExpr;
      const second = manager.mkApp(decl, newArgs, range);
      return rewrite(this.mkIte(this.getArg(arg, 0), first, second), BR_REWRITE2);
    }
    return undefined;
  }

  private mkSeqConcat(first: number, second: number): Result {
    const manager = this.manager;
    const firstChars = this.isCoalescingChars ? manager.getString(first) : undefined;
    const secondChars = this.isCoalescingChars ? manager.getString(second) : undefined;
    if (
      (firstChars === undefined || secondChars === undefined) &&
      !this.isOp(first, OP_SEQ_CONCAT) &&
      !this.isEmpty(first) &&
      !this.isEmpty(second) &&
      !(
        firstChars !== undefined &&
        this.isConcat2(second) &&
        manager.getString(this.getArg(second, 0)) !== undefined
      )
    )
      return undefined;
    if (firstChars !== undefined && secondChars !== undefined)
      return manager.mkString([...firstChars, ...secondChars]);
    const elements: number[] = [];
    const todo = [second, first];
    while (todo.length > 0) {
      const expr = todo.pop()!;
      if (this.isConcat2(expr)) {
        todo.push(this.getArg(expr, 1), this.getArg(expr, 0));
        continue;
      }
      if (!this.isEmpty(expr)) elements.push(expr);
    }
    if (elements.length === 0) return this.mkEmpty(manager.sorts[first]);
    const coalesced: number[] = [];
    for (const element of elements) {
      const previous = coalesced.length > 0 ? manager.getString(coalesced.at(-1)!) : undefined;
      const chars = manager.getString(element);
      if (this.isCoalescingChars && previous !== undefined && chars !== undefined)
        coalesced[coalesced.length - 1] = manager.mkString([...previous, ...chars]);
      else coalesced.push(element);
    }
    return coalesced
      .slice(0, -1)
      .reduceRight((tail, element) => this.mkConcat(element, tail), coalesced.at(-1)!);
  }

  private mkSeqLength(seq: number): Result {
    const elements = getConcat(this.manager, seq, []);
    let length = 0;
    const unbounded: number[] = [];
    for (const element of elements) {
      const minLength = this.getMinLength([element]);
      if (minLength.isBounded) length += minLength.length;
      else unbounded.push(element);
    }
    if (unbounded.length === 0) return this.mkInt(length);
    if (unbounded.length !== elements.length || unbounded.length !== 1) {
      const lengths = unbounded.map((element) => this.mkLength(element));
      if (length !== 0) lengths.push(this.mkInt(length));
      return rewrite(this.mkAddOf(lengths), BR_REWRITE2);
    }
    if (
      this.isApp(seq, OP_SEQ_REPLACE, 3) &&
      this.getEqLength(this.getArg(seq, 1), this.getArg(seq, 2)) === L_TRUE
    )
      return rewrite(this.mkLength(this.getArg(seq, 0)), BR_REWRITE1);
    if (this.isApp(seq, OP_SEQ_MAP, 2))
      return rewrite(this.mkLength(this.getArg(seq, 1)), BR_REWRITE1);
    if (this.isApp(seq, OP_SEQ_MAPI, 3))
      return rewrite(this.mkLength(this.getArg(seq, 2)), BR_REWRITE1);
    if (this.isApp(seq, OP_SEQ_POWER, 2)) {
      const exponent = this.getInt(this.getArg(seq, 1));
      if (exponent !== undefined && exponent >= 0n)
        return rewrite(
          this.mkMul(this.getArg(seq, 1), this.mkLength(this.getArg(seq, 0))),
          BR_REWRITE2,
        );
    }
    if (this.isApp(seq, OP_SEQ_EXTRACT, 3)) {
      const length = this.getArg(seq, 2);
      const lengthValue = this.getInt(length);
      if (
        this.getInt(this.getArg(seq, 1)) === 0n &&
        lengthValue !== undefined &&
        lengthValue >= 0n
      ) {
        const sourceLength = this.mkLength(this.getArg(seq, 0));
        return rewrite(
          this.mkIte(this.mkLe(sourceLength, length), sourceLength, length),
          BR_REWRITE_FULL,
        );
      }
    }
    return undefined;
  }

  private mkSeqPower(seq: number, exponent: number): Result {
    const manager = this.manager;
    if (this.isEmpty(seq)) return seq;
    const count = this.getInt(exponent);
    if (count !== undefined && count <= 0n) return this.mkEmpty(manager.sorts[seq]);
    if (count === 1n) return seq;
    if (this.isApp(seq, OP_SEQ_POWER, 2)) {
      const inner = this.getInt(this.getArg(seq, 1));
      if (count !== undefined || (inner !== undefined && inner > 0n))
        return rewrite(
          this.mkSeq(OP_SEQ_POWER, [
            this.getArg(seq, 0),
            this.mkMul(this.getArg(seq, 1), exponent),
          ]),
          BR_REWRITE_FULL,
        );
    }
    if (count === undefined || count > MAX_POWER_EXPANSION) return undefined;
    const chars = manager.getString(seq);
    if (chars !== undefined) {
      if (!isUnsigned(count * BigInt(chars.length))) return undefined;
      return manager.mkString(Array.from({ length: Number(count) }, () => chars).flat());
    }
    return rewrite(
      this.mkConcatOf(
        Array.from({ length: Number(count) }, () => seq),
        manager.sorts[seq],
      ),
      BR_REWRITE_FULL,
    );
  }

  private getSign(expr: number): number | undefined {
    const manager = this.manager;
    if (this.isOp(expr, OP_ADD)) {
      let sign = SIGN_ZERO;
      for (const arg of manager.getArgs(expr)) {
        const argSign = this.getSign(arg);
        if (argSign === undefined) return undefined;
        if (sign === SIGN_ZERO) sign = argSign;
        else if (argSign !== SIGN_ZERO && argSign !== sign) return undefined;
      }
      return sign;
    }
    if (this.isOp(expr, OP_MUL)) {
      let sign = SIGN_ZERO;
      for (const arg of manager.getArgs(expr)) {
        const argSign = this.getSign(arg);
        if (argSign === undefined) return undefined;
        if (argSign === SIGN_ZERO) return SIGN_ZERO;
        sign = sign === SIGN_ZERO ? argSign : sign !== argSign ? SIGN_NEG : SIGN_POS;
      }
      return sign;
    }
    if (this.isOp(expr, OP_SEQ_LENGTH)) return SIGN_POS;
    if (!manager.isNumeral(expr)) return undefined;
    const value = manager.getRationalValue(expr);
    return value.isPositive() ? SIGN_POS : value.isNegative() ? SIGN_NEG : SIGN_ZERO;
  }

  private getLengths(expr: number, lengths: number[], offset: { value: bigint }): boolean {
    const manager = this.manager;
    if (this.isOp(expr, OP_ADD))
      return manager.getArgs(expr).every((arg) => this.getLengths(arg, lengths, offset));
    if (this.isOp(expr, OP_SEQ_LENGTH)) {
      lengths.push(this.getArg(expr, 0));
      return true;
    }
    if (this.isApp(expr, OP_MUL, 2)) {
      const factor = this.getInt(this.getArg(expr, 0));
      const length = this.getArg(expr, 1);
      if (
        factor !== undefined &&
        this.isOp(length, OP_SEQ_LENGTH) &&
        factor >= 0n &&
        factor <= 10n
      ) {
        for (let count = 0n; count < factor; count++) lengths.push(this.getArg(length, 0));
        return true;
      }
    }
    const value = this.getInt(expr);
    if (value === undefined) return false;
    offset.value += value;
    return true;
  }

  private isSuffix(seq: number, offset: number, length: number) {
    const lengths: number[] = [];
    const sum = { value: 0n };
    if (!this.getLengths(length, lengths, sum)) return false;
    const start = this.getInt(offset);
    return start !== undefined && start > 0n && -sum.value === start && lengths.includes(seq);
  }

  private isPrefix(seq: number, offset: number, length: number) {
    const lengths: number[] = [];
    const sum = { value: 0n };
    return (
      this.getLengths(length, lengths, sum) &&
      sum.value < 0n &&
      this.getInt(offset) === 0n &&
      lengths.length === 1 &&
      lengths[0] === seq
    );
  }

  private mkLen(offset: bigint, seqs: number[]) {
    return seqs.reduce((sum, seq) => this.mkAdd(sum, this.mkLength(seq)), this.mkInt(offset));
  }

  private removeFirst(values: number[], value: number) {
    const index = values.indexOf(value);
    if (index === -1) return false;
    values.splice(index, 1);
    return true;
  }

  private extractPopSuffix(units: number[], offset: number, length: number) {
    const start = this.getInt(offset);
    const count = this.getInt(length);
    if (units.length === 0 || start === undefined || count === undefined) return undefined;
    if (!(BigInt(this.getMinLength(units).length) >= start + count && start >= 0n && count >= 0n))
      return undefined;
    let index = 0;
    let total = 0n;
    for (; index < units.length && total < start + count; index++)
      total += BigInt(this.getMinLength([units[index]]).length);
    if (index >= units.length) return undefined;
    const prefix = this.mkConcatOf(units.slice(0, index), this.manager.sorts[units[0]]);
    return this.mkSubstr(prefix, offset, length);
  }

  private extractPushOffset(units: number[], offset: number, length: number) {
    const lengths: number[] = [];
    const sum = { value: 0n };
    if (!this.getLengths(offset, lengths, sum) || sum.value < 0n) return undefined;
    let index = 0;
    for (; index < units.length; index++) {
      const unit = units[index];
      if (this.removeFirst(lengths, unit)) continue;
      if (this.isUnit(unit) && sum.value > 0n) sum.value -= 1n;
      else break;
    }
    if (index === 0) return undefined;
    const rest = this.mkConcatOf(units.slice(index), this.manager.sorts[units[0]]);
    return this.mkSubstr(rest, this.mkLen(sum.value, lengths), length);
  }

  private extractPushLength(units: number[], offset: number, length: number) {
    const lengths: number[] = [];
    const sum = { value: 0n };
    if (
      units.length === 0 ||
      this.getInt(offset) !== 0n ||
      !this.getLengths(length, lengths, sum) ||
      sum.value < 0n
    )
      return undefined;
    let index = 0;
    for (; index < units.length; index++) {
      const unit = units[index];
      if (this.removeFirst(lengths, unit)) continue;
      if (this.isUnit(unit) && sum.value > 0n) sum.value -= 1n;
      else break;
    }
    const sort = this.manager.sorts[units[0]];
    if (index === units.length) return this.mkConcatOf(units, sort);
    if (index === 0) return undefined;
    const rest = this.mkConcatOf(units.slice(index), sort);
    const extract = this.mkSubstr(rest, offset, this.mkLen(sum.value, lengths));
    return this.mkConcatOf([...units.slice(0, index), extract], sort);
  }

  private mkSeqExtract(seq: number, offset: number, length: number): Result {
    const manager = this.manager;
    const chars = manager.getString(seq);
    const start = this.getInt(offset);
    const count = this.getInt(length);
    const sort = manager.sorts[seq];
    if (this.getSign(length) === SIGN_NEG) return this.mkEmpty(sort);
    if ((start !== undefined && start < 0n) || (count !== undefined && count <= 0n))
      return this.mkEmpty(sort);
    if (start !== undefined && chars !== undefined && start >= BigInt(chars.length))
      return this.mkEmpty(sort);
    if (start !== undefined) {
      const maxLength = this.getMaxLength(seq);
      if (maxLength.isBounded && maxLength.length <= start) return this.mkEmpty(sort);
    }
    if (this.isOp(offset, OP_MUL)) {
      let hasBaseLength = false;
      let isOtherFactorAtLeastOne = true;
      const todo = [offset];
      const visited = new Set<number>();
      while (todo.length > 0) {
        const arg = todo.pop()!;
        if (visited.has(arg)) continue;
        visited.add(arg);
        if (this.isOp(arg, OP_MUL)) todo.push(...manager.getArgs(arg));
        else if (this.isOp(arg, OP_SEQ_LENGTH) && this.getArg(arg, 0) === seq) hasBaseLength = true;
        else {
          const factor = manager.isNumeral(arg) ? manager.getRationalValue(arg) : undefined;
          if (factor === undefined || factor.num < factor.den) {
            isOtherFactorAtLeastOne = false;
            break;
          }
        }
      }
      if (hasBaseLength && isOtherFactorAtLeastOne) return this.mkEmpty(sort);
    }
    const position = start !== undefined && isUnsigned(start) ? start : undefined;
    const size = count !== undefined && isUnsigned(count) ? count : undefined;
    if (size === 1n) return rewrite(this.mkSeq(OP_SEQ_AT, [seq, offset]), BR_REWRITE1);
    if (position !== undefined && size !== undefined && chars !== undefined)
      return manager.mkString(
        position + size >= BigInt(chars.length)
          ? chars.slice(Number(position))
          : getExtract(chars, Number(position), Number(size)),
      );
    const units = getConcatUnits(manager, seq, []);
    if (units.length === 0) return this.mkEmpty(sort);
    const popped = this.extractPopSuffix(units, offset, length);
    if (popped !== undefined) return rewrite(popped, BR_REWRITE1);
    const pushedOffset = this.extractPushOffset(units, offset, length);
    if (pushedOffset !== undefined) return rewrite(pushedOffset, BR_REWRITE3);
    const pushedLength = this.extractPushLength(units, offset, length);
    if (pushedLength !== undefined) return rewrite(pushedLength, BR_REWRITE3);
    const isExtract = this.isApp(seq, OP_SEQ_EXTRACT, 3);
    const inner = isExtract ? this.getArg(seq, 0) : -1;
    const innerOffset = isExtract ? this.getArg(seq, 1) : -1;
    const innerLength = isExtract ? this.getArg(seq, 2) : -1;
    if (
      isExtract &&
      this.isSuffix(inner, innerOffset, innerLength) &&
      this.isSuffix(seq, offset, length)
    ) {
      const newOffset = this.mkAdd(innerOffset, offset);
      return rewrite(this.mkSubstr(inner, newOffset, this.mkSub(innerLength, offset)), BR_REWRITE3);
    }
    const innerStart = isExtract ? this.getInt(innerOffset) : undefined;
    const innerCount = isExtract ? this.getInt(innerLength) : undefined;
    if (
      innerStart !== undefined &&
      isUnsigned(innerStart) &&
      innerCount !== undefined &&
      isUnsigned(innerCount) &&
      position !== undefined &&
      size !== undefined
    ) {
      if (innerStart === 0n && innerCount >= position + size)
        return rewrite(this.mkSubstr(inner, offset, length), BR_REWRITE1);
      if (position <= innerCount) {
        const newCount = innerCount - position < size ? innerCount - position : size;
        const newStart = this.mkInt(innerStart + position);
        return rewrite(this.mkSubstr(inner, newStart, this.mkInt(newCount)), BR_REWRITE1);
      }
    }
    if (
      isExtract &&
      this.isPrefix(inner, innerOffset, innerLength) &&
      this.isPrefix(seq, offset, length)
    ) {
      const seqLength = this.mkLength(seq);
      return rewrite(
        this.mkSubstr(inner, offset, this.mkSub(innerLength, this.mkSub(seqLength, length))),
        BR_REWRITE3,
      );
    }
    if (
      isExtract &&
      this.isPrefix(seq, offset, length) &&
      this.isSuffix(inner, innerOffset, innerLength)
    ) {
      const difference = this.mkSub(length, this.mkLength(seq));
      const suffixLength = this.mkSub(this.mkLength(inner), innerOffset);
      return rewrite(
        this.mkSubstr(inner, innerOffset, this.mkAdd(suffixLength, difference)),
        BR_REWRITE3,
      );
    }
    if (
      isExtract &&
      start === 0n &&
      this.isOp(length, OP_SEQ_LENGTH) &&
      this.getArg(length, 0) === inner
    )
      return seq;
    if (isExtract && start === 0n && length === innerLength) return seq;
    if (
      isExtract &&
      this.isSuffix(seq, offset, length) &&
      manager.isNumeral(innerLength) &&
      manager.isNumeral(innerOffset)
    ) {
      const newOffset = this.mkAdd(offset, innerOffset);
      return rewrite(this.mkSubstr(inner, newOffset, this.mkSub(innerLength, offset)), BR_REWRITE2);
    }
    if (position === undefined) return undefined;
    let unitCount = 0;
    while (unitCount < units.length && this.isUnit(units[unitCount]) && unitCount < position)
      unitCount++;
    if (unitCount === 0 && position > 0n) return undefined;
    if (position === 0n && units.every((unit) => this.isUnit(unit))) {
      let result = this.mkEmpty(sort);
      for (let index = 1; index <= units.length; index++) {
        const condition = this.mkGe(length, this.mkInt(index));
        result = this.mkIte(condition, this.mkConcatOf(units.slice(0, index), sort), result);
      }
      return rewrite(result, BR_REWRITE_FULL);
    }
    if (position === 0n && size === undefined) return undefined;
    if (unitCount === units.length) return this.mkEmpty(sort);
    if (size !== undefined && position === BigInt(unitCount)) {
      let index = unitCount;
      while (index < units.length && this.isUnit(units[index]) && BigInt(index - unitCount) < size)
        index++;
      if (BigInt(index - unitCount) === size)
        return this.mkConcatOf(units.slice(unitCount, index), sort);
      if (index === units.length)
        return this.mkConcatOf(units.slice(unitCount), manager.sorts[units[0]]);
    }
    if (unitCount === 0) return undefined;
    const newOffset = this.mkSub(offset, this.mkInt(unitCount));
    const rest = this.mkConcatOf(units.slice(unitCount), manager.sorts[units[0]]);
    return rewrite(this.mkSubstr(rest, newOffset, length), BR_REWRITE3);
  }

  private isUnitDistinct(first: number, second: number) {
    return this.isUnit(first) && this.isUnit(second) && this.areDistinct(first, second);
  }

  private isNotContainingSuffix(first: number, second: number) {
    if (this.isUnitDistinct(first, second)) return true;
    const firstChars = this.manager.getString(first);
    const secondChars = this.manager.getString(second);
    if (firstChars === undefined || secondChars === undefined) return false;
    for (let index = 1; index <= firstChars.length; index++)
      if (isSuffixOf(firstChars.slice(0, index), secondChars)) return false;
    return true;
  }

  private isNotContainingPrefix(first: number, second: number) {
    if (this.isUnitDistinct(first, second)) return true;
    const firstChars = this.manager.getString(first);
    const secondChars = this.manager.getString(second);
    if (firstChars === undefined || secondChars === undefined) return false;
    for (let index = 0; index < firstChars.length; index++)
      if (isSuffixOf(firstChars.slice(index), secondChars)) return false;
    return true;
  }

  private mkSeqContains(seq: number, other: number): Result {
    const manager = this.manager;
    const seqChars = manager.getString(seq);
    const otherChars = manager.getString(other);
    if (seqChars !== undefined && otherChars !== undefined)
      return this.mkBool(isContaining(seqChars, otherChars));
    if (this.isApp(other, OP_SEQ_EXTRACT, 3) && this.getArg(other, 0) === seq)
      return manager.trueExpr;
    const seqUnits = getConcatUnits(manager, seq, []);
    const otherUnits = getConcatUnits(manager, other, []);
    if (otherUnits.length === 0) return manager.trueExpr;
    if (seqUnits.length === 0) return rewrite(this.mkIsEmpty(other), BR_REWRITE2);
    const maxLength = this.getMaxLength(seq);
    if (maxLength.isBounded && maxLength.length <= 1n) {
      const isEmpty = this.mkIsEmpty(other);
      return rewrite(
        manager.mkApp(OP_OR, [isEmpty, this.mkEq(seq, other)], SORT_BOOL),
        BR_REWRITE2,
      );
    }
    for (let index = 0; otherUnits.length + index <= seqUnits.length; index++)
      if (otherUnits.every((unit, inner) => seqUnits[inner + index] === unit))
        return manager.trueExpr;
    if (
      otherUnits.every((unit) => this.isValue(unit)) &&
      seqUnits.every((unit) => this.isValue(unit))
    )
      return manager.falseExpr;
    const seqMinLength = this.getMinLength(seqUnits);
    if (seqMinLength.isBounded && this.getMinLength(otherUnits).length > seqMinLength.length)
      return manager.falseExpr;
    let start = 0;
    let end = seqUnits.length;
    const first = otherUnits[0];
    const last = otherUnits.at(-1)!;
    while (start < seqUnits.length && this.isNotContainingPrefix(seqUnits[start], first)) start++;
    while (end > start && this.isNotContainingSuffix(seqUnits[end - 1], last)) end--;
    if (start === end) return rewrite(this.mkIsEmpty(other), BR_REWRITE2);
    if (start > 0 || end < seqUnits.length) {
      const middle = this.mkConcatOf(seqUnits.slice(start, end), manager.sorts[seq]);
      return rewrite(this.mkSeq(OP_SEQ_CONTAINS, [middle, other]), BR_REWRITE2);
    }
    if (
      otherUnits.every((unit) => this.isUnit(unit)) &&
      seqUnits.every((unit) => this.isUnit(unit))
    ) {
      const disjuncts: number[] = [];
      for (let index = 0; index + otherUnits.length <= seqUnits.length; index++)
        disjuncts.push(
          manager.mkAnd(otherUnits.map((unit, inner) => this.mkEq(seqUnits[index + inner], unit))),
        );
      return rewrite(manager.mkOr(disjuncts), BR_REWRITE_FULL);
    }
    if (otherUnits.length === 1 && this.isUnit(otherUnits[0]) && seqUnits.length > 1)
      return rewrite(
        manager.mkOr(seqUnits.map((unit) => this.mkSeq(OP_SEQ_CONTAINS, [unit, otherUnits[0]]))),
        BR_REWRITE_FULL,
      );
    if (this.isUnit(other) && this.isValue(other)) {
      const reduced = this.reduceByChar(seq, other, 4);
      if (reduced !== undefined)
        return rewrite(this.mkSeq(OP_SEQ_CONTAINS, [reduced, other]), BR_REWRITE1);
    }
    return undefined;
  }

  private reduceByChar(expr: number, char: number, depth: number): number | undefined {
    const manager = this.manager;
    if (this.isApp(expr, OP_SEQ_REPLACE, 3)) {
      const [source, from, to] = manager.getArgs(expr);
      if (
        this.isUnit(from) &&
        this.isValue(from) &&
        this.isUnit(to) &&
        this.isValue(to) &&
        char !== from &&
        char !== to
      )
        return depth > 0 ? (this.reduceByChar(source, char, depth - 1) ?? source) : source;
    }
    if (depth > 0 && this.isOp(expr, OP_SEQ_CONCAT)) {
      let isReduced = false;
      const args = manager.getArgs(expr).map((arg) => {
        const reduced = this.reduceByChar(arg, char, depth - 1);
        if (reduced === undefined) return arg;
        isReduced = true;
        return reduced;
      });
      return isReduced ? this.mkConcatOf(args, manager.sorts[args[0]]) : undefined;
    }
    if (depth > 0 && this.isApp(expr, OP_SEQ_EXTRACT, 3)) {
      const reduced = this.reduceByChar(this.getArg(expr, 0), char, depth - 1);
      if (reduced !== undefined)
        return this.mkSubstr(reduced, this.getArg(expr, 1), this.getArg(expr, 2));
    }
    return undefined;
  }

  private mkSeqAt(seq: number, index: number): Result {
    const manager = this.manager;
    const sort = manager.sorts[seq];
    if (this.isApp(seq, OP_SEQ_EXTRACT, 3)) {
      const length = this.getInt(this.getArg(seq, 2));
      const position = this.getInt(index);
      if (
        this.getInt(this.getArg(seq, 1)) === 0n &&
        length !== undefined &&
        position !== undefined &&
        position < length
      )
        return rewrite(this.mkSeq(OP_SEQ_AT, [this.getArg(seq, 0), index]), BR_REWRITE1);
    }
    const lengths: number[] = [];
    const offset = { value: 0n };
    if (!this.getLengths(index, lengths, offset)) return undefined;
    if (lengths.length === 0 && offset.value < 0n) return this.mkEmpty(sort);
    if (lengths.length === 0 && this.isApp(seq, OP_SEQ_AT, 2))
      return offset.value > 0n ? this.mkEmpty(sort) : seq;
    const units = getConcatUnits(manager, seq, []);
    if (units.length === 0) return this.mkEmpty(sort);
    let count = 0;
    for (; count < units.length; count++) {
      const unit = units[count];
      if (lengths.includes(unit) && offset.value >= 0n) this.removeFirst(lengths, unit);
      else if (this.isUnit(unit) && offset.value === 0n && lengths.length === 0)
        return rewrite(unit, BR_REWRITE1);
      else if (this.isUnit(unit) && offset.value > 0n) offset.value -= 1n;
      else break;
    }
    if (count === 0) return undefined;
    if (count === units.length) return this.mkEmpty(sort);
    const position = lengths.reduce(
      (sum, length) => this.mkAdd(sum, this.mkLength(length)),
      this.mkInt(offset.value),
    );
    const rest = this.mkConcatOf(units.slice(count), sort);
    return rewrite(this.mkSeq(OP_SEQ_AT, [rest, position]), BR_REWRITE2);
  }

  private mkSeqNth(seq: number, index: number): Result {
    const manager = this.manager;
    const position = this.getInt(index);
    if (this.isUnit(seq) && position === 0n) return this.getArg(seq, 0);
    if (this.isApp(seq, OP_SEQ_EXTRACT, 3)) {
      const source = this.getArg(seq, 0);
      const start = this.getInt(this.getArg(seq, 1));
      if (start !== undefined && start > 0n) {
        const lengths: number[] = [];
        const sum = { value: 0n };
        if (
          this.getLengths(this.getArg(seq, 2), lengths, sum) &&
          start === -sum.value &&
          lengths.length === 1 &&
          lengths[0] === source
        ) {
          const shift = this.mkInt(start);
          const inRange = this.mkSeq(OP_SEQ_NTH_I, [source, this.mkAdd(index, shift)]);
          const pastEmpty = this.mkSeq(OP_SEQ_NTH_U, [this.mkEmpty(manager.sorts[source]), index]);
          const outOfRange = this.mkSeq(OP_SEQ_NTH_U, [seq, index]);
          const shifted = this.mkAdd(shift, index);
          let result = this.mkIte(this.mkLt(shifted, this.mkLength(source)), inRange, outOfRange);
          result = this.mkIte(this.mkGe(shift, this.mkLength(source)), pastEmpty, result);
          result = this.mkIte(this.mkLt(index, this.zero()), outOfRange, result);
          return rewrite(result, BR_REWRITE_FULL);
        }
      }
    }
    const minLength = this.getMinLength([seq]);
    if (minLength.isBounded && position !== undefined)
      return rewrite(
        this.mkSeq(
          position >= 0n && position < BigInt(minLength.length) ? OP_SEQ_NTH_I : OP_SEQ_NTH_U,
          [seq, index],
        ),
        BR_REWRITE_FULL,
      );
    const length = this.mkLength(seq);
    const isNonNegative = this.mkGe(index, this.zero());
    const isInRange = this.mkNot(this.mkLe(length, index));
    const guard = manager.mkApp(OP_AND, [isNonNegative, isInRange], SORT_BOOL);
    const inRange = this.mkSeq(OP_SEQ_NTH_I, [seq, index]);
    return rewrite(
      this.mkIte(guard, inRange, this.mkSeq(OP_SEQ_NTH_U, [seq, index])),
      BR_REWRITE_FULL,
    );
  }

  private mkSeqNthI(seq: number, index: number): Result {
    const manager = this.manager;
    const offsetValue = this.getInt(index);
    if (offsetValue === undefined || !isUnsigned(offsetValue)) return undefined;
    const offset = Number(offsetValue);
    if (offset === 0 && this.isApp(seq, OP_SEQ_AT, 2) && this.getInt(this.getArg(seq, 1)) === 0n)
      return rewrite(
        this.mkSeq(OP_SEQ_NTH_I, [this.getArg(seq, 0), this.getArg(seq, 1)]),
        BR_REWRITE1,
      );
    if (this.isApp(seq, OP_SEQ_MAP, 2)) {
      const element = this.mkSeq(OP_SEQ_NTH_I, [this.getArg(seq, 1), index]);
      return rewrite(mkArrayApp(manager, OP_SELECT, [this.getArg(seq, 0), element]), BR_REWRITE1);
    }
    let position = 0;
    for (const unit of getConcatUnits(manager, seq, [])) {
      if (this.isUnit(unit)) {
        if (offset === position) return this.getArg(unit, 0);
        position++;
        continue;
      }
      if (!this.isOp(unit, OP_ITE)) break;
      const minLength = this.getMinLength([unit]);
      if (!minLength.isBounded) break;
      if (position + minLength.length <= offset) {
        position += minLength.length;
        continue;
      }
      const innerIndex = this.mkInt(offset - position);
      const thenExpr = this.mkSeq(OP_SEQ_NTH_I, [this.getArg(unit, 1), innerIndex]);
      const elseExpr = this.mkSeq(OP_SEQ_NTH_I, [this.getArg(unit, 2), innerIndex]);
      return rewrite(this.mkIte(this.getArg(unit, 0), thenExpr, elseExpr), BR_REWRITE2);
    }
    return undefined;
  }

  private compareLengths(first: number[], second: number[]) {
    let firstUnits = 0;
    let secondUnits = 0;
    const counts = new Map<number, number>();
    let hasForeign = false;
    for (const element of first)
      if (this.isUnit(element)) firstUnits++;
      else counts.set(element, getCount(counts, element) + 1);
    for (const element of second) {
      if (this.isUnit(element)) secondUnits++;
      else if (counts.has(element)) {
        const count = getCount(counts, element) - 1;
        if (count === 0) counts.delete(element);
        else counts.set(element, count);
      } else hasForeign = true;
    }
    if (firstUnits > secondUnits && !hasForeign) return LONGER;
    if (firstUnits === secondUnits && !hasForeign && counts.size === 0) return SAME_LENGTH;
    if (secondUnits > firstUnits && counts.size === 0) return SHORTER;
    return UNKNOWN_LENGTH;
  }

  private mkSeqLastIndex(seq: number, other: number): Result {
    const manager = this.manager;
    const seqChars = manager.getString(seq);
    const otherChars = manager.getString(other);
    if (seqChars !== undefined && otherChars !== undefined)
      return this.mkInt(getLastIndexOf(seqChars, otherChars));
    if (seq === other) return this.mkInt(0);
    if (this.isEmpty(other)) return this.mkLength(seq);
    const seqUnits = getConcatUnits(manager, seq, []);
    const otherUnits = getConcatUnits(manager, other, []);
    const getSuffixMatch = () => {
      if (seqUnits.length < otherUnits.length) return L_UNDEF;
      for (let index = 0; index < otherUnits.length; index++) {
        const seqUnit = seqUnits[seqUnits.length - index - 1];
        const otherUnit = otherUnits[otherUnits.length - index - 1];
        if (seqUnit === otherUnit) continue;
        return this.areDistinct(seqUnit, otherUnit) ? L_FALSE : L_UNDEF;
      }
      return L_TRUE;
    };
    switch (this.compareLengths(seqUnits, otherUnits)) {
      case SHORTER:
        return this.minusOne();
      case SAME_LENGTH: {
        const isEqual = this.mkEq(seq, other);
        const found = this.zero();
        return rewrite(this.mkIte(isEqual, found, this.minusOne()), BR_REWRITE_FULL);
      }
      case LONGER: {
        // Z3 subtracts these sizes as unsigned integers, so its offset wraps; this one does not.
        if (!otherUnits.every((unit) => this.isUnit(unit))) return undefined;
        let popped = 0;
        while (seqUnits.length >= otherUnits.length) {
          const match = getSuffixMatch();
          if (match === L_UNDEF) return undefined;
          if (match === L_TRUE)
            return rewrite(
              this.mkSub(this.mkLength(seq), this.mkInt(popped + otherUnits.length)),
              BR_REWRITE3,
            );
          if (!this.isUnit(seqUnits.pop()!)) return undefined;
          popped++;
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }

  private mkSeqIndex(seq: number, other: number, start: number): Result {
    const manager = this.manager;
    const seqChars = manager.getString(seq);
    const otherChars = manager.getString(other);
    const sort = manager.sorts[seq];
    const startValue = this.getInt(start);
    if (
      seqChars !== undefined &&
      otherChars !== undefined &&
      startValue !== undefined &&
      isUnsigned(startValue)
    )
      return this.mkInt(getIndexOf(seqChars, otherChars, Number(startValue)));
    if (startValue !== undefined && startValue < 0n) return this.minusOne();
    if (this.isEmpty(other) && startValue === 0n) return start;
    if (this.isEmpty(other)) {
      const isNonNegative = this.mkLe(this.zero(), start);
      const isInRange = this.mkLe(start, this.mkLength(seq));
      const condition = manager.mkApp(OP_AND, [isNonNegative, isInRange], SORT_BOOL);
      return rewrite(this.mkIte(condition, start, this.minusOne()), BR_REWRITE2);
    }
    if (this.isEmpty(seq)) {
      const isEmpty = this.mkIsEmpty(other);
      const isStart = this.mkEq(start, this.zero());
      const condition = manager.mkApp(OP_AND, [isStart, isEmpty], SORT_BOOL);
      const found = this.zero();
      return rewrite(this.mkIte(condition, found, this.minusOne()), BR_REWRITE2);
    }
    if (seq === other) {
      if (startValue !== undefined) return startValue === 0n ? this.zero() : this.minusOne();
      const found = this.zero();
      const isAtZero = this.mkEq(found, start);
      return rewrite(this.mkIte(isAtZero, found, this.minusOne()), BR_REWRITE2);
    }
    if (this.isApp(seq, OP_SEQ_EXTRACT, 3)) {
      const length = this.getInt(this.getArg(seq, 2));
      if (length !== undefined && startValue !== undefined && startValue > length)
        return this.minusOne();
    }
    const seqUnits = getConcatUnits(manager, seq, []);
    if (startValue !== undefined) {
      let remaining = startValue;
      let count = 0;
      while (remaining > 0n && count < seqUnits.length && this.isUnit(seqUnits[count])) {
        remaining -= 1n;
        count++;
      }
      if (count > 0) {
        const rest = this.mkConcatOf(seqUnits.slice(count), sort);
        const index = this.mkSeq(OP_SEQ_INDEX, [rest, other, this.mkInt(remaining)]);
        const isFound = this.mkGe(index, this.zero());
        const shifted = this.mkAdd(this.mkInt(count), index);
        return rewrite(this.mkIte(isFound, shifted, this.minusOne()), BR_REWRITE_FULL);
      }
    }
    const isZero = startValue === 0n;
    const otherUnits = getConcatUnits(manager, other, []);
    let count = 0;
    while (
      isZero &&
      count < seqUnits.length &&
      otherUnits.length > 0 &&
      this.isUnit(seqUnits[count]) &&
      this.isUnit(otherUnits[0]) &&
      this.areDistinct(seqUnits[count], otherUnits[0])
    )
      count++;
    if (count > 0) {
      const index = this.mkSeq(OP_SEQ_INDEX, [
        this.mkConcatOf(seqUnits.slice(count), sort),
        other,
        start,
      ]);
      const isFound = this.mkGe(index, this.zero());
      const shifted = this.mkAdd(this.mkInt(count), index);
      return rewrite(this.mkIte(isFound, shifted, this.minusOne()), BR_REWRITE_FULL);
    }
    switch (this.compareLengths(seqUnits, otherUnits)) {
      case SHORTER:
        if (isZero) return this.minusOne();
        break;
      case SAME_LENGTH: {
        const isNegative = this.mkLe(start, this.minusOne());
        const isStart = this.mkEq(start, this.zero());
        const isEqual = this.mkEq(seq, other);
        const found = this.zero();
        const atStart = this.mkIte(isEqual, found, this.minusOne());
        const notNegative = this.mkIte(isStart, atStart, this.minusOne());
        return rewrite(this.mkIte(isNegative, this.minusOne(), notNegative), BR_REWRITE_FULL);
      }
    }
    if (isZero && seqUnits.length > 0 && this.isUnit(seqUnits[0])) {
      const rest = this.mkConcatOf(seqUnits.slice(1), manager.sorts[seqUnits[0]]);
      const index = this.mkSeq(OP_SEQ_INDEX, [rest, other, start]);
      const isPrefix = this.mkSeq(OP_SEQ_PREFIX, [other, seq]);
      const isFound = this.mkGe(index, this.zero());
      const shifted = this.mkAdd(this.mkInt(1), index);
      const notPrefix = this.mkIte(isFound, shifted, this.minusOne());
      return rewrite(this.mkIte(isPrefix, this.zero(), notPrefix), BR_REWRITE3);
    }
    if (this.isUnit(other) && this.isValue(other)) {
      const reduced = this.reduceByChar(seq, other, 4);
      if (reduced !== undefined)
        return rewrite(this.mkSeq(OP_SEQ_INDEX, [reduced, other, start]), BR_REWRITE1);
    }
    return undefined;
  }

  private mkSeqReplace(seq: number, from: number, to: number): Result {
    const manager = this.manager;
    const sort = manager.sorts[seq];
    const seqChars = manager.getString(seq);
    const fromChars = manager.getString(from);
    const toChars = manager.getString(to);
    if (seqChars !== undefined && fromChars !== undefined && toChars !== undefined)
      return manager.mkString(getReplaced(seqChars, fromChars, toChars));
    if (from === to) return seq;
    if (seq === from) return to;
    if (this.isEmpty(from)) return rewrite(this.mkConcat(to, seq), BR_REWRITE1);
    if (this.isEmpty(seq) && this.isEmpty(to)) return seq;
    const elements = getConcat(manager, seq, []);
    if (elements.length === 0)
      return this.getMinLength(getConcat(manager, from, [])).length > 0 ? seq : undefined;
    if (elements[0] === from) {
      elements[0] = to;
      return rewrite(this.mkConcatOf(elements, sort), BR_REWRITE1);
    }
    const headChars = manager.getString(elements[0]);
    if (
      fromChars !== undefined &&
      toChars !== undefined &&
      headChars !== undefined &&
      isContaining(headChars, fromChars)
    ) {
      elements[0] = manager.mkString(getReplaced(headChars, fromChars, toChars));
      return rewrite(this.mkConcatOf(elements, sort), BR_REWRITE1);
    }
    const seqUnits = getConcatUnits(manager, seq, []);
    const fromUnits = getConcatUnits(manager, from, []);
    if (fromUnits.length === 0) return rewrite(this.mkConcat(to, seq), BR_REWRITE1);
    const compareAt = (index: number) => {
      for (let inner = 0; inner < fromUnits.length && index + inner < seqUnits.length; inner++) {
        const fromUnit = fromUnits[inner];
        const seqUnit = seqUnits[index + inner];
        if (seqUnit === fromUnit) continue;
        if (!this.isUnit(fromUnit) || !this.isUnit(seqUnit)) return L_UNDEF;
        return this.areDistinct(seqUnit, fromUnit) ? L_FALSE : L_UNDEF;
      }
      return L_TRUE;
    };
    let index = 0;
    for (; index < seqUnits.length; index++) {
      const comparison = compareAt(index);
      if (comparison === L_FALSE && this.isUnit(seqUnits[index])) continue;
      if (comparison === L_TRUE && seqUnits.length < index + fromUnits.length) {
        const head = this.mkConcatOf(seqUnits.slice(0, index), sort);
        const tail = this.mkConcatOf(seqUnits.slice(index), sort);
        const isMatch = this.mkEq(tail, from);
        return rewrite(this.mkIte(isMatch, this.mkConcat(head, to), seq), BR_REWRITE_FULL);
      }
      if (comparison === L_TRUE)
        return rewrite(
          this.mkConcatOf(
            [...seqUnits.slice(0, index), to, ...seqUnits.slice(index + fromUnits.length)],
            sort,
          ),
          BR_REWRITE_FULL,
        );
      break;
    }
    if (index === 0) return undefined;
    const head = this.mkConcatOf(seqUnits.slice(0, index), sort);
    const tail = this.mkConcatOf(seqUnits.slice(index), sort);
    return rewrite(
      this.mkConcat(head, this.mkSeq(OP_SEQ_REPLACE, [tail, from, to])),
      BR_REWRITE_FULL,
    );
  }

  private getUnitValues(seq: number) {
    const values: number[] = [];
    let current = seq;
    while (this.isConcat2(current)) {
      const head = this.getArg(current, 0);
      if (!this.isUnit(head) || !this.isValue(this.getArg(head, 0))) return undefined;
      values.push(head);
      current = this.getArg(current, 1);
    }
    if (!this.isUnit(current) || !this.isValue(this.getArg(current, 0))) return undefined;
    values.push(current);
    return values;
  }

  private mkSeqReplaceAll(seq: number, from: number, to: number): Result {
    const manager = this.manager;
    const sort = manager.sorts[seq];
    if (this.isEmpty(from) || from === to) return seq;
    if (seq === from) {
      const isEmpty = this.mkIsEmpty(from);
      return rewrite(this.mkIte(isEmpty, this.mkEmpty(sort), to), BR_REWRITE2);
    }
    if (this.isEmpty(seq) && this.isEmpty(to)) return seq;
    const seqChars = manager.getString(seq);
    const fromChars = manager.getString(from);
    if (seqChars !== undefined && fromChars !== undefined) {
      if (seqChars.length < fromChars.length) return seq;
      const parts: number[] = [];
      for (let index = 0; index < seqChars.length; index++) {
        if (seqChars.length >= fromChars.length + index && isMatchAt(seqChars, fromChars, index)) {
          parts.push(to);
          index += fromChars.length - 1;
        } else parts.push(this.mkUnit(seqChars[index]));
      }
      return rewrite(this.mkConcatOf(parts, sort), BR_REWRITE_FULL);
    }
    const seqValues = this.getUnitValues(seq);
    const fromValues = seqValues === undefined ? undefined : this.getUnitValues(from);
    if (seqValues === undefined || fromValues === undefined) return undefined;
    const parts: number[] = [];
    let index = 0;
    while (index + fromValues.length <= seqValues.length) {
      if (fromValues.every((value, inner) => value === seqValues[index + inner])) {
        parts.push(to);
        index += fromValues.length;
      } else parts.push(seqValues[index++]);
    }
    parts.push(...seqValues.slice(index));
    return rewrite(this.mkConcatOf(parts, sort), BR_REWRITE_FULL);
  }

  private getArrayRangeSeqSort(array: number) {
    return this.manager.mkSeqSort(this.manager.getArrayRange(this.manager.sorts[array]));
  }

  private mkSeqMap(map: number, seq: number): Result {
    if (this.isEmpty(seq)) return this.mkEmpty(this.getArrayRangeSeqSort(map));
    if (this.isUnit(seq))
      return rewrite(
        this.mkSeq(OP_SEQ_UNIT, [mkArrayApp(this.manager, OP_SELECT, [map, this.getArg(seq, 0)])]),
        BR_REWRITE2,
      );
    if (!this.isConcat2(seq)) return undefined;
    const first = this.mkSeq(OP_SEQ_MAP, [map, this.getArg(seq, 0)]);
    const second = this.mkSeq(OP_SEQ_MAP, [map, this.getArg(seq, 1)]);
    return rewrite(this.mkConcat(first, second), BR_REWRITE2);
  }

  private mkSeqMapi(map: number, index: number, seq: number): Result {
    if (this.isEmpty(seq)) return this.mkEmpty(this.getArrayRangeSeqSort(map));
    if (this.isUnit(seq))
      return rewrite(
        this.mkSeq(OP_SEQ_UNIT, [
          mkArrayApp(this.manager, OP_SELECT, [map, index, this.getArg(seq, 0)]),
        ]),
        BR_REWRITE2,
      );
    if (!this.isConcat2(seq)) return undefined;
    const head = this.getArg(seq, 0);
    const next = this.mkAdd(index, this.mkLength(head));
    const first = this.mkSeq(OP_SEQ_MAPI, [map, index, head]);
    const second = this.mkSeq(OP_SEQ_MAPI, [map, next, this.getArg(seq, 1)]);
    return rewrite(this.mkConcat(first, second), BR_REWRITE2);
  }

  private mkSeqFoldl(fold: number, initial: number, seq: number): Result {
    if (this.isEmpty(seq)) return initial;
    if (this.isUnit(seq))
      return rewrite(
        mkArrayApp(this.manager, OP_SELECT, [fold, initial, this.getArg(seq, 0)]),
        BR_REWRITE1,
      );
    if (!this.isConcat2(seq)) return undefined;
    const first = this.mkSeq(OP_SEQ_FOLDL, [fold, initial, this.getArg(seq, 0)]);
    return rewrite(this.mkSeq(OP_SEQ_FOLDL, [fold, first, this.getArg(seq, 1)]), BR_REWRITE3);
  }

  private mkSeqFoldli(fold: number, index: number, initial: number, seq: number): Result {
    if (this.isEmpty(seq)) return initial;
    if (this.isUnit(seq))
      return rewrite(
        mkArrayApp(this.manager, OP_SELECT, [fold, index, initial, this.getArg(seq, 0)]),
        BR_REWRITE1,
      );
    if (!this.isConcat2(seq)) return undefined;
    const head = this.getArg(seq, 0);
    const next = this.mkAdd(index, this.mkLength(head));
    const first = this.mkSeq(OP_SEQ_FOLDLI, [fold, index, initial, head]);
    return rewrite(
      this.mkSeq(OP_SEQ_FOLDLI, [fold, next, first, this.getArg(seq, 1)]),
      BR_REWRITE3,
    );
  }

  private mkSeqPrefix(first: number, second: number): Result {
    const manager = this.manager;
    const sort = manager.sorts[first];
    const firstChars = manager.getString(first);
    const secondChars = manager.getString(second);
    if (firstChars !== undefined && secondChars !== undefined)
      return this.mkBool(isPrefixOf(firstChars, secondChars));
    if (this.isEmpty(first)) return manager.trueExpr;
    const getLeftmost = (expr: number) => {
      let current = expr;
      while (this.isConcat2(current)) current = this.getArg(current, 0);
      return current;
    };
    const firstHead = getLeftmost(first);
    const secondHead = getLeftmost(second);
    const firstHeadChars = manager.getString(firstHead);
    const secondHeadChars = manager.getString(secondHead);
    if (firstHead !== secondHead && firstHeadChars !== undefined && secondHeadChars !== undefined) {
      if (firstHeadChars.length <= secondHeadChars.length) {
        if (!isPrefixOf(firstHeadChars, secondHeadChars)) return manager.falseExpr;
        if (first === firstHead) return manager.trueExpr;
        const firstElements = getConcat(manager, first, []);
        const secondElements = getConcat(manager, second, []);
        secondElements[0] = manager.mkString(secondHeadChars.slice(firstHeadChars.length));
        const firstRest = this.mkConcatOf(firstElements.slice(1), sort);
        const secondRest = this.mkConcatOf(secondElements, sort);
        return rewrite(this.mkSeq(OP_SEQ_PREFIX, [firstRest, secondRest]), BR_REWRITE_FULL);
      }
      if (!isPrefixOf(secondHeadChars, firstHeadChars)) return manager.falseExpr;
      if (second === secondHead) return manager.falseExpr;
      const firstElements = getConcat(manager, first, []);
      const secondElements = getConcat(manager, second, []);
      firstElements[0] = manager.mkString(firstHeadChars.slice(secondHeadChars.length));
      const firstRest = this.mkConcatOf(firstElements, sort);
      return rewrite(
        this.mkSeq(OP_SEQ_PREFIX, [firstRest, this.mkConcatOf(secondElements.slice(1), sort)]),
        BR_REWRITE_FULL,
      );
    }
    const firstUnits = getConcatUnits(manager, first, []);
    const secondUnits = getConcatUnits(manager, second, []);
    const eqs: number[] = [];
    let index = 0;
    for (; index < firstUnits.length && index < secondUnits.length; index++) {
      const firstUnit = firstUnits[index];
      const secondUnit = secondUnits[index];
      if (firstUnit === secondUnit) continue;
      if (this.areDistinct(firstUnit, secondUnit)) return manager.falseExpr;
      if (!this.isUnit(firstUnit) || !this.isUnit(secondUnit)) break;
      eqs.push(this.mkEq(firstUnit, secondUnit));
    }
    if (index === firstUnits.length) return rewrite(manager.mkAnd(eqs), BR_REWRITE3);
    if (index === secondUnits.length) {
      for (const unit of firstUnits.slice(index)) eqs.push(this.mkIsEmpty(unit));
      return rewrite(manager.mkAnd(eqs), BR_REWRITE3);
    }
    if (index > 0) {
      const firstRest = this.mkConcatOf(firstUnits.slice(index), sort);
      const secondRest = this.mkConcatOf(secondUnits.slice(index), sort);
      eqs.push(this.mkSeq(OP_SEQ_PREFIX, [firstRest, secondRest]));
      return rewrite(manager.mkAnd(eqs), BR_REWRITE3);
    }
    if (
      this.isApp(first, OP_SEQ_REPLACE, 3) &&
      this.getArg(first, 0) === this.getArg(first, 2) &&
      this.getArg(first, 1) === second
    )
      return this.mkSeq(OP_SEQ_PREFIX, [this.getArg(first, 0), second]);
    return this.mkEqByLength(first, second);
  }

  private mkEqByLength(first: number, second: number): Result {
    const maxLength = this.getMaxLength(second);
    if (!maxLength.isBounded || maxLength.length > BigInt(this.getMinLength([first]).length))
      return undefined;
    return rewrite(this.mkEq(first, second), BR_REWRITE1);
  }

  private mkSeqSuffix(first: number, second: number): Result {
    const manager = this.manager;
    if (first === second) return manager.trueExpr;
    const sort = manager.sorts[first];
    if (this.isEmpty(first)) return manager.trueExpr;
    if (this.isEmpty(second)) return rewrite(this.mkIsEmpty(first), BR_REWRITE3);
    const firstUnits = getConcatUnits(manager, first, []);
    const secondUnits = getConcatUnits(manager, second, []);
    const eqs: number[] = [];
    const firstSize = firstUnits.length;
    const secondSize = secondUnits.length;
    let index = 1;
    for (; index <= firstSize && index <= secondSize; index++) {
      const firstUnit = firstUnits[firstSize - index];
      const secondUnit = secondUnits[secondSize - index];
      if (firstUnit === secondUnit) continue;
      if (this.areDistinct(firstUnit, secondUnit)) return manager.falseExpr;
      if (!this.isUnit(firstUnit) || !this.isUnit(secondUnit)) break;
      eqs.push(this.mkEq(firstUnit, secondUnit));
    }
    if (index > firstSize) return rewrite(manager.mkAnd(eqs), BR_REWRITE3);
    if (index > secondSize) {
      for (let inner = index; inner <= firstSize; inner++)
        eqs.push(this.mkIsEmpty(firstUnits[firstSize - inner]));
      return rewrite(manager.mkAnd(eqs), BR_REWRITE3);
    }
    if (index > 1) {
      const firstRest = this.mkConcatOf(firstUnits.slice(0, firstSize - index + 1), sort);
      const secondRest = this.mkConcatOf(secondUnits.slice(0, secondSize - index + 1), sort);
      eqs.push(this.mkSeq(OP_SEQ_SUFFIX, [firstRest, secondRest]));
      return rewrite(manager.mkAnd(eqs), BR_REWRITE3);
    }
    if (
      this.isApp(first, OP_SEQ_REPLACE, 3) &&
      this.getArg(first, 0) === this.getArg(first, 2) &&
      this.getArg(first, 1) === second
    )
      return this.mkSeq(OP_SEQ_SUFFIX, [this.getArg(first, 0), second]);
    return this.mkEqByLength(first, second);
  }

  private mkStrLt(first: number, second: number): Result {
    const manager = this.manager;
    if (this.isEmpty(second)) return manager.falseExpr;
    if (this.isEmpty(first)) return rewrite(this.mkNot(this.mkEq(first, second)), BR_REWRITE1);
    const firstChars = manager.getString(first);
    const secondChars = manager.getString(second);
    if (firstChars === undefined || secondChars === undefined) return undefined;
    const size = Math.min(firstChars.length, secondChars.length);
    for (let index = 0; index < size; index++) {
      if (firstChars[index] < secondChars[index]) return manager.trueExpr;
      if (firstChars[index] > secondChars[index]) return manager.falseExpr;
    }
    return this.mkBool(firstChars.length < secondChars.length);
  }

  private mkStrFromCode(code: number): Result {
    const value = this.getInt(code);
    if (value === undefined) return undefined;
    return this.manager.mkString(value < 0n || value > BigInt(MAX_CHAR) ? [] : [Number(value)]);
  }

  private mkStrToCode(seq: number): Result {
    const chars = this.manager.getString(seq);
    if (chars === undefined) return undefined;
    return chars.length === 1 ? this.mkInt(chars[0]) : this.minusOne();
  }

  private mkStrIsDigit(seq: number): Result {
    const chars = this.manager.getString(seq);
    if (chars !== undefined) return this.mkBool(chars.length === 1 && isDigit(chars[0]));
    return this.isEmpty(seq) ? this.manager.falseExpr : undefined;
  }

  private mkStrUbv2s(bv: number): Result {
    const manager = this.manager;
    if (!manager.isBvNumeral(bv)) return undefined;
    return manager.mkString(getCodes(manager.getBvNumeralValue(bv).toString()));
  }

  private mkStrSbv2s(bv: number): Result {
    const manager = this.manager;
    const size = manager.getBvSize(manager.sorts[bv]);
    if (manager.isBvNumeral(bv)) {
      const modulus = 1n << BigInt(size);
      const value = ((manager.getBvNumeralValue(bv) % modulus) + modulus) % modulus;
      const signed = value >= modulus >> 1n ? value - modulus : value;
      return manager.mkString(getCodes(signed.toString()));
    }
    const isNegative = mkBvApp(manager, OP_SLT, [bv, manager.mkBvNumeral(0n, size)]);
    const minus = manager.mkString(getCodes("-"));
    const negated = this.mkSeq(OP_STRING_UBVTOS, [mkBvApp(manager, OP_BNEG, [bv])]);
    const negative = this.mkConcat(minus, negated);
    return rewrite(
      this.mkIte(isNegative, negative, this.mkSeq(OP_STRING_UBVTOS, [bv])),
      BR_REWRITE_FULL,
    );
  }

  private mkStrItos(value: number): Result {
    const manager = this.manager;
    if (manager.isNumeral(value)) {
      const rational = manager.getRationalValue(value);
      return manager.mkString(
        rational.isInt() && !rational.isNegative() ? getCodes(rational.num.toString()) : [],
      );
    }
    if (!this.isOp(value, OP_STRING_STOI)) return undefined;
    const seq = this.getArg(value, 0);
    const maxLength = this.getMaxLength(seq);
    if (!maxLength.isBounded || maxLength.length > 1n) return undefined;
    const eqs = Array.from({ length: 10 }, (_, digit) =>
      this.mkEq(seq, manager.mkString([48 + digit])),
    );
    const isDigitString = manager.mkApp(OP_OR, eqs, SORT_BOOL);
    return rewrite(this.mkIte(isDigitString, seq, manager.mkString([])), BR_REWRITE2);
  }

  private mkStrStoi(seq: number): Result {
    const manager = this.manager;
    const chars = manager.getString(seq);
    if (chars !== undefined) {
      if (chars.length === 0 || !chars.every(isDigit)) return this.minusOne();
      return this.mkInt(BigInt(String.fromCodePoint(...chars)));
    }
    if (this.isOp(seq, OP_STRING_ITOS)) {
      const value = this.getArg(seq, 0);
      return this.mkIte(this.mkGe(value, this.zero()), value, this.minusOne());
    }
    if (this.isOp(seq, OP_STRING_UBVTOS))
      return mkBvApp(manager, OP_UBV2INT, [this.getArg(seq, 0)]);
    if (this.isOp(seq, OP_ITE)) {
      const thenExpr = this.mkSeq(OP_STRING_STOI, [this.getArg(seq, 1)]);
      return rewrite(
        this.mkIte(
          this.getArg(seq, 0),
          thenExpr,
          this.mkSeq(OP_STRING_STOI, [this.getArg(seq, 2)]),
        ),
        BR_REWRITE_FULL,
      );
    }
    if (this.isUnit(seq)) {
      const code = manager.getChar(this.getArg(seq, 0));
      if (code !== -1) return isDigit(code) ? this.mkInt(code - 48) : this.minusOne();
    }
    const units = getConcatUnits(manager, seq, []);
    if (units.length === 0) return this.minusOne();
    if (this.isUnit(units.at(-1)!)) {
      const tail = this.mkSeq(OP_STRING_STOI, [units.at(-1)!]);
      const head = this.mkConcatOf(units.slice(0, -1), manager.sorts[seq]);
      const headValue = this.mkSeq(OP_STRING_STOI, [head]);
      const isHeadValid = this.mkGe(headValue, this.zero());
      const combined = this.mkAdd(this.mkMul(this.mkInt(10), headValue), tail);
      let result = this.mkIte(isHeadValid, combined, this.minusOne());
      result = this.mkIte(this.mkGe(tail, this.zero()), result, tail);
      result = this.mkIte(this.mkIsEmpty(head), tail, result);
      return rewrite(result, BR_REWRITE_FULL);
    }
    if (this.isUnit(units[0]) && manager.getChar(this.getArg(units[0], 0)) === 48) {
      const rest = this.mkConcatOf(units.slice(1), manager.sorts[units[0]]);
      const isEmpty = this.mkIsEmpty(rest);
      const value = this.mkSeq(OP_STRING_STOI, [rest]);
      return rewrite(this.mkIte(isEmpty, this.zero(), value), BR_REWRITE_FULL);
    }
    return undefined;
  }

  getMinLength(seqs: readonly number[]): MinLength {
    const manager = this.manager;
    const todo = [...seqs];
    const pending: number[] = [];
    const cache = new Map<number, MinLength>();
    let length = 0;
    let isBounded = true;
    if (seqs.length === 0) return { isBounded, length };
    const visit = (expr: number) => {
      if (cache.has(expr)) return true;
      if (this.isUnit(expr)) cache.set(expr, { isBounded: true, length: 1 });
      else if (this.isEmpty(expr)) cache.set(expr, { isBounded: true, length: 0 });
      else if (manager.getString(expr) !== undefined)
        cache.set(expr, { isBounded: true, length: manager.getString(expr)!.length });
      else if (this.isOp(expr, OP_SEQ_CONCAT)) {
        let isVisited = true;
        let isValid = true;
        let count = 0;
        for (const arg of manager.getArgs(expr)) {
          const cached = cache.get(arg);
          if (cached === undefined) {
            pending.push(arg);
            isVisited = false;
            continue;
          }
          isValid &&= cached.isBounded;
          count += cached.length;
        }
        if (isVisited) cache.set(expr, { isBounded: isValid, length: count });
        return isVisited;
      } else if (this.isOp(expr, OP_ITE)) {
        const size = pending.length;
        const thenLength = cache.get(this.getArg(expr, 1));
        const elseLength = cache.get(this.getArg(expr, 2));
        if (thenLength === undefined) pending.push(this.getArg(expr, 1));
        if (elseLength === undefined) pending.push(this.getArg(expr, 2));
        if (size !== pending.length) return false;
        cache.set(expr, {
          isBounded:
            thenLength!.isBounded &&
            elseLength!.isBounded &&
            thenLength!.length === elseLength!.length,
          length: Math.min(thenLength!.length, elseLength!.length),
        });
      } else cache.set(expr, { isBounded: false, length: 0 });
      return true;
    };
    while (todo.length > 0) {
      const expr = todo.pop()!;
      const chars = manager.getString(expr);
      if (this.isUnit(expr)) length++;
      else if (this.isEmpty(expr)) continue;
      else if (chars !== undefined) length += chars.length;
      else if (this.isOp(expr, OP_SEQ_CONCAT)) todo.push(...manager.getArgs(expr));
      else if (this.isOp(expr, OP_ITE)) {
        const thenExpr = this.getArg(expr, 1);
        const elseExpr = this.getArg(expr, 2);
        pending.push(thenExpr, elseExpr);
        while (pending.length > 0) if (visit(pending.at(-1)!)) pending.pop();
        const thenLength = cache.get(thenExpr) ?? { isBounded: false, length: 0 };
        const elseLength = cache.get(elseExpr) ?? { isBounded: false, length: 0 };
        if (
          !thenLength.isBounded ||
          !elseLength.isBounded ||
          thenLength.length !== elseLength.length
        )
          isBounded = false;
        length += Math.min(thenLength.length, elseLength.length);
      } else isBounded = false;
    }
    return { isBounded, length };
  }

  private getMaxLength(seq: number) {
    const manager = this.manager;
    const todo = [seq];
    let length = 0n;
    while (todo.length > 0) {
      const expr = todo.pop()!;
      const chars = manager.getString(expr);
      if (this.isUnit(expr) || this.isApp(expr, OP_SEQ_AT, 2)) length += 1n;
      else if (chars !== undefined) length += BigInt(chars.length);
      else if (
        this.isApp(expr, OP_SEQ_EXTRACT, 3) &&
        (this.getInt(this.getArg(expr, 2)) ?? -1n) >= 0n
      )
        length += this.getInt(this.getArg(expr, 2))!;
      else if (this.isEmpty(expr)) continue;
      else if (this.isOp(expr, OP_SEQ_CONCAT)) todo.push(...manager.getArgs(expr));
      else return { isBounded: false, length };
    }
    return { isBounded: true, length };
  }

  private getEqLength(first: number, second: number) {
    const firstLength = this.getMinLength([first]);
    if (!firstLength.isBounded) return L_UNDEF;
    const secondLength = this.getMinLength([second]);
    if (!secondLength.isBounded) return L_UNDEF;
    return firstLength.length === secondLength.length ? L_TRUE : L_FALSE;
  }

  mkBoolApp(isAnd: boolean, args: number[]): Result {
    const manager = this.manager;
    const getMembership = (expr: number) => (this.isApp(expr, OP_SEQ_IN_RE, 2) ? expr : undefined);
    const isMembership = (expr: number) =>
      getMembership(expr) !== undefined ||
      (this.isOp(expr, OP_NOT) && getMembership(this.getArg(expr, 0)) !== undefined);
    if (!args.some(isMembership)) return undefined;
    const getHash = (expr: number) => manager.hashes[expr];
    const memberships = new ObjMap<number>(getHash);
    const exclusions = new ObjMap<number>(getHash);
    const mkRe = (op: number, first: number, second: number) => this.mkSeq(op, [first, second]);
    let isPaired = false;
    const newArgs: number[] = [];
    for (const arg of args) {
      const isNegated = this.isOp(arg, OP_NOT) && this.isApp(this.getArg(arg, 0), OP_SEQ_IN_RE, 2);
      const membership = isNegated ? this.getArg(arg, 0) : arg;
      if (!this.isApp(membership, OP_SEQ_IN_RE, 2) || this.isEmpty(this.getArg(membership, 0))) {
        newArgs.push(arg);
        continue;
      }
      const seq = this.getArg(membership, 0);
      const regex = this.getArg(membership, 1);
      const same = isNegated ? exclusions : memberships;
      const other = isNegated ? memberships : exclusions;
      const existing = same.get(seq);
      if (existing === undefined) {
        same.set(seq, regex);
        isPaired ||= other.has(seq);
        continue;
      }
      same.set(seq, mkRe(isAnd !== isNegated ? OP_RE_INTERSECT : OP_RE_UNION, existing, regex));
      isPaired = true;
    }
    if (!isPaired) return undefined;
    for (const [seq, regex] of memberships) {
      const excluded = exclusions.get(seq);
      if (excluded === undefined) {
        newArgs.push(mkRe(OP_SEQ_IN_RE, seq, regex));
        continue;
      }
      const complement = this.mkSeq(OP_RE_COMPLEMENT, [excluded]);
      const combined = mkRe(isAnd ? OP_RE_INTERSECT : OP_RE_UNION, regex, complement);
      newArgs.push(mkRe(OP_SEQ_IN_RE, seq, combined));
    }
    for (const [seq, regex] of exclusions)
      if (!memberships.has(seq))
        newArgs.push(mkRe(OP_SEQ_IN_RE, seq, this.mkSeq(OP_RE_COMPLEMENT, [regex])));
    return rewrite(manager.mkApp(isAnd ? OP_AND : OP_OR, newArgs, SORT_BOOL), BR_REWRITE_FULL);
  }

  mkEqCore(left: number, right: number): Result {
    const manager = this.manager;
    if (manager.isReSort(manager.sorts[left])) return left === right ? manager.trueExpr : undefined;
    const empty = this.reduceEqEmpty(left, right);
    if (empty !== undefined) return rewrite(empty, BR_REWRITE_FULL);
    if (
      this.isApp(left, OP_SEQ_POWER, 2) &&
      this.isApp(right, OP_SEQ_POWER, 2) &&
      this.getArg(left, 0) === this.getArg(right, 0)
    ) {
      const base = this.getArg(left, 0);
      const firstExponent = this.getArg(left, 1);
      const secondExponent = this.getArg(right, 1);
      const isEmpty = this.mkEq(base, this.mkEmpty(manager.sorts[base]));
      const isFirstNonPositive = this.mkLe(firstExponent, this.zero());
      const isSecondNonPositive = this.mkLe(secondExponent, this.zero());
      const areNonPositive = manager.mkApp(
        OP_AND,
        [isFirstNonPositive, isSecondNonPositive],
        SORT_BOOL,
      );
      const isFirstPositive = this.mkLt(this.zero(), firstExponent);
      const isSecondPositive = this.mkLt(this.zero(), secondExponent);
      const isEqual = this.mkEq(firstExponent, secondExponent);
      const arePositive = manager.mkApp(
        OP_AND,
        [isFirstPositive, isSecondPositive, isEqual],
        SORT_BOOL,
      );
      return rewrite(
        manager.mkApp(OP_OR, [isEmpty, areNonPositive, arePositive], SORT_BOOL),
        BR_REWRITE_FULL,
      );
    }
    const replaceSide = this.isOp(left, OP_SEQ_REPLACE_ALL)
      ? left
      : this.isOp(right, OP_SEQ_REPLACE_ALL)
        ? right
        : -1;
    if (replaceSide !== -1 && this.isApp(replaceSide, OP_SEQ_REPLACE_ALL, 3)) {
      const stringSide = replaceSide === left ? right : left;
      const from = manager.getString(this.getArg(replaceSide, 1));
      const to = manager.getString(this.getArg(replaceSide, 2));
      if (from?.length === 1 && to?.length === 1 && manager.getString(stringSide) !== undefined)
        return rewrite(
          this.mkSeq(OP_SEQ_IN_RE, [replaceSide, this.mkSeq(OP_SEQ_TO_RE, [stringSide])]),
          BR_REWRITE_FULL,
        );
    }
    const eqs: EqPair[] = [];
    const reduced = this.reduceEq(left, right, eqs);
    if (reduced === undefined) return manager.falseExpr;
    if (!reduced) return undefined;
    return rewrite(manager.mkAnd(eqs.map((eq) => this.mkEq(eq.left, eq.right))), BR_REWRITE3);
  }

  private reduceEqEmpty(inputLeft: number, inputRight: number) {
    const manager = this.manager;
    const [swappedLeft, swappedRight] = this.isEmpty(inputRight)
      ? [inputRight, inputLeft]
      : [inputLeft, inputRight];
    const [left, right] = this.isOp(swappedRight, OP_SEQ_LENGTH)
      ? [swappedRight, swappedLeft]
      : [swappedLeft, swappedRight];
    if (!this.isEmpty(left)) return undefined;
    if (this.isApp(right, OP_SEQ_EXTRACT, 3)) {
      const [seq, offset, length] = manager.getArgs(right);
      const seqLength = this.mkLength(seq);
      return this.mkOrOf([
        () => this.mkLt(offset, this.zero()),
        () => this.mkEq(seq, left),
        () => this.mkLe(length, this.zero()),
        () => this.mkLe(seqLength, offset),
      ]);
    }
    if (this.isOp(right, OP_STRING_ITOS)) return this.mkLt(this.getArg(right, 0), this.zero());
    if (this.isApp(right, OP_SEQ_POWER, 2))
      return this.mkOrOf([
        () => this.mkLe(this.getArg(right, 1), this.zero()),
        () => this.mkEq(this.getArg(right, 0), left),
      ]);
    if (this.isApp(right, OP_SEQ_AT, 2)) {
      const offset = this.getArg(right, 1);
      const seqLength = this.mkLength(this.getArg(right, 0));
      return this.mkOrOf([
        () => this.mkLe(seqLength, offset),
        () => this.mkLt(offset, this.zero()),
      ]);
    }
    return undefined;
  }

  private mkOrOf(builders: (() => number)[]) {
    return this.manager.mkApp(
      OP_OR,
      builders.map((build) => build()),
      SORT_BOOL,
    );
  }

  private getVectorHash(values: number[]) {
    const hashes = this.manager.hashes;
    return values.length === 0 ? 0 : getCompositeHash(values.map((value) => hashes[value]));
  }

  reduceEq(left: number, right: number, eqs: EqPair[]): boolean | undefined {
    const manager = this.manager;
    const pair = { left: getConcat(manager, left, []), right: getConcat(manager, right, []) };
    const isChanged = this.reduceEqOf(pair, eqs);
    if (isChanged === undefined) return undefined;
    if (!isChanged) {
      eqs.push({ left, right });
      return false;
    }
    if (pair.left.length > 0 || pair.right.length > 0) {
      const sort = manager.sorts[pair.left.length === 0 ? pair.right[0] : pair.left[0]];
      const leftSeq = this.mkConcatOf(pair.left, sort);
      eqs.push({ left: leftSeq, right: this.mkConcatOf(pair.right, sort) });
    }
    return true;
  }

  mkLengthOf(seq: number) {
    const result = this.mkSeqLength(seq);
    return result === undefined
      ? this.mkLength(seq)
      : typeof result === "number"
        ? result
        : result.expr;
  }

  addSeqs(left: readonly number[], right: readonly number[], eqs: EqPair[]) {
    if (left.length === 0 && right.length === 0) return;
    const sort = this.manager.sorts[left.length === 0 ? right[0] : left[0]];
    eqs.push({ left: this.mkConcatOf(left, sort), right: this.mkConcatOf(right, sort) });
  }

  reduceEqOf(pair: SeqPair, eqs: EqPair[]): boolean | undefined {
    const leftHash = this.getVectorHash(pair.left);
    const rightHash = this.getVectorHash(pair.right);
    const size = eqs.length;
    pair.left = this.removeEmptyAndConcats(pair.left);
    pair.right = this.removeEmptyAndConcats(pair.right);
    const isSatisfiable =
      this.reduceBack(pair, eqs) &&
      this.reduceFront(pair, eqs) &&
      this.reduceItos(pair.left, pair.right, eqs, pair) &&
      this.reduceItos(pair.right, pair.left, eqs, pair) &&
      this.reduceValueClash(pair.left, pair.right) &&
      this.reduceByLength(pair, eqs) &&
      this.reduceSubsequence(pair, eqs) &&
      this.reduceNonOverlap(pair.left, pair.right) &&
      this.reduceNonOverlap(pair.right, pair.left) &&
      this.splitBag(pair, eqs);
    if (!isSatisfiable) return undefined;
    return (
      leftHash !== this.getVectorHash(pair.left) ||
      rightHash !== this.getVectorHash(pair.right) ||
      eqs.length !== size
    );
  }

  private removeEmptyAndConcats(values: number[]) {
    const hasConcat = values.some((value) => this.isOp(value, OP_SEQ_CONCAT));
    const nonEmpty = values.filter((value) => !this.isEmpty(value));
    if (!hasConcat) return nonEmpty;
    const result: number[] = [];
    for (const value of nonEmpty) getConcat(this.manager, value, result);
    return result;
  }

  private swap(pair: SeqPair) {
    const left = pair.left;
    pair.left = pair.right;
    pair.right = left;
  }

  private reduceBack(pair: SeqPair, eqs: EqPair[]) {
    const manager = this.manager;
    while (pair.left.length > 0 && pair.right.length > 0) {
      if (this.isUnit(pair.right.at(-1)!) && manager.getString(pair.left.at(-1)!) !== undefined)
        this.swap(pair);
      const left = pair.left.at(-1)!;
      const right = pair.right.at(-1)!;
      const rightChars = manager.getString(right);
      const leftChars = manager.getString(left);
      if (left === right) {
        pair.left.pop();
        pair.right.pop();
      } else if (this.isUnit(left) && this.isUnit(right)) {
        if (this.areDistinct(this.getArg(left, 0), this.getArg(right, 0))) return false;
        eqs.push({ left: this.getArg(left, 0), right: this.getArg(right, 0) });
        pair.left.pop();
        pair.right.pop();
      } else if (this.isUnit(left) && rightChars !== undefined) {
        eqs.push({ left: manager.mkChar(rightChars.at(-1)!), right: this.getArg(left, 0) });
        pair.left.pop();
        if (rightChars.length === 1) pair.right.pop();
        else pair.right[pair.right.length - 1] = manager.mkString(rightChars.slice(0, -1));
      } else if (leftChars !== undefined && rightChars !== undefined) {
        const minLength = Math.min(leftChars.length, rightChars.length);
        for (let index = 0; index < minLength; index++)
          if (leftChars[leftChars.length - index - 1] !== rightChars[rightChars.length - index - 1])
            return false;
        pair.left.pop();
        pair.right.pop();
        if (minLength < leftChars.length)
          pair.left.push(manager.mkString(leftChars.slice(0, leftChars.length - minLength)));
        if (minLength < rightChars.length)
          pair.right.push(manager.mkString(rightChars.slice(0, rightChars.length - minLength)));
      } else break;
    }
    return true;
  }

  private reduceFront(pair: SeqPair, eqs: EqPair[]) {
    const manager = this.manager;
    const heads = { left: 0, right: 0 };
    while (heads.left < pair.left.length && heads.right < pair.right.length) {
      if (
        this.isUnit(pair.right[heads.right]) &&
        manager.getString(pair.left[heads.left]) !== undefined
      ) {
        this.swap(pair);
        const head = heads.left;
        heads.left = heads.right;
        heads.right = head;
      }
      const left = pair.left[heads.left];
      const right = pair.right[heads.right];
      const leftChars = manager.getString(left);
      const rightChars = manager.getString(right);
      if (left === right) {
        heads.left++;
        heads.right++;
      } else if (this.isUnit(left) && this.isUnit(right)) {
        if (this.areDistinct(this.getArg(left, 0), this.getArg(right, 0))) return false;
        eqs.push({ left: this.getArg(left, 0), right: this.getArg(right, 0) });
        heads.left++;
        heads.right++;
      } else if (this.isUnit(left) && rightChars !== undefined) {
        eqs.push({ left: manager.mkChar(rightChars[0]), right: this.getArg(left, 0) });
        heads.left++;
        if (rightChars.length === 1) heads.right++;
        else pair.right[heads.right] = manager.mkString(rightChars.slice(1));
      } else if (leftChars !== undefined && rightChars !== undefined) {
        const minLength = Math.min(leftChars.length, rightChars.length);
        for (let index = 0; index < minLength; index++)
          if (leftChars[index] !== rightChars[index]) return false;
        if (minLength === leftChars.length) heads.left++;
        else pair.left[heads.left] = manager.mkString(leftChars.slice(minLength));
        if (minLength === rightChars.length) heads.right++;
        else pair.right[heads.right] = manager.mkString(rightChars.slice(minLength));
      } else break;
    }
    pair.left.splice(0, heads.left);
    pair.right.splice(0, heads.right);
    return true;
  }

  private getConstantString(values: number[]) {
    const manager = this.manager;
    const chars: number[] = [];
    for (const value of values) {
      const valueChars = manager.getString(value);
      const code = this.isUnit(value) ? manager.getChar(this.getArg(value, 0)) : -1;
      if (valueChars !== undefined) chars.push(...valueChars);
      else if (code !== -1) chars.push(code);
      else return undefined;
    }
    return chars;
  }

  private reduceItos(first: number[], second: number[], eqs: EqPair[], pair: SeqPair) {
    if (first.length !== 1 || !this.isOp(first[0], OP_STRING_ITOS)) return true;
    const chars = this.getConstantString(second);
    if (chars === undefined) return true;
    if (!chars.every(isDigit)) return false;
    if (chars.length > 1 && chars[0] === 48) return false;
    if (chars.length === 0) return true;
    eqs.push({
      left: this.getArg(first[0], 0),
      right: this.mkInt(BigInt(String.fromCodePoint(...chars))),
    });
    pair.left = [];
    pair.right = [];
    return true;
  }

  private reduceValueClash(left: number[], right: number[]) {
    if (left.length === 0 || right.length === 0) return true;
    const remaining = [...left];
    const isUnitValue = (expr: number) => this.isValue(expr) && this.isUnit(expr);
    for (const expr of right) {
      const index = remaining.indexOf(expr);
      if (index !== -1) {
        remaining[index] = remaining.at(-1)!;
        remaining.pop();
        continue;
      }
      if (!isUnitValue(expr)) return true;
    }
    return remaining.length === 0 || !remaining.every(isUnitValue);
  }

  private hasVar(values: number[]) {
    return values.some((value) => this.getMinLength([value]).length === 0);
  }

  private setEmpty(values: number[], isAll: boolean, eqs: EqPair[]) {
    let empty = -1;
    for (const value of values) {
      const minLength = this.getMinLength([value]);
      if (minLength.length > 0) {
        if (isAll) return false;
        continue;
      }
      if (minLength.isBounded) continue;
      if (empty === -1) empty = this.mkEmpty(this.manager.sorts[value]);
      eqs.push({ left: empty, right: value });
    }
    return true;
  }

  private concatNonEmpty(values: number[]) {
    const sort = this.manager.sorts[values[0]];
    return this.mkConcatOf(
      values.filter(
        (value) =>
          this.isUnit(value) ||
          this.manager.getString(value) !== undefined ||
          this.isOp(value, OP_ITE),
      ),
      sort,
    );
  }

  private reduceByLength(pair: SeqPair, eqs: EqPair[]) {
    if (pair.left.length === 0 && pair.right.length === 0) return true;
    const leftLength = this.getMinLength(pair.left);
    const rightLength = this.getMinLength(pair.right);
    if (leftLength.isBounded && leftLength.length < rightLength.length) return false;
    if (rightLength.isBounded && rightLength.length < leftLength.length) return false;
    const isSameLength = leftLength.length === rightLength.length && leftLength.length > 0;
    const isLeftFixed = leftLength.isBounded && isSameLength && this.hasVar(pair.right);
    if (!isLeftFixed && !(rightLength.isBounded && isSameLength && this.hasVar(pair.left)))
      return true;
    if (!this.setEmpty(isLeftFixed ? pair.right : pair.left, false, eqs)) return false;
    const left = this.concatNonEmpty(pair.left);
    eqs.push({ left, right: this.concatNonEmpty(pair.right) });
    pair.left = [];
    pair.right = [];
    return true;
  }

  private isNonOverlapping(first: number[], second: number[]): boolean {
    if (first.length > second.length) return this.isNonOverlapping(second, first);
    if (first.length === 0 || second.length === 0) return false;
    if (!first.every((expr) => this.isUnit(expr)) || !second.every((expr) => this.isUnit(expr)))
      return false;
    const canOverlap = (start: number, end: number, offset: number) => {
      for (let index = start; index < end; index++) {
        if (this.areDistinct(first[index], second[offset + index])) return false;
        if (first[index] !== second[offset + index]) return true;
      }
      return true;
    };
    for (let index = 1; index < first.length; index++)
      if (canOverlap(index, first.length, 0)) return false;
    for (let offset = 0; offset + first.length < second.length; offset++)
      if (canOverlap(0, first.length, offset)) return false;
    for (let offset = second.length - first.length; offset < second.length; offset++)
      if (canOverlap(0, second.length - offset, offset)) return false;
    return true;
  }

  private reduceNonOverlap(left: number[], right: number[]) {
    if (!right.every((expr) => this.isUnit(expr))) return true;
    let pattern: number[] = [];
    for (const expr of left) {
      if (this.isUnit(expr)) pattern.push(expr);
      else if (pattern.length > 0) {
        if (this.isNonOverlapping(pattern, right)) return false;
        pattern = [];
      }
    }
    return pattern.length === 0 || !this.isNonOverlapping(pattern, right);
  }

  private reduceSubsequence(pair: SeqPair, eqs: EqPair[]) {
    if (pair.left.length > pair.right.length) this.swap(pair);
    const left = pair.left;
    const right = pair.right;
    if (left.length === right.length) return true;
    if (left.length === 0 && right.length === 1) return true;
    const matched = new Set<number>();
    for (const expr of left) {
      const isUnit = this.isUnit(expr);
      const index = right.findIndex(
        (other, position) =>
          !matched.has(position) && (expr === other || (isUnit && this.isUnit(other))),
      );
      if (index === -1) return true;
      matched.add(index);
    }
    const kept: number[] = [];
    for (const [position, expr] of right.entries()) {
      if (matched.has(position)) kept.push(expr);
      else if (!this.setEmpty([expr], true, eqs)) return false;
    }
    if (kept.length === right.length) return true;
    pair.right = kept;
    if (left.length > 0) {
      const sort = this.manager.sorts[left[0]];
      const leftSeq = this.mkConcatOf(left, sort);
      eqs.push({ left: leftSeq, right: this.mkConcatOf(kept, sort) });
      pair.left = [];
      pair.right = [];
    }
    return true;
  }

  private splitBag(pair: SeqPair, eqs: EqPair[]) {
    const leftBag = new Map<number, number>();
    const rightBag = new Map<number, number>();
    for (let index = pair.left.length, other = pair.right.length; ;) {
      if (!(index-- > 0)) break;
      if (!(other-- > 0)) break;
      if (!(index > 0 || other > 0)) break;
      leftBag.set(pair.left[index], getCount(leftBag, pair.left[index]) + 1);
      rightBag.set(pair.right[other], getCount(rightBag, pair.right[other]) + 1);
      if (!isSameBag(leftBag, rightBag)) continue;
      const left = this.mkConcatOf(pair.left.slice(index), this.manager.sorts[pair.left[index]]);
      const right = this.mkConcatOf(pair.right.slice(other), this.manager.sorts[pair.right[other]]);
      eqs.push({ left, right });
      leftBag.clear();
      rightBag.clear();
      pair.left.length = index;
      pair.right.length = other;
    }
    leftBag.clear();
    rightBag.clear();
    let start = 0;
    for (let index = 0; index + 1 < pair.left.length && index + 1 < pair.right.length; index++) {
      leftBag.set(pair.left[index], getCount(leftBag, pair.left[index]) + 1);
      rightBag.set(pair.right[index], getCount(rightBag, pair.right[index]) + 1);
      if (!isSameBag(leftBag, rightBag)) continue;
      const left = this.mkConcatOf(
        pair.left.slice(start, index + 1),
        this.manager.sorts[pair.left[index]],
      );
      const right = this.mkConcatOf(
        pair.right.slice(start, index + 1),
        this.manager.sorts[pair.right[index]],
      );
      eqs.push({ left, right });
      leftBag.clear();
      rightBag.clear();
      start = index + 1;
    }
    if (start > 0) {
      pair.left.splice(0, start);
      pair.right.splice(0, start);
    }
    return true;
  }
}

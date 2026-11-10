// Ported from Z3 (src/ast/seq_decl_plugin.cpp, src/ast/char_decl_plugin.cpp,
// src/util/len_abs.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  OP_AND,
  OP_CHAR_LE,
  OP_EQ,
  OP_ITE,
  OP_NOT,
  OP_RE_COMPLEMENT,
  OP_RE_CONCAT,
  OP_RE_DIFF,
  OP_RE_EMPTY_SET,
  OP_RE_FULL_CHAR_SET,
  OP_RE_FULL_SEQ_SET,
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
  OP_SEQ_AT,
  OP_SEQ_CONCAT,
  OP_SEQ_EXTRACT,
  OP_SEQ_TO_RE,
  OP_SEQ_UNIT,
  FAMILY_SEQ,
} from "./ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { isBinaryApp, isEmptySeq, mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";

export const UINT_MAX = 0xffffffff;
const MAX_PERIOD = 64;

export const addTruncate = (first: number, second: number) =>
  first + second > UINT_MAX ? UINT_MAX : first + second;

export const mulTruncate = (first: number, second: number) =>
  first * second > UINT_MAX ? UINT_MAX : first * second;

const getGcd = (first: number, second: number): number => {
  let a = first;
  let b = second;
  while (b !== 0) [a, b] = [b, a % b];
  return a;
};

export interface LenAbs {
  lo: number;
  hi: number;
  period: number;
  residues: bigint;
}

export interface ReInfo extends LenAbs {
  isKnown: boolean;
  isInterpreted: boolean;
  nullable: number;
  isClassical: boolean;
}

const mkLenAbs = (lo: number, hi: number, period = 1, residues = 1n): LenAbs => ({
  lo,
  hi,
  period,
  residues,
});

const getBit = (index: number) => 1n << BigInt(index);

const getFullMask = (modulus: number) =>
  modulus >= MAX_PERIOD ? (1n << 64n) - 1n : getBit(modulus) - 1n;

const getBoundedLcm = (first: number, second: number) => {
  if (first === 0) return second;
  if (second === 0) return first;
  const lcm = (first / getGcd(first, second)) * second;
  return lcm > MAX_PERIOD ? 0 : lcm;
};

const getCommonPeriod = (first: number, second: number) => {
  const lcm = getBoundedLcm(first, second);
  const modulus = lcm === 0 ? getGcd(first, second) : lcm;
  return modulus === 0 ? 1 : modulus;
};

const getEffectivePeriod = (abs: LenAbs) => (abs.lo === abs.hi ? 0 : abs.period);

export const isLenAbsEmpty = (abs: LenAbs) => {
  if (abs.lo > abs.hi || abs.residues === 0n) return true;
  if (abs.period <= 1) return false;
  if (abs.hi === UINT_MAX || abs.hi - abs.lo >= abs.period - 1) return false;
  for (let length = abs.lo; length <= abs.hi; length++)
    if ((abs.residues & getBit(length % abs.period)) !== 0n) return false;
  return true;
};

const getResiduesMod = (abs: LenAbs, modulus: number) => {
  if (modulus === 0 || isLenAbsEmpty(abs)) return 0n;
  if (modulus >= MAX_PERIOD) return getFullMask(modulus);
  let result = 0n;
  if (abs.hi !== UINT_MAX && abs.hi - abs.lo < MAX_PERIOD) {
    for (let length = abs.lo; length <= abs.hi; length++)
      if ((abs.residues & getBit(length % abs.period)) !== 0n) result |= getBit(length % modulus);
    return result;
  }
  if (modulus <= abs.period && abs.period % modulus === 0) {
    for (let residue = 0; residue < abs.period; residue++)
      if ((abs.residues & getBit(residue)) !== 0n) result |= getBit(residue % modulus);
    return result;
  }
  if (modulus > abs.period && modulus % abs.period === 0) {
    for (let residue = 0; residue < abs.period; residue++)
      if ((abs.residues & getBit(residue)) !== 0n)
        for (let lifted = residue; lifted < modulus; lifted += abs.period) result |= getBit(lifted);
    return result;
  }
  return getFullMask(modulus);
};

const getLenAbsGcd = (abs: LenAbs) => {
  if (isLenAbsEmpty(abs)) return 0;
  let gcd = 0;
  const span = abs.period > (UINT_MAX - abs.lo) / 2 ? UINT_MAX : abs.lo + 2 * abs.period;
  const hi = Math.min(abs.hi, span);
  for (let length = abs.lo; length <= hi; length++) {
    if ((abs.residues & getBit(length % abs.period)) !== 0n) gcd = getGcd(gcd, length);
    if (gcd === 1) return 1;
  }
  return abs.hi === UINT_MAX ? getGcd(gcd, abs.period) : gcd;
};

const getSumset = (first: bigint, second: bigint, modulus: number) => {
  let result = 0n;
  for (let left = 0; left < modulus; left++) {
    if ((first & getBit(left)) === 0n) continue;
    for (let right = 0; right < modulus; right++)
      if ((second & getBit(right)) !== 0n) result |= getBit((left + right) % modulus);
  }
  return result;
};

const concatLenAbs = (abs: LenAbs, other: LenAbs) => {
  const result = mkLenAbs(addTruncate(abs.lo, other.lo), addTruncate(abs.hi, other.hi));
  const gcd = getGcd(getEffectivePeriod(abs), getEffectivePeriod(other));
  if (gcd > 1) {
    result.period = gcd;
    result.residues = getSumset(getResiduesMod(abs, gcd), getResiduesMod(other, gcd), gcd);
  }
  return result;
};

const uniteLenAbs = (abs: LenAbs, other: LenAbs) => {
  const result = mkLenAbs(Math.min(abs.lo, other.lo), Math.max(abs.hi, other.hi));
  const modulus = getCommonPeriod(getEffectivePeriod(abs), getEffectivePeriod(other));
  if (modulus > 1) {
    result.period = modulus;
    result.residues = getResiduesMod(abs, modulus) | getResiduesMod(other, modulus);
  }
  return result;
};

const meetLenAbs = (abs: LenAbs, other: LenAbs) => {
  const result = mkLenAbs(Math.max(abs.lo, other.lo), Math.min(abs.hi, other.hi));
  const modulus = getCommonPeriod(getEffectivePeriod(abs), getEffectivePeriod(other));
  if (modulus > 1) {
    result.period = modulus;
    result.residues = getResiduesMod(abs, modulus) & getResiduesMod(other, modulus);
  }
  return result;
};

const starLenAbs = (abs: LenAbs, lo: number) => {
  const result = mkLenAbs(lo, abs.hi === 0 ? 0 : UINT_MAX);
  const gcd = getLenAbsGcd(abs);
  if (gcd > 1 && gcd <= MAX_PERIOD) {
    result.period = gcd;
    result.residues = 1n;
  }
  return result;
};

const loopLenAbs = (abs: LenAbs, lower: number, upper: number) => {
  const result = mkLenAbs(mulTruncate(abs.lo, lower), mulTruncate(abs.hi, upper));
  if (upper === UINT_MAX || upper > MAX_PERIOD) {
    const gcd = getLenAbsGcd(abs);
    if (gcd > 1 && gcd <= MAX_PERIOD) {
      result.period = gcd;
      result.residues = 1n;
    }
    return result;
  }
  const modulus = abs.period > 1 ? abs.period : getLenAbsGcd(abs);
  if (modulus <= 1 || modulus > MAX_PERIOD) return result;
  const base = getResiduesMod(abs, modulus);
  let accumulated = 0n;
  let current = 1n;
  for (let count = 0; count <= upper; count++) {
    if (count >= lower) accumulated |= current;
    current = getSumset(current, base, modulus);
  }
  result.period = modulus;
  result.residues = accumulated;
  return result;
};

export const isResidueReachable = (
  period: number,
  residues: bigint,
  constant: number,
  stride: number,
) => {
  if (period === 0) return true;
  const offset = constant % period;
  const gcd = stride === 0 ? period : getGcd(stride, period);
  for (let residue = 0; residue < period; residue++) {
    if ((residues & getBit(residue)) === 0n) continue;
    if (stride === 0 ? residue === offset : (residue + period - offset) % gcd === 0) return true;
  }
  return false;
};

const UNKNOWN_INFO: ReInfo = {
  isKnown: false,
  isInterpreted: false,
  nullable: L_UNDEF,
  isClassical: true,
  ...mkLenAbs(0, UINT_MAX),
};

const mkInfo = (
  isInterpreted: boolean,
  nullable: number,
  minLength: number,
  maxLength: number,
  isClassical: boolean,
  abs?: LenAbs,
): ReInfo => ({
  isKnown: true,
  isInterpreted,
  nullable,
  isClassical,
  ...(abs ?? mkLenAbs(minLength, maxLength)),
});

const negateLbool = (value: number) => -value;

const starInfo = (info: ReInfo) =>
  mkInfo(info.isInterpreted, L_TRUE, 0, 0, info.isClassical, starLenAbs(info, 0));

const plusInfo = (info: ReInfo) =>
  info.isKnown
    ? mkInfo(info.isInterpreted, info.nullable, 0, 0, info.isClassical, starLenAbs(info, info.lo))
    : info;

const optInfo = (info: ReInfo) =>
  mkInfo(
    info.isInterpreted,
    L_TRUE,
    0,
    0,
    info.isClassical,
    mkLenAbs(0, info.hi, info.period, info.residues | 1n),
  );

const complementInfo = (info: ReInfo) => {
  if (!info.isKnown) return info;
  const nullable = negateLbool(info.nullable);
  return mkInfo(info.isInterpreted, nullable, nullable === L_FALSE ? 1 : 0, UINT_MAX, false);
};

const concatInfo = (info: ReInfo, other: ReInfo) => {
  if (!info.isKnown) return info;
  if (!other.isKnown) return other;
  const nullable =
    info.nullable === L_FALSE || other.nullable === L_FALSE
      ? L_FALSE
      : info.nullable === L_TRUE && other.nullable === L_TRUE
        ? L_TRUE
        : L_UNDEF;
  return mkInfo(
    info.isInterpreted && other.isInterpreted,
    nullable,
    0,
    0,
    info.isClassical && other.isClassical,
    concatLenAbs(info, other),
  );
};

const disjInfo = (info: ReInfo, other: ReInfo) => {
  if (!info.isKnown && !other.isKnown) return other;
  const nullable =
    info.nullable === L_TRUE || other.nullable === L_TRUE
      ? L_TRUE
      : info.nullable === L_FALSE && other.nullable === L_FALSE
        ? L_FALSE
        : L_UNDEF;
  return mkInfo(
    info.isInterpreted && other.isInterpreted,
    nullable,
    0,
    0,
    info.isClassical && other.isClassical,
    uniteLenAbs(info, other),
  );
};

const conjInfo = (info: ReInfo, other: ReInfo) => {
  if (!info.isKnown) return info;
  if (!other.isKnown) return other;
  const nullable =
    info.nullable === L_TRUE && other.nullable === L_TRUE
      ? L_TRUE
      : info.nullable === L_FALSE || other.nullable === L_FALSE
        ? L_FALSE
        : L_UNDEF;
  return mkInfo(
    info.isInterpreted && other.isInterpreted,
    nullable,
    0,
    0,
    false,
    meetLenAbs(info, other),
  );
};

const diffInfo = (info: ReInfo, other: ReInfo) => {
  if (!info.isKnown) return info;
  if (!other.isKnown) return other;
  const nullable =
    info.nullable === L_TRUE && other.nullable === L_FALSE
      ? L_TRUE
      : info.nullable === L_FALSE
        ? L_FALSE
        : L_UNDEF;
  return mkInfo(
    info.isInterpreted && other.isInterpreted,
    nullable,
    0,
    0,
    false,
    mkLenAbs(info.lo, info.hi, info.period, info.residues),
  );
};

const xorInfo = (info: ReInfo, other: ReInfo) => {
  if (!info.isKnown) return info;
  if (!other.isKnown) return other;
  const nullable =
    info.nullable !== L_UNDEF && other.nullable !== L_UNDEF
      ? info.nullable === other.nullable
        ? L_FALSE
        : L_TRUE
      : L_UNDEF;
  const abs = uniteLenAbs(info, other);
  abs.lo = 0;
  abs.hi = UINT_MAX;
  return mkInfo(info.isInterpreted && other.isInterpreted, nullable, 0, UINT_MAX, false, abs);
};

const orElseInfo = (info: ReInfo, other: ReInfo) => {
  if (!info.isKnown) return info;
  if (!other.isKnown) return other;
  const nullable =
    info.nullable === L_TRUE && other.nullable === L_TRUE
      ? L_TRUE
      : info.nullable === L_FALSE && other.nullable === L_FALSE
        ? L_FALSE
        : L_UNDEF;
  return mkInfo(
    false,
    nullable,
    0,
    0,
    info.isClassical && other.isClassical,
    uniteLenAbs(info, other),
  );
};

const loopInfo = (info: ReInfo, lower: number, upper: number) =>
  info.isKnown
    ? mkInfo(
        info.isInterpreted,
        info.nullable === L_TRUE || lower === 0 ? L_TRUE : info.nullable,
        0,
        0,
        info.isClassical,
        loopLenAbs(info, lower, upper),
      )
    : info;

const getConstChar = (manager: AstManager, expr: number) => {
  const chars = manager.getString(expr);
  if (chars !== undefined) return chars.length === 1 ? chars[0] : -1;
  return manager.getOp(expr) === OP_SEQ_UNIT ? manager.getChar(manager.getArg(expr, 0)) : -1;
};

const mkInfoRec = (manager: AstManager, table: (ReInfo | undefined)[], expr: number): ReInfo => {
  const getRec = (arg: number) => getInfoRec(manager, table, arg);
  const numArgs = manager.getNumArgs(expr);
  if (manager.getFamily(expr) === FAMILY_SEQ) {
    const op = manager.getOp(expr);
    const getBinary = (combine: (first: ReInfo, second: ReInfo) => ReInfo) =>
      numArgs === 1
        ? getRec(manager.getArg(expr, 0))
        : numArgs === 2
          ? combine(getRec(manager.getArg(expr, 0)), getRec(manager.getArg(expr, 1)))
          : UNKNOWN_INFO;
    switch (op) {
      case OP_RE_EMPTY_SET:
        return mkInfo(true, L_FALSE, UINT_MAX, 0, false);
      case OP_RE_FULL_SEQ_SET:
        return mkInfo(true, L_TRUE, 0, UINT_MAX, true);
      case OP_RE_STAR:
        return starInfo(getRec(manager.getArg(expr, 0)));
      case OP_RE_OPTION:
        return optInfo(getRec(manager.getArg(expr, 0)));
      case OP_RE_RANGE: {
        const lo = getConstChar(manager, manager.getArg(expr, 0));
        const hi = getConstChar(manager, manager.getArg(expr, 1));
        const isInterpreted = lo !== -1 && hi !== -1;
        return mkInfo(isInterpreted, L_FALSE, 1, 1, isInterpreted && lo <= hi);
      }
      case OP_RE_FULL_CHAR_SET:
      case OP_RE_OF_PRED:
        return mkInfo(true, L_FALSE, 1, 1, false);
      case OP_RE_CONCAT:
        return getBinary(concatInfo);
      case OP_RE_UNION:
        return getBinary(disjInfo);
      case OP_RE_INTERSECT:
        return getBinary(conjInfo);
      case OP_SEQ_TO_RE: {
        const seq = manager.getArg(expr, 0);
        const minLength = getStrMinLength(manager, seq);
        const isValue = manager.isValue(seq);
        const nullable = isValue && minLength === 0 ? L_TRUE : minLength > 0 ? L_FALSE : L_UNDEF;
        return mkInfo(isValue, nullable, minLength, getStrMaxLength(manager, seq), true);
      }
      case OP_RE_REVERSE:
        return getRec(manager.getArg(expr, 0));
      case OP_RE_PLUS:
        return plusInfo(getRec(manager.getArg(expr, 0)));
      case OP_RE_COMPLEMENT:
        return complementInfo(getRec(manager.getArg(expr, 0)));
      case OP_RE_LOOP: {
        const body = getRec(manager.getArg(expr, 0));
        if (numArgs === 1) {
          const parameters = manager.funcDecls[manager.decls[expr]].parameters;
          const lower = parameters.length >= 1 ? parameters[0] : 0;
          const upper = parameters.length === 2 ? parameters[1] : UINT_MAX;
          return loopInfo(body, lower, upper);
        }
        if (numArgs !== 2 && numArgs !== 3) return UNKNOWN_INFO;
        const lower = getUnsigned(manager, manager.getArg(expr, 1));
        if (lower === undefined) return UNKNOWN_INFO;
        if (numArgs === 2) return loopInfo(body, lower, UINT_MAX);
        const upper = getUnsigned(manager, manager.getArg(expr, 2));
        return upper === undefined ? UNKNOWN_INFO : loopInfo(body, lower, upper);
      }
      case OP_RE_DIFF:
        return numArgs === 2
          ? diffInfo(getRec(manager.getArg(expr, 0)), getRec(manager.getArg(expr, 1)))
          : UNKNOWN_INFO;
      case OP_RE_XOR:
        return getBinary(xorInfo);
      default:
        return UNKNOWN_INFO;
    }
  }
  if (manager.getOp(expr) === OP_ITE)
    return orElseInfo(getRec(manager.getArg(expr, 1)), getRec(manager.getArg(expr, 2)));
  return UNKNOWN_INFO;
};

const getInfoRec = (manager: AstManager, table: (ReInfo | undefined)[], expr: number): ReInfo => {
  const cached = table[expr];
  if (cached !== undefined) return cached;
  const result = manager.kinds[expr] === KIND_APP ? mkInfoRec(manager, table, expr) : UNKNOWN_INFO;
  table[expr] = result;
  return result;
};

// Each seq_util of Z3 caches the infos and pins the expressions it computed them for, until it is
// destroyed.
export class ReInfoCache {
  private infos: (ReInfo | undefined)[] = [];
  private pins: RefVector;

  constructor(readonly manager: AstManager) {
    this.pins = new RefVector(manager);
  }

  getInfo(expr: number) {
    const cached = this.infos[expr];
    if (cached !== undefined) return cached;
    this.pins.push(expr);
    return getInfoRec(this.manager, this.infos, expr);
  }

  clone() {
    const copy = new ReInfoCache(this.manager);
    copy.infos = [...this.infos];
    for (const expr of this.pins.items) copy.pins.push(expr);
    return copy;
  }

  release() {
    this.pins.reset();
    this.infos = [];
  }
}

export const getReMinLength = (info: ReInfoCache, expr: number) => info.getInfo(expr).lo;

export const getReMaxLength = (info: ReInfoCache, expr: number) => info.getInfo(expr).hi;

export const isReGround = (info: ReInfoCache, expr: number) => info.getInfo(expr).isInterpreted;

export const isLengthEmpty = (info: ReInfo) => info.isKnown && isLenAbsEmpty(info);

const getUnsigned = (manager: AstManager, expr: number) => {
  const value = manager.getNumeral(expr);
  return value !== undefined && value >= 0n && value <= BigInt(UINT_MAX)
    ? Number(value)
    : undefined;
};

export const isReOp = (manager: AstManager, expr: number, op: number) =>
  manager.getFamily(expr) === FAMILY_SEQ && manager.getOp(expr) === op;

export const isReBinary = (manager: AstManager, expr: number, op: number) =>
  isReOp(manager, expr, op) && manager.getNumArgs(expr) === 2;

export const isReUnary = (manager: AstManager, expr: number, op: number) =>
  isReOp(manager, expr, op) && manager.getNumArgs(expr) === 1;

export const isReEmpty = (manager: AstManager, expr: number) =>
  isReOp(manager, expr, OP_RE_EMPTY_SET);

export const isFullChar = (manager: AstManager, expr: number) =>
  isReOp(manager, expr, OP_RE_FULL_CHAR_SET);

export const isFullSeq = (manager: AstManager, expr: number) =>
  isReOp(manager, expr, OP_RE_FULL_SEQ_SET) ||
  (isReUnary(manager, expr, OP_RE_STAR) && isFullChar(manager, manager.getArg(expr, 0)));

export const isDotPlus = (manager: AstManager, expr: number) => {
  if (isReUnary(manager, expr, OP_RE_PLUS) && isFullChar(manager, manager.getArg(expr, 0)))
    return true;
  if (!isReBinary(manager, expr, OP_RE_CONCAT)) return false;
  const first = manager.getArg(expr, 0);
  const second = manager.getArg(expr, 1);
  return (
    (isFullChar(manager, first) && isFullSeq(manager, second)) ||
    (isFullChar(manager, second) && isFullSeq(manager, first))
  );
};

export const isEpsilon = (manager: AstManager, expr: number) =>
  isReUnary(manager, expr, OP_SEQ_TO_RE) && isEmptySeq(manager, manager.getArg(expr, 0));

export const getRangeChars = (manager: AstManager, expr: number) => {
  if (!isReBinary(manager, expr, OP_RE_RANGE)) return undefined;
  const lo = manager.getString(manager.getArg(expr, 0));
  const hi = manager.getString(manager.getArg(expr, 1));
  if (lo === undefined || hi === undefined || lo.length !== 1 || hi.length !== 1) return undefined;
  return [lo[0], hi[0]] as const;
};

export interface LoopBounds {
  body: number;
  lo: number;
  hi: number;
}

export const getLoopBounds = (manager: AstManager, expr: number): LoopBounds | undefined => {
  if (!isReUnary(manager, expr, OP_RE_LOOP)) return undefined;
  const parameters = manager.funcDecls[manager.decls[expr]].parameters;
  if (parameters.length !== 2) return undefined;
  return { body: manager.getArg(expr, 0), lo: parameters[0], hi: parameters[1] };
};

export const getLoopLower = (manager: AstManager, expr: number): LoopBounds | undefined => {
  if (!isReUnary(manager, expr, OP_RE_LOOP)) return undefined;
  const parameters = manager.funcDecls[manager.decls[expr]].parameters;
  if (parameters.length !== 1) return undefined;
  return { body: manager.getArg(expr, 0), lo: parameters[0], hi: UINT_MAX };
};

export const mkRe = (manager: AstManager, op: number, args: number[], parameters: number[] = []) =>
  mkSeqApp(manager, op, args, parameters);

export const mkReEmpty = (manager: AstManager, reSort: number) =>
  mkSeqApp(manager, OP_RE_EMPTY_SET, [], [], reSort);

export const mkFullSeq = (manager: AstManager, reSort: number) =>
  mkSeqApp(manager, OP_RE_FULL_SEQ_SET, [], [], reSort);

export const mkFullChar = (manager: AstManager, reSort: number) =>
  mkSeqApp(manager, OP_RE_FULL_CHAR_SET, [], [], reSort);

export const mkToRe = (manager: AstManager, seq: number) => mkSeqApp(manager, OP_SEQ_TO_RE, [seq]);

export const mkEpsilon = (manager: AstManager, seqSort: number) =>
  mkToRe(manager, mkEmptySeq(manager, seqSort));

export const mkReLoop = (manager: AstManager, body: number, lo: number, hi?: number) =>
  mkSeqApp(manager, OP_RE_LOOP, [body], hi === undefined ? [lo] : [lo, hi]);

export const mkReRange = (manager: AstManager, reSort: number, lo: number, hi: number) => {
  if (lo > hi) return mkReEmpty(manager, reSort);
  if (lo === 0 && hi === manager.maxChar) return mkFullChar(manager, reSort);
  const loString = manager.mkString([lo]);
  if (lo === hi) return mkToRe(manager, loString);
  return mkSeqApp(manager, OP_RE_RANGE, [loString, manager.mkString([hi])]);
};

export const getStrMinLength = (manager: AstManager, seq: number): number => {
  const getLength = (part: number) =>
    manager.getOp(part) === OP_SEQ_UNIT ? 1 : (manager.getString(part)?.length ?? 0);
  let result = 0;
  let current = seq;
  while (isBinaryApp(manager, current, OP_SEQ_CONCAT)) {
    const first = manager.getArg(current, 0);
    result +=
      manager.getOp(first) === OP_SEQ_CONCAT ? getStrMinLength(manager, first) : getLength(first);
    current = manager.getArg(current, 1);
  }
  return result + getLength(current);
};

export const getStrMaxLength = (manager: AstManager, seq: number): number => {
  const getLength = (part: number) => {
    if (isEmptySeq(manager, part)) return 0;
    const op = manager.getOp(part);
    if (op === OP_SEQ_UNIT || op === OP_SEQ_AT) return 1;
    if (op === OP_SEQ_EXTRACT) return getUnsigned(manager, manager.getArg(part, 2)) ?? UINT_MAX;
    return manager.getString(part)?.length ?? UINT_MAX;
  };
  let result = 0;
  let current = seq;
  while (isBinaryApp(manager, current, OP_SEQ_CONCAT)) {
    const first = manager.getArg(current, 0);
    result = addTruncate(
      manager.getOp(first) === OP_SEQ_CONCAT ? getStrMaxLength(manager, first) : getLength(first),
      result,
    );
    current = manager.getArg(current, 1);
  }
  return addTruncate(getLength(current), result);
};

export const getLengthShape = (manager: AstManager, seq: number) => {
  let constant = 0;
  let stride = 0;
  const multiplicities = new Map<number, number>();
  const todo = [seq];
  while (todo.length > 0) {
    const expr = todo.pop()!;
    if (isBinaryApp(manager, expr, OP_SEQ_CONCAT)) {
      todo.push(manager.getArg(expr, 0), manager.getArg(expr, 1));
      continue;
    }
    if (isEmptySeq(manager, expr)) continue;
    if (manager.getOp(expr) === OP_SEQ_UNIT) {
      constant++;
      continue;
    }
    const chars = manager.getString(expr);
    if (chars !== undefined) {
      constant += chars.length;
      continue;
    }
    multiplicities.set(expr, (multiplicities.get(expr) ?? 0) + 1);
  }
  for (const count of multiplicities.values()) stride = getGcd(stride, count);
  return { constant, stride };
};

export const canBeMember = (infos: ReInfoCache, seq: number, regex: number) => {
  const info = infos.getInfo(regex);
  if (!info.isKnown || info.period <= 1) return true;
  const shape = getLengthShape(infos.manager, seq);
  return isResidueReachable(info.period, info.residues, shape.constant, shape.stride);
};

const isCharLe = (manager: AstManager, expr: number) =>
  manager.getOp(expr) === OP_CHAR_LE && manager.getNumArgs(expr) === 2;

export interface CharRange {
  lo: number;
  hi: number;
  isNegated: boolean;
}

export const getCharConstRange = (
  manager: AstManager,
  variable: number,
  expr: number,
): CharRange | undefined => {
  const isNegated = manager.getOp(expr) === OP_NOT;
  const atom = isNegated ? manager.getArg(expr, 0) : expr;
  const op = manager.getOp(atom);
  if (op === OP_EQ) {
    const first = manager.getArg(atom, 0);
    const second = manager.getArg(atom, 1);
    if (first === variable && manager.getChar(second) !== -1) {
      const code = manager.getChar(second);
      return { lo: code, hi: code, isNegated };
    }
    if (second === variable && manager.getChar(first) !== -1) {
      const code = manager.getChar(first);
      return { lo: code, hi: code, isNegated };
    }
    return undefined;
  }
  if (isCharLe(manager, atom)) {
    const first = manager.getArg(atom, 0);
    const second = manager.getArg(atom, 1);
    if (first === variable && manager.getChar(second) !== -1)
      return { lo: 0, hi: manager.getChar(second), isNegated };
    if (second === variable && manager.getChar(first) !== -1)
      return { lo: manager.getChar(first), hi: manager.maxChar, isNegated };
    return undefined;
  }
  if (op !== OP_AND || manager.getNumArgs(atom) !== 2) return undefined;
  const first = manager.getArg(atom, 0);
  const second = manager.getArg(atom, 1);
  if (!isCharLe(manager, first) || !isCharLe(manager, second)) return undefined;
  const [firstLeft, firstRight] = [manager.getArg(first, 0), manager.getArg(first, 1)];
  const [secondLeft, secondRight] = [manager.getArg(second, 0), manager.getArg(second, 1)];
  if (
    firstRight === variable &&
    manager.getChar(firstLeft) !== -1 &&
    secondLeft === variable &&
    manager.getChar(secondRight) !== -1
  )
    return { lo: manager.getChar(firstLeft), hi: manager.getChar(secondRight), isNegated };
  if (
    firstLeft === variable &&
    manager.getChar(firstRight) !== -1 &&
    secondRight === variable &&
    manager.getChar(secondLeft) !== -1
  )
    return { lo: manager.getChar(secondLeft), hi: manager.getChar(firstRight), isNegated };
  return undefined;
};

export const mkCharLe = (manager: AstManager, first: number, second: number) => {
  if (first === second) return manager.trueExpr;
  if (!manager.isCharSort(manager.sorts[first]))
    throw new SmtUnsupportedError("range comparisons of non-character elements");
  const firstCode = manager.getChar(first);
  const secondCode = manager.getChar(second);
  if (firstCode !== -1 && secondCode !== -1)
    return firstCode <= secondCode ? manager.trueExpr : manager.falseExpr;
  if (firstCode === 0 || secondCode === manager.maxChar) return manager.trueExpr;
  return mkSeqApp(manager, OP_CHAR_LE, [first, second]);
};

export const getUnitStringChar = (manager: AstManager, seq: number) => {
  const chars = manager.getString(seq);
  if (chars !== undefined) return chars.length === 1 ? manager.mkChar(chars[0]) : -1;
  return manager.getOp(seq) === OP_SEQ_UNIT ? manager.getArg(seq, 0) : -1;
};

export const isReSortOf = (manager: AstManager, expr: number) =>
  manager.isReSort(manager.sorts[expr]);

// Ported from Z3 (src/ast/rewriter/seq_range_predicate.cpp,
// src/ast/rewriter/seq_range_collapse.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_AND,
  OP_CHAR_LE,
  OP_EQ,
  OP_NOT,
  OP_OR,
  OP_RE_COMPLEMENT,
  OP_RE_DIFF,
  OP_RE_INTERSECT,
  OP_SEQ_UNIT,
  OP_RE_RANGE,
  OP_RE_UNION,
} from "./ast";
import {
  isFullChar,
  isReBinary,
  isReEmpty,
  isReUnary,
  mkRe,
  mkReEmpty,
  mkReRange,
} from "./seq-re-util";

export type RangePredicate = number[];

export const mkTopRange = (manager: AstManager): RangePredicate => [0, manager.maxChar];

const mkSingletonRange = (code: number): RangePredicate => [code, code];

const mkRangeOf = (lo: number, hi: number, maxChar: number): RangePredicate =>
  lo <= hi && lo <= maxChar ? [lo, Math.min(hi, maxChar)] : [];

const appendMerged = (result: RangePredicate, lo: number, hi: number) => {
  if (result.length > 0 && result[result.length - 1] + 1 >= lo) {
    if (result[result.length - 1] < hi) result[result.length - 1] = hi;
    return;
  }
  result.push(lo, hi);
};

export const uniteRanges = (first: RangePredicate, second: RangePredicate) => {
  const result: RangePredicate = [];
  let left = 0;
  let right = 0;
  while (left < first.length && right < second.length) {
    if (first[left] <= second[right]) {
      appendMerged(result, first[left], first[left + 1]);
      left += 2;
    } else {
      appendMerged(result, second[right], second[right + 1]);
      right += 2;
    }
  }
  for (; left < first.length; left += 2) appendMerged(result, first[left], first[left + 1]);
  for (; right < second.length; right += 2) appendMerged(result, second[right], second[right + 1]);
  return result;
};

export const intersectRanges = (first: RangePredicate, second: RangePredicate) => {
  const result: RangePredicate = [];
  let left = 0;
  let right = 0;
  while (left < first.length && right < second.length) {
    const lo = Math.max(first[left], second[right]);
    const hi = Math.min(first[left + 1], second[right + 1]);
    if (lo <= hi) result.push(lo, hi);
    if (first[left + 1] < second[right + 1]) left += 2;
    else if (second[right + 1] < first[left + 1]) right += 2;
    else {
      left += 2;
      right += 2;
    }
  }
  return result;
};

const complementRanges = (ranges: RangePredicate, maxChar: number) => {
  const result: RangePredicate = [];
  let cursor = 0;
  for (let index = 0; index < ranges.length; index += 2) {
    if (cursor < ranges[index]) result.push(cursor, ranges[index] - 1);
    if (ranges[index + 1] >= maxChar) {
      cursor = maxChar + 1;
      break;
    }
    cursor = ranges[index + 1] + 1;
  }
  if (cursor <= maxChar) result.push(cursor, maxChar);
  return result;
};

export const subtractRanges = (first: RangePredicate, second: RangePredicate) => {
  const result: RangePredicate = [];
  let start = 0;
  for (let index = 0; index < first.length; index += 2) {
    const lo = first[index];
    const hi = first[index + 1];
    let cursor = lo;
    while (start < second.length && second[start + 1] < cursor) start += 2;
    for (let other = start; other < second.length && second[other] <= hi; other += 2) {
      if (cursor < second[other]) result.push(cursor, Math.min(hi, second[other] - 1));
      if (second[other + 1] >= hi) {
        cursor = hi + 1;
        break;
      }
      cursor = second[other + 1] + 1;
    }
    if (cursor <= hi) result.push(cursor, hi);
  }
  return result;
};

export const guardToRangePredicate = (
  manager: AstManager,
  variable: number,
  guard: number,
): RangePredicate | undefined => {
  if (manager.isTrue(guard)) return mkTopRange(manager);
  if (manager.isFalse(guard)) return [];
  const op = manager.getOp(guard);
  if (op === OP_EQ) {
    const first = manager.getArg(guard, 0);
    const second = manager.getArg(guard, 1);
    if (first === variable && manager.getChar(second) !== -1)
      return mkSingletonRange(manager.getChar(second));
    if (second === variable && manager.getChar(first) !== -1)
      return mkSingletonRange(manager.getChar(first));
    return undefined;
  }
  if (op === OP_CHAR_LE && manager.getNumArgs(guard) === 2) {
    const first = manager.getArg(guard, 0);
    const second = manager.getArg(guard, 1);
    if (second === variable && manager.getChar(first) !== -1)
      return mkRangeOf(manager.getChar(first), manager.maxChar, manager.maxChar);
    if (first === variable && manager.getChar(second) !== -1)
      return mkRangeOf(0, manager.getChar(second), manager.maxChar);
    return undefined;
  }
  if (op === OP_NOT) {
    const inner = guardToRangePredicate(manager, variable, manager.getArg(guard, 0));
    return inner === undefined ? undefined : complementRanges(inner, manager.maxChar);
  }
  if (op !== OP_AND && op !== OP_OR) return undefined;
  let result = op === OP_AND ? mkTopRange(manager) : [];
  for (const arg of manager.getArgs(guard)) {
    const ranges = guardToRangePredicate(manager, variable, arg);
    if (ranges === undefined) return undefined;
    result = op === OP_AND ? intersectRanges(result, ranges) : uniteRanges(result, ranges);
  }
  return result;
};

const getRangeBound = (manager: AstManager, expr: number) => {
  const code = manager.getChar(expr);
  if (code !== -1) return code;
  if (manager.getOp(expr) === OP_SEQ_UNIT) return manager.getChar(manager.getArg(expr, 0));
  const chars = manager.getString(expr);
  return chars?.length === 1 ? chars[0] : -1;
};

export const regexToRangePredicate = (
  manager: AstManager,
  regex: number,
): RangePredicate | undefined => {
  const sort = manager.sorts[regex];
  if (!manager.isReSort(sort) || !manager.isStringSort(manager.getReSeqSort(sort)))
    return undefined;
  if (isReEmpty(manager, regex)) return [];
  if (isFullChar(manager, regex)) return mkTopRange(manager);
  if (isReBinary(manager, regex, OP_RE_RANGE)) {
    const lo = getRangeBound(manager, manager.getArg(regex, 0));
    const hi = getRangeBound(manager, manager.getArg(regex, 1));
    if (lo === -1 || hi === -1) return undefined;
    return lo > hi ? [] : mkRangeOf(lo, hi, manager.maxChar);
  }
  const getPair = (first: number, second: number) => {
    const left = regexToRangePredicate(manager, first);
    if (left === undefined) return undefined;
    const right = regexToRangePredicate(manager, second);
    return right === undefined ? undefined : [left, right];
  };
  const getDiff = (first: number, second: number) => {
    const pair = getPair(first, second);
    return pair === undefined ? undefined : subtractRanges(pair[0], pair[1]);
  };
  if (isReBinary(manager, regex, OP_RE_UNION)) {
    const pair = getPair(manager.getArg(regex, 0), manager.getArg(regex, 1));
    return pair === undefined ? undefined : uniteRanges(pair[0], pair[1]);
  }
  if (isReBinary(manager, regex, OP_RE_DIFF))
    return getDiff(manager.getArg(regex, 0), manager.getArg(regex, 1));
  if (isReBinary(manager, regex, OP_RE_INTERSECT)) {
    const first = manager.getArg(regex, 0);
    const second = manager.getArg(regex, 1);
    if (isReUnary(manager, second, OP_RE_COMPLEMENT))
      return getDiff(first, manager.getArg(second, 0));
    if (isReUnary(manager, first, OP_RE_COMPLEMENT))
      return getDiff(second, manager.getArg(first, 0));
    const pair = getPair(first, second);
    return pair === undefined ? undefined : intersectRanges(pair[0], pair[1]);
  }
  return undefined;
};

export const rangePredicateToRegex = (
  manager: AstManager,
  ranges: RangePredicate,
  seqSort: number,
) => {
  const reSort = manager.mkReSort(seqSort);
  if (ranges.length === 0) return mkReEmpty(manager, reSort);
  if (ranges.length === 2) return mkReRange(manager, reSort, ranges[0], ranges[1]);
  const regexes: number[] = [];
  for (let index = 0; index < ranges.length; index += 2)
    regexes.push(mkReRange(manager, reSort, ranges[index], ranges[index + 1]));
  regexes.sort((first, second) => manager.ids[first] - manager.ids[second]);
  let result = regexes[regexes.length - 1];
  for (let index = regexes.length - 1; index-- > 0;)
    result = mkRe(manager, OP_RE_UNION, [regexes[index], result]);
  return result;
};

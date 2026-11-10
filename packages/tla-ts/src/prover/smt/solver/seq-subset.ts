// Ported from Z3 (src/ast/rewriter/seq_subset.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_RE_COMPLEMENT,
  OP_RE_CONCAT,
  OP_RE_DIFF,
  OP_RE_INTERSECT,
  OP_RE_PLUS,
  OP_RE_STAR,
  OP_RE_UNION,
  OP_SEQ_TO_RE,
  OP_STRING_CONST,
} from "./ast";
import {
  getLoopBounds,
  getRangeChars,
  type ReInfoCache,
  isDotPlus,
  isEpsilon,
  isFullSeq,
  isReBinary,
  isReEmpty,
  isReUnary,
} from "./seq-re-util";
import { L_FALSE, L_TRUE } from "./lbool";

const MAX_DEPTH = 3;

const flattenConcat = (manager: AstManager, regex: number, out: number[]) => {
  if (!isReBinary(manager, regex, OP_RE_CONCAT)) {
    out.push(regex);
    return;
  }
  flattenConcat(manager, manager.getArg(regex, 0), out);
  flattenConcat(manager, manager.getArg(regex, 1), out);
};

const isEndingWith = (manager: AstManager, regex: number, suffix: number) => {
  if (regex === suffix) return true;
  const factors: number[] = [];
  const suffixFactors: number[] = [];
  flattenConcat(manager, regex, factors);
  flattenConcat(manager, suffix, suffixFactors);
  if (suffixFactors.length > factors.length) return false;
  const offset = factors.length - suffixFactors.length;
  return suffixFactors.every((factor, index) => factors[offset + index] === factor);
};

const isSubsetRec = (
  manager: AstManager,
  info: ReInfoCache,
  first: number,
  second: number,
  depth: number,
) => {
  const getUnary = (expr: number, op: number) =>
    isReUnary(manager, expr, op) ? manager.getArg(expr, 0) : -1;
  const getBinary = (expr: number, op: number) => isReBinary(manager, expr, op);
  const isSubset = (left: number, right: number, nextDepth: number): boolean =>
    isSubsetRec(manager, info, left, right, nextDepth);
  let a = first;
  let b = second;
  for (;;) {
    if (a === b || isReEmpty(manager, a) || isFullSeq(manager, b)) return true;
    if (isEpsilon(manager, a) && info.getInfo(b).nullable === L_TRUE) return true;
    if (depth >= MAX_DEPTH) return false;
    if (isDotPlus(manager, b) && info.getInfo(a).nullable === L_FALSE) return true;
    const starB = getUnary(b, OP_RE_STAR);
    if (isEpsilon(manager, a) && starB !== -1) return true;
    if (starB !== -1 && isSubset(a, starB, depth)) return true;
    const starA = getUnary(a, OP_RE_STAR);
    if (starA !== -1 && starB !== -1 && isSubset(starA, starB, depth + 1)) return true;
    const plusA = getUnary(a, OP_RE_PLUS);
    const plusB = getUnary(b, OP_RE_PLUS);
    if (plusA !== -1 && plusB !== -1 && isSubset(plusA, plusB, depth)) return true;
    if (plusB !== -1 && isSubset(a, plusB, depth)) return true;
    if (plusA !== -1 && starB !== -1 && isSubset(plusA, starB, depth + 1)) return true;
    const rangeA = getRangeChars(manager, a);
    const rangeB = getRangeChars(manager, b);
    if (
      rangeA !== undefined &&
      rangeB !== undefined &&
      rangeB[0] <= rangeA[0] &&
      rangeA[1] <= rangeB[1]
    )
      return true;
    const toReA = getUnary(a, OP_SEQ_TO_RE);
    if (
      toReA !== -1 &&
      rangeB !== undefined &&
      manager.getOp(toReA) === OP_STRING_CONST &&
      manager.funcDecls[manager.decls[toReA]].parameters.length === 1
    ) {
      const chars = manager.getString(toReA)!;
      if (chars.length === 1 && rangeB[0] <= chars[0] && chars[0] <= rangeB[1]) return true;
    }
    const b1 = getBinary(b, OP_RE_UNION) ? manager.getArg(b, 0) : -1;
    const b2 = b1 === -1 ? -1 : manager.getArg(b, 1);
    if (b1 !== -1 && (isSubset(a, b1, depth + 1) || isSubset(a, b2, depth + 1))) return true;
    if (
      getBinary(a, OP_RE_UNION) &&
      isSubset(manager.getArg(a, 0), b, depth + 1) &&
      isSubset(manager.getArg(a, 1), b, depth + 1)
    )
      return true;
    if (
      getBinary(a, OP_RE_INTERSECT) &&
      (isSubset(manager.getArg(a, 0), b, depth + 1) || isSubset(manager.getArg(a, 1), b, depth + 1))
    )
      return true;
    if (
      getBinary(b, OP_RE_INTERSECT) &&
      isSubset(a, manager.getArg(b, 0), depth + 1) &&
      isSubset(a, manager.getArg(b, 1), depth + 1)
    )
      return true;
    const loopA = getLoopBounds(manager, a);
    const loopB = getLoopBounds(manager, b);
    if (
      loopA !== undefined &&
      loopB !== undefined &&
      loopB.lo <= loopA.lo &&
      loopA.hi <= loopB.hi &&
      isSubset(loopA.body, loopB.body, depth + 1)
    )
      return true;
    if (getBinary(a, OP_RE_DIFF) && isSubset(manager.getArg(a, 0), b, depth + 1)) return true;
    const isConcatB = getBinary(b, OP_RE_CONCAT);
    const concatB1 = isConcatB ? manager.getArg(b, 0) : -1;
    const concatB2 = isConcatB ? manager.getArg(b, 1) : -1;
    if (isConcatB && isFullSeq(manager, concatB1) && isSubset(a, concatB2, depth)) return true;
    if (isConcatB && isFullSeq(manager, concatB1) && isEndingWith(manager, a, concatB2))
      return true;
    if (isConcatB && isFullSeq(manager, concatB2) && isSubset(a, concatB1, depth)) return true;
    const isConcatA = getBinary(a, OP_RE_CONCAT);
    const concatA1 = isConcatA ? manager.getArg(a, 0) : -1;
    const concatA2 = isConcatA ? manager.getArg(a, 1) : -1;
    if (
      isConcatA &&
      starB !== -1 &&
      isSubset(concatA1, starB, depth + 1) &&
      isSubset(concatA2, b, depth + 1)
    )
      return true;
    if (
      isConcatA &&
      starB !== -1 &&
      isSubset(concatA2, starB, depth + 1) &&
      isSubset(concatA1, b, depth + 1)
    )
      return true;
    if (isConcatA && isConcatB && isSubset(concatA1, concatB1, depth + 1)) {
      a = concatA2;
      b = concatB2;
      continue;
    }
    const complementA = getUnary(a, OP_RE_COMPLEMENT);
    const complementB = getUnary(b, OP_RE_COMPLEMENT);
    if (complementA !== -1 && complementB !== -1)
      return isSubset(complementB, complementA, depth + 1);
    return false;
  }
};

export const isReSubset = (info: ReInfoCache, first: number, second: number) =>
  isSubsetRec(info.manager, info, first, second, 0);

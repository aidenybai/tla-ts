// Ported from Z3 (src/ast/seq/seq_skolem.cpp, src/ast/seq/seq_skolem.h), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_SEQ_CONCAT,
  OP_SEQ_NTH_I,
  OP_SEQ_SKOLEM,
  OP_SEQ_UNIT,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import {
  isBinaryApp,
  isEmptySeq,
  isSkolemOf,
  mkConcatOf,
  mkSeqApp,
  mkSkolem,
} from "./seq-decl-plugin";

const TAIL = "seq.tail";
const SEQ_FIRST = "seq.first";
const SEQ_LAST = "seq.last";
const INDEXOF_LEFT = "seq.idx.l";
const INDEXOF_RIGHT = "seq.idx.r";
const PRE = "seq.pre";
const POST = "seq.post";
const EQ = "seq.eq";
const MAX_UNFOLDING = "seq.max_unfolding";
const LENGTH_LIMIT = "seq.length_limit";

export interface Decomposition {
  head: number;
  tail: number;
}

export class SeqSkolem {
  constructor(
    private manager: AstManager,
    private rewrite: (expr: number) => number,
  ) {}

  mk(name: string, args: number[], range?: number, isRewriting = true) {
    const result = mkSkolem(this.manager, name, args, range ?? this.manager.sorts[args[0]]);
    return isRewriting ? this.rewrite(result) : result;
  }

  private mkInt(value: number | bigint) {
    return this.manager.mkNumeral(BigInt(value));
  }

  mkAlign(args: number[]) {
    return this.mk("seq.align", args);
  }

  mkAlignL(args: number[]) {
    return this.mk("seq.align.l", args);
  }

  mkAlignR(args: number[]) {
    return this.mk("seq.align.r", args);
  }

  mkAlignM(first: number, second: number, third: number, fourth: number): number {
    const manager = this.manager;
    if (this.isAlign(first) && this.isAlign(second)) {
      const firstSuffix = manager.getArg(first, 1);
      const secondSuffix = manager.getArg(second, 1);
      const firstPrefix = manager.getArg(first, 0);
      const secondPrefix = manager.getArg(second, 0);
      if (firstSuffix === secondSuffix && firstPrefix !== secondPrefix)
        return this.mkAlignM(firstPrefix, secondPrefix, third, fourth);
    }
    return this.mk("seq.align.m", [first, second, third, fourth]);
  }

  private withOffset(args: number[], offset: number | undefined) {
    return offset === undefined ? args : [...args, offset];
  }

  mkIndexofLeft(text: number, pattern: number, offset?: number) {
    return this.mk(INDEXOF_LEFT, this.withOffset([text, pattern], offset));
  }

  mkIndexofRight(text: number, pattern: number, offset?: number) {
    return this.mk(INDEXOF_RIGHT, this.withOffset([text, pattern], offset));
  }

  mkContainsLeft(text: number, pattern: number) {
    return this.mk("seq.cnt.l", [text, pattern]);
  }

  mkContainsRight(text: number, pattern: number) {
    return this.mk("seq.cnt.r", [text, pattern]);
  }

  mkLastIndexofLeft(text: number, pattern: number) {
    return this.mk("seq.lidx.l", [text, pattern]);
  }

  mkLastIndexofRight(text: number, pattern: number) {
    return this.mk("seq.lidx.r", [text, pattern]);
  }

  mkTail(seq: number, index: number) {
    return this.mk(TAIL, [seq, index]);
  }

  mkPost(seq: number, index: number) {
    return this.mk(POST, [seq, index]);
  }

  mkPre(seq: number, index: number) {
    return this.mk(PRE, [seq, index]);
  }

  mkEq(first: number, second: number) {
    return this.mk(EQ, [first, second], SORT_BOOL);
  }

  mkPrefixInv(first: number, second: number) {
    return this.mk("seq.p.suffix", [first, second]);
  }

  mkSuffixInv(first: number, second: number) {
    return this.mk("seq.s.prefix", [first, second]);
  }

  mkLeft(args: number[]) {
    return this.mk("seq.left", args);
  }

  mkRight(args: number[]) {
    return this.mk("seq.right", args);
  }

  mkDigit2int(char: number) {
    return this.mk("seq.digit2int", [char], SORT_INT);
  }

  mkUnitInv(unit: number) {
    const manager = this.manager;
    return this.mk("seq.unit-inv", [unit], manager.sorts[manager.getArg(unit, 0)]);
  }

  mkLast(seq: number) {
    const manager = this.manager;
    const chars = manager.getString(seq);
    if (chars !== undefined && chars.length > 0) return manager.mkChar(chars[chars.length - 1]);
    return this.mk(SEQ_LAST, [seq], manager.getSeqElementSort(manager.sorts[seq]));
  }

  mkFirst(seq: number) {
    const manager = this.manager;
    const chars = manager.getString(seq);
    if (chars !== undefined && chars.length > 0) return manager.mkString(chars.slice(0, -1));
    return this.mk(SEQ_FIRST, [seq]);
  }

  mkMaxUnfoldingDepth(depth: number) {
    return mkSkolem(this.manager, MAX_UNFOLDING, [], SORT_BOOL, [depth], [depth]);
  }

  mkLengthLimit(seq: number, limit: number) {
    return mkSkolem(
      this.manager,
      LENGTH_LIMIT,
      [],
      SORT_BOOL,
      [limit, seq],
      [limit, this.manager.hashes[seq]],
    );
  }

  isSkolem(expr: number) {
    return this.manager.getOp(expr) === OP_SEQ_SKOLEM;
  }

  private isNamed(expr: number, name: string) {
    return isSkolemOf(this.manager, expr, name);
  }

  isTail(expr: number) {
    return this.isNamed(expr, TAIL);
  }

  getTailIndex(expr: number) {
    if (!this.isTail(expr)) return undefined;
    const index = this.manager.getNumeral(this.manager.getArg(expr, 1));
    return index !== undefined && index >= 0n && index <= 0xffffffffn ? Number(index) : undefined;
  }

  isSeqFirst(expr: number) {
    return this.isNamed(expr, SEQ_FIRST);
  }

  isIndexofLeft(expr: number) {
    return this.isNamed(expr, INDEXOF_LEFT);
  }

  isIndexofRight(expr: number) {
    return this.isNamed(expr, INDEXOF_RIGHT);
  }

  isPre(expr: number) {
    return this.isNamed(expr, PRE);
  }

  isPost(expr: number) {
    return this.isNamed(expr, POST);
  }

  isEq(expr: number) {
    return this.isNamed(expr, EQ) && this.manager.getNumArgs(expr) === 2;
  }

  isDigit(expr: number) {
    return this.isNamed(expr, "seq.is_digit");
  }

  isMaxUnfolding(expr: number) {
    return this.isNamed(expr, MAX_UNFOLDING);
  }

  getLengthLimit(expr: number) {
    if (!this.isNamed(expr, LENGTH_LIMIT)) return undefined;
    const parameters = this.manager.funcDecls[this.manager.decls[expr]].parameters;
    return { limit: parameters[0], seq: parameters[1] };
  }

  isAlign(expr: number) {
    return this.isNamed(expr, "seq.align.m") && this.manager.getNumArgs(expr) === 2;
  }

  isAlignL(expr: number) {
    return this.isNamed(expr, "seq.align.l");
  }

  isAlignR(expr: number) {
    return this.isNamed(expr, "seq.align.r");
  }

  isRegexSkolem(expr: number) {
    return (
      this.isNamed(expr, "aut.accept") ||
      this.isNamed(expr, "re.is_empty") ||
      this.isNamed(expr, "re.is_non_empty") ||
      this.isNamed(expr, "aut.step")
    );
  }

  decompose(input: number): Decomposition {
    const manager = this.manager;
    const mkNthUnit = (seq: number, index: number | bigint) =>
      mkSeqApp(manager, OP_SEQ_UNIT, [mkSeqApp(manager, OP_SEQ_NTH_I, [seq, this.mkInt(index)])]);
    let expr = input;
    for (;;) {
      const chars = manager.getString(expr);
      if (isEmptySeq(manager, expr)) return { head: mkNthUnit(expr, 0), tail: expr };
      if (chars !== undefined)
        return {
          head: mkSeqApp(manager, OP_SEQ_UNIT, [manager.mkChar(chars[0])]),
          tail: manager.mkString(chars.slice(1)),
        };
      if (manager.getOp(expr) === OP_SEQ_UNIT) {
        const tail = mkConcatOf(manager, [], manager.sorts[expr]);
        return { head: this.rewrite(expr), tail };
      }
      if (!isBinaryApp(manager, expr, OP_SEQ_CONCAT)) break;
      const first = manager.getArg(expr, 0);
      const second = manager.getArg(expr, 1);
      const firstChars = manager.getString(first);
      if (isEmptySeq(manager, first)) {
        expr = second;
        continue;
      }
      if (firstChars !== undefined && firstChars.length > 0)
        return {
          head: mkSeqApp(manager, OP_SEQ_UNIT, [manager.mkChar(firstChars[0])]),
          tail: mkSeqApp(manager, OP_SEQ_CONCAT, [manager.mkString(firstChars.slice(1)), second]),
        };
      if (manager.getOp(first) === OP_SEQ_UNIT) {
        const head = this.rewrite(first);
        return { head, tail: this.rewrite(second) };
      }
      break;
    }
    const index = this.isTail(expr) ? manager.getNumeral(manager.getArg(expr, 1)) : undefined;
    if (index !== undefined) {
      const seq = manager.getArg(expr, 0);
      const next = this.mkInt(index + 1n);
      const head = mkNthUnit(seq, index + 1n);
      const tail = this.mkTail(seq, next);
      return { head: this.rewrite(head), tail };
    }
    const head = mkNthUnit(expr, 0);
    const tail = this.mkTail(expr, this.mkInt(0));
    return { head: this.rewrite(head), tail };
  }
}

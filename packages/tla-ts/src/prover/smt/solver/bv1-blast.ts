// Ported from Z3 (src/tactic/bv/bv1_blaster_tactic.h, src/ast/simplifiers/bv1_blaster.cpp), MIT
// license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_USER,
  OP_BXOR,
  OP_CONCAT,
  OP_EQ,
  OP_EXTRACT,
  OP_ITE,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import { runSimplifier } from "./dependent-expr-state";
import type { Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

// Z3 builds ill-sorted terms from a bit-vector operator other than =, extract, concat and bvxor.
const checkWidths = (first: number, second: number) => {
  if (first !== second)
    throw new SmtUnsupportedError("bv1-blast of operators other than =, extract and concat");
};

class Bv1BlasterRewriter extends RewriterTpl {
  private bit1: number;
  private bit0: number;
  private saved: RefVector;
  private savedDecls: number[] = [];
  readonly const2bits: ObjMap<number>;
  readonly newbits: number[] = [];

  constructor(manager: AstManager) {
    super(manager);
    this.bit1 = manager.mkBvNumeral(1n, 1);
    manager.incRef(this.bit1);
    this.bit0 = manager.mkBvNumeral(0n, 1);
    manager.incRef(this.bit0);
    this.saved = new RefVector(manager);
    this.const2bits = new ObjMap((decl) => manager.getDeclHash(decl));
  }

  private getBits(expr: number) {
    const manager = this.manager;
    return manager.getOp(expr) === OP_CONCAT ? manager.getArgs(expr) : [expr];
  }

  private mkConcat(bits: number[]) {
    return mkBvApp(this.manager, OP_CONCAT, bits);
  }

  private mkConst(decl: number) {
    const manager = this.manager;
    const existing = this.const2bits.get(decl);
    if (existing !== undefined) return existing;
    const range = manager.funcDecls[decl].range;
    const size = manager.getBvSize(range);
    if (size === 1) return manager.mkApp(decl, [], range);
    const bitSort = manager.mkBvSort(1);
    const bits: number[] = [];
    for (let index = 0; index < size; index++) {
      const bit = manager.mkFreshConst(null, bitSort);
      bits.push(bit);
      this.newbits.push(manager.decls[bit]);
      manager.incDeclRef(manager.decls[bit]);
      this.savedDecls.push(manager.decls[bit]);
    }
    const result = this.mkConcat(bits);
    this.saved.push(result);
    manager.incDeclRef(decl);
    this.savedDecls.push(decl);
    this.const2bits.set(decl, result);
    return result;
  }

  private blastBvTerm(term: number) {
    const manager = this.manager;
    const size = manager.getBvSize(manager.sorts[term]);
    if (size === 1) return term;
    const bits: number[] = [];
    for (let index = size - 1; index >= 0; index--)
      bits.push(mkBvApp(manager, OP_EXTRACT, [term], [index, index]));
    return this.mkConcat(bits);
  }

  private reduceEq(first: number, second: number) {
    const manager = this.manager;
    const firstBits = this.getBits(first);
    const secondBits = this.getBits(second);
    checkWidths(firstBits.length, secondBits.length);
    const eqs: number[] = [];
    for (let index = firstBits.length - 1; index >= 0; index--)
      eqs.push(manager.mkEq(firstBits[index], secondBits[index]));
    return manager.mkAnd(eqs);
  }

  private reduceIte(condition: number, thenExpr: number, elseExpr: number) {
    const manager = this.manager;
    const thenBits = this.getBits(thenExpr);
    const elseBits = this.getBits(elseExpr);
    checkWidths(thenBits.length, elseBits.length);
    return this.mkConcat(
      thenBits.map((thenBit, index) =>
        thenBit === elseBits[index]
          ? thenBit
          : manager.mkApp(OP_ITE, [condition, thenBit, elseBits[index]], manager.sorts[thenBit]),
      ),
    );
  }

  private reduceExtract(decl: number, arg: number) {
    const manager = this.manager;
    const bits = this.getBits(arg);
    const size = bits.length;
    checkWidths(size, manager.getBvSize(manager.sorts[arg]));
    const parameters = manager.funcDecls[decl].parameters;
    return this.mkConcat(bits.slice(size - 1 - parameters[0], size - parameters[1]));
  }

  private reduceBinXor(first: number, second: number) {
    const manager = this.manager;
    const firstBits = this.getBits(first);
    const secondBits = this.getBits(second);
    checkWidths(firstBits.length, secondBits.length);
    const bits: number[] = [];
    for (let index = 0; index < firstBits.length; index++) {
      const eq = manager.mkEq(firstBits[index], secondBits[index]);
      bits.push(manager.mkApp(OP_ITE, [eq, this.bit0, this.bit1], manager.sorts[this.bit0]));
    }
    return this.mkConcat(bits);
  }

  private reduceXor(args: number[]) {
    const manager = this.manager;
    let result = args.length === 1 ? args[0] : this.reduceBinXor(args[0], args[1]);
    manager.incRef(result);
    for (let index = 2; index < args.length; index++) {
      const next = this.reduceBinXor(result, args[index]);
      manager.incRef(next);
      manager.decRef(result);
      result = next;
    }
    return result;
  }

  getSubst(expr: number) {
    const manager = this.manager;
    if (!manager.isBvNumeral(expr)) return undefined;
    const value = manager.getBvNumeralValue(expr);
    const bits: number[] = [];
    for (let index = manager.getBvSize(manager.sorts[expr]) - 1; index >= 0; index--)
      bits.push((value >> BigInt(index)) & 1n ? this.bit1 : this.bit0);
    return this.mkConcat(bits);
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const funcDecl = this.manager.funcDecls[decl];
    if (funcDecl.family === FAMILY_BV && funcDecl.op === OP_BXOR) return this.reduceXor(args);
    const result = this.reduceAppCore(decl, args, sort);
    if (result !== -1) this.manager.incRef(result);
    return result;
  }

  private reduceAppCore(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    if (args.length === 0 && funcDecl.family === FAMILY_USER && manager.isBvSort(funcDecl.range))
      return this.mkConst(decl);
    if (funcDecl.family === FAMILY_BASIC && funcDecl.op === OP_EQ)
      return manager.isBvSort(manager.sorts[args[0]]) ? this.reduceEq(args[0], args[1]) : -1;
    if (funcDecl.family === FAMILY_BASIC && funcDecl.op === OP_ITE)
      return manager.isBvSort(manager.sorts[args[1]])
        ? this.reduceIte(args[0], args[1], args[2])
        : -1;
    if (funcDecl.family === FAMILY_BV)
      return funcDecl.op === OP_EXTRACT
        ? this.reduceExtract(decl, args[0])
        : funcDecl.op === OP_CONCAT
          ? this.mkConcat(args.flatMap((arg) => this.getBits(arg)))
          : -1;
    return manager.isBvSort(funcDecl.range)
      ? this.blastBvTerm(manager.mkApp(decl, args, sort))
      : -1;
  }

  releaseCfg() {
    const manager = this.manager;
    manager.decRef(this.bit0);
    manager.decRef(this.bit1);
    this.saved.reset();
    for (const decl of this.savedDecls) manager.decDeclRef(decl);
  }
}

export const runBv1Blast = (manager: AstManager) => (goal: Goal) => {
  runSimplifier(goal, false, (state) => {
    const rewriter = new Bv1BlasterRewriter(manager);
    return {
      reduce: () => {
        let rewritten = -1;
        state.forEachIndex((index) => {
          const form = state.get(index);
          const next = rewriter.rewrite(form);
          if (rewritten !== -1) manager.decRef(rewritten);
          rewritten = next;
          if (rewritten !== form) goal.update(index, rewritten);
        });
        if (rewritten !== -1) manager.decRef(rewritten);
        if (rewriter.newbits.length === 0) return;
        const definitions: Definition[] = rewriter.newbits.map((decl) => ({ decl, def: -1 }));
        for (const [decl, bits] of rewriter.const2bits) definitions.push({ decl, def: bits });
        goal.addDefinitions(definitions);
      },
      release: () => {
        rewriter.releaseCfg();
        rewriter.release();
      },
    };
  });
  return [goal];
};

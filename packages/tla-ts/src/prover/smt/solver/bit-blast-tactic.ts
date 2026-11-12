// Ported from Z3 (src/ast/rewriter/bit_blaster/bit_blaster_rewriter.cpp,
// src/tactic/bv/bit_blaster_tactic.cpp, src/tactic/bv/bit_blaster_model_converter.cpp), MIT
// license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_USER,
  getSymbolName,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_BADD,
  OP_BAND,
  OP_BASHR,
  OP_BIT2BOOL,
  OP_BLSHR,
  OP_BMUL,
  OP_BNOT,
  OP_BOR,
  OP_BREDAND,
  OP_BREDOR,
  OP_BSDIV,
  OP_BSDIV0,
  OP_BSDIV_I,
  OP_BSHL,
  OP_BSMOD,
  OP_BSMOD0,
  OP_BSMOD_I,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
  OP_BSREM,
  OP_BSREM0,
  OP_BSREM_I,
  OP_BUDIV,
  OP_BUDIV0,
  OP_BUDIV_I,
  OP_BUMUL_NO_OVFL,
  OP_BUREM,
  OP_BUREM0,
  OP_BUREM_I,
  OP_BXOR,
  OP_CONCAT,
  OP_EQ,
  OP_EXT_ROTATE_LEFT,
  OP_EXT_ROTATE_RIGHT,
  OP_EXTRACT,
  OP_INT2BV,
  OP_ITE,
  OP_MKBV,
  OP_SBV2INT,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_UBV2INT,
  OP_ULEQ,
  SORT_BOOL,
  type SmtSymbol,
} from "./ast";
import { BitBlaster } from "./bit-blaster";
import { mkBvApp } from "./bv-decl-plugin";
import { release } from "./expr-ref";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { FuncInterp, ProtoModel } from "./proto-model";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { type Rewrite, RewriterTpl, VarShifter } from "./rewriter-tpl";

export interface BitBlastParams {
  isBlastingMul: boolean;
  isBlastingAdd: boolean;
  isBlastingQuant: boolean;
  isBlastingFull: boolean;
}

type Bits = readonly number[];

interface BlastedConst {
  decl: number;
  bits: number;
}

export class BitBlasterRewriter extends RewriterTpl {
  private blaster: BitBlaster;
  private in1: RefVector;
  private in2: RefVector;
  private out: RefVector;
  private const2bits = new Map<number, number>();
  private quantBindings: RefVector;
  private quantShifts: number[] = [];
  readonly keys: number[] = [];
  readonly values: RefVector;
  readonly newbits: number[] = [];

  constructor(
    manager: AstManager,
    private params: BitBlastParams,
  ) {
    super(manager);
    this.blaster = new BitBlaster(manager, true);
    this.in1 = new RefVector(manager);
    this.in2 = new RefVector(manager);
    this.out = new RefVector(manager);
    this.quantBindings = new RefVector(manager);
    this.values = new RefVector(manager);
  }

  private getBits(expr: number, bits: RefVector) {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_MKBV) {
      for (const arg of manager.getArgs(expr)) bits.push(arg);
      return;
    }
    const size = manager.getBvSize(manager.sorts[expr]);
    for (let index = 0; index < size; index++)
      bits.push(mkBvApp(manager, OP_BIT2BOOL, [expr], [index]));
  }

  private mkMkbv(bits: Bits) {
    const result = mkBvApp(this.manager, OP_MKBV, [...bits]);
    this.manager.incRef(result);
    return result;
  }

  private mkConst(decl: number) {
    const manager = this.manager;
    const existing = this.const2bits.get(decl);
    if (existing !== undefined) {
      manager.incRef(existing);
      return existing;
    }
    const size = manager.getBvSize(manager.funcDecls[decl].range);
    this.out.reset();
    for (let index = 0; index < size; index++) {
      const bit = manager.mkFreshConst(null, SORT_BOOL);
      this.out.push(bit);
      this.newbits.push(manager.decls[bit]);
      manager.incDeclRef(manager.decls[bit]);
    }
    const result = this.mkMkbv(this.out.items);
    this.const2bits.set(decl, result);
    this.keys.push(decl);
    manager.incDeclRef(decl);
    this.values.push(result);
    return result;
  }

  private reduceUnary(arg: number, blast: (bits: Bits, out: number[]) => void) {
    this.in1.reset();
    this.getBits(arg, this.in1);
    this.out.reset();
    blast(this.in1.items, this.out.items);
    return this.mkMkbv(this.out.items);
  }

  private reduceBinary(
    first: number,
    second: number,
    blast: (firstBits: Bits, secondBits: Bits, out: number[]) => void,
  ) {
    this.in1.reset();
    this.in2.reset();
    this.getBits(first, this.in1);
    this.getBits(second, this.in2);
    this.out.reset();
    blast(this.in1.items, this.in2.items, this.out.items);
    return this.mkMkbv(this.out.items);
  }

  private reduceAc(
    args: number[],
    blast: (firstBits: Bits, secondBits: Bits, out: number[]) => void,
  ) {
    const manager = this.manager;
    let result = args[0];
    manager.incRef(result);
    let newResult = -1;
    for (let index = 1; index < args.length; index++) {
      const next = this.reduceBinary(result, args[index], blast);
      release(manager, newResult);
      newResult = next;
      manager.incRef(newResult);
      manager.decRef(result);
      result = newResult;
    }
    release(manager, newResult);
    return result;
  }

  private reducePredicate(
    first: number,
    second: number,
    blast: (firstBits: Bits, secondBits: Bits) => number,
  ) {
    this.in1.reset();
    this.in2.reset();
    this.getBits(first, this.in1);
    this.getBits(second, this.in2);
    return blast(this.in1.items, this.in2.items);
  }

  private reduceConcat(args: number[]) {
    this.out.reset();
    for (let index = args.length - 1; index >= 0; index--) {
      this.in1.reset();
      this.getBits(args[index], this.in1);
      for (const bit of this.in1.items) this.out.push(bit);
    }
    return this.mkMkbv(this.out.items);
  }

  private reduceExtract(start: number, end: number, arg: number) {
    this.in1.reset();
    this.getBits(arg, this.in1);
    this.out.reset();
    for (let index = start; index <= end; index++) this.out.push(this.in1.items[index]);
    return this.mkMkbv(this.out.items);
  }

  private blastBvTerm(term: number) {
    const manager = this.manager;
    const size = manager.getBvSize(manager.sorts[term]);
    const bits: number[] = [];
    for (let index = 0; index < size; index++)
      bits.push(mkBvApp(manager, OP_BIT2BOOL, [term], [index]));
    return this.mkMkbv(bits);
  }

  private throwUnsupported(decl: number): never {
    throw new SmtTacticError(
      `operator ${this.manager.funcDecls[decl].name} is not supported, you must simplify the goal before applying bit-blasting`,
    );
  }

  // A numeral's declaration carries no value here, so reduce_num substitutes the numeral.
  getSubst(expr: number) {
    const manager = this.manager;
    if (!manager.isBvNumeral(expr)) return undefined;
    this.out.reset();
    this.blaster.num2bits(
      manager.getBvNumeralValue(expr),
      manager.getBvSize(manager.sorts[expr]),
      this.out.items,
    );
    return mkBvApp(manager, OP_MKBV, [...this.out.items]);
  }

  reduceApp(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    const blaster = this.blaster;
    const params = this.params;
    if (args.length === 0 && funcDecl.family === FAMILY_USER && manager.isBvSort(funcDecl.range))
      return this.mkConst(decl);
    if (funcDecl.family === FAMILY_BASIC && funcDecl.op === OP_EQ)
      return manager.isBvSort(manager.sorts[args[0]])
        ? this.reducePredicate(args[0], args[1], (first, second) => blaster.mkEq(first, second))
        : -1;
    if (funcDecl.family === FAMILY_BASIC && funcDecl.op === OP_ITE) {
      if (!manager.isBvSort(manager.sorts[args[1]])) return -1;
      this.in1.reset();
      this.in2.reset();
      this.getBits(args[1], this.in1);
      this.getBits(args[2], this.in2);
      this.out.reset();
      blaster.mkMultiplexer(args[0], this.in1.items, this.in2.items, this.out.items);
      return this.mkMkbv(this.out.items);
    }
    if (funcDecl.family === FAMILY_BV)
      switch (funcDecl.op) {
        case OP_BADD:
          return params.isBlastingAdd
            ? this.reduceAc(args, (first, second, out) => blaster.mkAdder(first, second, out))
            : -1;
        case OP_BMUL:
          return params.isBlastingMul
            ? this.reduceAc(args, (first, second, out) => blaster.mkMultiplier(first, second, out))
            : -1;
        case OP_BSDIV:
        case OP_BUDIV:
        case OP_BSREM:
        case OP_BUREM:
        case OP_BSMOD:
          if (params.isBlastingMul) this.throwUnsupported(decl);
          return -1;
        case OP_BSDIV0:
        case OP_BUDIV0:
        case OP_BSREM0:
        case OP_BUREM0:
        case OP_BSMOD0:
          return -1;
        case OP_BSDIV_I:
          return params.isBlastingMul
            ? this.reduceBinary(args[0], args[1], (first, second, out) =>
                blaster.mkSdiv(first, second, out),
              )
            : -1;
        case OP_BUDIV_I:
          return params.isBlastingMul
            ? this.reduceBinary(args[0], args[1], (first, second, out) =>
                blaster.mkUdiv(first, second, out),
              )
            : -1;
        case OP_BSREM_I:
          return params.isBlastingMul
            ? this.reduceBinary(args[0], args[1], (first, second, out) =>
                blaster.mkSrem(first, second, out),
              )
            : -1;
        case OP_BUREM_I:
          return params.isBlastingMul
            ? this.reduceBinary(args[0], args[1], (first, second, out) =>
                blaster.mkUrem(first, second, out),
              )
            : -1;
        case OP_BSMOD_I:
          return params.isBlastingMul
            ? this.reduceBinary(args[0], args[1], (first, second, out) =>
                blaster.mkSmod(first, second, out),
              )
            : -1;
        case OP_ULEQ:
          return this.reducePredicate(args[0], args[1], (first, second) =>
            blaster.mkUle(first, second),
          );
        case OP_SLEQ:
          return this.reducePredicate(args[0], args[1], (first, second) =>
            blaster.mkSle(first, second),
          );
        case OP_BAND:
          return this.reduceAc(args, (first, second, out) => blaster.mkAndBits(first, second, out));
        case OP_BOR:
          return this.reduceAc(args, (first, second, out) => blaster.mkOrBits(first, second, out));
        case OP_BNOT:
          return this.reduceUnary(args[0], (bits, out) => blaster.mkNotBits(bits, out));
        case OP_BXOR:
          return this.reduceAc(args, (first, second, out) => blaster.mkXorBits(first, second, out));
        case OP_CONCAT:
          return this.reduceConcat(args);
        case OP_SIGN_EXT:
          return this.reduceUnary(args[0], (bits, out) =>
            blaster.mkSignExtend(bits, funcDecl.parameters[0], out),
          );
        case OP_EXTRACT:
          return this.reduceExtract(funcDecl.parameters[1], funcDecl.parameters[0], args[0]);
        case OP_BREDOR:
          return this.reduceUnary(args[0], (bits, out) => blaster.mkRedor(bits, out));
        case OP_BREDAND:
          return this.reduceUnary(args[0], (bits, out) => blaster.mkRedand(bits, out));
        case OP_BSHL:
          return this.reduceBinary(args[0], args[1], (first, second, out) =>
            blaster.mkShl(first, second, out),
          );
        case OP_BLSHR:
          return this.reduceBinary(args[0], args[1], (first, second, out) =>
            blaster.mkLshr(first, second, out),
          );
        case OP_BASHR:
          return this.reduceBinary(args[0], args[1], (first, second, out) =>
            blaster.mkAshr(first, second, out),
          );
        case OP_EXT_ROTATE_LEFT:
          return this.reduceBinary(args[0], args[1], (first, second, out) =>
            blaster.mkExtRotateLeft(first, second, out),
          );
        case OP_EXT_ROTATE_RIGHT:
          return this.reduceBinary(args[0], args[1], (first, second, out) =>
            blaster.mkExtRotateRight(first, second, out),
          );
        case OP_BUMUL_NO_OVFL:
          return this.reducePredicate(args[0], args[1], (first, second) =>
            blaster.mkUmulNoOverflow(first, second),
          );
        case OP_BSMUL_NO_OVFL:
          return this.reducePredicate(args[0], args[1], (first, second) =>
            blaster.mkSmulNoOverflow(first, second),
          );
        case OP_BSMUL_NO_UDFL:
          return this.reducePredicate(args[0], args[1], (first, second) =>
            blaster.mkSmulNoUnderflow(first, second),
          );
        case OP_BIT2BOOL:
        case OP_MKBV:
        case OP_INT2BV:
        case OP_UBV2INT:
        case OP_SBV2INT:
          return -1;
        default: {
          const term = manager.mkApp(decl, args, sort);
          manager.incRef(term);
          const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
          const result = rewriter.rewrite(term);
          rewriter.release();
          manager.decRef(term);
          if (manager.kinds[result] !== KIND_APP || manager.decls[result] !== decl)
            return { expr: result, depth: Infinity };
          manager.decRef(result);
          this.throwUnsupported(decl);
        }
      }
    if (params.isBlastingFull && manager.isBvSort(funcDecl.range))
      return this.blastBvTerm(manager.mkApp(decl, args, sort));
    return -1;
  }

  preVisit(expr: number) {
    const manager = this.manager;
    if (!this.params.isBlastingQuant || manager.kinds[expr] !== KIND_QUANTIFIER) return true;
    const sorts = manager.getQuantifier(expr).sorts;
    const bindings: number[] = [];
    let next = 0;
    for (let index = sorts.length - 1; index >= 0; index--) {
      const sort = sorts[index];
      if (!manager.isBvSort(sort)) {
        bindings.push(manager.mkVar(next++, sort));
        continue;
      }
      const bits: number[] = [];
      for (let bit = 0; bit < manager.getBvSize(sort); bit++)
        bits.push(manager.mkVar(next++, SORT_BOOL));
      bindings.push(mkBvApp(manager, OP_MKBV, bits));
    }
    const shift =
      next + (this.quantShifts.length === 0 ? 0 : this.quantShifts[this.quantShifts.length - 1]);
    for (let index = bindings.length - 1; index >= 0; index--) {
      this.quantBindings.push(bindings[index]);
      this.quantShifts.push(shift);
    }
    return true;
  }

  reduceVar(variable: number) {
    const manager = this.manager;
    const sort = manager.sorts[variable];
    if (this.params.isBlastingQuant) {
      const size = this.quantBindings.size;
      if (size === 0 || !manager.isBvSort(sort)) return -1;
      const index = manager.values[variable];
      const shift = this.quantShifts[this.quantShifts.length - 1];
      if (index >= size) {
        if (shift === 0) return -1;
        const result = manager.mkVar(index + shift, sort);
        manager.incRef(result);
        return result;
      }
      const offset = size - index - 1;
      const binding = this.quantBindings.items[offset];
      const amount = shift - this.quantShifts[offset];
      if (amount === 0) {
        manager.incRef(binding);
        return binding;
      }
      const shifter = new VarShifter(manager);
      const result = shifter.shift(binding, 0, amount, 0);
      shifter.release();
      return result;
    }
    return this.params.isBlastingFull && manager.isBvSort(sort) ? this.blastBvTerm(variable) : -1;
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    if (!this.params.isBlastingQuant) return -1;
    const data = manager.getQuantifier(expr);
    const sorts: number[] = [];
    const names: SmtSymbol[] = [];
    for (let index = 0; index < data.sorts.length; index++) {
      const sort = data.sorts[index];
      if (!manager.isBvSort(sort)) {
        sorts.push(sort);
        names.push(data.names[index]);
        continue;
      }
      for (let bit = 0; bit < manager.getBvSize(sort); bit++) {
        sorts.push(SORT_BOOL);
        names.push(`${getSymbolName(data.names[index])}.${bit}`);
      }
    }
    const result = manager.mkQuantifier({ ...data, sorts, names, body, patterns, noPatterns: [] });
    manager.incRef(result);
    const size = this.quantBindings.size - data.sorts.length;
    this.quantBindings.shrink(size);
    this.quantShifts.length = size;
    return result;
  }

  // ~blaster_rewriter_cfg, after the tactic's cleanup of the rewriter.
  releaseCfg() {
    const manager = this.manager;
    for (const decl of this.newbits) manager.decDeclRef(decl);
    this.values.reset();
    for (const decl of this.keys) manager.decDeclRef(decl);
    this.quantBindings.reset();
    this.out.reset();
    this.in2.reset();
    this.in1.reset();
  }
}

const convertModel = (manager: AstManager, consts: BlastedConst[], source: ProtoModel) => {
  const target = new ProtoModel(manager).mkModel();
  const bitDecls = new Set<number>();
  for (const blasted of consts)
    for (const bit of manager.getArgs(blasted.bits)) bitDecls.add(manager.decls[bit]);
  for (const decl of source.getConstDecls())
    if (!bitDecls.has(decl)) target.registerConst(decl, source.constInterps.get(decl) as number);
  for (const entry of source.funcInterps) {
    const copied = new FuncInterp(manager, entry[1].arity);
    for (const funcEntry of entry[1].entries)
      copied.insertNewEntry(funcEntry.args, funcEntry.result);
    if (entry[1].elseExpr !== null) copied.setElse(entry[1].elseExpr);
    target.registerFunc(entry[0], copied);
  }
  for (const sort of source.getUninterpretedSorts())
    for (const value of source.getKnownUniverse(sort)) target.registerValue(value);
  for (const blasted of consts) {
    const existing = source.constInterps.get(blasted.decl);
    if (existing !== undefined) {
      target.registerConst(blasted.decl, existing);
      continue;
    }
    const bits = manager.getArgs(blasted.bits);
    const values = bits.map((bit) => source.constInterps.get(manager.decls[bit]));
    const isBool = values.every(
      (value) => value === undefined || manager.isTrue(value) || manager.isFalse(value),
    );
    if (!isBool) {
      target.registerConst(
        blasted.decl,
        mkBvApp(
          manager,
          OP_MKBV,
          values.map((value) => value ?? manager.falseExpr),
        ),
      );
      continue;
    }
    let value = 0n;
    for (let index = bits.length - 1; index >= 0; index--)
      value = value * 2n + (values[index] === manager.trueExpr ? 1n : 0n);
    target.registerConst(blasted.decl, manager.mkBvNumeral(value, bits.length));
  }
  return target;
};

export const runBitBlast = (manager: AstManager, params: BitBlastParams) => (goal: Goal) => {
  if (goal.isProofsEnabled && params.isBlastingQuant)
    throw new SmtTacticError("quantified variable blasting does not support proof generation");
  const rewriter = new BitBlasterRewriter(manager, params);
  let rewritten = -1;
  let isChanged = false;
  const size = goal.forms.size;
  for (let index = 0; index < size && !goal.isInconsistent; index++) {
    const form = goal.forms.items[index];
    const next = rewriter.rewrite(form);
    release(manager, rewritten);
    rewritten = next;
    if (form === rewritten) continue;
    isChanged = true;
    goal.update(index, rewritten);
  }
  if (isChanged && rewriter.keys.length > 0) {
    const const2bits = new ObjMap<number>((decl) => manager.getDeclHash(decl));
    for (let index = 0; index < rewriter.keys.length; index++)
      const2bits.set(rewriter.keys[index], rewriter.values.items[index]);
    const consts: BlastedConst[] = [];
    for (const entry of const2bits) {
      manager.incDeclRef(entry[0]);
      manager.incRef(entry[1]);
      consts.push({ decl: entry[0], bits: entry[1] });
    }
    for (const decl of rewriter.newbits) manager.incDeclRef(decl);
    goal.addModelConversion((model) => convertModel(manager, consts, model));
  }
  goal.depth++;
  rewriter.cleanup();
  release(manager, rewritten);
  rewriter.releaseCfg();
  rewriter.release();
  return [goal];
};

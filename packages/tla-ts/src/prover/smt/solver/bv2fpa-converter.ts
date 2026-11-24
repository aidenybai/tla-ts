import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_FPA,
  KIND_APP,
  OP_EXTRACT,
  OP_FPA_MAX_I,
  OP_FPA_MIN,
  OP_FPA_MIN_I,
  OP_FPA_TO_IEEE_BV,
  OP_FPA_TO_IEEE_BV_I,
  OP_FPA_TO_REAL,
  OP_FPA_TO_REAL_I,
  OP_FPA_TO_SBV,
  OP_FPA_TO_SBV_I,
  OP_FPA_TO_UBV,
  OP_FPA_TO_UBV_I,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import {
  BV_RM_TO_ZERO,
  getFpaSignature,
  getFpNumeral,
  getRmNumeral,
  isConsideredUninterpreted,
  mkFpNumeral,
  mkFpNumeralOfBits,
  mkRmNumeral,
} from "./fpa-decl-plugin";
import { type ObjHashtable, ObjMap } from "./hashtable";
import { mkZero } from "./mpf";
import { FuncInterp, type ProtoModel } from "./proto-model";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

const UNSPECIFIED_ELSE_OPS = new Map([
  [OP_FPA_TO_SBV, OP_FPA_TO_SBV_I],
  [OP_FPA_TO_UBV, OP_FPA_TO_UBV_I],
  [OP_FPA_TO_REAL, OP_FPA_TO_REAL_I],
  [OP_FPA_TO_IEEE_BV, OP_FPA_TO_IEEE_BV_I],
]);

export interface Bv2FpaMaps {
  readonly constants: ObjMap<number>;
  readonly rmConstants: ObjMap<number>;
  readonly minMaxUfs: ObjMap<[number, number]>;
  readonly uf2BvUf: ObjMap<number>;
}

export const releaseBv2FpaMaps = (manager: AstManager, maps: Bv2FpaMaps) => {
  for (const entry of [...maps.constants, ...maps.rmConstants]) {
    manager.decDeclRef(entry[0]);
    manager.decRef(entry[1]);
  }
  for (const entry of maps.uf2BvUf) {
    manager.decDeclRef(entry[0]);
    manager.decDeclRef(entry[1]);
  }
  for (const entry of maps.minMaxUfs) {
    manager.decDeclRef(entry[0]);
    manager.decRef(entry[1][0]);
    manager.decRef(entry[1][1]);
  }
  maps.constants.clear();
  maps.rmConstants.clear();
  maps.minMaxUfs.clear();
  maps.uf2BvUf.clear();
};

const evalDecl = (model: ProtoModel, decl: number) =>
  model.manager.funcDecls[decl].domain.length === 0
    ? model.constInterps.get(decl)
    : (model.funcInterps.get(decl)?.getInterp() ?? undefined);

const mkFpaDeclOf = (model: ProtoModel, op: number, parameters: number[], domain: number[]) => {
  const manager = model.manager;
  const signature = getFpaSignature(manager, op, parameters, domain);
  if (typeof signature === "string") throw new SmtInvariantError(signature);
  return manager.mkFpaDecl(
    signature.op,
    signature.name,
    signature.parameters,
    signature.domain,
    signature.range,
  );
};

export class Bv2FpaConverter implements Bv2FpaMaps {
  private readonly rewriter: Rewriter;
  readonly constants: ObjMap<number>;
  readonly rmConstants: ObjMap<number>;
  readonly uf2BvUf: ObjMap<number>;
  readonly minMaxUfs: ObjMap<[number, number]>;

  constructor(
    private readonly manager: AstManager,
    converter: Bv2FpaMaps,
  ) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    const getHash = (decl: number) => manager.getDeclHash(decl);
    this.constants = new ObjMap(getHash);
    this.rmConstants = new ObjMap(getHash);
    this.uf2BvUf = new ObjMap(getHash);
    this.minMaxUfs = new ObjMap(getHash);
    for (const [decl, value] of converter.constants) {
      this.constants.set(decl, value);
      manager.incDeclRef(decl);
      manager.incRef(value);
    }
    for (const [decl, value] of converter.rmConstants) {
      this.rmConstants.set(decl, value);
      manager.incDeclRef(decl);
      manager.incRef(value);
    }
    for (const [decl, bvDecl] of converter.uf2BvUf) {
      this.uf2BvUf.set(decl, bvDecl);
      manager.incDeclRef(decl);
      manager.incDeclRef(bvDecl);
    }
    for (const [decl, specials] of converter.minMaxUfs) {
      this.minMaxUfs.set(decl, specials);
      manager.incDeclRef(decl);
      manager.incRef(specials[0]);
      manager.incRef(specials[1]);
    }
  }

  release() {
    releaseBv2FpaMaps(this.manager, this);
    this.rewriter.release();
  }

  private convertBv2Fp(sort: number, sgn: number, exp: number, sig: number) {
    const manager = this.manager;
    const getValue = (expr: number) =>
      manager.isBvNumeral(expr) ? manager.getBvNumeralValue(expr) : 0n;
    const sbits = BigInt(manager.getSbits(sort));
    const bits =
      (getValue(sgn) << (BigInt(manager.getEbits(sort)) + sbits - 1n)) |
      (getValue(exp) << (sbits - 1n)) |
      getValue(sig);
    const result = mkFpNumeralOfBits(manager, sort, bits);
    manager.incRef(result);
    return result;
  }

  private convertBv2FpOfModel(model: ProtoModel, sort: number, bv: number) {
    const manager = this.manager;
    const sbits = manager.getSbits(sort);
    const size = manager.getEbits(sort) + sbits;
    const bvNum =
      manager.isBvNumeral(bv) || manager.kinds[bv] !== KIND_APP
        ? bv
        : (evalDecl(model, manager.decls[bv]) ??
          manager.mkBvNumeral(0n, manager.getBvSize(manager.sorts[bv])));
    manager.incRef(bvNum);
    const sgn = mkBvApp(manager, OP_EXTRACT, [bvNum], [size - 1, size - 1]);
    manager.incRef(sgn);
    const exp = mkBvApp(manager, OP_EXTRACT, [bvNum], [size - 2, sbits - 1]);
    manager.incRef(exp);
    const sig = mkBvApp(manager, OP_EXTRACT, [bvNum], [sbits - 2, 0]);
    manager.incRef(sig);
    const sgnValue = this.rewriter.rewrite(sgn);
    const expValue = this.rewriter.rewrite(exp);
    const sigValue = this.rewriter.rewrite(sig);
    const result = this.convertBv2Fp(sort, sgnValue, expValue, sigValue);
    for (const expr of [sigValue, expValue, sgnValue, sig, exp, sgn, bvNum]) manager.decRef(expr);
    return result;
  }

  private convertBv2Rm(bvRm: number) {
    const manager = this.manager;
    if (!manager.isBvNumeral(bvRm))
      throw new SmtUnsupportedError("a rounding mode whose model value is not a numeral");
    const value = manager.getBvNumeralValue(bvRm);
    const result = mkRmNumeral(manager, value <= 3n ? Number(value) : BV_RM_TO_ZERO);
    manager.incRef(result);
    return result;
  }

  private convertBv2RmOfModel(model: ProtoModel, value: number) {
    const manager = this.manager;
    if (manager.isBvNumeral(value)) return this.convertBv2Rm(value);
    const evaluated =
      manager.kinds[value] === KIND_APP ? evalDecl(model, manager.decls[value]) : undefined;
    if (evaluated !== undefined) return this.convertBv2Rm(evaluated);
    const result = mkRmNumeral(manager, BV_RM_TO_ZERO);
    manager.incRef(result);
    return result;
  }

  private rebuildFloats(model: ProtoModel, sort: number, expr: number): number {
    const manager = this.manager;
    const isFp = manager.isFpSort(sort);
    const isRm = manager.isRmSort(sort);
    if (isFp && getFpNumeral(manager, expr) === undefined)
      return this.convertBv2FpOfModel(model, sort, expr);
    if (isRm && getRmNumeral(manager, expr) === undefined)
      return this.convertBv2RmOfModel(model, expr);
    if (isFp || isRm || manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) {
      manager.incRef(expr);
      return expr;
    }
    const args = manager.mapArgs(expr, (arg) => this.rebuildFloats(model, manager.sorts[arg], arg));
    const result = manager.mkApp(manager.decls[expr], args, sort);
    manager.incRef(result);
    for (const arg of args) manager.decRef(arg);
    return result;
  }

  private rewriteRebuilt(model: ProtoModel, sort: number, expr: number) {
    const rebuilt = this.rebuildFloats(model, sort, expr);
    const rewritten = this.rewriter.rewrite(rebuilt);
    this.manager.decRef(rebuilt);
    return rewritten;
  }

  private convertFuncInterp(model: ProtoModel, decl: number, bvDecl: number) {
    const manager = this.manager;
    const info = manager.funcDecls[decl];
    const result = new FuncInterp(manager, manager.funcDecls[bvDecl].domain.length);
    const bvInterp = model.funcInterps.get(bvDecl);
    if (bvInterp === undefined) return result;
    for (const entry of bvInterp.entries) {
      const args = entry.args.map((arg, index) =>
        this.rewriteRebuilt(model, info.domain[index], arg),
      );
      const bvResult = entry.result;
      manager.incRef(bvResult);
      const value = this.rewriteRebuilt(model, info.range, bvResult);
      const existing = result.getEntry(args);
      if (existing === undefined) {
        if (info.family !== FAMILY_FPA || isConsideredUninterpreted(manager, decl, args))
          result.insertNewEntry(args, value);
      } else if (manager.isFpSort(info.range) && value !== existing.result)
        throw new SmtUnsupportedError("floating-point function entries that disagree");
      manager.decRef(value);
      manager.decRef(bvResult);
      for (const arg of args) manager.decRef(arg);
    }
    const vars = info.domain.map((sort, index) => manager.mkVar(index, sort));
    for (const variable of vars) manager.incRef(variable);
    const elseOp = UNSPECIFIED_ELSE_OPS.get(info.op);
    if (elseOp !== undefined) {
      const elseDecl = mkFpaDeclOf(model, elseOp, info.parameters, info.domain);
      const elseValue = manager.mkApp(elseDecl, vars, info.range);
      manager.incRef(elseValue);
      result.setElse(elseValue);
      manager.decRef(elseValue);
    } else if (bvInterp.elseExpr !== null) {
      const elseValue = this.rewriteRebuilt(model, info.range, bvInterp.elseExpr);
      result.setElse(elseValue);
      manager.decRef(elseValue);
    }
    for (const variable of vars) manager.decRef(variable);
    return result;
  }

  convertConsts(model: ProtoModel, target: ProtoModel, seen: ObjHashtable) {
    const manager = this.manager;
    for (const [decl, value] of this.constants) {
      const sort = manager.funcDecls[decl].range;
      const ebits = manager.getEbits(sort);
      const sbits = manager.getSbits(sort);
      const bvConst = manager.getArg(manager.getArg(value, 0), 0);
      const bv = model.constInterps.get(manager.decls[bvConst]);
      const size = bv === undefined ? 0 : manager.getBvSize(manager.sorts[bv]);
      const parts =
        bv === undefined
          ? [1, ebits, sbits - 1].map((width) => manager.mkBvNumeral(0n, width))
          : [
              [size - 1, size - 1],
              [size - 2, sbits - 1],
              [sbits - 2, 0],
            ].map((bounds) => mkBvApp(manager, OP_EXTRACT, [bv], bounds));
      for (const part of parts) manager.incRef(part);
      const values = parts.map((part) => this.rewriter.rewrite(part));
      seen.add(manager.decls[bvConst]);
      const converted = this.convertBv2Fp(sort, values[0], values[1], values[2]);
      target.registerConst(decl, converted);
      manager.decRef(converted);
      for (const expr of [...values.reverse(), ...parts.reverse()]) manager.decRef(expr);
    }
  }

  convertRmConsts(model: ProtoModel, target: ProtoModel, seen: ObjHashtable) {
    const manager = this.manager;
    for (const [decl, value] of this.rmConstants) {
      const bvValue = manager.getArg(value, 0);
      const converted = this.convertBv2RmOfModel(model, bvValue);
      target.registerConst(decl, converted);
      seen.add(manager.decls[bvValue]);
      manager.decRef(converted);
    }
  }

  convertMinMaxSpecials(model: ProtoModel, target: ProtoModel, seen: ObjHashtable) {
    const manager = this.manager;
    for (const [decl, specials] of this.minMaxUfs) {
      const info = manager.funcDecls[decl];
      const sort = info.range;
      const ebits = manager.getEbits(sort);
      const sbits = manager.getSbits(sort);
      const pzero = mkFpNumeral(manager, mkZero(ebits, sbits, false));
      manager.incRef(pzero);
      const nzero = mkFpNumeral(manager, mkZero(ebits, sbits, true));
      manager.incRef(nzero);
      const values = specials.map((special) => {
        const evaluated = evalDecl(model, manager.decls[special]) ?? manager.mkBvNumeral(0n, 1);
        manager.incRef(evaluated);
        return evaluated;
      });
      seen.add(manager.decls[specials[0]]);
      seen.add(manager.decls[specials[1]]);
      const interp = new FuncInterp(manager, info.domain.length);
      const isNegativeZero = values.map((evaluated) => manager.getBvNumeralValue(evaluated) === 1n);
      interp.insertNewEntry([pzero, nzero], isNegativeZero[0] ? nzero : pzero);
      interp.insertNewEntry([nzero, pzero], isNegativeZero[1] ? nzero : pzero);
      const minMax = mkFpaDeclOf(
        model,
        info.op === OP_FPA_MIN ? OP_FPA_MIN_I : OP_FPA_MAX_I,
        [],
        [sort, sort],
      );
      const firstVar = manager.mkVar(0, sort);
      manager.incRef(firstVar);
      const secondVar = manager.mkVar(1, sort);
      manager.incRef(secondVar);
      const elseValue = manager.mkApp(minMax, [firstVar, secondVar], sort);
      manager.incRef(elseValue);
      interp.setElse(elseValue);
      target.registerFunc(decl, interp);
      for (const expr of [elseValue, secondVar, firstVar, values[1], values[0], nzero, pzero])
        manager.decRef(expr);
    }
  }

  convertUf2BvUf(model: ProtoModel, target: ProtoModel, seen: ObjHashtable) {
    const manager = this.manager;
    for (const [decl, bvDecl] of this.uf2BvUf) {
      seen.add(bvDecl);
      const info = manager.funcDecls[decl];
      if (info.domain.length === 0) {
        if (manager.isArraySort(info.range))
          throw new SmtUnsupportedError("models of floating-point array constants");
        const value = evalDecl(model, bvDecl);
        if (value !== undefined) target.registerConst(decl, value);
      } else if (info.family === FAMILY_FPA) {
        const interp = this.convertFuncInterp(model, decl, bvDecl);
        if (interp.entries.length > 0 || interp.elseExpr !== null)
          target.registerFunc(decl, interp);
        else interp.release();
      }
    }
  }
}

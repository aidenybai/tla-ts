// Ported from Z3 (src/ast/fpa/bv2fpa_converter.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import {
  FAMILY_FPA,
  KIND_APP,
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
import type { Fpa2BvConverter } from "./fpa2bv-converter";
import type { ObjHashtable } from "./hashtable";
import { mkZero } from "./mpf";
import { FuncInterp, type ProtoModel } from "./proto-model";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

const UNSPECIFIED_ELSE_OPS = new Map([
  [OP_FPA_TO_SBV, OP_FPA_TO_SBV_I],
  [OP_FPA_TO_UBV, OP_FPA_TO_UBV_I],
  [OP_FPA_TO_REAL, OP_FPA_TO_REAL_I],
  [OP_FPA_TO_IEEE_BV, OP_FPA_TO_IEEE_BV_I],
]);

const getConstValue = (model: ProtoModel, expr: number) =>
  model.constInterps.get(model.manager.decls[expr]);

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

export const convertMinMaxSpecials = (
  converter: Fpa2BvConverter,
  source: ProtoModel,
  target: ProtoModel,
  seen: ObjHashtable,
) => {
  const manager = source.manager;
  for (const entry of converter.minMaxUfs) {
    const info = manager.funcDecls[entry[0]];
    const sort = info.range;
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const pzero = mkFpNumeral(manager, mkZero(ebits, sbits, false));
    const nzero = mkFpNumeral(manager, mkZero(ebits, sbits, true));
    const isNegativeZero = entry[1].map((special) => {
      const value = getConstValue(source, special);
      seen.add(manager.decls[special]);
      return value !== undefined && manager.getBvNumeralValue(value) === 1n;
    });
    const interp = new FuncInterp(manager, info.domain.length);
    interp.insertNewEntry([pzero, nzero], isNegativeZero[0] ? nzero : pzero);
    interp.insertNewEntry([nzero, pzero], isNegativeZero[1] ? nzero : pzero);
    const minMax = mkFpaDeclOf(
      source,
      info.op === OP_FPA_MIN ? OP_FPA_MIN_I : OP_FPA_MAX_I,
      [],
      [sort, sort],
    );
    interp.setElse(manager.mkApp(minMax, [manager.mkVar(0, sort), manager.mkVar(1, sort)], sort));
    target.registerFunc(entry[0], interp);
  }
};

const rebuildFloats = (model: ProtoModel, sort: number, expr: number): number => {
  const manager = model.manager;
  if (manager.isFpSort(sort)) {
    if (getFpNumeral(manager, expr) !== undefined) return expr;
    const value = manager.isBvNumeral(expr) ? expr : getConstValue(model, expr);
    return mkFpNumeralOfBits(
      manager,
      sort,
      value === undefined ? 0n : manager.getBvNumeralValue(value),
    );
  }
  if (manager.isRmSort(sort)) {
    if (getRmNumeral(manager, expr) !== undefined) return expr;
    const value = manager.isBvNumeral(expr) ? expr : getConstValue(model, expr);
    const rm = value === undefined ? BV_RM_TO_ZERO : Number(manager.getBvNumeralValue(value));
    return mkRmNumeral(manager, rm <= 4 ? rm : BV_RM_TO_ZERO);
  }
  if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) return expr;
  const args = manager.mapArgs(expr, (arg) => rebuildFloats(model, manager.sorts[arg], arg));
  return manager.mkApp(manager.decls[expr], args, sort);
};

const convertFuncInterp = (model: ProtoModel, rewriter: Rewriter, decl: number, bvDecl: number) => {
  const manager = model.manager;
  const info = manager.funcDecls[decl];
  const arity = manager.funcDecls[bvDecl].domain.length;
  const result = new FuncInterp(manager, arity);
  const bvInterp = model.funcInterps.get(bvDecl);
  if (bvInterp === undefined) return result;
  const rebuild = (sort: number, expr: number) => {
    const rewritten = rewriter.rewrite(rebuildFloats(model, sort, expr));
    manager.releaseLater(rewritten);
    return rewritten;
  };
  for (const entry of bvInterp.entries) {
    const args = entry.args.map((arg, index) => rebuild(info.domain[index], arg));
    const value = rebuild(info.range, entry.result);
    const existing = result.getEntry(args);
    if (existing === undefined) {
      if (info.family !== FAMILY_FPA || isConsideredUninterpreted(manager, decl, args))
        result.insertNewEntry(args, value);
    } else if (manager.isFpSort(info.range) && value !== existing.result)
      throw new SmtUnsupportedError("floating-point function entries that disagree");
  }
  const elseOp = UNSPECIFIED_ELSE_OPS.get(info.op);
  if (elseOp !== undefined) {
    const vars = info.domain.map((sort, index) => manager.mkVar(index, sort));
    const elseDecl = mkFpaDeclOf(model, elseOp, info.parameters, info.domain);
    result.setElse(manager.mkApp(elseDecl, vars, info.range));
  } else if (bvInterp.elseExpr !== null) result.setElse(rebuild(info.range, bvInterp.elseExpr));
  return result;
};

export const convertUf2BvUf = (
  converter: Fpa2BvConverter,
  source: ProtoModel,
  target: ProtoModel,
  seen: ObjHashtable,
) => {
  const manager = source.manager;
  const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  for (const entry of converter.uf2BvUf) {
    const decl = entry[0];
    const bvDecl = entry[1];
    seen.add(bvDecl);
    const info = manager.funcDecls[decl];
    if (info.domain.length === 0) {
      if (manager.isArraySort(info.range))
        throw new SmtUnsupportedError("models of floating-point array constants");
      const value = source.constInterps.get(bvDecl);
      if (value !== undefined) target.registerConst(decl, value);
      continue;
    }
    if (info.family !== FAMILY_FPA) continue;
    manager.withTemporaries(
      () => {
        const interp = convertFuncInterp(source, rewriter, decl, bvDecl);
        if (interp.entries.length > 0 || interp.elseExpr !== null)
          target.registerFunc(decl, interp);
        else interp.release();
      },
      () => [],
    );
  }
  rewriter.release();
};

// Ported from Z3 (src/tactic/fpa/fpa2bv_tactic.cpp, src/tactic/fpa/fpa2bv_model_converter.cpp,
// src/ast/fpa/bv2fpa_converter.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { convertMinMaxSpecials, convertUf2BvUf } from "./bv2fpa-converter";
import { BV_RM_TO_ZERO, mkFpNumeralOfBits, mkRmNumeral } from "./fpa-decl-plugin";
import { Fpa2BvConverter } from "./fpa2bv-converter";
import { Fpa2BvRewriter } from "./fpa2bv-rewriter";
import type { Goal } from "./goal";
import { ObjHashtable } from "./hashtable";
import { FuncInterp, ProtoModel } from "./proto-model";
import { Rewriter } from "./rewriter";

const getConstValue = (model: ProtoModel, expr: number) =>
  model.constInterps.get(model.manager.decls[expr]);

const convertModel = (converter: Fpa2BvConverter, source: ProtoModel) => {
  const manager = source.manager;
  const target = new ProtoModel(manager).mkModel();
  const seen = new ObjHashtable((decl) => manager.getDeclHash(decl));
  for (const entry of converter.constants) {
    const sort = manager.funcDecls[entry[0]].range;
    const bv = manager.getArg(manager.getArg(entry[1], 0), 0);
    const value = getConstValue(source, bv);
    seen.add(manager.decls[bv]);
    target.registerConst(
      entry[0],
      mkFpNumeralOfBits(manager, sort, value === undefined ? 0n : manager.getBvNumeralValue(value)),
    );
  }
  for (const entry of converter.rmConstants) {
    const bv = manager.getArg(entry[1], 0);
    const value = getConstValue(source, bv);
    const rm = value === undefined ? BV_RM_TO_ZERO : Number(manager.getBvNumeralValue(value));
    seen.add(manager.decls[bv]);
    target.registerConst(entry[0], mkRmNumeral(manager, rm <= 3 ? rm : BV_RM_TO_ZERO));
  }
  convertMinMaxSpecials(converter, source, target, seen);
  convertUf2BvUf(converter, source, target, seen);
  for (const decl of source.getConstDecls())
    if (!seen.has(decl)) target.registerConst(decl, source.constInterps.get(decl) as number);
  for (const decl of source.getFuncDecls()) {
    if (seen.has(decl)) continue;
    const interp = source.funcInterps.get(decl) as FuncInterp;
    const copied = new FuncInterp(manager, interp.arity);
    for (const entry of interp.entries) copied.insertNewEntry(entry.args, entry.result);
    if (interp.elseExpr !== null) copied.setElse(interp.elseExpr);
    target.registerFunc(decl, copied);
  }
  for (const sort of source.getUninterpretedSorts())
    for (const value of source.getKnownUniverse(sort)) target.registerValue(value);
  return target;
};

export const runFpa2Bv = (manager: AstManager) => (goal: Goal) => {
  if (goal.isInconsistent) return [goal];
  const simp = new Rewriter(manager, {
    isEliminatingAnd: false,
    arith: TACTIC_ARITH_OPTIONS,
    isRewritingPatterns: false,
  });
  const converter = new Fpa2BvConverter(manager, simp);
  const rewriter = new Fpa2BvRewriter(manager, converter);
  const size = goal.forms.size;
  for (let index = 0; !goal.isInconsistent && index < size; index++) {
    const result = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, result);
    manager.decRef(result);
  }
  goal.addModelConversion((model) => convertModel(converter, model));
  goal.depth++;
  for (const assertion of converter.extraAssertions.items) goal.assert(assertion);
  rewriter.release();
  return [goal];
};

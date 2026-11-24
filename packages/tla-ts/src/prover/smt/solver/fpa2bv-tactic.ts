import type { AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { Bv2FpaConverter } from "./bv2fpa-converter";
import { Fpa2BvConverter } from "./fpa2bv-converter";
import { Fpa2BvRewriter } from "./fpa2bv-rewriter";
import type { Goal } from "./goal";
import { ObjHashtable } from "./hashtable";
import { FuncInterp, ProtoModel } from "./proto-model";
import { Rewriter } from "./rewriter";

const convertModel = (converter: Bv2FpaConverter, source: ProtoModel) => {
  const manager = source.manager;
  const target = new ProtoModel(manager).mkModel();
  const seen = new ObjHashtable((decl) => manager.getDeclHash(decl));
  converter.convertConsts(source, target, seen);
  converter.convertRmConsts(source, target, seen);
  converter.convertMinMaxSpecials(source, target, seen);
  converter.convertUf2BvUf(source, target, seen);
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
  for (const sort of source.getUninterpretedSorts()) {
    for (const value of source.getKnownUniverse(sort)) target.registerValue(value);
    target.registerUsort(sort, source.getKnownUniverse(sort));
  }
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
  let newCurr: number | undefined;
  for (let index = 0; !goal.isInconsistent && index < size; index++) {
    const result = rewriter.rewrite(goal.forms.get(index));
    if (newCurr !== undefined) manager.decRef(newCurr);
    newCurr = result;
    goal.update(index, result, goal.getDependency(index));
  }
  if (goal.isModelsEnabled) {
    const bv2fp = new Bv2FpaConverter(manager, converter);
    goal.addModelConversion(
      (model) => manager.withoutTemporaries(() => convertModel(bv2fp, model)),
      () => bv2fp.release(),
    );
  }
  goal.depth++;
  for (const assertion of converter.extraAssertions.items) goal.assert(assertion);
  if (newCurr !== undefined) manager.decRef(newCurr);
  rewriter.release();
  converter.reset();
  return [goal];
};

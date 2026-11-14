// Ported from Z3 (src/ackermannization/ackr_model_converter.cpp), MIT license, see z3-license.txt.
import { type AstManager, OP_CONST_ARRAY, OP_SELECT, OP_STORE } from "./ast";
import type { AckrInfo } from "./ackr-helper";
import { mkArrayApp } from "./array-decl-plugin";
import { ObjMap } from "./hashtable";
import { ModelEvaluator } from "./model-evaluator";
import { FuncInterp, getManagerSomeValue, ProtoModel } from "./proto-model";
import { RefVector } from "./ref-vector";

interface Converter {
  manager: AstManager;
  info: AckrInfo;
  evaluator: ModelEvaluator;
}

const pushAbstractValues = (converter: Converter, args: number[], target: RefVector) => {
  const manager = converter.manager;
  for (const arg of args) {
    const abstracted = converter.info.abstract(arg);
    const value = converter.evaluator.rewrite(abstracted);
    target.push(value);
    manager.decRef(value);
    manager.decRef(abstracted);
  }
};

const addArrayEntry = (
  converter: Converter,
  term: number,
  value: number,
  interpretations: ObjMap<number>,
) => {
  const manager = converter.manager;
  const array = manager.getArg(term, 0);
  const current = interpretations.get(array);
  if (current === undefined) {
    interpretations.set(
      array,
      mkArrayApp(manager, OP_CONST_ARRAY, [value], [manager.sorts[array]]),
    );
    return;
  }
  let base = current;
  while (manager.getOp(base) === OP_STORE) base = manager.getArg(base, 0);
  if (manager.getOp(base) === OP_CONST_ARRAY && manager.getArg(base, 0) === value) return;
  const args = new RefVector(manager);
  args.push(current);
  pushAbstractValues(converter, manager.getArgs(term).slice(1), args);
  args.push(value);
  interpretations.set(array, mkArrayApp(manager, OP_STORE, args.items));
  args.reset();
};

const addEntry = (
  converter: Converter,
  term: number,
  value: number,
  interpretations: ObjMap<FuncInterp>,
) => {
  const manager = converter.manager;
  const decl = manager.decls[term];
  const existing = interpretations.get(decl);
  const interp = existing ?? new FuncInterp(manager, manager.funcDecls[decl].domain.length);
  if (existing === undefined) interpretations.set(decl, interp);
  const args = new RefVector(manager);
  pushAbstractValues(converter, manager.getArgs(term), args);
  if (interp.getEntry(args.items) === undefined) interp.insertNewEntry(args.items, value);
  args.reset();
};

const convert = (info: AckrInfo, source: ProtoModel, target: ProtoModel) => {
  const manager = source.manager;
  for (const entry of source.funcInterps) target.registerFunc(entry[0], entry[1].copy());
  for (const sort of source.getUninterpretedSorts())
    for (const value of source.getKnownUniverse(sort)) target.registerValue(value);
  const interpretations = new ObjMap<FuncInterp>((decl) => manager.getDeclHash(decl));
  const arrayInterpretations = new ObjMap<number>((expr) => manager.hashes[expr]);
  const converter = { manager, info, evaluator: new ModelEvaluator(manager, source) };
  converter.evaluator.setModelCompletion(true);
  // Model completion registers constants in the source, which Z3's loop bound leaves out.
  for (const decl of source.getConstDecls().slice()) {
    const term = info.findTerm(decl);
    const value = source.constInterps.get(decl) as number;
    if (term === undefined) target.registerConst(decl, value);
    else if (manager.getOp(term) === OP_SELECT)
      addArrayEntry(converter, term, value, arrayInterpretations);
    else addEntry(converter, term, value, interpretations);
  }
  for (const entry of interpretations) {
    entry[1].setElse(getManagerSomeValue(manager, manager.funcDecls[entry[0]].range));
    target.registerFunc(entry[0], entry[1]);
  }
  for (const entry of arrayInterpretations) target.registerConst(manager.decls[entry[0]], entry[1]);
  converter.evaluator.release();
};

export const convertAckrModel = (
  info: AckrInfo,
  abstrModel: ProtoModel | undefined,
  model: ProtoModel,
) => {
  const target = new ProtoModel(model.manager).mkModel();
  if (abstrModel !== undefined) convert(info, abstrModel, target);
  convert(info, model, target);
  return target;
};

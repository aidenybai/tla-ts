// Ported from Z3 (src/ackermannization/ackr_helper.h, src/ackermannization/ackr_helper.cpp,
// src/ackermannization/ackr_info.h, src/ackermannization/ackr_bound_probe.cpp), MIT license, see
// z3-license.txt.
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_BSDIV0,
  OP_BSMOD0,
  OP_BSREM0,
  OP_BUDIV0,
  OP_BUREM0,
  OP_DIV0,
  OP_IDIV0,
  OP_MOD0,
  OP_POWER0,
  OP_SELECT,
  OP_SEQ_NTH_U,
} from "./ast";
import type { Goal } from "./goal";
import { ObjHashtable, ObjMap } from "./hashtable";
import { RewriterTpl } from "./rewriter-tpl";

export interface AppOcc {
  constArgs: ObjHashtable;
  varArgs: ObjHashtable;
}

const CONSIDERED_UNINTERPRETED_OPS = new Set([
  OP_DIV0,
  OP_IDIV0,
  OP_MOD0,
  OP_POWER0,
  OP_BSDIV0,
  OP_BUDIV0,
  OP_BSREM0,
  OP_BUREM0,
  OP_BSMOD0,
  OP_SEQ_NTH_U,
]);

export const isUninterpFn = (manager: AstManager, app: number) =>
  manager.getFamily(app) === FAMILY_USER || CONSIDERED_UNINTERPRETED_OPS.has(manager.getOp(app));

export const isAckrSelect = (manager: AstManager, app: number) =>
  manager.getOp(app) === OP_SELECT && manager.isUninterpretedConst(manager.getArg(app, 0));

export const createFun2Terms = (manager: AstManager) =>
  new ObjMap<AppOcc>((decl) => manager.getDeclHash(decl));

export const createSel2Terms = (manager: AstManager) =>
  new ObjMap<AppOcc>((expr) => manager.hashes[expr]);

export const markNonSelect = (manager: AstManager, app: number, nonSelect: Set<number>) => {
  if (manager.getOp(app) !== OP_SELECT) {
    for (const arg of manager.getArgs(app)) nonSelect.add(arg);
    return;
  }
  const visited = new Set<number>();
  const todo = manager.getArgs(app).slice(1);
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    nonSelect.add(expr);
    if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
  }
};

export const pruneNonMarked = (occs: ObjMap<AppOcc>, marked: Set<number>) => {
  const pruned = [...occs.keys()].filter((key) => marked.has(key));
  for (const key of pruned) occs.delete(key);
};

// Z3 tests only bit 16 of the count, so a larger count without that bit overflows there.
const getPairBound = (count: number) => (count >= 1 << 16 ? Infinity : (count * (count - 1)) / 2);

export const calculateLemmaBound = (fun2terms: ObjMap<AppOcc>, sel2terms: ObjMap<AppOcc>) => {
  let total = 0;
  for (const occs of [fun2terms, sel2terms])
    for (const entry of occs) {
      total += getPairBound(entry[1].varArgs.size);
      total += entry[1].constArgs.size * entry[1].varArgs.size;
    }
  return total;
};

export const insertTerm = (
  manager: AstManager,
  fun2terms: ObjMap<AppOcc>,
  sel2terms: ObjMap<AppOcc>,
  app: number,
) => {
  const numArgs = manager.getNumArgs(app);
  if (numArgs === 0) return;
  const isSelect = isAckrSelect(manager, app);
  if (!isSelect && !isUninterpFn(manager, app)) return;
  const occs = isSelect ? sel2terms : fun2terms;
  const key = isSelect ? manager.getArg(app, 0) : manager.decls[app];
  const existing = occs.get(key);
  const occ = existing ?? {
    constArgs: new ObjHashtable((expr) => manager.hashes[expr]),
    varArgs: new ObjHashtable((expr) => manager.hashes[expr]),
  };
  if (existing === undefined) occs.set(key, occ);
  let isConstArgs = isSelect || manager.isUniqueValue(manager.getArg(app, 0));
  for (let index = 1; isConstArgs && index < numArgs; index++)
    isConstArgs = manager.isUniqueValue(manager.getArg(app, index));
  (isConstArgs ? occ.constArgs : occ.varArgs).add(app);
};

export const getAckrBound = (goal: Goal) => {
  const manager = goal.manager;
  const fun2terms = createFun2Terms(manager);
  const sel2terms = createSel2Terms(manager);
  const nonSelect = new Set<number>();
  const visited = new Set<number>();
  const todo = [...goal.forms.items];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
    if (manager.kinds[expr] !== KIND_APP) continue;
    markNonSelect(manager, expr, nonSelect);
    insertTerm(manager, fun2terms, sel2terms, expr);
    manager.pushArgs(expr, todo);
  }
  pruneNonMarked(sel2terms, nonSelect);
  return calculateLemmaBound(fun2terms, sel2terms);
};

class AbstractionReplacer extends RewriterTpl {
  constructor(
    manager: AstManager,
    private termToConst: ObjMap<number>,
  ) {
    super(manager);
  }

  getSubst(expr: number) {
    return this.termToConst.get(expr);
  }
}

export class AckrInfo {
  private termToConst: ObjMap<number>;
  private constToTerm = new Map<number, number>();
  private replacer: AbstractionReplacer;

  constructor(private manager: AstManager) {
    this.termToConst = new ObjMap((expr) => manager.hashes[expr]);
    this.replacer = new AbstractionReplacer(manager, this.termToConst);
  }

  setAbstr(term: number, constant: number) {
    this.termToConst.set(term, constant);
    this.constToTerm.set(this.manager.decls[constant], term);
    this.manager.incRef(term);
    this.manager.incRef(constant);
  }

  // The result comes with a reference.
  abstract(expr: number) {
    return this.replacer.rewrite(expr);
  }

  findTerm(decl: number) {
    return this.constToTerm.get(decl);
  }

  getAbstr(term: number) {
    return this.termToConst.get(term) as number;
  }

  release() {
    for (const entry of this.termToConst) {
      this.manager.decRef(entry[0]);
      this.manager.decRef(entry[1]);
    }
    this.replacer.release();
  }
}

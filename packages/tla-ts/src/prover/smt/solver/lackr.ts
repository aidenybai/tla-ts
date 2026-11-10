// Ported from Z3 (src/ackermannization/lackr.cpp, src/ackermannization/lackr_model_constructor.cpp),
// MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  KIND_VAR,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_IMPLIES,
  SORT_BOOL,
} from "./ast";
import {
  AckrInfo,
  type AppOcc,
  calculateLemmaBound,
  createFun2Terms,
  createSel2Terms,
  insertTerm,
  isAckrSelect,
  isUninterpFn,
  markNonSelect,
  pruneNonMarked,
} from "./ackr-helper";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { ModelEvaluator } from "./model-evaluator";
import { ProtoModel } from "./proto-model";
import { RefVector } from "./ref-vector";
import { type RewriterOptions, Rewriter } from "./rewriter";

export interface AckrSolver {
  assert: (expr: number) => void;
  check: () => number;
  getModel: () => ProtoModel;
  release: () => void;
}

interface ValInfo {
  value: number;
  sourceTerm: number;
}

class LackrModelConstructor {
  conflicts: [number, number][] = [];
  private pinned: RefVector;
  private values2val: ObjMap<ValInfo>;
  private app2val: ObjMap<number>;
  private visited = new Set<number>();
  private evaluator: ModelEvaluator | undefined;

  constructor(
    private manager: AstManager,
    private info: AckrInfo,
    private abstrModel: ProtoModel,
  ) {
    this.pinned = new RefVector(manager);
    this.values2val = new ObjMap((expr) => manager.hashes[expr]);
    this.app2val = new ObjMap((expr) => manager.hashes[expr]);
  }

  check() {
    const manager = this.manager;
    let isOk = true;
    for (const decl of this.abstrModel.getConstDecls()) {
      const term =
        this.info.findTerm(decl) ?? manager.mkApp(decl, [], manager.funcDecls[decl].range);
      if (!this.checkTerm(term)) isOk = false;
    }
    return isOk;
  }

  release() {
    this.evaluator?.release();
    this.pinned.reset();
  }

  private checkTerm(term: number) {
    const manager = this.manager;
    this.evaluator ??= new ModelEvaluator(manager, new ProtoModel(manager).mkModel());
    const stack = [term];
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (this.visited.has(current)) {
        stack.pop();
        continue;
      }
      let isDone = true;
      for (const arg of manager.getArgs(current))
        if (!this.visited.has(arg)) {
          stack.push(arg);
          isDone = false;
        }
      if (!isDone) continue;
      this.visited.add(current);
      stack.pop();
      if (!this.mkValue(current)) return false;
    }
    return true;
  }

  private getCachedValue(app: number) {
    return this.manager.isValue(app) ? app : this.app2val.get(app);
  }

  private mkValue(app: number) {
    const manager = this.manager;
    if (manager.isValue(app)) return true;
    const result = this.evaluate(app);
    if (result === undefined) return false;
    this.app2val.set(app, result);
    this.pinned.push(app);
    this.pinned.push(result);
    manager.decRef(result);
    return true;
  }

  // The result comes with a reference.
  private evaluate(app: number) {
    const manager = this.manager;
    const decl = manager.decls[app];
    if (manager.getNumArgs(app) === 0) {
      const value =
        this.abstrModel.constInterps.get(decl) ??
        this.abstrModel.getSomeValue(manager.funcDecls[decl].range);
      manager.incRef(value);
      return value;
    }
    const values = new RefVector(manager);
    for (const arg of manager.getArgs(app)) {
      const value = this.getCachedValue(arg);
      if (value === undefined) {
        values.reset();
        return undefined;
      }
      values.push(value);
    }
    const term = manager.mkApp(decl, values.items, manager.sorts[app]);
    manager.incRef(term);
    const result = isUninterpFn(manager, app)
      ? this.mkUninterpretedValue(app, term)
      : isAckrSelect(manager, app)
        ? undefined
        : (this.evaluator as ModelEvaluator).rewrite(term);
    manager.decRef(term);
    values.reset();
    return result;
  }

  private mkUninterpretedValue(app: number, key: number) {
    const manager = this.manager;
    const abstrDecl = manager.decls[this.info.getAbstr(app)];
    const value =
      this.abstrModel.constInterps.get(abstrDecl) ??
      this.abstrModel.getSomeValue(manager.funcDecls[abstrDecl].range);
    const existing = this.values2val.get(key);
    if (existing === undefined) {
      this.values2val.set(key, { value, sourceTerm: app });
      this.pinned.push(app);
      this.pinned.push(value);
      this.pinned.push(key);
      manager.incRef(value);
      return value;
    }
    if (existing.value !== value) {
      this.conflicts.push([app, existing.sourceTerm]);
      return undefined;
    }
    manager.incRef(existing.value);
    return existing.value;
  }
}

export class Lackr {
  readonly info: AckrInfo;
  model: ProtoModel | undefined;
  private abstr: RefVector;
  private fun2terms: ObjMap<AppOcc>;
  private sel2terms: ObjMap<AppOcc>;
  private simp: Rewriter;
  private ackrs: RefVector;
  private nonSelect = new Set<number>();
  private nonFuns = new Set<number>();
  private isInit = false;

  constructor(
    private manager: AstManager,
    private formulas: readonly number[],
    rewriterOptions: RewriterOptions,
    private isEager: boolean,
    private solver?: AckrSolver,
  ) {
    this.abstr = new RefVector(manager);
    this.fun2terms = createFun2Terms(manager);
    this.sel2terms = createSel2Terms(manager);
    this.info = new AckrInfo(manager);
    this.simp = new Rewriter(manager, rewriterOptions);
    this.ackrs = new RefVector(manager);
  }

  solve() {
    if (!this.init()) return L_UNDEF;
    const result = this.isEager ? this.eager() : this.lazy();
    if (result === L_TRUE) this.model = this.solver?.getModel();
    return result;
  }

  mkAckermann(goal: Goal, lemmasUpperBound: number) {
    if (lemmasUpperBound <= 0 || !this.init()) return false;
    if (calculateLemmaBound(this.fun2terms, this.sel2terms) > lemmasUpperBound) return false;
    this.eagerEnc();
    for (const form of this.abstr.items) goal.assert(form);
    for (const form of this.ackrs.items) goal.assert(form);
    return true;
  }

  // ~lackr: the lemmas, the simplifier, the abstraction info and the abstractions, in that order.
  release(isInfoKept: boolean) {
    this.ackrs.reset();
    this.simp.release();
    if (!isInfoKept) this.info.release();
    this.abstr.reset();
  }

  private init() {
    if (this.isInit) return true;
    if (!this.collectTerms()) return false;
    this.abstract();
    this.isInit = true;
    return true;
  }

  private isEqual(first: number, second: number) {
    const manager = this.manager;
    return (
      first === second ||
      (manager.isAlgebraicNumeral(first) &&
        manager.isAlgebraicNumeral(second) &&
        manager.am.compare(manager.getAlgebraicValue(first), manager.getAlgebraicValue(second)) ===
          0)
    );
  }

  private ackr(first: number, second: number) {
    const manager = this.manager;
    const eqs = new RefVector(manager);
    for (let index = 0; index < manager.getNumArgs(first); index++) {
      const firstArg = manager.getArg(first, index);
      const secondArg = manager.getArg(second, index);
      if (this.isEqual(firstArg, secondArg)) continue;
      if (manager.areDistinct(firstArg, secondArg)) {
        eqs.reset();
        return false;
      }
      eqs.push(manager.mkEq(firstArg, secondArg));
    }
    const lhs = manager.mkAnd(eqs.items);
    manager.incRef(lhs);
    const rhs = manager.mkEq(this.info.getAbstr(first), this.info.getAbstr(second));
    manager.incRef(rhs);
    const implication = manager.mkApp(OP_IMPLIES, [lhs, rhs], SORT_BOOL);
    manager.incRef(implication);
    const abstracted = this.info.abstract(implication);
    const simplified = this.simp.rewrite(abstracted);
    manager.decRef(abstracted);
    const isTrivial = manager.isTrue(simplified);
    if (isTrivial) manager.decRef(simplified);
    else this.ackrs.pushOwned(simplified);
    manager.decRef(implication);
    manager.decRef(rhs);
    manager.decRef(lhs);
    eqs.reset();
    return !isTrivial;
  }

  private eagerEnc() {
    for (const occs of [this.fun2terms, this.sel2terms])
      for (const entry of occs) {
        this.manager.limit.checkpoint();
        this.ackrOcc(entry[1]);
      }
  }

  private ackrOcc(occ: AppOcc) {
    const varArgs = [...occ.varArgs];
    for (const [index, first] of varArgs.entries()) {
      for (const second of varArgs.slice(index + 1)) this.ackr(first, second);
      for (const second of occ.constArgs) this.ackr(first, second);
    }
  }

  private abstract() {
    const manager = this.manager;
    for (const entry of this.fun2terms) {
      const name = manager.funcDecls[entry[0]].name;
      for (const terms of [entry[1].varArgs, entry[1].constArgs])
        for (const term of terms)
          this.info.setAbstr(term, manager.mkFreshConst(name, manager.sorts[term]));
    }
    for (const entry of this.sel2terms) {
      const name = manager.funcDecls[manager.decls[entry[0]]].name;
      for (const terms of [entry[1].constArgs, entry[1].varArgs])
        for (const term of terms)
          this.info.setAbstr(term, manager.mkFreshConst(name, manager.sorts[term]));
    }
    for (const form of this.formulas) this.abstr.pushOwned(this.info.abstract(form));
  }

  private eager() {
    const manager = this.manager;
    const solver = this.solver as AckrSolver;
    for (const form of this.abstr.items) solver.assert(form);
    if (solver.check() === L_FALSE) return L_FALSE;
    this.eagerEnc();
    const all = manager.mkAnd(this.ackrs.items);
    manager.incRef(all);
    const simplified = this.simp.rewrite(all);
    manager.decRef(all);
    solver.assert(simplified);
    manager.decRef(simplified);
    return solver.check();
  }

  private lazy() {
    const solver = this.solver as AckrSolver;
    for (const form of this.abstr.items) solver.assert(form);
    let ackrHead = 0;
    let constructor: LackrModelConstructor | undefined;
    while (true) {
      this.manager.limit.checkpoint();
      const result = solver.check();
      if (result !== L_TRUE) {
        constructor?.release();
        return result;
      }
      constructor?.release();
      constructor = new LackrModelConstructor(this.manager, this.info, solver.getModel());
      if (constructor.check()) {
        constructor.release();
        return L_TRUE;
      }
      for (const conflict of constructor.conflicts) this.ackr(conflict[0], conflict[1]);
      while (ackrHead < this.ackrs.size) solver.assert(this.ackrs.items[ackrHead++]);
    }
  }

  private collectTerms() {
    const manager = this.manager;
    const stack = [...this.formulas];
    const visited = new Set<number>();
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (visited.has(current)) {
        stack.pop();
        continue;
      }
      if (manager.kinds[current] === KIND_VAR) {
        visited.add(current);
        stack.pop();
        continue;
      }
      if (manager.kinds[current] !== KIND_APP) return false;
      let isDone = true;
      for (const arg of manager.getArgs(current))
        if (!visited.has(arg)) {
          stack.push(arg);
          isDone = false;
        }
      if (isDone) {
        visited.add(current);
        stack.pop();
        markNonSelect(manager, current, this.nonSelect);
        insertTerm(manager, this.fun2terms, this.sel2terms, current);
      }
      const op = manager.getOp(current);
      if (op === OP_AS_ARRAY || op === OP_ARRAY_MAP)
        this.nonFuns.add(manager.funcDecls[manager.decls[current]].parameters[0]);
    }
    pruneNonMarked(this.sel2terms, this.nonSelect);
    pruneNonMarked(this.fun2terms, this.nonFuns);
    return true;
  }
}

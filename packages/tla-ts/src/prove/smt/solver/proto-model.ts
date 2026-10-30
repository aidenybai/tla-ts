// Ported from Z3 (src/smt/proto_model/proto_model.cpp, src/model/func_interp.cpp,
// src/model/value_factory.cpp, src/model/model_core.cpp), MIT license, see z3-license.txt. The
// model that the SMT kernel builds from a satisfying assignment, and that model-based quantifier
// instantiation completes and checks.
import { AstManager, KIND_APP, KIND_VAR, OP_AND, OP_EQ, OP_ITE, SORT_BOOL, SORT_INT } from "./ast";
import { ObjHashtable } from "./hashtable";
import { ModelEvaluator } from "./model-evaluator";

interface FuncEntry {
  args: number[];
  result: number;
}

// random_gen from Z3's util/util.h.
export class RandomGen {
  constructor(private seed: number) {}

  next() {
    this.seed = (Math.imul(this.seed, 214013) + 2531011) >>> 0;
    return (this.seed >>> 16) & 0x7fff;
  }
}

// func_interp: a finite table of entries and an else expression over the variables (:var i) for
// argument i.
export class FuncInterp {
  entries: FuncEntry[] = [];
  private entryTable = new Map<string, FuncEntry>();
  elseExpr: number | null = null;
  private interp: number | null = null;

  constructor(
    private manager: AstManager,
    readonly arity: number,
  ) {}

  isPartial() {
    return this.elseExpr === null;
  }

  getEntry(args: number[]) {
    return this.entryTable.get(args.join(","));
  }

  insertNewEntry(args: number[], result: number) {
    this.interp = null;
    const entry = { args: [...args], result };
    this.entries.push(entry);
    this.entryTable.set(args.join(","), entry);
  }

  insertEntry(args: number[], result: number) {
    this.interp = null;
    const entry = this.getEntry(args);
    if (entry === undefined) this.insertNewEntry(args, result);
    else entry.result = result;
  }

  // is_fi_entry_expr: (ite (and (= (:var 0) a0) ...) t e) with a ground t.
  private getEntryArgs(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ITE) return undefined;
    const condition = manager.args[expr][0];
    if (!manager.isGround(manager.args[expr][1]) || this.arity === 0) return undefined;
    if (this.arity === 1 && manager.getOp(condition) !== OP_EQ) return undefined;
    if (
      this.arity > 1 &&
      (manager.getOp(condition) !== OP_AND || manager.args[condition].length !== this.arity)
    )
      return undefined;
    const args: number[] = [];
    for (let index = 0; index < this.arity; index++) {
      const eq = this.arity === 1 ? condition : manager.args[condition][index];
      if (manager.getOp(eq) !== OP_EQ) return undefined;
      const left = manager.args[eq][0];
      const right = manager.args[eq][1];
      if (manager.kinds[left] === KIND_VAR && manager.values[left] === index) args.push(right);
      else if (manager.kinds[right] === KIND_VAR && manager.values[right] === index)
        args.push(left);
      else return undefined;
    }
    return args;
  }

  setElse(expr: number) {
    if (expr === this.elseExpr) return;
    this.interp = null;
    let current = expr;
    for (let args = this.getEntryArgs(current); args !== undefined;) {
      if (this.getEntry(args) === undefined) this.insertEntry(args, this.manager.args[current][1]);
      current = this.manager.args[current][2];
      args = this.getEntryArgs(current);
    }
    this.elseExpr = current;
  }

  isConstant() {
    const elseExpr = this.elseExpr;
    if (elseExpr === null || !this.manager.isGround(elseExpr)) return false;
    return this.entries.every((entry) => entry.result === elseExpr);
  }

  getMaxOccResult() {
    const counts = new Map<number, number>();
    let best: number | null = null;
    let max = 0;
    for (const entry of this.entries) {
      const count = (counts.get(entry.result) ?? 0) + 1;
      counts.set(entry.result, count);
      if (count > max) {
        max = count;
        best = entry.result;
      }
    }
    return best;
  }

  // compress: drops the entries whose result is the else value, and recognizes the identity.
  compress() {
    const manager = this.manager;
    const elseExpr = this.elseExpr;
    if (elseExpr === null || this.entries.length === 0 || !manager.isGround(elseExpr)) return;
    const kept = this.entries.filter((entry) => entry.result !== elseExpr);
    if (kept.length < this.entries.length) {
      this.interp = null;
      this.entries = kept;
      this.entryTable = new Map(kept.map((entry) => [entry.args.join(","), entry]));
    }
    if (this.entries.length > 0 && this.isIdentity()) {
      this.entries = [];
      this.entryTable.clear();
      this.interp = null;
      this.elseExpr = manager.mkVar(0, manager.sorts[elseExpr]);
    }
  }

  // is_identity: only Bool has a finite number of elements among tlapm's sorts.
  private isIdentity() {
    const manager = this.manager;
    const elseExpr = this.elseExpr;
    if (this.arity !== 1 || elseExpr === null) return false;
    for (const entry of this.entries)
      if (entry.args[0] !== entry.result || entry.result === elseExpr) return false;
    if (manager.kinds[elseExpr] === KIND_VAR) return true;
    if (!manager.isUniqueValue(elseExpr) || manager.sorts[elseExpr] !== SORT_BOOL) return false;
    return this.entries.length + 1 === 2;
  }

  // get_interp: the interpretation as an expression over the argument variables.
  getInterp() {
    if (this.interp !== null) return this.interp;
    const manager = this.manager;
    const elseExpr = this.elseExpr;
    if (elseExpr === null) return null;
    let result = elseExpr;
    for (const entry of this.entries) {
      if (entry.result === elseExpr) continue;
      const condition = manager.mkAnd(
        entry.args.map((arg, index) => manager.mkEq(manager.mkVar(index, manager.sorts[arg]), arg)),
      );
      if (manager.isTrue(entry.result))
        result = manager.isFalse(result) ? condition : manager.mkOr([condition, result]);
      else if (manager.isFalse(entry.result)) {
        const negated = manager.mkNot(condition);
        result = manager.isTrue(result) ? negated : manager.mkAnd([negated, result]);
      } else if (entry.result !== result)
        result = manager.mkApp(OP_ITE, [condition, entry.result, result], manager.sorts[result]);
    }
    this.interp = result;
    return result;
  }
}

export class ProtoModel {
  readonly constInterps = new Map<number, number>();
  readonly funcInterps = new Map<number, FuncInterp>();
  private auxDecls = new Set<number>();
  // user_sort_factory and the arith_factory: the values of each sort, in Z3's hash order.
  private values = new Map<number, ObjHashtable>();
  private nextValue = new Map<number, number>();
  private finiteSorts = new Set<number>();
  private boolRandom: RandomGen;
  private evaluator: ModelEvaluator;

  constructor(readonly manager: AstManager) {
    this.boolRandom = new RandomGen(manager.kinds.length);
    this.evaluator = new ModelEvaluator(manager, this);
  }

  registerConst(decl: number, value: number) {
    this.constInterps.set(decl, value);
  }

  registerFunc(decl: number, interp: FuncInterp) {
    this.funcInterps.set(decl, interp);
  }

  registerAuxDecl(decl: number, interp?: FuncInterp) {
    if (interp !== undefined) this.funcInterps.set(decl, interp);
    this.auxDecls.add(decl);
  }

  // reregister_decl: the old interpretation of decl moves to auxDecl.
  reregisterDecl(decl: number, interp: FuncInterp, auxDecl: number) {
    const old = this.funcInterps.get(decl);
    if (old !== undefined) {
      this.funcInterps.set(auxDecl, old);
      this.auxDecls.add(auxDecl);
    }
    this.funcInterps.set(decl, interp);
  }

  eval(expr: number, isModelCompletion: boolean) {
    return this.evaluator.evaluate(expr, isModelCompletion);
  }

  private getValueSet(sort: number) {
    const existing = this.values.get(sort);
    if (existing !== undefined) return existing;
    const created = new ObjHashtable((value) => this.manager.hashes[value]);
    this.values.set(sort, created);
    return created;
  }

  private mkValue(index: number, sort: number) {
    const value =
      sort === SORT_INT
        ? this.manager.mkNumeral(BigInt(index))
        : this.manager.mkModelValue(index, sort);
    this.getValueSet(sort).add(value);
    return value;
  }

  registerValue(value: number) {
    const sort = this.manager.sorts[value];
    if (sort !== SORT_BOOL) this.getValueSet(sort).add(value);
  }

  getSomeValue(sort: number): number {
    const manager = this.manager;
    if (sort === SORT_BOOL)
      return this.boolRandom.next() % 2 === 0 ? manager.falseExpr : manager.trueExpr;
    const set = this.values.get(sort);
    if (this.finiteSorts.has(sort) && set !== undefined) {
      const random = new RandomGen(manager.kinds.length);
      let count = 1;
      let result = manager.falseExpr;
      for (const value of set) {
        if (random.next() % count++ === 0) result = value;
        if (count > 10) break;
      }
      return result;
    }
    if (set !== undefined && set.size > 0)
      return set[Symbol.iterator]().next().value ?? this.mkValue(0, sort);
    return this.mkValue(0, sort);
  }

  getFreshValue(sort: number): number | null {
    if (sort === SORT_BOOL || this.finiteSorts.has(sort)) return null;
    const set = this.getValueSet(sort);
    let next = this.nextValue.get(sort) ?? 0;
    for (;;) {
      const value =
        sort === SORT_INT
          ? this.manager.mkNumeral(BigInt(next))
          : this.manager.mkModelValue(next, sort);
      next++;
      if (!set.has(value)) {
        set.add(value);
        this.nextValue.set(sort, next);
        return value;
      }
    }
  }

  freezeUniverse(sort: number) {
    if (this.finiteSorts.has(sort)) return;
    const set = this.values.get(sort);
    if (set === undefined || set.size === 0) this.getSomeValue(sort);
    this.finiteSorts.add(sort);
  }

  isFinite(sort: number) {
    return this.manager.isUninterpretedSort(sort) && this.finiteSorts.has(sort);
  }

  getKnownUniverse(sort: number): number[] {
    return [...(this.values.get(sort) ?? [])];
  }

  compress() {
    for (const interp of this.funcInterps.values()) interp.compress();
  }

  completePartialFunc(decl: number, isUsingFresh: boolean) {
    const interp = this.funcInterps.get(decl);
    if (interp === undefined || !interp.isPartial()) return;
    const range = this.manager.funcDecls[decl].range;
    const fresh = isUsingFresh ? this.getFreshValue(range) : null;
    interp.setElse(fresh ?? interp.getMaxOccResult() ?? this.getSomeValue(range));
  }

  completePartialFuncs(isUsingFresh: boolean) {
    for (const decl of this.funcInterps.keys()) this.completePartialFunc(decl, isUsingFresh);
  }

  // cleanup_expr: replaces the uninterpreted constants in an else expression with their values.
  private cleanupExpr(expr: number, foundAuxDecls: Set<number>) {
    const manager = this.manager;
    const cache = new Map<number, number>();
    const visit = (current: number): number => {
      const cached = cache.get(current);
      if (cached !== undefined) return cached;
      let result = current;
      if (manager.isUninterpretedConst(current)) {
        const decl = manager.decls[current];
        const existing = this.constInterps.get(decl);
        result = existing ?? this.getSomeValue(manager.sorts[current]);
        if (existing === undefined) this.constInterps.set(decl, result);
      } else if (manager.kinds[current] === KIND_APP && manager.args[current].length > 0) {
        const decl = manager.decls[current];
        if (this.auxDecls.has(decl)) foundAuxDecls.add(decl);
        result = this.evaluator.mkApp(
          decl,
          manager.args[current].map((arg) => visit(arg)),
          manager.sorts[current],
        );
      }
      cache.set(current, result);
      return result;
    };
    return visit(expr);
  }

  // cleanup: also removes the auxiliary declarations that no interpretation uses.
  cleanup() {
    const foundAuxDecls = new Set<number>();
    for (const interp of this.funcInterps.values())
      if (interp.elseExpr !== null)
        interp.setElse(this.cleanupExpr(interp.elseExpr, foundAuxDecls));
    for (const entry of this.constInterps) {
      const cleaned = this.cleanupExpr(entry[1], foundAuxDecls);
      if (cleaned !== entry[1]) this.constInterps.set(entry[0], cleaned);
    }
    if (foundAuxDecls.size === this.auxDecls.size) return;
    for (const decl of this.auxDecls)
      if (!foundAuxDecls.has(decl)) {
        this.funcInterps.delete(decl);
        this.constInterps.delete(decl);
      }
    this.auxDecls = foundAuxDecls;
  }

  // model::get_some_const_interp.
  getSomeConstInterp(decl: number) {
    return this.constInterps.get(decl) ?? this.getSomeValue(this.manager.funcDecls[decl].range);
  }

  // model::are_equal for values.
  areEqual(first: number, second: number) {
    return first === second;
  }
}

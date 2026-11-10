// Ported from Z3 (src/smt/proto_model/proto_model.cpp, src/model/func_interp.cpp,
// src/model/value_factory.cpp, src/model/model_core.cpp, src/model/datatype_factory.cpp), MIT
// license, see z3-license.txt.
import { TermEnumeration } from "./term-enumeration";
import {
  AstManager,
  FAMILY_SEQ,
  KIND_APP,
  KIND_VAR,
  OP_AND,
  OP_EQ,
  OP_CONST_ARRAY,
  OP_ITE,
  OP_SEQ_TO_RE,
  SORT_BOOL,
  isArithSort,
} from "./ast";
import {
  getDatatypeConstructors,
  getNonRecConstructor,
  isRecursiveDatatype,
} from "./datatype-decl-plugin";
import { mkArrayApp } from "./array-decl-plugin";
import { mkFpNumeral, mkRmNumeral } from "./fpa-decl-plugin";
import { MPF_ROUND_TOWARD_ZERO, mkZero } from "./mpf";
import { RandomGen } from "./random-gen";
import { mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import { Rational } from "./rational";
import { ObjHashtable, ObjMap } from "./hashtable";
import { ModelEvaluator } from "./model-evaluator";
import { RefVector } from "./ref-vector";
import { CharFactory, SeqFactory } from "./seq-factory";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

export const getManagerSomeValue = (manager: AstManager, sort: number): number => {
  if (sort === SORT_BOOL) return manager.falseExpr;
  if (manager.isRmSort(sort)) return mkRmNumeral(manager, MPF_ROUND_TOWARD_ZERO);
  if (manager.isFpSort(sort))
    return mkFpNumeral(manager, mkZero(manager.getEbits(sort), manager.getSbits(sort), false));
  if (isArithSort(sort)) return manager.mkNumeralOfSort(Rational.zero, sort);
  if (manager.isBvSort(sort)) return manager.mkBvNumeral(0n, manager.getBvSize(sort));
  if (manager.isArraySort(sort))
    return mkArrayApp(
      manager,
      OP_CONST_ARRAY,
      [getManagerSomeValue(manager, manager.getArrayRange(sort))],
      [sort],
    );
  if (manager.isSeqSort(sort)) return mkEmptySeq(manager, sort);
  if (manager.isReSort(sort))
    return mkSeqApp(manager, OP_SEQ_TO_RE, [mkEmptySeq(manager, manager.getReSeqSort(sort))]);
  if (manager.isCharSort(sort)) return manager.mkChar(65);
  if (!manager.isDatatypeSort(sort)) return manager.mkModelValue(0, sort);
  const constructor = getNonRecConstructor(manager, sort);
  return manager.mkApp(
    constructor,
    manager.funcDecls[constructor].domain.map((argSort) => getManagerSomeValue(manager, argSort)),
    sort,
  );
};

interface FuncEntry {
  args: number[];
  result: number;
}

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
    const manager = this.manager;
    this.resetInterpCache();
    // func_entry: the result is held first, then the arguments.
    manager.incRef(result);
    for (const arg of args) manager.incRef(arg);
    const entry = { args: [...args], result };
    this.entries.push(entry);
    this.entryTable.set(args.join(","), entry);
  }

  insertEntry(args: number[], result: number) {
    this.resetInterpCache();
    const entry = this.getEntry(args);
    if (entry === undefined) {
      this.insertNewEntry(args, result);
      return;
    }
    this.manager.incRef(result);
    this.manager.decRef(entry.result);
    entry.result = result;
  }

  private resetInterpCache() {
    if (this.interp !== null) this.manager.decRef(this.interp);
    this.interp = null;
  }

  private releaseEntry(entry: FuncEntry) {
    for (const arg of entry.args) this.manager.decRef(arg);
    this.manager.decRef(entry.result);
  }

  release() {
    for (const entry of this.entries) this.releaseEntry(entry);
    if (this.elseExpr !== null) this.manager.decRef(this.elseExpr);
    this.resetInterpCache();
  }

  // is_fi_entry_expr: (ite (and (= (:var 0) a0) ...) t e) with a ground t.
  private getEntryArgs(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ITE) return undefined;
    const condition = manager.getArg(expr, 0);
    if (!manager.isGround(manager.getArg(expr, 1)) || this.arity === 0) return undefined;
    if (this.arity === 1 && manager.getOp(condition) !== OP_EQ) return undefined;
    if (
      this.arity > 1 &&
      (manager.getOp(condition) !== OP_AND || manager.getNumArgs(condition) !== this.arity)
    )
      return undefined;
    const args: number[] = [];
    for (let index = 0; index < this.arity; index++) {
      const eq = this.arity === 1 ? condition : manager.getArg(condition, index);
      if (manager.getOp(eq) !== OP_EQ) return undefined;
      const left = manager.getArg(eq, 0);
      const right = manager.getArg(eq, 1);
      if (manager.kinds[left] === KIND_VAR && manager.values[left] === index) args.push(right);
      else if (manager.kinds[right] === KIND_VAR && manager.values[right] === index)
        args.push(left);
      else return undefined;
    }
    return args;
  }

  setElse(expr: number) {
    if (expr === this.elseExpr) return;
    this.resetInterpCache();
    let current = expr;
    for (let args = this.getEntryArgs(current); args !== undefined;) {
      if (this.getEntry(args) === undefined)
        this.insertEntry(args, this.manager.getArg(current, 1));
      current = this.manager.getArg(current, 2);
      args = this.getEntryArgs(current);
    }
    this.manager.incRef(current);
    if (this.elseExpr !== null) this.manager.decRef(this.elseExpr);
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

  compress() {
    const manager = this.manager;
    const elseExpr = this.elseExpr;
    if (elseExpr === null || this.entries.length === 0 || !manager.isGround(elseExpr)) return;
    const kept = this.entries.filter((entry) => {
      if (entry.result !== elseExpr) return true;
      this.releaseEntry(entry);
      return false;
    });
    if (kept.length < this.entries.length) {
      this.resetInterpCache();
      this.entries = kept;
      this.entryTable = new Map(kept.map((entry) => [entry.args.join(","), entry]));
    }
    if (this.entries.length > 0 && this.isIdentity()) {
      for (const entry of this.entries) this.releaseEntry(entry);
      this.entries = [];
      this.entryTable.clear();
      this.resetInterpCache();
      const identity = manager.mkVar(0, manager.sorts[elseExpr]);
      manager.incRef(identity);
      manager.decRef(elseExpr);
      this.elseExpr = identity;
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

  getInterp() {
    if (this.interp !== null) return this.interp;
    const manager = this.manager;
    const elseExpr = this.elseExpr;
    if (elseExpr === null) return null;
    let result = elseExpr;
    const vars: number[] = [];
    for (const entry of this.entries) {
      if (entry.result === elseExpr) continue;
      if (vars.length === 0)
        entry.args.forEach((arg, index) => vars.push(manager.mkVar(index, manager.sorts[arg])));
      const condition = manager.mkAnd(
        entry.args.map((arg, index) => manager.mkEq(vars[index], arg)),
      );
      if (manager.isTrue(entry.result))
        result = manager.isFalse(result) ? condition : manager.mkOr([condition, result]);
      else if (manager.isFalse(entry.result)) {
        const negated = manager.mkNot(condition);
        result = manager.isTrue(result) ? negated : manager.mkAnd([negated, result]);
      } else if (entry.result !== result)
        result = manager.mkApp(OP_ITE, [condition, entry.result, result], manager.sorts[result]);
    }
    manager.incRef(result);
    this.interp = result;
    return result;
  }
}

export class ProtoModel {
  readonly constInterps: ObjMap<number>;
  private constDecls: number[] = [];
  // m_finterp, in Z3's slot order, and m_func_decls, in the order they were registered.
  readonly funcInterps: ObjMap<FuncInterp>;
  private funcDecls: number[] = [];
  private auxDecls: ObjHashtable;
  // user_sort_factory and the arith_factory: the values of each sort, in Z3's hash order, and the
  // values each factory holds, in the order it made or registered them.
  private values = new Map<number, ObjHashtable>();
  private userSortValues: RefVector;
  private arithValues: RefVector;
  private bvValues: RefVector;
  private datatypeValues: RefVector;
  private enumeratedTerms: RefVector;
  private freshEnumerations = new Map<number, TermEnumeration>();
  private nextValue = new Map<number, number>();
  private finiteSorts = new Set<number>();
  private boolRandom: RandomGen;
  private evaluator: ModelEvaluator;
  private rewriter: Rewriter;
  // The holders of a proto_model and a model are counted, and the last one releases it.
  private refCount = 0;
  // A model, rather than the proto_model it was made from, takes its values from the manager.
  private isFinal = false;
  private seqFactory: SeqFactory | undefined;
  private charFactory: CharFactory | undefined;

  constructor(readonly manager: AstManager) {
    this.boolRandom = new RandomGen(manager.getNumAsts());
    this.constInterps = new ObjMap((decl) => manager.getDeclHash(decl));
    this.funcInterps = new ObjMap((decl) => manager.getDeclHash(decl));
    this.userSortValues = new RefVector(manager);
    this.arithValues = new RefVector(manager);
    this.bvValues = new RefVector(manager);
    this.datatypeValues = new RefVector(manager);
    this.enumeratedTerms = new RefVector(manager);
    this.auxDecls = new ObjHashtable((decl) => manager.getDeclHash(decl));
    this.evaluator = new ModelEvaluator(manager, this);
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  }

  registerConst(decl: number, value: number) {
    const old = this.constInterps.get(decl);
    if (old === undefined) this.manager.incDeclRef(decl);
    this.manager.incRef(value);
    if (old === undefined) this.constDecls.push(decl);
    else this.manager.decRef(old);
    this.constInterps.set(decl, value);
  }

  registerFunc(decl: number, interp: FuncInterp) {
    const old = this.funcInterps.get(decl);
    if (old === undefined) {
      this.funcDecls.push(decl);
      this.manager.incDeclRef(decl);
    }
    this.funcInterps.set(decl, interp);
    old?.release();
  }

  registerAuxDecl(decl: number, interp?: FuncInterp) {
    if (interp !== undefined) this.registerFunc(decl, interp);
    this.auxDecls.add(decl);
  }

  reregisterDecl(decl: number, interp: FuncInterp, auxDecl: number) {
    const old = this.funcInterps.get(decl);
    if (old === undefined) {
      this.registerFunc(decl, interp);
      return;
    }
    this.registerFunc(auxDecl, old);
    this.auxDecls.add(auxDecl);
    this.funcInterps.set(decl, interp);
  }

  // eval: the result comes with a reference, which the caller releases.
  eval(expr: number, isModelCompletion: boolean) {
    this.evaluator.setModelCompletion(isModelCompletion);
    const result = this.evaluator.rewrite(expr);
    return result;
  }

  private getValueSet(sort: number) {
    const existing = this.values.get(sort);
    if (existing !== undefined) return existing;
    const created = new ObjHashtable((value) => this.manager.hashes[value]);
    this.values.set(sort, created);
    return created;
  }

  private mkIndexedValue(index: number, sort: number) {
    const manager = this.manager;
    return isArithSort(sort)
      ? manager.mkNumeralOfSort(Rational.of(BigInt(index)), sort)
      : manager.isBvSort(sort)
        ? manager.mkBvNumeral(BigInt(index), manager.getBvSize(sort))
        : manager.mkModelValue(index, sort);
  }

  // Inserting grows the table even for a value it has, so a value is inserted only when it is new.
  private addValue(sort: number, value: number) {
    const set = this.getValueSet(sort);
    if (set.has(value)) return;
    (isArithSort(sort)
      ? this.arithValues
      : this.manager.isBvSort(sort)
        ? this.bvValues
        : this.manager.isDatatypeSort(sort)
          ? this.datatypeValues
          : this.userSortValues
    ).push(value);
    set.add(value);
  }

  private mkValue(index: number, sort: number) {
    const value = this.mkIndexedValue(index, sort);
    this.addValue(sort, value);
    return value;
  }

  getSeqFactory() {
    this.seqFactory ??= new SeqFactory(this.manager, this);
    return this.seqFactory;
  }

  getCharFactory() {
    this.charFactory ??= new CharFactory(this.manager);
    return this.charFactory;
  }

  registerValue(value: number) {
    const manager = this.manager;
    const sort = manager.sorts[value];
    if (this.charFactory !== undefined && manager.isCharSort(sort)) {
      this.charFactory.registerValue(manager.getChar(value));
      return;
    }
    if (this.seqFactory !== undefined && manager.getSortFamily(sort) === FAMILY_SEQ) {
      this.seqFactory.registerValue(value);
      return;
    }
    if (sort !== SORT_BOOL) this.addValue(sort, value);
  }

  getSomeValue(sort: number): number {
    const manager = this.manager;
    if (this.charFactory !== undefined && manager.isCharSort(sort))
      return manager.mkChar(this.charFactory.getSomeValue());
    if (
      manager.isFpSort(sort) ||
      manager.isRmSort(sort) ||
      manager.getSortFamily(sort) === FAMILY_SEQ ||
      manager.isCharSort(sort)
    )
      return getManagerSomeValue(manager, sort);
    if (this.isFinal) {
      const first = manager.isUninterpretedSort(sort)
        ? this.values.get(sort)?.[Symbol.iterator]().next().value
        : undefined;
      return first ?? getManagerSomeValue(manager, sort);
    }
    if (sort === SORT_BOOL)
      return this.boolRandom.next() % 2 === 0 ? manager.falseExpr : manager.trueExpr;
    const set = this.values.get(sort);
    if (manager.isDatatypeSort(sort)) {
      if (set !== undefined && set.size > 0) {
        const first = set[Symbol.iterator]().next();
        if (first.done !== true) return first.value;
      }
      const constructor = getNonRecConstructor(manager, sort);
      const value = manager.mkApp(
        constructor,
        manager.funcDecls[constructor].domain.map((argSort) => this.getSomeValue(argSort)),
        sort,
      );
      this.addValue(sort, value);
      return value;
    }
    if (this.finiteSorts.has(sort) && set !== undefined) {
      const random = new RandomGen(manager.getNumAsts());
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

  private getFreshRecursiveValue(sort: number) {
    const set = this.getValueSet(sort);
    const enumeration = this.freshEnumerations.get(sort) ?? this.mkTermEnumeration(sort);
    this.freshEnumerations.set(sort, enumeration);
    for (let term = enumeration.current; term !== null; term = enumeration.current) {
      enumeration.advance();
      if (!set.has(term)) {
        this.addValue(sort, term);
        return term;
      }
    }
    return null;
  }

  private mkTermEnumeration(sort: number) {
    const manager = this.manager;
    const constructors: number[] = [];
    const visited = new Set([sort]);
    const todo = [sort];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      const nested = manager.isDatatypeSort(current)
        ? getDatatypeConstructors(manager, current).flatMap((constructor) => {
            constructors.push(constructor);
            return manager.funcDecls[constructor].domain;
          })
        : [];
      for (const next of [...nested, ...manager.getSortParameters(current)]) {
        if (visited.has(next)) continue;
        visited.add(next);
        todo.push(next);
      }
    }
    return new TermEnumeration(
      manager,
      [...new Set(constructors)],
      sort,
      (argSort) => this.getSomeValue(argSort),
      (term) => this.enumeratedTerms.push(term),
    );
  }

  private getFreshDatatypeValue(sort: number): number | null {
    const manager = this.manager;
    if (isRecursiveDatatype(manager, sort)) return this.getFreshRecursiveValue(sort);
    const set = this.getValueSet(sort);
    for (const constructor of getDatatypeConstructors(manager, sort)) {
      let isFreshArgFound = false;
      const args = manager.funcDecls[constructor].domain.map((argSort) => {
        const fresh = isFreshArgFound ? null : this.getFreshValue(argSort);
        if (fresh === null) return this.getSomeValue(argSort);
        isFreshArgFound = true;
        return fresh;
      });
      const value = manager.mkApp(constructor, args, sort);
      if (!set.has(value)) {
        this.addValue(sort, value);
        return value;
      }
    }
    return set.size === 0 ? this.getSomeValue(sort) : null;
  }

  getFreshValue(sort: number): number | null {
    if (sort === SORT_BOOL || this.finiteSorts.has(sort)) return null;
    if (this.charFactory !== undefined && this.manager.isCharSort(sort))
      return this.manager.mkChar(this.charFactory.getFreshValue());
    if (this.seqFactory !== undefined && this.manager.getSortFamily(sort) === FAMILY_SEQ)
      return this.seqFactory.getFreshValue(sort);
    if (this.manager.isFpSort(sort) || this.manager.isRmSort(sort))
      return getManagerSomeValue(this.manager, sort);
    if (this.manager.isDatatypeSort(sort)) return this.getFreshDatatypeValue(sort);
    const set = this.getValueSet(sort);
    const start = this.nextValue.get(sort) ?? 0;
    const manager = this.manager;
    const maxSize =
      manager.isBvSort(sort) && manager.getBvSize(sort) < 32 ? 2 ** manager.getBvSize(sort) : -1;
    let next = start;
    for (;;) {
      const value = this.mkIndexedValue(next, sort);
      const isNew = !set.has(value);
      if (isNew) this.addValue(sort, value);
      next++;
      this.nextValue.set(sort, next);
      if (maxSize !== -1 && next > maxSize + start) return null;
      if (isNew) return value;
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

  getConstDecls(): readonly number[] {
    return this.constDecls;
  }

  getFuncDecls(): readonly number[] {
    return this.funcDecls;
  }

  getUninterpretedSorts() {
    return [...this.values.keys()].filter((sort) => this.manager.isUninterpretedSort(sort));
  }

  getKnownUniverse(sort: number): number[] {
    return [...(this.values.get(sort) ?? [])];
  }

  compress() {
    for (const decl of this.funcDecls) this.funcInterps.get(decl)?.compress();
  }

  completePartialFunc(decl: number, isUsingFresh: boolean) {
    const interp = this.funcInterps.get(decl);
    if (interp === undefined || !interp.isPartial()) return;
    const range = this.manager.funcDecls[decl].range;
    const fresh = isUsingFresh ? this.getFreshValue(range) : null;
    interp.setElse(fresh ?? interp.getMaxOccResult() ?? this.getSomeValue(range));
  }

  completePartialFuncs(isUsingFresh: boolean) {
    // get_some_value may register more declarations, which the loop then completes too.
    for (let index = 0; index < this.funcDecls.length; index++)
      this.completePartialFunc(this.funcDecls[index], isUsingFresh);
  }

  // cleanup_expr: replaces the uninterpreted constants in an else expression with their values. Like
  // Z3, it walks a todo stack, so it rewrites the last argument of a term first. The trail holds the
  // terms it rewrote until the next call.
  private cleanupExpr(trail: RefVector, expr: number, foundAuxDecls: ObjHashtable) {
    const manager = this.manager;
    trail.reset();
    const cache = new Map<number, number>();
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      if (manager.isUninterpretedConst(current)) {
        todo.pop();
        const decl = manager.decls[current];
        const existing = this.constInterps.get(decl);
        const value = existing ?? this.getSomeValue(manager.sorts[current]);
        if (existing === undefined) this.registerConst(decl, value);
        cache.set(current, value);
        continue;
      }
      if (manager.kinds[current] !== KIND_APP || manager.getNumArgs(current) === 0) {
        todo.pop();
        cache.set(current, current);
        continue;
      }
      const numTodo = todo.length;
      for (let index = 0; index < manager.getNumArgs(current); index++) {
        const arg = manager.getArg(current, index);
        if (!cache.has(arg)) todo.push(arg);
      }
      if (todo.length > numTodo) continue;
      todo.pop();
      const decl = manager.decls[current];
      if (this.auxDecls.has(decl)) foundAuxDecls.add(decl);
      const rewritten = manager.withTemporaries(() =>
        this.rewriter.mkApp(
          decl,
          manager.mapArgs(current, (arg) => cache.get(arg) ?? arg),
          manager.sorts[current],
        ),
      );
      if (rewritten === current) manager.decRef(rewritten);
      else trail.pushOwned(rewritten);
      cache.set(current, rewritten);
    }
    return cache.get(expr) ?? expr;
  }

  cleanup() {
    const manager = this.manager;
    const foundAuxDecls = new ObjHashtable((decl) => manager.getDeclHash(decl));
    const trail = new RefVector(manager);
    // Like Z3, it collects the interpretations before it cleans them up.
    const interps = Array.from(this.funcInterps, (entry) => entry[1]);
    for (const interp of interps)
      if (interp.elseExpr !== null)
        interp.setElse(this.cleanupExpr(trail, interp.elseExpr, foundAuxDecls));
    for (let index = 0; index < this.constDecls.length; index++) {
      const decl = this.constDecls[index];
      const value = this.constInterps.get(decl) as number;
      const cleaned = this.cleanupExpr(trail, value, foundAuxDecls);
      if (cleaned !== value) this.registerConst(decl, cleaned);
    }
    if (foundAuxDecls.size !== this.auxDecls.size) {
      this.funcDecls = this.funcDecls.filter(
        (decl) => !this.auxDecls.has(decl) || foundAuxDecls.has(decl),
      );
      for (const decl of this.auxDecls) if (!foundAuxDecls.has(decl)) this.unregisterDecl(decl);
      this.auxDecls = foundAuxDecls;
    }
    trail.reset();
  }

  // The last constant takes the place of a removed one.
  unregisterDecl(decl: number) {
    const value = this.constInterps.get(decl);
    if (value !== undefined) {
      const index = this.constDecls.indexOf(decl);
      this.constDecls[index] = this.constDecls[this.constDecls.length - 1];
      this.constDecls.pop();
      this.constInterps.delete(decl);
      this.manager.decDeclRef(decl);
      this.manager.decRef(value);
      return;
    }
    const interp = this.funcInterps.get(decl);
    if (interp === undefined) return;
    this.funcInterps.delete(decl);
    const index = this.funcDecls.indexOf(decl);
    if (index !== -1) this.funcDecls.splice(index, 1);
    this.manager.decDeclRef(decl);
    interp.release();
  }

  incRef() {
    this.refCount++;
  }

  decRef() {
    this.refCount--;
    if (this.refCount === 0) this.release();
  }

  // ~proto_model: the rewriter, the evaluator and the factories go before the interpretations, and
  // the user sort factory before the arith_factory.
  private release() {
    this.rewriter.release();
    this.evaluator.release();
    this.userSortValues.reset();
    this.arithValues.reset();
    this.bvValues.reset();
    this.datatypeValues.reset();
    this.enumeratedTerms.reset();
    for (const entry of this.constInterps) {
      this.manager.decDeclRef(entry[0]);
      this.manager.decRef(entry[1]);
    }
    for (const entry of this.funcInterps) {
      this.manager.decDeclRef(entry[0]);
      entry[1].release();
    }
  }

  mkModel() {
    const model = new ProtoModel(this.manager);
    model.isFinal = true;
    for (const entry of this.constInterps) model.registerConst(entry[0], entry[1]);
    for (const entry of this.funcInterps) {
      model.registerFunc(entry[0], entry[1]);
      this.manager.decDeclRef(entry[0]);
    }
    this.funcInterps.clear();
    this.funcDecls = [];
    for (const entry of this.values)
      if (!isArithSort(entry[0])) for (const value of entry[1]) model.registerValue(value);
    return model;
  }

  getSomeConstInterp(decl: number) {
    return this.constInterps.get(decl) ?? this.getSomeValue(this.manager.funcDecls[decl].range);
  }

  areEqual(first: number, second: number) {
    return first === second;
  }
}

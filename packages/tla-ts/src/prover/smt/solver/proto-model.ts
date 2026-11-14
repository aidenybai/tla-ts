// Ported from Z3 (src/smt/proto_model/proto_model.cpp, src/model/func_interp.cpp, src/model/value_factory.cpp, src/model/model_core.cpp, src/model/datatype_factory.cpp), MIT license, see z3-license.txt.
import { TermEnumeration } from "./term-enumeration";
import {
  type AstManager,
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_SEQ,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_BIT2BOOL,
  OP_EQ,
  OP_EXTRACT,
  OP_CONST_ARRAY,
  OP_ITE,
  OP_SEQ_TO_RE,
  OP_STORE,
  QUANTIFIER_LAMBDA,
  SORT_BOOL,
  isArithSort,
} from "./ast";
import {
  getDatatypeConstructors,
  getNonRecConstructor,
  isRecursiveDatatype,
} from "./datatype-decl-plugin";
import { mkArrayApp, mkAsArray } from "./array-decl-plugin";
import { mkFpNumeral, mkRmNumeral } from "./fpa-decl-plugin";
import { MPF_ROUND_TOWARD_ZERO, mkZero } from "./mpf";
import { RandomGen } from "./random-gen";
import { mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import { Rational } from "./rational";
import { ObjHashtable, ObjMap } from "./hashtable";
import { ModelEvaluator } from "./model-evaluator";
import { ExprSafeReplace } from "./expr-safe-replace";
import { RefVector } from "./ref-vector";
import { CharFactory, SeqFactory } from "./seq-factory";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { VarSubst } from "./var-subst";
import { mkBvApp } from "./bv-decl-plugin";

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

  copy() {
    const copied = new FuncInterp(this.manager, this.arity);
    for (const entry of this.entries) copied.insertNewEntry(entry.args, entry.result);
    if (this.elseExpr !== null) copied.setElse(this.elseExpr);
    return copied;
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

  // get_array_interp: an interpretation that is not ground becomes a lambda.
  getArrayInterp(decl: number) {
    const manager = this.manager;
    const elseExpr = this.elseExpr;
    if (elseExpr === null) return undefined;
    const domain = manager.funcDecls[decl].domain;
    const isGround =
      manager.isGround(elseExpr) &&
      this.entries.every(
        (entry) =>
          manager.isGround(entry.result) && entry.args.every((arg) => manager.isGround(arg)),
      );
    if (!isGround) {
      const interp = this.getInterp();
      if (interp === null) return undefined;
      const subst = new VarSubst(manager, false);
      const body = subst.apply(
        interp,
        domain.map((sort, index) => manager.mkVar(this.arity - index - 1, sort)),
      );
      const lambda = manager.mkQuantifier({
        kind: QUANTIFIER_LAMBDA,
        sorts: [...domain],
        names: domain.map((_, index) => index),
        body,
        patterns: [],
        noPatterns: [],
        weight: 0,
        qid: "",
      });
      manager.decRef(body);
      return lambda;
    }
    const sort = manager.mkArraySort([...domain, manager.sorts[elseExpr]]);
    return this.entries.reduce(
      (array, entry) =>
        entry.result === elseExpr
          ? array
          : mkArrayApp(manager, OP_STORE, [array, ...entry.args, entry.result]),
      mkArrayApp(manager, OP_CONST_ARRAY, [elseExpr], [sort]),
    );
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
  readonly funcInterps: ObjMap<FuncInterp>;
  private funcDecls: number[] = [];
  private auxDecls: ObjHashtable;
  private values = new Map<number, ObjHashtable>();
  // model_core::m_usort2universe: a universe registered as a whole keeps its order.
  private universes = new Map<number, number[]>();
  private userSortValues: RefVector;
  private arithValues: RefVector;
  private bvValues: RefVector;
  private datatypeValues: RefVector;
  private enumeratedTerms: RefVector;
  private freshEnumerations = new Map<number, TermEnumeration>();
  private nextValue = new Map<number, number>();
  // array_factory::m_ranges: the ranges whose fresh value an array's fresh value is waiting for.
  private freshArrayRanges: number[] = [];
  private finiteSorts = new Set<number>();
  private boolRandom: RandomGen;
  private evaluator: ModelEvaluator;
  private rewriter: Rewriter;
  private refCount = 0;
  // A model, rather than the proto_model it was made from, takes its values from the manager.
  private isFinal = false;
  private isCompact = false;
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

  // add_rec_funs: a recursive function without an interpretation takes its definition, whose
  // variables a function interpretation numbers from the first argument.
  addRecFuns() {
    const manager = this.manager;
    for (const entry of manager.macros)
      if (!this.constInterps.has(entry[0])) this.registerConst(entry[0], entry[1]);
    for (const def of manager.recFunDefs.values()) {
      if (def.rhs === -1 || this.constInterps.has(def.decl) || this.funcInterps.has(def.decl))
        continue;
      const domain = manager.funcDecls[def.decl].domain;
      if (domain.length === 0) {
        this.registerConst(def.decl, def.rhs);
        continue;
      }
      const subst = new ExprSafeReplace(manager);
      domain.forEach((sort, index) =>
        subst.insert(manager.mkVar(domain.length - index - 1, sort), manager.mkVar(index, sort)),
      );
      const body = subst.apply(def.rhs);
      subst.release();
      const interp = new FuncInterp(manager, domain.length);
      interp.setElse(body);
      manager.decRef(body);
      this.registerFunc(def.decl, interp);
    }
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

  eval(expr: number, isModelCompletion: boolean) {
    this.evaluator.setModelCompletion(isModelCompletion);
    return this.evaluator.rewrite(expr);
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
    if (manager.isArraySort(sort)) {
      const array = this.mkArrayInterp(sort);
      array.interp.setElse(this.getSomeValue(manager.getArrayRange(sort)));
      return array.value;
    }
    return this.mkValue(0, sort);
  }

  // array_factory::mk_array_interp: as-array of a fresh function, whose interpretation the caller
  // fills in.
  private mkArrayInterp(sort: number) {
    const manager = this.manager;
    const domain = manager.getSortParameters(sort).slice(0, -1);
    const decl = manager.mkFreshFuncDecl(null, domain, manager.getArrayRange(sort));
    const interp = new FuncInterp(manager, domain.length);
    this.registerFunc(decl, interp);
    const value = mkAsArray(manager, decl);
    this.addValue(sort, value);
    return { value, interp };
  }

  // array_factory::get_fresh_value. Z3 falls back to two fresh indexes when the range has no fresh
  // value; that case is left to the caller as a failure.
  private getFreshArrayValue(sort: number) {
    const manager = this.manager;
    if (this.getValueSet(sort).size === 0) return this.getSomeValue(sort);
    const range = manager.getArrayRange(sort);
    if (this.freshArrayRanges.includes(range)) return null;
    this.freshArrayRanges.push(range);
    const rangeValue = this.getFreshValue(range);
    this.freshArrayRanges.pop();
    if (rangeValue === null) return null;
    const array = this.mkArrayInterp(sort);
    array.interp.setElse(rangeValue);
    return array.value;
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
    if (this.manager.isArraySort(sort)) return this.getFreshArrayValue(sort);
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
    return [...(this.universes.get(sort) ?? this.values.get(sort) ?? [])];
  }

  registerUsort(sort: number, universe: number[]) {
    for (const value of universe) this.addValue(sort, value);
    this.universes.set(sort, [...universe]);
  }

  compress() {
    for (const decl of this.funcDecls) this.funcInterps.get(decl)?.compress();
  }

  // model::compress, which get-model and get-value apply, unlike the compress of a proto_model: it
  // inlines the skolem functions and the arrays that the other interpretations use, and drops the
  // skolem declarations that none uses.
  compact() {
    if (this.isCompact) return;
    const manager = this.manager;
    const getHash = (decl: number) => manager.getDeclHash(decl);
    for (;;) {
      const sort = new DeclTopSort();
      const occurCounts = new Map<number, number>();
      const collectDeps = (decl: number, exprs: number[]) => {
        const deps = new ObjHashtable(getHash);
        for (const expr of exprs)
          forEachExpr(manager, expr, (term) => {
            if (manager.kinds[term] !== KIND_APP) return;
            const termDecl = manager.decls[term];
            const used = isAsArray(manager, termDecl)
              ? manager.funcDecls[termDecl].parameters[0]
              : termDecl;
            if (!this.constInterps.has(used) && !this.funcInterps.has(used)) return;
            deps.add(used);
            occurCounts.set(used, (occurCounts.get(used) ?? 0) + 1);
          });
        sort.insert(decl, deps);
      };
      for (const [decl, interp] of this.funcInterps) {
        if (manager.recFunDefs.has(decl)) continue;
        interp.compress();
        collectDeps(decl, [
          ...(interp.elseExpr === null ? [] : [interp.elseExpr]),
          ...interp.entries.flatMap((entry) => [...entry.args, entry.result]),
        ]);
      }
      for (const [decl, value] of this.constInterps)
        if (!manager.recFunDefs.has(decl)) collectDeps(decl, [value]);
      sort.sort();
      const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
      for (const decl of sort.sorted) {
        const partition = sort.partitions.get(decl) as number;
        const cleanup = (expr: number) =>
          this.compactExpr(rewriter, expr, partition, sort.partitions, occurCounts);
        const value = this.constInterps.get(decl);
        if (value !== undefined) {
          const cleaned = cleanup(value);
          if (cleaned !== value) this.registerConst(decl, cleaned);
          manager.decRef(cleaned);
          continue;
        }
        const interp = this.funcInterps.get(decl);
        if (interp === undefined) continue;
        if (interp.elseExpr !== null) {
          const cleaned = cleanup(interp.elseExpr);
          interp.setElse(cleaned);
          manager.decRef(cleaned);
        }
        for (const entry of interp.entries) {
          const cleaned = cleanup(entry.result);
          if (cleaned !== entry.result) interp.insertEntry(entry.args, cleaned);
          manager.decRef(cleaned);
        }
      }
      rewriter.release();
      const occurrences = new Map<number, number>();
      const collectOccs = (expr: number) => {
        const decls = new Set<number>();
        forEachExpr(manager, expr, (term) => {
          if (manager.kinds[term] !== KIND_APP) return;
          const termDecl = manager.decls[term];
          decls.add(termDecl);
          if (isAsArray(manager, termDecl) || isArrayMap(manager, termDecl))
            decls.add(manager.funcDecls[termDecl].parameters[0]);
        });
        for (const decl of decls) occurrences.set(decl, (occurrences.get(decl) ?? 0) + 1);
      };
      for (const decl of sort.sorted) {
        const value = this.constInterps.get(decl);
        const interp = this.funcInterps.get(decl);
        if (value !== undefined) collectOccs(value);
        else if (interp !== undefined) {
          if (interp.elseExpr !== null) collectOccs(interp.elseExpr);
          for (const entry of interp.entries) {
            collectOccs(entry.result);
            for (const arg of entry.args) collectOccs(arg);
          }
        }
      }
      const removed = sort.sorted.filter(
        (decl) => manager.funcDecls[decl].isSkolem && !occurrences.has(decl),
      );
      for (const decl of removed) this.unregisterDecl(decl);
      if (removed.length === 0) break;
    }
    this.isCompact = true;
  }

  // can_inline_def: an interpretation that more than one other uses is inlined when it is small.
  private canInlineDef(decl: number, occurCounts: Map<number, number>) {
    if ((occurCounts.get(decl) ?? 0) <= 1) return true;
    const interp = this.funcInterps.get(decl);
    if (interp === undefined || interp.elseExpr === null) return false;
    const subterms = new Set<number>();
    const todo = [interp.elseExpr];
    while (todo.length > 0) {
      if (interp.entries.length + subterms.size > 8) return false;
      const expr = todo.pop() as number;
      if (subterms.has(expr)) continue;
      subterms.add(expr);
      if (this.manager.kinds[expr] === KIND_APP) todo.push(...this.manager.getArgs(expr));
      else if (this.manager.kinds[expr] === KIND_QUANTIFIER)
        todo.push(this.manager.getQuantifier(expr).body);
    }
    return true;
  }

  // model::cleanup_expr: the result comes with a reference, which the caller releases.
  private compactExpr(
    rewriter: Rewriter,
    expr: number,
    partition: number,
    partitions: Map<number, number>,
    occurCounts: Map<number, number>,
  ) {
    const manager = this.manager;
    const trail = new RefVector(manager);
    const cache = new Map<number, number>();
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      // A numeral carries its value, so the rewriter keeps every constant as it is.
      if (
        manager.kinds[current] !== KIND_APP ||
        (manager.getNumArgs(current) === 0 && !isAsArray(manager, manager.decls[current]))
      ) {
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
      const funcDecl = manager.funcDecls[decl];
      const args = manager.mapArgs(current, (arg) => cache.get(arg) as number);
      const arrayDecl = isAsArray(manager, decl) ? funcDecl.parameters[0] : -1;
      const interp = this.funcInterps.get(arrayDecl === -1 ? decl : arrayDecl);
      const result = manager.withTemporaries(() => {
        if (arrayDecl !== -1 && interp !== undefined && this.canInlineDef(arrayDecl, occurCounts)) {
          const arrayInterp = interp.getArrayInterp(arrayDecl);
          if (arrayInterp !== undefined) return arrayInterp;
        }
        if (
          arrayDecl === -1 &&
          funcDecl.isSkolem &&
          interp !== undefined &&
          this.canInlineDef(decl, occurCounts) &&
          interp.getInterp() !== null &&
          partitions.get(decl) !== partition
        ) {
          const subst = new VarSubst(manager, false);
          const substituted = subst.apply(interp.getInterp() as number, args);
          subst.release();
          manager.releaseLater(substituted);
          return substituted;
        }
        if (funcDecl.family === FAMILY_BV && funcDecl.op === OP_BIT2BOOL) {
          const index = funcDecl.parameters[0];
          return manager.mkEq(
            mkBvApp(manager, OP_EXTRACT, [args[0]], [index, index]),
            manager.mkBvNumeral(1n, 1),
          );
        }
        return rewriter.mkApp(decl, args, manager.sorts[current]);
      });
      trail.pushOwned(result);
      cache.set(current, result);
    }
    const result = rewriter.rewrite(cache.get(expr) as number);
    trail.reset();
    return result;
  }

  completePartialFunc(decl: number, isUsingFresh: boolean) {
    const interp = this.funcInterps.get(decl);
    if (interp === undefined || !interp.isPartial()) return;
    const range = this.manager.funcDecls[decl].range;
    const fresh = isUsingFresh ? this.getFreshValue(range) : null;
    interp.setElse(fresh ?? interp.getMaxOccResult() ?? this.getSomeValue(range));
  }

  completePartialFuncs(isUsingFresh: boolean) {
    for (let index = 0; index < this.funcDecls.length; index++)
      this.completePartialFunc(this.funcDecls[index], isUsingFresh);
  }

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

  copy() {
    const model = new ProtoModel(this.manager);
    model.isFinal = this.isFinal;
    for (const decl of this.constDecls)
      model.registerConst(decl, this.constInterps.get(decl) as number);
    for (const decl of this.funcDecls)
      model.registerFunc(decl, (this.funcInterps.get(decl) as FuncInterp).copy());
    for (const sort of this.getUninterpretedSorts())
      model.registerUsort(sort, this.getKnownUniverse(sort));
    return model;
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
      if (this.manager.isUninterpretedSort(entry[0]))
        model.registerUsort(entry[0], this.getKnownUniverse(entry[0]));
      else if (!isArithSort(entry[0])) for (const value of entry[1]) model.registerValue(value);
    return model;
  }

  getSomeConstInterp(decl: number) {
    return this.constInterps.get(decl) ?? this.getSomeValue(this.manager.funcDecls[decl].range);
  }
}

const isAsArray = (manager: AstManager, decl: number) =>
  manager.funcDecls[decl].family === FAMILY_ARRAY && manager.funcDecls[decl].op === OP_AS_ARRAY;

const isArrayMap = (manager: AstManager, decl: number) =>
  manager.funcDecls[decl].family === FAMILY_ARRAY && manager.funcDecls[decl].op === OP_ARRAY_MAP;

// for_each_expr: each distinct subterm, after its arguments.
const forEachExpr = (manager: AstManager, expr: number, visit: (term: number) => void) => {
  const visited = new Set<number>();
  const walk = (term: number) => {
    if (visited.has(term)) return;
    visited.add(term);
    if (manager.kinds[term] === KIND_APP) for (const arg of manager.getArgs(term)) walk(arg);
    else if (manager.kinds[term] === KIND_QUANTIFIER) walk(manager.getQuantifier(term).body);
    visit(term);
  };
  walk(expr);
};

// top_sort: each declaration comes after the ones its interpretation uses. Like Z3's, it never pops
// the path stack, so the declarations of a cycle get partitions of their own.
class DeclTopSort {
  readonly sorted: number[] = [];
  readonly partitions = new Map<number, number>();
  private deps = new Map<number, ObjHashtable>();
  private dfsNums = new Map<number, number>();
  private stackS: number[] = [];
  private stackP: number[] = [];

  insert(decl: number, deps: ObjHashtable) {
    this.deps.set(decl, deps);
  }

  sort() {
    for (const decl of this.deps.keys()) this.traverse(decl);
  }

  private traverse(decl: number) {
    const dfsNum = this.dfsNums.get(decl);
    if (dfsNum !== undefined) {
      if (this.partitions.has(decl)) return;
      for (
        let top = this.stackP.at(-1);
        top !== undefined && (this.partitions.get(top) ?? -1) > dfsNum;
        top = this.stackP.at(-1)
      )
        this.stackP.pop();
      return;
    }
    const deps = this.deps.get(decl);
    if (deps === undefined) return;
    this.dfsNums.set(decl, this.dfsNums.size);
    this.stackS.push(decl);
    this.stackP.push(decl);
    for (const dep of deps) this.traverse(dep);
    if (decl !== this.stackP.at(-1)) return;
    const partition = this.sorted.length;
    for (let top = this.stackS.pop(); top !== undefined; top = this.stackS.pop()) {
      this.sorted.push(top);
      this.partitions.set(top, partition);
      if (top === decl) break;
    }
    this.stackP.pop();
  }
}

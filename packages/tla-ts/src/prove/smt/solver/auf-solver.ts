// Ported from Z3 (src/smt/smt_model_finder.cpp), MIT license, see z3-license.txt. The instantiation
// sets and the AUF solver of the model finder: the solver groups the argument positions and
// variables that must share an instantiation set, and each group gets a projection function that
// maps any value to the value of a term in its set.
import {
  OP_ADD,
  OP_ITE,
  OP_LT,
  OP_SUB,
  SORT_BOOL,
  SORT_INT,
  isArithSort,
  type AstManager,
} from "./ast";
import { ObjMap } from "./hashtable";
import { FuncInterp, RandomGen, type ProtoModel } from "./proto-model";
import { Rewriter } from "./rewriter";

export type Evaluate = (expr: number) => number | null;

// instantiation_set: the S_{k,j} sets of the paper, with the generation of each term.
export class InstantiationSet {
  readonly elems: ObjMap<number>;
  readonly inv: ObjMap<number>;

  constructor(private manager: AstManager) {
    const getHash = (expr: number) => manager.hashes[expr];
    this.elems = new ObjMap(getHash);
    this.inv = new ObjMap(getHash);
  }

  insert(expr: number, generation: number) {
    if (this.elems.has(expr) || this.manager.containsModelValue(expr)) return;
    this.elems.set(expr, generation);
  }

  remove(expr: number) {
    this.elems.delete(expr);
  }

  getInv(value: number, model: ProtoModel) {
    const term = this.inv.get(value);
    if (term !== undefined) return term;
    for (const entry of this.inv) if (model.areEqual(entry[0], value)) return entry[1];
    return undefined;
  }

  getGeneration(term: number) {
    return this.elems.get(term) ?? 0;
  }

  mkInverse(evaluate: Evaluate) {
    for (const entry of this.elems) {
      const value = evaluate(entry[0]);
      if (value === null) break;
      const old = this.inv.get(value);
      if (old === undefined || entry[1] < (this.elems.get(old) ?? 0)) this.inv.set(value, entry[0]);
    }
  }
}

// node: a set of argument positions and variables that share an instantiation set.
export class Node {
  private find: Node | null = null;
  private eqcSize = 1;
  private isMono = false;
  private avoidSet: Node[] = [];
  private exceptions: number[] = [];
  private set: InstantiationSet | null = null;
  private elseExpr: number | null = null;
  private proj: number | null = null;

  constructor(
    readonly id: number,
    readonly sort: number,
  ) {}

  isRoot() {
    return this.find === null;
  }

  getRoot(): Node {
    return this.find === null ? this : this.find.getRoot();
  }

  merge(other: Node) {
    let first = this.getRoot();
    let second = other.getRoot();
    if (first === second) return;
    if (first.eqcSize > second.eqcSize) [first, second] = [second, first];
    first.find = second;
    second.eqcSize += first.eqcSize;
    second.isMono = second.isMono || first.isMono;
    second.avoidSet = appendNew(second.avoidSet, first.avoidSet);
    second.exceptions = appendNew(second.exceptions, first.exceptions);
  }

  insertAvoid(node: Node) {
    const root = this.getRoot();
    if (!root.avoidSet.includes(node)) root.avoidSet.push(node);
  }

  insertException(expr: number) {
    const root = this.getRoot();
    if (!root.exceptions.includes(expr)) root.exceptions.push(expr);
  }

  setMonoProj() {
    this.getRoot().isMono = true;
  }

  isMonoProj() {
    return this.getRoot().isMono;
  }

  mkInstantiationSet(manager: AstManager) {
    this.set = new InstantiationSet(manager);
  }

  // Only closed terms join the set.
  insert(manager: AstManager, expr: number, generation: number) {
    if (manager.isGround(expr)) this.getRoot().set?.insert(expr, generation);
  }

  getInstantiationSet() {
    const set = this.getRoot().set;
    if (set === null) throw new Error("the instantiation set was not created");
    return set;
  }

  getExceptions() {
    return this.getRoot().exceptions;
  }

  getAvoidSet() {
    return this.getRoot().avoidSet;
  }

  setElse(expr: number) {
    this.getRoot().elseExpr = expr;
  }

  getElse() {
    return this.getRoot().elseExpr;
  }

  setProj(decl: number) {
    this.getRoot().proj = decl;
  }

  getProj() {
    return this.getRoot().proj;
  }
}

const appendNew = <T>(target: T[], source: T[]) => {
  if (source.length === 0) return target;
  if (target.length === 0) return source;
  for (const item of source) if (!target.includes(item)) target.push(item);
  return target;
};

interface AFINode {
  decl: number;
  index: number;
  node: Node;
}

// auf_solver: the "almost uninterpreted fragment" of the paper.
export class AufSolver {
  private nodes: Node[] = [];
  private uvars = new Map<string, Node>();
  private aFIs = new Map<string, AFINode>();
  private sort2k = new Map<number, number>();
  private model: ProtoModel | null = null;
  private evalCache = [new Map<number, number | null>(), new Map<number, number | null>()];
  private rootNodes: Node[] = [];
  private newConstraints: number[] = [];
  private random = new RandomGen(0);
  constructor(
    private manager: AstManager,
    readonly rewriter: Rewriter,
  ) {}

  reset() {
    this.nodes = [];
    this.uvars.clear();
    this.aFIs.clear();
    this.rootNodes = [];
    this.sort2k.clear();
  }

  setModel(model: ProtoModel) {
    this.resetEvalCache();
    this.model = model;
  }

  private getModel() {
    if (this.model === null) throw new Error("the model finder has no model");
    return this.model;
  }

  private resetEvalCache() {
    this.evalCache[0].clear();
    this.evalCache[1].clear();
  }

  private mkNode(key: string, map: Map<string, Node>, sort: number) {
    const existing = map.get(key);
    if (existing !== undefined) return existing;
    const node = new Node(this.nodes.length, sort);
    map.set(key, node);
    this.nodes.push(node);
    return node;
  }

  getUvar(quantifier: number, index: number) {
    const sorts = this.manager.getQuantifier(quantifier).sorts;
    return this.mkNode(`${quantifier}:${index}`, this.uvars, sorts[sorts.length - index - 1]);
  }

  getAFI(decl: number, index: number) {
    const key = `${decl}:${index}`;
    const existing = this.aFIs.get(key);
    if (existing !== undefined) return existing.node;
    const node = new Node(this.nodes.length, this.manager.funcDecls[decl].domain[index]);
    this.nodes.push(node);
    this.aFIs.set(key, { decl, index, node });
    return node;
  }

  getUvarInstSet(quantifier: number, index: number) {
    return this.uvars.get(`${quantifier}:${index}`)?.getInstantiationSet() ?? null;
  }

  mkInstantiationSets() {
    for (const node of this.nodes) if (node.isRoot()) node.mkInstantiationSet(this.manager);
  }

  // cleanup_instantiation_sets: drops the terms that do not evaluate to values.
  private cleanupInstantiationSets() {
    const manager = this.manager;
    for (const node of this.nodes) {
      if (!node.isRoot()) continue;
      const set = node.getInstantiationSet();
      const toDelete: number[] = [];
      for (const term of set.elems.keys()) {
        const value = this.eval(term, true);
        if (value === null || !manager.isUniqueValue(value)) toDelete.push(term);
      }
      for (const term of toDelete) set.remove(term);
      this.resetEvalCache();
    }
  }

  eval(expr: number, isModelCompletion: boolean) {
    const cache = this.evalCache[isModelCompletion ? 1 : 0];
    const cached = cache.get(expr);
    if (cached !== undefined) return cached;
    const result = this.getModel().eval(expr, isModelCompletion);
    cache.set(expr, result);
    return result;
  }

  private collectExceptionsValues(node: Node) {
    const result: number[] = [];
    for (const expr of node.getExceptions()) {
      const value = this.eval(expr, true);
      if (value !== null) result.push(value);
    }
    for (const avoid of node.getAvoidSet()) {
      const root = avoid.getRoot();
      const elseExpr = root.getElse();
      if (!root.isMonoProj() && elseExpr !== null) {
        const value = this.eval(elseExpr, true);
        if (value !== null) result.push(value);
      }
    }
    return result;
  }

  private areDistinct(first: number, second: number) {
    const manager = this.manager;
    return first !== second && manager.isUniqueValue(first) && manager.isUniqueValue(second);
  }

  // pick_instance_diff_exceptions: the term of least generation whose value differs from every
  // exception.
  private pickInstanceDiffExceptions(node: Node, exceptionValues: number[]) {
    let result: number | null = null;
    let resultGeneration = Number.POSITIVE_INFINITY;
    for (const entry of node.getInstantiationSet().elems) {
      const value = this.eval(entry[0], true);
      if (value === null) return result;
      const isFound = exceptionValues.some((other) => !this.areDistinct(value, other));
      if (!isFound && (result === null || entry[1] < resultGeneration)) {
        result = entry[0];
        resultGeneration = entry[1];
      }
    }
    return result;
  }

  // Uninterpreted sorts are not assumed infinite in benchmarks with quantifiers.
  private isInfinite(sort: number) {
    return isArithSort(sort);
  }

  private getKFor(sort: number) {
    const existing = this.sort2k.get(sort);
    if (existing !== undefined) return existing;
    const created = this.manager.mkFreshConst("k", sort);
    this.getModel().registerAuxDecl(this.manager.decls[created]);
    this.sort2k.set(sort, created);
    return created;
  }

  private getKInterp(k: number) {
    const model = this.getModel();
    const decl = this.manager.decls[k];
    const existing = model.constInterps.get(decl);
    if (existing !== undefined) return existing;
    const fresh = model.getFreshValue(this.manager.sorts[k]);
    if (fresh === null) return null;
    model.registerConst(decl, fresh);
    return fresh;
  }

  private assertKDiseqExceptions(k: number, exceptions: number[]) {
    const kValue = this.getKInterp(k);
    if (kValue === null) return false;
    for (const exception of exceptions) {
      const value = this.eval(exception, true);
      // The constraint cannot go into the context while the model is built, so it waits for the
      // next restart.
      if (value !== null && !this.areDistinct(kValue, value))
        this.newConstraints.push(this.manager.mkNot(this.manager.mkEq(k, exception)));
    }
    return true;
  }

  private setProjectionElse(node: Node) {
    const set = node.getInstantiationSet();
    const exceptions = node.getExceptions();
    if (set.elems.size === 0) return;
    if (exceptions.length > 0 || node.getAvoidSet().length > 0) {
      const picked = this.pickInstanceDiffExceptions(node, this.collectExceptionsValues(node));
      if (picked !== null) {
        node.setElse(picked);
        return;
      }
      if (this.isInfinite(node.sort)) {
        const k = this.getKFor(node.sort);
        if (this.assertKDiseqExceptions(k, exceptions)) {
          node.insert(this.manager, k, 0);
          node.setElse(k);
          return;
        }
      }
    }
    node.setElse(set.elems.keys().next().value ?? 0);
  }

  // add_mono_exceptions: e - 1 and e + 1 join the set for each integer exception e.
  private addMonoExceptions(node: Node) {
    if (node.sort !== SORT_INT) return;
    const rewriter = this.rewriter;
    const one = this.manager.mkNumeral(1n);
    for (const exception of node.getExceptions()) {
      const minusOne = rewriter.mkAppCore(OP_SUB, [exception, one], SORT_INT);
      const plusOne = rewriter.mkAppCore(OP_ADD, [exception, one], SORT_INT);
      node.insert(this.manager, plusOne, 0);
      node.insert(this.manager, minusOne, 0);
    }
  }

  private getInstantiationSetValues(node: Node) {
    const manager = this.manager;
    const values: number[] = [];
    const found = new Set<number>();
    for (const term of node.getInstantiationSet().elems.keys()) {
      const value = this.eval(term, true);
      if (value === null) continue;
      const isFound = !manager.isUniqueValue(value) && values.includes(value);
      if (!isFound && !found.has(value)) {
        values.push(value);
        found.add(value);
      }
    }
    return values;
  }

  private mkMonoProj(node: Node) {
    const manager = this.manager;
    this.addMonoExceptions(node);
    const values = this.getInstantiationSetValues(node);
    if (values.length === 0) return;
    if (!isArithSort(node.sort) || !values.every((value) => manager.isNumeral(value))) return;
    values.sort((first, second) =>
      manager.getRationalValue(first).compare(manager.getRationalValue(second)),
    );
    const variable = manager.mkVar(0, node.sort);
    let projection = values[values.length - 1];
    for (let index = values.length - 1; index >= 1; index--)
      projection = manager.mkApp(
        OP_ITE,
        [manager.mkApp(OP_LT, [variable, values[index]], SORT_BOOL), values[index - 1], projection],
        node.sort,
      );
    const interp = new FuncInterp(manager, 1);
    interp.setElse(projection);
    const decl = manager.mkFreshFuncDecl(null, [node.sort], node.sort);
    this.getModel().registerAuxDecl(decl, interp);
    node.setProj(decl);
  }

  private mkSimpleProj(node: Node) {
    const manager = this.manager;
    this.setProjectionElse(node);
    const values = this.getInstantiationSetValues(node);
    const decl = manager.mkFreshFuncDecl(null, [node.sort], node.sort);
    const interp = new FuncInterp(manager, 1);
    this.getModel().registerAuxDecl(decl, interp);
    const elseExpr = node.getElse();
    if (elseExpr !== null) {
      const elseValue = this.eval(elseExpr, true);
      if (elseValue !== null) interp.setElse(elseValue);
    }
    for (const value of values) interp.insertNewEntry([value], value);
    node.setProj(decl);
  }

  private collectPartialFuncs() {
    const model = this.getModel();
    const result: number[] = [];
    for (const entry of this.aFIs.values()) {
      if (result.includes(entry.decl)) continue;
      let interp = model.funcInterps.get(entry.decl);
      if (interp === undefined) {
        interp = new FuncInterp(this.manager, this.manager.funcDecls[entry.decl].domain.length);
        model.registerFunc(entry.decl, interp);
      }
      if (interp.isPartial()) result.push(entry.decl);
    }
    return result;
  }

  // mk_sorts_finite: every uninterpreted sort gets a finite universe.
  private mkSortsFinite() {
    const model = this.getModel();
    for (const node of this.rootNodes)
      if (this.manager.isUninterpretedSort(node.sort) && !model.isFinite(node.sort))
        model.freezeUniverse(node.sort);
  }

  private addElemToEmptyInstSets() {
    const manager = this.manager;
    const sort2elems = new Map<number, number>();
    const needFresh: Node[] = [];
    for (const node of this.rootNodes) {
      const elems = node.getInstantiationSet().elems;
      if (elems.size === 0) {
        if (manager.isUninterpretedSort(node.sort)) needFresh.push(node);
        else node.insert(manager, this.getModel().getSomeValue(node.sort), 0);
      } else sort2elems.set(node.sort, elems.keys().next().value ?? 0);
    }
    for (const node of needFresh) {
      let elem = sort2elems.get(node.sort);
      if (elem === undefined) {
        elem = manager.mkFreshConst("elem", node.sort);
        sort2elems.set(node.sort, elem);
      }
      node.insert(manager, elem, 0);
    }
  }

  private collectRootNodes() {
    this.rootNodes = this.nodes.filter((node) => node.isRoot());
  }

  private getFIProj(decl: number, index: number) {
    return this.aFIs.get(`${decl}:${index}`)?.node.getProj() ?? null;
  }

  private completePartialFuncs(partialFuncs: number[]) {
    const manager = this.manager;
    const model = this.getModel();
    for (const decl of partialFuncs) {
      model.completePartialFunc(decl, true);
      const interp = model.funcInterps.get(decl);
      if (interp === undefined || interp.isConstant()) continue;
      const data = manager.funcDecls[decl];
      let hasProj = false;
      const args = data.domain.map((sort, index) => {
        const variable = manager.mkVar(index, sort);
        const proj = this.getFIProj(decl, index);
        if (proj === null) return variable;
        hasProj = true;
        return manager.mkApp(proj, [variable], sort);
      });
      if (!hasProj) continue;
      const auxDecl = manager.mkFreshFuncDecl(data.name, data.domain, data.range);
      const newInterp = new FuncInterp(manager, data.domain.length);
      newInterp.setElse(manager.mkApp(auxDecl, args, data.range));
      model.reregisterDecl(decl, newInterp, auxDecl);
    }
  }

  private mkInverses() {
    const offset = this.random.next();
    const count = this.rootNodes.length;
    for (let index = count - 1; index >= 0; index--)
      this.rootNodes[(index + offset) % count]
        .getInstantiationSet()
        .mkInverse((expr) => this.eval(expr, true));
  }

  fixModel(newConstraints: number[]) {
    this.cleanupInstantiationSets();
    this.newConstraints = newConstraints;
    const partialFuncs = this.collectPartialFuncs();
    this.resetEvalCache();
    this.collectRootNodes();
    this.addElemToEmptyInstSets();
    this.mkSortsFinite();
    for (const node of this.rootNodes) {
      if (node.isMonoProj()) this.mkMonoProj(node);
      else this.mkSimpleProj(node);
    }
    this.mkInverses();
    this.completePartialFuncs(partialFuncs);
  }

  isDefaultRepresentative(term: number) {
    return this.sort2k.get(this.manager.sorts[term]) === term;
  }
}

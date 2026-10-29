// Ported from Z3 (src/smt/smt_model_finder.cpp, src/ast/macros/quantifier_macro_info.cpp), MIT
// license, see z3-license.txt. Completes the model of the ground formulas so that it may satisfy
// the universal quantifiers, following "Complete instantiation for quantified SMT formulas": the
// quantifier analyzer collects how the variables occur, the AUF solver groups the argument
// positions and variables that must share an instantiation set, and each group gets a projection
// function that maps any value to the value of a term in its set.
import {
  KIND_APP,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_XOR,
  FAMILY_BASIC,
  FAMILY_USER,
  SORT_BOOL,
  SORT_INT,
  type AstManager,
} from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { Context } from "./context";
import { L_TRUE } from "./lbool";
import { collectMacroCandidates, solveMacros } from "./model-macro-solver";
import { FuncInterp, RandomGen, type ProtoModel } from "./proto-model";
import { pullQuant } from "./pull-quant";
import { Rewriter } from "./rewriter";

type Evaluate = (expr: number) => number | null;

// instantiation_set: the S_{k,j} sets of the paper, with the generation of each term.
export class InstantiationSet {
  readonly elems = new Map<number, number>();
  readonly inv = new Map<number, number>();

  constructor(private manager: AstManager) {}

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
class Node {
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
    return sort === SORT_INT;
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
    const one = this.manager.mkNumeral(1);
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
    if (node.sort !== SORT_INT || !values.every((value) => manager.isNumeral(value))) return;
    values.sort((first, second) => manager.values[first] - manager.values[second]);
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
    const decl = manager.mkFreshFuncDecl("pi", [node.sort], node.sort, false);
    this.getModel().registerAuxDecl(decl, interp);
    node.setProj(decl);
  }

  private mkSimpleProj(node: Node) {
    const manager = this.manager;
    this.setProjectionElse(node);
    const values = this.getInstantiationSetValues(node);
    const decl = manager.mkFreshFuncDecl("pi", [node.sort], node.sort, false);
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
      const auxDecl = manager.mkFreshFuncDecl(data.name, data.domain, data.range, false);
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

// smt_params' mbqi_force_template: macros of quantifiers with at least this weight are used even
// in the AUF fragment.
const MBQI_FORCE_TEMPLATE = 10;

// qinfo: a bit of information about how a variable occurs in a quantifier.
type QInfo =
  | { kind: "f_var"; decl: number; argIndex: number; varIndex: number }
  | { kind: "f_var_plus_offset"; decl: number; argIndex: number; varIndex: number; offset: number }
  | { kind: "x_eq_y" | "x_neq_y" | "x_leq_y"; first: number; second: number }
  | { kind: "x_eq_t" | "x_neq_t" | "x_gle_t"; varIndex: number; term: number };

const isSameQInfo = (first: QInfo, second: QInfo) =>
  JSON.stringify(first) === JSON.stringify(second);

const mkVarPair = (kind: "x_eq_y" | "x_neq_y" | "x_leq_y", first: number, second: number): QInfo =>
  first > second ? { kind, first: second, second: first } : { kind, first, second };

// quantifier_info: what the analyzer learned about one quantifier.
export class QuantifierInfo {
  readonly flatQ: number;
  qinfos: QInfo[] = [];
  isAuf = true;
  hasXEqY = false;
  readonly ngDecls = new Set<number>();
  theOne: number | null = null;
  private uvarInstSets: (InstantiationSet | null)[] | null = null;
  readonly condMacros;

  constructor(
    private manager: AstManager,
    private context: Context,
    readonly quantifier: number,
  ) {
    this.flatQ = manager.hasQuantifierFlags[manager.getQuantifier(quantifier).body]
      ? pullQuant(manager, quantifier)
      : quantifier;
    this.condMacros = collectMacroCandidates(manager, this.flatQ);
  }

  insertQInfo(info: QInfo) {
    if (!this.qinfos.some((other) => isSameQInfo(other, info))) this.qinfos.push(info);
  }

  processAuf(solver: AufSolver) {
    const flatQ = this.flatQ;
    const numDecls = this.manager.getQuantifier(flatQ).sorts.length;
    for (let index = 0; index < numDecls; index++) solver.getUvar(flatQ, index);
    for (const info of this.qinfos) {
      switch (info.kind) {
        case "f_var":
          solver.getAFI(info.decl, info.argIndex).merge(solver.getUvar(flatQ, info.varIndex));
          break;
        case "f_var_plus_offset":
          solver.getAFI(info.decl, info.argIndex);
          solver.getUvar(flatQ, info.varIndex);
          break;
        case "x_eq_y": {
          const first = solver.getUvar(flatQ, info.first);
          const second = solver.getUvar(flatQ, info.second);
          first.insertAvoid(second);
          if (first !== second) second.insertAvoid(first);
          break;
        }
        case "x_neq_y":
          solver.getUvar(flatQ, info.first).merge(solver.getUvar(flatQ, info.second));
          break;
        case "x_leq_y": {
          const first = solver.getUvar(flatQ, info.first);
          first.merge(solver.getUvar(flatQ, info.second));
          first.setMonoProj();
          break;
        }
        case "x_eq_t":
          solver.getUvar(flatQ, info.varIndex).insertException(info.term);
          break;
        case "x_neq_t":
          solver.getUvar(flatQ, info.varIndex);
          break;
        case "x_gle_t":
          solver.getUvar(flatQ, info.varIndex).setMonoProj();
          break;
      }
    }
  }

  private populateFVar(node: Node, decl: number, argIndex: number) {
    const context = this.context;
    for (const enode of context.enodesOf(decl))
      if (context.isRelevant(enode.owner)) {
        const arg = enode.args[argIndex];
        node.insert(this.manager, arg.owner, arg.generation);
      }
  }

  populateInstSets(solver: AufSolver) {
    const manager = this.manager;
    const context = this.context;
    const flatQ = this.flatQ;
    const sorts = manager.getQuantifier(flatQ).sorts;
    for (const info of this.qinfos) {
      switch (info.kind) {
        case "f_var":
          this.populateFVar(solver.getAFI(info.decl, info.argIndex), info.decl, info.argIndex);
          break;
        case "f_var_plus_offset": {
          const aFI = solver.getAFI(info.decl, info.argIndex).getRoot();
          const sJ = solver.getUvar(flatQ, info.varIndex).getRoot();
          if (aFI === sJ) {
            // There is no finite fixpoint, so the arguments minus the offset join the set.
            for (const enode of context.enodesOf(info.decl))
              if (context.isRelevant(enode.owner)) {
                const arg = enode.args[info.argIndex];
                sJ.insert(
                  manager,
                  solver.rewriter.mkAppCore(OP_SUB, [arg.owner, info.offset], SORT_INT),
                  arg.generation,
                );
              }
          } else {
            this.populateFVar(aFI, info.decl, info.argIndex);
            if (aFI.isMonoProj()) sJ.setMonoProj();
            if (sJ.isMonoProj()) aFI.setMonoProj();
          }
          break;
        }
        case "x_eq_t": {
          const sort = sorts[sorts.length - info.varIndex - 1];
          if (manager.isUninterpretedSort(sort)) {
            // Every term of the sort joins the set, see Section 4.1 of the paper.
            const node = solver.getUvar(flatQ, info.varIndex);
            for (const enode of context.enodes)
              if (context.isRelevant(enode.owner) && manager.sorts[enode.owner] === sort)
                node.insert(manager, enode.owner, enode.generation);
          }
          break;
        }
        case "x_neq_t":
        case "x_gle_t":
          solver.getUvar(flatQ, info.varIndex).insert(manager, info.term, 0);
          break;
        default:
          break;
      }
    }
    // The second pass for the offsets: A_f_i - k is in S_j and S_j + k is in A_f_i.
    for (const info of this.qinfos) {
      if (info.kind !== "f_var_plus_offset") continue;
      const aFI = solver.getAFI(info.decl, info.argIndex).getRoot();
      const sJ = solver.getUvar(flatQ, info.varIndex).getRoot();
      if (aFI === sJ) continue;
      this.copyInstances(solver.rewriter, aFI, sJ, info.offset, false);
      this.copyInstances(solver.rewriter, sJ, aFI, info.offset, true);
    }
  }

  private copyInstances(rewriter: Rewriter, from: Node, to: Node, offset: number, isPlus: boolean) {
    for (const entry of from.getInstantiationSet().elems)
      to.insert(
        this.manager,
        rewriter.mkAppCore(isPlus ? OP_ADD : OP_SUB, [entry[0], offset], SORT_INT),
        entry[1],
      );
  }

  // populate_macro_based_inst_sets: the sets of a quantifier that a macro satisfies.
  getMacroBasedInstSet(varIndex: number, evaluate: Evaluate) {
    const theOne = this.theOne;
    if (theOne === null) return null;
    if (this.uvarInstSets === null) {
      const sets: (InstantiationSet | null)[] = [];
      for (const info of this.qinfos) {
        if (info.kind !== "f_var" || info.decl !== theOne) continue;
        const set = sets[info.varIndex] ?? new InstantiationSet(this.manager);
        sets[info.varIndex] = set;
        for (const enode of this.context.enodesOf(info.decl))
          if (this.context.isRelevant(enode.owner)) {
            const arg = enode.args[info.argIndex];
            set.insert(arg.owner, arg.generation);
          }
      }
      for (const set of sets) set?.mkInverse(evaluate);
      this.uvarInstSets = sets;
    }
    return this.uvarInstSets[varIndex] ?? null;
  }

  resetTheOne() {
    this.theOne = null;
    this.uvarInstSets = null;
  }
}

type Polarity = "pos" | "neg";

// quantifier_analyzer.
// One analyzer runs per quantifier and records what it learns in the quantifier's info.
class QuantifierAnalyzer {
  private posCache = new Set<number>();
  private negCache = new Set<number>();
  private ftodo: [number, Polarity][] = [];
  private ttodo: number[] = [];

  constructor(
    private manager: AstManager,
    private rewriter: Rewriter,
    private info: QuantifierInfo,
  ) {}

  private isGround(expr: number) {
    return this.manager.isGround(expr);
  }

  private isVar(expr: number) {
    return this.manager.kinds[expr] === KIND_VAR;
  }

  // poly_rewriter::is_var_plus_ground.
  private isVarPlusGround(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ADD || this.isGround(expr)) return undefined;
    const args: number[] = [];
    let variable: number | undefined;
    let isInverted = false;
    let current = expr;
    for (let isStopped = false; !isStopped;) {
      let arg: number;
      if (manager.getOp(current) === OP_ADD) {
        arg = manager.args[current][0];
        current = manager.args[current][1];
      } else {
        arg = current;
        isStopped = true;
      }
      const negated = this.manager.getTimesMinusOneArg(arg);
      if (this.isGround(arg)) args.push(arg);
      else if (this.isVar(arg)) {
        if (variable !== undefined) return undefined;
        variable = arg;
      } else if (negated !== undefined && this.isVar(negated)) {
        if (variable !== undefined) return undefined;
        variable = negated;
        isInverted = true;
      } else return undefined;
    }
    if (variable === undefined) return undefined;
    const term = args.length === 1 ? args[0] : this.rewriter.mkAppCore(OP_ADD, args, SORT_INT);
    return { variable, term, isInverted };
  }

  private mkSub(first: number, second: number) {
    return this.rewriter.mkAppCore(OP_SUB, [first, second], SORT_INT);
  }

  private mkAdd(first: number, second: number) {
    return this.rewriter.mkAppCore(OP_ADD, [first, second], SORT_INT);
  }

  private isVarAndGround(lhs: number, rhs: number) {
    if (this.isVar(lhs) && this.isGround(rhs))
      return { variable: lhs, term: rhs, isInverted: false };
    if (this.isVar(rhs) && this.isGround(lhs))
      return { variable: rhs, term: lhs, isInverted: false };
    const left = this.isVarPlusGround(lhs);
    if (left !== undefined && this.isGround(rhs))
      return {
        variable: left.variable,
        term: left.isInverted ? this.mkSub(left.term, rhs) : this.mkSub(rhs, left.term),
        isInverted: left.isInverted,
      };
    const right = this.isVarPlusGround(rhs);
    if (right !== undefined && this.isGround(lhs))
      return {
        variable: right.variable,
        term: right.isInverted ? this.mkSub(right.term, lhs) : this.mkSub(lhs, right.term),
        isInverted: right.isInverted,
      };
    return undefined;
  }

  private isVarMinusVar(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ADD) return undefined;
    let first = manager.args[expr][0];
    let second = manager.args[expr][1];
    if (!this.isVar(first)) [first, second] = [second, first];
    if (!this.isVar(first)) return undefined;
    const negated = this.manager.getTimesMinusOneArg(second);
    if (negated === undefined || !this.isVar(negated)) return undefined;
    return [first, negated];
  }

  private isZero(expr: number) {
    return this.manager.isNumeral(expr) && this.manager.values[expr] === 0;
  }

  private isVarAndVar(lhs: number, rhs: number) {
    if (this.isVar(lhs) && this.isVar(rhs)) return [lhs, rhs];
    const left = this.isVarMinusVar(lhs);
    if (left !== undefined && this.isZero(rhs)) return left;
    const right = this.isVarMinusVar(rhs);
    if (right !== undefined && this.isZero(lhs)) return right;
    return undefined;
  }

  private isLeGe(expr: number) {
    const op = this.manager.getOp(expr);
    return op === OP_LE || op === OP_GE;
  }

  private isXGleTAtom(atom: number, isNegated: boolean) {
    const manager = this.manager;
    if (manager.kinds[atom] !== KIND_APP || !this.isLeGe(atom)) return undefined;
    const args = manager.args[atom];
    const found = this.isVarAndGround(args[0], args[1]);
    if (found === undefined) return undefined;
    if (isNegated) return { variable: found.variable, term: found.term };
    const isLe = (manager.getOp(atom) === OP_LE) !== found.isInverted;
    const one = manager.mkNumeral(1);
    return {
      variable: found.variable,
      term: isLe ? this.mkAdd(found.term, one) : this.mkSub(found.term, one),
    };
  }

  private visitFormula(expr: number, polarity: Polarity) {
    if (this.isGround(expr)) return;
    const cache = polarity === "pos" ? this.posCache : this.negCache;
    if (cache.has(expr)) return;
    this.ftodo.push([expr, polarity]);
    cache.add(expr);
  }

  private visitTerm(expr: number) {
    if (this.isGround(expr) || this.posCache.has(expr)) return;
    this.ttodo.push(expr);
    this.posCache.add(expr);
  }

  private processUApp(expr: number) {
    const manager = this.manager;
    const info = this.info;
    const decl = manager.decls[expr];
    manager.args[expr].forEach((arg, index) => {
      if (this.isVar(arg)) {
        info.insertQInfo({ kind: "f_var", decl, argIndex: index, varIndex: manager.values[arg] });
        return;
      }
      const found = this.isVarPlusGround(arg);
      if (found !== undefined && !found.isInverted) {
        info.insertQInfo({
          kind: "f_var_plus_offset",
          decl,
          argIndex: index,
          varIndex: manager.values[found.variable],
          offset: found.term,
        });
        return;
      }
      this.visitTerm(arg);
    });
  }

  private processApp(expr: number) {
    const manager = this.manager;
    const decl = manager.decls[expr];
    if (manager.funcDecls[decl].family !== FAMILY_BASIC) this.info.ngDecls.add(decl);
    if (manager.funcDecls[decl].family === FAMILY_USER) this.processUApp(expr);
    else for (const arg of manager.args[expr]) this.visitTerm(arg);
  }

  private processTermsOnStack() {
    const manager = this.manager;
    for (let current = this.ttodo.pop(); current !== undefined; current = this.ttodo.pop()) {
      if (manager.isBool(current)) {
        this.visitFormula(current, "pos");
        this.visitFormula(current, "neg");
        continue;
      }
      if (manager.kinds[current] === KIND_APP) this.processApp(current);
      else if (this.isVar(current)) this.info.isAuf = false;
    }
  }

  private processLiteral(atom: number, isNegated: boolean) {
    const manager = this.manager;
    const info = this.info;
    if (this.isVar(atom)) {
      info.insertQInfo({
        kind: "x_neq_t",
        varIndex: manager.values[atom],
        term: isNegated ? manager.trueExpr : manager.falseExpr,
      });
      return;
    }
    if (manager.kinds[atom] !== KIND_APP) return;
    const args = manager.args[atom];
    const isEq = manager.getOp(atom) === OP_EQ;
    const xEqT = isEq ? this.isVarAndGround(args[0], args[1]) : undefined;
    if (xEqT !== undefined) {
      info.insertQInfo({
        kind: isNegated ? "x_neq_t" : "x_eq_t",
        varIndex: manager.values[xEqT.variable],
        term: xEqT.term,
      });
      return;
    }
    const xEqY = isEq ? this.isVarAndVar(args[0], args[1]) : undefined;
    if (xEqY !== undefined) {
      if (isNegated)
        info.insertQInfo(mkVarPair("x_neq_y", manager.values[xEqY[0]], manager.values[xEqY[1]]));
      else {
        info.hasXEqY = true;
        info.insertQInfo(mkVarPair("x_eq_y", manager.values[xEqY[0]], manager.values[xEqY[1]]));
      }
      return;
    }
    const xLeY = isNegated && this.isLeGe(atom) ? this.isVarAndVar(args[0], args[1]) : undefined;
    if (xLeY !== undefined) {
      info.insertQInfo(mkVarPair("x_leq_y", manager.values[xLeY[0]], manager.values[xLeY[1]]));
      return;
    }
    const xGleT = this.isXGleTAtom(atom, isNegated);
    if (xGleT !== undefined) {
      info.insertQInfo({
        kind: "x_gle_t",
        varIndex: manager.values[xGleT.variable],
        term: xGleT.term,
      });
      return;
    }
    this.processApp(atom);
  }

  private processFormulasOnStack() {
    const manager = this.manager;
    for (let entry = this.ftodo.pop(); entry !== undefined; entry = this.ftodo.pop()) {
      const current = entry[0];
      const polarity = entry[1];
      const negated: Polarity = polarity === "pos" ? "neg" : "pos";
      if (manager.kinds[current] === KIND_VAR) {
        this.processLiteral(current, polarity === "neg");
        continue;
      }
      if (manager.kinds[current] !== KIND_APP) continue;
      const args = manager.args[current];
      if (manager.getFamily(current) !== FAMILY_BASIC || !manager.isBool(current)) {
        this.processLiteral(current, polarity === "neg");
        continue;
      }
      switch (manager.getOp(current)) {
        case OP_IMPLIES:
          this.processLiteral(args[0], negated === "neg");
          this.processLiteral(args[1], polarity === "neg");
          break;
        case OP_XOR:
          for (const arg of args) {
            this.visitFormula(arg, polarity);
            this.visitFormula(arg, negated);
          }
          break;
        case OP_OR:
        case OP_AND:
          for (const arg of args) this.visitFormula(arg, polarity);
          break;
        case OP_NOT:
          this.visitFormula(args[0], negated);
          break;
        case OP_ITE:
          this.visitFormula(args[0], polarity);
          this.visitFormula(args[0], negated);
          this.visitFormula(args[1], polarity);
          this.visitFormula(args[2], polarity);
          break;
        case OP_EQ:
          if (manager.isBool(args[0]))
            for (const arg of args) {
              this.visitFormula(arg, "pos");
              this.visitFormula(arg, "neg");
            }
          else this.processLiteral(current, polarity === "neg");
          break;
        default:
          this.processLiteral(current, polarity === "neg");
      }
    }
  }

  // is_clause: a disjunction of literals.
  private isLiteral(expr: number) {
    const manager = this.manager;
    const atom = manager.isNot(expr) ? manager.args[expr][0] : expr;
    if (manager.kinds[atom] !== KIND_APP) return manager.kinds[atom] === KIND_VAR;
    if (manager.getFamily(atom) !== FAMILY_BASIC) return true;
    const op = manager.getOp(atom);
    if (op === OP_EQ) return !manager.isBool(manager.args[atom][0]);
    return manager.args[atom].length === 0;
  }

  analyze() {
    const manager = this.manager;
    const body = manager.getQuantifier(this.info.flatQ).body;
    const literals = manager.getOp(body) === OP_OR ? manager.args[body] : [body];
    if (literals.every((literal) => this.isLiteral(literal))) {
      for (const literal of literals) {
        const isNegated = manager.isNot(literal);
        const atom = isNegated ? manager.args[literal][0] : literal;
        if (!this.isGround(atom)) this.processLiteral(atom, isNegated);
      }
    } else this.visitFormula(body, "pos");
    while (this.ftodo.length > 0 || this.ttodo.length > 0) {
      this.processFormulasOnStack();
      this.processTermsOnStack();
    }
  }
}

export class ModelFinder {
  private q2info = new Map<number, QuantifierInfo>();
  private quantifiers: number[] = [];
  private scopes: number[] = [];
  private rewriter: Rewriter;
  readonly aufSolver: AufSolver;
  private newConstraints: number[] = [];

  constructor(
    private manager: AstManager,
    private context: Context,
  ) {
    this.rewriter = new Rewriter(manager, { isEliminatingAnd: false, arith: TACTIC_ARITH_OPTIONS });
    this.aufSolver = new AufSolver(manager, this.rewriter);
  }

  getQuantifierInfo(quantifier: number) {
    return this.q2info.get(quantifier) ?? this.registerQuantifier(quantifier);
  }

  registerQuantifier(quantifier: number) {
    const info = new QuantifierInfo(this.manager, this.context, quantifier);
    this.q2info.set(quantifier, info);
    this.quantifiers.push(quantifier);
    new QuantifierAnalyzer(this.manager, this.rewriter, info).analyze();
    return info;
  }

  pushScope() {
    this.scopes.push(this.quantifiers.length);
  }

  popScope(numScopes: number) {
    const limit = this.scopes[this.scopes.length - numScopes];
    for (let index = limit; index < this.quantifiers.length; index++)
      this.q2info.delete(this.quantifiers[index]);
    this.quantifiers.length = limit;
    this.scopes.length -= numScopes;
  }

  // fix_model: tries to satisfy the relevant quantifiers by changing the model while keeping the
  // ground formulas satisfied.
  fixModel(model: ProtoModel) {
    const context = this.context;
    if (this.quantifiers.length === 0) return;
    const quantifiers = this.quantifiers.filter(
      (quantifier) =>
        context.isRelevant(quantifier) &&
        context.getAssignment(context.getLiteral(quantifier)) === L_TRUE,
    );
    if (quantifiers.length === 0) return;
    for (const quantifier of quantifiers) this.getQuantifierInfo(quantifier).resetTheOne();
    const residue = solveMacros(
      this.manager,
      model,
      quantifiers,
      (quantifier) => this.getQuantifierInfo(quantifier),
      MBQI_FORCE_TEMPLATE,
    );
    const solver = this.aufSolver;
    solver.reset();
    solver.setModel(model);
    for (const quantifier of residue) this.getQuantifierInfo(quantifier).processAuf(solver);
    solver.mkInstantiationSets();
    for (const quantifier of residue) this.getQuantifierInfo(quantifier).populateInstSets(solver);
    solver.fixModel(this.newConstraints);
  }

  getFlatQuantifier(quantifier: number) {
    return this.getQuantifierInfo(quantifier).flatQ;
  }

  // get_uvar_inst_set: the set of variable index of the quantifier before flattening.
  getUvarInstSet(quantifier: number, index: number) {
    const manager = this.manager;
    const flatQ = this.getFlatQuantifier(quantifier);
    const offset =
      manager.getQuantifier(flatQ).sorts.length - manager.getQuantifier(quantifier).sorts.length;
    const set = this.aufSolver.getUvarInstSet(flatQ, offset + index);
    if (set !== null) return set;
    return this.getQuantifierInfo(quantifier).getMacroBasedInstSet(index, (expr) =>
      this.aufSolver.eval(expr, true),
    );
  }

  // get_inv: a term of the instantiation set whose value is value.
  getInv(quantifier: number, index: number, value: number, model: ProtoModel) {
    const set = this.getUvarInstSet(quantifier, index);
    if (set === null) return null;
    const term = set.getInv(value, model);
    if (term !== undefined && this.aufSolver.isDefaultRepresentative(term))
      return { term: value, generation: 0 };
    return term === undefined ? null : { term, generation: set.getGeneration(term) };
  }

  // restrict_sks_to_inst_set: each Skolem constant must take the value of a term in its set.
  restrictSksToInstSet(quantifier: number, sks: number[], assert: (expr: number) => void) {
    const manager = this.manager;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    let isAsserted = false;
    for (let index = 0; index < numDecls; index++) {
      const sk = sks[sks.length - index - 1];
      const set = this.getUvarInstSet(quantifier, index);
      if (set === null || set.inv.size === 0) continue;
      const eqs: number[] = [];
      for (const value of set.inv.keys())
        if (manager.sorts[value] === manager.sorts[sk]) eqs.push(manager.mkEq(sk, value));
      if (eqs.length === 0) continue;
      assert(manager.mkOr(eqs));
      isAsserted = true;
    }
    return isAsserted;
  }

  // restart_eh: the constraints of the last model become axioms.
  restartEh() {
    const context = this.context;
    for (const constraint of this.newConstraints) {
      context.internalize(constraint, true);
      const literal = context.getLiteral(constraint);
      context.markLiteralAsRelevant(literal);
      context.assign(literal, "axiom");
    }
    this.newConstraints = [];
  }
}

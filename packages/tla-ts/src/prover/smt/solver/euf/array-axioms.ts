// Ported from Z3 (src/sat/smt/array_axioms.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { mkArrayApp } from "../array-decl-plugin";
import {
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
} from "../ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { NULL_LITERAL } from "../sat/clause";
import { hasLargeDomain, hasUnitaryDomain } from "../theory-array";
import {
  ArrayInternalize,
  type AxiomRecord,
  KIND_CONGRUENCE,
  KIND_DEFAULT,
  KIND_EXTENSIONALITY,
  KIND_SELECT,
  KIND_STORE,
  STATE_DELAYED,
  STATE_NEW,
} from "./array-internalize";
import type { Enode } from "./egraph";

interface Reach {
  readonly root: Enode;
  readonly parent: Reach | null;
  readonly store: Enode | null;
}

export abstract class ArrayAxioms extends ArrayInternalize {
  private sort2epsilon = new Map<number, number>();
  private sort2diag = new Map<number, number>();

  protected abstract collectDefaults(): void;
  protected abstract mustHaveDifferentModelValues(first: number, second: number): boolean;

  protected mkSelect(args: number[]) {
    return mkArrayApp(this.manager, OP_SELECT, args);
  }

  private mkDefault(array: number) {
    return mkArrayApp(this.manager, OP_ARRAY_DEFAULT, [array]);
  }

  private withTemporaries<T>(body: () => T) {
    return this.manager.withTemporaries(body, () => []);
  }

  private rewriteLater(expr: number) {
    const rewritten = this.rewrite(expr);
    this.manager.releaseLater(rewritten);
    return rewritten;
  }

  private getAppArgs(expr: number) {
    return [...this.manager.getArgs(expr)];
  }

  protected assertAxiom(index: number) {
    const record = this.axiomTrail[index];
    switch (record.kind) {
      case KIND_STORE:
        return this.assertStoreAxiom(record.node.owner);
      case KIND_SELECT:
        return this.assertSelect(index, record);
      case KIND_DEFAULT:
        return this.assertDefault(record);
      case KIND_EXTENSIONALITY:
        return this.assertExtensionality(record.node.owner, (record.select as Enode).owner);
      case KIND_CONGRUENCE:
        throw new SmtUnsupportedError("sat.euf array lambdas");
    }
    return false;
  }

  private assertDefault(record: AxiomRecord) {
    const child = record.node.owner;
    if (this.isOp(child, OP_CONST_ARRAY)) return this.assertDefaultConstAxiom(child);
    if (this.isOp(child, OP_STORE)) return this.assertDefaultStoreAxiom(child);
    if (this.isMapCombinator(child)) return this.assertDefaultMapAxiom(child);
    return false;
  }

  private assertSelect(index: number, record: AxiomRecord) {
    const child = record.node.owner;
    const select = (record.select as Enode).owner;
    const isDelaying =
      (record.select as Enode).getArg(0).root !== record.node.root &&
      record.state !== STATE_DELAYED &&
      this.isDelayEnabled;
    if (isDelaying) {
      this.ctx.trail.push(() => {
        this.axiomTrail[index].state = STATE_NEW;
      });
      record.state = STATE_DELAYED;
      return false;
    }
    if (this.isOp(child, OP_CONST_ARRAY)) return this.assertSelectConstAxiom(select, child);
    if (this.isOp(child, OP_AS_ARRAY)) return this.assertSelectAsArrayAxiom(select, child);
    if (this.isOp(child, OP_STORE)) return this.assertSelectStoreAxiom(select, child);
    if (this.isMapCombinator(child)) return this.assertSelectMapAxiom(select, child);
    return this.assertSelectLambdaAxiom(select, child);
  }

  private propagateAxiomEq(first: Enode, second: Enode, eqs: readonly (readonly [Enode, Enode])[]) {
    if (first.root === second.root) return false;
    return this.propagateEq([], eqs, first, second);
  }

  private assertStoreAxiom(store: number) {
    const args = this.getAppArgs(store);
    const select = this.mkSelect([store, ...args.slice(1, -1)]);
    return this.propagateAxiomEq(
      this.eInternalize(select),
      this.expr2enode(args[args.length - 1]) as Enode,
      [],
    );
  }

  private assertSelectStoreAxiom(select: number, store: number) {
    const manager = this.manager;
    const selectArgs = this.getAppArgs(select);
    const storeArgs = this.getAppArgs(store);
    const numArgs = selectArgs.length;
    let hasDiff = false;
    for (let index = 1; index < numArgs; index++)
      hasDiff ||=
        (this.expr2enode(selectArgs[index]) as Enode).root !==
        (this.expr2enode(storeArgs[index]) as Enode).root;
    if (!hasDiff) return false;
    const indices = selectArgs.slice(1);
    const firstSelect = this.mkSelect([store, ...indices]);
    const secondSelect = this.mkSelect([storeArgs[0], ...indices]);
    const selectEqExpr = manager.mkEq(firstSelect, secondSelect);
    const egraph = this.ctx.egraph;
    let isNew = egraph.find(firstSelect) === undefined || egraph.find(secondSelect) === undefined;
    const firstNode = this.eInternalize(firstSelect);
    const secondNode = this.eInternalize(secondSelect);
    if (firstNode.root === secondNode.root) return isNew;
    let selectEq = NULL_LITERAL;
    const initSelectEq = () => {
      if (selectEq !== NULL_LITERAL) return true;
      selectEq = this.mkLiteral(selectEqExpr);
      return this.s.value(selectEq) !== L_TRUE;
    };
    for (let index = 1; index < numArgs; index++) {
      const storeIndex = storeArgs[index];
      const selectIndex = selectArgs[index];
      if (this.expr2enode(storeIndex) === this.expr2enode(selectIndex)) continue;
      if (manager.areDistinct(storeIndex, selectIndex)) {
        if (initSelectEq() && this.addClause([selectEq])) isNew = true;
        break;
      }
      const indexEq = this.eqInternalize(storeIndex, selectIndex);
      if (this.s.value(indexEq) === L_TRUE) continue;
      if (this.s.value(indexEq) === L_UNDEF) isNew = true;
      if (!initSelectEq()) break;
      if (this.addClause([indexEq, selectEq])) isNew = true;
    }
    return isNew;
  }

  private assertSelectConstAxiom(select: number, constArray: number) {
    const value = this.manager.getArg(constArray, 0);
    const constSelect = this.mkSelect([constArray, ...this.getAppArgs(select).slice(1)]);
    return this.propagateAxiomEq(
      this.eInternalize(constSelect),
      this.expr2enode(value) as Enode,
      [],
    );
  }

  private assertExtensionality(first: number, second: number) {
    const manager = this.manager;
    return this.withTemporaries(() => {
      const diffs = this.sort2diff(manager.sorts[first]).map((decl) =>
        this.rewriteLater(manager.mkApp(decl, [first, second], manager.funcDecls[decl].range)),
      );
      const firstSelect = this.mkSelect([first, ...diffs]);
      const secondSelect = this.mkSelect([second, ...diffs]);
      const arrayEq = this.eqInternalize(first, second);
      const selectEq = this.eqInternalize(firstSelect, secondSelect);
      return this.addClause([arrayEq, selectEq ^ 1]);
    });
  }

  private assertSelectMapAxiom(select: number, map: number) {
    const indices = this.getAppArgs(select).slice(1);
    return this.withTemporaries(() => {
      const selects = this.getAppArgs(map).map((arg) => this.mkSelect([arg, ...indices]));
      const mapSelect = this.mkSelect([map, ...indices]);
      const applied = this.rewriteLater(this.applyMap(map, selects));
      return this.propagateAxiomEq(this.eInternalize(mapSelect), this.eInternalize(applied), []);
    });
  }

  private assertSelectAsArrayAxiom(select: number, asArray: number) {
    const manager = this.manager;
    const decl = manager.funcDecls[manager.decls[asArray]].parameters[0];
    const indices = this.getAppArgs(select).slice(1);
    const asArraySelect = this.mkSelect([asArray, ...indices]);
    const value = manager.mkApp(decl, indices, manager.funcDecls[decl].range);
    return this.propagateAxiomEq(this.eInternalize(asArraySelect), this.eInternalize(value), []);
  }

  // Owned by the caller's temporaries.
  private applyMap(map: number, args: number[]) {
    const manager = this.manager;
    const decl = manager.funcDecls[manager.decls[map]].parameters[0];
    return this.rewriteLater(manager.mkApp(decl, args, manager.funcDecls[decl].range));
  }

  private assertDefaultMapAxiom(map: number) {
    return this.withTemporaries(() => {
      const defaults = this.getAppArgs(map).map((arg) => this.mkDefault(arg));
      const mapDefault = this.mkDefault(map);
      const applied = this.applyMap(map, defaults);
      return this.propagateAxiomEq(this.eInternalize(mapDefault), this.eInternalize(applied), []);
    });
  }

  private assertDefaultConstAxiom(constArray: number) {
    const value = this.manager.getArg(constArray, 0);
    return this.propagateAxiomEq(
      this.expr2enode(value) as Enode,
      this.eInternalize(this.mkDefault(constArray)),
      [],
    );
  }

  private assertDefaultStoreAxiom(store: number) {
    const manager = this.manager;
    const args = this.getAppArgs(store);
    const storeDefaultExpr = this.mkDefault(store);
    const arrayDefaultExpr = this.mkDefault(args[0]);
    const isNew =
      this.ctx.getEnode(storeDefaultExpr) === undefined ||
      this.ctx.getEnode(arrayDefaultExpr) === undefined;
    const storeDefault = this.eInternalize(storeDefaultExpr);
    const internalizedArrayDefault = this.eInternalize(arrayDefaultExpr);
    const arrayDefault = hasUnitaryDomain(manager, store)
      ? this.eInternalize(args[args.length - 1])
      : internalizedArrayDefault;
    if (!hasUnitaryDomain(manager, store) && !hasLargeDomain(manager, store)) {
      const epsilons: number[] = [];
      const diagonals: number[] = [];
      for (const arg of args.slice(1, -1)) {
        const sort = manager.sorts[arg];
        const epsilon = this.mkEpsilon(sort);
        epsilons.push(epsilon.epsilon);
        diagonals.push(manager.mkApp(epsilon.diag, [arg], sort));
      }
      const isFirst = this.propagateAxiomEq(
        this.eInternalize(this.mkSelect([store, ...epsilons])),
        storeDefault,
        [],
      );
      const isSecond = this.propagateAxiomEq(
        this.eInternalize(this.mkSelect([args[0], ...epsilons])),
        arrayDefault,
        [],
      );
      const isThird = this.propagateAxiomEq(
        this.eInternalize(this.mkSelect([store, ...diagonals])),
        this.eInternalize(this.mkSelect([args[0], ...diagonals])),
        [],
      );
      return isFirst || isSecond || isThird || isNew;
    }
    return this.propagateAxiomEq(storeDefault, arrayDefault, []) || isNew;
  }

  private assertSelectLambdaAxiom(select: number, lambda: number) {
    return this.withTemporaries(() => {
      const alpha = this.mkSelect([lambda, ...this.getAppArgs(select).slice(1)]);
      const beta = this.rewriteLater(alpha);
      return this.propagateAxiomEq(this.eInternalize(alpha), this.eInternalize(beta), []);
    });
  }

  private mkEpsilon(sort: number) {
    const manager = this.manager;
    const trail = this.ctx.trail;
    let epsilon = this.sort2epsilon.get(sort);
    if (epsilon === undefined) {
      const created = manager.mkFreshConst("epsilon", sort);
      manager.incRef(created);
      this.sort2epsilon.set(sort, created);
      trail.push(() => {
        this.sort2epsilon.delete(sort);
        manager.decRef(created);
      });
      epsilon = created;
    }
    let diag = this.sort2diag.get(sort);
    if (diag === undefined) {
      const created = manager.mkFreshFuncDecl("diag", [sort], sort);
      this.sort2diag.set(sort, created);
      trail.push(() => this.sort2diag.delete(sort));
      diag = created;
    }
    return { epsilon, diag };
  }

  protected addDelayedAxioms() {
    let isChanged = false;
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      const data = this.getVarData(thVar);
      if (!data.isPropUpward) continue;
      const node = this.var2enodeOf(thVar);
      for (const lambda of data.parentLambdas) this.propagateSelectAxioms(data, lambda);
      if (this.addAsArrayEqs(node)) isChanged = true;
      if (!node.parents.some((parent) => this.isOp(parent.owner, OP_ARRAY_DEFAULT)))
        this.propagateParentDefault(thVar);
    }
    const size = this.axiomTrail.length;
    for (this.delayQhead = 0; this.delayQhead < size; this.delayQhead++)
      if (
        this.axiomTrail[this.delayQhead].state === STATE_DELAYED &&
        this.assertAxiom(this.delayQhead)
      )
        isChanged = true;
    this.isDelayEnabled = false;
    if (this.unitPropagate()) isChanged = true;
    this.isDelayEnabled = true;
    return isChanged;
  }

  private addAsArrayEqs(node: Enode) {
    const manager = this.manager;
    if (!this.isOp(node.owner, OP_AS_ARRAY)) return false;
    const decl = manager.funcDecls[manager.decls[node.owner]].parameters[0];
    const nodes = this.ctx.egraph.enodesOf(decl);
    let isChanged = false;
    for (let index = 0; index < nodes.length; index++) {
      const app = nodes[index];
      const select = this.mkSelect([node.owner, ...this.getAppArgs(app.owner)]);
      if (this.eInternalize(select).root !== app.root) {
        this.addUnit(this.eqInternalize(select, app.owner));
        isChanged = true;
      }
    }
    return isChanged;
  }

  protected addInterfaceEqualities() {
    const manager = this.manager;
    this.collectDefaults();
    const roots = this.collectSharedVars();
    let isPropagated = false;
    for (let first = roots.length; first-- > 0;) {
      const firstVar = roots[first];
      const firstExpr = this.var2expr(firstVar);
      for (let second = first; second-- > 0;) {
        const secondVar = roots[second];
        const secondExpr = this.var2expr(secondVar);
        if (manager.sorts[firstExpr] !== manager.sorts[secondExpr]) continue;
        if (this.mustHaveDifferentModelValues(firstVar, secondVar)) continue;
        if (this.ctx.egraph.areDiseq(this.var2enodeOf(firstVar), this.var2enodeOf(secondVar)))
          continue;
        if (this.s.value(this.eqInternalize(firstExpr, secondExpr)) === L_UNDEF)
          isPropagated = true;
      }
    }
    return isPropagated;
  }

  private collectSharedVars() {
    const roots: number[] = [];
    const marked = new Set<Enode>();
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      const node = this.var2enodeOf(thVar);
      if (!this.isArray(node.owner)) continue;
      const root = node.root;
      if (marked.has(root)) continue;
      if (this.ctx.isShared(root) || this.isSharedArg(root)) roots.push(root.getThVar(this.id));
      marked.add(root);
    }
    return roots;
  }

  protected checkLambdas() {
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      const node = this.var2enodeOf(thVar);
      if (!this.isOp(node.owner, OP_AS_ARRAY) && !this.isLambda(node.owner)) continue;
      for (const parent of node.parents) if (!this.ctx.isBetaRedex(parent, node)) return false;
    }
    return true;
  }

  private isSharedArg(root: Enode) {
    for (const parent of root.parents) {
      const expr = parent.owner;
      if (this.isOp(expr, OP_SELECT))
        for (let index = 1; index < parent.numArgs; index++)
          if (root === parent.getArg(index).root) return true;
      if (this.isOp(expr, OP_CONST_ARRAY)) return true;
      if (this.isOp(expr, OP_ARRAY_EXT)) return true;
    }
    return false;
  }

  protected checkConstArrays() {
    const manager = this.manager;
    const constArrays: Enode[] = [];
    const seen = new Set<Enode>();
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      const node = this.var2enodeOf(thVar);
      if (!this.isOp(node.owner, OP_CONST_ARRAY) || seen.has(node.root)) continue;
      seen.add(node.root);
      constArrays.push(node);
    }
    if (constArrays.length < 2) return L_TRUE;
    const reachable = (constArray: Enode) => {
      const initial: Reach = { root: constArray.root, parent: null, store: null };
      const result = [initial];
      const visited = new Set([constArray.root]);
      for (let qhead = 0; qhead < result.length; qhead++) {
        const current = result[qhead];
        for (const parent of current.root.parents) {
          if (!this.isOp(parent.owner, OP_STORE) || parent.getArg(0).root !== current.root)
            continue;
          if (visited.has(parent.root)) continue;
          visited.add(parent.root);
          result.push({ root: parent.root, parent: current, store: parent });
        }
      }
      return result;
    };
    const isSameIndex = (first: Enode, second: Enode) => {
      if (first.numArgs !== second.numArgs) return false;
      for (let index = 1; index + 1 < first.numArgs; index++)
        if (first.getArg(index).root !== second.getArg(index).root) return false;
      return true;
    };
    const addEq = (first: Enode, second: Enode, eqs: [Enode, Enode][]) => {
      if (first !== second) eqs.push([first, second]);
    };
    const addIndices = (inputPath: Reach, indices: Enode[], eqs: [Enode, Enode][]) => {
      for (let path = inputPath; path.store !== null; path = path.parent as Reach) {
        const store = path.store;
        const old = indices.find((index) => isSameIndex(store, index));
        if (old === undefined) {
          indices.push(store);
          continue;
        }
        for (let index = 1; index + 1 < store.numArgs; index++)
          addEq(store.getArg(index), old.getArg(index), eqs);
      }
    };
    const addPathEqs = (constArray: Enode, inputPath: Reach, eqs: [Enode, Enode][]) => {
      let initial = inputPath;
      while (initial.parent !== null) initial = initial.parent;
      addEq(constArray, initial.root, eqs);
      for (let path = inputPath; path.store !== null; path = path.parent as Reach) {
        addEq(path.store.getArg(0), (path.parent as Reach).root, eqs);
        addEq(path.store, path.root, eqs);
      }
    };
    const internalizeSelect = (constArray: Enode, indices: number[]) => {
      const select = this.mkSelect([constArray.owner, ...indices]);
      const isNew = this.ctx.egraph.find(select) === undefined;
      this.eInternalize(select);
      return isNew;
    };
    const allReachable = constArrays.map(reachable);
    let hasUninterpreted = false;
    for (let first = 0; first < constArrays.length; first++) {
      const firstValue = constArrays[first].getArg(0);
      for (let second = first + 1; second < constArrays.length; second++) {
        const secondValue = constArrays[second].getArg(0);
        if (firstValue.root === secondValue.root) continue;
        let firstPath: Reach | undefined;
        let secondPath: Reach | undefined;
        for (const firstReach of allReachable[first]) {
          secondPath = allReachable[second].find((reach) => reach.root === firstReach.root);
          if (secondPath !== undefined) {
            firstPath = firstReach;
            break;
          }
        }
        if (firstPath === undefined || secondPath === undefined) continue;
        const indices: Enode[] = [];
        const eqs: [Enode, Enode][] = [];
        addIndices(firstPath, indices, eqs);
        addIndices(secondPath, indices, eqs);
        const sort = manager.sorts[constArrays[first].owner];
        const numIndices = BigInt(indices.length);
        let isDomainExceedingIndices = false;
        let domainSize = 1n;
        let hasUninterp = false;
        for (const domain of manager.getSortParameters(sort).slice(0, -1)) {
          if (manager.isUninterpretedSort(domain)) {
            hasUninterp = true;
            continue;
          }
          const size = manager.getSortSize(domain);
          if (size < 0n || size > numIndices || domainSize > numIndices / size) {
            isDomainExceedingIndices = true;
            break;
          }
          domainSize *= size;
        }
        if (isDomainExceedingIndices || domainSize > numIndices) {
          addPathEqs(constArrays[first], firstPath, eqs);
          addPathEqs(constArrays[second], secondPath, eqs);
          this.propagateAxiomEq(firstValue, secondValue, eqs);
          return L_FALSE;
        }
        let isNew = false;
        for (const store of indices) {
          const storeIndices: number[] = [];
          for (let index = 1; index + 1 < store.numArgs; index++)
            storeIndices.push(store.getArg(index).owner);
          isNew = internalizeSelect(constArrays[first], storeIndices) || isNew;
          isNew = internalizeSelect(constArrays[second], storeIndices) || isNew;
        }
        if (isNew) return L_FALSE;
        if (hasUninterp) hasUninterpreted = true;
      }
    }
    return hasUninterpreted ? L_UNDEF : L_TRUE;
  }
}

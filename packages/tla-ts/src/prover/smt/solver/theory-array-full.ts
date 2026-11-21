import {
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
} from "./ast";
import { type Enode, TheoryJustification } from "./enode";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP } from "./theory";
import { hasLargeDomain, hasUnitaryDomain, THEORY_DATA, TheoryArray } from "./theory-array";

const DEFAULT_MAP_FINGERPRINT = 0xffffffff - 112;
const DEFAULT_STORE_FINGERPRINT = 0xffffffff - 113;
const DEFAULT_CONST_FINGERPRINT = 0xffffffff - 115;

interface Reach {
  root: Enode;
  parent: Reach | null;
  store: Enode | null;
}

export class TheoryArrayFull extends TheoryArray {
  private consts: Enode[][] = [];
  private asArrays: Enode[][] = [];
  private maps: Enode[][] = [];
  private parentMaps: Enode[][] = [];
  private assignedEqs = new Set<string>();
  private epsilons = new Map<number, number>();
  private diags = new Map<number, number>();
  private asArrayNodes: Enode[] = [];

  protected mkVar(node: Enode) {
    const thVar = super.mkVar(node);
    this.consts.push([]);
    this.asArrays.push([]);
    this.maps.push([]);
    this.parentMaps.push([]);
    if (this.isOp(node, OP_ARRAY_MAP)) {
      this.instantiateDefaultMapAxiom(node);
      this.maps[thVar].push(node);
    } else if (this.isOp(node, OP_CONST_ARRAY)) {
      this.instantiateDefaultConstAxiom(node);
      this.consts[thVar].push(node);
    } else if (this.isOp(node, OP_AS_ARRAY)) this.asArrays[thVar].push(node);
    return thVar;
  }

  internalizeTerm(term: number) {
    const context = this.context;
    const manager = this.manager;
    if (context.isEInternalized(term)) return true;
    const op = manager.getOp(term);
    if (op === OP_STORE || op === OP_SELECT) return super.internalizeTerm(term);
    if (
      op !== OP_CONST_ARRAY &&
      op !== OP_ARRAY_DEFAULT &&
      op !== OP_ARRAY_MAP &&
      op !== OP_AS_ARRAY
    ) {
      if (op !== OP_ARRAY_EXT) this.foundUnsupportedOp();
      return false;
    }
    if (!this.internalizeTermCore(term)) return true;
    const numArgs = manager.getNumArgs(term);
    if (op === OP_ARRAY_MAP)
      for (let index = 0; index < numArgs; index++) this.ensureVar(this.getArgNode(term, index));
    else if (op === OP_ARRAY_DEFAULT) this.ensureVar(this.getArgNode(term, 0));
    const node = context.getEnode(term);
    if (node === undefined) return true;
    this.ensureVar(node);
    if (op === OP_ARRAY_DEFAULT) this.addParentDefault(this.getVar(this.getArgNode(term, 0)));
    else if (op === OP_ARRAY_MAP) {
      for (let index = 0; index < numArgs; index++)
        this.addParentMap(this.getVar(this.getArgNode(term, index)), node);
      this.instantiateDefaultMapAxiom(node);
    } else if (op === OP_CONST_ARRAY) this.instantiateDefaultConstAxiom(node);
    else if (op === OP_AS_ARRAY) {
      const asArrayNodes = this.asArrayNodes;
      asArrayNodes.push(node);
      context.pushTrail(() => asArrayNodes.pop());
    }
    if (!context.relevancy.isEnabled) this.relevantEh(term);
    return true;
  }

  protected mergeEh(first: number, second: number) {
    super.mergeEh(first, second);
    const maps = this.maps[second];
    for (let index = 0; index < maps.length; index++) this.addMap(first, maps[index]);
    const parentMaps = this.parentMaps[second];
    for (let index = 0; index < parentMaps.length; index++)
      this.addParentMap(first, parentMaps[index]);
    const consts = this.consts[second];
    for (let index = 0; index < consts.length; index++) this.addConst(first, consts[index]);
    const asArrays = this.asArrays[second];
    for (let index = 0; index < asArrays.length; index++) this.addAsArray(first, asArrays[index]);
  }

  protected addParentSelect(inputVar: number, select: Enode) {
    super.addParentSelect(inputVar, select);
    const thVar = this.unionFind.find(inputVar);
    const consts = this.consts[thVar];
    for (let index = 0; index < consts.length; index++)
      this.instantiateSelectConstAxiom(select, consts[index]);
    const maps = this.maps[thVar];
    for (let index = 0; index < maps.length; index++)
      this.instantiateSelectMapAxiom(select, maps[index]);
  }

  private addMap(inputVar: number, map: Enode) {
    const thVar = this.unionFind.find(inputVar);
    this.setPropUpwardStores(thVar);
    this.pushBack(this.maps[thVar], map);
    const parentSelects = this.parentSelects[thVar];
    for (let index = 0; index < parentSelects.length; index++)
      this.instantiateSelectMapAxiom(parentSelects[index], map);
    this.setPropUpwardNode(map);
  }

  private addParentMap(inputVar: number, map: Enode) {
    this.pushBack(this.parentMaps[this.unionFind.find(inputVar)], map);
  }

  // add_const and add_as_array take the variable as it is, the root that merge_eh passes.
  private addConst(thVar: number, constArray: Enode) {
    this.setPropUpwardStores(thVar);
    this.pushBack(this.consts[thVar], constArray);
    this.instantiateDefaultConstAxiom(constArray);
    const parentSelects = this.parentSelects[thVar];
    for (let index = 0; index < parentSelects.length; index++)
      this.instantiateSelectConstAxiom(parentSelects[index], constArray);
  }

  private addAsArray(thVar: number, asArray: Enode) {
    this.setPropUpwardStores(thVar);
    this.pushBack(this.asArrays[thVar], asArray);
    const parentSelects = this.parentSelects[thVar];
    for (let index = 0; index < parentSelects.length; index++)
      this.instantiateSelectAsArrayAxiom(parentSelects[index], asArray);
  }

  private addParentDefault(inputVar: number) {
    const stores = this.stores[this.unionFind.find(inputVar)];
    for (let index = 0; index < stores.length; index++)
      if (this.isOp(stores[index], OP_STORE)) this.instantiateDefaultStoreAxiom(stores[index]);
  }

  protected setPropUpwardVar(inputVar: number) {
    const thVar = this.unionFind.find(inputVar);
    if (this.isPropUpward[thVar]) return;
    this.isPropUpward[thVar] = true;
    this.trail.push(() => {
      this.isPropUpward[thVar] = false;
    });
    for (const node of this.stores[thVar]) this.setPropUpwardNode(node);
    for (const node of this.maps[thVar]) this.setPropUpwardNode(node);
    for (const node of this.consts[thVar]) this.setPropUpwardNode(node);
  }

  protected setPropUpwardNode(node: Enode) {
    if (this.isOp(node, OP_STORE)) this.setPropUpwardVar(this.getVar(node.getArg(0)));
    else if (this.isOp(node, OP_ARRAY_MAP))
      for (let index = 0; index < node.numArgs; index++)
        this.setPropUpwardVar(this.getVar(node.getArg(index)));
  }

  relevantEh(expr: number) {
    super.relevantEh(expr);
    const context = this.context;
    const op = this.manager.getOp(expr);
    if (
      op !== OP_ARRAY_DEFAULT &&
      op !== OP_SELECT &&
      op !== OP_ARRAY_MAP &&
      op !== OP_CONST_ARRAY &&
      op !== OP_AS_ARRAY
    )
      return;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    const node = context.getEnode(expr);
    if (node === undefined) return;
    if (op === OP_SELECT)
      this.addParentSelect(this.unionFind.find(this.getVar(this.getArgNode(expr, 0))), node);
    else if (op === OP_ARRAY_DEFAULT) {
      const thVar = this.getVar(this.getArgNode(expr, 0));
      this.setPropUpwardVar(thVar);
      this.addParentDefault(this.unionFind.find(thVar));
    } else if (op === OP_CONST_ARRAY) {
      this.instantiateDefaultConstAxiom(node);
      const thVar = this.getVar(node);
      this.setPropUpwardVar(thVar);
      this.addParentDefault(this.unionFind.find(thVar));
    } else if (op === OP_ARRAY_MAP) {
      for (let index = 0; index < node.numArgs; index++) {
        const thVar = this.unionFind.find(this.getVar(node.getArg(index)));
        this.addParentMap(thVar, node);
        this.setPropUpwardVar(thVar);
      }
      this.instantiateDefaultMapAxiom(node);
    }
  }

  private instantiateAxiomMapFor(thVar: number) {
    let result = false;
    for (const map of this.parentMaps[thVar])
      for (const select of this.parentSelects[thVar])
        if (this.instantiateSelectMapAxiom(select, map)) result = true;
    return result;
  }

  private instantiateParentStoresDefault(inputVar: number) {
    let result = false;
    for (const store of this.parentStores[this.unionFind.find(inputVar)])
      if (this.instantiateDefaultStoreAxiom(store)) result = true;
    return result;
  }

  protected assertDelayedAxioms() {
    let result = super.assertDelayedAxioms();
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      if (!this.isPropUpward[thVar]) continue;
      if (this.instantiateAxiomMapFor(thVar)) result = FC_CONTINUE;
      if (this.instantiateParentStoresDefault(thVar)) result = FC_CONTINUE;
    }
    if (result === FC_DONE) {
      const constArrays = this.checkConstArrays();
      if (constArrays < 0) result = FC_CONTINUE;
      else if (constArrays === 0) result = FC_GIVEUP;
    }
    if (result === FC_DONE && this.canPropagate()) result = FC_CONTINUE;
    if (result === FC_DONE && (this.isUnsupportedOpFound || this.hasNonBetaAsArray()))
      result = FC_GIVEUP;
    return result;
  }

  private hasNonBetaAsArray() {
    const context = this.context;
    const manager = this.manager;
    if (context.params.isArrayFakeSupport) return false;
    for (const node of this.asArrayNodes)
      for (const parent of node.parents)
        if (
          context.isRelevant(parent.owner) &&
          !context.getTheory(manager.getFamily(parent.owner))?.isBetaRedex(parent, node)
        )
          return true;
    return false;
  }

  private tryAssignEq(first: number, second: number) {
    const key = `${first}:${second}`;
    if (this.assignedEqs.has(key)) return false;
    this.assignedEqs.add(key);
    const eq = this.mkEq(first, second);
    this.context.markLiteralAsRelevant(eq);
    this.context.mkThAxiom([eq]);
    return true;
  }

  private mkMappedApp(map: Enode, args: number[]) {
    const manager = this.manager;
    const decl = manager.funcDecls[map.decl].parameters[0];
    const app = manager.mkApp(decl, args, manager.getArrayRange(manager.sorts[map.owner]));
    manager.incRef(app);
    const rewritten = this.context.rewriter.rewrite(app);
    manager.decRef(app);
    return rewritten;
  }

  private instantiateSelectMapAxiom(select: Enode, map: Enode) {
    const context = this.context;
    const manager = this.manager;
    if (!this.addFingerprint(map.owner, manager.ids[map.owner], this.getIndexArgs(select)))
      return false;
    const indices = this.getIndexArgs(select).map((node) => node.owner);
    const selects = manager.mapArgs(map.owner, (arg) => this.mkSelect([arg, ...indices]));
    const mapSelect = this.mkSelect([map.owner, ...indices]);
    const applied = this.mkMappedApp(map, selects);
    context.internalize(mapSelect, false);
    context.internalize(applied, false);
    const result = this.tryAssignEq(mapSelect, applied);
    manager.decRef(applied);
    return result;
  }

  private instantiateDefaultMapAxiom(map: Enode) {
    const context = this.context;
    const manager = this.manager;
    if (!this.addFingerprint(THEORY_DATA, DEFAULT_MAP_FINGERPRINT, [map])) return false;
    const applied = this.mkMappedApp(
      map,
      manager.mapArgs(map.owner, (arg) => this.mkDefault(arg)),
    );
    const mapDefault = this.mkDefault(map.owner);
    context.internalize(mapDefault, false);
    context.internalize(applied, false);
    const result = this.tryAssignEq(mapDefault, applied);
    manager.decRef(applied);
    return result;
  }

  private instantiateDefaultConstAxiom(constArray: Enode) {
    if (!this.addFingerprint(THEORY_DATA, DEFAULT_CONST_FINGERPRINT, [constArray])) return false;
    const constDefault = this.mkDefault(constArray.owner);
    this.context.internalize(constDefault, false);
    return this.tryAssignEq(constArray.getArg(0).owner, constDefault);
  }

  private instantiateSelectConstAxiom(select: Enode, constArray: Enode) {
    const manager = this.manager;
    const indices = this.getIndexArgs(select);
    if (!this.addFingerprint(constArray.owner, manager.ids[constArray.owner], indices))
      return false;
    const constSelect = this.mkSelect([constArray.owner, ...indices.map((node) => node.owner)]);
    this.context.internalize(constSelect, false);
    return this.tryAssignEq(constSelect, constArray.getArg(0).owner);
  }

  private instantiateSelectAsArrayAxiom(select: Enode, asArray: Enode) {
    const context = this.context;
    const manager = this.manager;
    const indices = this.getIndexArgs(select);
    if (!this.addFingerprint(asArray.owner, manager.ids[asArray.owner], indices)) return false;
    const indexExprs = indices.map((node) => node.owner);
    const asArraySelect = this.mkSelect([asArray.owner, ...indexExprs]);
    const decl = manager.funcDecls[manager.decls[asArray.owner]].parameters[0];
    const value = manager.mkApp(decl, indexExprs, manager.funcDecls[decl].range);
    context.internalize(asArraySelect, false);
    context.internalize(value, false);
    return this.tryAssignEq(asArraySelect, value);
  }

  private mkEpsilon(sort: number) {
    const manager = this.manager;
    let epsilon = this.epsilons.get(sort);
    if (epsilon === undefined) {
      const created = manager.mkFreshConst("epsilon", sort);
      manager.incRef(created);
      this.epsilons.set(sort, created);
      this.trail.push(() => {
        this.epsilons.delete(sort);
        manager.decRef(created);
      });
      epsilon = created;
    }
    let diag = this.diags.get(sort);
    if (diag === undefined) {
      const created = manager.mkFreshFuncDecl("diag", [sort], sort);
      manager.incDeclRef(created);
      this.diags.set(sort, created);
      this.trail.push(() => {
        this.diags.delete(sort);
        manager.decDeclRef(created);
      });
      diag = created;
    }
    return { epsilon, diag };
  }

  private instantiateDefaultStoreAxiom(store: Enode) {
    const context = this.context;
    const manager = this.manager;
    const args: Enode[] = [];
    for (let index = 0; index < store.numArgs; index++) args.push(store.getArg(index));
    if (!this.addFingerprint(THEORY_DATA, DEFAULT_STORE_FINGERPRINT, args)) return false;
    const storeExpr = store.owner;
    const array = store.getArg(0).owner;
    const storeDefault = this.mkDefault(storeExpr);
    const arrayDefault = hasUnitaryDomain(manager, storeExpr)
      ? store.getArg(store.numArgs - 1).owner
      : this.mkDefault(array);
    if (!hasUnitaryDomain(manager, storeExpr) && !hasLargeDomain(manager, storeExpr)) {
      const epsilons: number[] = [];
      const diagonals: number[] = [];
      for (let index = 1; index + 1 < store.numArgs; index++) {
        const arg = store.getArg(index).owner;
        const sort = manager.sorts[arg];
        const epsilon = this.mkEpsilon(sort);
        epsilons.push(epsilon.epsilon);
        diagonals.push(manager.mkApp(epsilon.diag, [arg], sort));
      }
      const storeSelect = this.mkSelect([storeExpr, ...epsilons]);
      const arraySelect = this.mkSelect([array, ...epsilons]);
      context.internalize(storeDefault, false);
      context.internalize(arrayDefault, false);
      const isNew =
        this.tryAssignEq(storeDefault, storeSelect) || this.tryAssignEq(arrayDefault, arraySelect);
      const storeDiagonal = this.mkSelect([storeExpr, ...diagonals]);
      const arrayDiagonal = this.mkSelect([array, ...diagonals]);
      return this.tryAssignEq(storeDiagonal, arrayDiagonal) || isNew;
    }
    context.internalize(storeDefault, false);
    context.internalize(arrayDefault, false);
    return this.tryAssignEq(storeDefault, arrayDefault);
  }

  private getReachable(constArray: Enode) {
    const context = this.context;
    const initial: Reach = { root: constArray.root, parent: null, store: null };
    const result = [initial];
    const visited = new Set([constArray.root]);
    for (let qhead = 0; qhead < result.length; qhead++) {
      const current = result[qhead];
      const thVar = this.getVar(current.root);
      if (thVar < 0) continue;
      for (const store of this.parentStores[this.unionFind.find(thVar)]) {
        if (
          !this.isOp(store, OP_STORE) ||
          !context.isRelevant(store.owner) ||
          store.getArg(0).root !== current.root
        )
          continue;
        if (visited.has(store.root)) continue;
        visited.add(store.root);
        result.push({ root: store.root, parent: current, store });
      }
    }
    return result;
  }

  private isSameIndex(first: Enode, second: Enode) {
    if (first.numArgs !== second.numArgs) return false;
    for (let index = 1; index + 1 < first.numArgs; index++)
      if (first.getArg(index).root !== second.getArg(index).root) return false;
    return true;
  }

  private addIndices(inputPath: Reach, indices: Enode[], eqs: Enode[]) {
    for (let path = inputPath; path.store !== null && path.parent !== null; path = path.parent) {
      const store = path.store;
      const old = indices.find((index) => this.isSameIndex(store, index));
      if (old === undefined) {
        indices.push(store);
        continue;
      }
      for (let index = 1; index + 1 < store.numArgs; index++)
        if (store.getArg(index) !== old.getArg(index))
          eqs.push(store.getArg(index), old.getArg(index));
    }
  }

  private addPathEqs(constArray: Enode, inputPath: Reach, eqs: Enode[]) {
    let initial = inputPath;
    while (initial.parent !== null) initial = initial.parent;
    if (constArray !== initial.root) eqs.push(constArray, initial.root);
    for (let path = inputPath; path.store !== null && path.parent !== null; path = path.parent) {
      if (path.store.getArg(0) !== path.parent.root)
        eqs.push(path.store.getArg(0), path.parent.root);
      if (path.store !== path.root) eqs.push(path.store, path.root);
    }
  }

  private internalizeConstSelect(constArray: Enode, indices: number[]) {
    const context = this.context;
    const select = this.mkSelect([constArray.owner, ...indices]);
    let isNew = !context.isEInternalized(select);
    context.internalize(select, false);
    if (!context.isRelevant(select)) {
      context.markAsRelevant(select);
      isNew = true;
    }
    return isNew;
  }

  // l_false as -1, l_undef as 0 and l_true as 1.
  private checkConstArrays() {
    const context = this.context;
    const manager = this.manager;
    const constArrays: Enode[] = [];
    const seen = new Set<Enode>();
    for (let thVar = 0; thVar < this.getNumVars(); thVar++)
      for (const constArray of this.consts[thVar])
        if (!seen.has(constArray.root) && context.isRelevant(constArray.owner)) {
          seen.add(constArray.root);
          constArrays.push(constArray);
        }
    if (constArrays.length < 2) return 1;
    const reachables = constArrays.map((constArray) => this.getReachable(constArray));
    let hasUninterpreted = false;
    for (let first = 0; first < constArrays.length; first++) {
      const firstValue = constArrays[first].getArg(0);
      for (let second = first + 1; second < constArrays.length; second++) {
        const secondValue = constArrays[second].getArg(0);
        if (firstValue.root === secondValue.root) continue;
        let firstPath: Reach | undefined;
        let secondPath: Reach | undefined;
        for (const firstReach of reachables[first]) {
          secondPath = reachables[second].find((reach) => reach.root === firstReach.root);
          if (secondPath !== undefined) {
            firstPath = firstReach;
            break;
          }
        }
        if (firstPath === undefined || secondPath === undefined) continue;
        const indices: Enode[] = [];
        const eqs: Enode[] = [];
        this.addIndices(firstPath, indices, eqs);
        this.addIndices(secondPath, indices, eqs);
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
          this.addPathEqs(constArrays[first], firstPath, eqs);
          this.addPathEqs(constArrays[second], secondPath, eqs);
          const justification = new TheoryJustification(this.id, [], eqs);
          context.pushEq(firstValue, secondValue, { kind: "justification", justification });
          return -1;
        }
        let isNew = false;
        for (const store of indices) {
          const storeIndices: number[] = [];
          for (let index = 1; index + 1 < store.numArgs; index++)
            storeIndices.push(store.getArg(index).owner);
          isNew = this.internalizeConstSelect(constArrays[first], storeIndices) || isNew;
          isNew = this.internalizeConstSelect(constArrays[second], storeIndices) || isNew;
        }
        if (isNew) return -1;
        if (hasUninterp) hasUninterpreted = true;
      }
    }
    return hasUninterpreted ? 0 : 1;
  }

  popScopeEh(numScopes: number) {
    const numOldVars = this.getOldNumVars(numScopes);
    super.popScopeEh(numScopes);
    this.consts.length = numOldVars;
    this.asArrays.length = numOldVars;
    this.maps.length = numOldVars;
    this.parentMaps.length = numOldVars;
    this.assignedEqs.clear();
  }
}

import { SmtInvariantError } from "../../../errors";
import { mkArrayApp, mkArrayDecl, mkAsArray } from "./array-decl-plugin";
import {
  type AstManager,
  FAMILY_ARRAY,
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_ARRAY_MAP,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
  SORT_BOOL,
  SORT_SIZE_INFINITE,
  SORT_SIZE_VERY_BIG,
} from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { getCompositeHash } from "./hash";
import { KeyedHashtable } from "./hashtable";
import { FALSE_LITERAL, getVar, isNegated, type Literal, negate, TRUE_LITERAL } from "./literal";
import { UnionFind } from "./lp/union-find";
import { FuncInterp, type ProtoModel } from "./proto-model";
import {
  type DependentValue,
  type ExtraFreshValue,
  FC_CONTINUE,
  FC_DONE,
  FC_GIVEUP,
  Theory,
} from "./theory";

// The theory itself as the data of a fingerprint, which no expression is.
export const THEORY_DATA = -1;
const EXTENSIONALITY_FINGERPRINT = 0;
const LARGE_DOMAIN_SIZE = 1n << 14n;

const getDomainSizes = (manager: AstManager, array: number) =>
  manager
    .getSortParameters(manager.sorts[array])
    .slice(0, -1)
    .map((domain) => manager.getSortSize(domain));

export const hasUnitaryDomain = (manager: AstManager, array: number) =>
  getDomainSizes(manager, array).every((size) => size === 1n);

export const hasLargeDomain = (manager: AstManager, array: number) => {
  let size = 1n;
  for (const domainSize of getDomainSizes(manager, array)) {
    if (domainSize === SORT_SIZE_INFINITE || domainSize === SORT_SIZE_VERY_BIG) return true;
    size *= domainSize;
    if (size >= LARGE_DOMAIN_SIZE) return true;
  }
  return false;
};

export class TheoryArray extends Theory {
  readonly name = "array";
  protected unionFind: UnionFind;
  protected trail: (() => void)[] = [];
  private trailLimits: number[] = [];
  protected stores: Enode[][] = [];
  protected parentSelects: Enode[][] = [];
  protected parentStores: Enode[][] = [];
  protected isPropUpward: boolean[] = [];
  private axiom1Todo: Enode[] = [];
  private axiom2Todo: Enode[] = [];
  private extensionalityTodo: Enode[] = [];
  private sortSkolems = new Map<number, number[]>();
  private sortsTrail: number[] = [];
  private sortsTrailLimits: number[] = [];
  protected isUnsupportedOpFound = false;
  private finalCheckIndex = 0;
  private model: ProtoModel | undefined;
  private isUnspecifiedDefault = false;
  private defaults: (Enode | null)[] = [];
  private elseValues: (number | ExtraFreshValue | undefined)[] = [];
  private mgParents: number[] = [];
  private selectSets = new Map<Enode, KeyedHashtable<Enode>>();
  private selectHashes: number[] = [];

  constructor(context: Context) {
    super(context, FAMILY_ARRAY);
    this.unionFind = new UnionFind(this.trail);
    this.unionFind.handler = { mergeEh: (root, joining) => this.mergeEh(root, joining) };
  }

  protected isOp(node: Enode, op: number) {
    return this.manager.getOp(node.owner) === op;
  }

  private isArrayNode(node: Enode) {
    return this.manager.isArraySort(this.manager.sorts[node.owner]);
  }

  protected pushBack(list: Enode[], node: Enode) {
    list.push(node);
    this.trail.push(() => list.pop());
  }

  protected foundUnsupportedOp() {
    if (this.isUnsupportedOpFound || this.context.params.isArrayFakeSupport) return;
    this.isUnsupportedOpFound = true;
    this.context.pushTrail(() => {
      this.isUnsupportedOpFound = false;
    });
  }

  protected mkSelect(args: number[]) {
    return mkArrayApp(this.manager, OP_SELECT, args);
  }

  protected mkDefault(array: number) {
    return mkArrayApp(this.manager, OP_ARRAY_DEFAULT, [array]);
  }

  protected mkEq(first: number, second: number): Literal {
    if (first === second) return TRUE_LITERAL;
    if (this.manager.areDistinct(first, second)) return FALSE_LITERAL;
    const eq = this.context.mkEqAtom(first, second);
    this.context.internalize(eq, true);
    return this.context.getLiteral(eq);
  }

  protected addFingerprint(data: number, dataHash: number, args: Enode[]) {
    return this.context.fingerprints.insert(data, dataHash, args) !== null;
  }

  protected getIndexArgs(node: Enode) {
    const args: Enode[] = [];
    for (let index = 1; index < node.numArgs; index++) args.push(node.getArg(index));
    return args;
  }

  private registerSort(sort: number) {
    if (this.sortSkolems.has(sort)) return;
    const manager = this.manager;
    const skolems: number[] = [];
    for (let index = 0; index < manager.getArrayArity(sort); index++) {
      const skolem = mkArrayDecl(manager, OP_ARRAY_EXT, [sort, sort], [index]);
      manager.incDeclRef(skolem);
      skolems.push(skolem);
    }
    this.sortSkolems.set(sort, skolems);
    this.sortsTrail.push(sort);
  }

  private restoreSorts(limit: number) {
    for (let index = this.sortsTrail.length - 1; index >= limit; index--) {
      const sort = this.sortsTrail[index];
      for (const skolem of this.sortSkolems.get(sort) ?? []) this.manager.decDeclRef(skolem);
      this.sortSkolems.delete(sort);
    }
    this.sortsTrail.length = limit;
  }

  protected mkVar(node: Enode) {
    const manager = this.manager;
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.unionFind.mkVar();
    const isStore = this.isOp(node, OP_STORE);
    this.stores.push(isStore ? [node] : []);
    this.parentSelects.push([]);
    this.parentStores.push([]);
    this.isPropUpward.push(false);
    const sort = manager.sorts[node.owner];
    if (manager.isArraySort(sort)) this.registerSort(sort);
    this.context.attachThVar(node, this, thVar);
    if (isStore) this.axiom1Todo.push(node);
    return thVar;
  }

  protected getVar(node: Enode) {
    return node.getThVar(this.id);
  }

  protected ensureVar(node: Enode) {
    if (!this.isAttachedToVar(node)) this.mkVar(node);
  }

  protected getArgNode(term: number, index: number) {
    const node = this.context.getEnode(this.manager.getArg(term, index));
    if (node === undefined) throw new SmtInvariantError("an argument was not internalized");
    return node;
  }

  protected internalizeTermCore(term: number) {
    const context = this.context;
    const manager = this.manager;
    const numArgs = manager.getNumArgs(term);
    for (let index = 0; index < numArgs; index++)
      context.internalize(manager.getArg(term, index), false);
    for (let index = 0; index < numArgs; index++) {
      const arg = manager.getArg(term, index);
      if (manager.isBool(arg)) context.internalize(arg, false);
    }
    if (context.isEInternalized(term)) return false;
    for (let index = 0; index < numArgs; index++) {
      const arg = manager.getArg(term, index);
      if (!context.isEInternalized(arg)) context.mkEnode(arg, true, manager.isBool(arg), false);
    }
    const node = context.mkEnode(term, false, false, true);
    this.ensureVar(node);
    if (manager.sorts[term] === SORT_BOOL) context.setVarTheory(context.mkBoolVar(term), this.id);
    return true;
  }

  internalizeAtom(atom: number) {
    return this.internalizeTerm(atom);
  }

  internalizeTerm(term: number) {
    const context = this.context;
    const op = this.manager.getOp(term);
    if (op !== OP_STORE && op !== OP_SELECT) {
      if (op !== OP_ARRAY_EXT) this.foundUnsupportedOp();
      return false;
    }
    if (!this.internalizeTermCore(term)) return true;
    const array = this.getArgNode(term, 0);
    this.ensureVar(array);
    const node = context.getEnode(term);
    if (context.relevancy.isEnabled || node === undefined) return true;
    if (op === OP_SELECT) this.addParentSelect(this.getVar(array), node);
    else this.addParentStore(this.getVar(array), node);
    return true;
  }

  applySortCnstr(node: Enode) {
    this.ensureVar(node);
  }

  newEqEh(first: number, second: number) {
    this.unionFind.merge(first, second);
  }

  newDiseqEh(inputFirst: number, inputSecond: number) {
    const first = this.unionFind.find(inputFirst);
    const second = this.unionFind.find(inputSecond);
    if (this.isArrayNode(this.getEnode(first)))
      this.assertExtensionality(this.getEnode(first), this.getEnode(second));
  }

  protected mergeEh(first: number, second: number) {
    if (!this.isPropUpward[first] && this.isPropUpward[second]) this.setPropUpwardVar(first);
    const stores = this.stores[second];
    for (let index = 0; index < stores.length; index++) this.addStore(first, stores[index]);
    const parentStores = this.parentStores[second];
    for (let index = 0; index < parentStores.length; index++)
      this.addParentStore(first, parentStores[index]);
    const parentSelects = this.parentSelects[second];
    for (let index = 0; index < parentSelects.length; index++)
      this.addParentSelect(first, parentSelects[index]);
  }

  protected addParentSelect(inputVar: number, select: Enode) {
    const thVar = this.unionFind.find(inputVar);
    this.pushBack(this.parentSelects[thVar], select);
    const stores = this.stores[thVar];
    for (let index = 0; index < stores.length; index++)
      this.assertStoreAxiom2(stores[index], select);
  }

  private addParentStore(inputVar: number, store: Enode) {
    this.pushBack(this.parentStores[this.unionFind.find(inputVar)], store);
  }

  private addStore(inputVar: number, store: Enode) {
    const thVar = this.unionFind.find(inputVar);
    this.setPropUpwardStores(thVar);
    this.pushBack(this.stores[thVar], store);
    const parentSelects = this.parentSelects[thVar];
    for (let index = 0; index < parentSelects.length; index++)
      this.assertStoreAxiom2(store, parentSelects[index]);
    this.setPropUpwardNode(store);
  }

  protected setPropUpwardVar(inputVar: number) {
    const thVar = this.unionFind.find(inputVar);
    if (this.isPropUpward[thVar]) return;
    this.isPropUpward[thVar] = true;
    this.trail.push(() => {
      this.isPropUpward[thVar] = false;
    });
    for (const node of this.stores[thVar]) this.setPropUpwardNode(node);
  }

  protected setPropUpwardNode(node: Enode) {
    if (this.isOp(node, OP_STORE)) this.setPropUpwardVar(this.getVar(node.getArg(0)));
  }

  protected setPropUpwardStores(thVar: number) {
    for (const node of this.stores[thVar]) this.setPropUpwardNode(node);
  }

  relevantEh(expr: number) {
    const context = this.context;
    const op = this.manager.getOp(expr);
    if (!context.relevancy.isEnabled || (op !== OP_STORE && op !== OP_SELECT)) return;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    const node = context.getEnode(expr);
    const array = this.getArgNode(expr, 0);
    if (node !== undefined && op === OP_SELECT) this.addParentSelect(this.getVar(array), node);
    else if (node !== undefined) this.addParentStore(this.getVar(array), node);
  }

  private assertStoreAxiom2(store: Enode, select: Enode) {
    if (this.isOp(store, OP_STORE)) {
      let index = 1;
      while (index < select.numArgs && store.getArg(index).root === select.getArg(index).root)
        index++;
      if (index === select.numArgs) return false;
    }
    if (!this.addFingerprint(store.owner, this.manager.ids[store.owner], this.getIndexArgs(select)))
      return false;
    this.axiom2Todo.push(store, select);
    return true;
  }

  private assertStoreAxiom1Core(store: Enode) {
    const context = this.context;
    const manager = this.manager;
    const args = manager.getArgs(store.owner);
    const select = this.mkSelect([store.owner, ...args.slice(1, -1)]);
    context.internalize(select, false);
    const selectNode = context.getEnode(select);
    const valueNode = context.getEnode(args[args.length - 1]);
    if (selectNode === undefined || valueNode === undefined) return;
    context.pushEq(selectNode, valueNode, { kind: "axiom" });
    context.markAsRelevant(select);
  }

  private assertStoreAxiom2Core(store: Enode, select: Enode) {
    const context = this.context;
    const manager = this.manager;
    const indices = this.getIndexArgs(select).map((node) => node.owner);
    let conseq: Literal | undefined;
    for (let index = 0; index < indices.length; index++) {
      const storeIndex = store.getArg(index + 1);
      const selectIndex = select.getArg(index + 1);
      if (storeIndex.root === selectIndex.root) continue;
      if (conseq === undefined) {
        const first = this.mkSelect([store.owner, ...indices]);
        const second = this.mkSelect([store.getArg(0).owner, ...indices]);
        if (first === second) break;
        conseq = this.mkEq(first, second);
      }
      if (manager.areDistinct(storeIndex.owner, selectIndex.owner)) {
        context.markLiteralAsRelevant(conseq);
        context.mkThAxiom([conseq]);
        continue;
      }
      const ante = this.mkEq(storeIndex.owner, selectIndex.owner);
      context.markLiteralAsRelevant(ante);
      const target = context.boolVar2Expr[getVar(conseq)];
      context.relevancy.addWatch(context.boolVar2Expr[getVar(ante)], isNegated(ante), () =>
        context.relevancy.markAsRelevant(target),
      );
      context.mkThAxiom([ante, conseq]);
    }
  }

  private assertExtensionality(inputFirst: Enode, inputSecond: Enode) {
    const ids = this.manager.ids;
    const isSwapped = ids[inputFirst.owner] > ids[inputSecond.owner];
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    if (!this.addFingerprint(THEORY_DATA, EXTENSIONALITY_FINGERPRINT, [first, second])) return;
    if (this.isAlreadyDiseq(first, second)) return;
    this.extensionalityTodo.push(first, second);
  }

  private getSelectKey = (select: Enode) => {
    let key = "";
    for (let index = 1; index < select.numArgs; index++)
      key += `${select.getArg(index).root.owner},`;
    return key;
  };

  private isRelevantSelectOf(parent: Enode, root: Enode) {
    return (
      parent.isCgr() &&
      this.context.isRelevant(parent.owner) &&
      this.isOp(parent, OP_SELECT) &&
      parent.getArg(0).root === root
    );
  }

  private isAlreadyDiseq(first: Enode, second: Enode) {
    const isSwapped = first.root.classSize > second.root.classSize;
    const smaller = isSwapped ? second.root : first.root;
    const larger = isSwapped ? first.root : second.root;
    const values = new Map<string, Enode>();
    for (const parent of smaller.parents)
      if (this.isRelevantSelectOf(parent, smaller)) values.set(this.getSelectKey(parent), parent);
    for (const parent of larger.parents) {
      if (!this.isRelevantSelectOf(parent, larger)) continue;
      const other = values.get(this.getSelectKey(parent));
      if (other !== undefined && this.context.isDiseq(parent, other, false)) return true;
    }
    return false;
  }

  private assertExtensionalityCore(first: Enode, second: Enode) {
    const context = this.context;
    const manager = this.manager;
    const skolems = this.sortSkolems.get(manager.sorts[first.owner]);
    if (skolems === undefined) throw new SmtInvariantError("the array sort was not registered");
    const witnesses = skolems.map((skolem) =>
      manager.mkApp(skolem, [first.owner, second.owner], manager.funcDecls[skolem].range),
    );
    const firstSelect = this.mkSelect([first.owner, ...witnesses]);
    const secondSelect = this.mkSelect([second.owner, ...witnesses]);
    const arraysEq = this.mkEq(first.owner, second.owner);
    const selectsEq = this.mkEq(firstSelect, secondSelect);
    context.markLiteralAsRelevant(arraysEq);
    context.markLiteralAsRelevant(selectsEq);
    context.mkThAxiom([arraysEq, negate(selectsEq)]);
  }

  canPropagate() {
    return (
      this.axiom1Todo.length > 0 || this.axiom2Todo.length > 0 || this.extensionalityTodo.length > 0
    );
  }

  propagate() {
    while (this.canPropagate()) {
      for (let index = 0; index < this.axiom1Todo.length; index++)
        this.assertStoreAxiom1Core(this.axiom1Todo[index]);
      this.axiom1Todo.length = 0;
      for (let index = 0; index < this.axiom2Todo.length; index += 2)
        this.assertStoreAxiom2Core(this.axiom2Todo[index], this.axiom2Todo[index + 1]);
      this.axiom2Todo.length = 0;
      for (let index = 0; index < this.extensionalityTodo.length; index += 2)
        this.assertExtensionalityCore(
          this.extensionalityTodo[index],
          this.extensionalityTodo[index + 1],
        );
      this.extensionalityTodo.length = 0;
    }
  }

  isShared(thVar: number) {
    const root = this.getEnode(thVar).root;
    let isArray = false;
    let isIndex = false;
    let isValue = false;
    let numRoles = 0;
    const setArray = (arg: Enode) => {
      if (arg.root === root && !isArray) {
        isArray = true;
        numRoles++;
      }
      return numRoles > 1;
    };
    const setIndex = (arg: Enode) => {
      if (arg.root === root && !isIndex) {
        isIndex = true;
        numRoles++;
      }
      return numRoles > 1;
    };
    const setValue = (arg: Enode) => {
      if (arg.root === root && !isValue) {
        isValue = true;
        numRoles++;
      }
      return numRoles > 1;
    };
    for (const parent of root.parents) {
      const numArgs = parent.numArgs;
      if (this.isOp(parent, OP_STORE)) {
        if (setArray(parent.getArg(0))) return true;
        for (let index = 1; index < numArgs - 1; index++)
          if (setIndex(parent.getArg(index))) return true;
        if (setValue(parent.getArg(numArgs - 1))) return true;
      } else if (this.isOp(parent, OP_SELECT)) {
        if (setArray(parent.getArg(0))) return true;
        for (let index = 1; index < numArgs; index++)
          if (setIndex(parent.getArg(index))) return true;
      } else if (this.isOp(parent, OP_CONST_ARRAY) && setValue(parent.getArg(0))) return true;
    }
    return false;
  }

  isBetaRedex(parent: Enode, node: Enode) {
    if (this.isOp(parent, OP_SELECT)) return parent.getArg(0).root === node.root;
    return this.isOp(parent, OP_ARRAY_MAP) || this.isOp(parent, OP_STORE);
  }

  private isSelectArg(root: Enode) {
    for (const parent of root.parents)
      if (this.isOp(parent, OP_SELECT))
        for (let index = 1; index < parent.numArgs; index++)
          if (root === parent.getArg(index).root) return true;
    return false;
  }

  private collectSharedVars() {
    const context = this.context;
    const result: number[] = [];
    const marked: Enode[] = [];
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      const node = this.getEnode(thVar);
      if (!context.isRelevant(node.owner) || !this.isArrayNode(node)) continue;
      const root = node.root;
      if (root.isMarked) continue;
      if (context.isShared(root) || this.isSelectArg(root)) result.push(this.getVar(root));
      root.isMarked = true;
      marked.push(root);
    }
    for (const node of marked) node.isMarked = false;
    return result;
  }

  private mkInterfaceEqs() {
    const context = this.context;
    const manager = this.manager;
    const roots = this.collectSharedVars();
    let result = 0;
    for (let index = 0; index < roots.length; index++) {
      const first = this.getEnode(roots[index]);
      for (let other = index + 1; other < roots.length; other++) {
        const second = this.getEnode(roots[other]);
        if (manager.sorts[first.owner] !== manager.sorts[second.owner]) continue;
        if (context.isDiseq(first, second)) continue;
        const eq = context.mkEqAtom(first.owner, second.owner);
        if (context.isBInternalized(eq) && context.isRelevant(eq)) continue;
        result++;
        context.internalize(eq, true);
        context.markAsRelevant(eq);
      }
    }
    return result;
  }

  initSearchEh() {
    this.finalCheckIndex = 0;
  }

  finalCheckEh() {
    const index = ++this.finalCheckIndex;
    const delay = this.context.config.arrayLazyIeqDelay;
    if (delay !== undefined && index % delay !== 0) {
      this.assertDelayedAxioms();
      return FC_CONTINUE;
    }
    const isAxiomsFirst = delay === undefined && index % 2 === 1;
    const delayed = isAxiomsFirst ? this.assertDelayedAxioms() : FC_DONE;
    const result =
      delayed !== FC_DONE
        ? delayed
        : this.mkInterfaceEqs() > 0
          ? FC_CONTINUE
          : isAxiomsFirst
            ? FC_DONE
            : this.assertDelayedAxioms();
    return result === FC_DONE && this.isUnsupportedOpFound ? FC_GIVEUP : result;
  }

  private instantiateAxiom2bFor(thVar: number) {
    let result = false;
    for (const store of this.parentStores[thVar])
      for (const select of this.parentSelects[thVar])
        if (this.assertStoreAxiom2(store, select)) result = true;
    return result;
  }

  protected assertDelayedAxioms() {
    let result = FC_DONE;
    for (let thVar = 0; thVar < this.getNumVars(); thVar++)
      if (this.isPropUpward[thVar] && this.instantiateAxiom2bFor(thVar)) result = FC_CONTINUE;
    return result;
  }

  pushScopeEh() {
    this.sortsTrailLimits.push(this.sortsTrail.length);
    super.pushScopeEh();
    this.trailLimits.push(this.trail.length);
  }

  popScopeEh(numScopes: number) {
    const newLevel = this.trailLimits.length - numScopes;
    const limit = this.trailLimits[newLevel];
    for (let index = this.trail.length - 1; index >= limit; index--) this.trail[index]();
    this.trail.length = limit;
    this.trailLimits.length = newLevel;
    const numOldVars = this.getOldNumVars(numScopes);
    this.stores.length = numOldVars;
    this.parentSelects.length = numOldVars;
    this.parentStores.length = numOldVars;
    this.isPropUpward.length = numOldVars;
    this.axiom1Todo.length = 0;
    this.axiom2Todo.length = 0;
    this.extensionalityTodo.length = 0;
    this.restoreSorts(this.sortsTrailLimits[this.sortsTrailLimits.length - numScopes]);
    this.sortsTrailLimits.length -= numScopes;
    super.popScopeEh(numScopes);
  }

  release() {
    this.restoreSorts(0);
  }

  // The model is free to choose the defaults when no store, const or default term is relevant.
  private isUnspecifiedDefaultOk() {
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      const node = this.getEnode(thVar);
      if (!this.context.isRelevant(node.owner)) continue;
      if (this.isOp(node, OP_STORE) || this.isOp(node, OP_CONST_ARRAY)) return false;
      if (this.isOp(node, OP_ARRAY_DEFAULT)) return false;
    }
    return true;
  }

  private mgFind(thVar: number) {
    let root = thVar;
    while (this.mgParents[root] >= 0) root = this.mgParents[root];
    let current = thVar;
    while (this.mgParents[current] >= 0) {
      const next = this.mgParents[current];
      this.mgParents[current] = root;
      current = next;
    }
    return root;
  }

  private mgMerge(inputFirst: number, inputSecond: number) {
    const first = this.mgFind(inputFirst);
    const second = this.mgFind(inputSecond);
    if (first === second) return;
    const isSwapped = this.mgParents[first] > this.mgParents[second];
    const root = isSwapped ? second : first;
    const child = isSwapped ? first : second;
    this.mgParents[root] += this.mgParents[child];
    this.mgParents[child] = root;
    this.defaults[root] ??= this.defaults[child];
  }

  private setDefault(thVar: number, node: Enode) {
    const root = this.mgFind(thVar);
    this.defaults[root] ??= node;
  }

  private collectDefaults() {
    const numVars = this.getNumVars();
    this.defaults = Array.from({ length: numVars }, () => null);
    this.elseValues = Array.from({ length: numVars }, () => undefined);
    this.mgParents = Array.from({ length: numVars }, () => -1);
    if (this.isUnspecifiedDefault) return;
    for (let thVar = 0; thVar < numVars; thVar++) {
      const node = this.getEnode(thVar);
      if (!this.context.isRelevant(node.owner)) continue;
      this.mgMerge(thVar, this.unionFind.find(thVar));
      if (this.isOp(node, OP_STORE))
        this.mgMerge(thVar, this.unionFind.find(this.getVar(node.getArg(0))));
      else if (this.isOp(node, OP_CONST_ARRAY)) this.setDefault(thVar, node.getArg(0));
      else if (this.isOp(node, OP_ARRAY_DEFAULT))
        this.setDefault(this.getVar(node.getArg(0)), node);
    }
  }

  private getSelectSet(node: Enode) {
    const root = node.root;
    const existing = this.selectSets.get(root);
    if (existing !== undefined) return existing;
    const created = new KeyedHashtable(this.getSelectHash, this.getSelectKey);
    this.selectSets.set(root, created);
    return created;
  }

  private getSelectHash = (select: Enode) => {
    const hashes = this.selectHashes;
    hashes.length = 0;
    for (let index = 1; index < select.numArgs; index++)
      hashes.push(this.manager.hashes[select.getArg(index).root.owner]);
    return getCompositeHash(hashes, 0);
  };

  private collectSelects() {
    this.selectSets.clear();
    const context = this.context;
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      const root = this.getEnode(thVar).root;
      if (this.unionFind.find(thVar) !== thVar || !context.isRelevant(root.owner)) continue;
      for (const parent of root.parents)
        if (
          parent.cg === parent &&
          context.isRelevant(parent.owner) &&
          this.isOp(parent, OP_SELECT) &&
          parent.getArg(0).root === root
        )
          this.getSelectSet(root).insert(parent);
    }
  }

  private propagateSelectToStoreParents(root: Enode, select: Enode, todo: [Enode, Enode][]) {
    const context = this.context;
    if (!context.isRelevant(root.owner)) return;
    for (const parent of root.parents) {
      if (
        !context.isRelevant(parent.owner) ||
        !this.isOp(parent, OP_STORE) ||
        parent.getArg(0).root !== root
      )
        continue;
      const parentSet = this.getSelectSet(parent);
      if (parentSet.has(select)) continue;
      let index = 1;
      while (index < select.numArgs && select.getArg(index).root === parent.getArg(index).root)
        index++;
      if (index < select.numArgs) {
        parentSet.insert(select);
        todo.push([parent.root, select]);
      }
    }
  }

  private propagateSelects() {
    const todo: [Enode, Enode][] = [];
    // Propagating adds to the sets, so it goes over the selects found before it.
    for (const [root, set] of Array.from(this.selectSets))
      for (const select of Array.from(set.values()))
        this.propagateSelectToStoreParents(root, select, todo);
    for (let head = 0; head < todo.length; head++)
      this.propagateSelectToStoreParents(todo[head][0], todo[head][1], todo);
  }

  includeFuncInterp(decl: number) {
    return this.manager.funcDecls[decl].op === OP_ARRAY_EXT;
  }

  initModel(model: ProtoModel) {
    this.model = model;
    this.isUnspecifiedDefault = this.isUnspecifiedDefaultOk();
    this.collectDefaults();
    this.collectSelects();
    this.propagateSelects();
  }

  mkValue(node: Enode): DependentValue {
    const manager = this.manager;
    const model = this.model;
    if (model === undefined) throw new SmtInvariantError("the model was not initialized");
    const thVar = this.getVar(node);
    const sort = manager.sorts[node.owner];
    const parameters = manager.getSortParameters(sort);
    const domain = parameters.slice(0, -1);
    const range = manager.getArrayRange(sort);
    const root = this.mgFind(thVar);
    const defaultNode = this.isUnspecifiedDefault ? null : this.defaults[root];
    if (!this.isUnspecifiedDefault && defaultNode === null && this.elseValues[root] === undefined)
      this.elseValues[root] =
        manager.getSortSize(range) === SORT_SIZE_INFINITE
          ? { sort: range, value: undefined }
          : model.getSomeValue(range);
    const elseValue = defaultNode ?? this.elseValues[root];
    const dependencies: (Enode | ExtraFreshValue)[] =
      elseValue === undefined || typeof elseValue === "number" ? [] : [elseValue];
    for (const select of this.selectSets.get(node.root)?.values() ?? []) {
      for (let index = 1; index < select.numArgs; index++) dependencies.push(select.getArg(index));
      dependencies.push(select);
    }
    const isElseDependent = elseValue !== undefined && typeof elseValue !== "number";
    return {
      dependencies,
      mkValue: (values) => {
        const decl = manager.mkFreshFuncDecl(null, domain, range);
        const interp = new FuncInterp(manager, domain.length);
        model.registerFunc(decl, interp);
        if (isElseDependent) interp.setElse(values[0]);
        else if (typeof elseValue === "number") interp.setElse(elseValue);
        for (let start = isElseDependent ? 1 : 0; start < values.length; start += domain.length + 1)
          interp.insertEntry(
            values.slice(start, start + domain.length),
            values[start + domain.length],
          );
        return mkAsArray(manager, decl);
      },
    };
  }
}

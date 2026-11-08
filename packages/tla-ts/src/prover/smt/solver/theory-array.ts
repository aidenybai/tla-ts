// Ported from Z3 (src/smt/theory_array_base.cpp, theory_array.cpp, theory_array_full.cpp), MIT
// license, see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import { mkArrayApp, mkArrayDecl } from "./array-decl-plugin";
import {
  FAMILY_ARRAY,
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
  SORT_BOOL,
  SORT_SIZE_INFINITE,
  SORT_SIZE_VERY_BIG,
} from "./ast";
import type { Context } from "./context";
import { type Enode, TheoryJustification } from "./enode";
import { FALSE_LITERAL, getVar, isNegated, type Literal, negate, TRUE_LITERAL } from "./literal";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP, Theory } from "./theory";

// The theory itself as the data of a fingerprint, which no expression is.
const THEORY_DATA = -1;
const EXTENSIONALITY_FINGERPRINT = 0;
const DEFAULT_MAP_FINGERPRINT = 0xffffffff - 112;
const DEFAULT_STORE_FINGERPRINT = 0xffffffff - 113;
const DEFAULT_CONST_FINGERPRINT = 0xffffffff - 115;
const LARGE_DOMAIN_SIZE = 1n << 14n;

interface Reach {
  root: Enode;
  parent: Reach | null;
  store: Enode | null;
}

export class TheoryArray extends Theory {
  private finds: number[] = [];
  private sizes: number[] = [];
  private nexts: number[] = [];
  private trail: (() => void)[] = [];
  private trailLimits: number[] = [];
  private stores: Enode[][] = [];
  private parentSelects: Enode[][] = [];
  private parentStores: Enode[][] = [];
  private isPropUpward: boolean[] = [];
  private consts: Enode[][] = [];
  private asArrays: Enode[][] = [];
  private maps: Enode[][] = [];
  private parentMaps: Enode[][] = [];
  private axiom1Todo: Enode[] = [];
  private axiom2Todo: Enode[] = [];
  private extensionalityTodo: Enode[] = [];
  private sortSkolems = new Map<number, number[]>();
  private sortsTrail: number[] = [];
  private sortsTrailLimits: number[] = [];
  private isUnsupportedOpFound = false;
  private finalCheckIndex = 0;
  private assignedEqs = new Set<string>();
  private epsilons = new Map<number, number>();
  private diags = new Map<number, number>();
  private asArrayNodes: Enode[] = [];

  constructor(context: Context) {
    super(context, FAMILY_ARRAY);
  }

  private isOp(node: Enode, op: number) {
    return this.manager.getOp(node.owner) === op;
  }

  private isArrayNode(node: Enode) {
    return this.manager.isArraySort(this.manager.sorts[node.owner]);
  }

  private find(thVar: number) {
    let current = thVar;
    while (this.finds[current] !== current) current = this.finds[current];
    return current;
  }

  private merge(inputFirst: number, inputSecond: number) {
    const firstRoot = this.find(inputFirst);
    const secondRoot = this.find(inputSecond);
    if (firstRoot === secondRoot) return;
    const isSwapped = this.sizes[firstRoot] > this.sizes[secondRoot];
    const joining = isSwapped ? secondRoot : firstRoot;
    const root = isSwapped ? firstRoot : secondRoot;
    this.mergeEh(root, joining);
    this.finds[joining] = root;
    this.sizes[root] += this.sizes[joining];
    const next = this.nexts[joining];
    this.nexts[joining] = this.nexts[root];
    this.nexts[root] = next;
    this.trail.push(() => {
      this.sizes[root] -= this.sizes[joining];
      this.finds[joining] = joining;
      const restored = this.nexts[joining];
      this.nexts[joining] = this.nexts[root];
      this.nexts[root] = restored;
    });
  }

  private pushBack(list: Enode[], node: Enode) {
    list.push(node);
    this.trail.push(() => list.pop());
  }

  private foundUnsupportedOp() {
    if (this.isUnsupportedOpFound) return;
    this.isUnsupportedOpFound = true;
    this.context.pushTrail(() => {
      this.isUnsupportedOpFound = false;
    });
  }

  private mkSelect(args: number[]) {
    return mkArrayApp(this.manager, OP_SELECT, args);
  }

  private mkDefault(array: number) {
    return mkArrayApp(this.manager, OP_ARRAY_DEFAULT, [array]);
  }

  private mkEq(first: number, second: number): Literal {
    if (first === second) return TRUE_LITERAL;
    if (this.manager.areDistinct(first, second)) return FALSE_LITERAL;
    const eq = this.context.mkEqAtom(first, second);
    this.context.internalize(eq, true);
    return this.context.getLiteral(eq);
  }

  private addFingerprint(data: number, dataHash: number, args: Enode[]) {
    return this.context.fingerprints.insert(data, dataHash, args) !== null;
  }

  private getIndexArgs(node: Enode) {
    const args: Enode[] = [];
    for (let index = 1; index < node.numArgs; index++) args.push(node.getArg(index));
    return args;
  }

  private registerSort(sort: number) {
    if (this.sortSkolems.has(sort)) return;
    const manager = this.manager;
    const skolems: number[] = [];
    for (let index = 0; index < manager.getArrayArity(sort); index++)
      skolems.push(mkArrayDecl(manager, OP_ARRAY_EXT, [sort, sort], [index]));
    this.sortSkolems.set(sort, skolems);
    this.sortsTrail.push(sort);
  }

  private mkVar(node: Enode) {
    const manager = this.manager;
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.finds.push(thVar);
    this.sizes.push(1);
    this.nexts.push(thVar);
    this.trail.push(() => {
      this.finds.pop();
      this.sizes.pop();
      this.nexts.pop();
    });
    const isStore = this.isOp(node, OP_STORE);
    this.stores.push(isStore ? [node] : []);
    this.parentSelects.push([]);
    this.parentStores.push([]);
    this.isPropUpward.push(false);
    const sort = manager.sorts[node.owner];
    if (manager.isArraySort(sort)) this.registerSort(sort);
    this.context.attachThVar(node, this, thVar);
    if (isStore) this.axiom1Todo.push(node);
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

  private getVar(node: Enode) {
    return node.getThVar(this.id);
  }

  private ensureVar(node: Enode) {
    if (!this.isAttachedToVar(node)) this.mkVar(node);
  }

  private getArgNode(term: number, index: number) {
    const node = this.context.getEnode(this.manager.getArg(term, index));
    if (node === undefined) throw new SmtInvariantError("an argument was not internalized");
    return node;
  }

  private internalizeTermCore(term: number) {
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
    const manager = this.manager;
    if (context.isEInternalized(term)) return true;
    const op = manager.getOp(term);
    if (op === OP_STORE || op === OP_SELECT) {
      if (!this.internalizeTermCore(term)) return true;
      const array = this.getArgNode(term, 0);
      this.ensureVar(array);
      const node = context.getEnode(term);
      if (context.relevancy.isEnabled || node === undefined) return true;
      if (op === OP_SELECT) this.addParentSelect(this.getVar(array), node);
      else this.addParentStore(this.getVar(array), node);
      return true;
    }
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

  applySortCnstr(node: Enode) {
    this.ensureVar(node);
  }

  newEqEh(first: number, second: number) {
    this.merge(first, second);
  }

  newDiseqEh(inputFirst: number, inputSecond: number) {
    const first = this.find(inputFirst);
    const second = this.find(inputSecond);
    if (this.isArrayNode(this.getEnode(first)))
      this.assertExtensionality(this.getEnode(first), this.getEnode(second));
  }

  private mergeEh(first: number, second: number) {
    if (!this.isPropUpward[first] && this.isPropUpward[second]) this.setPropUpwardVar(first);
    const stores = this.stores[second];
    for (let index = 0; index < stores.length; index++) this.addStore(first, stores[index]);
    const parentStores = this.parentStores[second];
    for (let index = 0; index < parentStores.length; index++)
      this.addParentStore(first, parentStores[index]);
    const parentSelects = this.parentSelects[second];
    for (let index = 0; index < parentSelects.length; index++)
      this.addParentSelect(first, parentSelects[index]);
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

  private addParentSelect(inputVar: number, select: Enode) {
    const thVar = this.find(inputVar);
    this.pushBack(this.parentSelects[thVar], select);
    const stores = this.stores[thVar];
    for (let index = 0; index < stores.length; index++)
      this.assertStoreAxiom2(stores[index], select);
    const consts = this.consts[thVar];
    for (let index = 0; index < consts.length; index++)
      this.instantiateSelectConstAxiom(select, consts[index]);
    const maps = this.maps[thVar];
    for (let index = 0; index < maps.length; index++)
      this.instantiateSelectMapAxiom(select, maps[index]);
  }

  private addParentStore(inputVar: number, store: Enode) {
    this.pushBack(this.parentStores[this.find(inputVar)], store);
  }

  private addStore(inputVar: number, store: Enode) {
    const thVar = this.find(inputVar);
    this.setPropUpwardStores(thVar);
    this.pushBack(this.stores[thVar], store);
    const parentSelects = this.parentSelects[thVar];
    for (let index = 0; index < parentSelects.length; index++)
      this.assertStoreAxiom2(store, parentSelects[index]);
    this.setPropUpwardNode(store);
  }

  private addMap(inputVar: number, map: Enode) {
    const thVar = this.find(inputVar);
    this.setPropUpwardStores(thVar);
    this.pushBack(this.maps[thVar], map);
    const parentSelects = this.parentSelects[thVar];
    for (let index = 0; index < parentSelects.length; index++)
      this.instantiateSelectMapAxiom(parentSelects[index], map);
    this.setPropUpwardNode(map);
  }

  private addParentMap(inputVar: number, map: Enode) {
    this.pushBack(this.parentMaps[this.find(inputVar)], map);
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
    const stores = this.stores[this.find(inputVar)];
    for (let index = 0; index < stores.length; index++)
      if (this.isOp(stores[index], OP_STORE)) this.instantiateDefaultStoreAxiom(stores[index]);
  }

  private setPropUpwardVar(inputVar: number) {
    const thVar = this.find(inputVar);
    if (this.isPropUpward[thVar]) return;
    this.isPropUpward[thVar] = true;
    this.trail.push(() => {
      this.isPropUpward[thVar] = false;
    });
    for (const node of this.stores[thVar]) this.setPropUpwardNode(node);
    for (const node of this.maps[thVar]) this.setPropUpwardNode(node);
    for (const node of this.consts[thVar]) this.setPropUpwardNode(node);
  }

  private setPropUpwardNode(node: Enode) {
    if (this.isOp(node, OP_STORE)) this.setPropUpwardVar(this.getVar(node.getArg(0)));
    else if (this.isOp(node, OP_ARRAY_MAP))
      for (let index = 0; index < node.numArgs; index++)
        this.setPropUpwardVar(this.getVar(node.getArg(index)));
  }

  private setPropUpwardStores(thVar: number) {
    for (const node of this.stores[thVar]) this.setPropUpwardNode(node);
  }

  relevantEh(expr: number) {
    const context = this.context;
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (context.relevancy.isEnabled && (op === OP_STORE || op === OP_SELECT)) {
      if (!context.isEInternalized(expr)) context.internalize(expr, false);
      const node = context.getEnode(expr);
      const array = this.getArgNode(expr, 0);
      if (node !== undefined && op === OP_SELECT) this.addParentSelect(this.getVar(array), node);
      else if (node !== undefined) this.addParentStore(this.getVar(array), node);
    }
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
      this.addParentSelect(this.find(this.getVar(this.getArgNode(expr, 0))), node);
    else if (op === OP_ARRAY_DEFAULT) {
      const thVar = this.getVar(this.getArgNode(expr, 0));
      this.setPropUpwardVar(thVar);
      this.addParentDefault(this.find(thVar));
    } else if (op === OP_CONST_ARRAY) {
      this.instantiateDefaultConstAxiom(node);
      const thVar = this.getVar(node);
      this.setPropUpwardVar(thVar);
      this.addParentDefault(this.find(thVar));
    } else if (op === OP_ARRAY_MAP) {
      for (let index = 0; index < node.numArgs; index++) {
        const thVar = this.find(this.getVar(node.getArg(index)));
        this.addParentMap(thVar, node);
        this.setPropUpwardVar(thVar);
      }
      this.instantiateDefaultMapAxiom(node);
    }
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

  private getSelectKey(select: Enode) {
    let key = "";
    for (let index = 1; index < select.numArgs; index++)
      key += `${select.getArg(index).root.owner},`;
    return key;
  }

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
    this.finalCheckIndex++;
    const delayed = this.finalCheckIndex % 2 === 1 ? this.assertDelayedAxioms() : FC_DONE;
    const result =
      delayed !== FC_DONE
        ? delayed
        : this.mkInterfaceEqs() > 0
          ? FC_CONTINUE
          : this.finalCheckIndex % 2 === 1
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

  private instantiateAxiomMapFor(thVar: number) {
    let result = false;
    for (const map of this.parentMaps[thVar])
      for (const select of this.parentSelects[thVar])
        if (this.instantiateSelectMapAxiom(select, map)) result = true;
    return result;
  }

  private instantiateParentStoresDefault(inputVar: number) {
    let result = false;
    for (const store of this.parentStores[this.find(inputVar)])
      if (this.instantiateDefaultStoreAxiom(store)) result = true;
    return result;
  }

  private assertDelayedAxioms() {
    let result = FC_DONE;
    for (let thVar = 0; thVar < this.getNumVars(); thVar++)
      if (this.isPropUpward[thVar] && this.instantiateAxiom2bFor(thVar)) result = FC_CONTINUE;
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

  private getDomainSizes(array: number) {
    const manager = this.manager;
    const sort = manager.sorts[array];
    return manager
      .getSortParameters(sort)
      .slice(0, -1)
      .map((domain) => manager.getSortSize(domain));
  }

  private hasUnitaryDomain(array: number) {
    return this.getDomainSizes(array).every((size) => size === 1n);
  }

  private hasLargeDomain(array: number) {
    let size = 1n;
    for (const domainSize of this.getDomainSizes(array)) {
      if (domainSize === SORT_SIZE_INFINITE || domainSize === SORT_SIZE_VERY_BIG) return true;
      size *= domainSize;
      if (size >= LARGE_DOMAIN_SIZE) return true;
    }
    return false;
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
    const arrayDefault = this.hasUnitaryDomain(storeExpr)
      ? store.getArg(store.numArgs - 1).owner
      : this.mkDefault(array);
    if (!this.hasUnitaryDomain(storeExpr) && !this.hasLargeDomain(storeExpr)) {
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
      for (const store of this.parentStores[this.find(thVar)]) {
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
    for (const list of [
      this.stores,
      this.parentSelects,
      this.parentStores,
      this.consts,
      this.asArrays,
      this.maps,
      this.parentMaps,
    ])
      list.length = numOldVars;
    this.isPropUpward.length = numOldVars;
    this.axiom1Todo.length = 0;
    this.axiom2Todo.length = 0;
    this.extensionalityTodo.length = 0;
    const sortsLimit = this.sortsTrailLimits[this.sortsTrailLimits.length - numScopes];
    for (let index = this.sortsTrail.length - 1; index >= sortsLimit; index--)
      this.sortSkolems.delete(this.sortsTrail[index]);
    this.sortsTrail.length = sortsLimit;
    this.sortsTrailLimits.length -= numScopes;
    super.popScopeEh(numScopes);
    this.assignedEqs.clear();
  }

  mkValue(): number | undefined {
    throw new SmtUnsupportedError("array models");
  }
}

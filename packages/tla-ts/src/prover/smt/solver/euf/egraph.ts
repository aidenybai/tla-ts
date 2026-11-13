// Ported from Z3 (src/ast/euf/euf_egraph.h, src/ast/euf/euf_egraph.cpp, src/ast/euf/euf_enode.h,
// src/ast/euf/euf_enode.cpp, src/ast/euf/euf_justification.h), MIT license, see z3-license.txt.
import { type AstManager, OP_EQ } from "../ast";
import { CgTable } from "../cg-table";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";

export const NULL_THEORY_VAR = -1;
export const NULL_BOOL_VAR = -1;

export const J_AXIOM = 0;
export const J_CONGRUENCE = 1;
export const J_EXTERNAL = 2;
export const J_EQUALITY = 3;

export interface Justification {
  readonly kind: number;
  readonly isCommutative: boolean;
  readonly external: number;
  readonly lhs: Enode | null;
  readonly rhs: Enode | null;
}

export const AXIOM: Justification = {
  kind: J_AXIOM,
  isCommutative: false,
  external: 0,
  lhs: null,
  rhs: null,
};

const CONGRUENCES: readonly Justification[] = [
  { kind: J_CONGRUENCE, isCommutative: false, external: 0, lhs: null, rhs: null },
  { kind: J_CONGRUENCE, isCommutative: true, external: 0, lhs: null, rhs: null },
];

export const mkExternal = (external: number): Justification => ({
  kind: J_EXTERNAL,
  isCommutative: false,
  external,
  lhs: null,
  rhs: null,
});

interface ThVar {
  id: number;
  thVar: number;
}

export class Enode {
  root: Enode = this;
  next: Enode = this;
  target: Enode | null = null;
  cg: Enode = this;
  parents: Enode[] = [];
  justification = AXIOM;
  litJustification = AXIOM;
  boolVar = NULL_BOOL_VAR;
  value = L_UNDEF;
  classSize = 1;
  thVars: ThVar[] = [];
  isMarked1 = false;
  isMarked2 = false;
  isMarked3 = false;
  isInterpreted = false;
  isCgcEnabled = true;
  isMergeTfEnabled = false;
  isEquality = false;
  isRelevant = false;
  isShared = L_UNDEF;
  lblHash = -1;
  lbls = 0;
  lblsHigh = 0;
  plbls = 0;
  plblsHigh = 0;

  constructor(
    readonly owner: number,
    readonly decl: number,
    readonly args: readonly Enode[],
    readonly generation: number,
    readonly isEq: boolean,
  ) {}

  get numArgs() {
    return this.args.length;
  }

  getArg(index: number) {
    return this.args[index];
  }

  get isRoot() {
    return this.root === this;
  }

  get isCgr() {
    return this.cg === this;
  }

  get mergeTf() {
    return (
      this.isMergeTfEnabled &&
      (this.classSize > 1 || this.parents.length > 0 || this.args.length > 0)
    );
  }

  getThVar(id: number) {
    for (const entry of this.thVars) if (entry.id === id) return entry.thVar;
    return NULL_THEORY_VAR;
  }

  hasThVars() {
    return this.thVars.length > 0;
  }

  addThVar(thVar: number, id: number) {
    this.thVars.push({ id, thVar });
  }

  replaceThVar(thVar: number, id: number) {
    for (const entry of this.thVars) if (entry.id === id) entry.thVar = thVar;
  }

  delThVar(id: number) {
    const index = this.thVars.findIndex((entry) => entry.id === id);
    if (index !== -1) this.thVars.splice(index, 1);
  }

  classGeneration() {
    let generation = this.generation;
    for (const node of getClass(this)) generation = Math.min(node.generation, generation);
    return generation;
  }

  congruent(other: Enode) {
    if (this.decl !== other.decl || this.args.length !== other.args.length) return false;
    if (
      this.isEq &&
      this.args[0].root === other.args[1].root &&
      this.args[1].root === other.args[0].root
    )
      return true;
    for (let index = this.args.length; index-- > 0;)
      if (this.args[index].root !== other.args[index].root) return false;
    return true;
  }
}

const getClosestThVar = (node: Enode, id: number) => {
  for (let current: Enode | null = node; current !== null; current = current.target) {
    const thVar = current.getThVar(id);
    if (thVar !== NULL_THEORY_VAR) return thVar;
  }
  return NULL_THEORY_VAR;
};

const reverseJustification = (node: Enode) => {
  let current = node.target;
  let previous = node;
  let justification = node.justification;
  previous.target = null;
  previous.justification = AXIOM;
  while (current !== null) {
    const nextCurrent: Enode | null = current.target;
    const nextJustification = current.justification;
    current.target = previous;
    current.justification = justification;
    previous = current;
    justification = nextJustification;
    current = nextCurrent;
  }
};

export const getClass = function* (node: Enode) {
  let current = node;
  do {
    yield current;
    current = current.next;
  } while (current !== node);
};

export interface ThEq {
  readonly id: number;
  readonly v1: number;
  readonly v2: number;
  // child for an equality, the equality atom for a disequality
  readonly child: Enode;
  readonly root: Enode | null;
}

const U_ADD_NODE = 0;
const U_SET_PARENT = 1;
const U_TOGGLE_CGC = 2;
const U_TOGGLE_MERGE_TF = 3;
const U_ADD_TH_VAR = 4;
const U_REPLACE_TH_VAR = 5;
const U_NEW_TH_EQ = 6;
const U_NEW_TH_EQ_QHEAD = 7;
const U_INCONSISTENT = 8;
const U_VALUE_ASSIGNMENT = 9;
const U_LBL_HASH = 10;
const U_LBL_SET = 11;
const U_UPDATE_CHILDREN = 12;
const U_SET_RELEVANT = 13;

interface UpdateRecord {
  tag: number;
  r1: Enode | null;
  n1: Enode | null;
  num: number;
  num2: number;
}

const TO_MERGE_PLAIN = 0;
const TO_MERGE_COMM = 1;
const TO_JUSTIFIED = 2;
const TO_ADD_LITERAL = 3;

interface ToMerge {
  a: Enode;
  b: Enode | null;
  kind: number;
  justification: Justification;
}

export class Egraph {
  readonly nodes: Enode[] = [];
  private toMerge: ToMerge[] = [];
  private table = new CgTable<Enode>();
  private updates: UpdateRecord[] = [];
  private scopes: number[] = [];
  private expr2enode: (Enode | undefined)[] = [];
  private decl2enodes = new Map<number, Enode[]>();
  private numScopes = 0;
  isInconsistent = false;
  private n1: Enode | null = null;
  private n2: Enode | null = null;
  private conflictJustification = AXIOM;
  private newThEqsQhead = 0;
  private newThEqs: ThEq[] = [];
  private thPropagatesDiseqs: boolean[] = [];
  private todo: Enode[] = [];
  usesCongruence = false;
  isDefaultRelevant = true;
  readonly onMerge: ((root: Enode, other: Enode) => void)[] = [];
  onPropagateLiteral: ((lit: Enode, ante: Enode | null) => void) | null = null;
  onMake: ((node: Enode) => void) | null = null;
  readonly stats = {
    merges: 0,
    thEqs: 0,
    thDiseqs: 0,
    lits: 0,
    eqs: 0,
    conflicts: 0,
  };

  constructor(private manager: AstManager) {}

  private push(tag: number, r1: Enode | null, n1: Enode | null = null, num = 0) {
    this.updates.push({ tag, r1, n1, num, num2: 0 });
  }

  find(expr: number) {
    return this.expr2enode[expr];
  }

  findCongruent(decl: number, args: readonly Enode[], isEq: boolean) {
    return this.table.findFor(decl, args, isEq);
  }

  enodesOf(decl: number) {
    return this.decl2enodes.get(decl) ?? [];
  }

  get numNodes() {
    return this.nodes.length;
  }

  private forcePush() {
    for (; this.numScopes > 0; this.numScopes--) {
      this.scopes.push(this.updates.length);
      this.push(U_NEW_TH_EQ_QHEAD, null, null, this.newThEqsQhead);
    }
  }

  private mkEnode(expr: number, generation: number, args: readonly Enode[]) {
    const manager = this.manager;
    const isApp = manager.isApp(expr);
    const decl = isApp ? manager.decls[expr] : -1;
    const node = new Enode(
      expr,
      decl,
      args,
      generation,
      args.length === 2 && isApp && manager.getOp(expr) === OP_EQ,
    );
    if (this.isDefaultRelevant) node.isRelevant = true;
    this.nodes.push(node);
    if (isApp && args.length > 0) {
      const enodes = this.decl2enodes.get(decl);
      if (enodes === undefined) this.decl2enodes.set(decl, [node]);
      else enodes.push(node);
    }
    while (this.expr2enode.length < expr) this.expr2enode.push(undefined);
    this.expr2enode[expr] = node;
    manager.incRef(expr);
    this.push(U_ADD_NODE, node);
    for (const arg of args) {
      this.setCgcEnabled(arg, true);
      arg.root.isShared = L_UNDEF;
    }
    return node;
  }

  mk(expr: number, generation: number, args: readonly Enode[]) {
    this.forcePush();
    const manager = this.manager;
    const node = this.mkEnode(expr, generation, args);
    if (args.length === 0 && manager.isUniqueValue(expr)) node.isInterpreted = true;
    this.onMake?.(node);
    if (args.length === 0) return node;
    if (manager.getOp(expr) === OP_EQ && !manager.isBool(args[0].owner)) {
      node.isEquality = true;
      this.reinsertEquality(node);
    }
    const other = this.insertTable(node);
    if (other === node) this.updateChildren(node);
    else this.pushMerge(node, other, this.isComm(node, other));
    return node;
  }

  private isComm(node: Enode, other: Enode) {
    return node.isEq && node.args[0].root !== other.args[0].root;
  }

  private insertTable(node: Enode) {
    const other = this.table.insert(node);
    node.cg = other;
    return other;
  }

  private reinsertEquality(node: Enode) {
    if (node.value !== L_TRUE && node.args[0].root === node.args[1].root) {
      this.queueLiteral(node, null);
      if (node.value === L_FALSE && this.onPropagateLiteral === null)
        this.setConflict(node.args[0], node.args[1], node.litJustification);
    }
  }

  private queueLiteral(node: Enode, ante: Enode | null) {
    if (this.onPropagateLiteral !== null)
      this.toMerge.push({ a: node, b: ante, kind: TO_ADD_LITERAL, justification: AXIOM });
  }

  private updateChildren(node: Enode) {
    for (const child of node.args) child.root.parents.push(node);
    this.push(U_UPDATE_CHILDREN, node);
  }

  private pushMerge(a: Enode, b: Enode, isComm: boolean) {
    this.toMerge.push({
      a,
      b,
      kind: isComm ? TO_MERGE_COMM : TO_MERGE_PLAIN,
      justification: AXIOM,
    });
  }

  pushScope() {
    if (this.canPropagate()) this.propagate();
    this.numScopes++;
  }

  canPropagate() {
    return this.toMerge.length > 0;
  }

  private addThEq(id: number, v1: number, v2: number, child: Enode, root: Enode) {
    this.newThEqs.push({ id, v1, v2, child, root });
    this.push(U_NEW_TH_EQ, null);
    this.stats.thEqs++;
  }

  addThDiseq(id: number, v1: number, v2: number, eq: Enode) {
    if (!this.thPropagatesDiseqs[id]) return;
    this.newThEqs.push({ id, v1, v2, child: eq, root: null });
    this.push(U_NEW_TH_EQ, null);
    this.stats.thDiseqs++;
  }

  private addLiteral(node: Enode, ante: Enode | null) {
    const onPropagate = this.onPropagateLiteral;
    if (onPropagate === null) return;
    if (ante === null) this.stats.eqs++;
    else this.stats.lits++;
    if (ante === null) onPropagate(node, ante);
    else if (this.manager.isTrue(ante.owner) || this.manager.isFalse(ante.owner)) {
      for (const other of getClass(node)) if (other !== ante) onPropagate(other, ante);
    } else
      for (const other of getClass(node)) if (other.value !== ante.value) onPropagate(other, ante);
  }

  newDiseqWithReason(node: Enode, reason: number) {
    this.forcePush();
    const justification = mkExternal(reason);
    const a = node.args[0];
    const b = node.args[1];
    if (a.root === b.root) this.setConflict(a, b, justification);
    else this.setValue(node, L_FALSE, justification);
  }

  newDiseq(node: Enode) {
    const arg1 = node.args[0];
    const arg2 = node.args[1];
    const r1 = arg1.root;
    const r2 = arg2.root;
    if (r1 === r2) {
      this.addLiteral(node, null);
      return;
    }
    if (!r1.hasThVars() || !r2.hasThVars()) return;
    if (r1.thVars.length === 1 && r2.thVars.length === 1 && r1.thVars[0].id === r2.thVars[0].id) {
      const id = r1.thVars[0].id;
      if (!this.thPropagatesDiseqs[id]) return;
      this.addThDiseq(id, getClosestThVar(arg1, id), getClosestThVar(arg2, id), node);
      return;
    }
    for (const p of r1.thVars) {
      if (!this.thPropagatesDiseqs[p.id]) continue;
      for (const q of r2.thVars) if (p.id === q.id) this.addThDiseq(p.id, p.thVar, q.thVar, node);
    }
  }

  private addThDiseqs(id: number, v1: number, root: Enode) {
    if (!this.thPropagatesDiseqs[id]) return;
    for (const parent of root.parents) {
      if (!parent.isEquality || parent.value !== L_FALSE) continue;
      const other = (root === parent.args[0].root ? parent.args[1] : parent.args[0]).root;
      const v2 = getClosestThVar(other, id);
      if (v2 !== NULL_THEORY_VAR) this.addThDiseq(id, v1, v2, parent);
    }
  }

  setThPropagatesDiseqs(id: number) {
    while (this.thPropagatesDiseqs.length <= id) this.thPropagatesDiseqs.push(false);
    this.thPropagatesDiseqs[id] = true;
  }

  addThVar(node: Enode, thVar: number, id: number) {
    this.forcePush();
    const old = node.getThVar(id);
    const root = node.root;
    if (old === NULL_THEORY_VAR) {
      node.addThVar(thVar, id);
      this.push(U_ADD_TH_VAR, node, null, id);
      if (root !== node) {
        const rootVar = root.getThVar(id);
        if (rootVar === NULL_THEORY_VAR) {
          root.addThVar(thVar, id);
          this.addThDiseqs(id, thVar, root);
        } else this.addThEq(id, thVar, rootVar, node, root);
      }
      return;
    }
    const rootVar = root.getThVar(id);
    node.replaceThVar(thVar, id);
    this.updates.push({
      tag: U_REPLACE_TH_VAR,
      r1: node,
      n1: null,
      num: id,
      num2: old,
    });
    this.addThEq(id, thVar, rootVar, node, root);
  }

  private undoAddThVar(node: Enode, id: number) {
    const thVar = node.getThVar(id);
    node.delThVar(id);
    const root = node.root;
    if (root !== node && root.getThVar(id) === thVar) root.delThVar(id);
  }

  setMergeTfEnabled(node: Enode, isEnabled: boolean) {
    if (!this.manager.isBool(node.owner)) return;
    if (isEnabled !== node.mergeTf) {
      node.isMergeTfEnabled = isEnabled;
      this.push(U_TOGGLE_MERGE_TF, node);
    }
  }

  setCgcEnabled(node: Enode, isEnabled: boolean) {
    if (isEnabled === node.isCgcEnabled) return;
    this.toggleCgcEnabled(node, false);
    this.push(U_TOGGLE_CGC, node);
  }

  setRelevant(node: Enode) {
    if (node.isRelevant) return;
    node.isRelevant = true;
    this.push(U_SET_RELEVANT, node);
  }

  private toggleCgcEnabled(node: Enode, isBacktracking: boolean) {
    const isEnabled = !node.isCgcEnabled;
    node.isCgcEnabled = isEnabled;
    if (node.args.length === 0) return;
    if (isEnabled) {
      const other = this.insertTable(node);
      if (other !== node && !isBacktracking) this.pushMerge(node, other, this.isComm(node, other));
    } else if (node.isCgr) this.table.erase(node);
  }

  setValue(node: Enode, value: number, justification: Justification) {
    if (node.value !== L_UNDEF) return;
    this.forcePush();
    node.value = value;
    node.litJustification = justification;
    this.push(U_VALUE_ASSIGNMENT, node);
    if (node.isEquality && value === L_FALSE) this.newDiseq(node);
  }

  setLblHash(node: Enode, hash: number) {
    this.push(U_LBL_HASH, node, null, node.lblHash);
    node.lblHash = hash;
    const root = node.root;
    const isLow = hash < 32;
    const bit = 1 << hash;
    if (((isLow ? root.lbls : root.lblsHigh) & bit) !== 0) return;
    this.updates.push({ tag: U_LBL_SET, r1: root, n1: null, num: root.lbls, num2: root.lblsHigh });
    if (isLow) root.lbls |= bit;
    else root.lblsHigh |= bit;
  }

  popScopes(numScopes: number) {
    if (numScopes <= this.numScopes) {
      this.numScopes -= numScopes;
      this.toMerge = [];
      return;
    }
    numScopes -= this.numScopes;
    this.numScopes = 0;
    const oldLim = this.scopes.length - numScopes;
    const numUpdates = this.scopes[oldLim];
    const manager = this.manager;
    for (let index = this.updates.length; index-- > numUpdates;) {
      const record = this.updates[index];
      const r1 = record.r1 as Enode;
      switch (record.tag) {
        case U_ADD_NODE: {
          const node = this.nodes.pop() as Enode;
          if (node.args.length > 0 && node.isCgr) this.table.erase(node);
          this.expr2enode[node.owner] = undefined;
          manager.decRef(node.owner);
          if (node.args.length > 0) this.decl2enodes.get(node.decl)?.pop();
          break;
        }
        case U_TOGGLE_CGC:
          this.toggleCgcEnabled(r1, true);
          break;
        case U_TOGGLE_MERGE_TF:
          r1.isMergeTfEnabled = !r1.isMergeTfEnabled;
          break;
        case U_SET_PARENT:
          this.undoEq(r1, record.n1 as Enode, record.num);
          break;
        case U_ADD_TH_VAR:
          this.undoAddThVar(r1, record.num);
          break;
        case U_REPLACE_TH_VAR:
          r1.replaceThVar(record.num2, record.num);
          break;
        case U_NEW_TH_EQ:
          this.newThEqs.pop();
          break;
        case U_NEW_TH_EQ_QHEAD:
          this.newThEqsQhead = record.num;
          break;
        case U_INCONSISTENT:
          this.isInconsistent = false;
          break;
        case U_VALUE_ASSIGNMENT:
          r1.value = L_UNDEF;
          break;
        case U_LBL_HASH:
          r1.lblHash = record.num;
          break;
        case U_LBL_SET:
          r1.lbls = record.num;
          r1.lblsHigh = record.num2;
          break;
        case U_SET_RELEVANT:
          r1.isRelevant = false;
          break;
        case U_UPDATE_CHILDREN:
          for (const arg of r1.args) arg.root.parents.pop();
          break;
      }
    }
    this.updates.length = numUpdates;
    this.scopes.length = oldLim;
    this.toMerge = [];
  }

  merge(n1: Enode, n2: Enode, reason: number) {
    this.mergeWith(n1, n2, mkExternal(reason));
  }

  private mergeWith(n1: Enode, n2: Enode, justification: Justification) {
    if (!n1.isCgcEnabled && !n2.isCgcEnabled) return;
    let r1 = n1.root;
    let r2 = n2.root;
    if (r1 === r2) return;
    this.forcePush();
    this.stats.merges++;
    if (r1.isInterpreted && r2.isInterpreted) {
      this.setConflict(n1, n2, justification);
      return;
    }
    if (r1.value !== r2.value && r1.value !== L_UNDEF && r2.value !== L_UNDEF) {
      this.setConflict(n1, n2, justification);
      return;
    }
    if (
      !r2.isInterpreted &&
      (r1.classSize > r2.classSize || r1.isInterpreted || r1.value !== L_UNDEF)
    ) {
      [r1, r2] = [r2, r1];
      [n1, n2] = [n2, n1];
    }
    this.removeParents(r1);
    this.push(U_SET_PARENT, r1, n1, r2.parents.length);
    reverseJustification(n1);
    n1.target = n2;
    n1.justification = justification;
    for (const node of getClass(n1)) node.root = r2;
    const next = r1.next;
    r1.next = r2.next;
    r2.next = next;
    r2.classSize += r1.classSize;
    r2.isShared = L_UNDEF;
    this.mergeThEq(r1, r2);
    this.reinsertParents(r1, r2);
    const manager = this.manager;
    if (
      justification.kind === J_CONGRUENCE &&
      (manager.isFalse(r2.owner) || manager.isTrue(r2.owner))
    )
      this.addLiteral(n1, r2);
    else if (n2.value !== L_UNDEF && n1.value !== n2.value) this.addLiteral(n1, n2);
    else if (n1.value !== L_UNDEF && n2.value !== n1.value) this.addLiteral(n2, n1);
    for (const onMerge of this.onMerge) onMerge(r2, r1);
  }

  private removeParents(root: Enode) {
    for (const parent of root.parents) {
      if (parent.isMarked1) continue;
      if (parent.isCgcEnabled) {
        if (!parent.isCgr) continue;
        parent.isMarked1 = true;
        this.table.erase(parent);
      } else if (parent.isEquality) parent.isMarked1 = true;
    }
  }

  private reinsertParents(r1: Enode, r2: Enode) {
    for (const parent of r1.parents) {
      if (!parent.isMarked1) continue;
      parent.isMarked1 = false;
      if (parent.isCgcEnabled) {
        const other = this.insertTable(parent);
        if (other !== parent) this.pushMerge(other, parent, this.isComm(other, parent));
        else r2.parents.push(parent);
        if (parent.isEquality) this.reinsertEquality(parent);
      } else if (parent.isEquality) {
        r2.parents.push(parent);
        this.reinsertEquality(parent);
      }
    }
  }

  private mergeThEq(node: Enode, root: Enode) {
    for (const entry of node.thVars) {
      const rootVar = root.getThVar(entry.id);
      if (rootVar === NULL_THEORY_VAR) {
        root.addThVar(entry.thVar, entry.id);
        this.push(U_ADD_TH_VAR, root, null, entry.id);
        this.addThDiseqs(entry.id, entry.thVar, root);
      } else this.addThEq(entry.id, rootVar, entry.thVar, node, root);
    }
  }

  private undoEq(r1: Enode, n1: Enode, r2NumParents: number) {
    const r2 = r1.root;
    r2.classSize -= r1.classSize;
    r2.isShared = L_UNDEF;
    const next = r1.next;
    r1.next = r2.next;
    r2.next = next;
    for (let index = r2NumParents; index < r2.parents.length; index++) {
      const parent = r2.parents[index];
      if (parent.isCgcEnabled) this.table.erase(parent);
    }
    for (const node of getClass(r1)) node.root = r1;
    for (const parent of r1.parents)
      if (parent.isCgcEnabled && (parent.isCgr || !parent.congruent(parent.cg)))
        this.insertTable(parent);
    r2.parents.length = r2NumParents;
    n1.target = null;
    n1.justification = AXIOM;
    reverseJustification(n1.root);
  }

  propagate() {
    this.forcePush();
    const toMerge = this.toMerge;
    for (
      let index = 0;
      index < toMerge.length && this.manager.limit.inc() && !this.isInconsistent;
      index++
    ) {
      const item = toMerge[index];
      switch (item.kind) {
        case TO_MERGE_PLAIN:
        case TO_MERGE_COMM:
          this.mergeWith(item.a, item.b as Enode, CONGRUENCES[item.kind]);
          break;
        case TO_JUSTIFIED:
          this.mergeWith(item.a, item.b as Enode, item.justification);
          break;
        case TO_ADD_LITERAL:
          this.addLiteral(item.a, item.b);
          break;
      }
    }
    this.toMerge = [];
    return this.newThEqsQhead < this.newThEqs.length || this.isInconsistent;
  }

  private setConflict(n1: Enode, n2: Enode, justification: Justification) {
    this.stats.conflicts++;
    if (this.isInconsistent) return;
    this.isInconsistent = true;
    this.push(U_INCONSISTENT, null);
    this.n1 = n1;
    this.n2 = n2;
    this.conflictJustification = justification;
  }

  hasThEq() {
    return this.newThEqsQhead < this.newThEqs.length;
  }

  getThEq() {
    return this.newThEqs[this.newThEqsQhead];
  }

  nextThEq() {
    this.forcePush();
    this.newThEqsQhead++;
  }

  areDiseq(a: Enode, b: Enode) {
    const ra = a.root;
    const rb = b.root;
    if (ra === rb) return false;
    if (ra.isInterpreted && rb.isInterpreted) return true;
    if (this.manager.sorts[ra.owner] !== this.manager.sorts[rb.owner]) return true;
    const eq = this.tmpEq(ra, rb);
    return eq !== null && eq.root.value === L_FALSE;
  }

  tmpEq(a: Enode, b: Enode) {
    if (a.parents.length > b.parents.length) [a, b] = [b, a];
    for (const parent of a.parents)
      if (parent.isEquality && (b === parent.args[0].root || b === parent.args[1].root))
        return parent;
    return null;
  }

  private pushCongruence(n1: Enode, n2: Enode, isComm: boolean) {
    this.usesCongruence = true;
    if (isComm && n1.args[0].root === n2.args[1].root && n1.args[1].root === n2.args[0].root) {
      this.pushLca(n1.args[0], n2.args[1]);
      this.pushLca(n1.args[1], n2.args[0]);
      return;
    }
    for (let index = 0; index < n1.args.length; index++)
      this.pushLca(n1.args[index], n2.args[index]);
  }

  private findLca(a: Enode, b: Enode) {
    for (let node: Enode | null = a; node !== null; node = node.target) node.isMarked2 = true;
    let lca = b;
    while (!lca.isMarked2) lca = lca.target as Enode;
    for (let node: Enode | null = a; node !== null; node = node.target) node.isMarked2 = false;
    return lca;
  }

  private pushToLca(node: Enode, lca: Enode) {
    for (let current = node; current !== lca; current = current.target as Enode)
      this.todo.push(current);
  }

  private pushLca(a: Enode, b: Enode) {
    const lca = this.findLca(a, b);
    this.pushToLca(a, lca);
    this.pushToLca(b, lca);
  }

  private pushTodo(node: Enode | null) {
    for (let current = node; current !== null; current = current.target) this.todo.push(current);
  }

  beginExplain() {
    this.usesCongruence = false;
  }

  endExplain() {
    for (const node of this.todo) node.isMarked1 = false;
    this.todo = [];
  }

  explain(justifications: number[]) {
    this.pushTodo(this.n1);
    this.pushTodo(this.n2);
    this.explainJustification(
      justifications,
      this.n1 as Enode,
      this.n2 as Enode,
      this.conflictJustification,
    );
    this.explainTodo(justifications);
  }

  private explainJustification(
    justifications: number[],
    a: Enode,
    b: Enode,
    justification: Justification,
  ) {
    if (justification.kind === J_EXTERNAL) justifications.push(justification.external);
    else if (justification.kind === J_CONGRUENCE)
      this.pushCongruence(a, b, justification.isCommutative);
    else if (justification.kind === J_EQUALITY)
      this.explainEq(justifications, justification.lhs as Enode, justification.rhs as Enode);
  }

  explainEq(justifications: number[], a: Enode, b: Enode) {
    const lca = this.findLca(a, b);
    this.pushToLca(a, lca);
    this.pushToLca(b, lca);
    this.explainTodo(justifications);
  }

  // Returns the Boolean variable of the false equality that explains the disequality, or -1.
  explainDiseq(justifications: number[], a: Enode, b: Enode) {
    const ra = a.root;
    const rb = b.root;
    if (ra.isInterpreted && rb.isInterpreted) {
      this.explainEq(justifications, a, ra);
      this.explainEq(justifications, b, rb);
      return NULL_BOOL_VAR;
    }
    const eq = this.tmpEq(ra, rb) as Enode;
    this.explainEq(justifications, eq, eq.root);
    return eq.root.boolVar;
  }

  private explainTodo(justifications: number[]) {
    const manager = this.manager;
    for (let index = 0; index < this.todo.length; index++) {
      const node = this.todo[index];
      if (node.isMarked1) continue;
      if (node.target !== null) {
        node.isMarked1 = true;
        this.explainJustification(justifications, node, node.target, node.justification);
      } else if (node.value !== L_UNDEF) {
        node.isMarked1 = true;
        if (manager.isTrue(node.owner) || manager.isFalse(node.owner)) continue;
        justifications.push(node.litJustification.external);
      }
    }
  }
}

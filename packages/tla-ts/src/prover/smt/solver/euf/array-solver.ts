// Ported from Z3 (src/sat/smt/array_solver.cpp, src/sat/smt/array_model.cpp), MIT license, see
// z3-license.txt.
import { mkArrayApp, mkAsArray } from "../array-decl-plugin";
import {
  type AstManager,
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
} from "../ast";
import { L_FALSE, L_UNDEF } from "../lbool";
import { getCompositeHash } from "../hash";
import { ObjMap } from "../hashtable";
import { FuncInterp, type ProtoModel } from "../proto-model";
import { CR_CONTINUE, CR_DONE, CR_GIVEUP } from "../sat/solver";
import { hasLargeDomain } from "../theory-array";
import { ArrayAxioms } from "./array-axioms";
import { type Enode, getClass, type ThEq } from "./egraph";
import { addDependency, type Dependencies } from "./th-solver";

const getSelectKey = (select: Enode) =>
  select.args
    .slice(1)
    .map((arg) => arg.root.owner)
    .join(",");

// select_set: a ptr_hashtable of selects that hashes and compares them by the roots of their
// indices, and iterates them in its slot order.
class SelectSet {
  private firsts = new Map<number, Enode>();
  private keys = new Map<string, number>();
  private table: ObjMap<Enode>;

  constructor(manager: AstManager) {
    this.table = new ObjMap((key) =>
      getCompositeHash(
        (this.firsts.get(key) as Enode).args.slice(1).map((arg) => manager.ids[arg.root.owner]),
        0,
      ),
    );
  }

  has(select: Enode) {
    return this.keys.has(getSelectKey(select));
  }

  insert(select: Enode) {
    const key = getSelectKey(select);
    const existing = this.keys.get(key);
    if (existing !== undefined) {
      this.table.set(existing, select);
      return;
    }
    this.keys.set(key, select.owner);
    this.firsts.set(select.owner, select);
    this.table.set(select.owner, select);
  }

  values() {
    return this.table.values();
  }
}

export class ArraySolver extends ArrayAxioms {
  private defaults: (Enode | null)[] = [];
  private elseValues: (number | null)[] = [];
  private parents: number[] = [];
  private selects = new Map<Enode, SelectSet>();

  override check() {
    this.forcePush();
    const turn = [false, false];
    turn[this.random() % 2] = true;
    for (let index = 0; index < 2; index++) {
      if (turn[index] && this.addDelayedAxioms()) return CR_CONTINUE;
      if (!turn[index] && this.addInterfaceEqualities()) return CR_CONTINUE;
    }
    if (this.delayQhead < this.axiomTrail.length) return CR_CONTINUE;
    if (!this.checkLambdas()) return CR_GIVEUP;
    const constArrays = this.checkConstArrays();
    if (constArrays === L_FALSE) return CR_CONTINUE;
    if (constArrays === L_UNDEF) return CR_GIVEUP;
    return CR_DONE;
  }

  override newEqEh(eq: ThEq) {
    this.forcePush();
    this.find.merge(eq.v1, eq.v2);
  }

  override useDiseqs() {
    return true;
  }

  override newDiseqEh(eq: ThEq) {
    this.forcePush();
    const first = this.var2enodeOf(eq.v1);
    if (this.isArray(first.owner))
      this.pushAxiom(this.extensionalityAxiom(first, this.var2enodeOf(eq.v2)));
  }

  override includeFuncInterp(decl: number) {
    return this.manager.funcDecls[decl].op === OP_ARRAY_EXT;
  }

  override initModel() {
    this.collectDefaults();
    this.collectSelects();
  }

  override addDep(node: Enode, deps: Dependencies) {
    if (!this.isArray(node.owner)) {
      deps.set(node, null);
      return true;
    }
    for (const parent of node.root.parents)
      if (this.isOp(parent.owner, OP_ARRAY_DEFAULT)) addDependency(deps, node, parent);
    for (const select of this.getSelectSet(node).values()) {
      addDependency(deps, node, select);
      for (let index = 1; index < select.numArgs; index++)
        addDependency(deps, node, select.getArg(index));
    }
    for (const member of getClass(node))
      if (this.isOp(member.owner, OP_CONST_ARRAY)) addDependency(deps, node, member.getArg(0));
    const defaultNode = this.getDefault(node.getThVar(this.id));
    if (defaultNode !== null) addDependency(deps, node, defaultNode);
    if (!deps.has(node)) deps.set(node, null);
    return true;
  }

  override addValue(inputNode: Enode, model: ProtoModel, values: (number | undefined)[]) {
    const manager = this.manager;
    const sort = manager.sorts[inputNode.owner];
    const node = inputNode.root;
    if (this.isOp(node.owner, OP_AS_ARRAY)) {
      values[node.owner] = node.owner;
      return;
    }
    const thVar = node.getThVar(this.id);
    const defaultNode = this.getDefault(thVar);
    if (this.isOp(node.owner, OP_CONST_ARRAY)) {
      const value = values[(defaultNode as Enode).root.owner] as number;
      values[node.owner] = mkArrayApp(
        manager,
        OP_CONST_ARRAY,
        [value],
        [manager.sorts[node.owner]],
      );
      return;
    }
    const parameters = manager.getSortParameters(sort);
    const domain = parameters.slice(0, -1);
    const range = parameters[parameters.length - 1];
    const decl = manager.mkFreshFuncDecl(null, domain, range);
    const interp = new FuncInterp(manager, domain.length);
    model.registerFunc(decl, interp);
    const defaultValue = defaultNode === null ? undefined : values[defaultNode.root.owner];
    if (defaultValue !== undefined && interp.elseExpr === null) interp.setElse(defaultValue);
    const elseValue = this.getElse(thVar);
    if (interp.elseExpr === null && elseValue !== null) interp.setElse(elseValue);
    if (interp.elseExpr === null) {
      let mostFrequent: number | undefined;
      let maxOccurrences = 0;
      const occurrences = new Map<number, number>();
      for (const parent of node.root.parents) {
        if (!this.isOp(parent.owner, OP_SELECT) || parent.getArg(0).root !== node.root) continue;
        const value = values[parent.root.owner];
        if (value === undefined) continue;
        const count = (occurrences.get(value) ?? 0) + 1;
        occurrences.set(value, count);
        if (count > maxOccurrences) {
          mostFrequent = value;
          maxOccurrences = count;
        }
      }
      if (mostFrequent !== undefined) interp.setElse(mostFrequent);
    }
    if (this.getElse(thVar) === null && interp.elseExpr !== null)
      this.setElse(thVar, interp.elseExpr);
    if (this.getElse(thVar) === null) {
      const someValue = model.getSomeValue(range);
      interp.setElse(someValue);
      this.setElse(thVar, someValue);
    }
    for (const select of this.getSelectSet(node).values()) {
      const value = values[select.root.owner];
      if (value === undefined || value === interp.elseExpr) continue;
      interp.insertEntry(
        select.args.slice(1).map((arg) => values[arg.root.owner] as number),
        value,
      );
    }
    values[node.owner] = mkAsArray(manager, decl);
  }

  protected mustHaveDifferentModelValues(first: number, second: number) {
    const firstExpr = this.var2expr(first);
    if (!this.isArray(firstExpr)) return true;
    const firstElse = this.getDefault(first);
    const secondElse = this.getDefault(second);
    return (
      firstElse !== null &&
      secondElse !== null &&
      firstElse.root !== secondElse.root &&
      hasLargeDomain(this.manager, firstExpr)
    );
  }

  private collectSelects() {
    this.selects.clear();
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      const root = this.var2enodeOf(thVar).root;
      if (this.getRepresentative(thVar) !== thVar) continue;
      for (const parent of root.parents)
        if (parent.isCgr && this.isOp(parent.owner, OP_SELECT) && parent.getArg(0).root === root)
          this.getSelectSet(root).insert(parent);
    }
    const todo: [Enode, Enode][] = [];
    for (const [root, set] of Array.from(this.selects))
      for (const select of Array.from(set.values()))
        this.propagateSelectToStoreParents(root, select, todo);
    for (let qhead = 0; qhead < todo.length; qhead++)
      this.propagateSelectToStoreParents(todo[qhead][0], todo[qhead][1], todo);
  }

  private propagateSelectToStoreParents(root: Enode, select: Enode, todo: [Enode, Enode][]) {
    for (const parent of root.parents) {
      if (!this.isOp(parent.owner, OP_STORE) || parent.getArg(0).root !== root) continue;
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

  private getSelectSet(node: Enode) {
    const root = node.root;
    const existing = this.selects.get(root);
    if (existing !== undefined) return existing;
    const created = new SelectSet(this.manager);
    this.selects.set(root, created);
    return created;
  }

  protected collectDefaults() {
    const numVars = this.numVars;
    this.defaults = Array.from({ length: numVars }, () => null);
    this.elseValues = Array.from({ length: numVars }, () => null);
    this.parents = Array.from({ length: numVars }, () => -1);
    for (let thVar = 0; thVar < numVars; thVar++) {
      const node = this.var2enodeOf(thVar);
      this.mgMerge(thVar, this.getRepresentative(thVar));
      if (this.isOp(node.owner, OP_CONST_ARRAY)) this.setDefault(thVar, node.getArg(0));
      else if (this.isOp(node.owner, OP_STORE))
        this.mgMerge(thVar, this.getRepresentative(node.getArg(0).getThVar(this.id)));
      else if (this.isOp(node.owner, OP_ARRAY_DEFAULT))
        this.setDefault(node.getArg(0).getThVar(this.id), node);
    }
  }

  private setDefault(thVar: number, node: Enode) {
    const root = this.mgFind(thVar);
    this.defaults[root] ??= node;
  }

  private getDefault(thVar: number) {
    return this.defaults[this.mgFind(thVar)];
  }

  private setElse(thVar: number, value: number) {
    this.elseValues[this.mgFind(thVar)] = value;
  }

  private getElse(thVar: number) {
    return this.elseValues[this.mgFind(thVar)];
  }

  private mgFind(thVar: number) {
    let root = thVar;
    while (this.parents[root] >= 0) root = this.parents[root];
    let current = thVar;
    while (this.parents[current] >= 0) {
      const next = this.parents[current];
      this.parents[current] = root;
      current = next;
    }
    return root;
  }

  private mgMerge(inputFirst: number, inputSecond: number) {
    const first = this.mgFind(inputFirst);
    const second = this.mgFind(inputSecond);
    if (first === second) return;
    const isSwapped = this.parents[first] > this.parents[second];
    const root = isSwapped ? second : first;
    const child = isSwapped ? first : second;
    this.parents[root] += this.parents[child];
    this.parents[child] = root;
    this.defaults[root] ??= this.defaults[child];
  }
}

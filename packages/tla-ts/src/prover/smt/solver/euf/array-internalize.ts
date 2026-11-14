// Ported from Z3 (src/sat/smt/array_solver.h, src/sat/smt/array_solver.cpp,
// src/sat/smt/array_internalize.cpp), MIT license, see z3-license.txt.
import { mkArrayDecl } from "../array-decl-plugin";
import {
  FAMILY_ARRAY,
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
} from "../ast";
import { UnionFind } from "../lp/union-find";
import { NULL_LITERAL } from "../sat/clause";
import { type Enode, NULL_THEORY_VAR } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { ThSolver } from "./th-solver";

export const KIND_STORE = 0;
export const KIND_SELECT = 1;
export const KIND_EXTENSIONALITY = 2;
export const KIND_DEFAULT = 3;
export const KIND_CONGRUENCE = 4;

export const STATE_NEW = 0;
export const STATE_DELAYED = 1;
export const STATE_APPLIED = 2;

export interface AxiomRecord {
  readonly kind: number;
  state: number;
  readonly node: Enode;
  readonly select: Enode | null;
}

export interface VarData {
  isPropUpward: boolean;
  hasDefault: boolean;
  readonly lambdas: Enode[];
  readonly parentLambdas: Enode[];
  readonly parentSelects: Enode[];
}

const getAxiomKey = (record: AxiomRecord) =>
  record.kind === KIND_SELECT
    ? `${record.kind},${record.node.owner},${(record.select as Enode).args
        .slice(1)
        .map((arg) => arg.owner)
        .join(",")}`
    : `${record.kind},${record.node.owner},${record.select?.owner ?? -1}`;

export abstract class ArrayInternalize extends ThSolver {
  protected readonly varData: VarData[] = [];
  protected readonly find: UnionFind;
  private sort2diffs = new Map<number, number[]>();
  protected readonly axiomTrail: AxiomRecord[] = [];
  private axioms = new Map<string, number>();
  protected qhead = 0;
  protected delayQhead = 0;
  protected isDelayEnabled = true;

  constructor(ctx: EufSolver, id: number) {
    super(ctx, "array", id);
    this.find = new UnionFind(ctx.trail);
    this.find.handler = { mergeEh: (first, second) => this.mergeEh(first, second) };
  }

  protected abstract assertAxiom(index: number): boolean;

  protected isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  protected isArray(expr: number) {
    const manager = this.manager;
    return manager.isArraySort(manager.sorts[expr]);
  }

  protected isLambda(expr: number) {
    return this.manager.isLambda(expr);
  }

  protected findOf(node: Enode) {
    return this.find.find(node.getThVar(this.id));
  }

  parentSelects(node: Enode) {
    return this.varData[this.findOf(node)].parentSelects;
  }

  protected getVarData(thVar: number) {
    return this.varData[thVar];
  }

  private pushVec(list: Enode[], node: Enode) {
    list.push(node);
    this.ctx.trail.push(() => list.pop());
  }

  protected sort2diff(sort: number) {
    const existing = this.sort2diffs.get(sort);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const result: number[] = [];
    for (let index = 0; index < manager.getArrayArity(sort); index++)
      result.push(mkArrayDecl(manager, OP_ARRAY_EXT, [sort, sort], [index]));
    this.sort2diffs.set(sort, result);
    this.ctx.trail.push(() => this.sort2diffs.delete(sort));
    return result;
  }

  // array_axioms.cpp

  protected pushAxiom(record: AxiomRecord) {
    const key = getAxiomKey(record);
    if (this.axioms.has(key)) return;
    this.axioms.set(key, this.axiomTrail.length);
    this.axiomTrail.push(record);
    this.ctx.trail.push(() => {
      this.axioms.delete(key);
      this.axiomTrail.pop();
    });
  }

  protected selectAxiom(select: Enode, node: Enode): AxiomRecord {
    return { kind: KIND_SELECT, state: STATE_NEW, node, select };
  }

  protected defaultAxiom(node: Enode): AxiomRecord {
    return { kind: KIND_DEFAULT, state: STATE_NEW, node, select: null };
  }

  protected extensionalityAxiom(first: Enode, second: Enode): AxiomRecord {
    return { kind: KIND_EXTENSIONALITY, state: STATE_NEW, node: first, select: second };
  }

  // array_internalize.cpp

  internalize(expr: number, isSign: boolean, isRoot: boolean) {
    if (!this.visitRec(expr, isSign, isRoot)) return NULL_LITERAL;
    const lit = this.expr2literal(expr);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.visitRec(expr, false, false);
  }

  override mkVar(node: Enode) {
    const thVar = super.mkVar(node);
    this.find.mkVar();
    this.ctx.egraph.addThVar(node, thVar, this.id);
    this.varData.push({
      isPropUpward: false,
      hasDefault: false,
      lambdas: [],
      parentLambdas: [],
      parentSelects: [],
    });
    return thVar;
  }

  protected override popCore(numScopes: number) {
    super.popCore(numScopes);
    this.varData.length = this.numVars;
  }

  private ensureVar(node: Enode) {
    if (node.getThVar(this.id) !== NULL_THEORY_VAR) return;
    this.mkVar(node);
    if (this.isLambda(node.owner)) this.internalizeLambdaEh(node);
  }

  override applySortCnstr(node: Enode) {
    this.ensureVar(node);
  }

  protected override visited(expr: number) {
    const node = this.expr2enode(expr);
    return node !== undefined && node.getThVar(this.id) !== NULL_THEORY_VAR;
  }

  protected override visit(expr: number) {
    if (this.visited(expr)) return true;
    const manager = this.manager;
    if (!manager.isApp(expr) || manager.getFamily(expr) !== this.id) {
      this.ctx.internalizeTerm(expr);
      this.ensureVar(this.expr2enode(expr) as Enode);
      return true;
    }
    this.stack.push({ expr, index: 0 });
    return false;
  }

  protected override postVisit(expr: number) {
    const node = this.expr2enode(expr) ?? this.mkEnode(expr);
    if (node.getThVar(this.id) === NULL_THEORY_VAR) this.mkVar(node);
    for (const arg of node.args) this.ensureVar(arg);
    this.internalizeEh(node);
    this.relevantEh(node);
    return true;
  }

  private internalizeLambdaEh(node: Enode) {
    this.pushAxiom(this.defaultAxiom(node));
    this.pushVec(this.getVarData(this.findOf(node)).lambdas, node);
  }

  private internalizeEh(node: Enode) {
    switch (this.manager.getOp(node.owner)) {
      case OP_STORE:
        this.pushVec(this.getVarData(this.findOf(node)).lambdas, node);
        this.pushAxiom({ kind: KIND_STORE, state: STATE_NEW, node, select: null });
        return;
      case OP_AS_ARRAY:
      case OP_CONST_ARRAY:
        this.internalizeLambdaEh(node);
        return;
      case OP_ARRAY_EXT:
        this.pushAxiom(this.extensionalityAxiom(node.getArg(0), node.getArg(1)));
        return;
      case OP_ARRAY_DEFAULT:
        this.addParentDefault(this.findOf(node.getArg(0)));
        return;
      case OP_ARRAY_MAP:
        for (const arg of node.args) this.addParentLambda(this.findOf(arg), node);
        this.internalizeLambdaEh(node);
        return;
    }
  }

  override relevantEh(node: Enode) {
    const manager = this.manager;
    const expr = node.owner;
    if (this.isLambda(expr)) {
      this.setPropUpward(this.findOf(node));
      return;
    }
    if (!manager.isApp(expr) || manager.getFamily(expr) !== FAMILY_ARRAY) return;
    switch (manager.getOp(expr)) {
      case OP_STORE:
        this.addParentLambda(this.findOf(node.getArg(0)), node);
        return;
      case OP_SELECT:
        this.addParentSelect(this.findOf(node.getArg(0)), node);
        return;
      case OP_CONST_ARRAY:
      case OP_AS_ARRAY:
        this.setPropUpward(this.findOf(node));
        this.propagateParentDefault(this.findOf(node));
        return;
      case OP_ARRAY_DEFAULT:
        this.setPropUpward(this.findOf(node.getArg(0)));
        return;
      case OP_ARRAY_MAP:
        for (const arg of node.args) this.setPropUpwardStore(arg);
        this.setPropUpward(this.findOf(node));
        return;
    }
  }

  override isShared(thVar: number) {
    const node = this.var2enodeOf(thVar);
    const root = node.root;
    if (this.isOp(node.owner, OP_ARRAY_EXT)) return true;
    let isArray = false;
    let isIndex = false;
    let isValue = false;
    for (const parent of root.parents) {
      const numArgs = parent.numArgs;
      if (this.isOp(parent.owner, OP_STORE)) {
        isArray ||= parent.getArg(0).root === root;
        for (let index = 1; index < numArgs - 1; index++)
          isIndex ||= parent.getArg(index).root === root;
        isValue ||= parent.getArg(numArgs - 1).root === root;
      } else if (this.isOp(parent.owner, OP_SELECT)) {
        isArray ||= parent.getArg(0).root === root;
        for (let index = 1; index < numArgs - 1; index++)
          isIndex ||= parent.getArg(index).root === root;
      } else if (this.isOp(parent.owner, OP_CONST_ARRAY))
        isValue ||= parent.getArg(0).root === root;
      if (Number(isArray) + Number(isIndex) + Number(isValue) > 1) return true;
    }
    return false;
  }

  override isBetaRedex(parent: Enode, node: Enode) {
    if (this.isOp(parent.owner, OP_SELECT)) return parent.getArg(0).root === node.root;
    return this.isOp(parent.owner, OP_ARRAY_MAP) || this.isOp(parent.owner, OP_STORE);
  }

  override isSelfPropagating() {
    return true;
  }

  // array_solver.cpp

  private mergeEh(first: number, second: number) {
    const firstNode = this.var2enodeOf(first);
    const secondNode = this.var2enodeOf(second);
    const firstData = this.getVarData(first);
    const secondData = this.getVarData(second);
    if (secondData.isPropUpward && !firstData.isPropUpward) this.setPropUpward(first);
    if (firstData.hasDefault && !secondData.hasDefault) this.addParentDefault(second);
    if (!firstData.hasDefault && secondData.hasDefault) this.addParentDefault(first);
    for (const lambda of secondData.lambdas) this.addLambda(first, lambda);
    for (const lambda of secondData.parentLambdas) this.addParentLambda(first, lambda);
    for (const select of secondData.parentSelects) this.addParentSelect(first, select);
    if (this.isLambda(firstNode.owner) || this.isLambda(secondNode.owner))
      this.pushAxiom({
        kind: KIND_CONGRUENCE,
        state: STATE_NEW,
        node: firstNode,
        select: secondNode,
      });
  }

  private addParentSelect(inputChild: number, select: Enode) {
    const child = this.find.find(inputChild);
    this.pushVec(this.getVarData(child).parentSelects, select);
    const childNode = this.var2enodeOf(child);
    if (this.canBetaReduce(childNode.owner)) this.pushAxiom(this.selectAxiom(select, childNode));
    this.propagateParentSelectAxioms(child);
  }

  private addLambda(thVar: number, lambda: Enode) {
    const data = this.getVarData(this.find.find(thVar));
    this.setPropUpwardData(data);
    this.pushVec(data.lambdas, lambda);
    this.propagateSelectAxioms(data, lambda);
    this.setPropUpwardStore(lambda);
  }

  private addParentLambda(child: number, lambda: Enode) {
    const data = this.getVarData(this.find.find(child));
    this.pushVec(data.parentLambdas, lambda);
    if (data.hasDefault) this.pushAxiom(this.defaultAxiom(lambda));
  }

  private addParentDefault(thVar: number) {
    const data = this.getVarData(this.find.find(thVar));
    const hasDefault = data.hasDefault;
    this.ctx.trail.push(() => {
      data.hasDefault = hasDefault;
    });
    data.hasDefault = true;
    for (const lambda of data.lambdas) this.pushAxiom(this.defaultAxiom(lambda));
    this.propagateParentDefault(thVar);
  }

  protected propagateSelectAxioms(data: VarData, lambda: Enode) {
    for (const select of data.parentSelects) this.pushAxiom(this.selectAxiom(select, lambda));
  }

  protected propagateParentDefault(thVar: number) {
    const data = this.getVarData(this.find.find(thVar));
    for (const lambda of data.parentLambdas) this.pushAxiom(this.defaultAxiom(lambda));
  }

  private propagateParentSelectAxioms(inputVar: number) {
    const thVar = this.find.find(inputVar);
    if (!this.isArray(this.var2expr(thVar))) return;
    const data = this.getVarData(thVar);
    for (const lambda of data.lambdas) this.propagateSelectAxioms(data, lambda);
  }

  private setPropUpward(thVar: number) {
    const data = this.getVarData(this.find.find(thVar));
    if (data.isPropUpward) return;
    this.ctx.trail.push(() => {
      data.isPropUpward = false;
    });
    data.isPropUpward = true;
    this.setPropUpwardData(data);
  }

  private setPropUpwardStore(node: Enode) {
    if (this.isOp(node.owner, OP_STORE)) this.setPropUpward(node.getArg(0).getThVar(this.id));
  }

  private setPropUpwardData(data: VarData) {
    for (const lambda of data.lambdas) this.setPropUpwardStore(lambda);
  }

  protected isMapCombinator(expr: number) {
    return this.isOp(expr, OP_ARRAY_MAP);
  }

  private canBetaReduce(expr: number) {
    return (
      this.isOp(expr, OP_CONST_ARRAY) ||
      this.isOp(expr, OP_AS_ARRAY) ||
      this.isOp(expr, OP_STORE) ||
      this.isLambda(expr) ||
      this.isMapCombinator(expr)
    );
  }

  override unitPropagate() {
    if (this.qhead === this.axiomTrail.length) return false;
    this.forcePush();
    const qhead = this.qhead;
    this.ctx.trail.push(() => {
      this.qhead = qhead;
    });
    let isPropagated = false;
    for (; this.qhead < this.axiomTrail.length && !this.s.isInconsistent; this.qhead++)
      if (this.propagateAxiom(this.qhead)) isPropagated = true;
    return isPropagated;
  }

  private propagateAxiom(index: number) {
    const record = this.axiomTrail[index];
    if (record.state === STATE_APPLIED) return false;
    const isPropagated = this.assertAxiom(index);
    if (record.state !== STATE_DELAYED) {
      this.ctx.trail.push(() => {
        record.state = STATE_NEW;
      });
      record.state = STATE_APPLIED;
    }
    return isPropagated;
  }
}

// Ported from Z3 (src/qe/qe.cpp, src/qe/qe_tactic.cpp, src/qe/qe_bool_plugin.cpp,
// src/qe/qe_bv_plugin.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_DATATYPE,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_BSDIV0,
  OP_BSMOD_I,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_OR,
  OP_ULEQ,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import { flattenAndVector, hasUninterpreted, isAppOf, mkNot } from "./ast-util";
import { mkBvApp } from "./bv-decl-plugin";
import { ExprSafeReplace } from "./expr-safe-replace";
import type { Goal } from "./goal";
import { ObjHashtable } from "./hashtable";
import { L_TRUE, L_UNDEF } from "./lbool";
import type { ProtoModel } from "./proto-model";
import { ArithPlugin } from "./qe-arith-plugin";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { InvVarShifter } from "./rewriter-tpl";
import { SmtKernel } from "./smt-kernel";
import { VarSubst } from "./var-subst";

// Whether an expression contains x, with the answers kept for the subterms.
export class ContainsApp {
  private visited = new Set<number>();
  private holds = new Set<number>();

  constructor(
    private manager: AstManager,
    readonly x: number,
  ) {}

  has(expr: number) {
    const manager = this.manager;
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      if (current === this.x) this.holds.add(current);
      if (this.visited.has(current)) {
        todo.pop();
        continue;
      }
      const kind = manager.kinds[current];
      if (kind === KIND_APP) {
        let isAllVisited = true;
        for (const arg of manager.getArgs(current)) {
          if (!this.visited.has(arg)) {
            todo.push(arg);
            isAllVisited = false;
          } else if (this.holds.has(arg)) this.holds.add(current);
        }
        if (isAllVisited) {
          this.visited.add(current);
          todo.pop();
        }
      } else if (kind === KIND_QUANTIFIER) {
        const body = manager.getQuantifier(current).body;
        if (this.visited.has(body)) {
          todo.pop();
          if (this.holds.has(body)) this.holds.add(current);
          this.visited.add(current);
        } else todo.push(body);
      } else {
        todo.pop();
        this.visited.add(current);
      }
    }
    return this.holds.has(expr);
  }
}

export interface QeSolverPlugin {
  readonly family: number;
  getNumBranches(x: ContainsApp, formula: number): bigint | undefined;
  assign(x: ContainsApp, formula: number, value: bigint): void;
  subst(x: ContainsApp, value: bigint, formula: number): number;
  solve(conjs: readonly number[], formula: number): boolean;
  mkAtom(expr: number, isPositive: boolean): number | undefined;
  isUninterpreted(app: number): boolean;
}

export interface QeSolverContext {
  readonly manager: AstManager;
  pin(expr: number): number;
  pinOwned(expr: number): number;
  posAtoms(): ObjHashtable;
  negAtoms(): ObjHashtable;
  getNumVars(): number;
  getVar(index: number): number;
  getVars(): readonly number[];
  getVarIndex(expr: number): number;
  contains(index: number): ContainsApp;
  elimVar(index: number, formula: number): void;
  addVar(x: number): void;
  addConstraint(isUsingCurrent: boolean, ...literals: number[]): void;
  blastOr(variable: number, formula: number): number;
}

const getFlatConjuncts = (manager: AstManager, formula: number) => {
  const conjs = new RefVector(manager);
  conjs.push(formula);
  flattenAndVector(manager, conjs);
  const result = [...conjs.items];
  conjs.reset();
  return result;
};

const applySubstitution = (
  context: QeSolverContext,
  source: number,
  target: number,
  formula: number,
) => {
  const replace = new ExprSafeReplace(context.manager);
  replace.insert(source, target);
  const result = context.pinOwned(replace.apply(formula));
  replace.release();
  return result;
};

class BoolPlugin implements QeSolverPlugin {
  readonly family = FAMILY_BASIC;

  constructor(private context: QeSolverContext) {}

  assign() {}

  getNumBranches() {
    return 2n;
  }

  subst(x: ContainsApp, value: bigint, formula: number) {
    const manager = this.context.manager;
    return applySubstitution(
      this.context,
      x.x,
      value === 1n ? manager.trueExpr : manager.falseExpr,
      formula,
    );
  }

  solve(conjs: readonly number[], formula: number) {
    return this.solveUnits(conjs, formula) || this.solvePolarized(formula);
  }

  mkAtom() {
    return undefined;
  }

  isUninterpreted() {
    return false;
  }

  private solveUnits(conjs: readonly number[], formula: number) {
    const context = this.context;
    const manager = context.manager;
    for (const conj of conjs) {
      if (manager.kinds[conj] !== KIND_APP) continue;
      const index = context.getVarIndex(conj);
      if (index !== -1) {
        context.elimVar(index, applySubstitution(context, conj, manager.trueExpr, formula));
        return true;
      }
      const negatedIndex = manager.isNot(conj) ? context.getVarIndex(manager.getArg(conj, 0)) : -1;
      if (negatedIndex !== -1) {
        const replaced = applySubstitution(
          context,
          manager.getArg(conj, 0),
          manager.falseExpr,
          formula,
        );
        context.elimVar(negatedIndex, replaced);
        return true;
      }
    }
    return false;
  }

  private solvePolarized(formula: number) {
    const context = this.context;
    const manager = context.manager;
    for (let index = 0; index < context.getNumVars(); index++) {
      if (manager.sorts[context.getVar(index)] !== SORT_BOOL) continue;
      const solved = this.solvePolarizedVar(context.contains(index), formula);
      if (solved !== undefined) {
        context.elimVar(index, solved);
        return true;
      }
    }
    return false;
  }

  private solvePolarizedVar(contains: ContainsApp, formula: number) {
    const context = this.context;
    const manager = context.manager;
    const x = contains.x;
    const isPositive = context.posAtoms().has(x);
    const isNegative = context.negAtoms().has(x);
    if (isPositive && isNegative) return undefined;
    if (isPositive || isNegative) {
      for (const atom of context.posAtoms())
        if ((isNegative || atom !== x) && contains.has(atom)) return undefined;
      for (const atom of context.negAtoms())
        if ((isPositive || atom !== x) && contains.has(atom)) return undefined;
      // Each occurrence of x is in atoms of one polarity.
      return applySubstitution(
        context,
        x,
        isPositive ? manager.trueExpr : manager.falseExpr,
        formula,
      );
    }
    return contains.has(formula) ? undefined : formula;
  }
}

class BvPlugin implements QeSolverPlugin {
  readonly family = FAMILY_BV;

  constructor(private context: QeSolverContext) {}

  assign() {}

  getNumBranches(x: ContainsApp) {
    const manager = this.context.manager;
    return 1n << BigInt(manager.getBvSize(manager.sorts[x.x]));
  }

  subst(x: ContainsApp, value: bigint, formula: number) {
    const manager = this.context.manager;
    const numeral = this.context.pin(
      manager.mkBvNumeral(value, manager.getBvSize(manager.sorts[x.x])),
    );
    return applySubstitution(this.context, x.x, numeral, formula);
  }

  solve() {
    return false;
  }

  mkAtom() {
    return undefined;
  }

  isUninterpreted(app: number) {
    const op = this.context.manager.getOp(app);
    return op >= OP_BSDIV0 && op <= OP_BSMOD_I;
  }
}

class SearchTree {
  vars: number[] = [];
  variable = -1;
  formula = -1;
  numBranches = 0n;
  children: SearchTree[] = [];
  branchIndex = new Map<bigint, number>();
  pos: ObjHashtable;
  neg: ObjHashtable;

  constructor(
    private manager: AstManager,
    readonly parent: SearchTree | undefined,
    readonly assignment: number,
  ) {
    this.pos = new ObjHashtable((expr) => manager.hashes[expr]);
    this.neg = new ObjHashtable((expr) => manager.hashes[expr]);
  }

  getLeaves() {
    const result: number[] = [];
    const todo: SearchTree[] = [this];
    for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
      if (
        node.children.length === 0 &&
        node.formula !== -1 &&
        node.vars.length === 0 &&
        node.variable === -1
      )
        result.push(node.formula);
      for (const child of node.children) todo.push(child);
    }
    return result;
  }

  reset() {
    this.pos = new ObjHashtable((expr) => this.manager.hashes[expr]);
    this.neg = new ObjHashtable((expr) => this.manager.hashes[expr]);
    this.children = [];
    this.vars = [];
    this.branchIndex.clear();
    this.variable = -1;
    this.numBranches = 0n;
  }

  setVar(x: number, numBranches: bigint) {
    this.variable = x;
    this.vars.splice(this.vars.indexOf(x), 1);
    this.numBranches = numBranches;
  }

  consumeVars(vars: number[]) {
    while (vars.length > 0) this.vars.push(vars.pop() as number);
  }

  isUnit() {
    return this.children.length === 1 && this.branchIndex.size === 0;
  }

  delVar(x: number) {
    this.vars.splice(this.vars.indexOf(x), 1);
  }

  addChild(formula: number) {
    this.numBranches = 1n;
    const child = new SearchTree(this.manager, this, this.manager.trueExpr);
    this.children.push(child);
    child.formula = formula;
    child.vars.push(...this.vars);
    return child;
  }

  addBranch(branch: bigint, assignment: number) {
    const child = new SearchTree(this.manager, this, assignment);
    this.branchIndex.set(branch, this.children.length);
    this.children.push(child);
    child.vars.push(...this.vars);
    return child;
  }

  getChild(branch: bigint) {
    return this.children[this.branchIndex.get(branch) as number];
  }
}

// Splits the conjuncts into those without the variables, those with both the variables and
// uninterpreted terms, and those with the variables.
const getPartition = (
  plugins: readonly QeSolverPlugin[],
  manager: AstManager,
  rewriter: Rewriter,
  formula: number,
  vars: readonly number[],
) => {
  const conjs = getFlatConjuncts(manager, formula);
  const visited = new Set<number>();
  const containsVar = new Set<number>();
  const containsUf = new Set<number>();
  const isUninterpretedApp = (app: number) => {
    const family = manager.getFamily(app);
    const plugin = plugins.find((candidate) => candidate.family === family);
    return manager.isUninterpreted(app) || plugin === undefined || plugin.isUninterpreted(app);
  };
  const todo = [...conjs];
  while (todo.length > 0) {
    const expr = todo[todo.length - 1];
    if (visited.has(expr)) {
      todo.pop();
      continue;
    }
    if (vars.includes(expr)) {
      containsVar.add(expr);
      visited.add(expr);
      todo.pop();
      continue;
    }
    if (manager.kinds[expr] !== KIND_APP) {
      visited.add(expr);
      todo.pop();
      continue;
    }
    let isAllVisited = true;
    if (isUninterpretedApp(expr)) containsUf.add(expr);
    for (const arg of manager.getArgs(expr)) {
      if (!visited.has(arg)) {
        isAllVisited = false;
        todo.push(arg);
        continue;
      }
      if (containsVar.has(arg)) containsVar.add(expr);
      if (containsUf.has(arg)) containsUf.add(expr);
    }
    if (isAllVisited) {
      todo.pop();
      visited.add(expr);
    }
  }
  const closed: number[] = [];
  const mixed: number[] = [];
  const open: number[] = [];
  for (const conj of conjs) {
    if (containsVar.has(conj) && containsUf.has(conj)) {
      mixed.push(conj);
      open.push(conj);
    } else if (containsVar.has(conj)) open.push(conj);
    else closed.push(conj);
  }
  const mkAnd = (args: number[]) => manager.withTemporaries(() => rewriter.mkAnd(args));
  return { closed: mkAnd(closed), mixed: mkAnd(mixed), open: mkAnd(open) };
};

// Partitions the variables into buckets that cover disjoint sets of conjuncts. A variable in more
// than half of the conjuncts is shared.
const partitionVars = (contains: readonly ContainsApp[], args: readonly number[]) => {
  const partition: number[][] = [];
  const parents: number[] = [];
  const find = (index: number): number => (parents[index] === index ? index : find(parents[index]));
  const nonShared: number[] = [];
  const nonSharedVars: number[] = [];
  for (const [variable, containsX] of contains.entries()) {
    const indices = args.flatMap((arg, index) => (containsX.has(arg) ? [index] : []));
    if (2 * indices.length > args.length) {
      if (partition.length === 0) partition.push([]);
      partition[partition.length - 1].push(variable);
      continue;
    }
    const varX = parents.length;
    parents.push(varX);
    nonSharedVars.push(variable);
    for (const index of indices) {
      const varY = nonShared[index];
      if (varY === undefined) nonShared[index] = varX;
      else {
        const rootX = find(varX);
        const rootY = find(varY);
        if (rootX !== rootY) parents[rootX] = rootY;
      }
    }
  }
  if (nonSharedVars.length === 0) return undefined;
  const root0 = find(0);
  if (!nonSharedVars.some((_, index) => index > 0 && find(index) !== root0)) return undefined;
  const roots: number[] = partition.length > 0 ? [-1] : [];
  for (const [index, x] of nonSharedVars.entries()) {
    const root = nonSharedVars[find(index)];
    const found = roots.indexOf(root);
    if (found !== -1) partition[found].push(x);
    else {
      roots.push(root);
      partition.push([x]);
    }
  }
  return partition;
};

// Converts a formula to negation normal form over the relevant atoms, lifting the if-then-else
// terms of atoms to formulas.
class Nnf {
  private pos = new Map<number, number>();
  private neg = new Map<number, number>();
  private todo: number[] = [];
  private pols: boolean[] = [];

  constructor(
    private context: QeSolverContext,
    private rewriter: Rewriter,
    private isRelevant: (expr: number) => boolean,
  ) {}

  apply(formula: number) {
    this.reset();
    return this.getNnf(formula, true) as number;
  }

  reset() {
    this.todo = [];
    this.pols = [];
    this.pos.clear();
    this.neg.clear();
  }

  private lookup(expr: number, isPositive: boolean) {
    const result = (isPositive ? this.pos : this.neg).get(expr);
    if (result !== undefined) return result;
    this.todo.push(expr);
    this.pols.push(isPositive);
    return undefined;
  }

  private insert(expr: number, isPositive: boolean, result: number) {
    (isPositive ? this.pos : this.neg).set(expr, this.context.pin(result));
  }

  private pop() {
    this.todo.pop();
    this.pols.pop();
  }

  private mkAnd(args: number[]) {
    const manager = this.context.manager;
    return this.context.pinOwned(manager.withTemporaries(() => this.rewriter.mkAnd(args)));
  }

  private mkOr(args: number[]) {
    const manager = this.context.manager;
    return this.context.pinOwned(manager.withTemporaries(() => this.rewriter.mkOr(args)));
  }

  private nnfIff(app: number, isPositive: boolean) {
    const manager = this.context.manager;
    const [first, second] = manager.getArgs(app);
    const r1 = this.lookup(first, true);
    const r2 = this.lookup(first, false);
    const p1 = this.lookup(second, true);
    const p2 = this.lookup(second, false);
    if (r1 === undefined || r2 === undefined || p1 === undefined || p2 === undefined) return;
    this.pop();
    this.insert(
      app,
      isPositive,
      isPositive
        ? this.mkOr([this.mkAnd([r1, p1]), this.mkAnd([r2, p2])])
        : this.mkAnd([this.mkOr([r1, p1]), this.mkOr([r2, p2])]),
    );
  }

  private nnfIte(app: number, isPositive: boolean) {
    const manager = this.context.manager;
    const [condition, thenExpr, elseExpr] = manager.getArgs(app);
    const r1 = this.lookup(condition, true);
    const r2 = this.lookup(condition, false);
    const th = this.lookup(thenExpr, isPositive);
    const el = this.lookup(elseExpr, isPositive);
    if (r1 === undefined || r2 === undefined || th === undefined || el === undefined) return;
    this.pop();
    this.insert(app, isPositive, this.mkOr([this.mkAnd([r1, th]), this.mkAnd([r2, el])]));
  }

  private nnfImplies(app: number, isPositive: boolean) {
    const manager = this.context.manager;
    const r1 = this.lookup(manager.getArg(app, 0), !isPositive);
    const r2 = this.lookup(manager.getArg(app, 1), isPositive);
    if (r1 === undefined || r2 === undefined) return;
    this.insert(app, isPositive, isPositive ? this.mkOr([r1, r2]) : this.mkAnd([r1, r2]));
  }

  private nnfNot(app: number, isPositive: boolean) {
    const result = this.lookup(this.context.manager.getArg(app, 0), !isPositive);
    if (result !== undefined) this.insert(app, isPositive, result);
  }

  private nnfAndOr(isAnd: boolean, app: number, isPositive: boolean) {
    const manager = this.context.manager;
    const args: number[] = [];
    let isVisited = true;
    for (const arg of manager.getArgs(app)) {
      const result = this.lookup(arg, isPositive);
      if (result !== undefined) args.push(result);
      else isVisited = false;
    }
    if (!isVisited) return;
    this.pop();
    this.insert(app, isPositive, isPositive === isAnd ? manager.mkAnd(args) : manager.mkOr(args));
  }

  private getNnf(formula: number, isPositive0: boolean): number | undefined {
    const manager = this.context.manager;
    const size = this.todo.length;
    const found = this.lookup(formula, isPositive0);
    if (found !== undefined) return found;
    while (size < this.todo.length) {
      const expr = this.todo[this.todo.length - 1];
      const isPositive = this.pols[this.pols.length - 1];
      if (!this.isRelevant(expr)) {
        this.pop();
        this.insert(expr, isPositive, isPositive ? expr : mkNot(manager, expr));
        continue;
      }
      if (manager.kinds[expr] !== KIND_APP) return undefined;
      if ((isPositive ? this.pos : this.neg).has(expr)) {
        this.pop();
        continue;
      }
      if (isAppOf(manager, expr, OP_AND) || isAppOf(manager, expr, OP_OR))
        this.nnfAndOr(isAppOf(manager, expr, OP_AND), expr, isPositive);
      else if (manager.isNot(expr)) this.nnfNot(expr, isPositive);
      else if (isAppOf(manager, expr, OP_ITE)) this.nnfIte(expr, isPositive);
      else if (
        isAppOf(manager, expr, OP_EQ) &&
        manager.sorts[manager.getArg(expr, 0)] === SORT_BOOL
      )
        this.nnfIff(expr, isPositive);
      else if (isAppOf(manager, expr, OP_XOR)) this.nnfIff(expr, !isPositive);
      else if (isAppOf(manager, expr, OP_IMPLIES)) this.nnfImplies(expr, isPositive);
      else {
        const lifted = this.liftIte(expr);
        if (lifted !== undefined) {
          const result = this.getNnf(lifted, isPositive);
          if (result === undefined) return undefined;
          this.pop();
          this.insert(expr, isPositive, result);
        } else {
          this.pop();
          this.insert(expr, isPositive, isPositive ? expr : mkNot(manager, expr));
        }
      }
    }
    return this.lookup(formula, isPositive0);
  }

  // lift_ite: replaces a relevant if-then-else term t of the atom by its branches.
  private liftIte(formula: number) {
    const manager = this.context.manager;
    if (isAppOf(manager, formula, OP_ITE)) return formula;
    const ite = this.findIte(formula);
    if (ite === undefined) return undefined;
    const [condition, thenExpr, elseExpr] = manager.getArgs(ite);
    const thenFormula = applySubstitution(this.context, ite, thenExpr, formula);
    const elseFormula = applySubstitution(this.context, ite, elseExpr, formula);
    const result = this.context.pin(
      manager.mkApp(OP_ITE, [condition, thenFormula, elseFormula], SORT_BOOL),
    );
    const rewritten = this.context.pinOwned(this.rewriter.rewrite(result));
    return rewritten !== formula ? rewritten : undefined;
  }

  private findIte(root: number) {
    const manager = this.context.manager;
    const visited = new Set<number>();
    const todo = [root];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (!this.isRelevant(expr)) continue;
      if (isAppOf(manager, expr, OP_ITE)) return expr;
      if (manager.kinds[expr] === KIND_APP) for (const arg of manager.getArgs(expr)) todo.push(arg);
    }
    return undefined;
  }
}

class QuantElimPlugin implements QeSolverContext {
  readonly manager: AstManager;
  private rewriter: Rewriter;
  private solver: SmtKernel;
  private freeVars: number[] = [];
  private formula = -1;
  private subFormula = -1;
  private var2Branch = new Map<number, number>();
  private var2Contains = new Map<number, ContainsApp>();
  private root: SearchTree;
  private current: SearchTree;
  private partition: number[][] = [];
  private newVars: number[] = [];
  private isGetFirst = false;
  private nnf: Nnf;
  private arith: ArithPlugin;
  readonly plugins: QeSolverPlugin[];
  private model: ProtoModel | undefined;

  constructor(private quantElim: QuantElim) {
    const manager = quantElim.manager;
    this.manager = manager;
    this.rewriter = new Rewriter(manager, {
      ...TACTIC_REWRITER_OPTIONS,
      arith: { ...TACTIC_REWRITER_OPTIONS.arith, isGcdRounding: true },
    });
    this.solver = new SmtKernel(manager, {
      isMbqi: true,
      isFindingMacros: false,
      relevancyLevel: 0,
    });
    this.root = new SearchTree(manager, undefined, manager.trueExpr);
    this.current = this.root;
    this.nnf = new Nnf(this, quantElim.rewriter, (expr) => this.isRelevant(expr));
    this.arith = new ArithPlugin(this);
    this.plugins = [new BoolPlugin(this), this.arith, new BvPlugin(this)];
  }

  pin(expr: number) {
    return this.quantElim.pin(expr);
  }

  pinOwned(expr: number) {
    return this.quantElim.pinOwned(expr);
  }

  reset() {
    this.freeVars = [];
    this.var2Contains.clear();
    this.var2Branch.clear();
    this.root.reset();
    this.newVars = [];
    this.formula = -1;
    this.nnf.reset();
    this.setModel(undefined);
  }

  release() {
    this.reset();
    this.rewriter.release();
    this.arith.release();
  }

  private setModel(model: ProtoModel | undefined) {
    model?.incRef();
    this.model?.decRef();
    this.model = model;
  }

  private getPlugin(x: number) {
    const family = this.manager.getSortFamily(this.manager.sorts[x]);
    return this.plugins.find((plugin) => plugin.family === family);
  }

  private isRelevant(expr: number) {
    for (let index = 0; index < this.getNumVars(); index++)
      if (this.contains(index).has(expr)) return true;
    return false;
  }

  // Eliminates the variables from the formula, which is returned, and adds those it could not
  // eliminate to freeVars.
  check(
    vars: readonly number[],
    assumption: number,
    inputFormula: number,
    isGetFirst: boolean,
    freeVars: number[],
  ) {
    const manager = this.manager;
    this.reset();
    this.solver.push();
    this.isGetFirst = isGetFirst;
    for (const x of vars) {
      if (this.getPlugin(x) !== undefined) this.addVar(x);
      else this.freeVars.push(x);
    }
    this.root.consumeVars(this.newVars);
    this.current = this.root;
    this.formula = this.normalize(inputFormula, this.root.pos, this.root.neg);
    let formula = this.formula;
    const relevant = this.getMaxRelevant(formula);
    this.subFormula = relevant.subFormula;
    formula = relevant.formula;
    if (formula !== this.subFormula) {
      this.formula = formula;
      formula = this.subFormula;
      this.solver.assertExpr(formula);
    }
    this.root.formula = formula;
    this.solver.assertExpr(this.formula);
    this.solver.assertExpr(assumption);
    let isSat = false;
    let result = L_TRUE;
    while (result === L_TRUE) {
      result = this.solver.check();
      if (result === L_TRUE && hasUninterpreted(manager, this.formula)) result = L_UNDEF;
      if (result === L_TRUE) result = this.finalCheck();
      if (result !== L_TRUE) break;
      isSat = true;
    }
    const finish = (output: number) => {
      const result =
        this.formula !== this.subFormula
          ? applySubstitution(this, this.subFormula, output, this.formula)
          : output;
      this.reset();
      this.solver.pop(1);
      return result;
    };
    if (result === L_UNDEF) {
      freeVars.push(...vars);
      this.reset();
      this.solver.pop(1);
      return inputFormula;
    }
    if (!isSat) return finish(manager.falseExpr);
    const leaves = this.root.getLeaves();
    const output = isGetFirst
      ? inputFormula
      : this.pinOwned(manager.withTemporaries(() => this.quantElim.rewriter.mkOr(leaves)));
    freeVars.push(...this.freeVars);
    return finish(output);
  }

  private finalCheck() {
    const manager = this.manager;
    const model = this.solver.context.getModel();
    this.setModel(model);
    for (;;) {
      manager.limit.checkpoint();
      while (this.formula !== -1 && this.updateCurrent(false) === NEED_PROPAGATION)
        this.updateCurrent(true);
      this.updateCurrent(true);
      if (this.solver.check() !== L_TRUE) return L_TRUE;
      this.setModel(this.solver.context.getModel());
      const node = this.current;
      this.updateCurrent(false);
      if (node === this.current) break;
    }
    this.pop();
    return L_TRUE;
  }

  posAtoms() {
    return this.current.pos;
  }

  negAtoms() {
    return this.current.neg;
  }

  getNumVars() {
    return this.current.vars.length;
  }

  getVar(index: number) {
    return this.current.vars[index];
  }

  getVars() {
    return this.current.vars;
  }

  getVarIndex(expr: number) {
    return this.current.vars.indexOf(expr);
  }

  contains(index: number) {
    return this.var2Contains.get(this.getVar(index)) as ContainsApp;
  }

  private containsOf(x: number) {
    return this.var2Contains.get(x) as ContainsApp;
  }

  elimVar(index: number, formula: number) {
    const x = this.getVar(index);
    this.current.setVar(x, 1n);
    this.current = this.current.addChild(formula);
    this.current.consumeVars(this.newVars);
    this.normalizeNode(this.current);
  }

  addVar(x: number) {
    const manager = this.manager;
    this.newVars.push(x);
    if (this.var2Branch.has(x)) return;
    this.var2Contains.set(x, new ContainsApp(manager, x));
    const isBranchSelf = manager.sorts[x] === SORT_BOOL || manager.isBvSort(manager.sorts[x]);
    this.var2Branch.set(
      x,
      isBranchSelf ? x : this.pin(manager.mkFreshConst("b", manager.mkBvSort(20))),
    );
  }

  addConstraint(isUsingCurrent: boolean, ...literals: number[]) {
    const manager = this.manager;
    const all: number[] = [];
    for (
      let node = isUsingCurrent ? this.current : this.current.parent;
      node !== undefined;
      node = node.parent
    )
      all.push(this.pin(mkNot(manager, node.assignment)));
    all.push(...literals);
    this.solver.assertExpr(this.pin(manager.mkOr(all)));
  }

  blastOr(variable: number, formula: number) {
    return this.quantElim.eliminateExists([variable], formula, this.freeVars, false);
  }

  private getMaxRelevant(formula: number): { formula: number; subFormula: number } {
    const manager = this.manager;
    if (!isAppOf(manager, formula, OP_AND) && !isAppOf(manager, formula, OP_OR))
      return { formula, subFormula: formula };
    const relevant: number[] = [];
    const irrelevant: number[] = [];
    for (const arg of manager.getArgs(formula))
      (this.isRelevant(arg) ? relevant : irrelevant).push(arg);
    if (relevant.length === 0 || irrelevant.length === 0) return { formula, subFormula: formula };
    const decl = manager.decls[formula];
    if (relevant.length === 1) {
      const inner = this.getMaxRelevant(relevant[0]);
      irrelevant.push(inner.formula);
      return {
        formula: this.pin(manager.mkApp(decl, irrelevant, SORT_BOOL)),
        subFormula: inner.subFormula,
      };
    }
    const subFormula = this.pin(manager.mkApp(decl, relevant, SORT_BOOL));
    irrelevant.push(subFormula);
    return { formula: this.pin(manager.mkApp(decl, irrelevant, SORT_BOOL)), subFormula };
  }

  private updateCurrent(isApplying: boolean) {
    this.current = this.root;
    for (;;) {
      if (this.current.isUnit()) {
        this.current = this.current.children[0];
        continue;
      }
      if (this.current.variable === -1) return CHOOSE_VAR;
      const x = this.current.variable;
      const branchVar = this.var2Branch.get(x) as number;
      const numBranches = this.current.numBranches;
      const formula = this.current.formula;
      const evaluated = this.eval(branchVar);
      const branch = evaluated === undefined || evaluated >= numBranches ? 0n : evaluated;
      if (!this.current.branchIndex.has(branch)) {
        if (isApplying) {
          this.current = this.current.addBranch(branch, this.mkEqValue(branchVar, branch));
          (this.getPlugin(x) as QeSolverPlugin).assign(this.containsOf(x), formula, branch);
          this.current.consumeVars(this.newVars);
        }
        return NEED_PROPAGATION;
      }
      this.current = this.current.getChild(branch);
      if (this.current.formula === -1) {
        if (isApplying) {
          const substituted = (this.getPlugin(x) as QeSolverPlugin).subst(
            this.containsOf(x),
            branch,
            formula,
          );
          this.current.consumeVars(this.newVars);
          this.current.formula = substituted;
          this.normalizeNode(this.current);
        }
        return CHOOSE_VAR;
      }
    }
  }

  private pop() {
    const manager = this.manager;
    this.solveVars();
    const formula = this.current.formula;
    if (this.current.vars.length === 0) {
      this.addConstraint(true);
      return;
    }
    const vars = [...this.current.vars];
    const contains = vars.map((x) => this.containsOf(x));
    const parts = getPartition(this.plugins, manager, this.quantElim.rewriter, formula, vars);
    this.pinOwned(parts.closed);
    this.pinOwned(parts.mixed);
    this.pinOwned(parts.open);
    if (isAppOf(manager, parts.open, OP_AND)) {
      const partition = partitionVars(contains, manager.getArgs(parts.open));
      if (partition !== undefined) {
        this.partition = partition;
        this.processPartition();
        return;
      }
    }
    // The closed part is the quantifier-free part, unless the current state is unsatisfiable.
    if (manager.isTrue(parts.mixed)) {
      this.current = this.current.addChild(parts.closed);
      this.current.vars = [];
      this.addConstraint(true);
      return;
    }
    this.constrainAssignment();
  }

  private normalizeNode(node: SearchTree) {
    node.formula = this.normalize(node.formula, node.pos, node.neg);
  }

  private normalize(formula: number, pos: ObjHashtable, neg: ObjHashtable) {
    const manager = this.manager;
    const rewritten = this.pinOwned(this.rewriter.rewrite(formula));
    const nnf = this.nnf.apply(rewritten);
    const normalized = this.normalizeLiterals(nnf);
    collectAtoms(manager, normalized, (expr) => this.isRelevant(expr), pos, neg);
    return normalized;
  }

  private mkAtom(expr: number, isPositive: boolean) {
    for (const plugin of this.plugins) {
      const result = plugin.mkAtom(expr, isPositive);
      if (result !== undefined) return result;
    }
    return isPositive ? expr : this.pin(mkNot(this.manager, expr));
  }

  private normalizeLiterals(formula: number) {
    const manager = this.manager;
    const cache = new Map<number, number>();
    const todo = [formula];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (cache.has(expr)) {
        todo.pop();
        continue;
      }
      if (manager.kinds[expr] !== KIND_APP || !this.isRelevant(expr)) {
        todo.pop();
        cache.set(expr, expr);
        continue;
      }
      if (isAppOf(manager, expr, OP_AND) || isAppOf(manager, expr, OP_OR)) {
        const args: number[] = [];
        let isAllVisited = true;
        for (const arg of manager.getArgs(expr)) {
          const cached = cache.get(arg);
          if (cached !== undefined) args.push(cached);
          else {
            isAllVisited = false;
            todo.push(arg);
          }
        }
        if (isAllVisited) {
          todo.pop();
          cache.set(expr, this.pin(manager.mkApp(manager.decls[expr], args, SORT_BOOL)));
        }
        continue;
      }
      todo.pop();
      cache.set(
        expr,
        manager.isNot(expr) ? this.mkAtom(manager.getArg(expr, 0), false) : this.mkAtom(expr, true),
      );
    }
    return cache.get(formula) as number;
  }

  private eval(branchVar: number) {
    const manager = this.manager;
    const model = this.model as ProtoModel;
    const value = model.eval(branchVar, false);
    const result = manager.isTrue(value)
      ? 1n
      : manager.isFalse(value)
        ? 0n
        : manager.isBvNumeral(value)
          ? manager.getBvNumeralValue(value)
          : undefined;
    manager.decRef(value);
    return result;
  }

  private mkEqValue(branchVar: number, value: bigint) {
    const manager = this.manager;
    if (manager.sorts[branchVar] === SORT_BOOL)
      return value === 0n ? this.pin(mkNot(manager, branchVar)) : branchVar;
    const numeral = manager.mkBvNumeral(value, manager.getBvSize(manager.sorts[branchVar]));
    return this.pin(manager.mkEq(branchVar, numeral));
  }

  private constrainAssignment() {
    const manager = this.manager;
    const chosen = this.findMinWeight();
    if (chosen === undefined) return;
    this.current.setVar(chosen.x, chosen.numBranches);
    if (manager.isBvSort(manager.sorts[chosen.x])) return;
    const branchVar = this.var2Branch.get(chosen.x) as number;
    if (manager.sorts[branchVar] === SORT_BOOL) return;
    // The branch of the variable is below its number of cases.
    const maxValue = manager.mkBvNumeral(
      chosen.numBranches - 1n,
      manager.getBvSize(manager.sorts[branchVar]),
    );
    this.addConstraint(true, this.pin(mkBvApp(manager, OP_ULEQ, [branchVar, maxValue])));
  }

  private processPartition() {
    let formula = this.current.formula;
    for (let vars = this.partition.pop(); vars !== undefined; vars = this.partition.pop())
      formula = this.quantElim.eliminateExists(
        vars.map((index) => this.current.vars[index]),
        formula,
        this.freeVars,
        this.isGetFirst,
      );
    this.current.addChild(formula).vars = [];
    this.addConstraint(true);
  }

  private findMinWeight() {
    while (this.current.vars.length > 0) {
      const formula = this.current.formula;
      // Z3 compares each weight with UINT_MAX, which it never lowers, so it picks the last
      // variable before the first one without a plugin.
      const firstWithout = this.current.vars.findIndex((x) => this.getPlugin(x) === undefined);
      const index =
        firstWithout === -1 ? this.current.vars.length - 1 : Math.max(firstWithout - 1, 0);
      const x = this.getVar(index);
      const numBranches = this.getPlugin(x)?.getNumBranches(this.containsOf(x), formula);
      if (numBranches !== undefined) return { x, numBranches };
      this.freeVars.push(x);
      this.current.delVar(x);
    }
    return undefined;
  }

  private solveVars() {
    for (let isSolved = true; isSolved;) {
      const formula = this.current.formula;
      const conjs = getFlatConjuncts(this.manager, formula);
      isSolved = this.plugins.some((plugin) => plugin.solve(conjs, formula));
    }
  }
}

const CHOOSE_VAR = 0;
const NEED_PROPAGATION = 1;

const collectAtoms = (
  manager: AstManager,
  formula: number,
  isRelevant: (expr: number) => boolean,
  pos: ObjHashtable,
  neg: ObjHashtable,
) => {
  const visited = new Set<number>();
  const todo = [formula];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] !== KIND_APP || !isRelevant(expr)) continue;
    if (isAppOf(manager, expr, OP_AND) || isAppOf(manager, expr, OP_OR))
      for (const arg of manager.getArgs(expr)) todo.push(arg);
    else if (manager.isNot(expr) && manager.kinds[manager.getArg(expr, 0)] === KIND_APP)
      neg.add(manager.getArg(expr, 0));
    else pos.add(expr);
  }
};

// quant_elim_new: eliminates blocks of variables with a pool of solver contexts.
class QuantElim {
  readonly rewriter: Rewriter;
  private trail: RefVector;
  private pool: QuantElimPlugin[] = [];
  private all: QuantElimPlugin[] = [];
  assumption: number;

  constructor(readonly manager: AstManager) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.trail = new RefVector(manager);
    this.assumption = manager.trueExpr;
  }

  pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  pinOwned(expr: number) {
    this.trail.pushOwned(expr);
    return expr;
  }

  release() {
    for (const plugin of this.all) plugin.release();
    this.rewriter.release();
    this.trail.reset();
  }

  eliminate(isForall: boolean, vars: readonly number[], formula: number) {
    const manager = this.manager;
    if (!isForall) return this.eliminateExistsBind(vars, formula);
    const negated = this.pin(mkNot(manager, formula));
    return this.pin(mkNot(manager, this.eliminateExistsBind(vars, negated)));
  }

  eliminateExists(
    vars: readonly number[],
    formula: number,
    freeVars: number[],
    isGetFirst: boolean,
  ) {
    const manager = this.manager;
    manager.limit.checkpoint();
    if (manager.hasQuantifierFlags[formula]) {
      freeVars.push(...vars);
      return formula;
    }
    const plugin = this.pool.pop() ?? this.mkPlugin();
    const result = plugin.check(vars, this.assumption, formula, isGetFirst, freeVars);
    this.pool.push(plugin);
    plugin.reset();
    return result;
  }

  private mkPlugin() {
    const plugin = new QuantElimPlugin(this);
    this.all.push(plugin);
    return plugin;
  }

  private eliminateExistsBind(vars: readonly number[], formula: number) {
    const manager = this.manager;
    const freeVars: number[] = [];
    const result = this.eliminateExists(vars, formula, freeVars, false);
    const bound = freeVars.filter((x) => new ContainsApp(manager, x).has(result));
    if (bound.length === 0) return result;
    return this.pin(mkExistsOver(manager, bound, result, this));
  }
}

// expr_abstract and mk_exists: binds the constants, the last one to (:var 0).
const mkExistsOver = (
  manager: AstManager,
  vars: readonly number[],
  formula: number,
  quantElim: QuantElim,
) => {
  const replace = new ExprSafeReplace(manager);
  vars.forEach((x, index) =>
    replace.insert(x, quantElim.pin(manager.mkVar(vars.length - 1 - index, manager.sorts[x]))),
  );
  const body = quantElim.pinOwned(replace.apply(formula));
  replace.release();
  return manager.mkQuantifier({
    isForall: false,
    sorts: vars.map((x) => manager.sorts[x]),
    names: vars.map((x) => manager.getDeclName(x)),
    body,
    patterns: [],
    noPatterns: [],
    weight: 1,
    qid: "",
  });
};

// The body of the quantifier over fresh constants for its variables, with a reference.
export const extractVars = (manager: AstManager, quantifier: number, vars: RefVector) => {
  const data = manager.getQuantifier(quantifier);
  const fresh = data.sorts.map((sort) => manager.mkFreshConst("x", sort));
  for (const expr of fresh) vars.push(expr);
  const subst = new VarSubst(manager, true);
  const substituted = subst.apply(data.body, fresh);
  subst.release();
  const shifter = new InvVarShifter(manager);
  const result = shifter.shift(substituted, fresh.length);
  shifter.release();
  manager.decRef(substituted);
  return result;
};

// expr_quant_elim: eliminates the quantifiers of a closed formula, innermost first.
const eliminateQuantifiers = (quantElim: QuantElim, formula: number) => {
  const manager = quantElim.manager;
  const visited = new Map<number, number>();
  const elim = (root: number): number => {
    const todo = [root];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (visited.has(expr)) {
        todo.pop();
        continue;
      }
      if (manager.kinds[expr] === KIND_APP) {
        const args: number[] = [];
        let isAllVisited = true;
        for (const arg of manager.getArgs(expr)) {
          const result = visited.get(arg);
          if (result !== undefined) args.push(result);
          else {
            todo.push(arg);
            isAllVisited = false;
          }
        }
        if (isAllVisited) {
          const isChanged = args.some((arg, index) => arg !== manager.getArg(expr, index));
          visited.set(
            expr,
            isChanged
              ? quantElim.pin(manager.mkApp(manager.decls[expr], args, manager.sorts[expr]))
              : expr,
          );
          todo.pop();
        }
        continue;
      }
      const data = manager.getQuantifier(expr);
      const vars = new RefVector(manager);
      const body = elim(quantElim.pinOwned(extractVars(manager, expr, vars)));
      for (const x of vars.items) quantElim.pin(x);
      visited.set(expr, quantElim.eliminate(data.isForall, vars.items, body));
      vars.reset();
      todo.pop();
    }
    return visited.get(root) as number;
  };
  return elim(formula);
};

export const runQe = (manager: AstManager) => (goal: Goal) => {
  const quantElim = new QuantElim(manager);
  try {
    for (let index = 0; index < goal.forms.size; index++) {
      manager.limit.checkpoint();
      if (goal.isInconsistent) break;
      const formula = goal.forms.items[index];
      if (!manager.hasQuantifierFlags[formula]) continue;
      if (hasUnsupportedSort(manager, formula))
        throw new SmtUnsupportedError("quantifier elimination over arrays or datatypes");
      goal.update(index, eliminateQuantifiers(quantElim, formula));
    }
    goal.depth++;
    goal.elimTrue();
    return [goal];
  } finally {
    quantElim.release();
  }
};

const hasUnsupportedSort = (manager: AstManager, formula: number) => {
  const visited = new Set<number>();
  const todo = [formula];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    const family = manager.getSortFamily(manager.sorts[expr]);
    if (family === FAMILY_ARRAY || family === FAMILY_DATATYPE) return true;
    if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
    else if (manager.kinds[expr] === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      if (
        data.sorts.some((sort) =>
          [FAMILY_ARRAY, FAMILY_DATATYPE].includes(manager.getSortFamily(sort)),
        )
      )
        return true;
      todo.push(data.body);
    }
  }
  return false;
};

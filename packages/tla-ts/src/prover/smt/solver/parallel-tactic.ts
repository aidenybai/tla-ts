// Ported from Z3 (src/solver/parallel_tactical.cpp, src/smt/smt_solver.cpp), MIT license, see
// z3-license.txt.
import { SmtTacticError } from "../../../errors";
import { type AstManager, OP_AND, OP_EQ, OP_ITE, OP_OR } from "./ast";
import { mkNot } from "./ast-util";
import { AssertedFormulas } from "./asserted-formulas";
import type { Context } from "./context";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { getVar, isNegated, toBoolVar } from "./literal";
import type { ProtoModel } from "./proto-model";
import { RandomGen } from "./random-gen";
import { RefVector } from "./ref-vector";
import { isAncestor, isPathContaining, type SearchNode, SearchTree } from "./search-tree";
import { SmtKernel } from "./smt-kernel";
import type { KernelParams } from "./solver";

export interface ParallelParams {
  threadsMax: number;
  numBbThreads: number;
  isAblatingBacktracking: boolean;
}

interface ParallelResult {
  status: number;
  model: ProtoModel | undefined;
  core: number[];
}

const INITIAL_MAX_THREAD_CONFLICTS = 1000;
const MAX_CONFLICT_MUL = 1.5;
const MAX_CUBE_DEPTH = 20;
const UINT_MAX = 4294967295;

const STATE_RUNNING = 0;
const STATE_SAT = 1;
const STATE_UNSAT = 2;
const STATE_UNKNOWN = 3;

const isConnective = (manager: AstManager, atom: number) => {
  const op = manager.getOp(atom);
  return (
    op === OP_AND ||
    op === OP_OR ||
    op === OP_ITE ||
    (op === OP_EQ && manager.isBool(manager.getArg(atom, 0)))
  );
};

// The batch manager and its only worker. Shared clauses never reach the worker that shares them,
// and the backbone candidates and core minimization jobs only feed workers that one hardware
// thread leaves out, so those are not ported.
class ParallelSolver {
  private state = STATE_RUNNING;
  private readonly tree: SearchTree;
  // Holds the literals of the tree, the cores and the global backbones.
  private readonly literals: RefVector;
  private readonly globalBackbones = new Set<number>();
  private readonly knownUnits = new Set<number>();
  // smt_solver's random_gen, which cube_vsids draws from.
  private readonly random = new RandomGen(0);
  private readonly context: Context;
  private readonly numInitialAtoms: number;
  private sharedUnitsPrefix: number;
  private threadsMaxConflicts = INITIAL_MAX_THREAD_CONFLICTS;
  private model: ProtoModel | undefined;
  private core: number[] = [];

  constructor(
    private readonly manager: AstManager,
    private readonly kernel: SmtKernel,
    private readonly assumptions: number[],
    private readonly params: ParallelParams,
  ) {
    this.tree = new SearchTree(manager);
    this.tree.setEffortUnit(INITIAL_MAX_THREAD_CONFLICTS);
    this.literals = new RefVector(manager);
    this.context = kernel.context;
    this.context.popToBaseLevel();
    this.sharedUnitsPrefix = this.context.assignedLiterals.length;
    this.numInitialAtoms = this.context.numBoolVars;
    kernel.setPreprocess(false);
  }

  solve(): ParallelResult {
    for (let lease = this.getCube(true); lease !== undefined; lease = this.getCube(false)) {
      if (!this.conquer(lease, this.getCubeLiterals(lease))) break;
      this.shareUnits();
    }
    this.literals.reset();
    if (this.state === STATE_RUNNING) throw new SmtTacticError("par2: inconsistent end state");
    const status =
      this.state === STATE_SAT ? L_TRUE : this.state === STATE_UNSAT ? L_FALSE : L_UNDEF;
    return { status, model: this.model, core: this.core };
  }

  private getCube(isFirstRun: boolean) {
    if (this.tree.isClosed || this.state !== STATE_RUNNING) return undefined;
    return isFirstRun ? this.tree.activateRoot() : this.tree.activateBestNode();
  }

  private getCubeLiterals(lease: SearchNode) {
    const cube: number[] = [];
    for (
      let node: SearchNode | undefined = lease;
      node !== undefined && node.literal !== -1;
      node = node.parent
    )
      cube.push(node.literal);
    return cube;
  }

  // The worker's loop over one cube, which answers whether the worker goes on to the next cube.
  private conquer(lease: SearchNode, cube: number[]) {
    for (;;) {
      this.context.maxConflicts = this.threadsMaxConflicts;
      const result = this.kernel.check([...this.assumptions, ...cube]);
      if (result === L_TRUE) {
        this.setSat(this.context.getModel());
        return false;
      }
      if (result === L_FALSE) {
        const core = this.context.unsatCore;
        if (core.every((literal) => this.assumptions.includes(literal))) {
          this.setUnsat(core);
          return false;
        }
        this.backtrack(this.params.isAblatingBacktracking ? cube : core, lease);
        return true;
      }
      // Only a cube that ran out of conflicts gets more conflicts or a split.
      const reason = this.context.getLastFailureMessage();
      if (reason !== "max-conflicts-reached") {
        this.setUnknown();
        return false;
      }
      const next = MAX_CONFLICT_MUL * this.threadsMaxConflicts;
      this.threadsMaxConflicts = next >= UINT_MAX ? UINT_MAX : Math.trunc(next);
      if (cube.length >= MAX_CUBE_DEPTH) continue;
      const atom = this.getSplitAtom(cube);
      if (atom === -1) continue;
      this.trySplit(lease, atom);
      return true;
    }
  }

  private setSat(model: ProtoModel) {
    if (this.state !== STATE_RUNNING && this.state !== STATE_UNKNOWN) return;
    this.state = STATE_SAT;
    this.model = model;
  }

  private setUnsat(core: number[]) {
    if (this.state !== STATE_RUNNING && this.state !== STATE_UNKNOWN) return;
    this.state = STATE_UNSAT;
    this.core = core;
  }

  private setUnknown() {
    if (this.state === STATE_RUNNING) this.state = STATE_UNKNOWN;
  }

  // cube_vsids: the unassigned atom of the highest activity, ties broken at random.
  private getSplitAtom(cube: number[]) {
    const manager = this.manager;
    const context = this.context;
    const invalid = new Set(
      [...cube, ...(this.params.numBbThreads > 0 ? this.globalBackbones : [])].map((literal) =>
        manager.isNot(literal) ? manager.getArg(literal, 0) : literal,
      ),
    );
    let result = -1;
    let score = 0;
    let numTies = 0;
    context.popToSearchLevel();
    for (let boolVar = 0; boolVar < context.numBoolVars; boolVar++) {
      if (context.getBoolVarAssignment(toBoolVar(boolVar)) !== L_UNDEF) continue;
      const expr = context.boolVar2Expr[boolVar];
      if (invalid.has(manager.isNot(expr) ? manager.getArg(expr, 0) : expr)) continue;
      const newScore = context.activity[boolVar];
      if (
        newScore > score ||
        result === -1 ||
        (newScore === score && this.random.next() % ++numTies === 0)
      ) {
        score = newScore;
        result = expr;
      }
    }
    return result;
  }

  private trySplit(lease: SearchNode, atom: number) {
    if (this.state !== STATE_RUNNING) return;
    if (!this.tree.isLeaseCanceled(lease)) {
      const negation = mkNot(this.manager, atom);
      this.literals.push(atom);
      this.literals.push(negation);
      this.tree.trySplit(lease, atom, negation, this.threadsMaxConflicts);
    }
    lease.decActiveWorkers();
  }

  private collectMatchingTargets(source: SearchNode | undefined, literal: number, core: number[]) {
    const targets: SearchNode[] = [];
    for (const node of this.tree.findNonclosedNodesWithLiteral(literal)) {
      if (node === source) continue;
      // Another branch's node can only take the conflict when its path has the whole core.
      if (source !== undefined && (isAncestor(source, node) || isAncestor(node, source))) continue;
      if (!core.every((coreLiteral) => isPathContaining(node, coreLiteral))) continue;
      if (node.parent !== undefined && targets.some((target) => isAncestor(target, node.parent)))
        continue;
      targets.push(node);
    }
    return targets;
  }

  private backtrack(core: number[], lease: SearchNode) {
    if (this.state !== STATE_RUNNING) return;
    this.backtrackNodes(core, lease, this.collectMatchingTargets(lease, lease.literal, core));
  }

  private backtrackNodes(core: number[], lease: SearchNode | undefined, targets: SearchNode[]) {
    if (this.state !== STATE_RUNNING) return;
    let isBacktracked = false;
    if (lease !== undefined) {
      lease.decActiveWorkers();
      if (!this.tree.isLeaseCanceled(lease)) {
        isBacktracked = true;
        this.tree.backtrack(lease, core);
      }
    }
    for (const target of targets) {
      if (this.tree.isLeaseCanceled(target)) continue;
      isBacktracked = true;
      this.tree.backtrack(target, core);
    }
    if (isBacktracked && this.tree.isClosed) {
      this.state = STATE_UNSAT;
      this.core = this.tree.root.core;
    }
  }

  private collectGlobalBackbone(backbone: number) {
    if (this.globalBackbones.has(backbone)) return;
    this.globalBackbones.add(backbone);
    const negation = mkNot(this.manager, backbone);
    this.literals.push(backbone);
    this.literals.push(negation);
    const targets = this.collectMatchingTargets(undefined, negation, [negation]);
    if (targets.length > 0) this.backtrackNodes([negation], undefined, targets);
  }

  // Shares the new units of the base level among the initial atoms, skipping the trail's prefix of
  // base-level literals that it already went through.
  private shareUnits() {
    const manager = this.manager;
    const context = this.context;
    const trail = context.assignedLiterals;
    let prefix = Math.min(this.sharedUnitsPrefix, trail.length);
    let isAtPrefix = true;
    for (let index = this.sharedUnitsPrefix; index < trail.length; index++) {
      const literal = trail[index];
      const boolVar = getVar(literal);
      if (context.getLevel(boolVar) > 0) {
        isAtPrefix = false;
        continue;
      }
      if (isAtPrefix) prefix++;
      const atom = context.boolVar2Expr[boolVar];
      if (isConnective(manager, atom) || this.knownUnits.has(boolVar)) continue;
      this.knownUnits.add(boolVar);
      if (!context.isRelevant(atom) || boolVar >= this.numInitialAtoms) continue;
      this.collectGlobalBackbone(isNegated(literal) ? manager.mkNot(atom) : atom);
    }
    this.sharedUnitsPrefix = prefix;
  }
}

// parallel_tactic over mk_smt_solver. Z3 runs a worker for each hardware thread, but the port runs
// the schedule of one hardware thread, where neither backbone nor core minimizer workers run.
// threads.max caps the threads, so that schedule is Z3's with parallel.threads.max=1.
export const solveParallel = (
  manager: AstManager,
  kernelParams: KernelParams,
  params: ParallelParams,
  clauses: number[],
  assumptions: number[],
) => {
  if (params.numBbThreads > 2)
    throw new SmtTacticError("parallel.num_bb_threads must be 0, 1, or 2");
  if (params.threadsMax === 0) throw new SmtTacticError("par2: inconsistent end state");
  // The tactic's solver keeps the asserted formulas, and its worker copies them.
  const source = new AssertedFormulas(manager, kernelParams.isFindingMacros);
  for (const clause of clauses) source.assertExpr(clause);
  const kernel = new SmtKernel(manager, kernelParams);
  for (const formula of source.getFormulas()) kernel.assertExpr(formula);
  kernel.internalize();
  const result = new ParallelSolver(manager, kernel, assumptions, params).solve();
  manager.limit.release();
  return result;
};

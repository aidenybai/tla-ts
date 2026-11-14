// Ported from Z3 (src/opt/maxcore.cpp), MIT license, see z3-license.txt. Only the maxres strategy
// with Z3's default parameters is ported.
import { OP_AND, OP_EQ, OP_IMPLIES, OP_OR, SORT_BOOL } from "./ast";
import { mkNot } from "./ast-util";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type MaxsatContext, MaxsmtSolverBase, type Soft } from "./maxsmt-base";
import { Mus } from "./mus";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";

export class Maxcore extends MaxsmtSolverBase {
  private asms: RefVector;
  private defs: RefVector;
  private asm2weight = new Map<number, Rational>();
  private mus: Mus;
  private csmodel: ProtoModel | null = null;
  private correctionSetSize = 0;
  private isFeasibleOptimumFound = false;

  constructor(context: MaxsatContext, index: number, soft: Soft[]) {
    super(context, soft, index);
    this.asms = new RefVector(context.manager);
    this.defs = new RefVector(context.manager);
    this.mus = new Mus(context.manager, context.getSolver());
  }

  private isLiteral(expr: number) {
    const manager = this.manager;
    const atom = manager.isNot(expr) ? manager.getArg(expr, 0) : expr;
    return manager.isUninterpretedConst(atom);
  }

  private pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  private mkApp(op: number, args: number[]) {
    return this.pin(this.manager.mkApp(op, args, SORT_BOOL));
  }

  private add(expr: number) {
    if (!this.manager.isTrue(expr)) this.solver.assertExpr(expr);
  }

  private addSoft(expr: number, weight: Rational) {
    const existing = this.asm2weight.get(expr);
    if (existing !== undefined) {
      this.asm2weight.set(expr, existing.add(weight));
      return;
    }
    if (this.isLiteral(expr)) {
      this.newAssumption(expr, weight);
      return;
    }
    const assumption = this.mkFreshBool("soft");
    const fml = this.mkApp(OP_EQ, [assumption, expr]);
    this.defs.push(fml);
    this.add(fml);
    this.newAssumption(assumption, weight);
  }

  private newAssumption(expr: number, weight: Rational) {
    this.asm2weight.set(expr, weight);
    this.asms.push(expr);
    this.trail.push(expr);
  }

  private isTrueIn(model: ProtoModel, expr: number) {
    const value = model.eval(expr, true);
    const isTrue = value === this.manager.trueExpr;
    this.manager.decRef(value);
    return isTrue;
  }

  private isFalseIn(model: ProtoModel, expr: number) {
    const value = model.eval(expr, true);
    const isFalse = value === this.manager.falseExpr;
    this.manager.decRef(value);
    return isFalse;
  }

  run() {
    this.defs.reset();
    if (!this.init()) return L_UNDEF;
    this.initLocal();
    while (this.lower.compare(this.upper) < 0) {
      const status = this.checkSatHillClimb(this.asms.items);
      if (!this.manager.limit.inc()) return L_UNDEF;
      if (status === L_TRUE) {
        this.foundOptimum();
        return L_TRUE;
      }
      if (status === L_UNDEF) return L_UNDEF;
      const processed = this.processUnsat();
      if (processed === L_FALSE) this.lower = this.upper;
      if (processed === L_UNDEF) return L_UNDEF;
    }
    this.foundOptimum();
    return L_TRUE;
  }

  private checkSatHillClimb(assumptions: readonly number[]) {
    if (!this.context.params.isHillClimbing) return this.checkSat(assumptions);
    const asms = this.sortAssumptions(assumptions);
    let status = L_TRUE;
    let lastIndex = 0;
    let index = 0;
    while (index < asms.length && status === L_TRUE) {
      while (asms.length > 20 * (index - lastIndex) && index < asms.length)
        index = this.nextIndex(asms, index);
      lastIndex = index;
      status = this.checkSat(asms.slice(0, index));
    }
    return status;
  }

  private checkSat(assumptions: readonly number[]) {
    const status = this.solver.checkSat(assumptions);
    if (status !== L_TRUE) return status;
    const model = this.solver.getModel();
    if (model !== null) this.updateAssignment(model);
    return status;
  }

  private foundOptimum() {
    const model = this.model;
    this.lower = Rational.zero;
    for (const soft of this.soft) {
      soft.value = model !== null && this.isTrueIn(model, soft.expr) ? L_TRUE : L_UNDEF;
      if (soft.value !== L_TRUE) this.lower = this.lower.add(soft.weight);
    }
    this.upper = this.lower;
    this.isFeasibleOptimumFound = true;
  }

  private getWeight(expr: number) {
    return this.asm2weight.get(expr) ?? Rational.zero;
  }

  private sortAssumptions(assumptions: readonly number[]) {
    const ids = this.manager.ids;
    return [...assumptions].sort(
      (first, second) =>
        this.getWeight(second).compare(this.getWeight(first)) || ids[second] - ids[first],
    );
  }

  private nextIndex(asms: readonly number[], start: number) {
    if (start >= asms.length) return start;
    const weight = this.getWeight(asms[start]);
    let index = start + 1;
    while (index < asms.length && weight.equals(this.getWeight(asms[index]))) index++;
    return index;
  }

  private processUnsat() {
    const cores: { core: number[]; weight: Rational }[] = [];
    let status = L_FALSE;
    while (status === L_FALSE) {
      const core = new RefVector(this.manager);
      for (const expr of this.solver.getUnsatCore()) core.push(expr);
      this.updateMusModel();
      status = this.minimizeCore(core);
      const items = [...core.items];
      for (const expr of items) this.trail.push(expr);
      core.reset();
      if (status !== L_TRUE) break;
      if (items.length === 0) {
        this.lower = this.upper;
        return L_TRUE;
      }
      cores.push({ core: items, weight: this.getCoreWeight(items) });
      this.removeSoft(items);
      this.splitCore(items);
      if (items.length >= this.context.params.maxCoreSize) break;
      status = this.checkSatHillClimb(this.asms.items);
    }
    if (status !== L_TRUE) return status;
    if (cores.length === 0) return L_FALSE;
    for (const { core, weight } of cores) this.processCore(core, weight);
    return L_TRUE;
  }

  // The SAT core extracts a model while it computes a core; mus keeps no model for opt.
  private updateMusModel() {
    if (!this.context.isSatEnabled) return;
    const model = this.solver.getModel();
    if (model !== null && this.upper.isPositive()) this.updateAssignment(model);
  }

  private minimizeCore(core: RefVector) {
    if (core.size === 0 || this.context.isSatEnabled) return L_TRUE;
    this.mus.reset();
    for (const expr of core.items) this.mus.addSoft(expr);
    const minimized = new RefVector(this.manager);
    const status = this.mus.getMus(minimized);
    if (status === L_TRUE) {
      core.reset();
      for (const expr of minimized.items) core.push(expr);
    }
    minimized.reset();
    return status;
  }

  private getCoreWeight(core: readonly number[]) {
    if (core.length === 0) return Rational.zero;
    return core
      .map((expr) => this.getWeight(expr))
      .reduce((minimum, weight) => (weight.compare(minimum) < 0 ? weight : minimum));
  }

  private splitCore(core: readonly number[]) {
    const weight = this.getCoreWeight(core);
    for (const expr of core) {
      const other = this.getWeight(expr);
      if (other.compare(weight) > 0) this.newAssumption(expr, other.sub(weight));
    }
    return weight;
  }

  private updateModel(def: number, value: number) {
    const decl = this.manager.decls[def];
    for (const model of [this.csmodel, this.model]) {
      if (model === null) continue;
      const evaluated = model.eval(value, true);
      model.registerConst(decl, evaluated);
      this.manager.decRef(evaluated);
    }
  }

  private processCore(core: readonly number[], weight: Rational) {
    this.maxResolve(core, weight);
    const fml = this.pin(mkNot(this.manager, this.pin(this.manager.mkAnd([...core]))));
    this.add(fml);
    if (core.length <= 2) this.defs.push(fml);
    this.lower = this.lower.add(weight);
    if (this.csmodel !== null && this.correctionSetSize > 0) this.correctionSetSize--;
  }

  private maxResolve(core: readonly number[], weight: Rational) {
    let disjunct = -1;
    for (let index = 1; index < core.length; index++) {
      const previous = core[index - 1];
      const current = core[index];
      if (index === 1) disjunct = previous;
      else if (index === 2) disjunct = this.mkApp(OP_AND, [previous, disjunct]);
      else {
        const fresh = this.mkFreshBool("d");
        for (const implied of [disjunct, previous]) {
          const fml = this.mkApp(OP_IMPLIES, [fresh, implied]);
          this.add(fml);
          this.defs.push(fml);
        }
        this.updateModel(fresh, this.mkApp(OP_AND, [disjunct, previous]));
        disjunct = fresh;
      }
      const assumption = this.mkFreshBool("a");
      const clause = this.mkApp(OP_OR, [current, disjunct]);
      const fml = this.mkApp(OP_IMPLIES, [assumption, clause]);
      this.updateModel(assumption, clause);
      this.newAssumption(assumption, weight);
      this.add(fml);
      this.defs.push(fml);
    }
  }

  private getCost(model: ProtoModel) {
    let cost = Rational.zero;
    for (const soft of this.soft)
      if (!this.isTrueIn(model, soft.expr)) cost = cost.add(soft.weight);
    return cost;
  }

  private updateAssignment(model: ProtoModel) {
    let correctionSetSize = 0;
    for (const expr of this.asms.items) if (this.isFalseIn(model, expr)) correctionSetSize++;
    if (this.csmodel === null || correctionSetSize < this.correctionSetSize) {
      this.csmodel = model;
      this.correctionSetSize = correctionSetSize;
    }
    const upper = this.getCost(model);
    if (upper.compare(this.upper) > 0) return;
    if (!this.context.verifyModel(this.index, model, upper)) return;
    this.model = model;
    this.context.modelUpdated(model);
    for (const soft of this.soft) soft.value = this.isTrueIn(model, soft.expr) ? L_TRUE : L_UNDEF;
    this.upper = upper;
  }

  private removeSoft(core: readonly number[]) {
    const kept = this.asms.items.filter((expr) => !core.includes(expr));
    for (const expr of kept) this.trail.push(expr);
    this.asms.reset();
    for (const expr of kept) this.asms.push(expr);
  }

  private initLocal() {
    for (const soft of this.soft) this.addSoft(soft.expr, soft.weight);
    this.isFeasibleOptimumFound = false;
    this.csmodel = null;
    this.correctionSetSize = 0;
  }

  commitAssignment() {
    if (!this.isFeasibleOptimumFound) return;
    for (const expr of this.defs.items) this.add(expr);
    for (const expr of this.asms.items) this.add(expr);
  }

  release() {
    this.asms.reset();
    this.defs.reset();
    this.mus.reset();
    super.release();
  }
}

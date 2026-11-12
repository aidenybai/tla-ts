// Ported from Z3 (src/sat/sat_solver/inc_sat_solver.cpp), MIT license, see z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import { type AstManager, OP_AND, OP_EQ, OP_IMPLIES, OP_NOT, OP_OR, SORT_BOOL } from "../ast";
import { BitBlasterRewriter } from "../bit-blast-tactic";
import { Goal } from "../goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { ProtoModel } from "../proto-model";
import { RefVector } from "../ref-vector";
import { convertModel, mkIncSatPreprocess } from "../tactic";
import type { SatParams } from "./config";
import { Goal2Sat } from "./goal2sat";
import { getConsequences } from "./consequences";
import { sat2goal } from "./sat2goal";
import { Solver } from "./solver";

const BIT_BLAST_PARAMS = {
  isBlastingMul: true,
  isBlastingAdd: true,
  isBlastingQuant: false,
  isBlastingFull: false,
};

export class IncSatSolver {
  private readonly solver: Solver;
  private readonly goal2sat: Goal2Sat;
  private readonly fmls: RefVector;
  private fmlsHead = 0;
  private isCnf = true;
  private readonly core: RefVector;
  private dep2asm = new Map<number, number>();
  private asms: number[] = [];
  private bitBlaster: BitBlasterRewriter | undefined;
  // m_mcs.back(), the model converters of the preprocessed goals.
  private readonly converters: Goal;
  private isInternalizedConverted = false;
  private readonly internalized: RefVector;
  private hasUninterpreted = false;
  private models: ProtoModel[] = [];
  reasonUnknown = "no reason given";
  wasUnknown = false;

  constructor(
    private readonly manager: AstManager,
    params: SatParams,
    isIncremental = true,
  ) {
    this.solver = new Solver(params, manager.limit, isIncremental);
    this.goal2sat = new Goal2Sat(manager, this.solver, params.get("ite_extra") !== false);
    this.fmls = new RefVector(manager);
    this.core = new RefVector(manager);
    this.converters = new Goal(manager);
    this.internalized = new RefVector(manager);
  }

  private isLiteral(expr: number) {
    const manager = this.manager;
    return (
      manager.isUninterpretedConst(expr) ||
      (manager.isNot(expr) && manager.isUninterpretedConst(manager.getArg(expr, 0)))
    );
  }

  private isClause(expr: number): boolean {
    const manager = this.manager;
    if (manager.depths[expr] > 4) return false;
    if (this.isLiteral(expr)) return true;
    if (!manager.isApp(expr)) return false;
    const op = manager.getOp(expr);
    const isConnective =
      op === OP_OR ||
      op === OP_AND ||
      op === OP_IMPLIES ||
      op === OP_NOT ||
      (op === OP_EQ && manager.isBool(manager.getArg(expr, 0)));
    return isConnective && manager.getArgs(expr).every((arg) => this.isClause(arg));
  }

  assertExpr(expr: number) {
    this.isCnf &&= this.isClause(expr);
    this.fmls.push(expr);
  }

  push(): never {
    throw new SmtUnsupportedError("push on the SAT solver");
  }

  pop(): never {
    throw new SmtUnsupportedError("pop on the SAT solver");
  }

  private checkUninterpreted() {
    if (this.goal2sat.unhandledFuns.length === 0) return L_TRUE;
    this.hasUninterpreted = true;
    const manager = this.manager;
    const names = this.goal2sat.unhandledFuns.map((decl) => manager.funcDecls[decl].name);
    this.reasonUnknown = `(sat.giveup interpreted functions sent to SAT solver (${names.join(" ")}))`;
    return L_UNDEF;
  }

  private internalizeForms(forms: readonly number[]) {
    this.solver.popToBaseLevel();
    if (this.solver.isInconsistent) return L_FALSE;
    this.goal2sat.run(forms);
    return this.checkUninterpreted();
  }

  private internalizeGoal(goal: Goal) {
    this.solver.popToBaseLevel();
    if (this.solver.isInconsistent) return L_FALSE;
    this.bitBlaster ??= new BitBlasterRewriter(this.manager, BIT_BLAST_PARAMS);
    const subgoals = (() => {
      if (this.isCnf) return [goal];
      try {
        const goals = mkIncSatPreprocess(this.manager, this.bitBlaster)(goal);
        this.isCnf = true;
        return goals;
      } catch (error) {
        this.releaseBitBlaster();
        if (!(error instanceof SmtTacticError)) throw error;
        this.reasonUnknown = error.message;
        return undefined;
      }
    })();
    if (subgoals?.length !== 1) return L_UNDEF;
    const subgoal = subgoals[0];
    this.converters.converters = [...this.converters.converters, ...subgoal.converters];
    this.goal2sat.run(subgoal.forms.items);
    return this.checkUninterpreted();
  }

  private internalizeFormulas() {
    if (this.fmlsHead === this.fmls.size) return L_TRUE;
    const pending = this.fmls.items.slice(this.fmlsHead);
    const result = (() => {
      if (this.isCnf) return this.internalizeForms(pending);
      const goal = new Goal(this.manager);
      for (const form of pending) goal.assert(form);
      return this.internalizeGoal(goal);
    })();
    if (result !== L_UNDEF) this.fmlsHead = this.fmls.size;
    this.isInternalizedConverted = false;
    return result;
  }

  private internalizeAssumptions(assumptions: readonly number[]) {
    this.asms = [];
    const seen = new Set<number>();
    for (const assumption of assumptions) {
      const lit = this.goal2sat.getAssumptionLit(assumption);
      this.dep2asm.set(assumption, lit);
      if (seen.has(lit)) continue;
      seen.add(lit);
      this.asms.push(lit);
    }
    return L_TRUE;
  }

  check(assumptions: readonly number[] = []) {
    const manager = this.manager;
    this.solver.popToBaseLevel();
    this.core.reset();
    if (this.solver.isInconsistent) return L_FALSE;
    const literals: number[] = [];
    const asm2fml = new Map<number, number>();
    for (const assumption of assumptions) {
      if (this.isLiteral(assumption)) {
        literals.push(assumption);
        asm2fml.set(assumption, assumption);
        continue;
      }
      const fresh = manager.mkFreshConst("s", SORT_BOOL);
      this.assertExpr(manager.mkEq(fresh, assumption));
      literals.push(fresh);
      asm2fml.set(fresh, assumption);
    }
    this.dep2asm = new Map();
    const internalized = this.internalizeFormulas();
    if (internalized !== L_TRUE) return internalized;
    this.internalizeAssumptions(literals);
    this.reasonUnknown = "no reason given";
    this.isInternalizedConverted = false;
    const result = this.solver.check(this.asms);
    if (result === L_TRUE && this.hasUninterpreted) {
      this.reasonUnknown = "(sat.giveup has-uninterpreted)";
      return L_UNDEF;
    }
    if (result === L_FALSE && this.asms.length > 0) this.extractCore(asm2fml);
    if (result === L_UNDEF) this.reasonUnknown = this.solver.reasonUnknown;
    if (result !== L_FALSE) this.core.reset();
    return result;
  }

  // internalize_var: the variables of a constant's bits, undefined for a bit the solver lacks.
  private internalizeVar(expr: number) {
    const manager = this.manager;
    if (!manager.isUninterpretedConst(expr)) return [undefined];
    if (manager.isBool(expr)) return [this.goal2sat.atoms.get(expr)];
    const bits = this.bitBlaster?.getConstBits(manager.decls[expr]);
    if (bits === undefined) return [undefined];
    return manager.getArgs(bits).map((bit) => this.goal2sat.atoms.get(bit));
  }

  private getValue(expr: number, value: readonly number[]) {
    const manager = this.manager;
    if (manager.isBool(expr)) return value[0] & 1 ? manager.mkNot(expr) : expr;
    const numeral = value.reduce(
      (sum, lit, index) => (lit & 1 ? sum : sum + (1n << BigInt(index))),
      0n,
    );
    return manager.mkEq(expr, manager.mkBvNumeral(numeral, value.length));
  }

  getConsequences(assumptions: readonly number[], vars: readonly number[]) {
    const manager = this.manager;
    this.bitBlaster ??= new BitBlasterRewriter(manager, BIT_BLAST_PARAMS);
    this.dep2asm = new Map();
    this.solver.popToBaseLevel();
    const consequences: number[] = [];
    const internalized = this.internalizeFormulas();
    if (internalized !== L_TRUE) return { result: internalized, consequences };
    if (!assumptions.every((assumption) => this.isLiteral(assumption)))
      throw new SmtUnsupportedError("get-consequences assumptions that are not literals");
    this.internalizeAssumptions(assumptions);
    const found = getConsequences(
      this.solver,
      this.asms,
      vars.flatMap((expr) => this.internalizeVar(expr).filter((boolVar) => boolVar !== undefined)),
    );
    if (found.result === L_FALSE && this.asms.length > 0) this.extractCore(new Map());
    if (found.result === L_FALSE) return { result: found.result, consequences };
    const boolVar2conseq = new Map<number, number[]>();
    for (const consequence of found.consequences)
      boolVar2conseq.set(consequence[0] >> 1, consequence);
    const asm2dep = new Map<number, number>();
    for (const [dep, lit] of this.dep2asm) asm2dep.set(lit, dep);
    for (const expr of vars) {
      const boolVars = this.internalizeVar(expr);
      const fixed = boolVars
        .map((boolVar) => (boolVar === undefined ? undefined : boolVar2conseq.get(boolVar)))
        .filter((consequence) => consequence !== undefined);
      if (fixed.length < boolVars.length) continue;
      const value: number[] = [];
      const premises = new Set<number>();
      for (const consequence of fixed) {
        value.push(consequence[0]);
        for (const lit of consequence.slice(1)) premises.add(lit);
      }
      // Z3 pops the premises, the last inserted first.
      const conjuncts = [...premises].reverse().map((lit) => asm2dep.get(lit) as number);
      consequences.push(
        manager.mkApp(
          OP_IMPLIES,
          [manager.mkAnd(conjuncts), this.getValue(expr, value)],
          SORT_BOOL,
        ),
      );
    }
    return { result: found.result, consequences };
  }

  private extractCore(asm2fml: Map<number, number>) {
    const asm2dep = new Map<number, number>();
    for (const [dep, lit] of this.dep2asm) asm2dep.set(lit, dep);
    const core = this.solver.core.map((lit) => {
      const dep = asm2dep.get(lit) as number;
      return asm2fml.get(dep) ?? dep;
    });
    this.core.reset();
    for (const expr of core) this.core.push(expr);
  }

  getUnsatCore() {
    return this.core.items;
  }

  getModel() {
    const manager = this.manager;
    if (!this.solver.isModelCurrent || this.fmls.size > this.fmlsHead) return null;
    const model = new ProtoModel(manager);
    for (const [expr, boolVar] of this.goal2sat.atoms) {
      if (!manager.isUninterpretedConst(expr)) continue;
      const value = this.solver.model[boolVar];
      if (value === L_TRUE) model.registerConst(manager.decls[expr], manager.trueExpr);
      else if (value === L_FALSE) model.registerConst(manager.decls[expr], manager.falseExpr);
    }
    const converted = convertModel(this.converters, model.mkModel());
    converted.incRef();
    this.models.push(converted);
    return converted;
  }

  findMutexes(vars: readonly number[]) {
    const manager = this.manager;
    const lit2expr = new Map<number, number>();
    const lits: number[] = [];
    for (const expr of vars) {
      const isNot = manager.isNot(expr);
      const boolVar = this.goal2sat.atoms.get(isNot ? manager.getArg(expr, 0) : expr);
      if (boolVar === undefined) continue;
      const lit = 2 * boolVar + (isNot ? 1 : 0);
      lit2expr.set(lit, expr);
      lits.push(lit);
    }
    return this.solver
      .findMutexes(lits)
      .map((mutex) => mutex.map((lit) => lit2expr.get(lit) as number));
  }

  // convert_internalized: the formulas the SAT solver holds, or the asserted ones while they are
  // not internalized.
  getAssertions() {
    this.solver.popToBaseLevel();
    if (this.fmlsHead !== this.fmls.size && this.fmlsHead > 0) this.internalizeFormulas();
    if (this.fmlsHead !== this.fmls.size) return this.fmls.items;
    if (this.isInternalizedConverted) return this.internalized.items;
    const goal = new Goal(this.manager);
    sat2goal(this.manager, this.solver, this.goal2sat.atoms, goal);
    this.internalized.reset();
    for (const form of goal.forms.items) this.internalized.push(form);
    this.converters.converters = [...this.converters.converters, ...goal.converters];
    this.isInternalizedConverted = true;
    return this.internalized.items;
  }

  // get_model_converter: the converters of the preprocessed goals and sat2goal's, once the
  // asserted formulas are internalized.
  getConverters(): Goal["converters"] {
    this.getAssertions();
    return this.isInternalizedConverted ? this.converters.converters : [];
  }

  release() {
    for (const model of this.models) model.decRef();
    this.models = [];
    this.fmls.reset();
    this.core.reset();
    this.internalized.reset();
    this.releaseBitBlaster();
  }

  private releaseBitBlaster() {
    this.bitBlaster?.releaseCfg();
    this.bitBlaster?.release();
    this.bitBlaster = undefined;
  }
}

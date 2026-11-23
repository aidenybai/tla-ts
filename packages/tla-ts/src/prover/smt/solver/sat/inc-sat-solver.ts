import {
  SmtCanceledError,
  SmtDefaultError,
  SmtTacticError,
  SmtUnsupportedError,
} from "../../../../errors";
import { type AstManager, OP_AND, OP_EQ, OP_IMPLIES, OP_NOT, OP_OR, SORT_BOOL } from "../ast";
import { mkNot } from "../ast-util";
import { BitBlasterRewriter } from "../bit-blast-tactic";
import { decConverterRefs, Goal, incConverterRefs, mkDependencyLeaf } from "../goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { ModelEvaluator } from "../model-evaluator";
import { ProtoModel } from "../proto-model";
import { PropagateValuesTactic } from "../propagate-values";
import { RefVector } from "../ref-vector";
import {
  DEFAULT_PRINT_OPTIONS,
  formatSort,
  getQuotedName,
  mkSeq1,
  mkSeq5,
  mkText,
  renderFormat,
} from "../smt2-printer";
import { mkThSolver } from "../euf/th-solvers";
import {
  applyDefinitions,
  convertModel,
  getSatParams,
  mkIncSatEufPreprocess,
  mkIncSatPreprocess,
  type TacticParam,
  type TacticParams,
} from "../tactic";
import { getCardinalityOptions } from "../card2bv";
import type { SatParams } from "./config";
import { Goal2Sat } from "./goal2sat";
import { getConsequences } from "./consequences";
import { getLitValue } from "./model-converter";
import { isLiteral, Sat2GoalConverter, sat2goal } from "./sat2goal";
import { Solver } from "./solver";

const BIT_BLAST_PARAMS = {
  isBlastingMul: true,
  isBlastingAdd: true,
  isBlastingQuant: false,
  isBlastingFull: false,
};

const getCardinalityParams = (params: SatParams) =>
  new Map<string, TacticParam>([
    ["keep_cardinality_constraints", params.get("cardinality.solver") !== false],
    ["pb.solver", params.get("pb.solver") ?? "solver"],
  ]);

interface Scope {
  readonly converters: Goal["converters"];
  readonly fmlsSize: number;
  readonly fmlsHead: number;
  readonly namesSize: number;
  readonly hasUninterpreted: boolean;
}

export class IncSatSolver {
  private readonly solver: Solver;
  private readonly goal2sat: Goal2Sat;
  private readonly fmls: RefVector;
  private fmlsHead = 0;
  private readonly names: RefVector;
  private isCnf = true;
  private readonly core: RefVector;
  private dep2asm = new Map<number, number>();
  private asms: number[] = [];
  private bitBlaster: BitBlasterRewriter | undefined;
  // m_mcs.back(), the model converters of the preprocessed goals.
  private readonly converters: Goal;
  private readonly satConverter: Sat2GoalConverter;
  private isInternalizedConverted = false;
  private readonly internalized: RefVector;
  // Z3 frees what the propagate-values of its preprocessing holds only when it resets the preprocessing.
  private readonly propagator: PropagateValuesTactic;
  private hasUninterpreted = false;
  private subgoals: Goal[] = [];
  private scopes: Scope[] = [];
  reasonUnknown = "no reason given";
  wasUnknown = false;
  private cardinalityParams: TacticParams;

  constructor(
    private readonly manager: AstManager,
    params: SatParams,
    private readonly parameters: ReadonlyMap<string, string>,
    isIncremental = true,
  ) {
    this.solver = new Solver(params, manager.limit, isIncremental);
    this.goal2sat = new Goal2Sat(
      manager,
      this.solver,
      params.get("ite_extra") !== false,
      parameters.get("smt.arith.ignore_int") === "true",
    );
    if (params.get("euf") === true) this.ensureEuf();
    this.fmls = new RefVector(manager);
    this.names = new RefVector(manager);
    this.core = new RefVector(manager);
    this.converters = new Goal(manager);
    this.satConverter = new Sat2GoalConverter(manager);
    this.internalized = new RefVector(manager);
    this.propagator = new PropagateValuesTactic(manager);
    this.cardinalityParams = getCardinalityParams(params);
  }

  updateParams(params: SatParams) {
    this.cardinalityParams = getCardinalityParams(params);
    this.solver.updateParams(params);
    if (params.get("euf") === true && this.goal2sat.euf === null) this.ensureEuf();
  }

  // A goal2sat made before sat.euf stays out of euf mode and leaves the euf solver unfed.
  private ensureEuf() {
    const factory = mkThSolver(this.parameters);
    if (!this.goal2sat.isInitialized) this.goal2sat.initEuf(factory);
    this.goal2sat.ensureEuf(factory);
  }

  private isClause(expr: number): boolean {
    const manager = this.manager;
    if (manager.depths[expr] > 4) return false;
    if (isLiteral(manager, expr)) return true;
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

  assertNamed(expr: number, name: number) {
    const manager = this.manager;
    this.names.push(name);
    if (this.isCnf && isLiteral(manager, expr) && isLiteral(manager, name))
      return this.assertExpr(manager.mkApp(OP_OR, [mkNot(manager, name), expr], SORT_BOOL));
    if (
      this.isCnf &&
      manager.getOp(expr) === OP_OR &&
      this.isClause(expr) &&
      isLiteral(manager, name)
    )
      return this.assertExpr(
        manager.mkApp(OP_OR, [mkNot(manager, name), ...manager.getArgs(expr)], SORT_BOOL),
      );
    this.isCnf = false;
    this.assertExpr(manager.mkApp(OP_IMPLIES, [name, expr], SORT_BOOL));
  }

  push() {
    try {
      this.internalizeFormulas();
    } finally {
      this.goal2sat.push();
      this.solver.userPush();
      this.bitBlaster?.push();
      incConverterRefs(this.converters.converters);
      this.scopes.push({
        converters: this.converters.converters,
        fmlsSize: this.fmls.size,
        fmlsHead: this.fmlsHead,
        namesSize: this.names.size,
        hasUninterpreted: this.hasUninterpreted,
      });
    }
  }

  pop(numScopes: number) {
    const count = Math.min(numScopes, this.scopes.length);
    this.bitBlaster?.pop(count);
    this.goal2sat.pop(count);
    this.solver.userPop(count);
    for (let index = 0; index < count; index++) {
      const scope = this.scopes.pop() as Scope;
      this.converters.releaseConverters();
      this.converters.converters = scope.converters;
      this.fmlsHead = scope.fmlsHead;
      this.fmls.shrink(scope.fmlsSize);
      this.names.shrink(scope.namesSize);
      this.hasUninterpreted = scope.hasUninterpreted;
    }
  }

  private getBitBlaster() {
    const bitBlaster = (this.bitBlaster ??= new BitBlasterRewriter(this.manager, BIT_BLAST_PARAMS));
    while (bitBlaster.getNumScopes() < this.scopes.length) bitBlaster.push();
    return bitBlaster;
  }

  private checkUninterpreted() {
    const unhandledFuns = this.goal2sat.euf?.unhandledFunctions ?? this.goal2sat.unhandledFuns;
    if (unhandledFuns.length === 0) return L_TRUE;
    this.hasUninterpreted = true;
    const manager = this.manager;
    const funs = unhandledFuns.map((fun) => {
      const declaration = mkSeq1(
        [
          mkText(getQuotedName(manager.funcDecls[fun.decl].name)),
          mkSeq5(fun.domain.map((sort) => formatSort(manager, sort))),
          formatSort(manager, fun.range),
        ],
        "declare-fun",
      );
      return `${renderFormat(declaration, DEFAULT_PRINT_OPTIONS)}\n`;
    });
    this.reasonUnknown = `(sat.giveup interpreted functions sent to SAT solver ${funs.join("")})`;
    return L_UNDEF;
  }

  private internalizeForms(forms: readonly number[]) {
    this.solver.popToBaseLevel();
    if (this.solver.isInconsistent) return L_FALSE;
    this.goal2sat.run(forms);
    this.satConverter.flushSmc(this.solver, this.goal2sat.atoms);
    return this.checkUninterpreted();
  }

  private internalizeGoal(goal: Goal) {
    this.solver.popToBaseLevel();
    if (this.solver.isInconsistent) return L_FALSE;
    this.resetSubgoals();
    this.propagator.cleanup();
    const bitBlaster = this.getBitBlaster();
    const subgoals = (() => {
      if (this.isCnf) return [goal];
      try {
        const satParams = getSatParams(this.parameters);
        const goals = (
          satParams.get("euf") === true
            ? mkIncSatEufPreprocess(this.manager, this.propagator)
            : mkIncSatPreprocess(
                this.manager,
                bitBlaster,
                this.propagator,
                getCardinalityOptions(this.cardinalityParams, satParams),
              )
        )(goal);
        this.isCnf = true;
        return goals;
      } catch (error) {
        this.propagator.cleanup();
        this.releaseBitBlaster();
        if (!(error instanceof SmtTacticError || error instanceof SmtCanceledError)) throw error;
        // The tactics of the preprocessing report a limit that stops their rewriters as a tactic_exception.
        this.reasonUnknown =
          error instanceof SmtCanceledError ? this.manager.limit.getCancelMessage() : error.message;
        return undefined;
      }
    })();
    this.subgoals = subgoals ?? [];
    if (!this.subgoals.includes(goal)) {
      goal.release();
    }
    if (subgoals?.length !== 1) return L_UNDEF;
    const subgoal = subgoals[0];
    incConverterRefs(subgoal.converters);
    this.converters.converters = [...this.converters.converters, ...subgoal.converters];
    this.goal2sat.runGoal(subgoal, this.dep2asm);
    this.satConverter.flushSmc(this.solver, this.goal2sat.atoms);
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
    const manager = this.manager;
    const all = [...assumptions, ...this.names.items];
    this.asms = [];
    if (all.length === 0) return L_TRUE;
    this.isCnf &&= all.every((assumption) => isLiteral(manager, assumption));
    if (this.isCnf) this.goal2sat.assumptions(all, this.dep2asm);
    else {
      const goal = new Goal(manager);
      goal.isCoresEnabled = true;
      for (const assumption of all) goal.assert(assumption, mkDependencyLeaf(assumption));
      const result = this.internalizeGoal(goal);
      if (result !== L_TRUE) return result;
    }
    const seen = new Set<number>();
    for (const assumption of all) {
      const lit = this.dep2asm.get(assumption);
      if (lit === undefined || seen.has(lit)) continue;
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
      if (isLiteral(this.manager, assumption)) {
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
    const internalizedAssumptions = this.internalizeAssumptions(literals);
    if (internalizedAssumptions !== L_TRUE) return internalizedAssumptions;
    this.reasonUnknown = "no reason given";
    this.isInternalizedConverted = false;
    const result = (() => {
      try {
        return this.solver.check(this.asms);
      } catch (error) {
        if (!(error instanceof SmtCanceledError)) throw error;
        // check_sat_core counts a step to see whether the limit stopped the search.
        manager.limit.inc();
        return L_UNDEF;
      }
    })();
    if (result === L_TRUE && this.hasUninterpreted) {
      this.reasonUnknown = "(sat.giveup has-uninterpreted)";
      return L_UNDEF;
    }
    // Deviation from Z3: it checks the assumptions only under check-sat-assuming, so recfun's research answers sat on a model that falsifies a named assertion.
    if (result === L_TRUE && this.asms.length > 0) this.checkAssumptions();
    if (result === L_FALSE && this.asms.length > 0) this.extractCore(asm2fml);
    if (result === L_UNDEF) this.reasonUnknown = this.solver.reasonUnknown;
    if (result !== L_FALSE) this.core.reset();
    return result;
  }

  private checkAssumptions() {
    const model = this.solver.model;
    for (const lit of this.dep2asm.values())
      if (getLitValue(lit, model) !== L_TRUE) throw new SmtDefaultError("bad state");
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
    this.propagator.cleanup();
    this.getBitBlaster();
    this.dep2asm = new Map();
    this.solver.popToBaseLevel();
    const consequences: number[] = [];
    const internalized = this.internalizeFormulas();
    if (internalized !== L_TRUE) return { result: internalized, consequences };
    const boolVars = vars.flatMap((expr) =>
      this.internalizeVar(expr).filter((boolVar) => boolVar !== undefined),
    );
    const internalizedAssumptions = this.internalizeAssumptions(assumptions);
    if (internalizedAssumptions !== L_TRUE)
      return { result: internalizedAssumptions, consequences };
    const found = getConsequences(this.solver, this.asms, boolVars);
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

  mkModel() {
    const manager = this.manager;
    if (!this.solver.isModelCurrent || this.fmls.size > this.fmlsHead) return null;
    const euf = this.goal2sat.euf;
    const model = new ProtoModel(manager).mkModel();
    for (const [expr, boolVar] of this.goal2sat.atoms) {
      if (!manager.isUninterpretedConst(expr)) continue;
      const value = this.solver.model[boolVar];
      if (value === L_TRUE) model.registerConst(manager.decls[expr], manager.trueExpr);
      else if (value === L_FALSE) model.registerConst(manager.decls[expr], manager.falseExpr);
    }
    if (this.satConverter.entries.length > 0) applyDefinitions(this.satConverter.entries, model);
    const converted = convertModel(
      this.converters,
      euf === null ? model : euf.updateModel(model, true),
    );
    if (this.parameters.get("model_validate") === "true") this.validateModel(converted);
    return converted;
  }

  private validateModel(model: ProtoModel) {
    const manager = this.manager;
    const evaluator = new ModelEvaluator(manager, model);
    evaluator.setModelCompletion(true);
    let isAllTrue = true;
    try {
      for (const form of this.fmls.items) {
        if (manager.hasQuantifierFlags[form]) continue;
        const value = evaluator.rewrite(form);
        manager.decRef(value);
        if (manager.limit.isExhausted()) return;
        if (value === manager.falseExpr) isAllTrue = false;
      }
    } finally {
      evaluator.release();
    }
    if (!isAllTrue) throw new SmtUnsupportedError("a sat model that fails validation");
  }

  getModel() {
    const model = this.mkModel();
    model?.incRef();
    return model;
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
    sat2goal(this.manager, this.solver, this.goal2sat.atoms, goal, this.satConverter);
    this.internalized.reset();
    for (const form of goal.forms.items) this.internalized.push(form);
    goal.reset();
    this.isInternalizedConverted = true;
    return this.internalized.items;
  }

  // get_model_converter: the converters of the preprocessed goals and sat2goal's, once the
  // asserted formulas are internalized.
  getConverters(): Goal["converters"] {
    this.getAssertions();
    if (!this.isInternalizedConverted) return [];
    incConverterRefs(this.converters.converters);
    return [
      ...this.converters.converters,
      { definitions: this.satConverter.copyEntries(), refs: 1 },
    ];
  }

  private resetSubgoals() {
    for (const subgoal of this.subgoals) {
      subgoal.release();
    }
    this.subgoals = [];
  }

  release() {
    for (const scope of this.scopes) decConverterRefs(this.manager, scope.converters);
    this.converters.releaseConverters();
    this.resetSubgoals();
    this.fmls.reset();
    this.names.reset();
    this.core.reset();
    this.internalized.reset();
    this.satConverter.release();
    this.propagator.cleanup();
    this.releaseBitBlaster();
    this.goal2sat.release();
  }

  private releaseBitBlaster() {
    this.bitBlaster?.releaseCfg();
    this.bitBlaster?.release();
    this.bitBlaster = undefined;
  }
}

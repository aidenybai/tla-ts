// Ported from Z3 (src/sat/smt/q_mbi.h, src/sat/smt/q_mbi.cpp, src/sat/smt/q_model_fixer.h,
// src/sat/smt/q_model_fixer.cpp, src/ast/macros/quantifier_macro_info.cpp,
// src/ast/for_each_expr.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_DATATYPE,
  OP_EQ,
  OP_NOT,
  QUANTIFIER_EXISTS,
  QUANTIFIER_FORALL,
  SORT_BOOL,
} from "../ast";
import { flattenAndVector, flattenOrVector, mkNot } from "../ast-util";
import { ExprSafeReplace } from "../expr-safe-replace";
import { ObjHashtable } from "../hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import {
  type CondMacro,
  collectMacroCandidates,
  releaseCondMacros,
  solveMacros,
} from "../model-macro-solver";
import { ProtoModel } from "../proto-model";
import { RefVector } from "../ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "../rewriter";
import { IncSatSolver } from "../sat/inc-sat-solver";
import { VarSubst } from "../var-subst";
import { type Enode, getClass } from "./egraph";
import type { EufSolver } from "./euf-solver";
import type { QSolver } from "./q-solver";

const UINT_MAX = 4294967295;
const MAX_QUICK_CHECK_ROUNDS = 100;
const MAX_UNBOUNDED_EQUALITIES = 10;
const MAX_CHOOSE_CANDIDATES = 10;
const MBQI_MAX_CEXS = 1;

// The families of the arith, datatype and array project plugins of mbqi.
const PLUGIN_FAMILIES = new Set([FAMILY_ARITH, FAMILY_DATATYPE, FAMILY_ARRAY]);

// mbqi::q_body: the fresh constants of q's variables and its negated body over them.
interface QBody {
  readonly vars: RefVector;
  readonly freeVars: Set<number>;
  mbody: number;
  readonly vbody: RefVector;
  readonly domainEqs: RefVector;
  readonly varArgs: (readonly [number, number])[];
}

interface Instantiation {
  readonly qlit: number;
  readonly fml: number;
  readonly generation: number;
}

// subterms::ground: the subterms of an expression, outside quantifier bodies.
const getSubterms = (manager: AstManager, expr: number) => {
  const subterms: number[] = [];
  const stack = [expr];
  const visited = new Set<number>();
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    subterms.push(current);
    visited.add(current);
    if (manager.isApp(current)) stack.push(...manager.getArgs(current));
    while (stack.length > 0 && visited.has(stack[stack.length - 1])) stack.pop();
  }
  return subterms;
};

const isUninterpretedApp = (manager: AstManager, expr: number) =>
  manager.isApp(expr) && manager.isUninterpreted(expr);

export class Mbqi {
  private readonly manager: AstManager;
  private readonly modelFixer: ModelFixer;
  private model: ProtoModel | null = null;
  private solver: IncSatSolver | null = null;
  private q2body = new Map<number, QBody>();
  private maxCex = 1;
  private generationBound = UINT_MAX;
  private generationMax = UINT_MAX;
  private instantiations: Instantiation[] = [];
  private readonly pinned: RefVector;

  constructor(
    private readonly ctx: EufSolver,
    private readonly qs: QSolver,
  ) {
    this.manager = ctx.manager;
    this.modelFixer = new ModelFixer(ctx, qs);
    this.pinned = new RefVector(ctx.manager);
  }

  private pin(expr: number) {
    this.pinned.push(expr);
    return expr;
  }

  private pinOwned(expr: number) {
    this.pinned.pushOwned(expr);
    return expr;
  }

  private setModel(model: ProtoModel | null) {
    model?.incRef();
    this.model?.decRef();
    this.model = model;
  }

  private getModel() {
    if (this.model === null) throw new SmtInvariantError("mbqi needs a model");
    return this.model;
  }

  private eval(model: ProtoModel, expr: number, isModelCompletion: boolean) {
    return this.pinOwned(model.eval(expr, isModelCompletion));
  }

  private isTrue(expr: number) {
    return this.manager.isTrue(this.eval(this.getModel(), expr, false));
  }

  run() {
    const ctx = this.ctx;
    const manager = this.manager;
    let result = L_TRUE;
    this.setModel(null);
    ctx.saveModel(null);
    this.instantiations = [];
    for (const lit of this.qs.universal) {
      this.initModel();
      const checked = this.checkForall(ctx.boolVar2expr(lit >> 1) as number);
      this.pinned.reset();
      if (checked === L_FALSE) result = L_FALSE;
      else if (checked === L_UNDEF && result === L_TRUE) result = L_UNDEF;
    }
    this.maxCex += MBQI_MAX_CEXS;
    for (const instantiation of this.instantiations) {
      const generation = ctx.generation;
      ctx.generation = instantiation.generation + 1;
      const lit = ctx.mkLiteral(instantiation.fml) ^ 1;
      this.qs.addClause([instantiation.qlit ^ 1, lit]);
      ctx.generation = generation;
      manager.decRef(instantiation.fml);
    }
    this.instantiations = [];
    if (result !== L_TRUE) this.setModel(null);
    ctx.saveModel(this.model);
    return result;
  }

  // restrict_to_universe: sk is one of the universe's values made by at most generationBound
  // instantiations.
  private restrictToUniverse(sk: number, universe: readonly number[]) {
    const manager = this.manager;
    const values2root = this.ctx.values2root();
    const eqs: number[] = [];
    let generationMin = UINT_MAX;
    for (const value of universe) {
      const root = values2root.get(value);
      if (root !== undefined) {
        const generation = root.classGeneration();
        generationMin = Math.min(generationMin, generation);
        this.generationMax = Math.max(this.generationMax, generation);
        if (generation > this.generationBound) continue;
      }
      eqs.push(manager.mkEq(sk, value));
    }
    if (eqs.length === 0)
      for (const value of universe) {
        const root = values2root.get(value);
        if (root !== undefined && root.classGeneration() <= generationMin)
          eqs.push(manager.mkEq(sk, value));
      }
    this.assertExpr(manager.mkOr(eqs));
  }

  private replaceModelValue(expr: number): number {
    const manager = this.manager;
    if (manager.isBool(expr)) return expr;
    const root = this.ctx.values2root().get(expr);
    if (root !== undefined) return this.chooseTerm(root);
    if (manager.isApp(expr) && manager.getNumArgs(expr) > 0)
      return this.pin(
        manager.mkApp(
          manager.decls[expr],
          manager.getArgs(expr).map((arg) => this.replaceModelValue(arg)),
          manager.sorts[expr],
        ),
      );
    if (manager.isModelValue(expr)) return manager.mkModelValue(0, manager.sorts[expr]);
    const unfolded = this.getModel().unfoldAsArray(expr);
    return unfolded === expr ? unfolded : this.replaceModelValue(this.pinOwned(unfolded));
  }

  private chooseTerm(root: Enode) {
    const generation = root.generation + 1;
    let count = 0;
    let chosen = root;
    for (const node of getClass(root)) {
      if (node.generation < generation) {
        count = 0;
        chosen = node;
      } else if (node.generation === generation) {
        if (this.qs.random() % ++count === 0 && this.manager.hasQuantifierFlags[node.owner])
          chosen = node;
      }
      if (count > MAX_CHOOSE_CANDIDATES) break;
    }
    return chosen.owner;
  }

  private checkForall(quantifier: number) {
    const flat = this.qs.flatten(quantifier);
    const solver = this.initSolver();
    const qb = this.specialize(flat);
    if (this.manager.isFalse(qb.mbody)) return L_TRUE;
    if (this.quickCheck(quantifier, flat, qb)) return L_FALSE;
    this.generationBound = 0;
    this.generationMax = 0;
    let inc = 1;
    for (;;) {
      solver.push();
      this.addUniverseRestriction(qb);
      this.assertExpr(qb.mbody);
      const result = solver.check();
      if (result === L_UNDEF) {
        solver.pop(1);
        return result;
      }
      if (result === L_TRUE) {
        const model = solver.getModel();
        if (model === null) throw new SmtInvariantError("a satisfiable check has a model");
        const isFound =
          this.checkForallSubst(quantifier, qb) || this.checkForallDefault(quantifier, qb, model);
        solver.pop(1);
        return isFound ? L_FALSE : L_UNDEF;
      }
      solver.pop(1);
      if (this.generationBound >= this.generationMax) return L_TRUE;
      this.generationBound += inc;
      inc += 1;
    }
  }

  private checkForallDefault(quantifier: number, qb: QBody, model: ProtoModel) {
    this.addDomainBounds(model, qb);
    const projection = this.solverProject(model, qb, [], false);
    if (projection === null) return false;
    this.addInstantiation(quantifier, projection);
    return true;
  }

  private checkForallSubst(quantifier: number, qb: QBody) {
    if (qb.varArgs.length === 0) return false;
    const solver = this.initSolver();
    const eqs: number[] = [];
    let index = 0;
    solver.push();
    this.addDomainEqs(qb);
    for (; index < this.maxCex; index++) {
      if (solver.check() !== L_TRUE) break;
      const cex = solver.getModel();
      if (cex === null) throw new SmtInvariantError("a satisfiable check has a model");
      const projection = this.solverProject(cex, qb, eqs, true);
      if (projection === null) break;
      this.addInstantiation(quantifier, projection);
      this.assertExpr(this.manager.mkApp(OP_NOT, [this.manager.mkAnd(eqs)], SORT_BOOL));
    }
    solver.pop(1);
    return index > 0;
  }

  private addInstantiation(quantifier: number, projection: number) {
    const ctx = this.ctx;
    const isExists = this.manager.getQuantifier(quantifier).kind === QUANTIFIER_EXISTS;
    const qlit = ctx.expr2literal(quantifier) ^ (isExists ? 1 : 0);
    const fml = ctx.rewrite(projection);
    this.instantiations.push({ qlit, fml, generation: ctx.getMaxGeneration(fml) });
  }

  private addUniverseRestriction(qb: QBody) {
    const manager = this.manager;
    const model = this.getModel();
    for (const sk of qb.vars.items) {
      const universe = model.getUniverse(manager.sorts[sk]);
      if (universe !== undefined) this.restrictToUniverse(sk, universe);
    }
  }

  private substitute(expr: number, qb: QBody) {
    const subst = new VarSubst(this.manager, true);
    const result = subst.apply(expr, qb.vars.items);
    subst.release();
    return this.pinOwned(result);
  }

  private specialize(quantifier: number) {
    const manager = this.manager;
    const qb = this.getBody(quantifier);
    const data = manager.getQuantifier(quantifier);
    const evaluated = this.eval(this.getModel(), data.body, true);
    const substituted = this.substitute(evaluated, qb);
    const mbody = data.kind === QUANTIFIER_FORALL ? mkNot(manager, substituted) : substituted;
    manager.incRef(mbody);
    if (qb.mbody !== -1) manager.decRef(qb.mbody);
    qb.mbody = mbody;
    return qb;
  }

  // q2body: fresh constants for the variables of q, which, unlike skolem constants, models of
  // the sub-solver interpret.
  private getBody(quantifier: number) {
    const existing = this.q2body.get(quantifier);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const qb: QBody = {
      vars: new RefVector(manager),
      freeVars: new Set(),
      mbody: -1,
      vbody: new RefVector(manager),
      domainEqs: new RefVector(manager),
      varArgs: [],
    };
    data.sorts.forEach((sort, index) =>
      qb.vars.push(
        manager.mkApp(manager.mkFreshFuncDecl(data.names[index], [], sort, false), [], sort),
      ),
    );
    const fml = this.substitute(data.body, qb);
    qb.vbody.push(data.kind === QUANTIFIER_FORALL ? manager.mkApp(OP_NOT, [fml], SORT_BOOL) : fml);
    flattenAndVector(manager, qb.vbody);
    this.extractFreeVars(quantifier, qb);
    this.extractVarArgs(data.body, qb);
    this.q2body.set(quantifier, qb);
    manager.incRef(quantifier);
    this.ctx.trail.push(() => {
      this.q2body.delete(quantifier);
      qb.vars.reset();
      qb.vbody.reset();
      qb.domainEqs.reset();
      if (qb.mbody !== -1) manager.decRef(qb.mbody);
      manager.decRef(quantifier);
    });
    return qb;
  }

  private solverProject(model: ProtoModel, qb: QBody, eqs: number[], isUsingInst: boolean) {
    const manager = this.manager;
    const qmodel = this.getModel();
    eqs.length = 0;
    qmodel.resetEvalCache();
    for (const sk of qb.vars.items)
      qmodel.registerConst(manager.decls[sk], this.eval(model, sk, true));
    const fmls = [...qb.vbody.items];
    const vars = qb.vars.items;
    for (let index = 0; !isUsingInst && index < vars.length; index++) {
      if (!PLUGIN_FAMILIES.has(manager.getSortFamily(manager.sorts[vars[index]]))) continue;
      fmls.push(...qb.domainEqs.items);
      this.eliminateNestedVars(fmls, qb);
      if (!fmls.every((fml) => this.isTrue(fml))) return null;
      throw new SmtUnsupportedError("the theory projections of sat.euf mbqi");
    }
    const replace = new ExprSafeReplace(manager);
    for (const sk of vars) {
      const value = this.eval(qmodel, sk, false);
      replace.insert(sk, this.replaceModelValue(value));
      eqs.push(this.pin(manager.mkEq(sk, value)));
    }
    const replaced = fmls.map((fml) => this.pinOwned(replace.apply(fml)));
    replace.release();
    return this.pin(manager.mkAnd(replaced));
  }

  // add_domain_eqs: a variable that some positive equality binds takes one of at most
  // MAX_UNBOUNDED_EQUALITIES ground values. The bounds of variable arguments come from projection
  // functions, which only arithmetic and bit-vector arguments have.
  private addDomainEqs(qb: QBody) {
    const manager = this.manager;
    qb.domainEqs.reset();
    const vars = qb.vars.items;
    for (let index = 0; index < vars.length; index++) {
      if (!qb.freeVars.has(index)) continue;
      const sk = vars[vars.length - index - 1];
      const sort = manager.sorts[sk];
      const veqs: number[] = [];
      const meqs: number[] = [];
      const visited = new Set<number>();
      const nodes = this.ctx.egraph.nodes;
      let bound = MAX_UNBOUNDED_EQUALITIES;
      for (let nodeIndex = 0; nodeIndex < nodes.length && bound > 0; nodeIndex++) {
        const node = nodes[nodeIndex];
        const expr = node.owner;
        const value = this.ctx.node2value(node);
        if (
          value === undefined ||
          manager.sorts[expr] !== sort ||
          manager.isValue(expr) ||
          visited.has(value)
        )
          continue;
        visited.add(value);
        veqs.push(this.pin(manager.mkEq(sk, expr)));
        meqs.push(this.pin(manager.mkEq(sk, this.replaceModelValue(value))));
        bound--;
      }
      if (veqs.length === 0) continue;
      this.assertExpr(manager.mkOr(meqs));
      qb.domainEqs.push(manager.mkOr(veqs));
    }
  }

  private assertExpr(expr: number) {
    this.manager.incRef(expr);
    this.initSolver().assertExpr(expr);
    this.manager.decRef(expr);
  }

  // add_domain_bounds: the model of the sub-solver gives the variables their values. The bounds
  // under uninterpreted functions come from projection functions, which only arithmetic and
  // bit-vector arguments have.
  private addDomainBounds(model: ProtoModel, qb: QBody) {
    const manager = this.manager;
    const qmodel = this.getModel();
    qb.domainEqs.reset();
    qmodel.resetEvalCache();
    for (const sk of qb.vars.items)
      qmodel.registerConst(manager.decls[sk], this.eval(model, sk, true));
    this.ctx.modelUpdated(qmodel);
  }

  // eliminate_nested_vars: F[g(t)] becomes F[s] and g(t) = s, for the ground s that g(t) evaluates
  // to.
  private eliminateNestedVars(fmls: number[], qb: QBody) {
    if (qb.varArgs.length === 0) return;
    const manager = this.manager;
    const replace = new ExprSafeReplace(manager);
    const eqs: number[] = [];
    const visited = new Set<number>();
    for (const varArg of qb.varArgs) {
      const expr = varArg[0];
      if (visited.has(expr)) continue;
      visited.add(expr);
      const term = this.substitute(expr, qb);
      const value = this.replaceModelValue(this.eval(this.getModel(), term, false));
      const inverse = this.modelFixer.invertApp(value);
      replace.insert(term, inverse);
      eqs.push(this.pin(manager.mkEq(term, inverse)));
    }
    for (let index = 0; index < fmls.length; index++)
      fmls[index] = this.pinOwned(replace.apply(fmls[index]));
    replace.release();
    fmls.push(...eqs);
  }

  // extract_var_args: the arguments of uninterpreted functions that hold bound variables.
  private extractVarArgs(expr: number, qb: QBody) {
    const manager = this.manager;
    for (const subterm of getSubterms(manager, expr)) {
      if (manager.isGroundApp(subterm) || !manager.isApp(subterm)) continue;
      if (manager.getNumArgs(subterm) === 0 || !manager.isUninterpreted(subterm)) continue;
      manager.getArgs(subterm).forEach((arg, index) => {
        if (
          !manager.isGroundApp(arg) &&
          !isUninterpretedApp(manager, arg) &&
          !(manager.isVar(arg) && qb.freeVars.has(manager.values[arg]))
        )
          qb.varArgs.push([subterm, index]);
      });
    }
  }

  // extract_free_vars: the variables of positive equalities with a term that is not a variable.
  private extractFreeVars(quantifier: number, qb: QBody) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const fmls = new RefVector(manager);
    fmls.push(
      data.kind === QUANTIFIER_EXISTS ? manager.mkApp(OP_NOT, [data.body], SORT_BOOL) : data.body,
    );
    flattenOrVector(manager, fmls);
    for (const fml of fmls.items) {
      if (!manager.isApp(fml) || manager.getOp(fml) !== OP_EQ) continue;
      const lhs = manager.getArg(fml, 0);
      const rhs = manager.getArg(fml, 1);
      if (manager.isVar(lhs) && !manager.isVar(rhs)) qb.freeVars.add(manager.values[lhs]);
      if (manager.isVar(rhs) && !manager.isVar(lhs)) qb.freeVars.add(manager.values[rhs]);
    }
    fmls.reset();
  }

  private quickCheck(quantifier: number, flat: number, qb: QBody) {
    const manager = this.manager;
    const vars = qb.vars.items;
    const offsets = vars.map(() => 0);
    if (!vars.every((_sk, index) => this.nextOffsetAt(offsets, vars, index, 0))) return false;
    let numBindings = 0;
    for (let round = 0; round < MAX_QUICK_CHECK_ROUNDS && numBindings < this.maxCex; round++) {
      const binding = this.setBinding(offsets, vars);
      if (qb.vbody.items.every((fml) => this.isTrue(fml))) {
        const subst = new VarSubst(manager, true);
        const body = this.pinOwned(subst.apply(manager.getQuantifier(flat).body, binding));
        subst.release();
        const isForall = manager.getQuantifier(quantifier).kind === QUANTIFIER_FORALL;
        this.addInstantiation(quantifier, isForall ? mkNot(manager, body) : body);
        numBindings++;
      }
      if (!this.nextOffset(offsets, vars)) break;
    }
    return numBindings > 0;
  }

  private nextOffsetAt(offsets: number[], vars: readonly number[], index: number, start: number) {
    const manager = this.manager;
    const sort = manager.sorts[vars[index]];
    const nodes = this.ctx.egraph.nodes;
    for (let nodeIndex = start; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      if (node.generation > 0) return false;
      const expr = node.owner;
      if (manager.sorts[expr] === sort && !manager.isValue(expr)) {
        offsets[index] = nodeIndex;
        return true;
      }
    }
    return false;
  }

  private setBinding(offsets: readonly number[], vars: readonly number[]) {
    const manager = this.manager;
    const nodes = this.ctx.egraph.nodes;
    const model = this.getModel();
    model.resetEvalCache();
    return offsets.map((offset, index) => {
      const expr = nodes[offset].owner;
      model.registerConst(manager.decls[vars[index]], this.eval(model, expr, true));
      return expr;
    });
  }

  // next_offset: the next binding, which also restarts every earlier variable and the variable
  // itself when it runs out.
  private nextOffset(offsets: number[], vars: readonly number[]) {
    for (let index = 0; index < vars.length; index++) {
      if (this.nextOffsetAt(offsets, vars, index, offsets[index] + 1)) return true;
      for (let other = 0; other <= index; other++)
        if (!this.nextOffsetAt(offsets, vars, other, 0)) return false;
    }
    return false;
  }

  private initModel() {
    if (this.model !== null) return;
    const model = new ProtoModel(this.manager).mkModel();
    this.setModel(model);
    this.ctx.updateModel(model);
  }

  // init_solver: mk_smt2_solver gives the incremental sat solver of sat.euf.
  private initSolver() {
    const ctx = this.ctx;
    this.solver ??= new IncSatSolver(ctx.manager, ctx.s.params, true, ctx.mkThSolver);
    return this.solver;
  }

  initSearch() {
    this.maxCex = MBQI_MAX_CEXS;
  }

  finalizeModel(model: ProtoModel) {
    this.modelFixer.fix(model);
  }
}

// The quantifier_macro_info of a flattened quantifier, with the macro candidates of its body.
interface MacroInfo {
  readonly condMacros: CondMacro[];
  readonly ngDecls: Set<number>;
  readonly isAuf: boolean;
  readonly flatQ: number;
  theOne: number | null;
}

class ModelFixer {
  private readonly manager: AstManager;
  private q2info = new Map<number, MacroInfo>();
  private readonly macroRewriter: Rewriter;

  constructor(
    private readonly ctx: EufSolver,
    private readonly qs: QSolver,
  ) {
    this.manager = ctx.manager;
    this.macroRewriter = new Rewriter(ctx.manager, TACTIC_REWRITER_OPTIONS);
  }

  // operator(): macros for the universal quantifiers, then an else for every partial function.
  fix(model: ProtoModel) {
    const manager = this.manager;
    const univ = this.qs.universal.map((lit) => this.ctx.boolVar2expr(lit >> 1) as number);
    if (univ.length === 0) return;
    const qs = solveMacros(manager, model, univ, (quantifier) => this.getInfo(quantifier));
    this.addProjectionFunctions(model, qs);
    const decls = model.getFuncDecls();
    for (let index = decls.length; index-- > 0;) {
      const decl = decls[index];
      const interp = model.funcInterps.get(decl);
      if (interp === undefined) continue;
      const maxOcc = interp.isPartial() ? interp.getMaxOccResult() : null;
      if (maxOcc !== null) interp.setElse(maxOcc);
      if (interp.isPartial()) interp.setElse(model.getSomeValue(manager.funcDecls[decl].range));
    }
  }

  private getInfo(quantifier: number) {
    const existing = this.q2info.get(quantifier);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const flatQ = this.qs.flatten(quantifier);
    const info: MacroInfo = {
      condMacros: collectMacroCandidates(manager, this.macroRewriter, flatQ),
      ngDecls: new Set(),
      isAuf: true,
      flatQ,
      theOne: null,
    };
    this.q2info.set(quantifier, info);
    this.ctx.trail.push(() => {
      this.q2info.delete(quantifier);
      releaseCondMacros(manager, info.condMacros);
    });
    return info;
  }

  private addProjectionFunctions(model: ProtoModel, qs: readonly number[]) {
    const manager = this.manager;
    const decls = new ObjHashtable((decl) => manager.getDeclHash(decl));
    for (const quantifier of qs) {
      const body = manager.getQuantifier(this.getInfo(quantifier).flatQ).body;
      for (const subterm of getSubterms(manager, body))
        if (isUninterpretedApp(manager, subterm) && !manager.isGroundApp(subterm))
          decls.add(manager.decls[subterm]);
    }
    for (const decl of decls) this.addProjectionFunctionsOf(model, decl);
  }

  private addProjectionFunctionsOf(model: ProtoModel, decl: number) {
    const interp = model.funcInterps.get(decl);
    if (interp === undefined || interp.isConstant()) return;
    const domain = this.manager.funcDecls[decl].domain;
    domain.forEach((_sort, index) => this.checkProjectionFunction(model, decl, index));
    if (interp.isPartial() && interp.entries.length > 0) {
      const index = this.ctx.s.rand.next() % interp.entries.length;
      interp.setElse(interp.entries[index].result);
      interp.delEntry(index);
    }
  }

  // add_projection_function: arithmetic and bit-vector arguments with values get a projection
  // function, which needs the value orders the port lacks.
  private checkProjectionFunction(model: ProtoModel, decl: number, index: number) {
    const manager = this.manager;
    const family = manager.getSortFamily(manager.funcDecls[decl].domain[index]);
    if (family !== FAMILY_ARITH && family !== FAMILY_BV) return;
    const nodes = this.ctx.egraph.enodesOf(decl);
    for (const node of nodes) {
      const value = model.eval(node.getArg(index).owner, false);
      const isValue = manager.isValue(value);
      manager.decRef(value);
      if (!isValue) return;
    }
    if (nodes.length > 0) throw new SmtUnsupportedError("the projection functions of sat.euf mbqi");
  }

  // invert_app: the root of the class whose value t has.
  invertApp(value: number) {
    return this.ctx.values2root().get(value)?.owner ?? value;
  }
}

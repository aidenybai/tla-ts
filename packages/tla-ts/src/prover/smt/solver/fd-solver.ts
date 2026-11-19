import { SmtCanceledError, SmtTacticError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_OR,
  OP_UBV2INT,
  OP_ULEQ,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { mkNot } from "./ast-util";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { Bv2IntContext, Bv2IntRewriter } from "./bv2int-rewriter";
import { createCard2Bv } from "./card2bv";
import { DependentExprState } from "./dependent-expr-state";
import { Enum2BvRewriter } from "./dt2bv-tactic";
import { assignOwned, release } from "./expr-ref";
import { ExprSafeReplace } from "./expr-safe-replace";
import {
  type Definition,
  type Dependency,
  getDependencyValues,
  Goal,
  mkDependencyLeaf,
} from "./goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { ProtoModel } from "./proto-model";
import type { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import { applyDefinitions, getRewriterOptions } from "./tactic";
import { UINT_MAX } from "./sat/clause";
import type { SatParams } from "./sat/config";
import { IncSatSolver } from "./sat/inc-sat-solver";

const getNumBits = (value: bigint) => {
  let bound = 1n;
  let numBits = 1;
  while (bound <= value) {
    numBits++;
    bound *= 2n;
  }
  return numBits;
};

const collectBounds = (manager: AstManager, bounds: BoundManager, form: number) => {
  if (manager.getOp(form) !== OP_AND) {
    bounds.add(form);
    return;
  }
  for (const arg of manager.getArgs(form)) collectBounds(manager, bounds, arg);
};

class SolverFormulas extends Goal {
  override assert(form: number, dependency?: Dependency) {
    if (this.manager.isFalse(form)) this.isInconsistent = true;
    this.forms.push(form);
    this.dependencies.push(dependency);
  }

  override update(index: number, form: number, dependency?: Dependency) {
    if (this.manager.isFalse(form)) this.isInconsistent = true;
    this.forms.set(index, form);
    this.dependencies[index] = dependency;
  }

  flattenSuffix(qhead: number) {
    const manager = this.manager;
    const forms = this.forms;
    const seen = new Set<number>();
    const pinned = new RefVector(manager);
    let kept = qhead;
    for (let index = qhead; index < forms.size; index++) {
      const form = forms.items[index];
      const dependency = this.dependencies[index];
      pinned.push(form);
      if (seen.has(form)) continue;
      seen.add(form);
      if (manager.isTrue(form)) continue;
      if (manager.getOp(form) === OP_AND) {
        const numArgs = manager.getNumArgs(form);
        for (let argIndex = 0; argIndex < numArgs; argIndex++)
          this.assert(manager.getArg(form, argIndex), dependency);
        continue;
      }
      if (manager.isNot(form) && manager.getOp(manager.getArg(form, 0)) === OP_OR) {
        const disjunction = manager.getArg(form, 0);
        const numArgs = manager.getNumArgs(disjunction);
        for (let argIndex = 0; argIndex < numArgs; argIndex++)
          this.assert(mkNot(manager, manager.getArg(disjunction, argIndex)), dependency);
        continue;
      }
      if (index !== kept) {
        forms.set(kept, form);
        this.dependencies[kept] = dependency;
      }
      kept++;
    }
    this.shrinkTo(kept);
    pinned.reset();
  }

  // expr_ref_vector::shrink frees the formulas it drops first to last.
  shrinkTo(size: number) {
    const dropped = this.forms.items.slice(size);
    for (const form of dropped) this.manager.incRef(form);
    while (this.forms.size > size) this.forms.pop();
    for (const form of dropped) this.manager.decRef(form);
    this.dependencies.length = size;
  }
}

// Z3's dep_expr_state reads the formulas in place, without holding one.
class FdState extends DependentExprState {
  declare readonly goal: SolverFormulas;

  override get(index: number) {
    return this.goal.forms.items[index];
  }
}

class MacroReplacer extends RewriterTpl {
  constructor(
    manager: AstManager,
    private readonly decl: number,
    private readonly def: number,
  ) {
    super(manager);
  }

  override isRewritingPatterns() {
    return false;
  }

  override getSubst(expr: number) {
    return this.manager.kinds[expr] === KIND_APP && this.manager.decls[expr] === this.decl
      ? this.def
      : undefined;
  }
}

const addVars = (manager: AstManager, expr: number, freeVars: Set<number>) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(current).body);
    else if (manager.kinds[current] === KIND_APP) {
      if (manager.isUninterpreted(current)) freeVars.add(manager.decls[current]);
      manager.pushArgs(current, todo);
    }
  }
};

const retainDefinitions = (manager: AstManager, definitions: readonly Definition[]) => {
  for (const definition of definitions) {
    manager.incDeclRef(definition.decl);
    if (definition.def !== -1) manager.incRef(definition.def);
  }
  return [...definitions];
};

const releaseDefinitions = (manager: AstManager, definitions: readonly Definition[]) => {
  for (let index = definitions.length - 1; index >= 0; index--) {
    const definition = definitions[index];
    if (definition.def !== -1) manager.decRef(definition.def);
    manager.decDeclRef(definition.decl);
  }
};

class ModelTrail {
  readonly entries: Definition[] = [];

  constructor(private readonly manager: AstManager) {}

  hide(decl: number) {
    this.manager.incDeclRef(decl);
    this.entries.push({ decl, def: -1 });
  }

  define(decl: number, def: number) {
    this.manager.incDeclRef(decl);
    this.manager.incRef(def);
    this.entries.push({ decl, def });
  }

  shrink(size: number) {
    releaseDefinitions(this.manager, this.entries.splice(size));
  }

  replay(qhead: number, assumptions: RefVector, fmls: SolverFormulas) {
    const manager = this.manager;
    if (this.entries.length === 0) return;
    if (qhead === fmls.forms.size && assumptions.size === 0) return;
    const freeVars = new Set<number>();
    for (let index = qhead; index < fmls.forms.size; index++)
      addVars(manager, fmls.forms.items[index], freeVars);
    for (const assumption of assumptions.items) addVars(manager, assumption, freeVars);
    if (!this.entries.some((entry) => entry.def !== -1 && freeVars.has(entry.decl))) return;
    for (const entry of this.entries) {
      if (entry.def === -1 || !freeVars.has(entry.decl)) continue;
      addVars(manager, entry.def, freeVars);
      const replacer = new MacroReplacer(manager, entry.decl, entry.def);
      // Deviation from Z3: macro_replacer returns the rewrite of a named formula's last name, which drops the formula.
      for (let index = qhead; index < fmls.forms.size; index++) {
        const form = fmls.forms.items[index];
        const replaced = replacer.rewrite(form);
        replacer.reset();
        if (replaced !== form) fmls.update(index, replaced, fmls.getDependency(index));
        manager.decRef(replaced);
      }
      for (let index = 0; index < assumptions.size; index++) {
        assumptions.setOwned(index, replacer.rewrite(assumptions.items[index]));
        replacer.reset();
      }
      replacer.release();
    }
  }
}

class BoundedInt2BvSimplifier {
  private readonly bounds: BoundManager[];
  private readonly bvFns: number[] = [];
  private readonly intFns: number[] = [];
  private readonly fnLimits: number[] = [];
  private readonly int2bv = new Map<number, number>();
  private readonly bv2offset = new Map<number, Rational>();
  private readonly context: Bv2IntContext;
  private readonly rewriter: Bv2IntRewriter;
  private readonly sideConditions: RefVector;

  constructor(private readonly manager: AstManager) {
    this.bounds = [new BoundManager(manager)];
    this.context = new Bv2IntContext(manager, UINT_MAX);
    this.rewriter = new Bv2IntRewriter(manager, this.context);
    this.sideConditions = new RefVector(manager);
  }

  private accumulateSubstitution(
    substitution: ExprSafeReplace,
    bounds: BoundManager,
    trail: ModelTrail,
  ) {
    const manager = this.manager;
    for (const expr of bounds.boundedVars) {
      const lower = bounds.lowers.get(expr);
      const upper = bounds.uppers.get(expr);
      if (
        lower === undefined ||
        upper === undefined ||
        lower.value.compare(upper.value) > 0 ||
        lower.isStrict ||
        upper.isStrict ||
        manager.sorts[expr] !== SORT_INT
      )
        continue;
      const decl = manager.decls[expr];
      const bvDecl =
        this.int2bv.get(decl) ?? this.addBitVector(decl, lower.value, upper.value, trail);
      const offset = this.bv2offset.get(bvDecl) ?? lower.value;
      substitution.insert(expr, this.mkValue(bvDecl, offset));
    }
  }

  private mkValue(bvDecl: number, offset: Rational) {
    const manager = this.manager;
    const unsigned = mkBvApp(manager, OP_UBV2INT, [
      manager.mkApp(bvDecl, [], manager.funcDecls[bvDecl].range),
    ]);
    return offset.isZero()
      ? unsigned
      : manager.mkApp(OP_ADD, [unsigned, manager.mkNumeral(offset.num)], SORT_INT);
  }

  private addBitVector(decl: number, lower: Rational, upper: Rational, trail: ModelTrail) {
    const manager = this.manager;
    const domainSize = upper.sub(lower).num + 1n;
    const numBits = getNumBits(domainSize);
    const bits = manager.mkFreshConst("b", manager.mkBvSort(numBits));
    manager.incRef(bits);
    const bvDecl = manager.decls[bits];
    this.int2bv.set(decl, bvDecl);
    this.bv2offset.set(bvDecl, lower);
    manager.incDeclRef(bvDecl);
    this.bvFns.push(bvDecl);
    manager.incDeclRef(decl);
    this.intFns.push(decl);
    trail.hide(bvDecl);
    trail.define(decl, this.mkValue(bvDecl, lower));
    if (!lower.isZero() && (domainSize & (domainSize - 1n)) !== 0n)
      this.sideConditions.push(
        mkBvApp(manager, OP_ULEQ, [bits, manager.mkBvNumeral(domainSize - 1n, numBits)]),
      );
    manager.decRef(bits);
    return bvDecl;
  }

  reduce(state: FdState, trail: ModelTrail) {
    const manager = this.manager;
    const fmls = state.goal;
    const bounds = this.bounds[this.bounds.length - 1];
    state.forEachIndex((index) => collectBounds(manager, bounds, fmls.forms.items[index]));
    const substitution = new ExprSafeReplace(manager);
    try {
      for (const scopeBounds of this.bounds)
        this.accumulateSubstitution(substitution, scopeBounds, trail);
      if (substitution.sources.size > 0) {
        let replaced = -1;
        let result = -1;
        try {
          state.forEachIndex((index) => {
            const form = fmls.forms.items[index];
            replaced = assignOwned(manager, replaced, substitution.apply(form));
            result = assignOwned(manager, result, this.rewriter.rewrite(replaced));
            if (result !== form) fmls.update(index, result, fmls.getDependency(index));
          });
        } finally {
          release(manager, result);
          release(manager, replaced);
        }
      }
      for (const condition of this.sideConditions.items) fmls.assert(condition);
      this.sideConditions.reset();
      this.rewriter.reset();
    } finally {
      substitution.release();
    }
  }

  push() {
    this.fnLimits.push(this.bvFns.length);
    this.bounds.push(new BoundManager(this.manager));
  }

  pop(numScopes: number) {
    const manager = this.manager;
    const limit = this.fnLimits[this.fnLimits.length - numScopes];
    for (let index = this.intFns.length - 1; index >= limit; index--) {
      this.int2bv.delete(this.intFns[index]);
      this.bv2offset.delete(this.bvFns[index]);
    }
    for (const decl of this.bvFns.splice(limit)) manager.decDeclRef(decl);
    for (const decl of this.intFns.splice(limit)) manager.decDeclRef(decl);
    this.fnLimits.length -= numScopes;
    this.bounds.length -= numScopes;
  }

  release() {
    const manager = this.manager;
    this.sideConditions.reset();
    this.rewriter.release();
    this.context.release();
    for (const decl of this.intFns) manager.decDeclRef(decl);
    for (const decl of this.bvFns) manager.decDeclRef(decl);
  }
}

class Enum2BvSimplifier {
  private readonly rewriter: Enum2BvRewriter;
  private readonly hidden = new Set<number>();
  private readonly defined = new Set<number>();
  private readonly hiddenTrail: number[] = [];
  private readonly definedTrail: number[] = [];
  private readonly hiddenLimits: number[] = [];
  private readonly definedLimits: number[] = [];

  constructor(private readonly manager: AstManager) {
    this.rewriter = new Enum2BvRewriter(manager, undefined);
  }

  reduce(state: FdState, trail: ModelTrail) {
    const manager = this.manager;
    const fmls = state.goal;
    const rewriter = this.rewriter;
    let result = -1;
    try {
      state.forEachIndex((index) => {
        const form = fmls.forms.items[index];
        result = assignOwned(manager, result, rewriter.rewrite(form));
        if (result !== form) fmls.update(index, result, fmls.getDependency(index));
      });
      const bounds = new RefVector(manager);
      for (const bound of rewriter.bounds.items) bounds.push(bound);
      rewriter.bounds.reset();
      for (const bound of bounds.items) fmls.assert(bound);
      bounds.reset();
      for (const [, index] of rewriter.enumIndexes) {
        const bvDecl = rewriter.enumBvs[index];
        if (this.hidden.has(bvDecl)) continue;
        this.hidden.add(bvDecl);
        manager.incDeclRef(bvDecl);
        this.hiddenTrail.push(bvDecl);
        trail.hide(bvDecl);
      }
      for (const [decl, index] of rewriter.enumIndexes) {
        if (this.defined.has(decl)) continue;
        this.defined.add(decl);
        manager.incDeclRef(decl);
        this.definedTrail.push(decl);
        trail.define(decl, rewriter.enumDefs.items[index]);
      }
    } finally {
      release(manager, result);
    }
  }

  push() {
    this.rewriter.push();
    this.hiddenLimits.push(this.hiddenTrail.length);
    this.definedLimits.push(this.definedTrail.length);
  }

  pop(numScopes: number) {
    const manager = this.manager;
    const hiddenLimit = this.hiddenLimits[this.hiddenLimits.length - numScopes];
    const definedLimit = this.definedLimits[this.definedLimits.length - numScopes];
    for (let index = this.hiddenTrail.length - 1; index >= hiddenLimit; index--)
      this.hidden.delete(this.hiddenTrail[index]);
    for (let index = this.definedTrail.length - 1; index >= definedLimit; index--)
      this.defined.delete(this.definedTrail[index]);
    for (const decl of this.hiddenTrail.splice(hiddenLimit)) manager.decDeclRef(decl);
    for (const decl of this.definedTrail.splice(definedLimit)) manager.decDeclRef(decl);
    this.hiddenLimits.length -= numScopes;
    this.definedLimits.length -= numScopes;
    this.rewriter.pop(numScopes);
  }

  release() {
    const manager = this.manager;
    for (const decl of this.definedTrail) manager.decDeclRef(decl);
    for (const decl of this.hiddenTrail) manager.decDeclRef(decl);
    this.rewriter.release();
  }
}

// The sole uninterpreted constant of a term, which stands for it in the SAT solver.
const getRepresentative = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  let result = -1;
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.isUninterpretedConst(current)) {
      if (result !== -1 && result !== current) return -1;
      result = current;
    } else if (manager.kinds[current] === KIND_QUANTIFIER)
      todo.push(manager.getQuantifier(current).body);
    else if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
  }
  return result;
};

interface FdScope {
  qhead: number;
  size: number;
  trailSize: number;
  isInconsistent: boolean;
}

export class FdSolver {
  private readonly solver: IncSatSolver;
  private readonly fmls: SolverFormulas;
  private readonly state: FdState;
  private readonly trail: ModelTrail;
  private readonly int2bv: BoundedInt2BvSimplifier;
  private readonly enum2bv: Enum2BvSimplifier;
  private readonly coreReplace: ExprSafeReplace;
  private readonly core: RefVector;
  private readonly scopes: FdScope[] = [];
  private converter: Definition[] = [];
  private model: ProtoModel | undefined;

  constructor(
    private readonly manager: AstManager,
    params: SatParams,
    isIncremental = true,
  ) {
    this.solver = new IncSatSolver(manager, params, isIncremental);
    this.fmls = new SolverFormulas(manager);
    this.state = new FdState(manager, this.fmls);
    this.trail = new ModelTrail(manager);
    this.int2bv = new BoundedInt2BvSimplifier(manager);
    this.enum2bv = new Enum2BvSimplifier(manager);
    this.coreReplace = new ExprSafeReplace(manager);
    this.core = new RefVector(manager);
  }

  get reasonUnknown() {
    return this.solver.reasonUnknown;
  }

  assertExpr(form: number, name = -1) {
    this.clearModel();
    this.fmls.forms.push(form);
    this.fmls.dependencies.push(name === -1 ? undefined : mkDependencyLeaf(name));
  }

  push() {
    this.flush([]).reset();
    this.scopes.push({
      qhead: this.state.qhead,
      size: this.fmls.forms.size,
      trailSize: this.trail.entries.length,
      isInconsistent: this.fmls.isInconsistent,
    });
    this.int2bv.push();
    this.enum2bv.push();
    this.solver.push();
  }

  pop(numScopes: number) {
    this.solver.pop(numScopes);
    this.clearModel();
    this.int2bv.pop(numScopes);
    this.enum2bv.pop(numScopes);
    const scope = this.scopes[this.scopes.length - numScopes];
    this.scopes.length -= numScopes;
    this.trail.shrink(scope.trailSize);
    this.fmls.isInconsistent = scope.isInconsistent;
    this.fmls.shrinkTo(scope.size);
    this.state.qhead = scope.qhead;
  }

  check(assumptions: readonly number[] = []) {
    const flushed = this.flush(assumptions);
    const result = this.solver.check(flushed.items);
    flushed.reset();
    // solver::check_sat counts a step to see whether the limit stopped a search that gave up.
    if (result === L_UNDEF) this.manager.limit.inc();
    return result;
  }

  getModel() {
    if (this.model !== undefined) return this.model;
    const model = this.solver.mkModel();
    if (model === null) return undefined;
    const converted = this.converter.length > 0 ? applyDefinitions(this.converter, model) : model;
    converted.incRef();
    this.model = converted;
    return converted;
  }

  getUnsatCore() {
    this.core.reset();
    for (const expr of this.solver.getUnsatCore())
      this.core.pushOwned(this.coreReplace.apply(expr));
    return this.core.items;
  }

  getConsequences(assumptions: readonly number[], vars: readonly number[]) {
    const manager = this.manager;
    const flushed = this.flush([...assumptions, ...vars]);
    const asms1 = flushed.items.slice(0, assumptions.length);
    const vars1 = flushed.items.slice(assumptions.length);
    const queryVars = vars1.map((expr) => {
      const representative = getRepresentative(manager, expr);
      return representative === -1 ? expr : representative;
    });
    const found = this.solver.getConsequences(asms1, queryVars);
    const trail = new RefVector(manager);
    const rewriter = new Rewriter(manager, getRewriterOptions(manager, new Map()));
    const consequences = new RefVector(manager);
    for (const consequence of found.consequences) {
      const premise = manager.getArg(consequence, 0);
      const conclusion = manager.getArg(consequence, 1);
      const [query, value] = (() => {
        if (manager.decls[conclusion] === OP_EQ) {
          const lhs = manager.getArg(conclusion, 0);
          const rhs = manager.getArg(conclusion, 1);
          for (const queryVar of queryVars) {
            if (lhs === queryVar) return [lhs, rhs];
            if (rhs === queryVar) return [rhs, lhs];
          }
          return [-1, -1];
        }
        if (manager.isUninterpretedConst(conclusion)) return [conclusion, manager.trueExpr];
        if (
          manager.isNot(conclusion) &&
          manager.isUninterpretedConst(manager.getArg(conclusion, 0))
        )
          return [manager.getArg(conclusion, 0), manager.falseExpr];
        return [-1, -1];
      })();
      const index = queryVars.findIndex(
        (queryVar, position) => queryVar === query && vars[position] !== vars1[position],
      );
      const decoded = (() => {
        if (query === -1 || index === -1) return consequence;
        const substitution = new ExprSafeReplace(manager);
        substitution.insert(query, value);
        const replaced = substitution.apply(vars1[index]);
        trail.pushOwned(replaced);
        substitution.release();
        const rewritten = rewriter.rewrite(replaced);
        trail.pushOwned(rewritten);
        return manager.mkApp(
          OP_IMPLIES,
          [premise, manager.mkEq(vars[index], rewritten)],
          SORT_BOOL,
        );
      })();
      consequences.pushOwned(this.coreReplace.apply(decoded));
    }
    rewriter.release();
    trail.reset();
    flushed.reset();
    return { result: found.result, consequences };
  }

  getAssertions() {
    return this.solver.getAssertions();
  }

  getConverters(): Goal["converters"] {
    const definitions = retainDefinitions(this.manager, this.converter);
    return [
      ...(definitions.length > 0 ? [{ definitions, refs: 1 }] : []),
      ...this.solver.getConverters(),
    ];
  }

  private flush(assumptions: readonly number[]) {
    const manager = this.manager;
    const fmls = this.fmls;
    this.clearModel();
    const qhead = this.state.qhead;
    const flushed = new RefVector(manager);
    for (const assumption of assumptions) flushed.push(assumption);
    this.coreReplace.reset();
    this.replay(qhead, flushed);
    if (qhead < fmls.forms.size) {
      this.reduce();
      if (!manager.limit.inc()) return flushed;
      this.replay(qhead, flushed);
      this.state.qhead = fmls.forms.size;
    }
    flushed.items.forEach((assumption, index) =>
      this.coreReplace.insert(assumption, assumptions[index]),
    );
    const converter = retainDefinitions(manager, this.trail.entries);
    releaseDefinitions(manager, this.converter);
    this.converter = converter;
    for (let index = qhead; index < fmls.forms.size; index++) {
      const names = getDependencyValues(fmls.getDependency(index));
      if (names.length === 0) this.solver.assertExpr(fmls.forms.items[index]);
      else this.solver.assertNamed(fmls.forms.items[index], manager.mkAnd(names));
    }
    return flushed;
  }

  private replay(qhead: number, assumptions: RefVector) {
    const manager = this.manager;
    this.trail.replay(qhead, assumptions, this.fmls);
    if (assumptions.size === 0) return;
    const rewriter = new Rewriter(manager, getRewriterOptions(manager, new Map()));
    for (let index = 0; index < assumptions.size; index++)
      assumptions.setOwned(index, rewriter.rewrite(assumptions.items[index]));
    rewriter.release();
  }

  private reduce() {
    const manager = this.manager;
    const fmls = this.fmls;
    const state = this.state;
    if (fmls.isInconsistent || !manager.limit.inc()) return;
    const simplifiers = [
      () => this.int2bv.reduce(state, this.trail),
      () => {
        const simplifier = createCard2Bv(manager, getRewriterOptions(manager, new Map()))(state);
        try {
          simplifier.reduce();
        } finally {
          simplifier.release();
        }
      },
      () => this.enum2bv.reduce(state, this.trail),
    ];
    for (const simplify of simplifiers) {
      if (fmls.isInconsistent || !manager.limit.inc()) break;
      try {
        simplify();
      } catch (error) {
        // The rewriter_exception of a canceled rewrite or of a nested datatype.
        if (!(error instanceof SmtCanceledError || error instanceof SmtTacticError)) throw error;
        break;
      }
      fmls.flattenSuffix(state.qhead);
    }
    fmls.flattenSuffix(state.qhead);
  }

  private clearModel() {
    this.model?.decRef();
    this.model = undefined;
  }

  release() {
    this.clearModel();
    this.core.reset();
    this.coreReplace.release();
    releaseDefinitions(this.manager, this.converter);
    this.converter = [];
    this.int2bv.release();
    this.enum2bv.release();
    this.trail.shrink(0);
    this.fmls.reset();
    this.solver.release();
  }
}

export const createFdTactic = (manager: AstManager, params: SatParams) => (goal: Goal) => {
  const solver = new FdSolver(manager, params, false);
  try {
    for (const form of goal.forms.items) solver.assertExpr(form);
    const result = solver.check();
    goal.reset();
    if (result === L_TRUE) {
      const model = solver.getModel();
      model?.incRef();
      if (model !== undefined) goal.model = model;
    } else if (result === L_FALSE) goal.assert(manager.falseExpr);
    else {
      if (!manager.limit.inc()) throw new SmtTacticError("canceled");
      for (const form of solver.getAssertions()) goal.assert(form);
      goal.converters = [...goal.converters, ...solver.getConverters()];
    }
    goal.depth++;
    return [goal];
  } finally {
    solver.release();
  }
};

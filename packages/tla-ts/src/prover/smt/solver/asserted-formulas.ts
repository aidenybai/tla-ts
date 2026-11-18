import { SmtInvariantError } from "../../../errors";
import {
  AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_EQ,
  OP_ITE,
  OP_NOT,
  OP_OR,
  SORT_BOOL,
  QUANTIFIER_FORALL,
} from "./ast";
import { mkNot } from "./ast-util";
import { simplifyInjAxiom } from "./inj-axiom";
import { MacroManager } from "./macro-finder";
import { ElimBoundsRw } from "./elim-bounds";
import { DefinedNames, Nnf } from "./nnf";
import { PatternInference } from "./pattern-inference";
import { MaxBvSharing } from "./maximize-ac-sharing";
import { PullQuant } from "./pull-quant";
import { NgPushAppIteRw } from "./push-app-ite";
import { RefVector } from "./ref-vector";
import { KERNEL_REWRITER_OPTIONS, Rewriter } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import type { SmtConfig } from "./smt-setup";

export class PatternInferenceRw extends RewriterTpl {
  constructor(
    manager: AstManager,
    private inference: PatternInference,
  ) {
    super(manager);
  }

  reduceQuantifier(expr: number, body: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (data.kind !== QUANTIFIER_FORALL || data.patterns.length > 0) return -1;
    const quantifier = manager.withTemporaries(() => {
      const inferred = this.inference.infer(data.sorts.length, body, data.weight, data.noPatterns);
      const withPatterns = manager.mkQuantifier({ ...data, body, patterns: inferred.patterns });
      return inferred.weight === data.weight
        ? withPatterns
        : manager.mkQuantifier({
            ...data,
            body,
            patterns: inferred.patterns,
            weight: inferred.weight,
          });
    });
    if (manager.getQuantifier(quantifier).patterns.length > 0) return quantifier;
    const pull = new PullQuant(manager);
    const pulled = pull.rewrite(quantifier);
    const pulledData = manager.getQuantifier(pulled);
    const result =
      pulled === quantifier
        ? -1
        : manager.withTemporaries(
            () => {
              const patterns = this.inference.inferPulled(pulledData.sorts.length, pulledData.body);
              return patterns.length === 0 ? -1 : manager.mkQuantifier({ ...pulledData, patterns });
            },
            (innerResult) => (innerResult === -1 ? [] : [innerResult]),
          );
    if (result !== -1) manager.decRef(quantifier);
    manager.decRef(pulled);
    pull.release();
    return result === -1 ? quantifier : result;
  }
}

// Like Z3's, it keeps the definitions it made until a pop, and each reduce asserts them all again.
class ElimTermIteRw extends RewriterTpl {
  readonly definitions: RefVector;
  private lims: number[] = [];

  constructor(
    manager: AstManager,
    private names: DefinedNames,
  ) {
    super(manager);
    this.definitions = new RefVector(manager);
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (decl !== OP_ITE || sort === SORT_BOOL) return -1;
    const ite = manager.mkApp(OP_ITE, args, sort);
    manager.incRef(ite);
    const named = this.names.mkName(ite);
    manager.decRef(ite);
    if (named.definition === -1) return -1;
    this.definitions.push(named.definition);
    manager.decRef(named.definition);
    manager.incRef(named.name);
    return named.name;
  }

  push() {
    this.lims.push(this.definitions.size);
  }

  pop() {
    this.definitions.shrink(this.lims[this.lims.length - 1]);
    this.lims.pop();
  }
}

const isGreater = (manager: AstManager, left: number, right: number): boolean => {
  if (left === right) return false;
  const isLeftValue = manager.isValue(left);
  const isRightValue = manager.isValue(right);
  if (!isLeftValue && isRightValue) return true;
  if (isLeftValue && !isRightValue) return false;
  if (manager.depths[left] !== manager.depths[right])
    return manager.depths[left] > manager.depths[right];
  if (manager.kinds[left] !== KIND_APP || manager.kinds[right] !== KIND_APP) return false;
  const leftDeclId = manager.getDeclId(left);
  const rightDeclId = manager.getDeclId(right);
  if (leftDeclId !== rightDeclId) return leftDeclId > rightDeclId;
  if (manager.getNumArgs(left) !== manager.getNumArgs(right))
    return manager.getNumArgs(left) > manager.getNumArgs(right);
  for (let index = 0; index < manager.getNumArgs(left); index++)
    if (manager.getArg(left, index) !== manager.getArg(right, index))
      return isGreater(manager, manager.getArg(left, index), manager.getArg(right, index));
  return false;
};

class Substitution {
  readonly map = new Map<number, number>();
  private trail: RefVector;
  private trailLims: number[] = [];

  constructor(private manager: AstManager) {
    this.trail = new RefVector(manager);
  }

  insert(key: number, value: number) {
    if (this.map.has(key)) return;
    this.manager.incRef(key);
    this.manager.incRef(value);
    this.map.set(key, value);
    this.trail.push(key);
  }

  push() {
    this.trailLims.push(this.trail.size);
  }

  pop() {
    const size = this.trailLims[this.trailLims.length - 1];
    this.trailLims.pop();
    for (const key of this.trail.items.slice(size)) {
      const value = this.map.get(key);
      if (value === undefined) throw new SmtInvariantError("a trailed key has no substitution");
      this.manager.decRef(value);
      this.map.delete(key);
      this.manager.decRef(key);
    }
    this.trail.shrink(size);
  }

  cleanup() {
    for (const [key, value] of this.map) {
      this.manager.decRef(key);
      this.manager.decRef(value);
    }
    this.map.clear();
  }

  release() {
    this.trail.reset();
  }

  update(expr: number) {
    const manager = this.manager;
    if (manager.isGroundApp(expr) && manager.getOp(expr) === OP_EQ) {
      const left = manager.getArg(expr, 0);
      const right = manager.getArg(expr, 1);
      if (isGreater(manager, left, right)) {
        this.insert(left, right);
        return;
      }
      if (isGreater(manager, right, left)) {
        this.insert(right, left);
        return;
      }
    }
    if (manager.isNot(expr)) this.insert(manager.getArg(expr, 0), manager.falseExpr);
    else this.insert(expr, manager.trueExpr);
  }
}

interface AssertedScope {
  numFormulas: number;
  isInconsistent: boolean;
}

// Like Z3, it holds its formulas, so that expressions are deleted in Z3's order.
export class AssertedFormulas {
  private formulas: RefVector;
  private qhead = 0;
  private substitution: Substitution;
  private rewriter: Rewriter;
  private isEliminatingAnd = false;
  private isReducePending = true;
  private isNnfCnf = true;
  private isEq2Ineq = false;
  private isEliminatingTermIte = false;
  private isLiftingNonGroundIte = false;
  private isEliminatingBounds = false;
  private names: DefinedNames;
  private termIteElim: ElimTermIteRw;
  private patternInference: PatternInferenceRw;
  private bvSharing: MaxBvSharing;
  private ngLiftIte: NgPushAppIteRw;
  private boundsElim: ElimBoundsRw;
  // The 1-bit zero of apply_bit2int.
  private bit0: number;
  hasQuantifiers = false;
  readonly macros: MacroManager;
  isInconsistent = false;
  isPreprocessing = true;
  private numLazyScopes = 0;
  private scopes: AssertedScope[] = [];

  constructor(
    private manager: AstManager,
    private isFindingMacros = false,
  ) {
    this.formulas = new RefVector(manager);
    this.macros = new MacroManager(manager);
    this.substitution = new Substitution(manager);
    // set_eliminate_and turns coalesce_chars off when smt.string_solver is seq, its default, so
    // string literals reach the seq theory as concatenations of units.
    this.rewriter = new Rewriter(manager, { ...KERNEL_REWRITER_OPTIONS, isCoalescingChars: false });
    this.names = new DefinedNames(manager);
    this.termIteElim = new ElimTermIteRw(manager, this.names);
    this.patternInference = new PatternInferenceRw(manager, new PatternInference(manager));
    this.bvSharing = new MaxBvSharing(manager);
    this.ngLiftIte = new NgPushAppIteRw(manager);
    this.boundsElim = new ElimBoundsRw(manager);
    this.bit0 = manager.mkBvNumeral(0n, 1);
    manager.incRef(this.bit0);
  }

  finalize() {
    this.names.release();
    this.formulas.reset();
    this.macros.release();
    this.bvSharing.release();
    this.rewriter.reset();
    this.substitution.cleanup();
  }

  release() {
    this.ngLiftIte.release();
    this.manager.decRef(this.bit0);
    this.boundsElim.release();
    this.termIteElim.release();
    this.patternInference.release();
    this.substitution.release();
    this.rewriter.release();
  }

  push() {
    this.numLazyScopes++;
  }

  pop() {
    if (this.numLazyScopes > 0) {
      this.numLazyScopes--;
      return;
    }
    const scope = this.scopes[this.scopes.length - 1];
    this.scopes.pop();
    this.isInconsistent = scope.isInconsistent;
    this.bvSharing.popScope();
    this.macros.popScope();
    this.names.pop();
    this.termIteElim.pop();
    this.substitution.pop();
    this.formulas.shrink(scope.numFormulas);
    this.qhead = scope.numFormulas;
    this.flushCache();
  }

  private forcePush() {
    for (; this.numLazyScopes > 0; this.numLazyScopes--) {
      this.reduce();
      this.commit();
      this.substitution.push();
      this.scopes.push({ numFormulas: this.formulas.size, isInconsistent: this.isInconsistent });
      this.names.push();
      this.termIteElim.push();
      this.macros.pushScope();
      this.bvSharing.pushScope();
    }
  }

  assertExpr(expr: number) {
    this.forcePush();
    const manager = this.manager;
    if (this.isInconsistent || manager.isTrue(expr)) return;
    if (manager.hasQuantifierFlags[expr]) this.hasQuantifiers = true;
    this.isReducePending = true;
    if (!this.isPreprocessing) {
      this.pushAssertion(expr, this.formulas);
      return;
    }
    this.setEliminateAnd(false);
    const rewritten = this.rewriter.rewrite(expr);
    this.pushAssertion(rewritten, this.formulas);
    manager.decRef(rewritten);
  }

  // The setup's parameters, which set_eliminate_and gives the rewriter.
  setup(config: SmtConfig) {
    this.isNnfCnf = config.isNnfCnf;
    this.isEq2Ineq = config.isEq2Ineq;
    this.isEliminatingTermIte = config.isEliminatingTermIte;
    this.isLiftingNonGroundIte = config.isLiftingNonGroundIte;
    this.isEliminatingBounds = config.isEliminatingBounds;
    this.isFindingMacros ||= config.isFindingMacros;
  }

  updateParams(config: SmtConfig) {
    this.isNnfCnf = config.isNnfCnf;
    this.isEq2Ineq = config.isEq2Ineq;
    this.isEliminatingTermIte = config.isEliminatingTermIte;
    this.isLiftingNonGroundIte = config.isLiftingNonGroundIte;
    this.isEliminatingBounds = config.isEliminatingBounds;
    this.isFindingMacros = config.isFindingMacros;
    this.isReducePending = true;
  }

  getNumFormulas() {
    return this.formulas.size;
  }

  getFormulas() {
    return this.formulas.items;
  }

  getQhead() {
    return this.qhead;
  }

  commit(qhead = this.formulas.size) {
    const committed = this.formulas.items.slice(this.qhead, qhead);
    this.macros.markForbidden(committed);
    for (const formula of committed) this.substitution.update(formula);
    this.qhead = qhead;
  }

  reduce() {
    if (this.isInconsistent || this.isCanceled() || this.qhead === this.formulas.size) return;
    if (!this.hasQuantifiers && !this.isPreprocessing) return;
    const isFindingMacros = this.isFindingMacros && this.hasQuantifiers;
    if (this.macros.hasMacros()) this.invoke(isFindingMacros, () => this.findMacros());
    this.setEliminateAnd(false);
    if (!this.invoke(true, () => this.propagateValues())) return;
    if (!this.invoke(isFindingMacros, () => this.findMacros())) return;
    if (!this.invoke(this.isNnfCnf || this.hasQuantifiers, () => this.nnfCnf())) return;
    this.setEliminateAnd(true);
    if (!this.invoke(true, () => this.reduceAsserted())) return;
    if (!this.invoke(this.isLiftingNonGroundIte, () => this.liftNonGroundIte())) return;
    if (!this.invoke(this.isEliminatingTermIte, () => this.elimTermIte())) return;
    if (!this.invoke(this.hasQuantifiers, () => this.refineInjAxioms())) return;
    if (!this.invoke(isFindingMacros, () => this.findMacros())) return;
    if (!this.invoke(this.isEliminatingBounds && this.hasQuantifiers, () => this.elimBounds()))
      return;
    if (!this.invoke(this.hasQuantifiers, () => this.inferPatterns())) return;
    if (!this.invoke(true, () => this.maximizeBvSharing())) return;
    if (!this.invoke(true, () => this.reduceAsserted())) return;
    if (!this.invoke(true, () => this.flattenClauses())) return;
    this.flushCache();
  }

  private isCanceled() {
    return !this.manager.limit.inc();
  }

  private invoke(isApplying: boolean, step: () => void) {
    if (!isApplying) return true;
    step();
    return !this.isInconsistent && !this.isCanceled();
  }

  private pushAssertion(expr: number, result: RefVector) {
    const manager = this.manager;
    if (this.isInconsistent || manager.isTrue(expr)) return;
    if (manager.isFalse(expr)) {
      result.push(expr);
      this.isInconsistent = true;
      return;
    }
    const op = manager.getOp(expr);
    if (op === OP_AND) {
      for (let index = 0; index < manager.getNumArgs(expr); index++) {
        const arg = manager.getArg(expr, index);
        this.pushAssertion(arg, result);
      }
      return;
    }
    if (op === OP_NOT && manager.getOp(manager.getArg(expr, 0)) === OP_OR) {
      const disjunction = manager.getArg(expr, 0);
      for (let index = 0; index < manager.getNumArgs(disjunction); index++) {
        const negation = mkNot(manager, manager.getArg(disjunction, index));
        manager.incRef(negation);
        this.pushAssertion(negation, result);
        manager.decRef(negation);
      }
      return;
    }
    result.push(expr);
  }

  private refineInjAxiom(formula: number) {
    const manager = this.manager;
    const refined =
      manager.kinds[formula] === KIND_QUANTIFIER ? simplifyInjAxiom(manager, formula) : undefined;
    if (refined !== undefined) return refined;
    manager.incRef(formula);
    return formula;
  }

  private elimTermIte() {
    const elim = this.termIteElim;
    if (!this.simplifyFormulas((formula) => elim.rewrite(formula))) return;
    if (elim.definitions.size > 0) this.isReducePending = true;
    for (const definition of elim.definitions.items) this.formulas.push(definition);
    this.flushCache();
    this.reduceAsserted();
    elim.reset();
  }

  private simplifyAndReduce(simplify: (formula: number) => number) {
    if (!this.simplifyFormulas(simplify)) return;
    this.flushCache();
    this.reduceAsserted();
  }

  private liftNonGroundIte() {
    this.simplifyAndReduce((formula) => this.ngLiftIte.rewrite(formula));
  }

  private refineInjAxioms() {
    this.simplifyFormulas((formula) => this.refineInjAxiom(formula));
  }

  private elimBounds() {
    this.simplifyAndReduce((formula) => this.boundsElim.rewrite(formula));
  }

  private inferPatterns() {
    this.simplifyFormulas((formula) => this.patternInference.rewrite(formula));
  }

  private maximizeBvSharing() {
    if (this.simplifyFormulas((formula) => this.bvSharing.rewrite(formula))) this.reduceAsserted();
  }

  private findMacros() {
    this.isReducePending = true;
    this.swapFormulas(this.macros.find(this.formulas.items.slice(this.qhead)));
    this.flushCache();
    this.reduceAsserted();
  }

  private flushCache() {
    this.rewriter.setSubstitution(this.substitution.map);
  }

  private setEliminateAnd(isEliminatingAnd: boolean) {
    if (this.isEliminatingAnd === isEliminatingAnd) return;
    this.isEliminatingAnd = isEliminatingAnd;
    this.isReducePending = true;
    this.rewriter.setEliminatingAnd(isEliminatingAnd);
    this.rewriter.setEq2Ineq(this.isEq2Ineq);
    this.flushCache();
  }

  private swapFormulas(formulas: RefVector) {
    this.formulas.shrink(this.qhead);
    for (const formula of formulas.items) this.formulas.push(formula);
    formulas.reset();
  }

  private simplifyFormulas(simplify: (formula: number) => number) {
    const manager = this.manager;
    const formulas = new RefVector(manager);
    for (let index = this.qhead; index < this.formulas.size; index++) {
      const formula = this.formulas.items[index];
      const result = simplify(formula);
      if (result === formula) formulas.push(formula);
      else {
        this.pushAssertion(result, formulas);
        this.isReducePending = true;
      }
      manager.decRef(result);
      if (this.isCanceled()) {
        formulas.reset();
        return false;
      }
    }
    this.swapFormulas(formulas);
    return true;
  }

  private reduceAsserted() {
    if (!this.isReducePending) return;
    this.simplifyFormulas((formula) => this.rewriter.rewrite(formula));
    this.isReducePending = false;
  }

  private propagateValues() {
    const manager = this.manager;
    const substitution = this.substitution;
    const size = this.formulas.size;
    let numPropagated = 0;
    const propagate = (index: number) => {
      const formula = this.formulas.items[index];
      manager.incRef(formula);
      const rewritten = this.rewriter.rewrite(formula);
      this.formulas.set(index, rewritten);
      if (manager.isFalse(rewritten)) this.isInconsistent = true;
      substitution.update(rewritten);
      if (rewritten !== formula) numPropagated++;
      manager.decRef(rewritten);
      manager.decRef(formula);
    };
    this.flushCache();
    substitution.push();
    for (let index = this.qhead; index < size; index++) propagate(index);
    this.flushCache();
    substitution.pop();
    substitution.push();
    for (let index = size - 1; index >= this.qhead; index--) propagate(index);
    substitution.pop();
    this.flushCache();
    if (numPropagated > 0) this.reduceAsserted();
  }

  private nnfCnf() {
    this.isReducePending = true;
    const manager = this.manager;
    const nnf = new Nnf(manager, this.names);
    const formulas = new RefVector(manager);
    const todo = new RefVector(manager);
    const isFinished = (() => {
      for (let index = this.qhead; index < this.formulas.size; index++) {
        todo.reset();
        let result = nnf.apply(this.formulas.items[index], todo);
        todo.push(result);
        if (this.isCanceled()) {
          manager.decRef(result);
          return false;
        }
        for (let position = 0; position < todo.size; position++) {
          const rewritten = this.rewriter.rewrite(todo.items[position]);
          manager.decRef(result);
          result = rewritten;
          if (this.isCanceled()) {
            manager.decRef(result);
            return false;
          }
          this.pushAssertion(result, formulas);
        }
        manager.decRef(result);
      }
      return true;
    })();
    if (isFinished) this.swapFormulas(formulas);
    todo.reset();
    formulas.reset();
    nnf.release();
  }

  private flattenClauses() {
    this.isReducePending = true;
    const manager = this.manager;
    const mkNegation = (expr: number) =>
      manager.isNot(expr) ? manager.getArg(expr, 0) : manager.mkApp(OP_NOT, [expr], SORT_BOOL);
    const isConjunction = (expr: number) =>
      manager.isNot(expr) && manager.getOp(manager.getArg(expr, 0)) === OP_OR;
    for (let isChanged = true; isChanged;) {
      isChanged = false;
      const formulas = new RefVector(manager);
      const occurrences = new Map<number, number>();
      for (let index = this.qhead; index < this.formulas.size; index++) {
        const formula = this.formulas.items[index];
        if (manager.getOp(formula) !== OP_OR || manager.getNumArgs(formula) !== 2) continue;
        for (let argIndex = 0; argIndex < 2; argIndex++) {
          const arg = manager.getArg(formula, argIndex);
          if (isConjunction(arg)) occurrences.set(arg, (occurrences.get(arg) ?? 0) + 1);
        }
      }
      for (let index = this.qhead; index < this.formulas.size; index++) {
        const formula = this.formulas.items[index];
        if (manager.getOp(formula) === OP_OR && manager.getNumArgs(formula) === 2) {
          const conjunctionIndex = [1, 0].find(
            (position) =>
              isConjunction(manager.getArg(formula, position)) &&
              occurrences.get(manager.getArg(formula, position)) === 1,
          );
          if (conjunctionIndex !== undefined) {
            const other = manager.getArg(formula, 1 - conjunctionIndex);
            const disjunction = manager.getArg(manager.getArg(formula, conjunctionIndex), 0);
            for (let argIndex = 0; argIndex < manager.getNumArgs(disjunction); argIndex++)
              formulas.push(
                manager.mkApp(
                  OP_OR,
                  [other, mkNegation(manager.getArg(disjunction, argIndex))],
                  SORT_BOOL,
                ),
              );
            isChanged = true;
            continue;
          }
        }
        if (manager.getOp(formula) === OP_ITE) {
          formulas.push(
            manager.mkApp(
              OP_OR,
              [mkNegation(manager.getArg(formula, 0)), manager.getArg(formula, 1)],
              SORT_BOOL,
            ),
          );
          formulas.push(
            manager.mkApp(
              OP_OR,
              [manager.getArg(formula, 0), manager.getArg(formula, 2)],
              SORT_BOOL,
            ),
          );
          isChanged = true;
          continue;
        }
        formulas.push(formula);
      }
      this.swapFormulas(formulas);
    }
  }
}

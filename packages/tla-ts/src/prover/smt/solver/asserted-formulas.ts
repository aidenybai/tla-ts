// Ported from Z3 (src/solver/assertions/asserted_formulas.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import { AstManager, KIND_APP, OP_AND, OP_EQ, OP_ITE, OP_NOT, OP_OR, SORT_BOOL } from "./ast";
import { mkNot } from "./ast-util";
import { DefinedNames, Nnf } from "./nnf";
import { PatternInference } from "./pattern-inference";
import { MaxBvSharing } from "./maximize-ac-sharing";
import { PullQuant } from "./pull-quant";
import { RefVector } from "./ref-vector";
import { KERNEL_REWRITER_OPTIONS, Rewriter } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

// Its cache lives as long as the assertions, like Z3's.
class PatternInferenceRw extends RewriterTpl {
  constructor(
    manager: AstManager,
    private inference: PatternInference,
  ) {
    super(manager);
  }

  reduceQuantifier(expr: number, body: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (!data.isForall || data.patterns.length > 0) return -1;
    const quantifier = manager.withTemporaries(() => {
      const inferred = this.inference.infer(data.sorts.length, body, data.weight);
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
    // The quantifier with the new patterns replaces new_q at once, and the pulled quantifier and
    // pull_quant's cache go when reduce_quantifier returns.
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

// Z3's Knuth-Bendix style order for propagate_values: values are smallest, then deeper terms are
// greater.
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

  update(expr: number) {
    const manager = this.manager;
    if (manager.isGround(expr) && manager.getOp(expr) === OP_EQ) {
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
  private names: DefinedNames;
  private patternInference: PatternInferenceRw;
  private bvSharing: MaxBvSharing;
  private hasQuantifiers = false;
  isInconsistent = false;
  private numLazyScopes = 0;
  private scopes: AssertedScope[] = [];

  constructor(private manager: AstManager) {
    this.formulas = new RefVector(manager);
    this.substitution = new Substitution(manager);
    this.rewriter = new Rewriter(manager, KERNEL_REWRITER_OPTIONS);
    this.names = new DefinedNames(manager);
    this.patternInference = new PatternInferenceRw(manager, new PatternInference(manager));
    this.bvSharing = new MaxBvSharing(manager);
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
    this.names.pop();
    this.substitution.pop();
    this.formulas.shrink(scope.numFormulas);
    this.qhead = scope.numFormulas;
    this.flushCache();
  }

  private forcePush() {
    for (; this.numLazyScopes > 0; this.numLazyScopes--) {
      this.substitution.push();
      this.scopes.push({ numFormulas: this.formulas.size, isInconsistent: this.isInconsistent });
      this.names.push();
      this.bvSharing.pushScope();
    }
  }

  assertExpr(expr: number) {
    this.forcePush();
    const manager = this.manager;
    if (this.isInconsistent || manager.isTrue(expr)) return;
    this.setEliminateAnd(false);
    const rewritten = this.rewriter.rewrite(expr);
    if (manager.hasQuantifierFlags[expr]) this.hasQuantifiers = true;
    this.pushAssertion(rewritten, this.formulas);
    manager.decRef(rewritten);
    this.isReducePending = true;
  }

  getNumFormulas() {
    return this.formulas.size;
  }

  // Like internalize_assertions, nothing is committed once the formulas are inconsistent.
  reduce() {
    if (this.qhead === this.formulas.size) return [];
    if (!this.isInconsistent) this.reduceCore();
    if (this.isInconsistent) return [];
    const result = this.formulas.items.slice(this.qhead);
    for (const formula of result) this.substitution.update(formula);
    this.qhead = this.formulas.size;
    return result;
  }

  // Each step but the last stops the preprocessing when a formula is false.
  private reduceCore() {
    this.setEliminateAnd(false);
    this.propagateValues();
    if (this.isInconsistent) return;
    this.isReducePending = true;
    this.nnfCnf();
    if (this.isInconsistent) return;
    this.setEliminateAnd(true);
    this.reduceAsserted();
    if (this.isInconsistent) return;
    if (
      this.hasQuantifiers &&
      this.simplifyFormulas((formula) => this.patternInference.rewrite(formula))
    )
      this.isReducePending = true;
    if (this.isInconsistent) return;
    if (this.simplifyFormulas((formula) => this.bvSharing.rewrite(formula)))
      this.isReducePending = true;
    if (this.isInconsistent) return;
    this.reduceAsserted();
    if (this.isInconsistent) return;
    this.isReducePending = true;
    this.flattenClauses();
    if (this.isInconsistent) return;
    this.flushCache();
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
        // narg holds the negation while it is pushed.
        const negation = mkNot(manager, manager.getArg(disjunction, index));
        manager.incRef(negation);
        this.pushAssertion(negation, result);
        manager.decRef(negation);
      }
      return;
    }
    result.push(expr);
  }

  private flushCache() {
    this.rewriter.setSubstitution(this.substitution.map);
  }

  private setEliminateAnd(isEliminatingAnd: boolean) {
    if (this.isEliminatingAnd === isEliminatingAnd) return;
    this.isEliminatingAnd = isEliminatingAnd;
    this.isReducePending = true;
    this.rewriter.setEliminatingAnd(isEliminatingAnd);
    this.flushCache();
  }

  private swapFormulas(formulas: RefVector) {
    this.formulas.shrink(this.qhead);
    for (const formula of formulas.items) this.formulas.push(formula);
    formulas.reset();
  }

  // simplify returns its result with a reference.
  private simplifyFormulas(simplify: (formula: number) => number) {
    const manager = this.manager;
    const formulas = new RefVector(manager);
    let isChanged = false;
    for (let index = this.qhead; index < this.formulas.size; index++) {
      const formula = this.formulas.items[index];
      const result = simplify(formula);
      if (result === formula) formulas.push(formula);
      else {
        this.pushAssertion(result, formulas);
        isChanged = true;
      }
      manager.decRef(result);
    }
    this.swapFormulas(formulas);
    return isChanged;
  }

  private reduceAsserted() {
    if (!this.isReducePending) return;
    this.simplifyFormulas((formula) => this.rewriter.rewrite(formula));
    this.isReducePending = false;
  }

  // Z3 stops after one round, since the passes add no formula.
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
    const manager = this.manager;
    const nnf = new Nnf(manager, this.names);
    const formulas = new RefVector(manager);
    const todo = new RefVector(manager);
    for (let index = this.qhead; index < this.formulas.size; index++) {
      todo.reset();
      let result = nnf.apply(this.formulas.items[index], todo);
      todo.push(result);
      for (let position = 0; position < todo.size; position++) {
        const rewritten = this.rewriter.rewrite(todo.items[position]);
        manager.decRef(result);
        result = rewritten;
        this.pushAssertion(result, formulas);
      }
      manager.decRef(result);
    }
    this.swapFormulas(formulas);
    todo.reset();
    nnf.release();
  }

  private flattenClauses() {
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

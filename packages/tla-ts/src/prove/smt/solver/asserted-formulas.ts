// Ported from Z3 (src/solver/assertions/asserted_formulas.cpp), MIT license, see z3-license.txt. The
// preprocessing that the SMT kernel runs on its assertions before search.
import { AstManager, KIND_APP, OP_AND, OP_EQ, OP_ITE, OP_NOT, OP_OR, SORT_BOOL } from "./ast";
import { mkNot } from "./ast-util";
import { DefinedNames, Nnf } from "./nnf";
import { PatternInference } from "./pattern-inference";
import { KERNEL_ARITH_OPTIONS } from "./arith-rewriter";
import { RefVector } from "./ref-vector";
import { Rewriter } from "./rewriter";

// asserted_formulas::push_assertion: splits conjunctions and negated disjunctions.
const pushAssertion = (manager: AstManager, expr: number, result: RefVector) => {
  if (manager.isTrue(expr)) return;
  const op = manager.getOp(expr);
  if (op === OP_AND) {
    for (const arg of manager.args[expr]) pushAssertion(manager, arg, result);
    return;
  }
  if (op === OP_NOT && manager.getOp(manager.args[expr][0]) === OP_OR) {
    for (const arg of manager.args[manager.args[expr][0]])
      pushAssertion(manager, mkNot(manager, arg), result);
    return;
  }
  result.push(expr);
};

const inferAllPatterns = (
  manager: AstManager,
  inference: PatternInference,
  expr: number,
): number => {
  if (!manager.hasQuantifierFlags[expr]) return expr;
  if (manager.kinds[expr] === KIND_APP)
    return manager.mkApp(
      manager.decls[expr],
      manager.args[expr].map((innerArg) => inferAllPatterns(manager, inference, innerArg)),
      manager.sorts[expr],
    );
  const data = manager.getQuantifier(expr);
  const body = inferAllPatterns(manager, inference, data.body);
  if (data.patterns.length > 0 || !data.isForall) return manager.mkQuantifier({ ...data, body });
  const inferred = inference.infer(data.sorts.length, body, data.weight);
  return manager.mkQuantifier({
    ...data,
    body,
    patterns: inferred.patterns,
    weight: inferred.weight,
  });
};

// Z3's Knuth-Bendix style order for propagate_values: values are smallest, then deeper terms are
// greater.
const isGreater = (manager: AstManager, left: number, right: number): boolean => {
  if (left === right) return false;
  const isLeftValue = manager.isUniqueValue(left);
  const isRightValue = manager.isUniqueValue(right);
  if (!isLeftValue && isRightValue) return true;
  if (isLeftValue && !isRightValue) return false;
  if (manager.depths[left] !== manager.depths[right])
    return manager.depths[left] > manager.depths[right];
  if (manager.kinds[left] !== KIND_APP || manager.kinds[right] !== KIND_APP) return false;
  if (manager.decls[left] !== manager.decls[right])
    return manager.decls[left] > manager.decls[right];
  const leftArgs = manager.args[left];
  const rightArgs = manager.args[right];
  if (leftArgs.length !== rightArgs.length) return leftArgs.length > rightArgs.length;
  for (let index = 0; index < leftArgs.length; index++)
    if (leftArgs[index] !== rightArgs[index])
      return isGreater(manager, leftArgs[index], rightArgs[index]);
  return false;
};

// expr_substitution under scoped_expr_substitution: the first entry for a key wins, and pop removes
// the entries since the matching push. The map and the trail hold their keys and values.
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
    const size = this.trailLims.pop() as number;
    for (const key of this.trail.items.slice(size)) {
      this.manager.decRef(this.map.get(key) as number);
      this.map.delete(key);
      this.manager.decRef(key);
    }
    this.trail.shrink(size);
  }

  // update_substitution: a ground equality is oriented by the order, and any other formula maps to
  // true, or its atom to false.
  update(expr: number) {
    const manager = this.manager;
    if (manager.isGround(expr) && manager.getOp(expr) === OP_EQ) {
      const left = manager.args[expr][0];
      const right = manager.args[expr][1];
      if (isGreater(manager, left, right)) {
        this.insert(left, right);
        return;
      }
      if (isGreater(manager, right, left)) {
        this.insert(right, left);
        return;
      }
    }
    if (manager.isNot(expr)) this.insert(manager.args[expr][0], manager.falseExpr);
    else this.insert(expr, manager.trueExpr);
  }
}

// asserted_formulas: the assertions of a context. Each assertion is rewritten when it is asserted,
// and reduce preprocesses the new ones. Their units and oriented equalities then rewrite the later
// assertions. Like Z3, it holds its formulas, so that expressions are deleted in Z3's order.
export class AssertedFormulas {
  private formulas: RefVector;
  private qhead = 0;
  private substitution: Substitution;
  private rewriter: Rewriter;
  private isEliminatingAnd = false;
  private isReducePending = true;
  private names: DefinedNames;
  private patternInference: PatternInference;

  constructor(private manager: AstManager) {
    this.formulas = new RefVector(manager);
    this.substitution = new Substitution(manager);
    this.rewriter = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: KERNEL_ARITH_OPTIONS,
      isRewritingPatterns: true,
    });
    this.names = new DefinedNames(manager);
    this.patternInference = new PatternInference(manager);
  }

  assertExpr(expr: number) {
    const manager = this.manager;
    if (manager.isTrue(expr)) return;
    this.setEliminateAnd(false);
    const rewritten = this.rewriter.rewrite(expr);
    pushAssertion(manager, rewritten, this.formulas);
    manager.decRef(rewritten);
    this.isReducePending = true;
  }

  getNumFormulas() {
    return this.formulas.size;
  }

  // reduce and commit: the new formulas after preprocessing, which the context internalizes.
  reduce() {
    if (this.qhead === this.formulas.size) return [];
    this.setEliminateAnd(false);
    this.propagateValues();
    this.isReducePending = true;
    this.nnfCnf();
    this.setEliminateAnd(true);
    this.reduceAsserted();
    const manager = this.manager;
    if (
      this.simplifyFormulas((formula) =>
        manager.withTemporaries(() => inferAllPatterns(manager, this.patternInference, formula)),
      )
    )
      this.isReducePending = true;
    this.reduceAsserted();
    this.isReducePending = true;
    this.flattenClauses();
    this.flushCache();
    const result = this.formulas.items.slice(this.qhead);
    for (const formula of result) this.substitution.update(formula);
    this.qhead = this.formulas.size;
    return result;
  }

  // flush_cache: the rewriter is reset, with the committed substitution.
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

  // swap_asserted_formulas: the new formulas replace those from qhead on.
  private swapFormulas(formulas: RefVector) {
    this.formulas.shrink(this.qhead);
    for (const formula of formulas.items) this.formulas.push(formula);
    formulas.reset();
  }

  // simplify_fmls: a formula that simplify changes is split again. simplify returns its result with
  // a reference. Whether a formula changed.
  private simplifyFormulas(simplify: (formula: number) => number) {
    const manager = this.manager;
    const formulas = new RefVector(manager);
    let isChanged = false;
    for (let index = this.qhead; index < this.formulas.size; index++) {
      const formula = this.formulas.items[index];
      const result = simplify(formula);
      if (result === formula) formulas.push(formula);
      else {
        pushAssertion(manager, result, formulas);
        isChanged = true;
      }
      manager.decRef(result);
    }
    this.swapFormulas(formulas);
    return isChanged;
  }

  // reduce_asserted_formulas: the rewriter rewrites the formulas, unless they are already in its
  // normal form.
  private reduceAsserted() {
    if (!this.isReducePending) return;
    this.simplifyFormulas((formula) => this.rewriter.rewrite(formula));
    this.isReducePending = false;
  }

  // asserted_formulas::propagate_values: a forward and a backward pass that rewrite each formula with
  // the committed substitution and the units of the formulas before it. Z3 stops after one round,
  // since the passes add no formula. When a formula changed, reduce-asserted rewrites them all.
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

  // asserted_formulas::nnf_cnf: one NNF object normalizes every formula, and the rewriter, which does
  // not eliminate and yet, rewrites each normal form and the definitions of the names it introduced.
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
        pushAssertion(manager, result, formulas);
      }
      manager.decRef(result);
    }
    this.swapFormulas(formulas);
    todo.reset();
    nnf.release();
  }

  // asserted_formulas::flatten_clauses: an ite at the top becomes two clauses, and a conjunction
  // that occurs in one binary clause is distributed.
  private flattenClauses() {
    const manager = this.manager;
    const mkNegation = (expr: number) =>
      manager.isNot(expr) ? manager.args[expr][0] : manager.mkApp(OP_NOT, [expr], SORT_BOOL);
    const isConjunction = (expr: number) =>
      manager.isNot(expr) && manager.getOp(manager.args[expr][0]) === OP_OR;
    for (let isChanged = true; isChanged;) {
      isChanged = false;
      const formulas = new RefVector(manager);
      const occurrences = new Map<number, number>();
      for (let index = this.qhead; index < this.formulas.size; index++) {
        const formula = this.formulas.items[index];
        if (manager.getOp(formula) !== OP_OR || manager.args[formula].length !== 2) continue;
        for (const arg of manager.args[formula])
          if (isConjunction(arg)) occurrences.set(arg, (occurrences.get(arg) ?? 0) + 1);
      }
      for (let index = this.qhead; index < this.formulas.size; index++) {
        const formula = this.formulas.items[index];
        if (manager.getOp(formula) === OP_OR && manager.args[formula].length === 2) {
          const args = manager.args[formula];
          const conjunctionIndex = [1, 0].find(
            (position) => isConjunction(args[position]) && occurrences.get(args[position]) === 1,
          );
          if (conjunctionIndex !== undefined) {
            const other = args[1 - conjunctionIndex];
            for (const arg of manager.args[manager.args[args[conjunctionIndex]][0]])
              formulas.push(manager.mkApp(OP_OR, [other, mkNegation(arg)], SORT_BOOL));
            isChanged = true;
            continue;
          }
        }
        if (manager.getOp(formula) === OP_ITE) {
          const args = manager.args[formula];
          formulas.push(manager.mkApp(OP_OR, [mkNegation(args[0]), args[1]], SORT_BOOL));
          formulas.push(manager.mkApp(OP_OR, [args[0], args[2]], SORT_BOOL));
          isChanged = true;
          continue;
        }
        formulas.push(formula);
      }
      this.swapFormulas(formulas);
    }
  }
}

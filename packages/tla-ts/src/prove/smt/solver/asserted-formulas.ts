// Ported from Z3 (src/solver/assertions/asserted_formulas.cpp), MIT license, see z3-license.txt. The
// preprocessing that the SMT kernel runs on its assertions before search.
import { AstManager, KIND_APP, OP_AND, OP_EQ, OP_ITE, OP_NOT, OP_OR } from "./ast";
import { mkNot } from "./ast-util";
import { toNnf } from "./nnf";
import { inferPatterns } from "./pattern-inference";
import { KERNEL_ARITH_OPTIONS } from "./arith-rewriter";
import { Rewriter } from "./rewriter";

// asserted_formulas::push_assertion: splits conjunctions and negated disjunctions.
const pushAssertion = (manager: AstManager, expr: number, result: number[]) => {
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

// simplify_fmls: a formula that the rewriter changes is split again.
const rewriteFormulas = (manager: AstManager, rewriter: Rewriter, formulas: number[]) => {
  const result: number[] = [];
  for (const formula of formulas) {
    const rewritten = rewriter.rewrite(formula);
    if (rewritten === formula) result.push(formula);
    else pushAssertion(manager, rewritten, result);
  }
  return result;
};

const inferAllPatterns = (manager: AstManager, expr: number): number => {
  if (!manager.hasQuantifierFlags[expr]) return expr;
  if (manager.kinds[expr] === KIND_APP)
    return manager.mkApp(
      manager.decls[expr],
      manager.args[expr].map((innerArg) => inferAllPatterns(manager, innerArg)),
      manager.sorts[expr],
    );
  const data = manager.getQuantifier(expr);
  const body = inferAllPatterns(manager, data.body);
  if (data.patterns.length > 0 || !data.isForall) return manager.mkQuantifier({ ...data, body });
  const inferred = inferPatterns(manager, data.sorts.length, body, data.weight);
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

// update_substitution: the first entry for a key wins, as in scoped_expr_substitution.
const updateSubstitution = (
  manager: AstManager,
  expr: number,
  substitution: Map<number, number>,
) => {
  const insert = (key: number, value: number) => {
    if (!substitution.has(key)) substitution.set(key, value);
  };
  if (manager.isGround(expr) && manager.getOp(expr) === OP_EQ) {
    const left = manager.args[expr][0];
    const right = manager.args[expr][1];
    if (isGreater(manager, left, right)) {
      insert(left, right);
      return;
    }
    if (isGreater(manager, right, left)) {
      insert(right, left);
      return;
    }
  }
  if (manager.isNot(expr)) insert(manager.args[expr][0], manager.falseExpr);
  else insert(expr, manager.trueExpr);
};

// asserted_formulas::propagate_values: a forward and a backward pass that rewrite each formula with
// the committed substitution and the units of the formulas before it. Z3 stops after one round,
// since the passes add no formula. When a formula changed, reduce-asserted rewrites them all.
const propagateValues = (
  manager: AstManager,
  rewriter: Rewriter,
  formulas: number[],
  committed: Map<number, number>,
) => {
  let isChanged = false;
  for (const isForward of [true, false]) {
    const substitution = new Map(committed);
    rewriter.setSubstitution(substitution);
    for (const step of formulas.keys()) {
      const index = isForward ? step : formulas.length - 1 - step;
      const rewritten = rewriter.rewrite(formulas[index]);
      if (rewritten !== formulas[index]) isChanged = true;
      formulas[index] = rewritten;
      updateSubstitution(manager, rewritten, substitution);
    }
  }
  rewriter.setSubstitution(committed);
  return isChanged ? rewriteFormulas(manager, rewriter, formulas) : formulas;
};

// asserted_formulas::flatten_clauses: an ite at the top becomes two clauses, and a conjunction
// that occurs in one binary clause is distributed.
const flattenClauses = (manager: AstManager, formulas: number[]) => {
  const isConjunction = (expr: number) =>
    manager.isNot(expr) && manager.getOp(manager.args[expr][0]) === OP_OR;
  let current = formulas;
  for (let isChanged = true; isChanged;) {
    isChanged = false;
    const occurrences = new Map<number, number>();
    for (const formula of current) {
      if (manager.getOp(formula) !== OP_OR || manager.args[formula].length !== 2) continue;
      for (const arg of manager.args[formula])
        if (isConjunction(arg)) occurrences.set(arg, (occurrences.get(arg) ?? 0) + 1);
    }
    const next: number[] = [];
    for (const formula of current) {
      if (manager.getOp(formula) === OP_OR && manager.args[formula].length === 2) {
        const args = manager.args[formula];
        const conjunctionIndex = [1, 0].find(
          (index) => isConjunction(args[index]) && occurrences.get(args[index]) === 1,
        );
        if (conjunctionIndex !== undefined) {
          const other = args[1 - conjunctionIndex];
          for (const arg of manager.args[manager.args[args[conjunctionIndex]][0]])
            next.push(manager.mkOr([other, mkNot(manager, arg)]));
          isChanged = true;
          continue;
        }
      }
      if (manager.getOp(formula) === OP_ITE) {
        const args = manager.args[formula];
        next.push(manager.mkOr([mkNot(manager, args[0]), args[1]]));
        next.push(manager.mkOr([args[0], args[2]]));
        isChanged = true;
        continue;
      }
      next.push(formula);
    }
    current = next;
  }
  return current;
};

// asserted_formulas: the assertions of a context. Each assertion is rewritten when it is asserted,
// and reduce preprocesses the new ones. Their units and oriented equalities then rewrite the later
// assertions.
export class AssertedFormulas {
  private formulas: number[] = [];
  private qhead = 0;
  private substitution = new Map<number, number>();
  private simplifier: Rewriter;
  private reducer: Rewriter;
  private names = new Map<number, number>();

  constructor(private manager: AstManager) {
    this.simplifier = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: KERNEL_ARITH_OPTIONS,
      isRewritingPatterns: true,
    });
    this.reducer = new Rewriter(manager, {
      isEliminatingAnd: true,
      arith: KERNEL_ARITH_OPTIONS,
      isRewritingPatterns: true,
    });
  }

  assertExpr(expr: number) {
    pushAssertion(this.manager, this.simplifier.rewrite(expr), this.formulas);
  }

  getNumFormulas() {
    return this.formulas.length;
  }

  // reduce and commit: the new formulas after preprocessing, which the context internalizes.
  reduce() {
    const manager = this.manager;
    const reducer = this.reducer;
    const pending = this.formulas.splice(this.qhead);
    if (pending.length === 0) return pending;
    const simplifier = this.simplifier;
    const propagated = propagateValues(manager, simplifier, pending, this.substitution);
    // nnf_cnf: the rewriter, which does not eliminate and yet, rewrites each normal form.
    const normalized: number[] = [];
    for (const formula of propagated)
      for (const normal of toNnf(manager, formula, this.names))
        pushAssertion(manager, simplifier.rewrite(normal), normalized);
    // set_eliminate_and flushes the rewriter's cache, so reduce-asserted rewrites every formula. It
    // runs again if pattern inference changed a formula.
    simplifier.reset();
    reducer.setSubstitution(this.substitution);
    const reduced = rewriteFormulas(manager, reducer, normalized);
    let isChanged = false;
    const inferred: number[] = [];
    for (const formula of reduced) {
      const result = inferAllPatterns(manager, formula);
      if (result === formula) inferred.push(formula);
      else {
        isChanged = true;
        pushAssertion(manager, result, inferred);
      }
    }
    const result = flattenClauses(
      manager,
      isChanged ? rewriteFormulas(manager, reducer, inferred) : inferred,
    );
    this.simplifier.setSubstitution(this.substitution);
    for (const formula of result) {
      this.formulas.push(formula);
      updateSubstitution(manager, formula, this.substitution);
    }
    this.qhead = this.formulas.length;
    return result;
  }
}

// Ported from Z3 (src/solver/assertions/asserted_formulas.cpp, src/tactic/smtlogics/
// quant_tactics.cpp, src/qe/lite/qe_lite_tactic.cpp), MIT license, see z3-license.txt.
// The preprocessing that Z3's ufnia tactic and the SMT kernel run before search.
import { AstManager, KIND_APP, KIND_QUANTIFIER, KIND_VAR, OP_AND, OP_EQ, OP_ITE, OP_NOT, OP_OR } from "./ast";
import { toNnf } from "./nnf";
import { inferPatterns } from "./pattern-inference";
import { collectUsedVars, Rewriter, shiftVars } from "./rewriter";

// asserted_formulas::push_assertion: splits conjunctions and negated disjunctions.
const pushAssertion = (manager: AstManager, rewriter: Rewriter, expr: number, result: number[]) => {
  if (manager.isTrue(expr)) return;
  const op = manager.getOp(expr);
  if (op === OP_AND) {
    for (const arg of manager.args[expr]) pushAssertion(manager, rewriter, arg, result);
    return;
  }
  if (op === OP_NOT && manager.getOp(manager.args[expr][0]) === OP_OR) {
    for (const arg of manager.args[manager.args[expr][0]])
      pushAssertion(manager, rewriter, rewriter.mkNot(arg), result);
    return;
  }
  result.push(expr);
};

const replaceVar = (manager: AstManager, expr: number, varIndex: number, replacement: number) => {
  const cache = new Map<number, number>();
  const visit = (current: number, shift: number): number => {
    if (manager.freeVarBounds[current] <= shift) return current;
    const key = current * 64 + shift;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    let result: number;
    const kind = manager.kinds[current];
    if (kind === KIND_VAR)
      result =
        manager.values[current] === varIndex + shift ? shiftVars(manager, replacement, shift) : current;
    else if (kind === KIND_APP)
      result = manager.mkApp(
        manager.decls[current],
        manager.args[current].map((innerArg) => visit(innerArg, shift)),
        manager.sorts[current],
      );
    else {
      const data = manager.getQuantifier(current);
      const innerShift = shift + data.sorts.length;
      result = manager.mkQuantifier({
        ...data,
        body: visit(data.body, innerShift),
        patterns: data.patterns.map((pattern) => pattern.map((innerTerm) => visit(innerTerm, innerShift))),
      });
    }
    cache.set(key, result);
    return result;
  };
  return visit(expr, 0);
};

// der.cpp: destructive equality resolution. (forall x. (or (not (= x t)) P)) becomes
// (forall x. P[t/x]) when x does not occur in t, and the rewriter drops x.
const applyDer = (manager: AstManager, rewriter: Rewriter, expr: number): number => {
  if (!manager.hasQuantifierFlags[expr]) return expr;
  if (manager.kinds[expr] === KIND_APP)
    return rewriter.mkAppCore(
      manager.decls[expr],
      manager.args[expr].map((innerArg) => applyDer(manager, rewriter, innerArg)),
      manager.sorts[expr],
    );
  if (manager.kinds[expr] !== KIND_QUANTIFIER) return expr;
  const data = manager.getQuantifier(expr);
  let body = applyDer(manager, rewriter, data.body);
  let patterns = data.patterns;
  const count = data.sorts.length;
  if (data.isForall) {
    for (let isChanged = true; isChanged; ) {
      isChanged = false;
      const literals = manager.getOp(body) === OP_OR ? manager.args[body] : [body];
      for (const literal of literals) {
        if (manager.getOp(literal) !== OP_NOT) continue;
        const atom = manager.args[literal][0];
        if (manager.getOp(atom) !== OP_EQ) continue;
        const sides = manager.args[atom];
        const pick = [0, 1].find((index) => {
          const side = sides[index];
          const other = sides[1 - index];
          if (manager.kinds[side] !== KIND_VAR || manager.values[side] >= count) return false;
          return !collectUsedVars(manager, other, count)[manager.values[side]];
        });
        if (pick === undefined) continue;
        const varIndex = manager.values[sides[pick]];
        const remaining = literals.filter((innerLiteral) => innerLiteral !== literal);
        body = rewriter.rewrite(replaceVar(manager, manager.mkOr(remaining), varIndex, sides[1 - pick]));
        patterns = patterns.filter((pattern) =>
          pattern.every((innerTerm) => !collectUsedVars(manager, innerTerm, count)[varIndex]),
        );
        isChanged = true;
        break;
      }
    }
  }
  return rewriter.rewrite(manager.mkQuantifier({ ...data, body, patterns }));
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
  return manager.mkQuantifier({ ...data, body, patterns: inferred.patterns, weight: inferred.weight });
};

// Z3's Knuth-Bendix style order for propagate_values: values are smallest, then deeper terms are
// greater.
const isGreater = (manager: AstManager, left: number, right: number): boolean => {
  if (left === right) return false;
  const isLeftValue = manager.isUniqueValue(left);
  const isRightValue = manager.isUniqueValue(right);
  if (!isLeftValue && isRightValue) return true;
  if (isLeftValue && !isRightValue) return false;
  if (manager.depths[left] !== manager.depths[right]) return manager.depths[left] > manager.depths[right];
  if (manager.kinds[left] !== KIND_APP || manager.kinds[right] !== KIND_APP) return false;
  if (manager.decls[left] !== manager.decls[right]) return manager.decls[left] > manager.decls[right];
  const leftArgs = manager.args[left];
  const rightArgs = manager.args[right];
  if (leftArgs.length !== rightArgs.length) return leftArgs.length > rightArgs.length;
  for (let index = 0; index < leftArgs.length; index++)
    if (leftArgs[index] !== rightArgs[index]) return isGreater(manager, leftArgs[index], rightArgs[index]);
  return false;
};

const rewriteWithSubstitution = (
  manager: AstManager,
  rewriter: Rewriter,
  expr: number,
  substitution: Map<number, number>,
) => {
  if (substitution.size === 0) return rewriter.rewrite(expr);
  const cache = new Map<number, number>();
  const visit = (current: number): number => {
    const cached = cache.get(current);
    if (cached !== undefined) return cached;
    const replacement = substitution.get(current);
    let result: number;
    if (replacement !== undefined) result = visit(replacement);
    else if (manager.kinds[current] === KIND_APP && manager.args[current].length > 0)
      result = rewriter.mkAppCore(
        manager.decls[current],
        manager.args[current].map(visit),
        manager.sorts[current],
      );
    else if (manager.kinds[current] === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(current);
      result = rewriter.rewrite(
        manager.mkQuantifier({
          ...data,
          body: visit(data.body),
          patterns: data.patterns.map((pattern) => pattern.map(visit)),
        }),
      );
    } else result = current;
    cache.set(current, result);
    return result;
  };
  return visit(expr);
};

const updateSubstitution = (manager: AstManager, expr: number, substitution: Map<number, number>) => {
  if (manager.isGround(expr) && manager.getOp(expr) === OP_EQ) {
    const left = manager.args[expr][0];
    const right = manager.args[expr][1];
    if (isGreater(manager, left, right)) {
      substitution.set(left, right);
      return;
    }
    if (isGreater(manager, right, left)) {
      substitution.set(right, left);
      return;
    }
  }
  if (manager.isNot(expr)) substitution.set(manager.args[expr][0], manager.falseExpr);
  else substitution.set(expr, manager.trueExpr);
};

// asserted_formulas::propagate_values: a forward and a backward pass that rewrite each formula with
// the units of the other formulas.
const propagateValues = (manager: AstManager, rewriter: Rewriter, formulas: number[]) => {
  let current = formulas;
  for (let round = 0; round < 4; round++) {
    let changes = 0;
    for (const isForward of [true, false]) {
      const substitution = new Map<number, number>();
      const order = current.map((_formula, index) => (isForward ? index : current.length - 1 - index));
      for (const index of order) {
        const rewritten = rewriteWithSubstitution(manager, rewriter, current[index], substitution);
        if (rewritten !== current[index]) changes++;
        current[index] = rewritten;
        updateSubstitution(manager, rewritten, substitution);
      }
    }
    const split: number[] = [];
    for (const formula of current) pushAssertion(manager, rewriter, formula, split);
    current = split;
    if (changes <= current.length / 20) break;
  }
  return current;
};

// asserted_formulas::flatten_clauses: an ite at the top becomes two clauses, and a conjunction
// that occurs in one binary clause is distributed.
const flattenClauses = (manager: AstManager, rewriter: Rewriter, formulas: number[]) => {
  const isConjunction = (expr: number) =>
    manager.isNot(expr) && manager.getOp(manager.args[expr][0]) === OP_OR;
  let current = formulas;
  for (let isChanged = true; isChanged; ) {
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
            next.push(manager.mkOr([other, rewriter.mkNot(arg)]));
          isChanged = true;
          continue;
        }
      }
      if (manager.getOp(formula) === OP_ITE) {
        const args = manager.args[formula];
        next.push(manager.mkOr([rewriter.mkNot(args[0]), args[1]]));
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

export const preprocess = (manager: AstManager, assertions: number[]) => {
  const simplifier = new Rewriter(manager, { isEliminatingAnd: false });
  const reducer = new Rewriter(manager, { isEliminatingAnd: true });
  const initial: number[] = [];
  for (const assertion of assertions) {
    const simplified = applyDer(manager, simplifier, simplifier.rewrite(assertion));
    pushAssertion(manager, simplifier, simplified, initial);
  }
  const propagated = propagateValues(manager, simplifier, initial);
  const normalized: number[] = [];
  for (const formula of propagated) {
    const reduced = applyDer(manager, reducer, reducer.rewrite(toNnf(manager, formula)));
    pushAssertion(manager, reducer, reducer.rewrite(inferAllPatterns(manager, reduced)), normalized);
  }
  return flattenClauses(manager, reducer, normalized);
};

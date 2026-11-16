// Ported from Z3 (src/tactic/core/cofactor_elim_term_ite.cpp,
// src/tactic/core/cofactor_term_ite_tactic.h), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_DATATYPE,
  FAMILY_FPA,
  KIND_APP,
  OP_DISTINCT,
  OP_EQ,
  OP_ITE,
  OP_NOT,
  SORT_BOOL,
} from "./ast";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

const SIMPLIFIED_FAMILIES = [
  FAMILY_BASIC,
  FAMILY_ARITH,
  FAMILY_BV,
  FAMILY_ARRAY,
  FAMILY_DATATYPE,
  FAMILY_FPA,
];

// Rewrites with mk_simplified_app, which has the theory rewriters but none of th_rewriter's
// extras, and substitutes the cofactor atom by true or false.
class CofactorRewriter extends RewriterTpl {
  private atom = -1;
  private isNegated = false;
  private term = -1;
  private value = -1;

  constructor(
    manager: AstManager,
    private simplifier: Rewriter,
    private isCofactoringEqualities: boolean,
  ) {
    super(manager);
  }

  isRewritingPatterns() {
    return false;
  }

  setCofactorAtom(expr: number) {
    const manager = this.manager;
    this.term = -1;
    if (manager.isNot(expr)) {
      this.atom = manager.getArg(expr, 0);
      this.isNegated = true;
    } else {
      this.atom = expr;
      this.isNegated = false;
      if (this.isCofactoringEqualities && manager.getOp(expr) === OP_EQ) {
        const lhs = manager.getArg(expr, 0);
        const rhs = manager.getArg(expr, 1);
        if (manager.isUniqueValue(lhs)) {
          this.term = rhs;
          this.value = lhs;
        } else if (manager.isUniqueValue(rhs)) {
          this.term = lhs;
          this.value = rhs;
        }
      }
    }
    this.reset();
  }

  getSubst(expr: number) {
    const manager = this.manager;
    if (expr === this.atom) return this.isNegated ? manager.falseExpr : manager.trueExpr;
    if (expr === this.term && this.value !== -1) return this.value;
    return undefined;
  }

  reduceApp(decl: number, args: number[], _sort: number) {
    const manager = this.manager;
    if (!SIMPLIFIED_FAMILIES.includes(manager.funcDecls[decl].family)) return -1;
    const outer = manager.beginTemporaries();
    const result = this.simplifier.reduceAppCore(decl, args);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }
}

class CofactorElimTermIte {
  private cache = new Map<number, number>();
  private cacheDomain: RefVector;
  private hasTermIte = new Set<number>();
  private simplifier: Rewriter;
  private cofactorRewriter: CofactorRewriter;

  constructor(
    private manager: AstManager,
    options: RewriterOptions,
    isCofactoringEqualities: boolean,
  ) {
    this.cacheDomain = new RefVector(manager);
    this.simplifier = new Rewriter(manager, options);
    this.cofactorRewriter = new CofactorRewriter(manager, this.simplifier, isCofactoringEqualities);
  }

  private isTermIte(expr: number) {
    const manager = this.manager;
    return (
      manager.kinds[expr] === KIND_APP &&
      manager.getOp(expr) === OP_ITE &&
      manager.sorts[expr] !== SORT_BOOL
    );
  }

  // The term if-then-else condition of least depth, then most occurrences, preferring equalities.
  private getBest(expr: number) {
    const manager = this.manager;
    const occs = new ObjMap<number>((key) => manager.hashes[key]);
    const visited = new Set<number>();
    const todo = [expr];
    for (let curr = todo.pop(); curr !== undefined; curr = todo.pop()) {
      if (manager.kinds[curr] !== KIND_APP) continue;
      const args = manager.getArgs(curr);
      if (this.isTermIte(curr)) occs.set(args[0], (occs.get(args[0]) ?? 0) + 1);
      for (let index = args.length - 1; index >= 0; index--) {
        const arg = args[index];
        if (visited.has(arg)) continue;
        visited.add(arg);
        if (manager.kinds[arg] === KIND_APP && manager.getNumArgs(arg) > 0) todo.push(arg);
      }
    }
    let best = -1;
    let bestOccs = 0;
    for (const [key, value] of occs) {
      const depth = manager.depths[key];
      const bestDepth = best === -1 ? 0 : manager.depths[best];
      if (
        best === -1 ||
        depth < bestDepth ||
        (depth === bestDepth && value > bestOccs) ||
        (depth === bestDepth &&
          value === bestOccs &&
          manager.getOp(key) === OP_EQ &&
          manager.getOp(best) !== OP_EQ)
      ) {
        best = key;
        bestOccs = value;
      }
    }
    return best;
  }

  private cofactor(expr: number) {
    const manager = this.manager;
    const rewriter = this.cofactorRewriter;
    const trail = new RefVector(manager);
    let curr = expr;
    for (let condition = this.getBest(curr); condition !== -1; condition = this.getBest(curr)) {
      rewriter.setCofactorAtom(condition);
      const positive = rewriter.rewrite(curr);
      trail.pushOwned(positive);
      const negatedCondition = manager.isNot(condition)
        ? manager.getArg(condition, 0)
        : manager.mkApp(OP_NOT, [condition], SORT_BOOL);
      trail.push(negatedCondition);
      rewriter.setCofactorAtom(negatedCondition);
      const negative = rewriter.rewrite(curr);
      trail.pushOwned(negative);
      curr =
        positive === negative
          ? positive
          : manager.isTrue(positive) && manager.isFalse(negative)
            ? condition
            : manager.isFalse(positive) && manager.isTrue(negative)
              ? negatedCondition
              : manager.mkApp(OP_ITE, [condition, positive, negative], SORT_BOOL);
      trail.push(curr);
    }
    manager.incRef(curr);
    trail.reset();
    return curr;
  }

  private isAtom(expr: number) {
    const manager = this.manager;
    if (manager.sorts[expr] !== SORT_BOOL || manager.kinds[expr] !== KIND_APP) return false;
    const op = manager.getOp(expr);
    return (
      manager.getFamily(expr) !== FAMILY_BASIC ||
      ((op === OP_EQ || op === OP_DISTINCT) && manager.sorts[manager.getArg(expr, 0)] !== SORT_BOOL)
    );
  }

  // The result comes with a reference, which the caller releases.
  apply(root: number) {
    const manager = this.manager;
    const frames = [{ expr: root, isFirst: true }];
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const expr = frame.expr;
      if (manager.kinds[expr] !== KIND_APP) {
        this.cache.set(expr, expr);
        frames.pop();
        continue;
      }
      if (this.cache.has(expr)) {
        frames.pop();
        continue;
      }
      const args = manager.getArgs(expr);
      if (frame.isFirst) {
        frame.isFirst = false;
        let isVisited = true;
        for (let index = args.length - 1; index >= 0; index--)
          if (!this.cache.has(args[index])) {
            frames.push({ expr: args[index], isFirst: true });
            isVisited = false;
          }
        if (!isVisited) continue;
      }
      const newArgs = args.map((arg) => this.cache.get(arg) as number);
      const hasNewArgs = newArgs.some((newArg, index) => newArg !== args[index]);
      let hasTermIte =
        newArgs.some((newArg) => this.hasTermIte.has(newArg)) || this.isTermIte(expr);
      let newExpr = hasNewArgs
        ? manager.mkApp(manager.decls[expr], newArgs, manager.sorts[expr])
        : expr;
      manager.incRef(newExpr);
      if (hasTermIte && this.isAtom(newExpr)) {
        this.hasTermIte.add(newExpr);
        const cofactored = this.cofactor(newExpr);
        this.hasTermIte.delete(newExpr);
        manager.decRef(newExpr);
        newExpr = cofactored;
        hasTermIte = false;
      }
      if (hasTermIte) this.hasTermIte.add(newExpr);
      this.cache.set(expr, newExpr);
      this.cacheDomain.pushOwned(newExpr);
      frames.pop();
    }
    const result = this.cache.get(root) as number;
    manager.incRef(result);
    return result;
  }

  release() {
    this.cofactorRewriter.release();
    this.simplifier.release();
    this.cacheDomain.reset();
  }
}

export const cofactorTermIte = (
  manager: AstManager,
  goal: Goal,
  options: RewriterOptions,
  isCofactoringEqualities: boolean,
) => {
  if (!goal.isProofsEnabled) {
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const eliminator = new CofactorElimTermIte(manager, options, isCofactoringEqualities);
      const form = goal.forms.items[index];
      const result = eliminator.apply(form);
      if (result !== form) goal.update(index, result);
      manager.decRef(result);
      eliminator.release();
    }
  }
  goal.elimTrue();
  goal.elimRedundancies();
  goal.depth++;
};

// Ported from Z3 (src/qe/lite/qe_lite_tactic.cpp, src/qe/mbp/mbp_solve_plugin.cpp), MIT license, see
// z3-license.txt. The qe-lite tactic of Z3's ufnia strategy: each quantifier, innermost first, loses
// the variables that its body defines by an equality, Fourier-Motzkin elimination removes integer
// variables that only occur in bounds, and a quantifier over a small integer range becomes a finite
// disjunction. Like Z3, the port counts references, so that expressions are created and deleted in
// Z3's order. Arrays, bit-vectors and datatypes are not ported, as tlapm's encoding does not produce
// them.
import {
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_NOT,
  OP_OR,
  SORT_BOOL,
  SORT_INT,
  type AstManager,
} from "./ast";
import { flattenAndVector, flattenOrVector, pushNotOwned } from "./ast-util";
import { isOccurring } from "./der";
import { ExprSafeReplace } from "./expr-safe-replace";
import type { Goal } from "./goal";
import { ObjHashtable } from "./hashtable";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { InvVarShifter, RewriterTpl } from "./rewriter-tpl";
import { collectUsedVars, VarSubst } from "./var-subst";
import { assign, assignOwned, release } from "./expr-ref";
import { EqDer } from "./qe-lite-der";
import { Fm } from "./qe-lite-fm";

// qe_lite's EXPAND_BOUND_LIMIT: the largest integer range that is expanded.
const EXPAND_BOUND_LIMIT = 10000;

// rewriter_tpl with elim_cfg: rewrites the quantifiers bottom-up.
class ElimStar extends RewriterTpl {
  constructor(
    manager: AstManager,
    private reduce: (expr: number, body: number, patterns: number[]) => number,
  ) {
    super(manager);
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    return this.reduce(expr, body, patterns);
  }
}

// qe_lite::impl.
class QeLite {
  private der: EqDer;
  private fm: Fm;
  private elimStar: ElimStar;
  private rewriter: Rewriter;

  constructor(private manager: AstManager) {
    this.der = new EqDer(manager);
    this.fm = new Fm(manager);
    this.elimStar = new ElimStar(manager, (expr, body, patterns) =>
      this.reduceQuantifier(expr, body, patterns),
    );
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  }

  // operator()(expr_ref&): the result comes with a reference, which the caller releases.
  apply(formula: number) {
    return this.elimStar.rewrite(formula);
  }

  // ~impl.
  release() {
    this.rewriter.release();
    this.elimStar.release();
    this.fm.release();
    this.der.release();
  }

  // bool_rewriter's mk_and and mk_or, with a reference to the result.
  private mkAnd(args: number[]) {
    return this.manager.withTemporaries(() => this.rewriter.mkAnd(args));
  }

  private mkOr(args: number[]) {
    return this.manager.withTemporaries(() => this.rewriter.mkOr(args));
  }

  // elim_cfg::reduce_quantifier.
  private reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    let result = assign(manager, -1, body);
    if (data.isForall) result = assign(manager, result, manager.mkApp(OP_NOT, [result], SORT_BOOL));
    result = this.reduceFormula(data.sorts.length, result);
    result = this.eliminateDiseqVars(data.sorts, result);
    let expanded = this.tryExpandBoundedQuantifier(data.sorts, result);
    if (expanded !== -1) {
      if (data.isForall) expanded = assignOwned(manager, expanded, pushNotOwned(manager, expanded));
      result = assignOwned(manager, result, this.rewriter.rewrite(expanded));
      manager.decRef(expanded);
      return result;
    }
    if (data.isForall) result = assignOwned(manager, result, pushNotOwned(manager, result));
    const updated = assign(manager, -1, manager.mkQuantifier({ ...data, body: result, patterns }));
    result = assignOwned(manager, result, this.rewriter.rewrite(updated));
    manager.decRef(updated);
    return result;
  }

  // operator()(index_set, index_of_bound, expr_ref&): each disjunct is a conjunction to reduce. The
  // formula comes with a reference, and so does the result.
  private reduceFormula(numVars: number, formula: number) {
    const manager = this.manager;
    const disjs = new RefVector(manager);
    const conjs = new RefVector(manager);
    disjs.push(formula);
    flattenOrVector(manager, disjs);
    let result = formula;
    const size = disjs.size;
    for (let index = 0; index < size; index++) {
      conjs.reset();
      conjs.push(disjs.items[index]);
      this.reduceConjs(numVars, conjs);
      result = assignOwned(manager, result, this.mkAnd(conjs.items));
      disjs.setOwned(index, result);
      result = -1;
    }
    result = assignOwned(manager, result, this.mkOr(disjs.items));
    conjs.reset();
    disjs.reset();
    return result;
  }

  // operator()(index_set, index_of_bound, expr_ref_vector&): a single non-ground conjunct is reduced
  // as a disjunction, and otherwise eq_der and fm run.
  private reduceConjs(numVars: number, fmls: RefVector) {
    const manager = this.manager;
    flattenAndVector(manager, fmls);
    const nonGround = fmls.items.flatMap((fml, index) => (manager.isGroundApp(fml) ? [] : [index]));
    if (fmls.size > 1 && nonGround.length === 1) {
      const index = nonGround[0];
      const reduced = this.reduceFormula(numVars, assign(manager, -1, fmls.items[index]));
      fmls.set(index, reduced);
      manager.decRef(reduced);
      return;
    }
    this.der.numVars = numVars;
    this.fm.numVars = numVars;
    this.der.apply(fmls);
    this.fm.apply(fmls);
    // ar_der checks the limit for each formula. tlapm's formulas have no arrays for it to solve.
    for (let index = 0; index < fmls.size; index++) manager.limit.checkpoint();
  }

  // collect_negative_equalities: whether every occurrence of the variable is in a negative equality
  // with a term without it, or outside any equality.
  private collectNegativeEqualities(
    expr: number,
    index: number,
    isPositive: boolean,
    equalities: ObjHashtable,
  ): boolean {
    const manager = this.manager;
    if (manager.isGroundApp(expr)) return true;
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR) return manager.values[expr] !== index;
    if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      return !isOccurring(manager, index + data.sorts.length, data.body);
    }
    const op = manager.getOp(expr);
    const args = manager.args[expr];
    if (manager.isNot(expr))
      return this.collectNegativeEqualities(args[0], index, !isPositive, equalities);
    if (op === OP_AND || op === OP_OR)
      return args.every((arg) =>
        this.collectNegativeEqualities(arg, index, isPositive, equalities),
      );
    if (op === OP_EQ) {
      const isVarAt = (term: number) =>
        manager.kinds[term] === KIND_VAR && manager.values[term] === index;
      const isLeftVar = isVarAt(args[0]);
      if (isLeftVar !== isVarAt(args[1])) {
        const value = isLeftVar ? args[1] : args[0];
        if (!isPositive && !isOccurring(manager, index, value)) {
          equalities.add(expr);
          return true;
        }
      }
    }
    return !isOccurring(manager, index, expr);
  }

  // eliminate_diseq_vars: an integer variable that occurs only in negative equalities can avoid
  // every value they name, so those equalities are false. The body comes with a reference, and so
  // does the result.
  private eliminateDiseqVars(sorts: number[], body: number) {
    const manager = this.manager;
    const replace = new ExprSafeReplace(manager);
    let isChanged = false;
    for (let index = 0; index < sorts.length; index++) {
      const equalities = new ObjHashtable((key) => manager.hashes[key]);
      if (
        this.collectNegativeEqualities(body, index, true, equalities) &&
        equalities.size > 0 &&
        sorts[sorts.length - index - 1] === SORT_INT
      ) {
        for (const equality of equalities) replace.insert(equality, manager.falseExpr);
        isChanged = true;
      }
    }
    if (!isChanged) {
      replace.release();
      return body;
    }
    const replaced = replace.apply(body);
    const result = assignOwned(manager, body, this.rewriter.rewrite(replaced));
    manager.decRef(replaced);
    replace.release();
    return result;
  }

  // extract_var_bound: an inclusive integer bound of the variable that a conjunct states.
  private getBound(expr: number, index: number) {
    const manager = this.manager;
    const isNegated = manager.isNot(expr);
    const atom = isNegated ? manager.args[expr][0] : expr;
    const op = manager.getOp(atom);
    if (op !== OP_LE && op !== OP_GE && op !== OP_LT && op !== OP_GT) return undefined;
    const isSwapped = op === OP_GE || op === OP_GT;
    const isStrict = op === OP_LT || op === OP_GT;
    const lhs = manager.args[atom][isSwapped ? 1 : 0];
    const rhs = manager.args[atom][isSwapped ? 0 : 1];
    if (manager.sorts[lhs] !== SORT_INT) return undefined;
    const isIndex = (term: number) =>
      manager.kinds[term] === KIND_VAR && manager.values[term] === index;
    const isVarOnLeft = isIndex(lhs) && manager.isNumeral(rhs);
    if (!isVarOnLeft && !(isIndex(rhs) && manager.isNumeral(lhs))) return undefined;
    const numeral = manager.getNumeralValue(isVarOnLeft ? rhs : lhs);
    const value = isVarOnLeft
      ? isStrict
        ? numeral - 1n
        : numeral
      : isStrict
        ? numeral + 1n
        : numeral;
    if (!isNegated) return { isLower: !isVarOnLeft, value };
    return { isLower: isVarOnLeft, value: isVarOnLeft ? value + 1n : value - 1n };
  }

  // try_expand_bounded_quantifier: the disjunction of the body over every value of the integer
  // variables when their ranges are small, with a reference, or -1.
  private tryExpandBoundedQuantifier(sorts: number[], body: number) {
    const manager = this.manager;
    const numDecls = sorts.length;
    if (numDecls === 0) return -1;
    const used = collectUsedVars(manager, body, numDecls);
    const remaining = used.flatMap((isUsed, index) => (isUsed ? [index] : []));
    if (remaining.length === 0) return -1;
    // Z3 checks the declaration at position i for the variable with de Bruijn index i, which is
    // another variable's sort. This port checks the variable's own sort.
    if (remaining.some((index) => sorts[numDecls - 1 - index] !== SORT_INT)) return -1;
    const conjs = new RefVector(manager);
    conjs.push(body);
    flattenAndVector(manager, conjs);
    const lowers: (bigint | undefined)[] = [];
    const uppers: (bigint | undefined)[] = [];
    const isBoundConj = conjs.items.map((conj) => {
      let isBound = false;
      for (const index of remaining) {
        const bound = this.getBound(conj, index);
        if (bound === undefined) continue;
        const bounds = bound.isLower ? lowers : uppers;
        const old = bounds[index];
        if (old === undefined || (bound.isLower ? bound.value > old : bound.value < old))
          bounds[index] = bound.value;
        isBound = true;
      }
      return isBound;
    });
    let domainSize = 1n;
    for (const index of remaining) {
      const lower = lowers[index];
      const upper = uppers[index];
      if (lower === undefined || upper === undefined) {
        conjs.reset();
        return -1;
      }
      const size = upper - lower + 1n;
      if (size <= 0n) {
        conjs.reset();
        return assign(manager, -1, manager.falseExpr);
      }
      domainSize *= size;
      if (domainSize > EXPAND_BOUND_LIMIT) {
        conjs.reset();
        return -1;
      }
    }
    const payload = new RefVector(manager);
    conjs.items.forEach((conj, position) => {
      if (!isBoundConj[position]) payload.push(conj);
    });
    const substMap = new RefVector(manager);
    substMap.resize(numDecls);
    // Like Z3, an unused variable keeps the sort of the declaration at its index.
    for (let index = 0; index < numDecls; index++)
      if (!used[index]) substMap.set(index, manager.mkVar(index, sorts[index]));
    const values = remaining.map((index) => lowers[index] ?? 0n);
    const subst = new VarSubst(manager, false);
    const shifter = new InvVarShifter(manager);
    const disjuncts = new RefVector(manager);
    for (;;) {
      remaining.forEach((index, position) => {
        substMap.set(index, manager.mkNumeral(values[position]));
      });
      const instConjs = new RefVector(manager);
      for (const conj of payload.items) {
        let instance = subst.apply(conj, substMap.items);
        instance = assignOwned(manager, instance, shifter.shift(instance, numDecls));
        instConjs.push(instance);
        manager.decRef(instance);
      }
      const instBody = this.mkAnd(instConjs.items);
      disjuncts.push(instBody);
      manager.decRef(instBody);
      instConjs.reset();
      // The rightmost variable moves first.
      let position = remaining.length - 1;
      for (; position >= 0; position--) {
        values[position]++;
        if (values[position] <= (uppers[remaining[position]] ?? 0n)) break;
        values[position] = lowers[remaining[position]] ?? 0n;
      }
      if (position < 0) break;
    }
    const result = this.mkOr(disjuncts.items);
    disjuncts.reset();
    shifter.release();
    subst.release();
    substMap.reset();
    payload.reset();
    conjs.reset();
    return result;
  }
}

// qe_lite_simplifier::reduce in a dependent_expr_state_tactic, on each formula with a quantifier.
// The tactic's m_dep holds the formula it read last, until the tactic is done.
export const applyQeLite = (manager: AstManager, goal: Goal) => {
  const qe = new QeLite(manager);
  let dep = -1;
  for (const form of goal.forms.items) dep = assign(manager, dep, form);
  if (goal.forms.items.some((form) => manager.hasQuantifierFlags[form])) {
    let formula = -1;
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const form = goal.forms.items[index];
      dep = assign(manager, dep, form);
      if (manager.hasQuantifierFlags[form]) {
        formula = assign(manager, formula, form);
        formula = assignOwned(manager, formula, qe.apply(formula));
        if (formula !== form) goal.update(index, formula);
      }
      // The iterator of the simplifier's indices counts a step after each formula.
      manager.limit.checkpoint();
    }
    release(manager, formula);
  }
  goal.elimTrue();
  goal.elimRedundancies();
  qe.release();
  release(manager, dep);
};

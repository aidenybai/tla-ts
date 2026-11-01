// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp), MIT license, see
// z3-license.txt. The axioms of theory_lra: those of div, mod, to_int and is_int, and the
// arith_eq_adapter axioms that tie an equality of terms to their two inequalities.
import { SmtInvariantError } from "../../../errors";
import {
  OP_ADD,
  OP_DIV,
  OP_GE,
  OP_IDIV,
  OP_IS_INT,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Enode } from "./enode";
import { FALSE_LITERAL, getVar, isNegated, Literal, negate, TRUE_LITERAL } from "./literal";
import { Rational } from "./rational";
import { TheoryLraState } from "./theory-lra-state";

export abstract class TheoryLraAxioms extends TheoryLraState {
  private processedEqs = new Set<string>();

  // m_restart_pairs: equalities whose axioms a backjump to the base level drops, remade on restart.
  protected restartPairs: Enode[][] = [];

  // The enode of a term, internalized first if it has none.
  protected getInternalizedEnode(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    const node = context.getEnode(expr);
    if (node === undefined) throw new SmtInvariantError("the term was not internalized");
    return node;
  }

  protected isZeroNumeral(expr: number) {
    return this.manager.isNumeral(expr) && this.manager.getRationalValue(expr).isZero();
  }

  protected mkEqAxioms(inputFirst: Enode, inputSecond: Enode) {
    if (inputFirst === inputSecond) return;
    const context = this.context;
    const manager = this.manager;
    const isSwapped = manager.ids[inputFirst.owner] > manager.ids[inputSecond.owner];
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    let t1 = first.owner;
    let t2 = second.owner;
    if (manager.isNumeral(t1) && manager.isNumeral(t2)) return;
    const key = `${t1}:${t2}`;
    if (this.processedEqs.has(key)) return;
    this.processedEqs.add(key);
    context.pushTrail(() => this.processedEqs.delete(key));
    const eq = context.mkEqAtom(t1, t2);
    if (manager.isNumeral(t1)) {
      const saved = t1;
      t1 = t2;
      t2 = saved;
    }
    const sort = manager.sorts[t1];
    let le: number;
    let ge: number;
    if (manager.isNumeral(t2)) {
      le = manager.mkApp(OP_LE, [t1, t2], SORT_BOOL);
      ge = manager.mkApp(OP_GE, [t1, t2], SORT_BOOL);
    } else {
      const minusOne = manager.mkNumeralOfSort(Rational.minusOne, sort);
      const zero = manager.mkNumeralOfSort(Rational.zero, sort);
      const difference = manager.mkApp(
        OP_ADD,
        [t1, manager.mkApp(OP_MUL, [minusOne, t2], sort)],
        sort,
      );
      le = manager.mkApp(OP_LE, [difference, zero], SORT_BOOL);
      ge = manager.mkApp(OP_GE, [difference, zero], SORT_BOOL);
    }
    context.internalize(eq, true);
    context.internalize(le, true);
    context.internalize(ge, true);
    const eqLiteral = context.getLiteral(eq);
    const leLiteral = context.getLiteral(le);
    const geLiteral = context.getLiteral(ge);
    if (context.isTrueFirst(getVar(eqLiteral))) {
      context.setTrueFirstFlag(getVar(leLiteral));
      context.setTrueFirstFlag(getVar(geLiteral));
    }
    context.mkThAxiom([negate(eqLiteral), leLiteral]);
    context.mkThAxiom([negate(eqLiteral), geLiteral]);
    context.mkThAxiom([eqLiteral, negate(leLiteral), negate(geLiteral)]);
    const handler = () => {
      if (!context.isRelevant(first.owner) || !context.isRelevant(second.owner)) return;
      context.relevancy.markAsRelevant(eq);
      context.relevancy.markAsRelevant(le);
      context.relevancy.markAsRelevant(ge);
    };
    context.relevancy.addHandler(first.owner, handler);
    context.relevancy.addHandler(second.owner, handler);
    if (
      context.scopeLevel !== context.baseLevel &&
      first.iscopeLevel <= context.baseLevel &&
      second.iscopeLevel <= context.baseLevel
    )
      this.restartPairs.push([first, second]);
  }

  internalizeEqEh(expr: number) {
    const context = this.context;
    const args = this.manager.args[expr];
    const first = context.getEnode(args[0]);
    const second = context.getEnode(args[1]);
    if (first === undefined || second === undefined) return;
    if (first.thVar >= 0 && second.thVar >= 0 && first !== second) this.mkEqAxioms(first, second);
  }

  newEqEh(first: number, second: number) {
    this.mkEqAxioms(this.getEnode(first), this.getEnode(second));
  }

  newDiseqEh(first: number, second: number) {
    this.mkEqAxioms(this.getEnode(first), this.getEnode(second));
  }

  relevantEh(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    const args = manager.args[expr];
    if (op === OP_DIV) this.mkDivAxiom(args[0], args[1]);
    else if (op === OP_TO_INT) this.mkToIntAxiom(expr);
    else if (op === OP_IS_INT) this.mkIsIntAxiom(expr);
    else if (op === OP_MOD) this.mkIdivModAxioms(args[0], args[1]);
  }

  // mk_literal.
  protected mkLiteral(atom: number) {
    const context = this.context;
    if (!context.isEInternalized(atom)) context.internalize(atom, false);
    return context.getLiteral(atom);
  }

  // ensure_enode: the relevant enode of a term.
  private ensureEnode(expr: number) {
    const node = this.getInternalizedEnode(expr);
    this.context.markAsRelevant(expr);
    return node;
  }

  // mk_axiom: a theory axiom whose literals are relevant. Of two literals, the second becomes
  // relevant only once the first is false. A unit axiom is the clause of false and the literal, so
  // mk_clause drops false and the literal is justified by unit resolution with true, which lemma
  // minimization can see through, rather than by an axiom.
  protected mkAxiom(literals: Literal[]) {
    const context = this.context;
    // mkThAxiom simplifies the literals it is given, which this reads after.
    context.mkThAxiom(
      literals.length === 1 ? [context.falseLiteral, literals[0]] : literals.slice(),
    );
    if (!context.relevancy.isEnabled) return;
    if (literals.length !== 2) {
      for (const literal of literals) context.markLiteralAsRelevant(literal);
      return;
    }
    context.markLiteralAsRelevant(literals[0]);
    const consequent = context.boolVar2Expr[getVar(literals[1])];
    context.relevancy.addWatch(
      context.boolVar2Expr[getVar(literals[0])],
      isNegated(literals[0]),
      // simple_relevancy_eh marks the consequent without propagating.
      () => context.relevancy.markAsRelevant(consequent),
    );
  }

  // mk_div_axiom: q = 0 or q * (p / q) = p.
  private mkDivAxiom(dividend: number, divisor: number) {
    const manager = this.manager;
    if (this.isZeroNumeral(divisor)) return;
    const isZero = this.mkEq(divisor, manager.mkRealNumeral(Rational.zero));
    const product = manager.mkApp(
      OP_MUL,
      [divisor, manager.mkApp(OP_DIV, [dividend, divisor], SORT_REAL)],
      SORT_REAL,
    );
    this.mkAxiom([isZero, this.mkEq(product, dividend)]);
  }

  // mk_to_int_axiom: to_int (to_real x) = x, and to_real (to_int x) <= x < to_real (to_int x) + 1.
  private mkToIntAxiom(term: number) {
    const manager = this.manager;
    const arg = manager.args[term][0];
    if (manager.getOp(arg) === OP_TO_REAL) {
      this.mkAxiom([this.mkEq(manager.args[arg][0], term)]);
      return;
    }
    const toReal = manager.mkApp(OP_TO_REAL, [term], SORT_REAL);
    const lower = manager.mkApp(
      OP_LE,
      [manager.mkApp(OP_SUB, [toReal, arg], SORT_REAL), manager.mkRealNumeral(Rational.zero)],
      SORT_BOOL,
    );
    const upper = manager.mkApp(
      OP_GE,
      [manager.mkApp(OP_SUB, [arg, toReal], SORT_REAL), manager.mkRealNumeral(Rational.one)],
      SORT_BOOL,
    );
    const lowerLiteral = this.mkLiteral(lower);
    const upperLiteral = this.mkLiteral(upper);
    this.mkAxiom([lowerLiteral]);
    this.mkAxiom([negate(upperLiteral)]);
  }

  // mk_is_int_axiom: is_int x if and only if to_real (to_int x) = x.
  protected mkIsIntAxiom(atom: number) {
    const manager = this.manager;
    const arg = manager.args[atom][0];
    const eq = this.mkEq(
      manager.mkApp(OP_TO_REAL, [manager.mkApp(OP_TO_INT, [arg], SORT_INT)], SORT_REAL),
      arg,
    );
    const isInt = this.context.getLiteral(atom);
    this.mkAxiom([negate(isInt), eq]);
    this.mkAxiom([isInt, negate(eq)]);
  }

  // theory::mk_eq: the literal of an equality between two terms, internalized.
  protected mkEq(first: number, second: number) {
    const manager = this.manager;
    if (first === second) return TRUE_LITERAL;
    if (manager.isUniqueValue(first) && manager.isUniqueValue(second)) return FALSE_LITERAL;
    const atom = this.context.mkEqAtom(first, second);
    this.context.internalize(atom, false);
    return this.context.getLiteral(atom);
  }

  // mk_idiv_mod_axioms: q * (div p q) + (mod p q) = p and 0 <= (mod p q) < |q| when q is not 0.
  protected mkIdivModAxioms(dividend: number, divisor: number) {
    const manager = this.manager;
    if (manager.getNumeral(divisor) === 0n) return;
    // The expr_refs of mk_idiv_mod_axioms, released in reverse when it returns.
    const refs: number[] = [];
    const hold = (expr: number) => {
      manager.incRef(expr);
      refs.push(expr);
      return expr;
    };
    manager.withoutTemporaries(() => this.mkIdivModAxiomsCore(dividend, divisor, hold));
    for (let index = refs.length - 1; index >= 0; index--) manager.decRef(refs[index]);
  }

  private mkIdivModAxiomsCore(dividend: number, divisor: number, hold: (expr: number) => number) {
    const manager = this.manager;
    const context = this.context;
    const quotient = hold(manager.mkApp(OP_IDIV, [dividend, divisor], SORT_INT));
    const remainder = hold(manager.mkApp(OP_MOD, [dividend, divisor], SORT_INT));
    const zero = hold(manager.mkNumeral(0n));
    if (manager.getNumeral(dividend) === 0n) {
      // q != 0 implies div 0 q = 0 and mod 0 q = 0.
      const isDivisorNonnegative = this.mkLiteral(manager.mkApp(OP_GE, [divisor, zero], SORT_BOOL));
      const isDivisorNonpositive = this.mkLiteral(manager.mkApp(OP_LE, [divisor, zero], SORT_BOOL));
      const consequents = [
        manager.mkApp(OP_GE, [quotient, zero], SORT_BOOL),
        manager.mkApp(OP_LE, [quotient, zero], SORT_BOOL),
        manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL),
        manager.mkApp(OP_LE, [remainder, zero], SORT_BOOL),
      ].map((atom) => this.mkLiteral(atom));
      for (const antecedent of [isDivisorNonnegative, isDivisorNonpositive])
        for (const consequent of consequents) this.mkAxiom([antecedent, consequent]);
      return;
    }
    const combination = hold(
      manager.mkApp(
        OP_ADD,
        [manager.mkApp(OP_MUL, [divisor, quotient], SORT_INT), remainder],
        SORT_INT,
      ),
    );
    const eqAtom = hold(context.mkEqAtom(combination, dividend));
    context.internalize(eqAtom, false);
    const eq = context.getLiteral(eqAtom);
    const divisorValue = manager.getNumeral(divisor);
    if (divisorValue !== undefined) {
      const upper = hold(
        manager.mkNumeral((divisorValue < 0n ? -divisorValue : divisorValue) - 1n),
      );
      this.mkAxiom([eq]);
      this.mkEqAxioms(this.ensureEnode(combination), this.ensureEnode(dividend));
      this.mkAxiom([this.mkLiteral(manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL))]);
      this.mkAxiom([this.mkLiteral(manager.mkApp(OP_LE, [remainder, upper], SORT_BOOL))]);
      return;
    }
    // q = 0 or (mod p q) >= 0, q >= 0 or (mod p q) + q <= -1, and q <= 0 or (mod p q) - q <= -1.
    const minusOne = hold(manager.mkNumeral(-1n));
    const minusDivisor = hold(manager.mkApp(OP_MUL, [minusOne, divisor], SORT_INT));
    const isZero = this.mkLiteral(manager.mkEq(divisor, zero));
    const isRemainderNonnegative = this.mkLiteral(
      manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL),
    );
    this.mkAxiom([isZero, eq]);
    this.mkAxiom([isZero, isRemainderNonnegative]);
    const isDivisorNonpositive = this.mkLiteral(manager.mkApp(OP_LE, [divisor, zero], SORT_BOOL));
    const isBelowDivisor = this.mkLiteral(
      manager.mkApp(
        OP_LE,
        [manager.mkApp(OP_ADD, [remainder, minusDivisor], SORT_INT), minusOne],
        SORT_BOOL,
      ),
    );
    this.mkAxiom([isDivisorNonpositive, isBelowDivisor]);
    const isDivisorNonnegative = this.mkLiteral(manager.mkApp(OP_GE, [divisor, zero], SORT_BOOL));
    const isBelowNegatedDivisor = this.mkLiteral(
      manager.mkApp(
        OP_LE,
        [manager.mkApp(OP_ADD, [remainder, divisor], SORT_INT), minusOne],
        SORT_BOOL,
      ),
    );
    this.mkAxiom([isDivisorNonnegative, isBelowNegatedDivisor]);
    this.mkEqAxioms(this.ensureEnode(combination), this.ensureEnode(dividend));
    // q = 0 or q * (div p q) <= p. The rewritten atom replaces the unrewritten one, which Z3
    // releases at once, and its own expr_ref goes at the end of the block.
    const unrewritten = manager.mkApp(
      OP_GE,
      [
        manager.mkApp(
          OP_SUB,
          [dividend, manager.mkApp(OP_MUL, [divisor, quotient], SORT_INT)],
          SORT_INT,
        ),
        zero,
      ],
      SORT_BOOL,
    );
    manager.incRef(unrewritten);
    const isProductBelow = context.rewriter.rewrite(unrewritten);
    manager.decRef(unrewritten);
    this.mkAxiom([isZero, this.mkLiteral(isProductBelow)]);
    manager.decRef(isProductBelow);
  }
}

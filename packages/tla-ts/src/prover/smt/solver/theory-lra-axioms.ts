// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp), MIT license, see
// z3-license.txt.
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
  OP_POWER,
  OP_POWER0,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  KIND_APP,
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
    const first = context.getEnode(this.manager.getArg(expr, 0));
    const second = context.getEnode(this.manager.getArg(expr, 1));
    if (first === undefined || second === undefined) return;
    if (this.getThVar(first) >= 0 && this.getThVar(second) >= 0 && first !== second)
      this.mkEqAxioms(first, second);
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
    if (op === OP_DIV) this.mkDivAxiom(manager.getArg(expr, 0), manager.getArg(expr, 1));
    else if (op === OP_TO_INT) this.mkToIntAxiom(expr);
    else if (op === OP_IS_INT) this.mkIsIntAxiom(expr);
    else if (op === OP_MOD) this.mkIdivModAxioms(manager.getArg(expr, 0), manager.getArg(expr, 1));
    else if (op === OP_POWER) this.mkPowerAxiom(expr);
  }

  protected getExtendedNumeral(expr: number) {
    const manager = this.manager;
    if (manager.isNumeral(expr)) return manager.getRationalValue(expr);
    const todo = [{ term: expr, isVisited: false, isNegated: false }];
    const values: Rational[] = [];
    while (todo.length > 0) {
      const frame = todo.pop()!;
      if (frame.isVisited) {
        const op = manager.getOp(frame.term);
        const numArgs = manager.getNumArgs(frame.term);
        const operands = values.splice(values.length - (op === OP_TO_INT ? 1 : numArgs));
        const value =
          op === OP_TO_INT
            ? operands[0].floor()
            : op === OP_ADD
              ? operands.reduce((sum, operand) => sum.add(operand), Rational.zero)
              : op === OP_MUL
                ? operands.reduce((product, operand) => product.mul(operand), Rational.one)
                : op === OP_DIV
                  ? operands[1].isZero()
                    ? undefined
                    : operands[0].div(operands[1])
                  : operands[0].sub(operands[1]);
        if (value === undefined) return undefined;
        values.push(frame.isNegated ? value.neg() : value);
        continue;
      }
      let term = frame.term;
      let isNegated = frame.isNegated;
      while (manager.getOp(term) === OP_UMINUS || manager.getOp(term) === OP_TO_REAL) {
        if (manager.getOp(term) === OP_UMINUS) isNegated = !isNegated;
        term = manager.getArg(term, 0);
      }
      if (manager.isNumeral(term)) {
        const value = manager.getRationalValue(term);
        values.push(isNegated ? value.neg() : value);
        continue;
      }
      const op = manager.getOp(term);
      if (
        manager.kinds[term] !== KIND_APP ||
        (op !== OP_TO_INT &&
          op !== OP_ADD &&
          op !== OP_MUL &&
          !(op === OP_SUB && manager.getNumArgs(term) === 2) &&
          op !== OP_DIV)
      )
        return undefined;
      todo.push({ term, isVisited: true, isNegated });
      for (let index = manager.getNumArgs(term); index-- > 0;)
        todo.push({ term: manager.getArg(term, index), isVisited: false, isNegated: false });
    }
    return values[values.length - 1];
  }

  private mkPowerAxiom(power: number) {
    const manager = this.manager;
    const context = this.context;
    const base = manager.getArg(power, 0);
    const exponent = manager.getArg(power, 1);
    const zero = manager.mkRealNumeral(Rational.zero);
    const baseValue = this.getExtendedNumeral(base);
    if (baseValue?.isPositive())
      this.mkAxiom([negate(this.mkLiteral(manager.mkApp(OP_LE, [power, zero], SORT_BOOL)))]);
    const exponentValue = this.getExtendedNumeral(exponent);
    if (exponentValue?.isPositive() && exponentValue.num === 1n && exponentValue.den > 1n) {
      const isNonnegative = this.mkLiteral(manager.mkApp(OP_GE, [base, zero], SORT_BOOL));
      const root = manager.mkApp(
        OP_POWER,
        [power, manager.mkRealNumeral(Rational.of(exponentValue.den))],
        SORT_REAL,
      );
      const isRoot = this.mkLiteral(manager.mkEq(base, root));
      this.mkAxiom([negate(isNonnegative), isRoot]);
    }
    const isZeroBase =
      manager.isNumeral(base) &&
      manager.getRationalValue(base).isZero() &&
      (!manager.isNumeral(exponent) || manager.getRationalValue(exponent).isZero());
    if (isZeroBase || (baseValue === undefined && exponentValue === undefined)) {
      const literal = this.mkEq(power, manager.mkApp(OP_POWER0, [base, exponent], SORT_REAL));
      context.markLiteralAsRelevant(literal);
      context.assign(literal, null);
    }
  }

  protected mkLiteral(atom: number) {
    const context = this.context;
    if (!context.isEInternalized(atom)) context.internalize(atom, false);
    return context.getLiteral(atom);
  }

  private ensureEnode(expr: number) {
    const node = this.getInternalizedEnode(expr);
    this.context.markAsRelevant(expr);
    return node;
  }

  // Of two literals, the second becomes relevant only once the first is false. A unit axiom is
  // the clause of false and the literal, so mk_clause drops false and the literal is justified by
  // unit
  // resolution with true, which lemma minimization can see through, rather than by an axiom.
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

  private mkToIntAxiom(term: number) {
    const manager = this.manager;
    const arg = manager.getArg(term, 0);
    if (manager.getOp(arg) === OP_TO_REAL) {
      this.mkAxiom([this.mkEq(manager.getArg(arg, 0), term)]);
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

  protected mkIsIntAxiom(atom: number) {
    const manager = this.manager;
    const arg = manager.getArg(atom, 0);
    const eq = this.mkEq(
      manager.mkApp(OP_TO_REAL, [manager.mkApp(OP_TO_INT, [arg], SORT_INT)], SORT_REAL),
      arg,
    );
    const isInt = this.context.getLiteral(atom);
    this.mkAxiom([negate(isInt), eq]);
    this.mkAxiom([isInt, negate(eq)]);
  }

  protected mkEq(first: number, second: number) {
    const manager = this.manager;
    if (first === second) return TRUE_LITERAL;
    if (manager.isUniqueValue(first) && manager.isUniqueValue(second)) return FALSE_LITERAL;
    const atom = this.context.mkEqAtom(first, second);
    this.context.internalize(atom, false);
    return this.context.getLiteral(atom);
  }

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

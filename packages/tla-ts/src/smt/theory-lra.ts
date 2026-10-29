// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp, src/math/lp/int_solver.cpp),
// MIT license, see z3-license.txt. Linear integer arithmetic, as the theory_lra solver that Z3's
// default configuration uses for UFNIA: atoms become bounds on linear terms, the simplex checks
// them during propagation, equalities with the E-graph go through the arith_eq_adapter axioms,
// and the final check runs the GCD test, branches on fractional values and assumes equalities
// between shared terms with equal values. Nonlinear products are opaque, so a model that depends
// on them is reported as unknown.
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  OP_ADD,
  OP_GE,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP, L_UNDEF, type Context, type Theory } from "./context";
import { Enode, TheoryJustification, mkJustificationEqJustification } from "./enode";
import { Rational, getGcd } from "./rational";
import { BoundReason, Simplex } from "./simplex";

interface Atom {
  variable: number;
  isUpper: boolean;
  bound: Rational;
}

interface AtomOccurrence {
  boolVar: number;
  atom: Atom;
}

interface Linearized {
  coeffs: Map<number, Rational>;
  constant: Rational;
}

export class TheoryLra implements Theory {
  private simplex: Simplex;
  private exprToVar = new Map<number, number>();
  private termToVar = new Map<string, number>();
  private varExprs: number[] = [];
  private varEnodes: (Enode | undefined)[] = [];
  private atomOfExpr = new Map<number, Atom>();
  private atomOfBoolVar: (Atom | undefined)[] = [];
  private atomsOfVar = new Map<number, AtomOccurrence[]>();
  private oneVar: number;
  private isCheckNeeded = false;
  private processedEqs = new Set<string>();
  private processedDivMods = new Set<string>();
  private fixedVars = new Map<string, number>();
  // Terms that the theory treats as uninterpreted, so a model may not satisfy them.
  private unsupportedTerms: number[] = [];

  constructor(private context: Context) {
    this.simplex = new Simplex((undo) => context.pushTrail(undo));
    this.oneVar = this.simplex.mkVar();
    this.varExprs.push(context.manager.mkNumeral(1));
    this.simplex.setLower(this.oneVar, Rational.one, null, false);
    this.simplex.setUpper(this.oneVar, Rational.one, null, false);
  }

  private get manager(): AstManager {
    return this.context.manager;
  }

  getEnode(thVar: number) {
    const node = this.varEnodes[thVar];
    if (node === undefined) throw new Error(`theory variable ${thVar} has no enode`);
    return node;
  }

  // Linearization and variables.

  private linearize(expr: number, coeff: Rational, result: Linearized) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    const args = manager.args[expr];
    if (op === OP_NUM) {
      result.constant = result.constant.add(coeff.mul(Rational.fromNumber(manager.values[expr])));
      return;
    }
    if (op === OP_ADD) {
      for (const arg of args) this.linearize(arg, coeff, result);
      return;
    }
    if (op === OP_SUB) {
      this.linearize(args[0], coeff, result);
      for (let index = 1; index < args.length; index++)
        this.linearize(args[index], coeff.neg(), result);
      return;
    }
    if (op === OP_UMINUS) {
      this.linearize(args[0], coeff.neg(), result);
      return;
    }
    if (op === OP_MUL) {
      let factor = coeff;
      const nonNumerals: number[] = [];
      for (const arg of args) {
        if (manager.isNumeral(arg)) factor = factor.mul(Rational.fromNumber(manager.values[arg]));
        else nonNumerals.push(arg);
      }
      if (nonNumerals.length === 1) {
        this.linearize(nonNumerals[0], factor, result);
        return;
      }
      if (nonNumerals.length === 0) {
        result.constant = result.constant.add(factor);
        return;
      }
    }
    const variable = this.getVarOfTerm(expr);
    result.coeffs.set(variable, (result.coeffs.get(variable) ?? Rational.zero).add(coeff));
    if (result.coeffs.get(variable)?.isZero()) result.coeffs.delete(variable);
  }

  private isAttached(node: Enode) {
    return node.thVar >= 0 && this.varEnodes[node.thVar] === node;
  }

  private attach(node: Enode, variable: number) {
    const saved = this.varEnodes[variable];
    this.varEnodes[variable] = node;
    this.context.pushTrail(() => {
      this.varEnodes[variable] = saved;
    });
    this.context.attachThVar(node, variable);
    if (this.simplex.isFixed(variable)) this.registerFixed(variable);
  }

  // The variable of a term that the E-graph knows, such as x or (f y) or (+ x 1).
  private getVarOfTerm(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    const node = context.getEnode(expr);
    if (node === undefined) throw new Error("the term was not internalized");
    if (this.isAttached(node)) return node.thVar;
    let variable = this.exprToVar.get(expr);
    if (variable === undefined) {
      variable = this.mkVarForExpr(expr);
      this.exprToVar.set(expr, variable);
    }
    this.attach(node, variable);
    return variable;
  }

  private mkVarForExpr(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op === OP_NUM) {
      const variable = this.simplex.mkVar();
      this.varExprs.push(expr);
      const value = Rational.fromNumber(manager.values[expr]);
      this.simplex.setLower(variable, value, null, false);
      this.simplex.setUpper(variable, value, null, false);
      return variable;
    }
    if (
      op === OP_ADD ||
      op === OP_SUB ||
      op === OP_UMINUS ||
      (op === OP_MUL && !this.isNonlinear(expr))
    ) {
      const linearized: Linearized = { coeffs: new Map(), constant: Rational.zero };
      this.linearize(expr, Rational.one, linearized);
      if (!linearized.constant.isZero()) linearized.coeffs.set(this.oneVar, linearized.constant);
      return this.mkTermVar(linearized.coeffs, expr);
    }
    if (op === OP_MUL) this.unsupportedTerms.push(expr);
    const variable = this.simplex.mkVar();
    this.varExprs.push(expr);
    return variable;
  }

  private isNonlinear(expr: number) {
    return this.manager.args[expr].filter((arg) => !this.manager.isNumeral(arg)).length > 1;
  }

  private getTermKey(coeffs: Map<number, Rational>) {
    return [...coeffs]
      .sort((first, second) => first[0] - second[0])
      .map((entry) => `${entry[0]}*${entry[1].toString()}`)
      .join("+");
  }

  private mkTermVar(coeffs: Map<number, Rational>, expr: number) {
    const key = this.getTermKey(coeffs);
    const existing = this.termToVar.get(key);
    if (existing !== undefined) return existing;
    const variable = this.simplex.mkTerm(coeffs);
    this.termToVar.set(key, variable);
    this.varExprs.push(expr);
    return variable;
  }

  // An expression for a linear combination, for atoms that the theory creates itself.
  private mkTermExpr(coeffs: Map<number, Rational>) {
    const manager = this.manager;
    const rewriter = this.context.rewriter;
    const summands = [...coeffs].map((entry) => {
      const value = entry[1];
      const varExpr = this.varExprs[entry[0]];
      if (entry[0] === this.oneVar) return manager.mkNumeral(Number(value.num));
      return value.equals(Rational.one)
        ? varExpr
        : manager.mkApp(OP_MUL, [manager.mkNumeral(Number(value.num)), varExpr], SORT_INT);
    });
    if (summands.length === 1) return summands[0];
    return rewriter.mkAdd(summands);
  }

  internalizeTerm(expr: number) {
    const manager = this.manager;
    const context = this.context;
    const op = manager.getOp(expr);
    for (const arg of manager.args[expr]) context.internalize(arg, false);
    if (context.isEInternalized(expr)) return true;
    context.mkEnode(expr, false, false, op !== OP_ADD && op !== OP_MUL);
    this.getVarOfTerm(expr);
    if ((op === OP_IDIV || op === OP_MOD) && !manager.isNumeral(manager.args[expr][1]))
      this.unsupportedTerms.push(expr);
    return true;
  }

  // Atoms.

  private mkAtom(expr: number): Atom | undefined {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op !== OP_LE && op !== OP_GE) return undefined;
    const args = manager.args[expr];
    const linearized: Linearized = { coeffs: new Map(), constant: Rational.zero };
    this.linearize(args[0], Rational.one, linearized);
    this.linearize(args[1], Rational.minusOne, linearized);
    // sum + constant <= 0 for <=, and sum + constant >= 0 for >=.
    let isUpper = op === OP_LE;
    let bound = linearized.constant.neg();
    let coeffs = linearized.coeffs;
    if (coeffs.size === 0) {
      const variable = this.oneVar;
      const holds = isUpper ? bound.compare(Rational.zero) >= 0 : bound.compare(Rational.zero) <= 0;
      return { variable, isUpper: true, bound: holds ? Rational.one : Rational.zero };
    }
    if (coeffs.size === 1) {
      const entry = [...coeffs][0];
      if (entry[1].isNegative()) isUpper = !isUpper;
      bound = bound.div(entry[1]);
      coeffs = new Map([[entry[0], Rational.one]]);
      const variable = entry[0];
      return { variable, isUpper, bound: isUpper ? bound.floor() : bound.ceil() };
    }
    const variable = this.mkTermVar(coeffs, -1);
    if (this.varExprs[variable] === -1) this.varExprs[variable] = this.mkTermExpr(coeffs);
    return { variable, isUpper, bound: isUpper ? bound.floor() : bound.ceil() };
  }

  internalizeAtom(expr: number) {
    const context = this.context;
    let atom = this.atomOfExpr.get(expr);
    if (atom === undefined) {
      atom = this.mkAtom(expr);
      if (atom === undefined) return false;
      this.atomOfExpr.set(expr, atom);
    } else for (const arg of this.manager.args[expr]) this.touchTerms(arg);
    const boolVar = context.mkBoolVar(expr);
    context.setVarTheory(boolVar);
    this.atomOfBoolVar[boolVar] = atom;
    this.addBoundAxioms(boolVar, atom);
    return true;
  }

  // Internalizes the subterms of an atom whose linearization is cached.
  private touchTerms(expr: number) {
    this.linearize(expr, Rational.one, { coeffs: new Map(), constant: Rational.zero });
  }

  private getAtomLiteral(boolVar: number, isTrue: boolean) {
    return boolVar * 2 + (isTrue ? 0 : 1);
  }

  // mk_bound_axioms: implications between the new atom and its closest neighbors on one variable.
  private addBoundAxioms(boolVar: number, atom: Atom) {
    let occurrences = this.atomsOfVar.get(atom.variable);
    if (occurrences === undefined) {
      occurrences = [];
      this.atomsOfVar.set(atom.variable, occurrences);
    }
    const list = occurrences;
    let closestBelow: AtomOccurrence | undefined;
    let closestAbove: AtomOccurrence | undefined;
    const literal = this.getAtomLiteral(boolVar, true);
    for (const occurrence of list) {
      const other = occurrence.atom;
      if (other.isUpper !== atom.isUpper) {
        const otherLiteral = this.getAtomLiteral(occurrence.boolVar, true);
        const upper = atom.isUpper ? atom : other;
        const lower = atom.isUpper ? other : atom;
        const upperLiteral = atom.isUpper ? literal : otherLiteral;
        const lowerLiteral = atom.isUpper ? otherLiteral : literal;
        if (lower.bound.compare(upper.bound) > 0)
          this.context.mkThAxiom([upperLiteral ^ 1, lowerLiteral ^ 1]);
        else if (lower.bound.compare(upper.bound.add(Rational.one)) <= 0)
          this.context.mkThAxiom([upperLiteral, lowerLiteral]);
        continue;
      }
      const comparison = other.bound.compare(atom.bound);
      if (
        comparison <= 0 &&
        (closestBelow === undefined || other.bound.compare(closestBelow.atom.bound) > 0)
      )
        closestBelow = occurrence;
      if (
        comparison >= 0 &&
        (closestAbove === undefined || other.bound.compare(closestAbove.atom.bound) < 0)
      )
        closestAbove = occurrence;
    }
    // For upper bounds, x <= a implies x <= b when a <= b, and dually for lower bounds.
    const weaker = atom.isUpper ? closestAbove : closestBelow;
    const stronger = atom.isUpper ? closestBelow : closestAbove;
    if (weaker !== undefined)
      this.context.mkThAxiom([literal ^ 1, this.getAtomLiteral(weaker.boolVar, true)]);
    if (stronger !== undefined)
      this.context.mkThAxiom([this.getAtomLiteral(stronger.boolVar, false), literal]);
    list.push({ boolVar, atom });
    this.context.pushTrail(() => list.pop());
  }

  assignEh(boolVar: number, isTrue: boolean) {
    const atom = this.atomOfBoolVar[boolVar];
    if (atom === undefined) return;
    const reason: BoundReason = { literals: [this.getAtomLiteral(boolVar, isTrue)] };
    const isUpper = isTrue ? atom.isUpper : !atom.isUpper;
    const bound = isTrue
      ? atom.bound
      : atom.isUpper
        ? atom.bound.add(Rational.one)
        : atom.bound.sub(Rational.one);
    this.assertBound(atom.variable, isUpper, bound, reason);
  }

  private assertBound(variable: number, isUpper: boolean, bound: Rational, reason: BoundReason) {
    const simplex = this.simplex;
    if (isUpper) {
      const upper = simplex.uppers[variable];
      if (upper !== null && upper.compare(bound) <= 0) return;
      const lower = simplex.lowers[variable];
      if (lower !== null && lower.compare(bound) > 0) {
        this.setConflict([reason, simplex.lowerReasons[variable]]);
        return;
      }
      simplex.setUpper(variable, bound, reason, true);
    } else {
      const lower = simplex.lowers[variable];
      if (lower !== null && lower.compare(bound) >= 0) return;
      const upper = simplex.uppers[variable];
      if (upper !== null && upper.compare(bound) < 0) {
        this.setConflict([reason, simplex.upperReasons[variable]]);
        return;
      }
      simplex.setLower(variable, bound, reason, true);
    }
    this.isCheckNeeded = true;
    if (simplex.isFixed(variable)) this.registerFixed(variable);
  }

  private collectLiterals(reasons: (BoundReason | null)[]) {
    const literals: number[] = [];
    for (const reason of reasons)
      if (reason !== null) for (const literal of reason.literals) literals.push(literal);
    return literals;
  }

  private setConflict(reasons: (BoundReason | null)[]) {
    this.context.setConflict(new TheoryJustification(this.collectLiterals(reasons), []), -1);
  }

  // fixed_var_eh: two terms fixed to one value are equal.
  private registerFixed(variable: number) {
    const node = this.varEnodes[variable];
    const value = this.simplex.lowers[variable];
    if (node === undefined || value === null) return;
    const key = value.toString();
    const other = this.fixedVars.get(key);
    if (
      other === undefined ||
      this.varEnodes[other] === undefined ||
      !this.simplex.isFixed(other)
    ) {
      const saved = other;
      this.fixedVars.set(key, variable);
      this.context.pushTrail(() => {
        if (saved === undefined) this.fixedVars.delete(key);
        else this.fixedVars.set(key, saved);
      });
      return;
    }
    const otherNode = this.varEnodes[other];
    if (otherNode === undefined || otherNode.root === node.root) return;
    const simplex = this.simplex;
    const literals = this.collectLiterals([
      simplex.lowerReasons[variable],
      simplex.upperReasons[variable],
      simplex.lowerReasons[other],
      simplex.upperReasons[other],
    ]);
    this.context.pushEq(
      node,
      otherNode,
      mkJustificationEqJustification(new TheoryJustification(literals, [])),
    );
  }

  // arith_eq_adapter.

  private mkEqAxioms(inputFirst: Enode, inputSecond: Enode) {
    if (inputFirst === inputSecond) return;
    const context = this.context;
    const manager = this.manager;
    const isSwapped = inputFirst.owner > inputSecond.owner;
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
    const zero = manager.mkNumeral(0);
    let le: number;
    let ge: number;
    if (manager.isNumeral(t2)) {
      le = manager.mkApp(OP_LE, [t1, t2], SORT_BOOL);
      ge = manager.mkApp(OP_GE, [t1, t2], SORT_BOOL);
    } else {
      const difference = manager.mkApp(
        OP_ADD,
        [t1, manager.mkApp(OP_MUL, [manager.mkNumeral(-1), t2], SORT_INT)],
        SORT_INT,
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
    if (context.isTrueFirst(eqLiteral >> 1)) {
      context.setTrueFirstFlag(leLiteral >> 1);
      context.setTrueFirstFlag(geLiteral >> 1);
    }
    context.mkThAxiom([eqLiteral ^ 1, leLiteral]);
    context.mkThAxiom([eqLiteral ^ 1, geLiteral]);
    context.mkThAxiom([eqLiteral, leLiteral ^ 1, geLiteral ^ 1]);
    const handler = () => {
      if (!context.isRelevant(first.owner) || !context.isRelevant(second.owner)) return;
      context.markAsRelevant(eq);
      context.markAsRelevant(le);
      context.markAsRelevant(ge);
    };
    context.relevancy.addHandler(first.owner, handler);
    context.relevancy.addHandler(second.owner, handler);
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
    if (op !== OP_IDIV && op !== OP_MOD) return;
    const args = manager.args[expr];
    if (manager.isNumeral(args[1]) && manager.values[args[1]] === 0) return;
    const key = `${args[0]}:${args[1]}`;
    if (this.processedDivMods.has(key)) return;
    this.processedDivMods.add(key);
    this.context.pushTrail(() => this.processedDivMods.delete(key));
    if (manager.isNumeral(args[1])) this.mkDivModAxioms(args[0], args[1]);
    else this.mkVariableDivModAxioms(args[0], args[1]);
  }

  private mkLiteral(atom: number) {
    this.context.internalize(atom, true);
    return this.context.getLiteral(atom);
  }

  // mk_idiv_mod_axioms for a divisor q that is not a numeral:
  //   q = 0 or p = q * (div p q) + (mod p q)
  //   q = 0 or (mod p q) >= 0
  //   q <= 0 or (mod p q) - q <= -1
  //   q >= 0 or (mod p q) + q <= -1
  //   q = 0 or p - q * (div p q) >= 0
  private mkVariableDivModAxioms(dividend: number, divisor: number) {
    const manager = this.manager;
    const context = this.context;
    const rewriter = context.rewriter;
    const quotient = manager.mkApp(OP_IDIV, [dividend, divisor], SORT_INT);
    const remainder = manager.mkApp(OP_MOD, [dividend, divisor], SORT_INT);
    const zero = manager.mkNumeral(0);
    const minusOne = manager.mkNumeral(-1);
    const product = manager.mkApp(OP_MUL, [divisor, quotient], SORT_INT);
    const isZero = this.mkLiteral(manager.mkEq(divisor, zero));
    const sum = manager.mkApp(OP_ADD, [product, remainder], SORT_INT);
    context.mkThAxiom([isZero, this.mkLiteral(manager.mkEq(sum, dividend))]);
    context.mkThAxiom([isZero, this.mkLiteral(manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL))]);
    const lowerBound = manager.mkApp(
      OP_ADD,
      [remainder, manager.mkApp(OP_MUL, [minusOne, divisor], SORT_INT)],
      SORT_INT,
    );
    context.mkThAxiom([
      this.mkLiteral(manager.mkApp(OP_LE, [divisor, zero], SORT_BOOL)),
      this.mkLiteral(manager.mkApp(OP_LE, [lowerBound, minusOne], SORT_BOOL)),
    ]);
    context.mkThAxiom([
      this.mkLiteral(manager.mkApp(OP_GE, [divisor, zero], SORT_BOOL)),
      this.mkLiteral(
        manager.mkApp(
          OP_LE,
          [manager.mkApp(OP_ADD, [remainder, divisor], SORT_INT), minusOne],
          SORT_BOOL,
        ),
      ),
    ]);
    const difference = manager.mkApp(OP_SUB, [dividend, product], SORT_INT);
    context.mkThAxiom([
      isZero,
      this.mkLiteral(rewriter.rewrite(manager.mkApp(OP_GE, [difference, zero], SORT_BOOL))),
    ]);
  }

  // mk_idiv_mod_axioms for a numeral divisor k: k * (div p k) + (mod p k) = p, 0 <= mod < |k|.
  private mkDivModAxioms(dividend: number, divisor: number) {
    const manager = this.manager;
    const context = this.context;
    const divisorValue = manager.values[divisor];
    const quotient = manager.mkApp(OP_IDIV, [dividend, divisor], SORT_INT);
    const remainder = manager.mkApp(OP_MOD, [dividend, divisor], SORT_INT);
    const zero = manager.mkNumeral(0);
    const combination = manager.mkApp(
      OP_ADD,
      [
        manager.mkApp(OP_MUL, [divisor, quotient], SORT_INT),
        remainder,
        manager.mkApp(OP_MUL, [manager.mkNumeral(-1), dividend], SORT_INT),
      ],
      SORT_INT,
    );
    const atoms = [
      manager.mkApp(OP_LE, [combination, zero], SORT_BOOL),
      manager.mkApp(OP_GE, [combination, zero], SORT_BOOL),
      manager.mkApp(OP_GE, [remainder, zero], SORT_BOOL),
      manager.mkApp(OP_LE, [remainder, manager.mkNumeral(Math.abs(divisorValue) - 1)], SORT_BOOL),
    ];
    for (const atom of atoms) {
      context.internalize(atom, true);
      context.mkThAxiom([context.getLiteral(atom)]);
    }
  }

  canPropagate() {
    return this.isCheckNeeded;
  }

  propagate() {
    if (!this.isCheckNeeded) return;
    this.isCheckNeeded = false;
    const conflict = this.simplex.check(() => this.context.checkCanceled());
    if (conflict === undefined) {
      this.isCheckNeeded = true;
      return;
    }
    if (conflict !== null) this.setConflict(conflict.reasons);
  }

  private findInfeasibleIntVar() {
    const simplex = this.simplex;
    for (let variable = 0; variable < simplex.getNumVars(); variable++)
      if (!simplex.values[variable].isInt()) return variable;
    return -1;
  }

  // gcd_test: a row whose non-fixed coefficients have a gcd that does not divide the fixed part.
  private gcdTest() {
    const simplex = this.simplex;
    for (const row of simplex.rows) {
      const terms: [number, Rational][] = [[row.basic, Rational.minusOne], ...row.coeffs];
      let lcm = 1n;
      for (const term of terms) lcm = (lcm * term[1].den) / getGcd(lcm, term[1].den);
      let constant = 0n;
      let gcd = 0n;
      const reasons: (BoundReason | null)[] = [];
      for (const term of terms) {
        const coeff = (term[1].num * lcm) / term[1].den;
        if (simplex.isFixed(term[0])) {
          const value = simplex.lowers[term[0]] ?? Rational.zero;
          constant += coeff * value.num;
          reasons.push(simplex.lowerReasons[term[0]], simplex.upperReasons[term[0]]);
        } else gcd = getGcd(gcd, coeff);
      }
      if (gcd > 1n && constant % gcd !== 0n) {
        this.setConflict(reasons);
        return false;
      }
    }
    return true;
  }

  private isShared(node: Enode) {
    const root = node.root;
    if (this.manager.getOp(root.owner) === OP_ITE) return true;
    if (root.thVar < 0) return false;
    for (const parent of root.parents) {
      const family = this.manager.getFamily(parent.owner);
      if (family !== FAMILY_ARITH && family !== FAMILY_BASIC) return true;
    }
    return false;
  }

  // assume_eqs: model-based theory combination.
  private assumeEqs() {
    const context = this.context;
    const simplex = this.simplex;
    const numVars = simplex.getNumVars();
    if (numVars === 0) return false;
    const start = context.getRandomValue();
    const byValue = new Map<string, number>();
    const candidates: [number, number][] = [];
    for (let index = 0; index < numVars; index++) {
      const variable = (index + start) % numVars;
      const node = this.varEnodes[variable];
      if (node === undefined) continue;
      if (!context.isRelevant(node.owner) || !this.isShared(node)) continue;
      const key = simplex.values[variable].toString();
      const other = byValue.get(key);
      if (other === undefined) {
        byValue.set(key, variable);
        continue;
      }
      const otherNode = this.varEnodes[other];
      if (otherNode !== undefined && otherNode.root !== node.root)
        candidates.push([variable, other]);
    }
    for (const candidate of candidates) {
      const first = this.varEnodes[candidate[0]];
      const second = this.varEnodes[candidate[1]];
      if (first === undefined || second === undefined || first.root === second.root) continue;
      if (!simplex.values[candidate[0]].equals(simplex.values[candidate[1]])) continue;
      if (context.assumeEq(first, second)) return true;
    }
    return false;
  }

  finalCheckEh() {
    const context = this.context;
    if (this.isCheckNeeded) {
      this.propagate();
      if (context.isInconsistent()) return FC_CONTINUE;
    }
    const variable = this.findInfeasibleIntVar();
    if (variable !== -1) {
      if (!this.gcdTest()) return FC_CONTINUE;
      const value = this.simplex.values[variable];
      const atom = this.manager.mkApp(
        OP_LE,
        [this.varExprs[variable], this.manager.mkNumeral(Number(value.floor().num))],
        SORT_BOOL,
      );
      context.internalize(atom, true);
      context.markAsRelevant(atom);
      const literal = context.getLiteral(atom);
      if (context.getAssignment(literal) !== L_UNDEF) return FC_GIVEUP;
      return FC_CONTINUE;
    }
    if (this.assumeEqs()) return FC_CONTINUE;
    if (this.unsupportedTerms.some((term) => context.isRelevant(term))) return FC_GIVEUP;
    return FC_DONE;
  }

  pushScopeEh() {}

  popScopeEh() {
    this.isCheckNeeded = true;
  }

  restartEh() {}

  initSearchEh() {}
}

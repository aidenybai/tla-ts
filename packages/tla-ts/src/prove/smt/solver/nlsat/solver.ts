// Ported from Z3 (src/nlsat/nlsat_solver.cpp, src/nlsat/nlsat_explain.cpp,
// src/nlsat/nlsat_evaluator.cpp), MIT license, see z3-license.txt. The part of nlsat that
// check_assignment uses: inequality atoms over single polynomials, unit clauses, and
// check(assignment, clause), which explains a violated clause with a linear cell around the
// assignment. The cell is linear, so every bound is linear with a constant coefficient and the
// explanation never needs a root atom. Factored atoms, with several polynomials, are left out
// because check_assignment never makes them.
import type { Rational } from "../rational";
import { AlgebraicManager, Anum } from "./algebraic";
import { getSingleCell } from "./levelwise";
import { NlsatOutOfScope, type Polynomial, PolynomialCache, PolynomialManager } from "./polynomial";

export type AtomKind = "EQ" | "LT" | "GT";

// The atom p kind 0, where variable is the maximal variable of p.
export interface Atom {
  kind: AtomKind;
  polynomial: Polynomial;
  variable: number;
}

export interface NlsatCheck {
  status: "undef" | "lemma";
  clause: number[];
}

// A literal is 2 * boolVar + sign. Boolean variable 0 is true.
export const TRUE_LITERAL = 0;
export const FALSE_LITERAL = 1;

const FLIPPED_KIND: Record<AtomKind, AtomKind> = { EQ: "EQ", LT: "GT", GT: "LT" };

export class NlsatSolver {
  readonly pm = new PolynomialManager();
  private cache = new PolynomialCache(this.pm);
  private am = new AlgebraicManager();
  private atoms: (Atom | null)[] = [null];
  private atomTable = new Map<string, number>();
  private clauses: number[] = [];

  // mk_ineq_atom: p is sign-normalized and hash-consed, so atoms that differ only by the sign of p
  // share a Boolean variable.
  private mkIneqAtom(kind: AtomKind, polynomial: Polynomial) {
    const normalized = this.pm.flipSignIfLmNeg(polynomial);
    const unique = this.cache.mkUnique(normalized);
    const flippedKind = normalized === polynomial ? kind : FLIPPED_KIND[kind];
    const key = `${flippedKind},${unique.id}`;
    const existing = this.atomTable.get(key);
    if (existing !== undefined) return existing;
    this.atoms.push({ kind: flippedKind, polynomial: unique, variable: this.pm.maxVar(unique) });
    this.atomTable.set(key, this.atoms.length - 1);
    return this.atoms.length - 1;
  }

  // mk_ineq_literal: true or false for a constant polynomial.
  mkIneqLiteral(kind: AtomKind, polynomial: Polynomial) {
    if (this.pm.isConst(polynomial)) {
      const constant = this.pm.isZero(polynomial) ? 0n : polynomial.as[0];
      const isTrue =
        (constant > 0n && kind === "GT") ||
        (constant < 0n && kind === "LT") ||
        (constant === 0n && kind === "EQ");
      return isTrue ? TRUE_LITERAL : FALSE_LITERAL;
    }
    return 2 * this.mkIneqAtom(kind, polynomial);
  }

  getAtom(literal: number) {
    return this.atoms[literal >> 1] ?? null;
  }

  addUnitClause(literal: number) {
    this.clauses.push(literal);
  }

  private isTrue(atom: Atom, literal: number, values: readonly Rational[]) {
    const sign = this.pm.getSign(atom.polynomial, values);
    const isSatisfied =
      (sign === 0 && atom.kind === "EQ") ||
      (sign < 0 && atom.kind === "LT") ||
      (sign > 0 && atom.kind === "GT");
    return (literal & 1) === 1 ? !isSatisfied : isSatisfied;
  }

  // check(rvalues, clause): the lemma that excludes a cell around values when a clause is false
  // there: the literals bounding the cell, then the negation of the false literal of least degree in
  // its maximal variable. Otherwise undef, never satisfied: Z3's solver starts with the clause
  // [true] (mk_true_bvar), and outside search the true literal is unassigned, so its value is
  // undefined. That also makes a clause of a constant literal undefined rather than false.
  check(values: readonly Rational[]): NlsatCheck {
    let best: { literal: number; atom: Atom } | null = null;
    for (const literal of this.clauses) {
      const atom = this.atoms[literal >> 1];
      if (atom === null || this.isTrue(atom, literal, values)) continue;
      if (
        best === null ||
        this.pm.degree(atom.polynomial, atom.variable) <
          this.pm.degree(best.atom.polynomial, best.atom.variable)
      )
        best = { literal, atom };
    }
    if (best === null) return { status: "undef", clause: [] };
    return {
      status: "lemma",
      clause: [...this.explain(best.atom.polynomial, values), best.literal ^ 1],
    };
  }

  // compute_linear_explanation: the literals that describe the linear cell around values in which
  // the polynomial keeps its sign.
  private explain(polynomial: Polynomial, values: readonly Rational[]) {
    const result: number[] = [];
    // add_root_literal through mk_linear_root: the bound y kind root(p), for p linear in y with a
    // constant coefficient, as the atom p kind 0 after making the coefficient positive.
    const addRootLiteral = (kind: AtomKind, root: Polynomial) => {
      const variable = this.pm.maxVar(root);
      const coeff = this.pm.getConstCoeff(root, variable, 1);
      if (this.pm.degree(root, variable) !== 1 || coeff === null)
        throw new NlsatOutOfScope(`the root atom of ${root} in x${variable}`);
      const literal = 2 * this.mkIneqAtom(kind, coeff < 0n ? this.pm.neg(root) : root) + 1;
      if (!result.includes(literal)) result.push(literal);
    };
    // A section has only a lower bound.
    const cell = getSingleCell(
      this.pm,
      this.am,
      this.cache,
      [polynomial],
      this.pm.maxVar(polynomial) + 1,
      values.map((value) => new Anum(value)),
      true,
    );
    for (const interval of cell) {
      if (interval.lower !== null) addRootLiteral(interval.isSection ? "EQ" : "GT", interval.lower);
      if (interval.upper !== null) addRootLiteral("LT", interval.upper);
    }
    return result;
  }
}

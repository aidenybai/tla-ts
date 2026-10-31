// Ported from Z3 (src/nlsat/nlsat_solver.cpp, src/nlsat/nlsat_scoped_literal_vector.h,
// src/util/id_gen.h), MIT license, see z3-license.txt. The atoms of nlsat, hash-consed, with
// reference counts. An atom whose count drops to zero is deleted and its Boolean variable reused,
// last freed first, so literals are numbered as in Z3. Boolean variable 0 is true and has no atom.
import {
  NULL_VAR,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
} from "./polynomial";
import type { Atom, IneqAtom, IneqKind, RootAtom, RootKind } from "./types";

export const TRUE_BOOL_VAR = 0;
export const TRUE_LITERAL = 0;
export const FALSE_LITERAL = 1;

const FLIPPED_KIND: Record<IneqKind, IneqKind> = { EQ: "EQ", LT: "GT", GT: "LT" };

export const flipKind = (kind: IneqKind) => FLIPPED_KIND[kind];

export class AtomTable {
  readonly atoms: (Atom | null)[] = [];
  private refCounts: number[] = [];
  private nextBoolVar = 0;
  private freeBoolVars: number[] = [];
  private ineqAtoms = new Map<string, IneqAtom>();
  private rootAtoms = new Map<string, RootAtom>();

  constructor(
    private pm: PolynomialManager,
    private cache: PolynomialCache,
  ) {
    this.mkBoolVar();
  }

  // mk_bool_var_core with id_gen: the last freed variable first.
  mkBoolVar() {
    const boolVar = this.freeBoolVars.pop() ?? this.nextBoolVar++;
    this.atoms[boolVar] = null;
    this.refCounts[boolVar] = 0;
    return boolVar;
  }

  getAtom(literal: number) {
    return this.atoms[literal >> 1] ?? null;
  }

  getMaxVar(literal: number) {
    return this.getAtom(literal)?.maxVar ?? NULL_VAR;
  }

  incRef(literal: number) {
    const boolVar = literal >> 1;
    if (this.atoms[boolVar] === null || this.atoms[boolVar] === undefined) return;
    this.refCounts[boolVar]++;
  }

  decRef(literal: number) {
    const boolVar = literal >> 1;
    const atom = this.atoms[boolVar];
    if (atom === null || atom === undefined) return;
    if (--this.refCounts[boolVar] > 0) return;
    if ("polynomials" in atom) this.ineqAtoms.delete(this.getIneqKey(atom));
    else this.rootAtoms.delete(this.getRootKey(atom));
    this.atoms[boolVar] = null;
    this.freeBoolVars.push(boolVar);
  }

  private getIneqKey(atom: Pick<IneqAtom, "kind" | "polynomials" | "isEven">) {
    return `${atom.kind},${atom.polynomials.map((polynomial, index) => `${polynomial.id}${atom.isEven[index] ? "e" : "o"}`).join(",")}`;
  }

  private getRootKey(atom: Pick<RootAtom, "kind" | "maxVar" | "index" | "polynomial">) {
    return `${atom.kind},${atom.maxVar},${atom.index},${atom.polynomial.id}`;
  }

  // mk_ineq_atom: each factor sign-normalized and hash-consed, the kind flipped when an odd
  // factor changed sign.
  mkIneqAtom(kind: IneqKind, polynomials: readonly Polynomial[], isEven: readonly boolean[]) {
    let sign = 1;
    let maxVar = NULL_VAR;
    const unique = polynomials.map((polynomial, index) => {
      const normalized = this.pm.flipSignIfLmNeg(polynomial);
      if (normalized !== polynomial && !isEven[index]) sign = -sign;
      const variable = this.pm.maxVar(normalized);
      if (variable > maxVar || maxVar === NULL_VAR) maxVar = variable;
      return this.cache.mkUnique(normalized);
    });
    const atom: IneqAtom = {
      kind: sign < 0 ? flipKind(kind) : kind,
      boolVar: 0,
      maxVar,
      polynomials: unique,
      isEven: [...isEven],
    };
    const key = this.getIneqKey(atom);
    const existing = this.ineqAtoms.get(key);
    if (existing !== undefined) return existing.boolVar;
    atom.boolVar = this.mkBoolVar();
    this.atoms[atom.boolVar] = atom;
    this.ineqAtoms.set(key, atom);
    return atom.boolVar;
  }

  // mk_ineq_literal: true or false for a product of constants.
  mkIneqLiteral(kind: IneqKind, polynomials: readonly Polynomial[], isEven: readonly boolean[]) {
    let constant = 1n;
    let isConst = true;
    for (const [index, polynomial] of polynomials.entries()) {
      if (!this.pm.isConst(polynomial)) {
        isConst = false;
        continue;
      }
      if (this.pm.isZero(polynomial)) {
        constant = 0n;
        isConst = true;
        break;
      }
      const coeff = polynomial.as[0];
      constant *= coeff;
      if (isEven[index] && coeff < 0n) constant = -constant;
    }
    if (isConst) {
      const isTrue =
        (constant > 0n && kind === "GT") ||
        (constant < 0n && kind === "LT") ||
        (constant === 0n && kind === "EQ");
      return isTrue ? TRUE_LITERAL : FALSE_LITERAL;
    }
    return 2 * this.mkIneqAtom(kind, polynomials, isEven);
  }

  // mk_root_atom: p sign-normalized, which keeps its roots, and hash-consed.
  mkRootAtom(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    const atom: RootAtom = {
      kind,
      boolVar: 0,
      maxVar: variable,
      index,
      polynomial: this.cache.mkUnique(this.pm.flipSignIfLmNeg(polynomial)),
    };
    const key = this.getRootKey(atom);
    const existing = this.rootAtoms.get(key);
    if (existing !== undefined) return existing.boolVar;
    atom.boolVar = this.mkBoolVar();
    this.atoms[atom.boolVar] = atom;
    this.rootAtoms.set(key, atom);
    return atom.boolVar;
  }
}

// scoped_literal_vector: literals that hold a reference to their atoms.
export class ScopedLiterals {
  literals: number[] = [];

  constructor(private table: AtomTable) {}

  get size() {
    return this.literals.length;
  }

  push(literal: number) {
    this.table.incRef(literal);
    this.literals.push(literal);
  }

  set(index: number, literal: number) {
    this.table.incRef(literal);
    this.table.decRef(this.literals[index]);
    this.literals[index] = literal;
  }

  shrink(size: number) {
    for (const literal of this.literals.slice(size)) this.table.decRef(literal);
    this.literals.length = size;
  }

  reset() {
    this.shrink(0);
  }
}

// scoped_literal: a literal that holds a reference to its atom.
export class ScopedLiteral {
  literal = TRUE_LITERAL;

  constructor(private table: AtomTable) {}

  set(literal: number) {
    this.table.incRef(literal);
    this.table.decRef(this.literal);
    this.literal = literal;
  }
}

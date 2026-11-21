import {
  NULL_VAR,
  type Polynomial,
  type PolynomialCache,
  type PolynomialManager,
  PolynomialRef,
} from "./polynomial";
import {
  type Atom,
  type Clause,
  type IneqAtom,
  type IneqKind,
  type RootAtom,
  type RootKind,
  isIneqAtom,
} from "./types";

export const TRUE_BOOL_VAR = 0;
export const TRUE_LITERAL = 0;
export const FALSE_LITERAL = 1;

const FLIPPED_KIND: Record<IneqKind, IneqKind> = { EQ: "EQ", LT: "GT", GT: "LT" };

export const flipKind = (kind: IneqKind) => FLIPPED_KIND[kind];

interface BoolVarHooks {
  onMk: (boolVar: number) => void;
  onDelete: (boolVar: number) => void;
}

export class AtomTable {
  readonly atoms: (Atom | null)[] = [];
  private refCounts: number[] = [];
  private nextBoolVar = 0;
  private freeBoolVars: number[] = [];
  private ineqAtoms = new Map<string, IneqAtom>();
  // Keyed by the variable at creation: Z3's root atom table also ignores renamed variables.
  private rootAtoms = new Map<string, RootAtom>();
  private rootKeys = new Map<number, string>();

  constructor(
    private pm: PolynomialManager,
    private cache: PolynomialCache,
    private hooks: BoolVarHooks | null = null,
  ) {
    this.mkBoolVar();
  }

  mkBoolVar() {
    const boolVar = this.freeBoolVars.pop() ?? this.nextBoolVar++;
    this.atoms[boolVar] = null;
    this.refCounts[boolVar] = 0;
    this.hooks?.onMk(boolVar);
    return boolVar;
  }

  getDegree(atom: Atom) {
    if (!isIneqAtom(atom)) return this.pm.degree(atom.polynomial, atom.maxVar);
    let max = 0;
    for (const polynomial of atom.polynomials)
      max = Math.max(max, this.pm.degree(polynomial, atom.maxVar));
    return max;
  }

  reinitCache(clauses: readonly Clause[], learned: readonly Clause[]) {
    for (const clause of clauses)
      for (const literal of clause.literals) this.reinitAtomCache(this.atoms[literal >> 1]);
    for (const clause of learned)
      for (const literal of clause.literals) this.reinitAtomCache(this.atoms[literal >> 1]);
    for (const atom of this.atoms) this.reinitAtomCache(atom);
  }

  private reinitAtomCache(atom: Atom | null) {
    if (atom === null) return;
    if (isIneqAtom(atom)) {
      let max = 0;
      for (const polynomial of atom.polynomials) {
        this.cache.mkUnique(polynomial);
        max = Math.max(max, this.pm.maxVar(polynomial));
      }
      atom.maxVar = max;
      return;
    }
    this.cache.mkUnique(atom.polynomial);
    atom.maxVar = this.pm.maxVar(atom.polynomial);
  }

  getAtom(literal: number) {
    return this.atoms[literal >> 1] ?? null;
  }

  getMaxVar(literal: number) {
    return this.getAtom(literal)?.maxVar ?? NULL_VAR;
  }

  getMaxVarOfLiterals(literals: readonly number[]) {
    let result = NULL_VAR;
    for (const literal of literals) {
      const atom = this.getAtom(literal);
      if (atom !== null && (result === NULL_VAR || atom.maxVar > result)) result = atom.maxVar;
    }
    return result;
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
    if (isIneqAtom(atom)) this.ineqAtoms.delete(this.getIneqKey(atom));
    else {
      this.rootAtoms.delete(this.rootKeys.get(boolVar)!);
      this.rootKeys.delete(boolVar);
    }
    this.atoms[boolVar] = null;
    this.hooks?.onDelete(boolVar);
    this.freeBoolVars.push(boolVar);
    if (isIneqAtom(atom)) for (const polynomial of atom.polynomials) this.pm.decRef(polynomial);
    else this.pm.decRef(atom.polynomial);
  }

  private getIneqKey(atom: Pick<IneqAtom, "kind" | "polynomials" | "isEven">) {
    return `${atom.kind},${atom.polynomials.map((polynomial, index) => `${polynomial.id}${atom.isEven[index] ? "e" : "o"}`).join(",")}`;
  }

  private getRootKey(atom: Pick<RootAtom, "kind" | "maxVar" | "index" | "polynomial">) {
    return `${atom.kind},${atom.maxVar},${atom.index},${atom.polynomial.id}`;
  }

  mkIneqAtom(kind: IneqKind, polynomials: readonly Polynomial[], isEven: readonly boolean[]) {
    let sign = 1;
    let maxVar = NULL_VAR;
    const p = new PolynomialRef(this.pm);
    const unique: Polynomial[] = [];
    for (let index = 0; index < polynomials.length; index++) {
      p.set(this.pm.flipSignIfLmNeg(polynomials[index]));
      if (p.get() !== polynomials[index] && !isEven[index]) sign = -sign;
      const variable = this.pm.maxVar(p.get());
      if (variable > maxVar || maxVar === NULL_VAR) maxVar = variable;
      unique.push(this.cache.mkUnique(p.get()));
    }
    const atom = {
      kind: sign < 0 ? flipKind(kind) : kind,
      boolVar: 0,
      maxVar,
      polynomials: unique,
      isEven: [...isEven],
    };
    const key = this.getIneqKey(atom);
    const existing = this.ineqAtoms.get(key);
    if (existing !== undefined) {
      p.reset();
      return existing.boolVar;
    }
    for (const polynomial of unique) this.pm.incRef(polynomial);
    p.reset();
    atom.boolVar = this.mkBoolVar();
    this.atoms[atom.boolVar] = atom;
    this.ineqAtoms.set(key, atom);
    return atom.boolVar;
  }

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

  mkRootAtom(kind: RootKind, variable: number, index: number, polynomial: Polynomial) {
    const p1 = new PolynomialRef(this.pm);
    const uniqP = new PolynomialRef(this.pm);
    p1.set(this.pm.flipSignIfLmNeg(polynomial));
    uniqP.set(this.cache.mkUnique(p1.get()));
    const atom = { kind, boolVar: 0, maxVar: variable, index, polynomial: uniqP.get() };
    const key = this.getRootKey(atom);
    const existing = this.rootAtoms.get(key);
    if (existing === undefined) {
      atom.boolVar = this.mkBoolVar();
      this.atoms[atom.boolVar] = atom;
      this.rootAtoms.set(key, atom);
      this.rootKeys.set(atom.boolVar, key);
      this.pm.incRef(atom.polynomial);
    }
    uniqP.reset();
    p1.reset();
    return existing === undefined ? atom.boolVar : existing.boolVar;
  }
}

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

export class ScopedLiteral {
  literal = TRUE_LITERAL;

  constructor(private table: AtomTable) {}

  set(literal: number) {
    this.table.incRef(literal);
    this.table.decRef(this.literal);
    this.literal = literal;
  }
}

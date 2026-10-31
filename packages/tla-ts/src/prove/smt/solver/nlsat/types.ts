// Ported from Z3 (src/nlsat/nlsat_types.h, src/nlsat/nlsat_clause.h), MIT license, see
// z3-license.txt. The atoms and clauses of nlsat. A literal is 2 * boolVar + sign, where sign 1
// negates the atom.
import type { Polynomial } from "./polynomial";

export type IneqKind = "EQ" | "LT" | "GT";
export type RootKind = "ROOT_EQ" | "ROOT_LT" | "ROOT_GT" | "ROOT_LE" | "ROOT_GE";

// p1 * ... * pn kind 0, where isEven[i] marks a factor of even degree, which only its zeros
// matter for. maxVar is the largest maximal variable of the factors.
export interface IneqAtom {
  kind: IneqKind;
  boolVar: number;
  maxVar: number;
  polynomials: Polynomial[];
  isEven: boolean[];
}

// x kind root[index](p): the index-th real root of p, from 1, as a polynomial in x at the values of
// the variables below x. maxVar is x.
export interface RootAtom {
  kind: RootKind;
  boolVar: number;
  maxVar: number;
  index: number;
  polynomial: Polynomial;
}

export type Atom = IneqAtom | RootAtom;

export interface Clause {
  id: number;
  literals: number[];
  isLearned: boolean;
}

export const isIneqAtom = (atom: Atom): atom is IneqAtom =>
  atom.kind === "EQ" || atom.kind === "LT" || atom.kind === "GT";

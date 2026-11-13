// Ported from Z3 (src/nlsat/nlsat_types.h, src/nlsat/nlsat_clause.h), MIT license, see
// z3-license.txt.
import type { Dependency } from "../lp/dependency";
import type { Polynomial } from "./polynomial";

export type IneqKind = "EQ" | "LT" | "GT";
export type RootKind = "ROOT_EQ" | "ROOT_LT" | "ROOT_GT" | "ROOT_LE" | "ROOT_GE";

export interface IneqAtom {
  kind: IneqKind;
  boolVar: number;
  maxVar: number;
  polynomials: Polynomial[];
  isEven: boolean[];
}

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
  assumptions: Dependency;
  isActive: boolean;
}

export const isIneqAtom = (atom: Atom): atom is IneqAtom =>
  atom.kind === "EQ" || atom.kind === "LT" || atom.kind === "GT";

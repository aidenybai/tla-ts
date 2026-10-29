// Ported from Isabelle2025's Pure/drule.ML, Pure/term_subst.ML and the basic rules of Pure.thy.
// Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

import { emptyNameContext, variantName, type NameContext } from "./name";
import { emptyTable, fastIndexnameOrd, tableEntries, updateTable, lookupTable, type IndexKey } from "./table";
import { allConst, mkEquals, mkImplies } from "./logic";
import { foldAterms, foldAtyps, foldTypes, mkAbs, mkApp, mkTVar, mkVar, propT, type Typ, type Var } from "./term";
import { normType, type TyEnv } from "./type";
import { axiomThm, instantiate, instantiateTypes, rs, type Instantiation, type Thm } from "./thm";

const propVar = (name: string) => mkVar(name, 0, propT);

// The basic rules of Pure.thy, with the variable names Isabelle gives them.
export const cutRl = axiomThm(
  mkImplies(mkImplies(propVar("psi"), propVar("theta")), mkImplies(propVar("psi"), propVar("theta"))),
);
export const revcutRl = axiomThm(
  mkImplies(propVar("V"), mkImplies(mkImplies(propVar("V"), propVar("W")), propVar("W"))),
);
export const thinRl = axiomThm(mkImplies(propVar("V"), mkImplies(propVar("W"), propVar("W"))));
export const asmRl = axiomThm(mkImplies(propVar("psi"), propVar("psi")));

const typeA = mkTVar("'a", 0);

export const impCong = axiomThm(
  mkImplies(
    mkImplies(propVar("A"), mkEquals(propVar("B"), propVar("C"))),
    mkEquals(mkImplies(propVar("A"), propVar("B")), mkImplies(propVar("A"), propVar("C"))),
  ),
);
export const swapPremsEq = axiomThm(
  mkEquals(
    mkImplies(propVar("A"), mkImplies(propVar("B"), propVar("C"))),
    mkImplies(propVar("B"), mkImplies(propVar("A"), propVar("C"))),
  ),
);
export const symmetricThm = axiomThm(
  mkImplies(mkEquals(mkVar("x", 0, typeA), mkVar("y", 0, typeA)), mkEquals(mkVar("y", 0, typeA), mkVar("x", 0, typeA))),
);
export const trivForallEquality = axiomThm(
  mkEquals(mkApp(allConst(typeA), mkAbs("x", typeA, propVar("V"))), propVar("V")),
);

const variantBound = (name: string, used: NameContext) => variantName(name.startsWith(":") ? "u" : name, used);

const fullProps = (thm: Thm) => [...thm.tpairs.flatMap((pair) => [pair[0], pair[1]]), thm.prop];

// Drule.zero_var_indexes: renames the schematic variables apart with index 0.
export const zeroVarIndexes = (thm: Thm): Thm => {
  const terms = fullProps(thm);
  const tvars = terms.reduce(
    (table, term) =>
      foldTypes(
        (type, inner) =>
          foldAtyps(
            (atom, current: typeof table) => (atom.kind === "TVar" ? updateTable(current, atom, atom) : current),
            type,
            inner,
          ),
        term,
        table,
      ),
    emptyTable<IndexKey, Typ>(fastIndexnameOrd),
  );
  let used = emptyNameContext;
  let tyenv: TyEnv = emptyTable(fastIndexnameOrd);
  for (const [key, type] of tableEntries(tvars)) {
    const [name, next] = variantBound(key.name, used);
    used = next;
    if (name !== key.name || key.index !== 0)
      tyenv = updateTable(tyenv, key, mkTVar(name, 0, type.kind === "TVar" ? type.sort : []));
  }
  const vars = terms.reduce(
    (table, term) =>
      foldAterms(
        (atom, current: typeof table) =>
          atom.kind === "Var" && lookupTable(current, atom) === undefined
            ? updateTable(current, atom, mkVar(atom.name, atom.index, normType(tyenv, atom.type)))
            : current,
        term,
        table,
      ),
    emptyTable<IndexKey, Var>(fastIndexnameOrd),
  );
  used = emptyNameContext;
  const insts: Instantiation[] = [];
  for (const [key, variable] of tableEntries(vars)) {
    const [name, next] = variantBound(key.name, used);
    used = next;
    if (name !== key.name || key.index !== 0)
      insts.push({ variable, term: mkVar(name, 0, variable.type) });
  }
  return instantiate(insts, instantiateTypes(tyenv, thm));
};

// Tactic.make_elim: turns a destruction rule into an elimination rule.
export const makeElim = (rule: Thm) => zeroVarIndexes(rs(rule, revcutRl));

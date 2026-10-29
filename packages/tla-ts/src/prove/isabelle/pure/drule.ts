// Ported from Isabelle2025's Pure/drule.ML, Pure/term_subst.ML and the basic rules of Pure.thy.
// Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

import { cleanName, emptyNameContext, variantList, variantName, type NameContext } from "./name";
import {
  emptyTable,
  fastIndexnameOrd,
  tableEntries,
  updateTable,
  lookupTable,
  type IndexKey,
} from "./table";
import { TlaIsabelleError } from "../../../errors";
import { allConst, isProtected, mkEquals, mkImplies, mkTerm, protect } from "./logic";
import { listOfSeq } from "./seq";
import { eqThm } from "./tactical";
import {
  foldVars,
  foldAtyps,
  foldTypes,
  funT,
  mkAbs,
  mkApp,
  mkBound,
  mkTVar,
  mkVar,
  propT,
  stripAllVars,
  type Term,
  type Typ,
  type Var,
} from "./term";
import { normType, type TyEnv } from "./type";
import {
  axiomThm,
  bicompose,
  forallElim,
  forallIntr,
  incrIndexesThm,
  instantiate,
  instantiateTypes,
  rs,
  type Instantiation,
  type Thm,
} from "./thm";

const propVar = (name: string) => mkVar(name, 0, propT);

// The basic rules of Pure.thy, with the variable names Isabelle gives them.
export const cutRl = axiomThm(
  mkImplies(
    mkImplies(propVar("psi"), propVar("theta")),
    mkImplies(propVar("psi"), propVar("theta")),
  ),
);
export const revcutRl = axiomThm(
  mkImplies(propVar("V"), mkImplies(mkImplies(propVar("V"), propVar("W")), propVar("W"))),
);
export const thinRl = axiomThm(mkImplies(propVar("V"), mkImplies(propVar("W"), propVar("W"))));
export const asmRl = axiomThm(mkImplies(propVar("psi"), propVar("psi")));
export const remdupsRl = axiomThm(
  mkImplies(propVar("phi"), mkImplies(propVar("phi"), mkImplies(propVar("psi"), propVar("psi")))),
);
export const protectI = axiomThm(mkImplies(propVar("A"), protect(propVar("A"))));
export const protectD = axiomThm(mkImplies(protect(propVar("A")), propVar("A")));
export const reflexiveThm = axiomThm(
  mkEquals(mkVar("x", 0, mkTVar("'a", 0)), mkVar("x", 0, mkTVar("'a", 0))),
);

const typeA = mkTVar("'a", 0);

export const termI = axiomThm(mkTerm(mkVar("x", 0, typeA)));

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
  mkImplies(
    mkEquals(mkVar("x", 0, typeA), mkVar("y", 0, typeA)),
    mkEquals(mkVar("y", 0, typeA), mkVar("x", 0, typeA)),
  ),
);
export const trivForallEquality = axiomThm(
  mkEquals(mkApp(allConst(typeA), mkAbs("x", typeA, propVar("V"))), propVar("V")),
);

// Drule.norm_hhf_eq: (PROP ?phi ==> (!!x. PROP ?psi x)) == (!!x. PROP ?phi ==> PROP ?psi x).
export const normHhfEq = axiomThm(
  mkEquals(
    mkImplies(
      propVar("phi"),
      mkApp(
        allConst(typeA),
        mkAbs("x", typeA, mkApp(mkVar("psi", 0, funT(typeA, propT)), mkBound(0))),
      ),
    ),
    mkApp(
      allConst(typeA),
      mkAbs(
        "x",
        typeA,
        mkImplies(propVar("phi"), mkApp(mkVar("psi", 0, funT(typeA, propT)), mkBound(0))),
      ),
    ),
  ),
);

// Drule.is_norm_hhf: no quantifier right of an implication and no beta redex.
export const isNormHhf = (isProtecting: boolean, term: Term): boolean => {
  if (term.kind === "Const") return term.name !== "Pure.sort_constraint";
  if (term.kind === "Abs") return isNormHhf(isProtecting, term.body);
  if (term.kind !== "App") return true;
  if (term.fun.kind === "Abs") return false;
  if (
    term.fun.kind === "App" &&
    term.fun.fun.kind === "Const" &&
    term.fun.fun.name === "Pure.imp" &&
    term.arg.kind === "App" &&
    term.arg.fun.kind === "Const" &&
    term.arg.fun.name === "Pure.all"
  )
    return false;
  if (isProtected(term)) return isProtecting || isNormHhf(isProtecting, term.arg);
  return isNormHhf(isProtecting, term.fun) && isNormHhf(isProtecting, term.arg);
};

// Drule.outer_params: the outermost parameters, named apart.
export const outerParams = (term: Term) => {
  const vars = stripAllVars(term);
  const names = variantList(
    [],
    vars.map((variable) => cleanName(variable.name)),
  );
  return vars.map((variable, index) => ({ name: names[index], type: variable.type }));
};

// Variable.gen_all: the outermost parameters become schematic variables.
export const genAll = (thm: Thm) => {
  const index = Math.max(thm.maxidx, -1) + 1;
  return outerParams(thm.prop).reduce(
    (result, param) => forallElim(mkVar(param.name, index, param.type), result),
    thm,
  );
};

// Thm.forall_intr_vars: quantifies the schematic variables in order of appearance.
export const forallIntrVars = (thm: Thm) => {
  const vars = fullProps(thm).reduce(
    (result, term) =>
      foldVars(
        (atom, current: Var[]) =>
          !current.some((other) => other.name === atom.name && other.index === atom.index)
            ? [...current, atom]
            : current,
        term,
        result,
      ),
    [] as Var[],
  );
  return vars.reduceRight((result, variable) => forallIntr(variable, result), thm);
};

const variantBound = (name: string, used: NameContext) =>
  variantName(name.startsWith(":") ? "u" : name, used);

const fullProps = (thm: Thm) => [...thm.tpairs.flatMap((pair) => [pair[0], pair[1]]), thm.prop];

// Drule.zero_var_indexes: renames the schematic variables apart with index 0.
export const zeroVarIndexes = (thm: Thm): Thm => {
  const terms = fullProps(thm);
  const tvars = terms.reduce(
    (table, term) =>
      foldTypes(
        (type, inner) =>
          foldAtyps(
            (atom, current: typeof table) =>
              atom.kind === "TVar" ? updateTable(current, atom, atom) : current,
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
      foldVars(
        (atom, current: typeof table) =>
          lookupTable(current, atom) === undefined
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

// Drule.compose: resolves tha into premise index of thb without lifting, with a unique result.
export const compose = (tha: Thm, index: number, thb: Thm): Thm => {
  const results = listOfSeq(
    bicompose(
      undefined,
      { flatten: true, match: false, incremented: true },
      { isElim: false, rule: tha, subgoals: 0 },
      index,
      thb,
    ),
  ).filter((result, position, all) => all.findIndex((other) => eqThm(other, result)) === position);
  if (results.length !== 1)
    throw new TlaIsabelleError("THM", `compose: unique result expected ${index}`);
  return results[0];
};

// COMP_INCR
export const compIncr = (tha: Thm, thb: Thm) =>
  compose(tha, 1, incrIndexesThm(tha.maxidx + 1, thb));

// Drule.comp_no_flatten: composes th, keeping its first count premises, into premise index of
// rule.
export const compNoFlatten = (thm: Thm, count: number, index: number, rule: Thm): Thm => {
  const results = listOfSeq(
    bicompose(
      undefined,
      { flatten: false, match: false, incremented: true },
      { isElim: false, rule: thm, subgoals: count },
      index,
      incrIndexesThm(thm.maxidx + 1, rule),
    ),
  ).filter((result, position, all) => all.findIndex((other) => eqThm(other, result)) === position);
  if (results.length !== 1) throw new TlaIsabelleError("THM", `comp_no_flatten ${index}`);
  return results[0];
};

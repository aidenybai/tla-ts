// Ported from Isabelle2025's Pure/conv.ML, conversions: functions from a term to a theorem that
// it equals another. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet
// Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { destEquals, destImplies, implies, isImplies } from "./logic";
import { declareName, makeNameContext, variantName, type NameContext } from "./name";
import { aconv, addFreeNames, mkFree, substBound, type Term } from "./term";
import {
  abstractRule,
  combination,
  equalElim,
  nprems,
  permutePrems,
  premOf,
  reflexive,
  type Thm,
} from "./thm";

export type Conversion = (term: Term) => Thm;

const isReflexive = (eq: Thm) => {
  const [lhs, rhs] = destEquals(eq.prop);
  return aconv(lhs, rhs);
};

// Drule.imp_cong_rule
export const impCongRule = (first: Thm, second: Thm) =>
  combination(combination(reflexive(implies), first), second);

// Conv.prems_conv ~1: converts every premise.
export const premsConv =
  (convert: Conversion): Conversion =>
  (term) =>
    isImplies(term)
      ? impCongRule(convert(destImplies(term)[0]), premsConv(convert)(destImplies(term)[1]))
      : reflexive(term);

// Conv.params_conv ~1: converts the body under every outer parameter, fixed as a fresh free
// variable.
export const paramsConv = (convert: Conversion): Conversion => {
  const under =
    (names: NameContext): Conversion =>
    (term) => {
      if (
        term.kind !== "App" ||
        term.fun.kind !== "Const" ||
        term.fun.name !== "Pure.all" ||
        term.arg.kind !== "Abs"
      )
        return convert(term);
      const abs = term.arg;
      const [name, nextNames] = variantName(abs.name, names);
      const free = mkFree(name, abs.type);
      const eq = under(declareName(name, nextNames))(substBound(free, abs.body));
      return isReflexive(eq)
        ? reflexive(term)
        : combination(reflexive(term.fun), abstractRule(abs.name, free, eq));
    };
  return (term) => under(makeNameContext(addFreeNames(term, [])))(term);
};

// Conv.gconv_rule: converts goal index of a state.
export const gconvRule = (convert: Conversion, index: number, state: Thm): Thm => {
  if (index < 1 || index > nprems(state)) throw new TlaIsabelleError("THM", `gconv_rule ${index}`);
  const eq = convert(premOf(state, index));
  if (isReflexive(eq)) return state;
  const rotated = permutePrems(0, index - 1, state);
  const rest = rotated.prop;
  if (!isImplies(rest)) throw new TlaIsabelleError("THM", "gconv_rule");
  const converted = equalElim(impCongRule(eq, reflexive(destImplies(rest)[1])), rotated);
  return permutePrems(0, 1 - index, converted);
};

// Conv.fconv_rule: converts a theorem's proposition.
export const fconvRule = (convert: Conversion, thm: Thm): Thm => {
  const eq = convert(thm.prop);
  return isReflexive(eq) ? thm : equalElim(eq, thm);
};

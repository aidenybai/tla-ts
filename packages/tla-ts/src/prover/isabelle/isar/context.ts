// Ported from Isabelle2025's Pure/Isar/proof_context.ML, Pure/variable.ML and Pure/assumption.ML.
// Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { protectD } from "../pure/drule";
import { above, betaNorm, emptyEnvir, normTerm, type Envir } from "../pure/envir";
import type { Limits } from "../pure/interrupt";
import { incrIndexes, protect } from "../pure/logic";
import { filterSeq, seqHead } from "../pure/seq";
import { normHhf, normHhfProtect } from "../pure/simplifier";
import {
  fastypeOf,
  mapAtyps,
  mapTypes,
  maxidxOfTerm,
  mkTVar,
  mkVar,
  propT,
  updateAbs,
  updateApp,
  type Term,
  type Typ,
  type Var,
} from "../pure/term";
import { assume, generalize, impliesElim, impliesIntr, instantiate, type Thm } from "../pure/thm";
import { smashUnifiers } from "../pure/unify";
import type { ConstInfo } from "../tla/logic";
import { parseProp, parseTerm } from "./inner-syntax";
import { checkProps } from "./type-check";

export interface NameScope {
  readonly consts: ReadonlyMap<string, ConstInfo>;
  readonly constNames: ReadonlyMap<string, string>;
}

interface Assumption {
  // Assumption.assume_export discharges a goal's assumption as a protected premise, presume_export
  // never does.
  readonly isPresumed: boolean;
  readonly props: readonly Term[];
}

export interface IsarContext {
  readonly scope: NameScope;
  readonly getGlobalFact: (name: string) => readonly Thm[];
  readonly limits: Limits;
  readonly fixes: readonly string[];
  // Variable.default_type: the types of the free variables the context declares.
  readonly types: ReadonlyMap<string, Typ>;
  readonly assumptions: readonly Assumption[];
  readonly facts: ReadonlyMap<string, readonly Thm[]>;
  readonly binds: ReadonlyMap<string, Term>;
  // Variable.is_body: statements in a proof body fix none of their free variables.
  readonly isBody: boolean;
}

export type ReadMode = "default" | "schematic" | "pattern";

const bindKey = (name: string, index: number) => `${name}.${index}`;

export const getFact = (context: IsarContext, name: string): readonly Thm[] =>
  context.facts.get(name) ?? context.getGlobalFact(name);

export const putFacts = (
  context: IsarContext,
  name: string,
  thms: readonly Thm[],
): IsarContext => ({ ...context, facts: new Map([...context.facts, [name, thms]]) });

const freeNames = (term: Term, names: string[] = []): string[] => {
  if (term.kind === "Free" && !names.includes(term.name)) names.push(term.name);
  if (term.kind === "Abs") freeNames(term.body, names);
  if (term.kind === "App") {
    freeNames(term.fun, names);
    freeNames(term.arg, names);
  }
  return names;
};

const freeTypes = (term: Term, types: Map<string, Typ>): Map<string, Typ> => {
  if (term.kind === "Free" && !types.has(term.name)) types.set(term.name, term.type);
  if (term.kind === "Abs") freeTypes(term.body, types);
  if (term.kind === "App") {
    freeTypes(term.fun, types);
    freeTypes(term.arg, types);
  }
  return types;
};

// Variable.declare_term: a term's free variables keep their types.
export const declareTerm = (context: IsarContext, term: Term): IsarContext => ({
  ...context,
  types: freeTypes(term, new Map(context.types)),
});

export const addFixes = (context: IsarContext, names: readonly string[]): IsarContext => {
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate !== undefined)
    throw new TlaIsabelleError("ERROR", `Duplicate fixed variable(s): ${duplicate}`);
  return { ...context, fixes: [...context.fixes, ...names] };
};

// Proof_Context.augment: outside a proof body, a statement fixes its free variables.
export const augment = (context: IsarContext, term: Term): IsarContext =>
  declareTerm(
    context.isBody
      ? context
      : addFixes(
          context,
          freeNames(term).filter((name) => !context.fixes.includes(name)),
        ),
    term,
  );

export const bindTerm = (context: IsarContext, name: string, index: number, term: Term) =>
  declareTerm(
    { ...context, binds: new Map([...context.binds, [bindKey(name, index), term]]) },
    term,
  );

// Variable.expand_binds.
const expandBinds = (context: IsarContext, term: Term): Term => {
  const expand = (current: Term): Term => {
    switch (current.kind) {
      case "Var":
        return context.binds.get(bindKey(current.name, current.index)) ?? current;
      case "Abs":
        return updateAbs(current, expand(current.body));
      case "App":
        return updateApp(current, expand(current.fun), expand(current.arg));
      default:
        return current;
    }
  };
  return betaNorm(expand(term));
};

// Syntax.read_props and Syntax.read_terms in a mode: an item without a type is a proposition.
export const readTerms = (
  context: IsarContext,
  items: readonly { readonly text: string; readonly type?: Typ }[],
  mode: ReadMode,
): Term[] => {
  const checked = checkProps(
    context.scope,
    items.map((item) => ({
      ast: item.type === undefined ? parseProp(item.text) : parseTerm(item.text),
      fixed: new Set(context.fixes),
      type: item.type,
    })),
    {
      fixedTypes: context.types,
      varTypes:
        mode === "pattern"
          ? undefined
          : (name, index) => {
              const bound = context.binds.get(bindKey(name, index));
              return bound === undefined ? undefined : fastypeOf(bound);
            },
      isPattern: mode === "pattern",
    },
  );
  if (mode === "pattern") return checked;
  const expanded = checked.map((term) => expandBinds(context, term));
  if (mode === "default" && expanded.some((term) => varsOf(term).length > 0))
    throw new TlaIsabelleError("ERROR", "Unbound schematic variable");
  return expanded;
};

// Unify.matchers: the variables that the patterns bring, above the object's, move back down.
const decrIndexes = (term: Term, maxidx: number, offset: number): Term => {
  const decrType = (type: Typ) =>
    mapAtyps(
      (atom) =>
        atom.kind === "TVar" && atom.index > maxidx
          ? mkTVar(atom.name, atom.index - offset, atom.sort)
          : atom,
      type,
    );
  const decrVars = (current: Term): Term => {
    switch (current.kind) {
      case "Var":
        return current.index > maxidx
          ? mkVar(current.name, current.index - offset, current.type)
          : current;
      case "Abs":
        return updateAbs(current, decrVars(current.body));
      case "App":
        return updateApp(current, decrVars(current.fun), decrVars(current.arg));
      default:
        return current;
    }
  };
  return decrVars(mapTypes(decrType, term));
};

const varsOf = (term: Term, found: Var[] = []): Var[] => {
  if (
    term.kind === "Var" &&
    !found.some((other) => other.name === term.name && other.index === term.index)
  )
    found.push(term);
  if (term.kind === "Abs") varsOf(term.body, found);
  if (term.kind === "App") {
    varsOf(term.fun, found);
    varsOf(term.arg, found);
  }
  return found;
};

// Proof_Context.simult_matches by Unify.matchers: the patterns match by a unifier that leaves the
// object's variables alone, and the first one binds.
export const simultMatches = (
  context: IsarContext,
  object: Term,
  patterns: readonly Term[],
): [string, number, Term][] => {
  const maxidx = maxidxOfTerm(object);
  const offset = maxidx + 1;
  const pairs = patterns.map((pattern): [Term, Term] => [incrIndexes([], offset, pattern), object]);
  const envir = seqHead(
    filterSeq(
      (candidate: Envir) => above(candidate, maxidx),
      smashUnifiers(
        context.limits,
        pairs,
        emptyEnvir(pairs.reduce((result, pair) => Math.max(result, maxidxOfTerm(pair[0])), maxidx)),
      ),
    ),
  );
  if (envir === undefined) throw new TlaIsabelleError("ERROR", "Pattern match failed!");
  return pairs
    .reduce<Var[]>((found, pair) => varsOf(pair[0], found), [])
    .flatMap((variable): [string, number, Term][] => {
      const normalized = normTerm(envir, variable);
      return normalized.kind === "Var" &&
        normalized.name === variable.name &&
        normalized.index === variable.index
        ? []
        : [[variable.name, variable.index - offset, decrIndexes(normalized, maxidx, offset)]];
    });
};

// Assumption.add_assms: each proposition becomes a hypothesis.
export const addAssumptions = (
  context: IsarContext,
  isPresumed: boolean,
  props: readonly Term[],
): [Thm[], IsarContext] => [
  props.map((prop) => normHhf(context.limits, assume(prop))),
  { ...context, assumptions: [...context.assumptions, { isPresumed, props }] },
];

export const assumptionsOf = (context: IsarContext) =>
  context.assumptions.flatMap((assumption) => assumption.props);

// Drule.implies_intr_protected.
const impliesIntrProtected = (props: readonly Term[], thm: Thm): Thm =>
  props.reduceRight(
    (result, prop) => impliesIntr(protect(prop), result),
    props.reduce(
      (result, prop) =>
        impliesElim(
          result,
          impliesElim(
            instantiate([{ variable: mkVar("A", 0, propT), term: prop }], protectD),
            assume(protect(prop)),
          ),
        ),
      props.reduceRight((result, prop) => impliesIntr(prop, result), thm),
    ),
  );

// Proof_Context.export_: Assumption.export, then Variable.export.
export const exportThm = (
  inner: IsarContext,
  outer: IsarContext,
  isGoal: boolean,
  thm: Thm,
): Thm => {
  const discharged = normHhfProtect(
    inner.limits,
    inner.assumptions
      .slice(outer.assumptions.length)
      .reduceRight(
        (result, assumption) =>
          isGoal && !assumption.isPresumed
            ? impliesIntrProtected(assumption.props, result)
            : assumption.props.reduceRight((current, prop) => impliesIntr(prop, current), result),
        normHhfProtect(inner.limits, thm),
      ),
  );
  return generalize(
    inner.fixes.filter((name) => !outer.fixes.includes(name)),
    discharged.maxidx + 1,
    discharged,
  );
};

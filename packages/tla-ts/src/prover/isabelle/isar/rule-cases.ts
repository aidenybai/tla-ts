// Ported from Isabelle2025's Pure/Isar/rule_cases.ML. Copyright (c) 1986-2025 University of
// Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.
// The cases here are common ones: no rule structure outlines nested cases.

import { TlaIsabelleError } from "../../../errors";
import { isNormHhf, multiResolves } from "../pure/drule";
import type { Limits } from "../pure/interrupt";
import {
  isImplies,
  listImplies,
  stripAssumsConcl,
  stripAssumsHyp,
  stripImpConcl,
  stripImpPrems,
  stripParams,
} from "../pure/logic";
import { cleanName } from "../pure/name";
import { mapSeq, type Seq } from "../pure/seq";
import { normHhf } from "../pure/simplifier";
import { betapplys, mkAbs, mkApp, type Term, type Typ } from "../pure/term";
import { assume, nprems, renamedProp, type Thm } from "../pure/thm";

export type Tags = readonly (readonly [string, string])[];

// A rule with the tags that Rule_Cases reads off it.
export interface CasesRule {
  readonly rule: Thm;
  readonly tags: Tags;
}

export interface RuleCase {
  readonly fixes: readonly { readonly name: string; readonly type: Typ }[];
  readonly assumes: readonly { readonly name: string; readonly props: readonly Term[] }[];
  readonly binds: readonly {
    readonly name: string;
    readonly index: number;
    readonly term: Term | undefined;
  }[];
  readonly cases: readonly { readonly name: string; readonly case: RuleCase }[];
}

export type Cases = readonly { readonly name: string; readonly case: RuleCase | undefined }[];

export type CaseInfo = readonly {
  readonly name: string;
  readonly hyps: readonly string[];
  readonly concls: readonly string[];
}[];

const CASE_CONCL = "case";

const lookupTag = (tags: Tags, name: string) => tags.find((tag) => tag[0] === name)?.[1];

const explodeArgs = (text: string) => (text === "" ? [] : text.split(";"));

const readNat = (tags: Tags, name: string) => {
  const text = lookupTag(tags, name);
  if (text === undefined) return undefined;
  if (!/^[0-9]+$/.test(text))
    throw new TlaIsabelleError("THM", `Malformed '${name}' tag of theorem`);
  return Number(text);
};

const getCaseConcls = (tags: Tags, name: string) => {
  for (const tag of tags) {
    if (tag[0] !== "case_conclusion") continue;
    const args = explodeArgs(tag[1]);
    if (args.length > 0 && args[0] === name) return args.slice(1);
  }
  return [];
};

export const getConstraints = (tags: Tags) => readNat(tags, "constraints") ?? 0;

// Rule_Cases.get: the cases a rule names, which are its premises after those it consumes.
export const getCases = (rule: CasesRule): [CaseInfo, number] => {
  const consumes = readNat(rule.tags, "consumes") ?? 0;
  const names = lookupTag(rule.tags, "case_names");
  const cases =
    names === undefined
      ? Array.from({ length: Math.max(nprems(rule.rule) - consumes, 0) }, (_, index) => ({
          name: String(index + 1),
          concls: [] as string[],
        }))
      : explodeArgs(names).map((name) => ({ name, concls: getCaseConcls(rule.tags, name) }));
  const hypNames = lookupTag(rule.tags, "cases_hyp_names");
  const hyps =
    hypNames === undefined
      ? cases.map(() => [])
      : explodeArgs(hypNames).map((names) => {
          if (!names.endsWith(","))
            throw new TlaIsabelleError("ERROR", "Malformed cases_hyp_names tag of theorem");
          return names === "," ? [] : names.slice(0, -1).split(",");
        });
  if (hyps.length !== cases.length)
    throw new TlaIsabelleError("ERROR", "Malformed cases_hyp_names tag of theorem");
  return [
    cases.map((entry, index) => ({ name: entry.name, hyps: hyps[index], concls: entry.concls })),
    consumes,
  ];
};

const destConjunctions = (term: Term): Term[] =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.conjunction"
    ? [...destConjunctions(term.fun.arg), ...destConjunctions(term.arg)]
    : [term];

// Object_Logic.drop_judgment
export const dropJudgment = (term: Term) =>
  term.kind === "App" && term.fun.kind === "Const" && term.fun.name === "PredicateLogic.Trueprop"
    ? term.arg
    : term;

const destSkolem = (name: string) => (name.endsWith("__") ? name.slice(0, -2) : name);

const destBinops = (concls: readonly string[], term: Term): [string, Term][] => {
  const dest = (count: number, current: Term): Term[] => {
    if (count === 0) return [];
    if (count === 1) return [current];
    if (current.kind === "App" && current.fun.kind === "App")
      return [current.fun.arg, ...dest(count - 1, current.arg)];
    throw new TlaIsabelleError("TERM", `Expected ${concls.length} binop arguments`);
  };
  return dest(concls.length, term).map((arg, index) => [concls[index], arg]);
};

// Rule_Cases.extract_case without an outline: the parameters become the case's fixes, the
// hypotheses its assumptions and the conclusion ?case.
const extractCase = (
  limits: Limits,
  rawProp: Term,
  concls: readonly string[],
): RuleCase | undefined => {
  const props = destConjunctions(
    isNormHhf(false, rawProp) ? rawProp : normHhf(limits, assume(rawProp)).prop,
  );
  if (props.length !== 1) return undefined;
  const prop = props[0];
  const fixes = stripParams(prop).map((param) => ({
    name: destSkolem(param.name),
    type: param.type,
  }));
  const absFixes = (term: Term) =>
    fixes.reduceRight((body, fix) => mkAbs(fix.name, fix.type, body), term);
  const concl = dropJudgment(stripAssumsConcl(prop));
  return {
    fixes,
    assumes: [{ name: "", props: stripAssumsHyp(prop).flatMap(destConjunctions).map(absFixes) }],
    binds: [[CASE_CONCL, concl] as [string, Term], ...destBinops(concls, concl)].map((bind) => ({
      name: bind[0],
      index: 0,
      term: absFixes(bind[1]),
    })),
    cases: [],
  };
};

// Rule_Cases.make_common: the i-th case of n comes from the i-th premise.
export const makeCommon = (limits: Limits, prop: Term, info: CaseInfo): Cases => {
  const prems = stripImpPrems(prop);
  const kept = info.slice(Math.max(info.length - prems.length, 0));
  return kept.map((entry, position) => {
    const premise = prems[info.length - kept.length + position];
    return {
      name: entry.name,
      case: premise === undefined ? undefined : extractCase(limits, premise, entry.concls),
    };
  });
};

// Rule_Cases.apply: the case's terms, abstracted over its fixes, applied to their values.
export const applyCase = (args: readonly Term[], ruleCase: RuleCase): RuleCase => ({
  fixes: ruleCase.fixes,
  assumes: ruleCase.assumes.map((assumption) => ({
    name: assumption.name,
    props: assumption.props.map((prop) => betapplys(prop, args)),
  })),
  binds: ruleCase.binds.map((bind) => ({
    ...bind,
    term: bind.term === undefined ? undefined : betapplys(bind.term, args),
  })),
  cases: ruleCase.cases.map((entry) => ({ name: entry.name, case: applyCase(args, entry.case) })),
});

// Rule_Cases.consume: the rule's first premises take up the facts it consumes.
export const consume = <Info>(
  limits: Limits,
  facts: readonly Thm[],
  info: Info,
  count: number,
  rule: Thm,
): Seq<[Info, number, readonly Thm[], Thm]> => {
  const taken = Math.min(facts.length, count);
  return mapSeq(
    (result: Thm): [Info, number, readonly Thm[], Thm] => [
      info,
      count - taken,
      facts.slice(taken),
      result,
    ],
    multiResolves(limits, facts.slice(0, taken), [rule]),
  );
};

const renameParams = (names: readonly string[], term: Term): Term => {
  if (names.length === 0) return term;
  if (isImplies(term)) return mkApp(term.fun, renameParams(names, term.arg));
  if (
    term.kind === "App" &&
    term.fun.kind === "Const" &&
    term.fun.name === "Pure.all" &&
    term.arg.kind === "Abs"
  )
    return mkApp(
      term.fun,
      mkAbs(names[0], term.arg.type, renameParams(names.slice(1), term.arg.body)),
    );
  return term;
};

// Rule_Cases.internalize_params: unless the rule's cases are open, their parameters get internal
// names, which a case binds only under the names it is given.
export const internalizeParams = (rule: CasesRule): Thm => {
  if (lookupTag(rule.tags, "cases_open") !== undefined) return rule.rule;
  const renamed = stripImpPrems(rule.rule.prop).map((prem) =>
    renameParams(
      stripParams(prem).map((param) => `${cleanName(param.name)}_`),
      prem,
    ),
  );
  return renamedProp(listImplies(renamed, stripImpConcl(rule.rule.prop)), rule.rule);
};

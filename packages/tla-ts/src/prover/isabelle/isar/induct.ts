// Ported from Isabelle2025's Tools/induct.ML: the cases method, as PredicateLogic.thy instantiates
// Induct. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { fconvRule, premsConv } from "../pure/conv";
import { asmRl, compIncr, normHhfEq } from "../pure/drule";
import { emptyNet, insertTermNet, unifyTermNet, type Net } from "../pure/net";
import { addSimps, emptySimpset } from "../pure/raw-simplifier";
import { rewriteCterm } from "../pure/rewriter";
import { mapSeq, mapsSeq, seqOfList, singleSeq, type Seq } from "../pure/seq";
import { matchTac, resolveTac } from "../pure/tactic";
import { allTac, thenAllNew, tryTac, type GoalTactic } from "../pure/tactical";
import {
  aconv,
  dummyT,
  existsSubterm,
  fastypeOf,
  listComb,
  mkConst,
  mkFree,
  mkTVar,
  mkVar,
  type Term,
  type Typ,
  type Var,
} from "../pure/term";
import {
  conclOf,
  instantiate,
  instantiateTypes,
  majorPremOf,
  premsOf,
  type Thm,
} from "../pure/thm";
import { emptyTyEnv, normType, unifyTypes, type TyEnv } from "../pure/type";
import { stripAssumsConcl } from "../pure/logic";
import { getThms, parseFactReferences } from "./attrib";
import { readTerms, updateCases, type IsarContext } from "./context";
import type { Method } from "./method";
import { insertTac } from "./proof";
import {
  consume,
  dropJudgment,
  getCases,
  getConstraints,
  internalizeParams,
  makeCommon,
  type CaseInfo,
  type CasesRule,
} from "./rule-cases";
import type { OuterToken } from "./theory";

export interface NamedCasesRule {
  readonly name: string;
  readonly rule: CasesRule;
}

export interface InductData {
  // Newest first, as Item_Net.content lists them.
  readonly casesType: readonly NamedCasesRule[];
  readonly casesPred: readonly NamedCasesRule[];
  readonly casesDefault: CasesRule;
  readonly trivialRule: Thm;
  // The theorems of a fact of the logic with their tags.
  readonly getTaggedFact: (name: string) => readonly CasesRule[] | undefined;
  // Whether some fact of the logic tags this theorem.
  readonly isTagged: (thm: Thm) => boolean;
}

interface CasesArgs {
  readonly isSimp: boolean;
  readonly insts: readonly (readonly (Term | undefined)[])[];
  readonly rule: CasesRule | undefined;
}

const error = (message: string) => new TlaIsabelleError("ERROR", message);

const syntaxError = (token: OuterToken | undefined) =>
  error(`Outer syntax error at: ${token === undefined ? "end of input" : token.text}`);

const isInductConst = (term: Term) =>
  term.kind === "Const" && term.name.startsWith("PredicateLogic.cases_");

// Induct.vars_of: the variables left to right, each where it occurs last.
const varsOf = (term: Term): Var[] => {
  const occurrences: Var[] = [];
  const visit = (current: Term) => {
    if (current.kind === "Var") occurrences.unshift(current);
    if (current.kind === "Abs") visit(current.body);
    if (current.kind === "App") {
      visit(current.fun);
      visit(current.arg);
    }
  };
  visit(term);
  return occurrences
    .filter(
      (variable, index) =>
        occurrences.findIndex(
          (other) => other.name === variable.name && other.index === variable.index,
        ) === index,
    )
    .reverse();
};

// Net.encode_type: a type as a term, for indexing.
const encodeType = (type: Typ): Term => {
  switch (type.kind) {
    case "Type":
      return listComb(mkConst(type.name, dummyT), type.args.map(encodeType));
    case "TFree":
      return mkFree(type.name, dummyT);
    case "TVar":
      return mkVar(type.name, type.index, dummyT);
  }
};

const leftVarPrem = (rule: Thm): Term => {
  const prems = premsOf(rule);
  const variable = prems.length === 0 ? undefined : varsOf(prems[0])[0];
  if (variable === undefined)
    throw new TlaIsabelleError("THM", "No variables in major premise of rule");
  return encodeType(variable.type);
};

// Item_Net.retrieve: the rules whose index could unify with the term, newest first.
const retrieve = (
  rules: readonly NamedCasesRule[],
  index: (rule: Thm) => Term,
  term: Term,
): CasesRule[] =>
  unifyTermNet(
    rules.reduce<Net<number>>(
      (net, entry, position) => insertTermNet(index(entry.rule.rule), position, net),
      emptyNet,
    ),
    term,
  )
    .sort((left, right) => left - right)
    .map((position) => rules[position].rule);

const lookupRule = (rules: readonly NamedCasesRule[], kind: string, name: string): CasesRule => {
  const found = rules.find((entry) => entry.name === name || entry.name.endsWith(`.${name}`));
  if (found === undefined) throw error(`No rule for ${kind} "${name}"`);
  return found.rule;
};

// Object_Logic.elim_concl: an elimination rule concludes a variable that a premise concludes.
const isElimRule = (rule: Thm) =>
  dropJudgment(conclOf(rule)).kind === "Var" &&
  premsOf(rule).some((prem) => aconv(conclOf(rule), stripAssumsConcl(prem)));

const readRule = (isar: IsarContext, tokens: readonly OuterToken[]): CasesRule => {
  const induct = isar.tactics.induct;
  const [keyword, colon, ...rest] = tokens;
  if (colon?.kind !== "symbol" || colon.text !== ":") throw syntaxError(colon);
  if (keyword.text === "rule") {
    const references = parseFactReferences(rest);
    const thms = getThms(isar, references);
    if (thms.length !== 1) throw error("Single rule expected");
    if (references[0].attributes.length > 0) throw error("Unsupported cases rule with attributes");
    const tagged = induct
      .getTaggedFact(references[0].name)
      ?.find((entry) => entry.rule === thms[0] && !isar.facts.has(references[0].name));
    return tagged ?? { rule: thms[0], tags: [] };
  }
  const name = rest[0];
  if (name === undefined || rest.length !== 1 || name.kind === "symbol") throw syntaxError(name);
  if (keyword.text === "type") return lookupRule(induct.casesType, "type", name.text);
  if (keyword.text === "pred" || keyword.text === "set")
    return lookupRule(
      induct.casesPred,
      keyword.text,
      isar.scope.constNames.get(name.text) ?? name.text,
    );
  throw syntaxError(keyword);
};

const RULE_KEYWORDS = new Set(["arbitrary", "taking", "type", "pred", "set", "rule"]);

// The cases method's syntax: (no_simp)?, instantiations separated by "and", then a rule.
const parseCasesArgs = (isar: IsarContext, tokens: readonly OuterToken[]): CasesArgs => {
  const isSymbol = (position: number, text: string) =>
    tokens[position]?.kind === "symbol" && tokens[position].text === text;
  const isSimp = !(
    isSymbol(0, "(") &&
    tokens[1]?.kind === "word" &&
    tokens[1].text === "no_simp" &&
    isSymbol(2, ")")
  );
  let position = isSimp ? 0 : 3;
  const insts: (Term | undefined)[][] = [[]];
  while (
    position < tokens.length &&
    !(RULE_KEYWORDS.has(tokens[position].text) && isSymbol(position + 1, ":"))
  ) {
    const token = tokens[position];
    position += 1;
    if (token.kind === "word" && token.text === "and") insts.push([]);
    else if (token.kind === "word" && token.text === "_") insts[insts.length - 1].push(undefined);
    else if (token.kind === "symbol") throw syntaxError(token);
    else
      insts[insts.length - 1].push(
        readTerms(
          isar,
          [
            {
              text:
                token.kind === "cartouche"
                  ? token.text.slice("\\<open>".length, -"\\<close>".length)
                  : token.text,
              type: mkTVar("'a", 0),
            },
          ],
          "default",
        )[0],
      );
  }
  return {
    isSimp,
    insts: insts.length === 1 && insts[0].length === 0 ? [] : insts,
    rule: position < tokens.length ? readRule(isar, tokens.slice(position)) : undefined,
  };
};

const alignLeft = <Left, Right>(
  message: string,
  lefts: readonly Left[],
  rights: readonly Right[],
): [Left, Right][] => {
  if (lefts.length < rights.length) throw error(message);
  return rights.map((right, index) => [lefts[index], right]);
};

// Drule.infer_instantiate: the variables' types unify with their instances', then
// Drule.instantiate_normalize.
const inferInstantiate = (pairs: readonly [Var, Term][], rule: Thm): Thm => {
  if (pairs.length === 0) return rule;
  const tyenv = pairs.reduce<TyEnv>((env, pair) => {
    const unified = unifyTypes(pair[0].type, fastypeOf(pair[1]), env);
    if (unified === undefined) throw error("Ill-typed instantiation");
    return unified;
  }, emptyTyEnv);
  return compIncr(
    instantiate(
      pairs.map((pair) => ({
        variable: { ...pair[0], type: normType(tyenv, pair[0].type) },
        term: pair[1],
      })),
      instantiateTypes(tyenv, rule),
    ),
    asmRl,
  );
};

// Induct.simplified_rule' with the induct simpset. Its other rules and simprocs rewrite only
// PredicateLogic's cases_* constants, which no premise here mentions.
const simplifiedRule = (isar: IsarContext, rule: Thm): Thm => {
  if (premsOf(rule).some((prem) => existsSubterm(isInductConst, prem)))
    throw error("Unsupported cases rule with induct constraints");
  const limits = isar.tactics.limits;
  const empty = { limits, simpset: emptySimpset, bounds: 0 };
  const context = { ...empty, simpset: addSimps(empty, [normHhfEq]) };
  return fconvRule(
    premsConv((term) =>
      rewriteCterm(
        { simprem: false, useprem: false, mutsimp: false },
        () => undefined,
        context,
        term,
      ),
    ),
    rule,
  );
};

const firstResult = <Item>(seq: Seq<Item>): Seq<Item> => {
  const cell = seq.pull();
  return cell === undefined ? seq : singleSeq(cell[0]);
};

// Induct.cases_context_tactic on the first goal, as the cases method runs it under Seq.DETERM.
export const casesMethod = (isar: IsarContext, tokens: readonly OuterToken[]): Method => {
  const args = parseCasesArgs(isar, tokens);
  const induct = isar.tactics.induct;
  const limits = isar.tactics.limits;
  const instRule = (rule: CasesRule): [CaseInfo, number, CasesRule] => {
    const instantiated =
      args.insts.length === 0
        ? rule.rule
        : inferInstantiate(
            alignLeft(
              "Rule has fewer premises than arguments given",
              premsOf(rule.rule),
              args.insts,
            ).flatMap((pair) =>
              alignLeft(
                "Rule has fewer variables than instantiations given",
                varsOf(pair[0]),
                pair[1],
              ).flatMap((inst): [Var, Term][] => {
                const term = inst[1];
                if (term === undefined) return [];
                if (unifyTypes(fastypeOf(term), inst[0].type, emptyTyEnv) === undefined)
                  throw error("Ill-typed instantiation");
                return [[inst[0], term]];
              }),
            ),
            rule.rule,
          );
    const [info, consumes] = getCases(rule);
    return [
      info,
      consumes,
      { rule: instantiated, tags: instantiated === rule.rule ? rule.tags : [] },
    ];
  };
  return (facts) => (state) => {
    const [rule, ruleFacts] =
      args.rule === undefined && facts.length > 0 && isElimRule(facts[0])
        ? [{ rule: facts[0], tags: [] }, facts.slice(1)]
        : [args.rule, facts];
    if (rule !== undefined && rule.tags.length === 0 && induct.isTagged(rule.rule))
      throw error("Unsupported cases rule whose case names come from a fact");
    const firstInst = args.insts[0]?.[0];
    const checkSupported = (candidate: CasesRule) => {
      if (args.isSimp && getConstraints(candidate.tags) > 0)
        throw error("Unsupported cases rule with equality constraints");
      return candidate;
    };
    const candidates: Seq<[CaseInfo, number, CasesRule]> =
      rule !== undefined
        ? singleSeq(instRule(checkSupported(rule)))
        : mapsSeq(
            (candidate: CasesRule) => {
              checkSupported(candidate);
              try {
                return singleSeq(instRule(candidate));
              } catch (caught) {
                // Seq.try: any failure but an interrupt drops the candidate.
                if (caught instanceof TlaIsabelleError && caught.exception !== "Interrupt")
                  return seqOfList([]);
                throw caught;
              }
            },
            seqOfList([
              ...(ruleFacts.length === 0
                ? []
                : retrieve(induct.casesPred, majorPremOf, conclOf(ruleFacts[0]))),
              ...(firstInst === undefined
                ? []
                : retrieve(induct.casesType, leftVarPrem, encodeType(fastypeOf(firstInst)))),
              induct.casesDefault,
            ]),
          );
    return firstResult(
      mapsSeq(
        (candidate: [CaseInfo, number, CasesRule]) =>
          mapsSeq(
            (consumed) => {
              const [info, , remaining, consumedRule] = consumed;
              const simplified = args.isSimp ? simplifiedRule(isar, consumedRule) : consumedRule;
              const cases = makeCommon(
                limits,
                internalizeParams({
                  rule: simplified,
                  tags: simplified === candidate[2].rule ? candidate[2].tags : [],
                }).prop,
                info,
              );
              const tactic: GoalTactic = thenAllNew(
                (index) => (goal) =>
                  mapsSeq(
                    resolveTac(limits, [simplified])(index),
                    insertTac(limits, remaining, index)(goal),
                  ),
                (index) =>
                  args.isSimp ? tryTac(matchTac(limits, [induct.trivialRule])(index)) : allTac,
              );
              return mapSeq(
                (goal: Thm) => ({ context: updateCases(state.context, cases), goal }),
                tactic(1)(state.goal),
              );
            },
            consume(limits, ruleFacts, candidate[0], candidate[1], candidate[2].rule),
          ),
        candidates,
      ),
    );
  };
};

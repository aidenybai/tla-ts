// Ported from Isabelle2025's Pure/Isar/method.ML and Pure/goal.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { asmRl, isNormHhf, normHhfEq, reflexiveThm, termI } from "../pure/drule";
import { isEquals, isImplies, stripImpPrems, stripAssumsConcl } from "../pure/logic";
import { makeSimpContext, type Simpset } from "../pure/raw-simplifier";
import { genericRewriteGoalTac } from "../pure/rewriter";
import { filterSeq, mapsSeq, singleSeq, type Seq } from "../pure/seq";
import { atomizePremsTac } from "../pure/object-logic";
import { normHhf } from "../pure/simplifier";
import type { Limits } from "../pure/interrupt";
import { assumeTac, eresolveTac, flexflexTac, matchTac, resolveTac } from "../pure/tactic";
import {
  allGoals,
  allTac,
  appendGoal,
  changedProp,
  noTac,
  orElse,
  repeatAllNew,
  subgoal,
  thenAllNew,
  thenGoal,
  thenTac,
  tryTac,
  type GoalTactic,
  type Tactic,
} from "../pure/tactical";
import {
  addFreeNames,
  maxidxOfTerm,
  mkVar,
  stripAllBody,
  stripAllVars,
  substBounds,
  type Term,
} from "../pure/term";
import { nprems, trivial, type Thm } from "../pure/thm";
import { variantList } from "../pure/name";
import { autoTac, clarsimpTac, forceTac, type ClasimpContext } from "../provers/clasimp";
import {
  addUnsafeDest,
  addUnsafeIntro,
  withClaset,
  type ClassicalContext,
} from "../provers/classical";
import { proverTac, type IntuitionisticContext } from "../tools/intuitionistic";
import { insertTac } from "./proof";
import { syntaxError, type OuterToken } from "./theory";

interface Modifier {
  readonly kind: "intro" | "dest";
  readonly facts: readonly string[];
}

type MethodText =
  | {
      readonly kind: "auto" | "blast" | "force" | "clarsimp";
      readonly modifiers: readonly Modifier[];
    }
  | { readonly kind: "iprover" }
  | { readonly kind: "intro"; readonly facts: readonly string[] }
  | { readonly kind: "then"; readonly methods: readonly MethodText[] }
  | { readonly kind: "try"; readonly method: MethodText };

interface ProofText {
  readonly initial: MethodText;
  readonly terminal: MethodText | undefined;
}

export interface ProofContext {
  readonly limits: Limits;
  readonly simpset: Simpset;
  readonly classical: ClassicalContext;
  readonly intuitionistic: IntuitionisticContext;
  readonly atomizeRules: readonly Thm[];
  readonly blastDepthTac: (context: ClassicalContext, limit: number) => GoalTactic;
  readonly blastTac: (context: ClassicalContext) => GoalTactic;
  readonly getFact: (name: string) => readonly Thm[];
}

export const parseProofText = (tokens: readonly OuterToken[]): ProofText => {
  let position = 0;
  const peek = () => tokens[position];
  const isSymbol = (symbol: string, offset = 0) =>
    tokens[position + offset]?.kind === "symbol" && tokens[position + offset].text === symbol;
  const expectSymbol = (symbol: string) => {
    if (!isSymbol(symbol)) throw syntaxError(peek());
    position += 1;
  };
  const isWord = () => peek()?.kind === "word";
  const readWord = () => {
    const token = peek();
    if (token?.kind !== "word") throw syntaxError(token);
    position += 1;
    return token.text;
  };
  const isSectionStart = () => isWord() && isSymbol(":", 1);
  const readFacts = () => {
    const names: string[] = [];
    while (isWord() && !isSectionStart()) names.push(readWord());
    return names;
  };
  const readModifiers = (): Modifier[] => {
    const result: Modifier[] = [];
    while (isSectionStart()) {
      const kind = readWord();
      position += 1;
      if (kind !== "intro" && kind !== "dest")
        throw new TlaIsabelleError("ERROR", `Unsupported method modifier: ${kind}`);
      result.push({ kind, facts: readFacts() });
    }
    return result;
  };
  const readMethod = (name: string, hasArgs: boolean): MethodText => {
    switch (name) {
      case "auto":
      case "blast":
      case "force":
      case "clarsimp":
        return { kind: name, modifiers: hasArgs ? readModifiers() : [] };
      case "iprover":
        return { kind: "iprover" };
      case "intro":
        return { kind: "intro", facts: hasArgs ? readFacts() : [] };
      default:
        throw new TlaIsabelleError("ERROR", `Undefined method: ${name}`);
    }
  };
  const readSuffixed = (text: MethodText): MethodText => {
    if (!isSymbol("?")) return text;
    position += 1;
    return readSuffixed({ kind: "try", method: text });
  };
  const readParenthesized = (): MethodText => {
    expectSymbol("(");
    const elements = [readElement(true)];
    while (isSymbol(",")) {
      position += 1;
      elements.push(readElement(true));
    }
    expectSymbol(")");
    return elements.length === 1 ? elements[0] : { kind: "then", methods: elements };
  };
  const readElement = (hasArgs: boolean) =>
    readSuffixed(isSymbol("(") ? readParenthesized() : readMethod(readWord(), hasArgs));
  const initial = readElement(false);
  const terminal = position < tokens.length ? readElement(false) : undefined;
  if (position !== tokens.length) throw syntaxError(peek());
  return { initial, terminal };
};

const getFacts = (context: ProofContext, names: readonly string[]) =>
  names.flatMap((name) => context.getFact(name));

const withModifiers = (context: ProofContext, modifiers: readonly Modifier[]): ClassicalContext =>
  modifiers.reduce(
    (classical, modifier) =>
      getFacts(context, modifier.facts).reduce(
        (current, fact) =>
          withClaset(
            current,
            modifier.kind === "intro"
              ? addUnsafeIntro(current, fact)
              : addUnsafeDest(current, fact),
          ),
        classical,
      ),
    context.classical,
  );

const getClasimp = (context: ProofContext, classical: ClassicalContext): ClasimpContext => ({
  classical,
  simp: { limits: context.limits, simpset: context.simpset, bounds: 0 },
  blastDepthTac: context.blastDepthTac,
});

const insertAllTac = (context: ProofContext, facts: readonly Thm[]) =>
  allGoals((index) => insertTac(context.limits, facts, index));

const simpleMethodHead = (context: ProofContext, facts: readonly Thm[], tactic: GoalTactic) =>
  thenGoal((index) => insertTac(context.limits, facts, index), tactic)(1);

type Method = (facts: readonly Thm[]) => Tactic;

const evaluate = (context: ProofContext, text: MethodText): Method => {
  switch (text.kind) {
    case "auto":
      return (facts) =>
        thenTac(
          insertAllTac(context, facts),
          changedProp(autoTac(getClasimp(context, withModifiers(context, text.modifiers)))),
        );
    case "clarsimp":
      return (facts) =>
        simpleMethodHead(context, facts, (index) =>
          changedProp(
            clarsimpTac(getClasimp(context, withModifiers(context, text.modifiers)))(index),
          ),
        );
    case "force":
      return (facts) =>
        simpleMethodHead(
          context,
          facts,
          forceTac(
            getClasimp(context, withModifiers(context, text.modifiers)),
            context.atomizeRules,
          ),
        );
    case "blast":
      return (facts) =>
        simpleMethodHead(context, facts, context.blastTac(withModifiers(context, text.modifiers)));
    case "iprover":
      return (facts) =>
        simpleMethodHead(
          context,
          facts,
          thenGoal(
            atomizePremsTac(context.limits, context.atomizeRules),
            proverTac(context.intuitionistic),
          ),
        );
    case "intro":
      return (facts) => {
        const rules = getFacts(context, text.facts);
        return simpleMethodHead(context, facts, (index) =>
          changedProp(repeatAllNew(matchTac(context.limits, rules))(index)),
        );
      };
    case "then": {
      const methods = text.methods.map((method) => evaluate(context, method));
      return (facts) => (state) =>
        methods.reduce<Seq<Thm>>(
          (results, method) => mapsSeq(method(facts), results),
          singleSeq(state),
        );
    }
    case "try": {
      const method = evaluate(context, text.method);
      return (facts) => tryTac(method(facts));
    }
  }
};

const normHhfTac = (limits: Limits): GoalTactic => {
  const context = makeSimpContext(limits, [normHhfEq]);
  return thenGoal(
    resolveTac(limits, [asmRl]),
    subgoal((goal, index) =>
      isNormHhf(false, goal)
        ? allTac
        : genericRewriteGoalTac(
            { simprem: true, useprem: false, mutsimp: false },
            () => undefined,
            context,
            index,
          ),
    ),
  );
};

const assumeRuleTac = (limits: Limits): GoalTactic =>
  thenGoal(
    normHhfTac(limits),
    subgoal((goal, index) => {
      const params = stripAllVars(goal);
      const names = variantList(
        addFreeNames(goal, []),
        params.map((param) => param.name),
      );
      const maxidx = maxidxOfTerm(goal) + 1;
      const body = substBounds(
        params.map((param, offset) => mkVar(names[offset], maxidx, param.type)).reverse(),
        stripAllBody(goal),
      );
      const rules = stripImpPrems(body).filter(
        (prem) =>
          isImplies(prem) ||
          (prem.kind === "App" && prem.fun.kind === "Const" && prem.fun.name === "Pure.all"),
      );
      return rules.reduceRight<GoalTactic>(
        (tactic, rule) =>
          appendGoal(
            thenAllNew(eresolveTac(limits, [normHhf(limits, trivial(rule))]), assumeTac(limits)),
            tactic,
          ),
        () => noTac,
      )(index);
    }),
  );

const assmTac = (limits: Limits): GoalTactic => {
  const condRtac = (isRule: (concl: Term) => boolean, rule: Thm) =>
    subgoal((goal, index) =>
      isRule(stripAssumsConcl(goal)) ? resolveTac(limits, [rule])(index) : noTac,
    );
  return appendGoal(
    assumeTac(limits),
    appendGoal(
      assumeRuleTac(limits),
      appendGoal(
        condRtac(isEquals, reflexiveThm),
        condRtac(
          (concl) =>
            concl.kind === "App" && concl.fun.kind === "Const" && concl.fun.name === "Pure.term",
          termI,
        ),
      ),
    ),
  );
};

const allAssmTac =
  (limits: Limits) =>
  (index: number): Tactic =>
  (state) =>
    index > nprems(state)
      ? singleSeq(state)
      : orElse(
          thenTac(assmTac(limits)(index), allAssmTac(limits)(index)),
          allAssmTac(limits)(index + 1),
        )(state);

export const terminalProof = (
  context: ProofContext,
  text: ProofText,
  facts: readonly Thm[],
  state: Thm,
): Seq<Thm> => {
  const initial = evaluate(context, text.initial);
  const terminal = text.terminal === undefined ? undefined : evaluate(context, text.terminal);
  const finish: Tactic = (result) =>
    mapsSeq(flexflexTac(context.limits), allAssmTac(context.limits)(1)(result));
  return filterSeq(
    (result) => nprems(result) === 0,
    mapsSeq(
      (result) =>
        mapsSeq(finish, terminal === undefined ? singleSeq(result) : terminal([])(result)),
      initial(facts)(state),
    ),
  );
};

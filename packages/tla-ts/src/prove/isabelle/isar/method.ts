// Ported from Isabelle2025's Pure/Isar/method.ML (method syntax, combinators, SIMPLE_METHOD,
// finish), the assume_rule_tac and norm_hhf_tac of Pure/goal.ML, and the methods the theories
// tlapm writes use: auto, force and clarsimp (Provers/clasimp.ML), blast (Provers/blast.ML),
// iprover (Tools/intuitionistic.ML) and intro. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { asmRl, isNormHhf, normHhfEq, reflexiveThm, termI } from "../pure/drule";
import { isEquals, stripImpPrems, stripAssumsConcl } from "../pure/logic";
import { addSimps, emptySimpset, type Simpset } from "../pure/raw-simplifier";
import { genericRewriteGoalTac } from "../pure/rewriter";
import { filterSeq, mapsSeq, singleSeq, type Seq } from "../pure/seq";
import { atomizePremsTac } from "../pure/object-logic";
import { normHhf } from "../pure/simplifier";
import type { Limits } from "../pure/interrupt";
import { assumeTac, eresolveTac, flexflexTac, matchTac, resolveTac } from "../pure/tactic";
import {
  allGoals,
  appendGoal,
  changedProp,
  noTac,
  orElse,
  repeatAllNew,
  subgoal,
  thenAllNew,
  thenGoal,
  thenTac,
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
import type { OuterToken } from "./theory";

export interface Modifier {
  readonly kind: "intro" | "dest";
  readonly facts: readonly string[];
}

export type MethodText =
  | {
      readonly kind: "auto" | "blast" | "force" | "clarsimp";
      readonly modifiers: readonly Modifier[];
    }
  | { readonly kind: "iprover" }
  | { readonly kind: "intro"; readonly facts: readonly string[] }
  | { readonly kind: "then"; readonly methods: readonly MethodText[] }
  | { readonly kind: "try"; readonly method: MethodText };

// The methods of by: the initial one, and the terminal one that qed runs.
export interface ProofText {
  readonly initial: MethodText;
  readonly terminal: MethodText | undefined;
}

// What a proof method reads from the Isabelle proof context.
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

const syntaxError = (token: OuterToken | undefined) =>
  new TlaIsabelleError(
    "ERROR",
    `Outer syntax error at: ${token === undefined ? "end of input" : token.text}`,
  );

// Method.parse for the proof methods of by.
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
  const word = () => {
    const token = peek();
    if (token?.kind !== "word") throw syntaxError(token);
    position += 1;
    return token.text;
  };
  const isSectionStart = () => isWord() && isSymbol(":", 1);
  const facts = () => {
    const names: string[] = [];
    while (isWord() && !isSectionStart()) names.push(word());
    return names;
  };
  const modifiers = (): Modifier[] => {
    const result: Modifier[] = [];
    while (isSectionStart()) {
      const kind = word();
      position += 1;
      if (kind !== "intro" && kind !== "dest")
        throw new TlaIsabelleError("ERROR", `Unsupported method modifier: ${kind}`);
      result.push({ kind, facts: facts() });
    }
    return result;
  };
  const method = (name: string, hasArgs: boolean): MethodText => {
    switch (name) {
      case "auto":
      case "blast":
      case "force":
      case "clarsimp":
        return { kind: name, modifiers: hasArgs ? modifiers() : [] };
      case "iprover":
        return { kind: "iprover" };
      case "intro":
        return { kind: "intro", facts: hasArgs ? facts() : [] };
      default:
        throw new TlaIsabelleError("ERROR", `Undefined method: ${name}`);
    }
  };
  const suffixed = (text: MethodText): MethodText => {
    if (!isSymbol("?")) return text;
    position += 1;
    return suffixed({ kind: "try", method: text });
  };
  const parenthesized = (): MethodText => {
    expectSymbol("(");
    const elements = [suffixed(isSymbol("(") ? parenthesized() : method(word(), true))];
    while (isSymbol(",")) {
      position += 1;
      elements.push(suffixed(isSymbol("(") ? parenthesized() : method(word(), true)));
    }
    expectSymbol(")");
    return elements.length === 1 ? elements[0] : { kind: "then", methods: elements };
  };
  const atom = () => suffixed(isSymbol("(") ? parenthesized() : method(word(), false));
  const initial = atom();
  const terminal = position < tokens.length ? atom() : undefined;
  if (position !== tokens.length) throw syntaxError(peek());
  return { initial, terminal };
};

const getFacts = (context: ProofContext, names: readonly string[]) =>
  names.flatMap((name) => context.getFact(name));

// Method.sections: the claset the modifiers declare.
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

// SIMPLE_METHOD'
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
      return (facts) => orElse(method(facts), (state) => singleSeq(state));
    }
  }
};

// Goal.norm_hhf_tac
const normHhfTac = (limits: Limits): GoalTactic => {
  const empty = { limits, simpset: emptySimpset, bounds: 0 };
  const context = { ...empty, simpset: addSimps(empty, [normHhfEq]) };
  return thenGoal(
    resolveTac(limits, [asmRl]),
    subgoal((goal, index) =>
      isNormHhf(false, goal)
        ? (state) => singleSeq(state)
        : genericRewriteGoalTac(
            { simprem: true, useprem: false, mutsimp: false },
            () => undefined,
            context,
            index,
          ),
    ),
  );
};

// Goal.assume_rule_tac: solves a goal with one of its non-atomic premises.
const assumeRuleTac = (limits: Limits): GoalTactic =>
  thenGoal(
    normHhfTac(limits),
    subgoal((goal, index) => {
      // Variable.focus_cterm and Variable.export: the parameters become schematic variables.
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
          prem.kind === "App" &&
          ((prem.fun.kind === "App" &&
            prem.fun.fun.kind === "Const" &&
            prem.fun.fun.name === "Pure.imp") ||
            (prem.fun.kind === "Const" && prem.fun.name === "Pure.all")),
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

// Method.assm_tac
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

// Method.all_assm_tac
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

// Proof.local_terminal_proof: by initial terminal runs the initial method with the facts, then
// the terminal one without them and Method.finish, and succeeds on the first result that leaves
// no goal.
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

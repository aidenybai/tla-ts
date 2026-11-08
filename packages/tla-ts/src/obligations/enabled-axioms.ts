// Module.Elab's check_enabled_axioms_usage and check_enabled_axioms_map.

import { TlapmBugError } from "../errors";
import {
  adjoin,
  adjoinAll,
  getErrorNote,
  getFact,
  mapAccumulate,
  type Expr,
  type Hyp,
  type Scope,
  type Warn,
} from "./expression";
import {
  AT_NOWHERE,
  getDefineHyp,
  getStepDefinition,
  setDefinition,
  setExpression,
} from "./generate";
import { getContextLevel, getLevelInfo } from "./levels";
import { getStepName, type Proof, type Step } from "./proof";

// level is shared with the enclosing proof, which an assertion overwrites.
interface CheckState {
  context: Hyp[];
  level: { value: number };
  stepLevels: Map<string, number>;
}

const DUMMY_FACT = getFact(AT_NOWHERE, "Visible", "Always", undefined);

const getTarget = (context: Hyp[], index: number, expression: Expr) =>
  expression.kind === "Ix" ? context[index - expression.index] : undefined;

const isDirective = (hyp: Hyp | undefined) =>
  hyp?.kind === "Defn" &&
  hyp.definition.kind === "Bpragma" &&
  hyp.definition.name === "ENABLEDaxioms";

const visitTheorem = (context: Hyp[], proof: Proof, onWarning: Warn, isChecking: boolean) => {
  const usage = { isUsed: false };

  const getLevels = (context: Hyp[], step: Extract<Step, { kind: "Assert" | "Suffices" }>) => {
    if (!isChecking) return { hyps: 0, sequent: 0 };
    const hyps = getContextLevel(adjoinAll(undefined, context), step.sequent.context);
    return {
      hyps: hyps.level,
      sequent: Math.max(hyps.level, getLevelInfo(hyps.scope, step.sequent.active).level),
    };
  };

  const checkLeaf = (state: CheckState, proof: Proof, isOnly: boolean): Proof => {
    const context = state.context;
    if (!isChecking) {
      usage.isUsed ||= context.some(
        (hyp, index) =>
          hyp.kind === "Fact" && isDirective(getTarget(context, index, hyp.expression)),
      );
      return proof;
    }
    const scopes = mapAccumulate<Scope | undefined, Hyp, Scope | undefined>(
      undefined,
      context,
      (scope, hyp) => [adjoin(scope, hyp), scope],
    )[1];
    const facts = context.flatMap((hyp, index) =>
      hyp.kind === "Fact" && hyp.visibility === "Visible" && hyp.expression.kind !== "At"
        ? [{ expression: hyp.expression, index }]
        : [],
    );
    const isFound = facts.some((fact) =>
      isDirective(getTarget(context, fact.index, fact.expression)),
    );
    if (isOnly && !isFound) return { ...proof, isEnabledAxiomsSound: true };
    const level = Math.max(
      0,
      ...facts.map((fact) => {
        const target = getTarget(context, fact.index, fact.expression);
        if (!target) return getLevelInfo(scopes[fact.index], fact.expression).level;
        if (!isOnly && target.kind === "Fact" && target.visibility === "Visible")
          throw new TlapmBugError();
        return target.kind === "Defn" &&
          target.definition.kind === "Operator" &&
          target.visibility === "Visible"
          ? (state.stepLevels.get(target.definition.name) ?? 0)
          : 0;
      }),
    );
    if (!isOnly) state.level.value = Math.max(state.level.value, level);
    if (!isFound || level <= 1) return { ...proof, isEnabledAxiomsSound: true };
    onWarning(
      getErrorNote(proof.location, "ENABLEDaxioms depends on assumption of expression level > 1"),
    );
    return { ...proof, isEnabledAxiomsSound: false };
  };

  const visitStep = (state: CheckState, step: Step): [CheckState, Step] => {
    if (!step.step) throw new TlapmBugError();
    const name = getStepName(step.step);
    const stepLevels = new Map(state.stepLevels);
    stepLevels.delete(name);
    const definition = getStepDefinition(step, AT_NOWHERE, "Always");
    switch (step.kind) {
      case "Forget": {
        const count = state.context.length;
        const context = state.context.map((hyp, index): Hyp =>
          hyp.kind === "Fact" && hyp.visibility === "Visible" && step.count + index < count
            ? { ...hyp, visibility: "Hidden" }
            : hyp,
        );
        return [{ ...state, stepLevels, context }, step];
      }
      case "Hide": {
        const hidden = step.usable.defs.reduce(
          (current, def) => setDefinition("Hidden", current, def),
          state.context,
        );
        const context = step.usable.facts.reduceRight(
          (current, fact) => setExpression(onWarning, "Hidden", fact, current),
          hidden,
        );
        return [{ ...state, stepLevels, context }, step];
      }
      case "Assert": {
        const levels = getLevels(state.context, step);
        const proofLevel = { value: 0 };
        const proof = visitProof(
          {
            context: [
              ...state.context,
              ...step.sequent.context,
              DUMMY_FACT,
              definition,
              DUMMY_FACT,
            ],
            level: proofLevel,
            stepLevels: new Map(stepLevels).set(name, levels.hyps),
          },
          step.proof,
        );
        state.level.value =
          proofLevel.value < 2 ? proofLevel.value : Math.min(levels.sequent, proofLevel.value);
        return [
          {
            context: [...state.context, definition, DUMMY_FACT],
            level: state.level,
            stepLevels: stepLevels.set(name, state.level.value),
          },
          { ...step, proof },
        ];
      }
      case "Suffices": {
        const levels = getLevels(state.context, step);
        state.level.value = levels.sequent;
        const proofLevel = { value: 0 };
        const proof = visitProof(
          {
            context: [...state.context, definition, DUMMY_FACT],
            level: proofLevel,
            stepLevels: new Map(stepLevels).set(name, levels.sequent),
          },
          step.proof,
        );
        return [
          {
            context: [
              ...state.context,
              ...step.sequent.context,
              DUMMY_FACT,
              definition,
              DUMMY_FACT,
            ],
            level: proofLevel,
            stepLevels: stepLevels.set(name, levels.hyps),
          },
          { ...step, proof },
        ];
      }
      case "Use": {
        const facts = step.usable.facts;
        if (step.usable.defs.length === 0 && facts.length === 1) {
          const fact = getFact(facts[0], "Visible", "Always", facts[0].location);
          return [{ ...state, stepLevels, context: [...state.context, fact] }, step];
        }
        const context = [...state.context, ...facts.map(() => DUMMY_FACT)];
        return [{ ...state, stepLevels: stepLevels.set(name, 1), context }, step];
      }
      case "Define": {
        const context = [...state.context, ...step.definitions.map(getDefineHyp)];
        return [{ ...state, stepLevels: stepLevels.set(name, 1), context }, step];
      }
      default:
        throw new TlapmBugError();
    }
  };

  const visitProof = (state: CheckState, proof: Proof): Proof => {
    switch (proof.kind) {
      case "Omitted":
      case "Error":
        return proof;
      case "Obvious":
        return checkLeaf(state, proof, false);
      case "By":
        return checkLeaf(state, proof, proof.isOnly);
      case "Steps": {
        const [inner, steps] = mapAccumulate(state, proof.steps, visitStep);
        const qed = { ...proof.qed, proof: visitProof(inner, proof.qed.proof) };
        return { ...proof, steps, qed };
      }
    }
  };

  const visited = visitProof({ context, level: { value: 0 }, stepLevels: new Map() }, proof);
  return { isUsed: usage.isUsed, proof: visited };
};

export const checkEnabledAxioms = (context: Hyp[], proof: Proof, onWarning: Warn) =>
  visitTheorem(context, proof, onWarning, false).isUsed
    ? visitTheorem(context, proof, onWarning, true).proof
    : proof;

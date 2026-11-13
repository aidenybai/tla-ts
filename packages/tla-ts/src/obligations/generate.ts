// A port of tlapm's obligation generation (Proof.Gen and Module.Gen).

import { TlapmBugError, TlaProofError } from "../errors";
import { isEqualExpr } from "./equality";
import {
  AT_NOWHERE,
  at,
  exprifySequent,
  getDefinitionHyp,
  getErrorNote,
  getFact,
  getLocalDefn,
  getTrue,
  isBuiltinApply,
  mapAccumulate,
  type Defn,
  type Expr,
  type Hyp,
  type Locus,
  type Sequent,
  type Time,
  type Visibility,
  type Warn,
} from "./expression";
import { bindTheoremName, getUnitHyps, type Mule } from "./module";
import type { OldMethod } from "./pragma";
import {
  getStepName,
  type Obligation,
  type ObligationKind,
  type Proof,
  type Step,
  type StepNumber,
  type UseDef,
  type Usable,
} from "./proof";
import { shiftExpr } from "./substitution";
import { getScopeTime } from "./temporal";

const isAnonymous = (step: StepNumber | undefined) => step?.kind === "Named" && step.isAnonymous;

const getAssumedFacts = (offset: number, sequent: Sequent) =>
  sequent.context.flatMap((hyp, index) =>
    hyp.kind === "Fact" && hyp.visibility === "Visible"
      ? [shiftExpr(offset + sequent.context.length - 1 - index, hyp.expression)]
      : [],
  );

export const getStepDefinition = (step: Step, body: Expr, time: Time): Hyp => {
  if (!step.step) throw new TlapmBugError();
  return getDefinitionHyp(
    { kind: "Operator", name: getStepName(step.step), body, location: step.location },
    { kind: "Proof", time },
    "Visible",
    true,
    step.location,
  );
};

export const getDefineHyp = (definition: Defn): Hyp => ({
  ...getLocalDefn(definition),
  location: definition.location,
});

export const proveAssertion = (context: Hyp[], sequent: Sequent, step: Step, time: Time) => {
  const visibility: Visibility = isAnonymous(step.step) ? "Visible" : "Hidden";
  const hyps = sequent.context.map((hyp): Hyp =>
    hyp.kind === "Fact" ? { ...hyp, visibility } : hyp,
  );
  const body = at({ kind: "List", bullet: "Refs", items: getAssumedFacts(2, sequent) }, step);
  const scopeTime = getScopeTime(sequent.context, time);
  return {
    context: [
      ...context,
      ...hyps,
      getFact(getTrue(step), "Hidden", time, step.location),
      getStepDefinition(step, body, scopeTime),
      getFact(at({ kind: "Ix", index: 1 }, step), "Hidden", scopeTime, step.location),
    ],
    active: shiftExpr(3, sequent.active),
    time: scopeTime,
  };
};

export const useAssertion = (
  isSuffices: boolean,
  context: Hyp[],
  goal: Expr,
  sequent: Sequent,
  step: Step,
  time: Time,
) => {
  const visibility: Visibility = isSuffices || isAnonymous(step.step) ? "Visible" : "Hidden";
  return {
    context: [
      ...context,
      getStepDefinition(step, at(exprifySequent(sequent), step), time),
      getFact(at({ kind: "Ix", index: 1 }, step), visibility, time, step.location),
    ],
    active: shiftExpr(2, goal),
  };
};

const getFactTime = (context: Hyp[], fact: Expr, time: Time): Time => {
  if (fact.kind !== "Ix") return time;
  const hyp = context[context.length - fact.index];
  if (hyp?.kind === "Fact") return hyp.time;
  return hyp?.kind === "Defn" && typeof hyp.whereDefined === "object"
    ? hyp.whereDefined.time
    : time;
};

export const setDefinition = (visibility: Visibility, context: Hyp[], def: UseDef): Hyp[] => {
  if (def.kind !== "Dx") throw new TlaProofError(`Unknown definition ${def.name}`);
  const index = context.length - def.index;
  const hyp = context[index];
  if (!hyp) return context;
  if (hyp.kind !== "Defn") throw new TlaProofError("Indicated point is not a definition");
  return context.map((entry, position) => (position === index ? { ...hyp, visibility } : entry));
};

const isDomainMatch = (fact: Expr, domain: Expr) =>
  isBuiltinApply(fact, "Mem") &&
  fact.args[0]?.kind === "Ix" &&
  fact.args[0].index === 0 &&
  isEqualExpr(domain, fact.args[1]);

export const setExpression = (
  onWarning: Warn,
  visibility: Visibility,
  fact: Expr,
  context: Hyp[],
): Hyp[] => {
  let isFound = false;
  let current = fact;
  const result = [...context];
  for (let index = context.length - 1; index >= 0; index--) {
    current = shiftExpr(-1, current);
    const hyp = context[index];
    if (hyp.kind === "Fact" && isEqualExpr(hyp.expression, current)) {
      isFound = true;
      result[index] = { ...hyp, visibility };
      continue;
    }
    if (hyp.kind === "Fresh" && hyp.domain && isDomainMatch(current, hyp.domain)) {
      isFound = true;
      result[index] = { ...hyp, domainVisibility: visibility };
    }
  }
  if (!isFound) {
    const message = "This expression does not appear in the context and cannot be hidden.";
    onWarning(getErrorNote(fact.location, `${message}\n`));
    throw new TlaProofError(message, { failure: "proof.Gen.set_expr" });
  }
  return result;
};

export interface LineRange {
  start: number;
  end: number;
}

const obligate = (
  sequent: Sequent,
  from: { location?: Locus; method?: OldMethod; isEnabledAxiomsSound?: boolean },
  kind: ObligationKind,
): Obligation => ({
  sequent,
  location: from.location,
  kind,
  method: from.method,
  isEnabledAxiomsSound: from.isEnabledAxiomsSound,
});

interface ProofSummary {
  total: number;
  absent: Locus[];
  omitted: Locus[];
}

const EMPTY_SUMMARY: ProofSummary = { total: 0, absent: [], omitted: [] };

const joinSummaries = (left: ProofSummary, right: ProofSummary): ProofSummary => ({
  total: left.total + right.total,
  absent: [...left.absent, ...right.absent],
  omitted: [...left.omitted, ...right.omitted],
});

const getStepSummary = (step: Step): ProofSummary => {
  if (step.kind === "Use") return { ...EMPTY_SUMMARY, total: step.obligations?.length ?? 0 };
  return "proof" in step ? getProofSummary(step.proof) : EMPTY_SUMMARY;
};

const getProofSummary = (proof: Proof): ProofSummary => {
  if (proof.kind === "Steps") {
    return [...proof.steps.map(getStepSummary), getProofSummary(proof.qed.proof)].reduce(
      joinSummaries,
    );
  }
  if (proof.kind !== "Omitted" || !proof.obligations || !proof.location)
    return { ...EMPTY_SUMMARY, total: proof.obligations?.length ?? 0 };
  return {
    total: proof.obligations.length,
    absent: proof.omission === "Implicit" ? [proof.location] : [],
    omitted: proof.omission === "Explicit" ? [proof.location] : [],
  };
};

export interface TheoremSummary extends ProofSummary {
  location: Locus | undefined;
}

export interface ModuleSummary extends ProofSummary {
  theorems: TheoremSummary[];
}

interface GeneratedStep {
  sequent: Sequent;
  step: Step;
  time: Time;
}

export const createGenerator = (inputFiles: Set<string>, lines: LineRange, onWarning: Warn) => {
  const generate = (sequent: Sequent, proof: Proof, time: Time): Proof => {
    const location = proof.location;
    if (
      !location ||
      !inputFiles.has(location.file) ||
      location.endLine < lines.start ||
      location.startLine > lines.end
    )
      return proof;
    switch (proof.kind) {
      case "Obvious":
        return { ...proof, obligations: [obligate(sequent, proof, { kind: "Main" })] };
      case "Omitted":
        return {
          ...proof,
          obligations: [obligate(sequent, proof, { kind: "Omitted", omission: proof.omission })],
        };
      case "Error":
        return {
          ...proof,
          obligations: [obligate(sequent, proof, { kind: "Error", message: proof.message })],
        };
      case "By":
        throw new TlaProofError("Proof.Gen.generate");
      case "Steps": {
        const [inner, steps] = mapAccumulate({ sequent, time }, proof.steps, (state, step) => {
          const next = generateStep(state.sequent, step, state.time);
          return [next, next.step];
        });
        const qedProof = generate(inner.sequent, proof.qed.proof, inner.time);
        return { ...proof, steps, qed: { ...proof.qed, proof: qedProof } };
      }
    }
  };

  const generateStep = (sequent: Sequent, step: Step, time: Time): GeneratedStep => {
    switch (step.kind) {
      case "Forget": {
        const count = sequent.context.length;
        const context = sequent.context.map((hyp, index): Hyp =>
          hyp.kind === "Fact" && hyp.visibility === "Visible" && step.count + index < count
            ? { ...hyp, visibility: "Hidden" }
            : hyp,
        );
        return { sequent: { ...sequent, context }, step, time };
      }
      case "Use": {
        const usable = step.usable;
        if (usable.defs.length === 0 && usable.facts.length === 1) {
          const fact = usable.facts[0];
          const obligation = obligate({ ...sequent, active: fact }, step, { kind: "Support" });
          return {
            sequent: {
              context: [
                ...sequent.context,
                {
                  ...getFact(
                    fact,
                    "Visible",
                    getFactTime(sequent.context, fact, time),
                    fact.location,
                  ),
                  useLocation: step.useLocation,
                },
              ],
              active: shiftExpr(1, sequent.active),
            },
            step: { ...step, obligations: [obligation] },
            time,
          };
        }
        if (usable.facts.length > 0)
          throw new TlaProofError("Proof.Gen.gen_step: USE with facts and definitions");
        const context = usable.defs.reduce(
          (current, def) => setDefinition("Visible", current, def),
          sequent.context,
        );
        return { sequent: { ...sequent, context }, step, time };
      }
      case "Hide": {
        const hidden = step.usable.defs.reduce(
          (current, def) => setDefinition("Hidden", current, def),
          sequent.context,
        );
        const context = step.usable.facts.reduceRight(
          (current, fact) => setExpression(onWarning, "Hidden", fact, current),
          hidden,
        );
        return { sequent: { ...sequent, context }, step, time };
      }
      case "Define":
        return {
          sequent: {
            context: [...sequent.context, ...step.definitions.map(getDefineHyp)],
            active: shiftExpr(step.definitions.length, sequent.active),
          },
          step,
          time,
        };
      case "Assert": {
        const inner = proveAssertion(sequent.context, step.sequent, step, time);
        const proof = generate(inner, step.proof, inner.time);
        const generated: Step = { ...step, proof };
        return {
          sequent: useAssertion(
            false,
            sequent.context,
            sequent.active,
            step.sequent,
            generated,
            time,
          ),
          step: generated,
          time,
        };
      }
      case "Suffices": {
        const proof = generate(
          useAssertion(true, sequent.context, sequent.active, step.sequent, step, time),
          step.proof,
          time,
        );
        const generated: Step = { ...step, proof };
        const next = proveAssertion(sequent.context, step.sequent, generated, time);
        return { sequent: next, step: generated, time: next.time };
      }
      default:
        throw new TlaProofError("Proof.Gen.gen_step");
    }
  };

  const mutateOne = (
    context: Hyp[],
    mode: "Use" | "Hide",
    usable: Usable,
    location: Locus | undefined,
  ): [Hyp[], Obligation[]] => {
    const step: StepNumber = { kind: "Unnamed", level: 0, id: 0 };
    const generated = generateStep(
      { context, active: { ...AT_NOWHERE, location } },
      mode === "Use"
        ? { kind: "Use", usable, isOnly: false, location, step, useLocation: location }
        : { kind: "Hide", usable, location, step },
      "Always",
    );
    return [generated.sequent.context, generated.step.obligations ?? []];
  };

  const mutate = (
    context: Hyp[],
    mode: "Use" | "Hide",
    usable: Usable,
    location: Locus | undefined,
  ): [Hyp[], Obligation[]] => {
    if (usable.defs.length === 0 && usable.facts.length === 0) return [context, []];
    const isDefs = usable.defs.length > 0;
    const [fact, ...facts] = usable.facts;
    const [next, first] = mutateOne(
      context,
      mode,
      isDefs ? { defs: usable.defs, facts: [] } : { defs: [], facts: [fact] },
      location,
    );
    const rest = isDefs ? usable.facts : facts.map((inner) => shiftExpr(1, inner));
    const [last, others] = mutate(next, mode, { defs: [], facts: rest }, location);
    return [last, [...first, ...others]];
  };

  const collect = (proof: Proof): Obligation[] => {
    const obligations: Obligation[] = [];
    const visitProof = (item: Proof) => {
      if (item.kind === "Steps") {
        visitProof(item.qed.proof);
        item.steps.forEach(visitStep);
        return;
      }
      if (item.obligations && !item.isSuppressed) obligations.push(...item.obligations);
    };
    const visitStep = (step: Step) => {
      if (step.kind === "Use" && step.obligations && !step.isSuppressed)
        obligations.push(...step.obligations);
      if ("proof" in step) visitProof(step.proof);
    };
    visitProof(proof);
    return obligations;
  };

  const generateModule = (
    context: Hyp[],
    module: Mule,
  ): { obligations: Obligation[]; summary: ModuleSummary } => {
    const obligations: Obligation[] = [];
    const theorems: TheoremSummary[] = [];
    let summary = EMPTY_SUMMARY;
    let current = context;
    for (const unit of module.body) {
      switch (unit.kind) {
        case "Theorem": {
          const binding = bindTheoremName(unit.name, unit.sequent, unit.location);
          const named = [...current, ...binding.hyps];
          const context = [...named, ...binding.sequent.context];
          const proof = generate(
            { context, active: binding.sequent.active },
            unit.proof,
            getScopeTime(context, "Always"),
          );
          obligations.push(...collect(proof));
          const theorem = getProofSummary(proof);
          theorems.push({ ...theorem, location: unit.location });
          summary = joinSummaries(summary, theorem);
          const fact: Expr =
            unit.name === undefined
              ? at(exprifySequent(unit.sequent), unit)
              : { kind: "Ix", index: 1, location: unit.location };
          current = [...named, getFact(fact, "Hidden", "Always", unit.location)];
          continue;
        }
        case "Submod": {
          const generated = generateModule(current, unit.module);
          obligations.push(...generated.obligations);
          summary = joinSummaries(summary, generated.summary);
          continue;
        }
        case "Mutate": {
          const [next, generated] = mutate(current, unit.mode, unit.usable, unit.location);
          obligations.push(...generated);
          current = next;
          continue;
        }
        default:
          current = [...current, ...getUnitHyps(unit)];
      }
    }
    return { obligations, summary: { ...summary, theorems } };
  };

  return generateModule;
};

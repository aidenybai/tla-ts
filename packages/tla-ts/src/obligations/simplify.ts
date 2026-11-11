// A port of tlapm's Proof.Simplify.

import { TlaProofError } from "../errors";
import { isEqualExpr } from "./equality";
import {
  applyBuiltin,
  at,
  getFact,
  isBuiltinApply,
  mapAccumulate,
  mapBoundDomains,
  mapChildren,
  stripProps,
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Sequent,
  type Time,
} from "./expression";
import { format, renderDoc, type Doc } from "./format";
import { AT_NOWHERE, getTrue, proveAssertion, useAssertion } from "./generate";
import { printExpression } from "./printer";
import { getUnique, type Counter, type Proof, type Step, type StepNumber } from "./proof";
import {
  consSubstitution,
  normalizeApply,
  shift,
  shiftExpr,
  substituteBounds,
  substituteExpr,
} from "./substitution";

const getProps = (from: Step) => ({
  location: from.location,
  step: from.step,
  method: from.method,
});

const getLevel = (step: StepNumber | undefined) => step?.level ?? 0;

const isBinary = (
  expression: Expr,
  builtin: Builtin,
): expression is Extract<Expr, { kind: "Apply" }> =>
  isBuiltinApply(expression, builtin) && expression.args.length === 2;

const getMessage = (pattern: string, ...args: (string | Doc)[]) =>
  renderDoc(format(pattern, ...args));

const getBoundHyps = (bounds: Bound[]): Hyp[] =>
  expandDittoes(bounds).map((bound, index): Hyp => {
    const domain =
      bound.domain.kind === "Domain" ? shiftExpr(index, bound.domain.expression) : undefined;
    return {
      kind: "Fresh",
      name: bound.name,
      shape: 0,
      level: domain ? "Constant" : bound.level,
      domain,
      domainVisibility: "Visible",
    };
  });

const expandDittoes = (bounds: Bound[]): Bound[] => {
  let domain: Bound["domain"] = { kind: "NoDomain" };
  return bounds.map((bound) => {
    if (bound.domain.kind === "Ditto") return { ...bound, domain };
    domain = bound.domain;
    return bound;
  });
};

const getRemainingBounds = (first: Bound, rest: Bound[]): Bound[] => {
  const shifted = substituteBounds(shift(1), rest)[1];
  return shifted[0].domain.kind === "Ditto" && first.domain.kind === "Domain"
    ? [
        {
          ...shifted[0],
          domain: { kind: "Domain", expression: shiftExpr(1, first.domain.expression) },
        },
        ...shifted.slice(1),
      ]
    : shifted;
};

const getWitnessProof = (step: Step, sideFacts: Expr[]): Proof => {
  if (sideFacts.length === 0) return { kind: "Obvious", ...getProps(step) };
  const steps = sideFacts.map((item, index): Step => {
    const active = shiftExpr(2 * index + 2, item);
    return {
      kind: "Assert",
      sequent: { context: [], active },
      proof: {
        kind: "By",
        usable: { facts: [shiftExpr(3, active)], defs: [] },
        isOnly: false,
        location: item.location,
        method: step.method,
      },
      location: item.location,
    };
  });
  const facts = [
    at({ kind: "Ix", index: 2 * sideFacts.length + 2 }, step),
    ...sideFacts.map((_item, index) =>
      at({ kind: "Ix", index: 2 * (sideFacts.length - index) }, step),
    ),
  ];
  const qedProof: Proof = {
    kind: "By",
    usable: { facts, defs: [] },
    isOnly: true,
    ...getProps(step),
    method: undefined,
  };
  return {
    kind: "Steps",
    steps,
    qed: { proof: qedProof, location: qedProof.location },
    ...getProps(step),
  };
};

const replaceAt = (expression: Expr, replacement: Expr): Expr =>
  expression.kind === "At" && !expression.isExcept
    ? at(stripProps(replacement), expression)
    : mapChildren(expression, (inner) => replaceAt(inner, replacement));

export const createSimplifier = (counter: Counter) => {
  const getAnonymous = (level: number): StepNumber => ({
    kind: "Named",
    level,
    label: `_a${getUnique(counter)}`,
    isAnonymous: true,
  });

  const renumberNumber = (level: number, step: StepNumber | undefined): StepNumber =>
    step?.kind === "Named" ? { ...step, level } : getAnonymous(level);

  const renumber = (level: number, proof: Proof): Proof => {
    const renumbered: Proof = { ...proof, step: renumberNumber(level, proof.step) };
    if (renumbered.kind !== "Steps") return renumbered;
    const steps = renumbered.steps.map((step) => renumberStep(level, step));
    return {
      ...renumbered,
      steps,
      qed: { ...renumbered.qed, proof: renumber(level + 1, renumbered.qed.proof) },
    };
  };

  const renumberStep = (level: number, step: Step): Step => {
    const renumbered: Step = { ...step, step: renumberNumber(level, step.step) };
    return "proof" in renumbered
      ? { ...renumbered, proof: renumber(level + 1, renumbered.proof) }
      : renumbered;
  };

  const exposeConnective = (context: Hyp[], goal: Expr): Expr => {
    const head = goal.kind === "Apply" ? goal.operator : goal;
    if (head.kind === "Ix") {
      const hyp = context[context.length - head.index];
      if (!hyp) throw new TlaProofError("expose_connective");
      if (hyp.kind !== "Defn" || hyp.definition.kind !== "Operator") return goal;
      const body = shiftExpr(head.index, hyp.definition.body);
      if (goal.kind !== "Apply") return exposeConnective(context, body);
      const operator: Expr = { ...body, location: goal.location };
      return exposeConnective(context, at(normalizeApply(operator, goal.args), operator));
    }
    if (isBuiltinApply(goal, "Prime")) {
      const inner = exposeConnective(context, goal.args[0]);
      const prime = (expression: Expr) => applyBuiltin("Prime", [expression], expression);
      if (inner.kind === "Quant") {
        return at(
          {
            kind: "Quant",
            quantifier: inner.quantifier,
            bounds: mapBoundDomains(inner.bounds, prime),
            body: prime(inner.body),
          },
          goal,
        );
      }
      if (isBinary(inner, "Implies") || isBinary(inner, "Mem")) {
        return at(
          {
            kind: "Apply",
            operator: inner.operator,
            args: [prime(inner.args[0]), prime(inner.args[1])],
          },
          goal,
        );
      }
      return prime(inner);
    }
    if (goal.kind === "Parens") return exposeConnective(context, goal.expression);
    return goal;
  };

  const getRightOperand = (step: Step): Expr | undefined => {
    if (step.kind !== "Assert") return undefined;
    const active = step.sequent.active;
    return active.kind === "Apply" && active.args.length === 2 ? active.args[1] : undefined;
  };

  const expandAt = (proof: Proof): Proof => {
    if (proof.kind !== "Steps") return proof;
    const steps: Step[] = [];
    proof.steps.forEach((step) => {
      const previous = steps.at(-1);
      const right = previous && getRightOperand(previous);
      if (step.kind !== "Assert" || !right) {
        steps.push(step);
        return;
      }
      const active = replaceAt(step.sequent.active, shiftExpr(2, right));
      steps.push({ ...step, sequent: { ...step.sequent, active } });
    });
    return { ...proof, steps };
  };

  const simplify = (context: Hyp[], goal: Expr, original: Proof, time: Time): Proof => {
    const proof = expandAt(original);
    switch (proof.kind) {
      case "Obvious":
      case "Omitted":
      case "Error":
        return proof;
      case "By": {
        const usable = proof.usable;
        const useDefs: Step[] =
          usable.defs.length === 0
            ? []
            : [
                {
                  kind: "Use",
                  usable: { facts: [], defs: usable.defs },
                  isOnly: false,
                  location: proof.location,
                },
              ];
        const useFacts = usable.facts.map((fact, index): Step => ({
          kind: "Use",
          usable: { facts: [shiftExpr(index, fact)], defs: [] },
          isOnly: false,
          location: fact.location,
          useLocation: proof.location,
        }));
        const forget: Step[] = proof.isOnly
          ? [{ kind: "Forget", count: usable.facts.length, location: proof.location }]
          : [];
        const level = getLevel(proof.step);
        const steps = [...useDefs, ...useFacts, ...forget].map((step): Step => ({
          ...step,
          step: getAnonymous(level),
        }));
        const qedProof: Proof = {
          kind: "Obvious",
          location: proof.location,
          step: getAnonymous(level),
          method: proof.method,
        };
        return {
          kind: "Steps",
          steps,
          qed: { proof: qedProof, location: qedProof.location, step: qedProof.step },
          location: proof.location,
          step: proof.step,
        };
      }
      case "Steps": {
        const [inner, steps] = mapAccumulate(
          { context, goal, time },
          proof.steps,
          (state, step) => {
            const [nextContext, nextGoal, simplified, nextTime] = simplifyStep(
              state.context,
              state.goal,
              step,
              state.time,
            );
            return [{ context: nextContext, goal: nextGoal, time: nextTime }, simplified];
          },
        );
        const qedProof = simplify(inner.context, inner.goal, proof.qed.proof, inner.time);
        return { ...proof, steps: steps.flat(), qed: { ...proof.qed, proof: qedProof } };
      }
    }
  };

  const simplifyStep = (
    context: Hyp[],
    goal: Expr,
    step: Step,
    time: Time,
  ): [Hyp[], Expr, Step[], Time] => {
    const level = getLevel(step.step);
    switch (step.kind) {
      case "Forget":
        return [context, goal, [step], time];
      case "Assert": {
        const inner = proveAssertion(context, step.sequent, step, time);
        const simplified: Step = {
          ...step,
          proof: simplify(inner.context, inner.active, step.proof, inner.time),
        };
        const next = useAssertion(false, context, goal, step.sequent, simplified, time);
        return [next.context, next.active, [simplified], time];
      }
      case "Suffices": {
        const inner = useAssertion(true, context, goal, step.sequent, step, time);
        const simplified: Step = {
          ...step,
          proof: simplify(inner.context, inner.active, step.proof, time),
        };
        const next = proveAssertion(context, step.sequent, simplified, time);
        return [next.context, next.active, [simplified], next.time];
      }
      case "Use": {
        const byProof: Proof = {
          kind: "By",
          usable: step.usable,
          isOnly: step.isOnly,
          location: step.location,
          step: step.step,
          method: step.method,
        };
        const simplified = simplify(context, goal, byProof, time);
        if (simplified.kind !== "Steps")
          throw new TlaProofError("simplifying BY does not produce a non-leaf proof!");
        const assumed = step.usable.facts.map(() =>
          getFact(AT_NOWHERE, "Visible", time, step.location),
        );
        return [
          [...context, ...assumed],
          shiftExpr(step.usable.facts.length, goal),
          simplified.steps,
          time,
        ];
      }
      case "Hide": {
        const hidden = step.usable.defs.reduce((current, def) => {
          if (def.kind !== "Dx") throw new TlaProofError("set_vis");
          const index = current.length - def.index;
          const hyp = current[index];
          if (hyp?.kind !== "Defn") {
            const name = hyp ? (hyp.kind === "Fact" ? "??? FACT ???" : hyp.name) : "";
            throw new TlaProofError(
              `USE DEF ${name} invalid because ${name} is not a defined operator`,
            );
          }
          return current.map((entry, position): Hyp =>
            position === index ? { ...hyp, visibility: "Hidden", location: step.location } : entry,
          );
        }, context);
        return [hidden, goal, [step], time];
      }
      case "Define":
        return [
          [
            ...context,
            ...step.definitions.map((definition): Hyp => ({
              kind: "Defn",
              definition,
              whereDefined: { kind: "Proof", time },
              visibility: "Visible",
              isLocal: true,
              location: step.location,
            })),
          ],
          shiftExpr(step.definitions.length, goal),
          [step],
          time,
        ];
      case "Have": {
        const connective = exposeConnective(context, goal);
        const isImplication = isBinary(connective, "Implies");
        const sequent: Sequent = {
          context: [getFact(step.expression, "Visible", time, step.location)],
          active: isImplication ? shiftExpr(1, connective.args[1]) : connective,
        };
        const proof: Proof = isImplication
          ? {
              kind: "By",
              usable: { facts: [at({ kind: "Ix", index: 2 }, step)], defs: [] },
              isOnly: true,
              ...getProps(step),
            }
          : {
              kind: "Error",
              message: getMessage(
                "@.@[<v2>@[%s@ %s@]@,%a@]@.",
                "Error: this HAVE step is applied to the following goal,",
                "which is not an implication:",
                printExpression(context, goal),
              ),
              ...getProps(step),
            };
        const suffices = renumberStep(level, {
          kind: "Suffices",
          sequent,
          proof,
          location: step.location,
          step: step.step,
        });
        return simplifyStep(context, goal, suffices, time);
      }
      case "Take":
        return simplifyStep(
          context,
          goal,
          renumberStep(level, getTakeSuffices(context, goal, step)),
          time,
        );
      case "Witness":
        return simplifyStep(
          context,
          goal,
          renumberStep(level, getWitnessSuffices(context, goal, step)),
          time,
        );
      case "Pcase": {
        const assertion: Step = {
          kind: "Assert",
          sequent: {
            context: [getFact(step.expression, "Visible", time, step.location)],
            active: shiftExpr(1, goal),
          },
          proof: step.proof,
          ...getProps(step),
        };
        return simplifyStep(context, goal, renumberStep(level, assertion), time);
      }
      case "Pick": {
        const existential: Expr = at(
          { kind: "Quant", quantifier: "Exists", bounds: step.bounds, body: step.expression },
          step,
        );
        const salted = getSalted(step.step, "ex");
        const [assertContext, assertGoal, asserted, assertTime] = simplifyStep(
          context,
          goal,
          {
            kind: "Assert",
            sequent: { context: [], active: existential },
            proof: step.proof,
            ...getProps(step),
            step: salted,
          },
          time,
        );
        const shifted = shiftExpr(2, existential);
        if (shifted.kind !== "Quant") throw new TlaProofError("Proof.Simplify.simplify_step/PICK");
        const hyps = [
          ...getBoundHyps(shifted.bounds),
          getFact(shifted.body, "Visible", assertTime, shifted.body.location),
        ];
        const [nextContext, nextGoal, sufficed, nextTime] = simplifyStep(
          assertContext,
          assertGoal,
          {
            kind: "Suffices",
            sequent: { context: hyps, active: shiftExpr(hyps.length, assertGoal) },
            proof: { kind: "Omitted", omission: "Elsewhere", ...getProps(step) },
            ...getProps(step),
          },
          assertTime,
        );
        return [nextContext, nextGoal, [...asserted, ...sufficed], nextTime];
      }
    }
  };

  const getSalted = (step: StepNumber | undefined, salt: string): StepNumber => ({
    kind: "Named",
    level: getLevel(step),
    label: `${step?.kind === "Named" ? step.label : "_a"}${salt}${getUnique(counter)}`,
    isAnonymous: false,
  });

  const getTakeSuffices = (context: Hyp[], goal: Expr, step: Step & { kind: "Take" }): Step => {
    const bounds = expandDittoes(step.bounds);
    const stripBounds = (
      amount: number,
      sideFacts: Expr[],
      current: Expr,
      rest: Bound[],
    ): { sideFacts: Expr[]; goal: Expr } | string => {
      const bound = rest[0];
      if (!bound) return { sideFacts, goal: current };
      const exposed = exposeConnective(context, current);
      if (
        exposed.kind !== "Quant" ||
        exposed.quantifier !== "Forall" ||
        exposed.bounds.length === 0
      ) {
        return getMessage(
          "@.@[<v2>@[<b0>%s@ %s@]@,%a@]@.",
          "Error: this TAKE step is applied to the following goal,",
          "which is not a universal formula:",
          printExpression(context, current),
        );
      }
      const goalBound = exposed.bounds[0];
      const goalBounds = expandDittoes(exposed.bounds).slice(1);
      const domain = bound.domain;
      const goalDomain = goalBound.domain;
      if (domain.kind === "NoDomain" && goalDomain.kind === "Domain") {
        return getMessage(
          "@.@[<b0>%s (%s)@ %s (%s \\in %a)@]@.",
          "Error: the TAKE argument",
          bound.name,
          "does not match the pattern",
          goalBound.name,
          printExpression(context, goalDomain.expression),
        );
      }
      if (domain.kind === "Domain" && goalDomain.kind === "NoDomain") {
        return getMessage(
          "@.@[<b0>%s (%s \\in %a)@ %s (%s)@]@.",
          "Error: the TAKE argument",
          bound.name,
          printExpression(context, domain.expression),
          "does not match the pattern",
          goalBound.name,
        );
      }
      const nextSideFacts =
        domain.kind === "Domain" &&
        goalDomain.kind === "Domain" &&
        !isEqualExpr(domain.expression, goalDomain.expression)
          ? [
              {
                kind: "Apply",
                operator: { kind: "Internal", builtin: "Subseteq" },
                args: [goalDomain.expression, domain.expression],
              } satisfies Expr,
              ...sideFacts,
            ]
          : sideFacts;
      if (goalBounds.length === 0)
        return stripBounds(1, nextSideFacts, exposed.body, rest.slice(1));
      const shiftedBounds =
        rest.length === 1
          ? goalBounds.map((item) => substituteBounds(shift(amount), [item])[1][0])
          : goalBounds;
      return stripBounds(
        amount + 1,
        nextSideFacts,
        at(
          { kind: "Quant", quantifier: "Forall", bounds: shiftedBounds, body: exposed.body },
          exposed,
        ),
        rest.slice(1),
      );
    };
    const stripped = stripBounds(1, [], goal, bounds);
    if (typeof stripped === "string") {
      return {
        kind: "Suffices",
        sequent: {
          context: [getFact(getTrue(goal), "Visible", "Now", step.location)],
          active: goal,
        },
        proof: { kind: "Error", message: stripped, ...getProps(step) },
        ...getProps(step),
      };
    }
    const unique = stripped.sideFacts.filter(
      (item, index) => stripped.sideFacts.findIndex((other) => isEqualExpr(item, other)) === index,
    );
    const facts = [at({ kind: "Ix", index: 2 }, step), ...unique.map((item) => shiftExpr(2, item))];
    return {
      kind: "Suffices",
      sequent: { context: getBoundHyps(bounds), active: stripped.goal },
      proof: { kind: "By", usable: { facts, defs: [] }, isOnly: true, ...getProps(step) },
      ...getProps(step),
    };
  };

  const getWitnessSuffices = (
    context: Hyp[],
    goal: Expr,
    step: Step & { kind: "Witness" },
  ): Step => {
    const sideFacts: Expr[] = [];
    let error = "";
    let current = goal;
    for (const witness of step.expressions) {
      const exposed = exposeConnective(context, current);
      if (
        exposed.kind !== "Quant" ||
        exposed.quantifier !== "Exists" ||
        exposed.bounds.length === 0
      ) {
        error ||= getMessage(
          "@.@[<v2>@[<b0>%s@ %s@]@,%a@]@.",
          "Error: this WITNESS step is applied to the following goal,",
          "which is not an existential formula:",
          printExpression(context, exposed),
        );
        current = exposed;
        break;
      }
      const [first, ...rest] = exposed.bounds;
      const next =
        rest.length === 0
          ? exposed.body
          : at(
              {
                kind: "Quant",
                quantifier: "Exists",
                bounds: getRemainingBounds(first, rest),
                body: exposed.body,
              },
              exposed,
            );
      let value = witness;
      if (first.domain.kind === "Domain") {
        const domain = first.domain.expression;
        const membership = exposeConnective(context, witness);
        if (isBinary(membership, "Mem")) {
          const [term, termDomain] = membership.args;
          const subset = isEqualExpr(termDomain, domain)
            ? []
            : [applyBuiltin("Subseteq", [termDomain, domain], termDomain)];
          sideFacts.push(...subset, membership);
          value = term;
        } else {
          error ||= getMessage(
            "@.@[<b0>%s (%a)@ %s (%s \\in %a)@]@.",
            "Error: the WITNESS argument",
            printExpression(context, membership),
            "does not match the pattern",
            first.name,
            printExpression(context, domain),
          );
          value = membership;
        }
      }
      const unprimable = applyBuiltin("Unprimable", [value], value);
      current = substituteExpr(consSubstitution(unprimable, shift(0)), next);
    }
    const proof: Proof =
      error === ""
        ? getWitnessProof(step, sideFacts)
        : { kind: "Error", message: error, ...getProps(step) };
    return {
      kind: "Suffices",
      sequent: { context: [], active: current },
      proof,
      ...getProps(step),
    };
  };

  return simplify;
};

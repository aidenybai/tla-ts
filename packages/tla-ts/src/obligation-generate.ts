// A port of tlapm's proof simplification (Proof.Simplify) and obligation generation (Proof.Gen):
// leaf proofs become obligations whose context is everything the proof may use at that point.

import { TlapmBugError, TlaProofError } from "./errors";
import {
  applyBuiltin,
  at,
  consSubstitution,
  exprifySequent,
  isEqualExpr,
  mapAccumulate,
  normalizeApply,
  shift,
  shiftExpr,
  substituteBounds,
  substituteExpr,
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Locus,
  type Sequent,
  type Visibility,
  mapChildren,
  stripProps,
} from "./obligation-expression";
import { format, renderDoc, type Doc } from "./obligation-format";
import { printExpression } from "./obligation-printer";
import {
  getStepName,
  getUnique,
  type Counter,
  type Obligation,
  type ObligationKind,
  type Proof,
  type Step,
  type StepNumber,
  type UseDef,
  type Usable,
} from "./obligation-proof";

const AT_NOWHERE: Expr = { kind: "At", isExcept: false };

// tlapm builds nodes with x @@ step, which copies all of the step's properties.
const getProps = (from: Step) => ({
  location: from.location,
  step: from.step,
  isSuppressed: from.isSuppressed,
});

const isAnonymous = (step: StepNumber | undefined) => step?.kind === "Named" && step.isAnonymous;

const getLevel = (step: StepNumber | undefined) => step?.level ?? 0;

const getTrue = (from: { location?: Locus }) => at({ kind: "Internal", builtin: "TRUE" }, from);

const isBinary = (
  expression: Expr,
  builtin: Builtin,
): expression is Extract<Expr, { kind: "Apply" }> =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  expression.operator.builtin === builtin &&
  expression.args.length === 2;

const getMessage = (pattern: string, ...args: (string | Doc)[]) =>
  renderDoc(format(pattern, ...args));

// Visit.hyps_of_bounds_unditto: dittos repeat the previous domain, and each domain shifts past the
// names bound before it.
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

// Each visible fact of the sequent, shifted past the hypotheses after it.
const getAssumedFacts = (offset: number, sequent: Sequent) =>
  sequent.context.flatMap((hyp, index) =>
    hyp.kind === "Fact" && hyp.visibility === "Visible"
      ? [shiftExpr(offset + sequent.context.length - 1 - index, hyp.expression)]
      : [],
  );

const getStepDefinition = (step: Step, body: Expr): Hyp => {
  if (!step.step) throw new TlapmBugError();
  return {
    kind: "Defn",
    definition: { kind: "Operator", name: getStepName(step.step), body, location: step.location },
    whereDefined: "Proof",
    visibility: "Visible",
    isLocal: true,
    location: step.location,
  };
};

const proveAssertion = (context: Hyp[], sequent: Sequent, step: Step) => {
  const visibility: Visibility = isAnonymous(step.step) ? "Visible" : "Hidden";
  const hyps = sequent.context.map((hyp): Hyp =>
    hyp.kind === "Fact" ? { ...hyp, visibility } : hyp,
  );
  const body = at({ kind: "List", bullet: "Refs", items: getAssumedFacts(2, sequent) }, step);
  return {
    context: [
      ...context,
      ...hyps,
      {
        kind: "Fact",
        expression: getTrue(step),
        visibility: "Hidden",
        location: step.location,
      },
      getStepDefinition(step, body),
      {
        kind: "Fact",
        expression: at({ kind: "Ix", index: 1 }, step),
        visibility: "Hidden",
        location: step.location,
      },
    ] satisfies Hyp[],
    active: shiftExpr(3, sequent.active),
  };
};

const useAssertion = (
  isSuffices: boolean,
  context: Hyp[],
  goal: Expr,
  sequent: Sequent,
  step: Step,
) => {
  const visibility: Visibility = isSuffices || isAnonymous(step.step) ? "Visible" : "Hidden";
  return {
    context: [
      ...context,
      getStepDefinition(step, at(exprifySequent(sequent), step)),
      {
        kind: "Fact",
        expression: at({ kind: "Ix", index: 1 }, step),
        visibility,
        location: step.location,
      },
    ] satisfies Hyp[],
    active: shiftExpr(2, goal),
  };
};

const setDefinition = (visibility: Visibility, context: Hyp[], def: UseDef): Hyp[] => {
  if (def.kind !== "Dx") throw new TlaProofError(`Unknown definition ${def.name}`);
  const index = context.length - def.index;
  const hyp = context[index];
  if (!hyp) return context;
  if (hyp.kind !== "Defn") throw new TlaProofError("Indicated point is not a definition");
  return context.map((entry, position) => (position === index ? { ...hyp, visibility } : entry));
};

const isDomainMatch = (fact: Expr, domain: Expr) =>
  fact.kind === "Apply" &&
  fact.operator.kind === "Internal" &&
  fact.operator.builtin === "Mem" &&
  fact.args[0]?.kind === "Ix" &&
  fact.args[0].index === 0 &&
  isEqualExpr(domain, fact.args[1]);

const setExpression = (visibility: Visibility, fact: Expr, context: Hyp[]): Hyp[] => {
  let isFound = false;
  let current = fact;
  const result = [...context];
  for (let index = context.length - 1; index >= 0; index--) {
    current = shiftExpr(-1, current);
    const hyp = context[index];
    if (hyp.kind === "Fact" && isEqualExpr(hyp.expression, current)) {
      isFound = true;
      result[index] = { ...hyp, visibility };
    } else if (hyp.kind === "Fresh" && hyp.domain && isDomainMatch(current, hyp.domain)) {
      isFound = true;
      result[index] = { ...hyp, domainVisibility: visibility };
    }
  }
  if (!isFound) {
    throw new TlaProofError("This expression does not appear in the context and cannot be hidden.");
  }
  return result;
};

// The lines of tlapm's --toolbox and --line options, which select the proofs to generate.
export interface LineRange {
  start: number;
  end: number;
}

export interface Generator {
  generate: (sequent: Sequent, proof: Proof) => Proof;
  collect: (proof: Proof) => Obligation[];
  mutate: (
    context: Hyp[],
    mode: "Use" | "Hide",
    usable: Usable,
    location: Locus | undefined,
  ) => [Hyp[], Obligation[]];
  simplify: (context: Hyp[], goal: Expr, proof: Proof) => Proof;
}

// The bounds after a witnessed one, where a ditto takes the witnessed domain.
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

// A WITNESS proves each membership and subset it relies on, then the goal from them.
const getWitnessProof = (step: Step, aux: Expr[]): Proof => {
  if (step.isSuppressed || aux.length === 0) return { kind: "Obvious", ...getProps(step) };
  const steps = aux.map((item, index): Step => {
    const active = shiftExpr(2 * index + 2, item);
    return {
      kind: "Assert",
      sequent: { context: [], active },
      proof: {
        kind: "By",
        usable: { facts: [shiftExpr(3, active)], defs: [] },
        isOnly: false,
        location: item.location,
      },
      location: item.location,
    };
  });
  const facts = [
    at({ kind: "Ix", index: 2 * aux.length + 2 }, step),
    ...aux.map((_item, index) => at({ kind: "Ix", index: 2 * (aux.length - index) }, step)),
  ];
  const qedProof: Proof = {
    kind: "By",
    usable: { facts, defs: [] },
    isOnly: true,
    ...getProps(step),
  };
  return {
    kind: "Steps",
    steps,
    qed: { proof: qedProof, location: qedProof.location },
    ...getProps(step),
  };
};

const obligate = (
  sequent: Sequent,
  from: { location?: Locus },
  kind: ObligationKind,
): Obligation => ({ sequent, location: from.location, kind });

const replaceAt = (expression: Expr, replacement: Expr): Expr =>
  expression.kind === "At" && !expression.isExcept
    ? at(stripProps(replacement), expression)
    : mapChildren(expression, (inner) => replaceAt(inner, replacement));

export const createGenerator = (
  counter: Counter,
  inputFiles: Set<string>,
  lines: LineRange,
): Generator => {
  const generate = (sequent: Sequent, proof: Proof): Proof => {
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
        const [inner, steps] = mapAccumulate(sequent, proof.steps, generateStep);
        const qedProof = generate(inner, proof.qed.proof);
        return { ...proof, steps, qed: { ...proof.qed, proof: qedProof } };
      }
    }
  };

  const generateStep = (sequent: Sequent, step: Step): [Sequent, Step] => {
    switch (step.kind) {
      case "Forget": {
        const count = sequent.context.length;
        const context = sequent.context.map((hyp, index): Hyp =>
          hyp.kind === "Fact" && hyp.visibility === "Visible" && step.count + index < count
            ? { ...hyp, visibility: "Hidden" }
            : hyp,
        );
        return [{ ...sequent, context }, step];
      }
      case "Use": {
        const usable = step.usable;
        if (usable.defs.length === 0 && usable.facts.length === 1) {
          const fact = usable.facts[0];
          const obligation = obligate({ ...sequent, active: fact }, step, { kind: "Support" });
          return [
            {
              context: [
                ...sequent.context,
                { kind: "Fact", expression: fact, visibility: "Visible", location: fact.location },
              ],
              active: shiftExpr(1, sequent.active),
            },
            { ...step, obligations: [obligation] },
          ];
        }
        if (usable.facts.length > 0)
          throw new TlaProofError("Proof.Gen.gen_step: USE with facts and definitions");
        const context = usable.defs.reduce(
          (current, def) => setDefinition("Visible", current, def),
          sequent.context,
        );
        return [{ ...sequent, context }, step];
      }
      case "Hide": {
        const hidden = step.usable.defs.reduce(
          (current, def) => setDefinition("Hidden", current, def),
          sequent.context,
        );
        const context = step.usable.facts.reduceRight(
          (current, fact) => setExpression("Hidden", fact, current),
          hidden,
        );
        return [{ ...sequent, context }, step];
      }
      case "Define":
        return [
          {
            context: [
              ...sequent.context,
              ...step.definitions.map((definition): Hyp => ({
                kind: "Defn",
                definition,
                whereDefined: "User",
                visibility: "Visible",
                isLocal: true,
                location: definition.location,
              })),
            ],
            active: shiftExpr(step.definitions.length, sequent.active),
          },
          step,
        ];
      case "Assert": {
        const proof = generate(proveAssertion(sequent.context, step.sequent, step), step.proof);
        const generated: Step = { ...step, proof };
        return [
          useAssertion(false, sequent.context, sequent.active, step.sequent, generated),
          generated,
        ];
      }
      case "Suffices": {
        const proof = generate(
          useAssertion(true, sequent.context, sequent.active, step.sequent, step),
          step.proof,
        );
        const generated: Step = { ...step, proof };
        return [proveAssertion(sequent.context, step.sequent, generated), generated];
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
    const [sequent, generated] = generateStep(
      { context, active: { ...AT_NOWHERE, location } },
      mode === "Use"
        ? { kind: "Use", usable, isOnly: false, location, step }
        : { kind: "Hide", usable, location, step },
    );
    return [sequent.context, generated.obligations ?? []];
  };

  // The definitions go first, then each fact on its own, shifting the facts after it.
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

  // collect: a QED's obligations come before its sibling steps', and a step's own before its proof's.
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
      if (
        step.kind === "Assert" ||
        step.kind === "Suffices" ||
        step.kind === "Pcase" ||
        step.kind === "Pick"
      ) {
        visitProof(step.proof);
      }
    };
    visitProof(proof);
    return obligations;
  };

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
    switch (renumbered.kind) {
      case "Assert":
      case "Suffices":
      case "Pcase":
      case "Pick":
        return { ...renumbered, proof: renumber(level + 1, renumbered.proof) };
      default:
        return renumbered;
    }
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
    if (
      goal.kind === "Apply" &&
      goal.operator.kind === "Internal" &&
      goal.operator.builtin === "Prime"
    ) {
      const inner = exposeConnective(context, goal.args[0]);
      const prime = (expression: Expr) => applyBuiltin("Prime", [expression], expression);
      if (inner.kind === "Quant") {
        return at(
          {
            kind: "Quant",
            quantifier: inner.quantifier,
            bounds: inner.bounds.map((bound) =>
              bound.domain.kind === "Domain"
                ? {
                    ...bound,
                    domain: { kind: "Domain", expression: prime(bound.domain.expression) },
                  }
                : bound,
            ),
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

  // at_expand: @ in a step stands for the right side of the previous step's assertion.
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

  const simplify = (context: Hyp[], goal: Expr, original: Proof): Proof => {
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
          isSuppressed: proof.isSuppressed,
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
          isSuppressed: proof.isSuppressed,
        };
        return {
          kind: "Steps",
          steps,
          qed: { proof: qedProof, location: qedProof.location, step: qedProof.step },
          location: proof.location,
          step: proof.step,
          isSuppressed: proof.isSuppressed,
        };
      }
      case "Steps": {
        let currentContext = context;
        let currentGoal = goal;
        const steps = proof.steps.flatMap((step) => {
          const [nextContext, nextGoal, simplified] = simplifyStep(
            currentContext,
            currentGoal,
            step,
          );
          currentContext = nextContext;
          currentGoal = nextGoal;
          return simplified;
        });
        const qedProof = simplify(currentContext, currentGoal, proof.qed.proof);
        return { ...proof, steps, qed: { ...proof.qed, proof: qedProof } };
      }
    }
  };

  const simplifyStep = (context: Hyp[], goal: Expr, step: Step): [Hyp[], Expr, Step[]] => {
    const level = getLevel(step.step);
    switch (step.kind) {
      case "Forget":
        return [context, goal, [step]];
      case "Assert": {
        const inner = proveAssertion(context, step.sequent, step);
        const simplified: Step = {
          ...step,
          proof: simplify(inner.context, inner.active, step.proof),
        };
        const next = useAssertion(false, context, goal, step.sequent, simplified);
        return [next.context, next.active, [simplified]];
      }
      case "Suffices": {
        const inner = useAssertion(true, context, goal, step.sequent, step);
        const simplified: Step = {
          ...step,
          proof: simplify(inner.context, inner.active, step.proof),
        };
        const next = proveAssertion(context, step.sequent, simplified);
        return [next.context, next.active, [simplified]];
      }
      case "Use": {
        const byProof: Proof = {
          kind: "By",
          usable: step.usable,
          isOnly: step.isOnly,
          location: step.location,
          step: step.step,
          isSuppressed: step.isSuppressed,
        };
        const simplified = simplify(context, goal, byProof);
        if (simplified.kind !== "Steps")
          throw new TlaProofError("simplifying BY does not produce a non-leaf proof!");
        const assumed = step.usable.facts.map((): Hyp => ({
          kind: "Fact",
          expression: AT_NOWHERE,
          visibility: "Visible",
          location: step.location,
        }));
        return [
          [...context, ...assumed],
          shiftExpr(step.usable.facts.length, goal),
          simplified.steps,
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
          return current.map((entry, position) =>
            position === index
              ? { ...hyp, visibility: "Hidden" as const, location: step.location }
              : entry,
          );
        }, context);
        return [hidden, goal, [step]];
      }
      case "Define":
        return [
          [
            ...context,
            ...step.definitions.map((definition): Hyp => ({
              kind: "Defn",
              definition,
              whereDefined: "Proof",
              visibility: "Visible",
              isLocal: true,
              location: step.location,
            })),
          ],
          shiftExpr(step.definitions.length, goal),
          [step],
        ];
      case "Have": {
        const connective = exposeConnective(context, goal);
        const fact: Hyp = {
          kind: "Fact",
          expression: step.expression,
          visibility: "Visible",
          location: step.location,
        };
        const isImplication = isBinary(connective, "Implies");
        const sequent: Sequent = {
          context: [fact],
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
        return simplifyStep(context, goal, suffices);
      }
      case "Take":
        return simplifyStep(
          context,
          goal,
          renumberStep(level, getTakeSuffices(context, goal, step)),
        );
      case "Witness":
        return simplifyStep(
          context,
          goal,
          renumberStep(level, getWitnessSuffices(context, goal, step)),
        );
      case "Pcase": {
        const assertion: Step = {
          kind: "Assert",
          sequent: {
            context: [
              {
                kind: "Fact",
                expression: step.expression,
                visibility: "Visible",
                location: step.location,
              },
            ],
            active: shiftExpr(1, goal),
          },
          proof: step.proof,
          ...getProps(step),
        };
        return simplifyStep(context, goal, renumberStep(level, assertion));
      }
      case "Pick": {
        const existential: Expr = at(
          { kind: "Quant", quantifier: "Exists", bounds: step.bounds, body: step.expression },
          step,
        );
        const salted = getSalted(step.step, "ex");
        const [assertContext, assertGoal, asserted] = simplifyStep(context, goal, {
          kind: "Assert",
          sequent: { context: [], active: existential },
          proof: step.proof,
          ...getProps(step),
          step: salted,
        });
        const shifted = shiftExpr(2, existential);
        if (shifted.kind !== "Quant") throw new TlaProofError("Proof.Simplify.simplify_step/PICK");
        const hyps = [
          ...getBoundHyps(shifted.bounds),
          {
            kind: "Fact",
            expression: shifted.body,
            visibility: "Visible",
            location: shifted.body.location,
          } satisfies Hyp,
        ];
        const [nextContext, nextGoal, sufficed] = simplifyStep(assertContext, assertGoal, {
          kind: "Suffices",
          sequent: { context: hyps, active: shiftExpr(hyps.length, assertGoal) },
          proof: { kind: "Omitted", omission: "Elsewhere", ...getProps(step) },
          ...getProps(step),
        });
        return [nextContext, nextGoal, [...asserted, ...sufficed]];
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
      aux: Expr[],
      current: Expr,
      rest: Bound[],
    ): { aux: Expr[]; goal: Expr } | string => {
      const bound = rest[0];
      if (!bound) return { aux, goal: current };
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
      const nextAux =
        domain.kind === "Domain" &&
        goalDomain.kind === "Domain" &&
        !isEqualExpr(domain.expression, goalDomain.expression)
          ? [
              {
                kind: "Apply",
                operator: { kind: "Internal", builtin: "Subseteq" },
                args: [goalDomain.expression, domain.expression],
              } satisfies Expr,
              ...aux,
            ]
          : aux;
      if (goalBounds.length === 0) return stripBounds(1, nextAux, exposed.body, rest.slice(1));
      const shiftedBounds =
        rest.length === 1
          ? goalBounds.map((item) => substituteBounds(shift(amount), [item])[1][0])
          : goalBounds;
      return stripBounds(
        amount + 1,
        nextAux,
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
          context: [
            {
              kind: "Fact",
              expression: getTrue(goal),
              visibility: "Visible",
              location: step.location,
            },
          ],
          active: goal,
        },
        proof: { kind: "Error", message: stripped, ...getProps(step) },
        ...getProps(step),
      };
    }
    const unique = stripped.aux.filter(
      (item, index) => stripped.aux.findIndex((other) => isEqualExpr(item, other)) === index,
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
    const aux: Expr[] = [];
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
          aux.push(...subset, membership);
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
        ? getWitnessProof(step, aux)
        : { kind: "Error", message: error, ...getProps(step) };
    return {
      kind: "Suffices",
      sequent: { context: [], active: current },
      proof,
      ...getProps(step),
    };
  };

  return { generate, collect, mutate, simplify };
};

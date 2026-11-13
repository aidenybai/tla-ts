// A port of tlapm's anonymization (Expr.Anon, Elab.desugar and Proof.Anon).

import { TlapmBugError, TlaProofError } from "../errors";
import { consSubstitution, normalizeApply, shift, shiftExpr, substituteExpr } from "./substitution";
import { isEqualExpr } from "./equality";
import {
  AT_NOWHERE,
  adjoin,
  adjoinAll,
  applyBuiltin,
  at,
  exprifySequent,
  findNamed,
  getScopeHyps,
  getBoundFresh,
  getErrorNote,
  getErrorSetting,
  getFresh,
  getLocalDefn,
  getLocusPrefix,
  getScopeAt,
  getTrue,
  mapAccumulate,
  mapBoundDomains,
  mapScoped,
  mapSelectorArgs,
  warnError,
  type Bound,
  type Defn,
  type ExceptPoint,
  type Expr,
  type ExprCore,
  type Hyp,
  type Warn,
  type ParenForm,
  type Scope,
  type Selector,
  type Sequent,
  type WhereDefined,
} from "./expression";
import { renderDoc } from "./format";
import { printExpression } from "./printer";
import { resolveSubexpression } from "./subexpression";
import { getTime } from "./temporal";
import {
  getStepName,
  getUnique,
  type Counter,
  type Proof,
  type Step,
  type StepNumber,
  type UseDef,
  type Usable,
} from "./proof";

const DUMMY_FACT: Hyp = {
  kind: "Fact",
  expression: AT_NOWHERE,
  visibility: "Visible",
  time: "Always",
};

const ANON_SELECTOR_FAILURES = {
  Number: "1NUM",
  Down: "1DOWN",
  At: "1AT",
  Instance: "1INST",
  Left: "1",
  Right: "1",
};

const BAD_EXPRESSION: Expr = { kind: "Opaque", name: "$badexp" };

const withLocus = (expression: Expr, from: Expr) =>
  from.location ? { ...expression, location: from.location } : expression;

interface AnonContext {
  warnedSteps: string[];
  scope: Scope | undefined;
}

export const createAnonymizer = (
  counter: Counter,
  expandInstance: (
    scope: Scope | undefined,
    definition: Extract<Defn, { kind: "Instance" }>,
  ) => Defn[],
  onWarning: Warn,
) => {
  let currentAt: { expression: Expr; size: number } | undefined;

  const getContext = (scope: Scope | undefined): AnonContext => ({ warnedSteps: [], scope });

  const getSize = (context: AnonContext) => context.scope?.size ?? 0;

  const anonymizeExpr = (context: AnonContext, expression: Expr): Expr => {
    if (expression.kind === "At" && expression.isExcept) {
      if (!currentAt) return expression;
      return shiftExpr(getSize(context) - currentAt.size, currentAt.expression);
    }
    if (expression.kind !== "Except") return anonymizeCore(context, expression);
    const base = anonymizeExpr(context, expression.function);
    return expression.specs.reduce((result, spec) => {
      const [path, trail] = mapAccumulate(
        result,
        spec.trail,
        (current, point): [Expr, ExceptPoint] => {
          if (point.kind === "Dot") {
            return [at({ kind: "Dot", expression: current, field: point.field }, current), point];
          }
          const key = anonymizeExpr(context, point.expression);
          return [
            at({ kind: "FcnApp", function: current, args: [key] }, current),
            { kind: "Apply", expression: key },
          ];
        },
      );
      const saved = currentAt;
      currentAt = { expression: path, size: getSize(context) };
      const value = anonymizeExpr(context, spec.value);
      currentAt = saved;
      return at({ kind: "Except", function: result, specs: [{ trail, value }] }, expression);
    }, base);
  };

  const createAnonApply = (index: number, args: Expr[], from: Expr): Expr => {
    const indexed = at({ kind: "Ix", index }, from);
    return args.length === 0 ? indexed : at({ kind: "Apply", operator: indexed, args }, from);
  };

  const createStandardForm = (
    index: number,
    whereDefined: WhereDefined,
    body: Expr,
    args: Expr[],
    from: Expr,
  ): Expr => {
    if (whereDefined !== "Builtin") return createAnonApply(index, args, from);
    const shifted = shiftExpr(index, body);
    return at(args.length === 0 ? shifted : normalizeApply(shifted, args), from);
  };

  const resolveName = (context: AnonContext, name: string, args: Expr[], from: Expr): Expr => {
    const found = findNamed(context.scope, name);
    if (!found) {
      const message = `Operator "${name}" not found`;
      warnError(onWarning, from.location, message);
      throw new TlaProofError(message, { failure: "Expr.Anon: 4" });
    }
    const index = found.depth + 1;
    const hyp = found.hyp;
    switch (hyp.kind) {
      case "Defn": {
        const definition = hyp.definition;
        if (definition.kind === "Operator") {
          return createStandardForm(index, hyp.whereDefined, definition.body, args, from);
        }
        if (definition.kind === "Recursive") {
          const message = "Recursive operators not supported by TLAPS";
          onWarning(getErrorSetting(hyp.location, message));
          throw new TlaProofError(message, { failure: "Expr.Anon: Recursive" });
        }
        return createAnonApply(index, args, from);
      }
      case "Fresh":
        return createAnonApply(index, args, from);
      case "Flex":
        if (args.length > 0)
          throw new TlapmBugError(
            'File "src/expr/e_anon.ml", line 224, characters 24-30: Assertion failed',
          );
        return at({ kind: "Ix", index }, from);
      case "Fact":
        throw new TlapmBugError(
          'File "src/expr/e_anon.ml", line 230, characters 24-36: Assertion failed',
        );
    }
  };

  const resolveBang = (
    context: AnonContext,
    prefix: string,
    args: Expr[],
    selectors: Selector[],
    isInstance: boolean,
    from: Expr,
  ): Expr => {
    const found = findNamed(context.scope, prefix);
    if (!found) {
      const [selector, ...rest] = selectors;
      if (selector?.kind === "Label") {
        const labelArgs = selector.args.map((arg) => anonymizeExpr(context, arg));
        return resolveBang(
          context,
          `${prefix}!${selector.label}`,
          [...args, ...labelArgs],
          rest,
          true,
          from,
        );
      }
      const message = `Operator "${prefix}" not found`;
      if (selector) onWarning(getErrorNote(from.location, message));
      onWarning(getErrorSetting(from.location, message));
      throw new TlaProofError(message, {
        failure: `Expr.Anon: ${selector ? ANON_SELECTOR_FAILURES[selector.kind] : "1EMPTY"}`,
      });
    }
    const hyp = found.hyp;
    if (
      hyp.kind !== "Defn" ||
      (hyp.definition.kind !== "Operator" && hyp.definition.kind !== "Bpragma")
    ) {
      onWarning(
        getErrorNote(
          from.location,
          `invalid subexpression reference in:  ${renderDoc(printExpression([], from))}`,
        ),
      );
      onWarning(getErrorSetting(from.location, "invalid subexpression reference"));
      throw new TlaProofError("invalid subexpression reference", { failure: "Expr.Anon: 3" });
    }
    const index = found.depth + 1;
    if (selectors.length === 0 && isInstance) {
      return args.length === 0
        ? at({ kind: "Ix", index }, from)
        : createStandardForm(index, hyp.whereDefined, hyp.definition.body, args, from);
    }
    const body = withLocus(shiftExpr(index, hyp.definition.body), from);
    const hyps = getScopeHyps(context.scope);
    return withLocus(resolveSubexpression(onWarning, hyps, body, args, selectors), from);
  };

  const anonymizeCore = (context: AnonContext, expression: Expr): Expr => {
    switch (expression.kind) {
      case "Bang": {
        const inner = expression.expression;
        if (inner.kind === "Apply" && inner.operator.kind === "Opaque") {
          const selectors = expression.selectors.map((selector) =>
            mapSelectorArgs(selector, (arg) => anonymizeExpr(context, arg)),
          );
          const args = inner.args.map((arg) => anonymizeExpr(context, arg));
          const bangContext = getContext(context.scope);
          return resolveBang(bangContext, inner.operator.name, args, selectors, false, expression);
        }
        return anonymizeExpr(context, {
          ...expression,
          expression: at({ kind: "Apply", operator: inner, args: [] }, inner),
        });
      }
      case "Apply": {
        if (expression.operator.kind !== "Opaque") return visit(context, expression);
        const name = expression.operator.name;
        if (context.warnedSteps.includes(name)) {
          onWarning({
            text: `${getLocusPrefix(expression.location)}Warning: ${name} does not introduce any assumptions. It does not make sense to use it here.\n`,
            channel: "toolbox",
          });
          return getTrue(expression);
        }
        const args = expression.args.map((arg) => anonymizeExpr(context, arg));
        return resolveName(context, name, args, expression);
      }
      case "Opaque":
        return anonymizeExpr(
          context,
          at({ kind: "Apply", operator: expression, args: [] }, expression),
        );
      case "Parens":
        if (expression.form.kind === "Syntax") return anonymizeExpr(context, expression.expression);
        return {
          ...expression,
          expression: anonymizeExpr(context, expression.expression),
          form: anonymizeParenForm(context, expression.form),
        };
      default:
        return visit(context, expression);
    }
  };

  const anonymizeParenForm = (context: AnonContext, form: ParenForm): ParenForm => {
    if (form.kind !== "Nlabel") return form;
    return {
      kind: "Xlabel",
      label: form.label,
      indices: form.names.map((name) => {
        const found = findNamed(context.scope, name);
        if (!found) {
          const message = `Identifier "${name}" in label parameters not found`;
          warnError(onWarning, form.location, message);
          throw new TlaProofError(message, { failure: "Expr.Anon" });
        }
        return { name, index: found.depth + 1 };
      }),
    };
  };

  const withScope = (context: AnonContext, scope: Scope | undefined): AnonContext => ({
    warnedSteps: context.warnedSteps,
    scope,
  });

  const adjoinContext = (context: AnonContext, hyp: Hyp) =>
    withScope(context, adjoin(context.scope, hyp));

  const adjoinBounds = (context: AnonContext, items: Bound[]) =>
    withScope(context, adjoinAll(context.scope, items.map(getBoundFresh)));

  const anonymizeBounds = (context: AnonContext, items: Bound[]): [AnonContext, Bound[]] => {
    const mapped = mapBoundDomains(items, (domain) => anonymizeExpr(context, domain));
    return [adjoinBounds(context, mapped), mapped];
  };

  const visit = (context: AnonContext, expression: Expr): Expr => {
    if (expression.kind === "Sequent") {
      return { ...expression, sequent: anonymizeSequent(context, expression.sequent)[1] };
    }
    if (expression.kind === "Let") {
      const [inner, definitions] = anonymizeDefns(context, expression.definitions);
      return { ...expression, definitions, body: anonymizeExpr(inner, expression.body) };
    }
    return mapScoped(context, expression, anonymizeExpr, adjoinContext);
  };

  const anonymizeDefn = (context: AnonContext, definition: Defn): Defn => {
    if (definition.kind !== "Operator") return definition;
    const body = definition.body;
    if (body.kind !== "Fcn") return { ...definition, body: anonymizeExpr(context, body) };
    const inner = anonymizeExpr(
      adjoinContext(context, getFresh(definition.name, "Constant")),
      body,
    );
    const marker: Expr = { kind: "Opaque", name: "%%%" };
    const isRecursive = !isEqualExpr(
      substituteExpr(consSubstitution(marker, shift(1)), inner),
      inner,
    );
    if (!isRecursive) return { ...definition, body: shiftExpr(-1, inner) };
    const equation = applyBuiltin("Eq", [at({ kind: "Ix", index: 1 }, inner), inner], inner);
    return {
      ...definition,
      body: at({ kind: "Choose", name: definition.name, domain: undefined, body: equation }, inner),
    };
  };

  const anonymizeDefns = (context: AnonContext, definitions: Defn[]): [AnonContext, Defn[]] => {
    let current = context;
    const queue = [...definitions];
    const mapped: Defn[] = [];
    for (let index = 0; index < queue.length; index++) {
      const definition = queue[index];
      if (definition.kind === "Instance") {
        queue.splice(index + 1, 0, ...expandInstance(current.scope, definition));
        continue;
      }
      const result = anonymizeDefn(current, definition);
      current = adjoinContext(current, { ...getLocalDefn(result), isConstnessUnset: true });
      mapped.push(result);
    }
    return [current, mapped];
  };

  const anonymizeHyp = (context: AnonContext, item: Hyp): [AnonContext, Hyp] => {
    const mapped = ((): Hyp => {
      switch (item.kind) {
        case "Fresh":
          return item.domain ? { ...item, domain: anonymizeExpr(context, item.domain) } : item;
        case "Flex":
          return item;
        case "Defn":
          return { ...item, definition: anonymizeDefn(context, item.definition) };
        case "Fact": {
          const expression = anonymizeExpr(context, item.expression);
          return { ...item, expression, time: getTime(context.scope, expression) };
        }
      }
    })();
    return [adjoinContext(context, mapped), mapped];
  };

  const anonymizeSequent = (context: AnonContext, item: Sequent): [AnonContext, Sequent] => {
    const [inner, hyps] = mapAccumulate(context, item.context, anonymizeHyp);
    return [inner, { context: hyps, active: anonymizeExpr(inner, item.active) }];
  };

  const pushWarnedStep = (context: AnonContext, step: StepNumber): AnonContext => ({
    warnedSteps: [getStepName(step), ...context.warnedSteps],
    scope: context.scope,
  });

  const adjoinStep = (context: AnonContext, step: StepNumber, body: Expr, from: Step) =>
    adjoinContext(context, {
      kind: "Defn",
      definition: { kind: "Operator", name: getStepName(step), body, location: from.location },
      whereDefined: { kind: "Proof", time: "Always" },
      visibility: "Visible",
      isLocal: true,
      isConstnessUnset: true,
      location: from.location,
    });

  const bumpContext = (context: AnonContext, count: number) =>
    withScope(
      context,
      adjoinAll(
        context.scope,
        Array.from({ length: count }, () => DUMMY_FACT),
      ),
    );

  const getTupleForm = (item: Sequent): ExprCore => {
    const facts = item.context.map((entry, index) => {
      const amount = item.context.length - index + 1;
      if (entry.kind === "Fact") return shiftExpr(amount, entry.expression);
      if (entry.kind !== "Fresh" || !entry.domain) return BAD_EXPRESSION;
      const membership = applyBuiltin(
        "Mem",
        [at({ kind: "Ix", index: 0 }, entry.domain), entry.domain],
        entry.domain,
      );
      return shiftExpr(amount, membership);
    });
    const elements = [...facts, shiftExpr(1, item.active)];
    return elements.length === 1 ? elements[0] : { kind: "Tuple", elements };
  };

  const isCitable = (step: Step) =>
    step.kind !== "Use" && step.kind !== "Hide" && step.kind !== "Define";

  const anonymizeUsable = (context: AnonContext, item: Usable): Usable => ({
    facts: item.facts.map((fact) => anonymizeExpr(context, fact)),
    defs: item.defs.flatMap((def): UseDef[] => {
      if (def.kind === "Dx") return [def];
      const resolved = anonymizeExpr(context, at({ kind: "Opaque", name: def.name }, def));
      if (resolved.kind !== "Ix") {
        onWarning({
          text: `${getLocusPrefix(def.location)}Ignored unexpandable identifier ${JSON.stringify(def.name)} in BY DEF.`,
          channel: "stderr",
        });
        return [];
      }
      if (getScopeAt(context.scope, resolved.index - 1)?.hyp.kind !== "Defn") {
        onWarning({
          text: `${getLocusPrefix(def.location)}${JSON.stringify(def.name)} is not a definition and cannot be used in a DEF clause.`,
          channel: "toolbox",
        });
        return [];
      }
      return [{ kind: "Dx", index: resolved.index, location: def.location }];
    }),
  });

  const anonymizeProof = (context: AnonContext, item: Proof): Proof => {
    switch (item.kind) {
      case "Steps": {
        const [inner, steps] = mapAccumulate(context, item.steps, anonymizeStep);
        const qedProof = anonymizeProof(
          item.step ? pushWarnedStep(inner, item.step) : inner,
          item.qed.proof,
        );
        return { ...item, steps, qed: { ...item.qed, proof: qedProof } };
      }
      case "By":
        return { ...item, usable: anonymizeUsable(context, item.usable) };
      default:
        return item;
    }
  };

  const anonymizeStep = (context: AnonContext, original: Step): [AnonContext, Step] => {
    const number: StepNumber | undefined =
      original.step?.kind === "Unnamed" && isCitable(original)
        ? {
            kind: "Named",
            level: original.step.level,
            label: `_a${getUnique(counter)}`,
            isAnonymous: true,
          }
        : original.step;
    if (!number) throw new TlapmBugError();
    const item: Step = { ...original, step: number };
    switch (item.kind) {
      case "Assert": {
        const [, mapped] = anonymizeSequent(context, item.sequent);
        const assumptions = mapped.context.reduce(adjoinContext, context);
        const withTuple = bumpContext(
          adjoinStep(bumpContext(assumptions, 1), number, at(getTupleForm(mapped), item), item),
          1,
        );
        const inner = mapped.context.length === 0 ? pushWarnedStep(withTuple, number) : withTuple;
        const result: Step = { ...item, sequent: mapped, proof: anonymizeProof(inner, item.proof) };
        return [
          bumpContext(adjoinStep(context, number, at(exprifySequent(mapped), item), item), 1),
          result,
        ];
      }
      case "Pcase": {
        const expression = anonymizeExpr(context, item.expression);
        const tuple = at({ kind: "Tuple", elements: [shiftExpr(2, expression)] }, item);
        const inner = bumpContext(adjoinStep(bumpContext(context, 2), number, tuple, item), 1);
        const result: Step = { ...item, expression, proof: anonymizeProof(inner, item.proof) };
        const after = adjoinStep(
          context,
          number,
          at({ kind: "Tuple", elements: [expression] }, item),
          item,
        );
        return [bumpContext(after, 1), result];
      }
      case "Suffices": {
        const [, mapped] = anonymizeSequent(context, item.sequent);
        const fact = at({ kind: "Tuple", elements: [at(exprifySequent(mapped), item)] }, item);
        const inner = bumpContext(adjoinStep(context, number, fact, item), 1);
        const result: Step = { ...item, sequent: mapped, proof: anonymizeProof(inner, item.proof) };
        const assumptions = mapped.context.reduce(adjoinContext, context);
        const tuple = at({ kind: "Tuple", elements: [at(getTupleForm(mapped), item)] }, item);
        return [
          bumpContext(adjoinStep(bumpContext(assumptions, 1), number, tuple, item), 1),
          result,
        ];
      }
      case "Have": {
        const expression = anonymizeExpr(context, item.expression);
        const tuple = at({ kind: "Tuple", elements: [shiftExpr(2, expression)] }, item);
        return [
          bumpContext(adjoinStep(bumpContext(context, 2), number, tuple, item), 1),
          { ...item, expression },
        ];
      }
      case "Take": {
        const [inner, mapped] = anonymizeBounds(context, item.bounds);
        const universal = at(
          { kind: "Quant", quantifier: "Forall", bounds: mapped, body: BAD_EXPRESSION },
          item,
        );
        return [
          bumpContext(adjoinStep(bumpContext(inner, 1), number, universal, item), 1),
          { ...item, bounds: mapped },
        ];
      }
      case "Witness": {
        const expressions = item.expressions.map((expression) =>
          anonymizeExpr(context, expression),
        );
        const tuple = at({ kind: "Tuple", elements: expressions }, item);
        return [
          bumpContext(adjoinStep(bumpContext(context, 1), number, tuple, item), 1),
          { ...item, expressions },
        ];
      }
      case "Pick": {
        const [boundContext, mapped] = anonymizeBounds(context, item.bounds);
        const expression = anonymizeExpr(boundContext, item.expression);
        const existential = at(
          { kind: "Quant", quantifier: "Exists", bounds: mapped, body: expression },
          item,
        );
        const inner = pushWarnedStep(
          bumpContext(adjoinStep(bumpContext(context, 1), number, existential, item), 1),
          number,
        );
        const result: Step = {
          ...item,
          bounds: mapped,
          expression,
          proof: anonymizeProof(inner, item.proof),
        };
        const declared = adjoinBounds(bumpContext(context, 2), mapped);
        const shifted = shiftExpr(4 + mapped.length, existential);
        return [
          bumpContext(adjoinStep(bumpContext(declared, 2), number, shifted, item), 1),
          result,
        ];
      }
      case "Use": {
        const mapped = anonymizeUsable(context, item.usable);
        return [bumpContext(context, mapped.facts.length), { ...item, usable: mapped }];
      }
      case "Hide":
        return [context, { ...item, usable: anonymizeUsable(context, item.usable) }];
      case "Define": {
        const [inner, definitions] = anonymizeDefns(context, item.definitions);
        return [inner, { ...item, definitions }];
      }
      case "Forget":
        return [context, item];
    }
  };

  return {
    expr: (scope: Scope | undefined, expression: Expr) =>
      anonymizeExpr(getContext(scope), expression),
    defn: (scope: Scope | undefined, definition: Defn) =>
      anonymizeDefn(getContext(scope), definition),
    sequent: (scope: Scope | undefined, item: Sequent) =>
      anonymizeSequent(getContext(scope), item)[1],
    usable: (scope: Scope | undefined, item: Usable) => anonymizeUsable(getContext(scope), item),
    proof: (scope: Scope | undefined, item: Proof) => anonymizeProof(getContext(scope), item),
  };
};

export type Anonymizer = ReturnType<typeof createAnonymizer>;

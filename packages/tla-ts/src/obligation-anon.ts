// A port of tlapm's anonymization (Expr.Anon, Elab.desugar and Proof.Anon): names become de Bruijn
// indices into the context, builtin definitions are inlined, and anonymous steps get names.

import { TlapmBugError, TlaProofError } from "./errors";
import {
  adjoin,
  adjoinAll,
  applyBuiltin,
  at,
  consSubstitution,
  exprifySequent,
  findNamed,
  getFresh,
  getScopeAt,
  isEqualExpr,
  mapAccumulate,
  mapBoundDomains,
  mapScoped,
  mapSelectorArgs,
  normalizeApply,
  shift,
  shiftExpr,
  substituteExpr,
  type Bound,
  type Defn,
  type ExceptPoint,
  type Expr,
  type ExprCore,
  type Hyp,
  type ParenForm,
  type Scope,
  type Selector,
  type Sequent,
  type WhereDefined,
} from "./obligation-expression";
import { resolveSubexpression } from "./obligation-deref";
import {
  getStepName,
  getUnique,
  type Counter,
  type Proof,
  type Step,
  type StepNumber,
  type UseDef,
  type Usable,
} from "./obligation-proof";

const DUMMY_FACT: Hyp = {
  kind: "Fact",
  expression: { kind: "At", isExcept: false },
  visibility: "Visible",
};

const BAD_EXPRESSION: Expr = { kind: "Opaque", name: "$badexp" };

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
) => {
  // Elab.desugar's current_at: the value @ stands for inside an EXCEPT, and the context size there.
  let currentAt: { expression: Expr; size: number } | undefined;

  const getSize = (context: AnonContext) => context.scope?.size ?? 0;

  const expr = (context: AnonContext, expression: Expr): Expr => {
    if (expression.kind === "At" && expression.isExcept) {
      if (!currentAt) return expression;
      return shiftExpr(getSize(context) - currentAt.size, currentAt.expression);
    }
    if (expression.kind !== "Except") return anonCore(context, expression);
    const base = expr(context, expression.function);
    return expression.specs.reduce((result, spec) => {
      const [path, trail] = mapAccumulate(
        result,
        spec.trail,
        (current, point): [Expr, ExceptPoint] => {
          if (point.kind === "Dot") {
            return [at({ kind: "Dot", expression: current, field: point.field }, current), point];
          }
          const key = expr(context, point.expression);
          return [
            at({ kind: "FcnApp", function: current, args: [key] }, current),
            { kind: "Apply", expression: key },
          ];
        },
      );
      const saved = currentAt;
      currentAt = { expression: path, size: getSize(context) };
      const value = expr(context, spec.value);
      currentAt = saved;
      return at({ kind: "Except", function: result, specs: [{ trail, value }] }, expression);
    }, base);
  };

  const anonApply = (index: number, args: Expr[], from: Expr): Expr => {
    const indexed = at({ kind: "Ix", index }, from);
    return args.length === 0 ? indexed : at({ kind: "Apply", operator: indexed, args }, from);
  };

  const standardForm = (
    index: number,
    whereDefined: WhereDefined,
    body: Expr,
    args: Expr[],
    from: Expr,
  ): Expr => {
    if (whereDefined !== "Builtin") return anonApply(index, args, from);
    const shifted = shiftExpr(index, body);
    return at(args.length === 0 ? shifted : normalizeApply(shifted, args), from);
  };

  const resolveName = (context: AnonContext, name: string, args: Expr[], from: Expr): Expr => {
    const found = findNamed(context.scope, name);
    if (!found) throw new TlaProofError(`Operator "${name}" not found`);
    const index = found.depth + 1;
    const hyp = found.hyp;
    switch (hyp.kind) {
      case "Defn": {
        const definition = hyp.definition;
        if (definition.kind === "Operator") {
          return standardForm(index, hyp.whereDefined, definition.body, args, from);
        }
        if (definition.kind === "Recursive")
          throw new TlaProofError("Recursive operators not supported by TLAPS");
        return anonApply(index, args, from);
      }
      case "Fresh":
        return anonApply(index, args, from);
      case "Flex":
        return at({ kind: "Ix", index }, from);
      case "Fact":
        throw new TlaProofError(`Operator "${name}" not found`);
    }
  };

  // Expr.Anon's check: a prefix that names nothing joins the next label, as in an instance path.
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
      if (!selector || selector.kind !== "Label")
        throw new TlaProofError(`Operator "${prefix}" not found`);
      const labelArgs = selector.args.map((arg) => expr(context, arg));
      return resolveBang(
        context,
        `${prefix}!${selector.label}`,
        [...args, ...labelArgs],
        rest,
        true,
        from,
      );
    }
    const hyp = found.hyp;
    if (
      hyp.kind !== "Defn" ||
      (hyp.definition.kind !== "Operator" && hyp.definition.kind !== "Bpragma")
    ) {
      throw new TlaProofError("invalid subexpression reference");
    }
    const index = found.depth + 1;
    if (selectors.length === 0 && isInstance) {
      return args.length === 0
        ? at({ kind: "Ix", index }, from)
        : standardForm(index, hyp.whereDefined, hyp.definition.body, args, from);
    }
    const body = withLocus(shiftExpr(index, hyp.definition.body), from);
    return withLocus(resolveSubexpression(body, args, selectors), from);
  };

  const anonCore = (context: AnonContext, expression: Expr): Expr => {
    switch (expression.kind) {
      case "Bang": {
        const inner = expression.expression;
        if (inner.kind === "Apply" && inner.operator.kind === "Opaque") {
          const selectors = expression.selectors.map((selector) =>
            mapSelectorArgs(selector, (arg) => expr(context, arg)),
          );
          const args = inner.args.map((arg) => expr(context, arg));
          const bangContext = { warnedSteps: [], scope: context.scope };
          return resolveBang(bangContext, inner.operator.name, args, selectors, false, expression);
        }
        return expr(context, {
          ...expression,
          expression: at({ kind: "Apply", operator: inner, args: [] }, inner),
        });
      }
      case "Apply": {
        if (expression.operator.kind !== "Opaque") return visit(context, expression);
        const name = expression.operator.name;
        if (context.warnedSteps.includes(name))
          return at({ kind: "Internal", builtin: "TRUE" }, expression);
        const args = expression.args.map((arg) => expr(context, arg));
        return resolveName(context, name, args, expression);
      }
      case "Opaque":
        return expr(context, at({ kind: "Apply", operator: expression, args: [] }, expression));
      case "Parens":
        if (expression.form.kind === "Syntax") return expr(context, expression.expression);
        return {
          ...expression,
          expression: expr(context, expression.expression),
          form: anonParenForm(context, expression.form),
        };
      default:
        return visit(context, expression);
    }
  };

  const anonParenForm = (context: AnonContext, form: ParenForm): ParenForm => {
    if (form.kind !== "Nlabel") return form;
    return {
      kind: "Xlabel",
      label: form.label,
      indices: form.names.map((name) => {
        const found = findNamed(context.scope, name);
        if (!found) throw new TlaProofError(`Identifier "${name}" in label parameters not found`);
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

  const bounds = (context: AnonContext, items: Bound[]): [AnonContext, Bound[]] => {
    const mapped = mapBoundDomains(items, (domain) => expr(context, domain));
    const inner = mapped.reduce(
      (current, bound) => adjoinContext(current, getFresh(bound.name, bound.level)),
      context,
    );
    return [inner, mapped];
  };

  // Visit.map, apart from the definitions an ASSUME or a LET binds.
  const visit = (context: AnonContext, expression: Expr): Expr => {
    if (expression.kind === "Sequent") {
      return { ...expression, sequent: sequent(context, expression.sequent)[1] };
    }
    if (expression.kind === "Let") {
      const [inner, definitions] = defns(context, expression.definitions);
      return { ...expression, definitions, body: expr(inner, expression.body) };
    }
    return mapScoped(context, expression, expr, adjoinContext);
  };

  // Expr.Anon's defn turns a recursive function definition into a CHOOSE over its own equation.
  const defn = (context: AnonContext, definition: Defn): Defn => {
    if (definition.kind !== "Operator") return definition;
    const body = definition.body;
    if (body.kind !== "Fcn") return { ...definition, body: expr(context, body) };
    const inner = expr(adjoinContext(context, getFresh(definition.name, "Constant")), body);
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

  // Module.Elab.anon#defns: an INSTANCE stands for the definitions it instantiates.
  const defns = (context: AnonContext, definitions: Defn[]): [AnonContext, Defn[]] => {
    let current = context;
    const queue = [...definitions];
    const mapped: Defn[] = [];
    for (let index = 0; index < queue.length; index++) {
      const definition = queue[index];
      if (definition.kind === "Instance") {
        queue.splice(index + 1, 0, ...expandInstance(current.scope, definition));
        continue;
      }
      const result = defn(current, definition);
      current = adjoinContext(current, {
        kind: "Defn",
        definition: result,
        whereDefined: "User",
        visibility: "Visible",
        isLocal: true,
      });
      mapped.push(result);
    }
    return [current, mapped];
  };

  const hyp = (context: AnonContext, item: Hyp): [AnonContext, Hyp] => {
    const mapped = ((): Hyp => {
      switch (item.kind) {
        case "Fresh":
          return item.domain ? { ...item, domain: expr(context, item.domain) } : item;
        case "Flex":
          return item;
        case "Defn":
          return { ...item, definition: defn(context, item.definition) };
        case "Fact":
          return { ...item, expression: expr(context, item.expression) };
      }
    })();
    return [adjoinContext(context, mapped), mapped];
  };

  const sequent = (context: AnonContext, item: Sequent): [AnonContext, Sequent] => {
    const [inner, hyps] = mapAccumulate(context, item.context, hyp);
    return [inner, { context: hyps, active: expr(inner, item.active) }];
  };

  const pushWarnedStep = (context: AnonContext, step: StepNumber): AnonContext => ({
    warnedSteps: [getStepName(step), ...context.warnedSteps],
    scope: context.scope,
  });

  const adjStep = (context: AnonContext, step: StepNumber, body: Expr, from: Step) =>
    adjoinContext(context, {
      kind: "Defn",
      definition: { kind: "Operator", name: getStepName(step), body, location: from.location },
      whereDefined: "Proof",
      visibility: "Visible",
      isLocal: true,
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

  const tupleForm = (item: Sequent): ExprCore => {
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

  const usable = (context: AnonContext, item: Usable): Usable => ({
    facts: item.facts.map((fact) => expr(context, fact)),
    defs: item.defs.flatMap((def): UseDef[] => {
      if (def.kind === "Dx") return [def];
      const resolved = expr(context, at({ kind: "Opaque", name: def.name }, def));
      if (resolved.kind !== "Ix") return [];
      // tlapm reports a DEF of a declaration and drops it.
      if (getScopeAt(context.scope, resolved.index - 1)?.hyp.kind !== "Defn") return [];
      return [{ kind: "Dx", index: resolved.index, location: def.location }];
    }),
  });

  const proof = (context: AnonContext, item: Proof): Proof => {
    switch (item.kind) {
      case "Steps": {
        const [inner, steps] = mapAccumulate(context, item.steps, step);
        const qedProof = proof(
          item.step ? pushWarnedStep(inner, item.step) : inner,
          item.qed.proof,
        );
        return { ...item, steps, qed: { ...item.qed, proof: qedProof } };
      }
      case "By":
        return { ...item, usable: usable(context, item.usable) };
      default:
        return item;
    }
  };

  const step = (context: AnonContext, original: Step): [AnonContext, Step] => {
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
        const [, mapped] = sequent(context, item.sequent);
        const assumptions = mapped.context.reduce(adjoinContext, context);
        const withTuple = bumpContext(
          adjStep(bumpContext(assumptions, 1), number, at(tupleForm(mapped), item), item),
          1,
        );
        const inner = mapped.context.length === 0 ? pushWarnedStep(withTuple, number) : withTuple;
        const result: Step = { ...item, sequent: mapped, proof: proof(inner, item.proof) };
        return [
          bumpContext(adjStep(context, number, at(exprifySequent(mapped), item), item), 1),
          result,
        ];
      }
      case "Pcase": {
        const expression = expr(context, item.expression);
        const tuple = at({ kind: "Tuple", elements: [shiftExpr(2, expression)] }, item);
        const inner = bumpContext(adjStep(bumpContext(context, 2), number, tuple, item), 1);
        const result: Step = { ...item, expression, proof: proof(inner, item.proof) };
        const after = adjStep(
          context,
          number,
          at({ kind: "Tuple", elements: [expression] }, item),
          item,
        );
        return [bumpContext(after, 1), result];
      }
      case "Suffices": {
        const [, mapped] = sequent(context, item.sequent);
        const fact = at({ kind: "Tuple", elements: [at(exprifySequent(mapped), item)] }, item);
        const inner = bumpContext(adjStep(context, number, fact, item), 1);
        const result: Step = { ...item, sequent: mapped, proof: proof(inner, item.proof) };
        const assumptions = mapped.context.reduce(adjoinContext, context);
        const tuple = at({ kind: "Tuple", elements: [at(tupleForm(mapped), item)] }, item);
        return [bumpContext(adjStep(bumpContext(assumptions, 1), number, tuple, item), 1), result];
      }
      case "Have": {
        const expression = expr(context, item.expression);
        const tuple = at({ kind: "Tuple", elements: [shiftExpr(2, expression)] }, item);
        return [
          bumpContext(adjStep(bumpContext(context, 2), number, tuple, item), 1),
          { ...item, expression },
        ];
      }
      case "Take": {
        const [inner, mapped] = bounds(context, item.bounds);
        const universal = at(
          { kind: "Quant", quantifier: "Forall", bounds: mapped, body: BAD_EXPRESSION },
          item,
        );
        return [
          bumpContext(adjStep(bumpContext(inner, 1), number, universal, item), 1),
          { ...item, bounds: mapped },
        ];
      }
      case "Witness": {
        const expressions = item.expressions.map((expression) => expr(context, expression));
        const tuple = at({ kind: "Tuple", elements: expressions }, item);
        return [
          bumpContext(adjStep(bumpContext(context, 1), number, tuple, item), 1),
          { ...item, expressions },
        ];
      }
      case "Pick": {
        const [boundContext, mapped] = bounds(context, item.bounds);
        const expression = expr(boundContext, item.expression);
        const existential = at(
          { kind: "Quant", quantifier: "Exists", bounds: mapped, body: expression },
          item,
        );
        const inner = pushWarnedStep(
          bumpContext(adjStep(bumpContext(context, 1), number, existential, item), 1),
          number,
        );
        const result: Step = {
          ...item,
          bounds: mapped,
          expression,
          proof: proof(inner, item.proof),
        };
        const declared = mapped.reduce(
          (current, bound) => adjoinContext(current, getFresh(bound.name, bound.level)),
          bumpContext(context, 2),
        );
        const shifted = shiftExpr(4 + mapped.length, existential);
        return [bumpContext(adjStep(bumpContext(declared, 2), number, shifted, item), 1), result];
      }
      case "Use": {
        const mapped = usable(context, item.usable);
        return [bumpContext(context, mapped.facts.length), { ...item, usable: mapped }];
      }
      case "Hide":
        return [context, { ...item, usable: usable(context, item.usable) }];
      case "Define": {
        const [inner, definitions] = defns(context, item.definitions);
        return [inner, { ...item, definitions }];
      }
      case "Forget":
        return [context, item];
    }
  };

  return {
    expr: (scope: Scope | undefined, expression: Expr) =>
      expr({ warnedSteps: [], scope }, expression),
    defn: (scope: Scope | undefined, definition: Defn) =>
      defn({ warnedSteps: [], scope }, definition),
    sequent: (scope: Scope | undefined, item: Sequent) =>
      sequent({ warnedSteps: [], scope }, item)[1],
    usable: (scope: Scope | undefined, item: Usable) => usable({ warnedSteps: [], scope }, item),
    proof: (scope: Scope | undefined, item: Proof) => proof({ warnedSteps: [], scope }, item),
  };
};

// Util.set_locus: the node keeps its properties and takes the location of from.
const withLocus = (expression: Expr, from: Expr) =>
  from.location ? { ...expression, location: from.location } : expression;

export type Anonymizer = ReturnType<typeof createAnonymizer>;

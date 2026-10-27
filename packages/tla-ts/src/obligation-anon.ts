// A port of tlapm's anonymization (Expr.Anon, Elab.desugar and Proof.Anon): names become de Bruijn
// indices into the context, builtin definitions are inlined, and anonymous steps get names.

import { TlaProofError } from "./errors";
import {
  at,
  getBoundedFresh,
  getFresh,
  getHypName,
  isEqualExpr,
  normalizeApply,
  shift,
  shiftExpr,
  substituteExpr,
  consSubstitution,
  type Bound,
  type Defn,
  type Expr,
  type ExprCore,
  type Hyp,
  type ParenForm,
  type Selector,
  type Sequent,
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

// A persistent context, newest hypothesis first, so binders extend it without copying.
export interface Scope {
  hyp: Hyp;
  rest: Scope | undefined;
  size: number;
}

export const adjoin = (scope: Scope | undefined, hyp: Hyp): Scope => ({
  hyp,
  rest: scope,
  size: (scope?.size ?? 0) + 1,
});

export const adjoinAll = (scope: Scope | undefined, hyps: Hyp[]) =>
  hyps.reduce<Scope | undefined>(adjoin, scope);

export const getScopeHyps = (scope: Scope | undefined): Hyp[] => {
  const hyps: Hyp[] = [];
  for (let current = scope; current; current = current.rest) hyps.push(current.hyp);
  return hyps.reverse();
};

export const findNamed = (scope: Scope | undefined, name: string) => {
  let depth = 0;
  for (let current = scope; current; current = current.rest) {
    if (getHypName(current.hyp) === name) return { depth, hyp: current.hyp };
    depth++;
  }
  return undefined;
};

export const getNth = (scope: Scope | undefined, depth: number) => {
  let current = scope;
  for (let index = 0; index < depth && current; index++) current = current.rest;
  return current?.hyp;
};

const DUMMY: Expr = { kind: "At", isExcept: false };

const DUMMY_FACT: Hyp = { kind: "Fact", expression: DUMMY, visibility: "Visible" };

const BAD_EXPRESSION: Expr = { kind: "Opaque", name: "$badexp" };

const bump = (scope: Scope | undefined, count: number) => {
  let current = scope;
  for (let index = 0; index < count; index++) current = adjoin(current, DUMMY_FACT);
  return current;
};

export const exprifySequent = (sequent: Sequent): ExprCore =>
  sequent.context.length === 0 ? sequent.active : { kind: "Sequent", sequent };

interface AnonContext {
  warnings: string[];
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
      let path = result;
      const trail = spec.trail.map((point) => {
        if (point.kind === "Dot") {
          path = at({ kind: "Dot", expression: path, field: point.field }, path);
          return point;
        }
        const key = expr(context, point.expression);
        path = at({ kind: "FcnApp", function: path, args: [key] }, path);
        return { kind: "Apply" as const, expression: key };
      });
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
    whereDefined: string,
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

  const resolveBang = (
    context: AnonContext,
    operator: string,
    args: Expr[],
    selectors: Selector[],
    from: Expr,
  ): Expr => {
    const bangContext = { warnings: [], scope: context.scope };
    let prefix = operator;
    let prefixArgs = args;
    let rest = selectors;
    let isInstance = false;
    while (true) {
      const found = findNamed(bangContext.scope, prefix);
      if (!found) {
        const selector = rest[0];
        if (!selector || selector.kind !== "Label")
          throw new TlaProofError(`Operator "${prefix}" not found`);
        prefix = `${prefix}!${selector.label}`;
        prefixArgs = [...prefixArgs, ...selector.args.map((arg) => expr(bangContext, arg))];
        rest = rest.slice(1);
        isInstance = true;
        continue;
      }
      const hyp = found.hyp;
      if (
        hyp.kind !== "Defn" ||
        (hyp.definition.kind !== "Operator" && hyp.definition.kind !== "Bpragma")
      ) {
        throw new TlaProofError("invalid subexpression reference");
      }
      const index = found.depth + 1;
      if (rest.length === 0 && isInstance) {
        return prefixArgs.length === 0
          ? at({ kind: "Ix", index }, from)
          : standardForm(index, hyp.whereDefined, hyp.definition.body, prefixArgs, from);
      }
      const body = withLocus(shiftExpr(index, hyp.definition.body), from);
      return withLocus(resolveSubexpression(body, prefixArgs, rest), from);
    }
  };

  const anonCore = (context: AnonContext, expression: Expr): Expr => {
    switch (expression.kind) {
      case "Bang": {
        const inner = expression.expression;
        if (inner.kind === "Apply" && inner.operator.kind === "Opaque") {
          const selectors = expression.selectors.map((selector) => sel(context, selector));
          const args = inner.args.map((arg) => expr(context, arg));
          return resolveBang(context, inner.operator.name, args, selectors, expression);
        }
        return expr(context, {
          ...expression,
          expression: at({ kind: "Apply", operator: inner, args: [] }, inner),
        });
      }
      case "Apply": {
        if (expression.operator.kind !== "Opaque") return visit(context, expression);
        const name = expression.operator.name;
        if (context.warnings.includes(name))
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
          form: pform(context, expression.form),
        };
      default:
        return visit(context, expression);
    }
  };

  const pform = (context: AnonContext, form: ParenForm): ParenForm => {
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

  const sel = (context: AnonContext, selector: Selector): Selector =>
    selector.kind === "Instance" || selector.kind === "Label"
      ? { ...selector, args: selector.args.map((arg) => expr(context, arg)) }
      : selector;

  const withScope = (context: AnonContext, scope: Scope | undefined): AnonContext => ({
    warnings: context.warnings,
    scope,
  });

  const adj = (context: AnonContext, hyp: Hyp) => withScope(context, adjoin(context.scope, hyp));

  const bounds = (context: AnonContext, items: Bound[]): [AnonContext, Bound[]] => {
    const mapped = items.map((bound): Bound =>
      bound.domain.kind === "Domain"
        ? {
            ...bound,
            domain: { kind: "Domain", expression: expr(context, bound.domain.expression) },
          }
        : bound,
    );
    const inner = mapped.reduce(
      (current, bound) => adj(current, getFresh(bound.name, bound.level)),
      context,
    );
    return [inner, mapped];
  };

  const visit = (context: AnonContext, expression: Expr): Expr => {
    const recurse = (inner: Expr) => expr(context, inner);
    switch (expression.kind) {
      case "Ix":
      case "Internal":
      case "Opaque":
      case "String":
      case "Num":
      case "At":
        return expression;
      case "Bang":
        return {
          ...expression,
          expression: recurse(expression.expression),
          selectors: expression.selectors.map((selector) => sel(context, selector)),
        };
      case "Lambda": {
        const inner = expression.params.reduce(
          (current, param) => adj(current, getFresh(param.name, "Unknown", param.shape)),
          context,
        );
        return { ...expression, body: expr(inner, expression.body) };
      }
      case "Apply":
        return {
          ...expression,
          operator: recurse(expression.operator),
          args: expression.args.map(recurse),
        };
      case "Sequent":
        return { ...expression, sequent: sequent(context, expression.sequent)[1] };
      case "With":
        return { ...expression, expression: recurse(expression.expression) };
      case "Let": {
        const [inner, definitions] = defns(context, expression.definitions);
        return { ...expression, definitions, body: expr(inner, expression.body) };
      }
      case "If":
        return {
          ...expression,
          condition: recurse(expression.condition),
          consequent: recurse(expression.consequent),
          alternative: recurse(expression.alternative),
        };
      case "List":
        return { ...expression, items: expression.items.map(recurse) };
      case "Quant": {
        const [inner, mapped] = bounds(context, expression.bounds);
        return { ...expression, bounds: mapped, body: expr(inner, expression.body) };
      }
      case "Tquant": {
        const inner = expression.names.reduce(
          (current, name) => adj(current, { kind: "Flex", name }),
          context,
        );
        return { ...expression, body: expr(inner, expression.body) };
      }
      case "Choose": {
        const domain = expression.domain && recurse(expression.domain);
        const hyp = domain
          ? getBoundedFresh(expression.name, domain)
          : getFresh(expression.name, "Constant");
        return { ...expression, domain, body: expr(adj(context, hyp), expression.body) };
      }
      case "SetSt": {
        const domain = recurse(expression.domain);
        return {
          ...expression,
          domain,
          body: expr(adj(context, getBoundedFresh(expression.name, domain)), expression.body),
        };
      }
      case "SetOf": {
        const [inner, mapped] = bounds(context, expression.bounds);
        return { ...expression, bounds: mapped, element: expr(inner, expression.element) };
      }
      case "SetEnum":
        return { ...expression, elements: expression.elements.map(recurse) };
      case "Fcn": {
        const [inner, mapped] = bounds(context, expression.bounds);
        return { ...expression, bounds: mapped, body: expr(inner, expression.body) };
      }
      case "FcnApp":
        return {
          ...expression,
          function: recurse(expression.function),
          args: expression.args.map(recurse),
        };
      case "Arrow":
        return {
          ...expression,
          domain: recurse(expression.domain),
          range: recurse(expression.range),
        };
      case "Product":
        return { ...expression, factors: expression.factors.map(recurse) };
      case "Tuple":
        return { ...expression, elements: expression.elements.map(recurse) };
      case "Rect":
      case "Record":
        return {
          ...expression,
          fields: expression.fields.map((field) => ({
            name: field.name,
            value: recurse(field.value),
          })),
        };
      case "Except":
        return {
          ...expression,
          function: recurse(expression.function),
          specs: expression.specs.map((spec) => ({
            trail: spec.trail.map((point) =>
              point.kind === "Apply"
                ? { kind: "Apply" as const, expression: recurse(point.expression) }
                : point,
            ),
            value: recurse(spec.value),
          })),
        };
      case "Dot":
        return { ...expression, expression: recurse(expression.expression) };
      case "Sub":
      case "Tsub":
        return {
          ...expression,
          action: recurse(expression.action),
          subscript: recurse(expression.subscript),
        };
      case "Fair":
        return {
          ...expression,
          subscript: recurse(expression.subscript),
          action: recurse(expression.action),
        };
      case "Case":
        return {
          ...expression,
          arms: expression.arms.map((arm) => ({
            condition: recurse(arm.condition),
            body: recurse(arm.body),
          })),
          other: expression.other && recurse(expression.other),
        };
      case "Parens":
        return {
          ...expression,
          expression: recurse(expression.expression),
          form: pform(context, expression.form),
        };
    }
  };

  // Expr.Anon's defn turns a recursive function definition into a CHOOSE over its own equation.
  const defn = (context: AnonContext, definition: Defn): Defn => {
    if (definition.kind !== "Operator") return definition;
    const body = definition.body;
    if (body.kind !== "Fcn") return { ...definition, body: expr(context, body) };
    const inner = expr(adj(context, getFresh(definition.name, "Constant")), body);
    const marker: Expr = { kind: "Opaque", name: "%%%" };
    const isRecursive = !isEqualExpr(
      substituteExpr(consSubstitution(marker, shift(1)), inner),
      inner,
    );
    if (!isRecursive) return { ...definition, body: shiftExpr(-1, inner) };
    const equation = at(
      {
        kind: "Apply",
        operator: at({ kind: "Internal", builtin: "Eq" }, inner),
        args: [at({ kind: "Ix", index: 1 }, inner), inner],
      },
      inner,
    );
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
      current = adj(current, {
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
    return [adj(context, mapped), mapped];
  };

  const sequent = (context: AnonContext, item: Sequent): [AnonContext, Sequent] => {
    let current = context;
    const hyps = item.context.map((entry) => {
      const [next, mapped] = hyp(current, entry);
      current = next;
      return mapped;
    });
    return [current, { context: hyps, active: expr(current, item.active) }];
  };

  const pushName = (context: AnonContext, step: StepNumber): AnonContext => ({
    warnings: [getStepName(step), ...context.warnings],
    scope: context.scope,
  });

  const adjStep = (context: AnonContext, step: StepNumber, body: Expr, from: Step) =>
    adj(context, {
      kind: "Defn",
      definition: { kind: "Operator", name: getStepName(step), body, location: from.location },
      whereDefined: "Proof",
      visibility: "Visible",
      isLocal: true,
      location: from.location,
    });

  const bumpContext = (context: AnonContext, count: number) =>
    withScope(context, bump(context.scope, count));

  const tupleForm = (item: Sequent): ExprCore => {
    const count = item.context.length;
    const facts: Expr[] = [];
    item.context.forEach((entry) => {
      const amount = count - facts.length + 1;
      if (entry.kind === "Fact") facts.push(shiftExpr(amount, entry.expression));
      else if (entry.kind === "Fresh" && entry.domain) {
        const membership: Expr = at(
          {
            kind: "Apply",
            operator: at({ kind: "Internal", builtin: "Mem" }, entry.domain),
            args: [at({ kind: "Ix", index: 0 }, entry.domain), entry.domain],
          },
          entry.domain,
        );
        facts.push(shiftExpr(amount, membership));
      } else facts.push(BAD_EXPRESSION);
    });
    facts.push(shiftExpr(1, item.active));
    return facts.length === 1 ? facts[0] : { kind: "Tuple", elements: facts };
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
      if (getNth(context.scope, resolved.index - 1)?.kind !== "Defn") return [];
      return [{ kind: "Dx", index: resolved.index, location: def.location }];
    }),
  });

  const proof = (context: AnonContext, item: Proof): Proof => {
    switch (item.kind) {
      case "Steps": {
        const [inner, steps] = stepList(context, item.steps);
        const qedProof = proof(item.step ? pushName(inner, item.step) : inner, item.qed.proof);
        return { ...item, steps, qed: { ...item.qed, proof: qedProof } };
      }
      case "By":
        return { ...item, usable: usable(context, item.usable) };
      default:
        return item;
    }
  };

  const stepList = (context: AnonContext, steps: Step[]): [AnonContext, Step[]] => {
    let current = context;
    const mapped = steps.map((entry) => {
      const [next, result] = step(current, entry);
      current = next;
      return result;
    });
    return [current, mapped];
  };

  const step = (context: AnonContext, original: Step): [AnonContext, Step] => {
    const number: StepNumber =
      original.step?.kind === "Unnamed" && isCitable(original)
        ? {
            kind: "Named",
            level: original.step.level,
            label: `_a${getUnique(counter)}`,
            isAnonymous: true,
          }
        : (original.step as StepNumber);
    const item: Step = { ...original, step: number };
    switch (item.kind) {
      case "Assert": {
        const [, mapped] = sequent(context, item.sequent);
        const assumptions = mapped.context.reduce(adj, context);
        const withTuple = bumpContext(
          adjStep(bumpContext(assumptions, 1), number, at(tupleForm(mapped), item), item),
          1,
        );
        const inner = mapped.context.length === 0 ? pushName(withTuple, number) : withTuple;
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
        const assumptions = mapped.context.reduce(adj, context);
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
        const inner = pushName(
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
          (current, bound) => adj(current, getFresh(bound.name, bound.level)),
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
    expr: (scope: Scope | undefined, expression: Expr) => expr({ warnings: [], scope }, expression),
    defn: (scope: Scope | undefined, definition: Defn) => defn({ warnings: [], scope }, definition),
    sequent: (scope: Scope | undefined, item: Sequent) => sequent({ warnings: [], scope }, item)[1],
    usable: (scope: Scope | undefined, item: Usable) => usable({ warnings: [], scope }, item),
    proof: (scope: Scope | undefined, item: Proof) => proof({ warnings: [], scope }, item),
  };
};

// Util.set_locus: the node keeps its properties and takes the location of from.
const withLocus = (expression: Expr, from: Expr) =>
  from.location ? { ...expression, location: from.location } : expression;

export type Anonymizer = ReturnType<typeof createAnonymizer>;

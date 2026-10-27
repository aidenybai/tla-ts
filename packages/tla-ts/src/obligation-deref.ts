// A port of tlapm's Expr.Deref: a subexpression reference such as Op!2!<< resolves to the
// subexpression it names, abstracted over the bound names it uses.

import { TlaProofError, TlapmBugError } from "./errors";
import {
  at,
  consAll,
  consSubstitution,
  getAtPrefix,
  getChildren,
  getFresh,
  mapChildren,
  mapSelectorArgs,
  shift,
  substituteExpr,
  type Bound,
  type Defn,
  type Expr,
  type Hyp,
  type ObligationWarning,
  type Param,
  type Selector,
} from "./obligation-expression";

interface Deref {
  params: Param[];
  definitions: Defn[];
  expression: Expr;
}

interface Label {
  context: Hyp[];
  expression: Expr;
  indices: { name: string; index: number }[];
}

const BAD = { kind: "Opaque", name: "$Bad" } satisfies Expr;

const isBad = (expression: Expr) => expression.kind === "Opaque" && expression.name === BAD.name;

const clean = (expression: Expr): Expr => {
  const mapped =
    expression.kind === "Parens" ? clean(expression.expression) : mapChildren(expression, clean);
  if (!mapped.isAtomic) return mapped;
  const { isAtomic: _isAtomic, ...rest } = mapped;
  return rest;
};

// Parentheses go everywhere but in the definitions of a LET.
const cleanParens = (expression: Expr): Expr => {
  if (expression.kind === "Let") {
    return at(
      { kind: "Let", definitions: expression.definitions, body: cleanParens(expression.body) },
      expression.body,
    );
  }
  if (expression.kind === "Parens") return cleanParens(expression.expression);
  return mapChildren(expression, cleanParens);
};

const hasNegativeIndex = (expression: Expr): boolean =>
  expression.kind === "Ix" ? expression.index <= 0 : getChildren(expression).some(hasNegativeIndex);

// Visit.iter's context for each binder, stopping at labels with other names and at declarations
// in an ASSUME.
const findLabel = (expression: Expr, label: string, context: Hyp[]): Label | undefined => {
  const search = (inner: Expr, innerContext = context) => findLabel(inner, label, innerContext);
  const searchBounds = (bounds: Bound[], body: Expr) =>
    bounds.reduce<Label | undefined>(
      (found, bound) =>
        found ?? (bound.domain.kind === "Domain" ? search(bound.domain.expression) : undefined),
      undefined,
    ) ?? search(body, [...context, ...bounds.map((bound) => getFresh(bound.name, bound.level))]);
  switch (expression.kind) {
    case "Parens":
      if (expression.form.kind !== "Xlabel") return search(expression.expression);
      return expression.form.label === label
        ? { context, expression: expression.expression, indices: expression.form.indices }
        : undefined;
    case "Lambda":
      return search(expression.body, [
        ...context,
        ...expression.params.map((param) => getFresh(param.name, "Unknown", param.shape)),
      ]);
    case "Let": {
      const inner = [...context];
      for (const definition of expression.definitions) {
        const found =
          definition.kind === "Operator" || definition.kind === "Bpragma"
            ? search(definition.body, [...inner])
            : undefined;
        if (found) return found;
        inner.push({
          kind: "Defn",
          definition,
          whereDefined: "Builtin",
          visibility: "Visible",
          isLocal: true,
        });
      }
      return search(expression.body, inner);
    }
    case "Quant":
    case "Fcn":
      return searchBounds(expression.bounds, expression.body);
    case "SetOf":
      return searchBounds(expression.bounds, expression.element);
    case "Tquant":
      return search(expression.body, [
        ...context,
        ...expression.names.map((name): Hyp => ({ kind: "Flex", name })),
      ]);
    case "Choose":
    case "SetSt": {
      const found = expression.domain && search(expression.domain);
      return found ?? search(expression.body, [...context, getFresh(expression.name, "Constant")]);
    }
    case "Sequent": {
      const inner = [...context];
      for (const hyp of expression.sequent.context) {
        if (hyp.kind !== "Fact") return undefined;
        const found = search(hyp.expression, [...inner]);
        if (found) return found;
        inner.push(hyp);
      }
      return search(expression.sequent.active, inner);
    }
    default:
      for (const child of getChildren(expression)) {
        const found = search(child);
        if (found) return found;
      }
      return undefined;
  }
};

// The first count indices in reverse, and the rest past the parameters.
const getReversal = (count: number, paramCount: number) =>
  consAll(
    Array.from({ length: count }, (_item, index): Expr => ({ kind: "Ix", index: index + 1 })),
    shift(count + paramCount),
  );

const getIndices = (count: number) =>
  Array.from({ length: count }, (_item, index): Expr => ({ kind: "Ix", index: count - index }));

const instantiate = (
  onWarning: (warning: ObligationWarning) => void,
  expression: Expr,
  args: Expr[],
): Expr => {
  switch (expression.kind) {
    case "Quant":
    case "Fcn":
    case "SetOf": {
      if (expression.bounds.length !== args.length) {
        const expected = expression.bounds.length;
        const message = `Arity mismatch in subexpression instance.\nExpected ${expected} argument${expected === 1 ? "" : "s"}, but found${args.length < expected ? " only" : ""} ${args.length}.`;
        onWarning({
          text: `${getAtPrefix(expression.location)}Error: ${message}`,
          channel: "stderr",
        });
        throw new TlaProofError(message, { failure: "Expr.Deref.deref_inst" });
      }
      const body = expression.kind === "SetOf" ? expression.element : expression.body;
      return substituteExpr(consAll(args, shift(0)), body);
    }
    case "Tquant":
      return instantiate(
        onWarning,
        at(
          {
            kind: "Quant",
            quantifier: expression.quantifier,
            bounds: expression.names.map((name) => ({
              name,
              level: "State",
              domain: { kind: "NoDomain" },
            })),
            body: expression.body,
          },
          expression,
        ),
        args,
      );
    case "Lambda":
      return instantiate(
        onWarning,
        at(
          {
            kind: "Quant",
            quantifier: "Forall",
            bounds: expression.params.map((param) => ({
              name: param.name,
              level: "Unknown",
              domain: { kind: "NoDomain" },
            })),
            body: expression.body,
          },
          expression,
        ),
        args,
      );
    case "SetSt":
    case "Choose":
      if (args.length !== 1) {
        const message = `Arity mismatch in subexpression instance.\nExpected 1 argument, but found ${args.length}.`;
        onWarning({
          text: `${getAtPrefix(expression.location)}Error: ${message}`,
          channel: "stderr",
        });
        throw new TlaProofError(message, { failure: "Expr.Deref.deref_inst" });
      }
      return substituteExpr(consAll(args, shift(0)), expression.body);
    default: {
      const message = "Cannot instantiate non-binding expression";
      onWarning({
        text: `${getAtPrefix(expression.location)}Error: ${message}`,
        channel: "stderr",
      });
      throw new TlaProofError(message, { failure: "Expr.Deref.deref_inst" });
    }
  }
};

const abstract = (
  onWarning: (warning: ObligationWarning) => void,
  definitionCount: number,
  expression: Expr,
): [Param[], Expr] => {
  const params = ((): Param[] => {
    switch (expression.kind) {
      case "Quant":
      case "Fcn":
      case "SetOf":
        return expression.bounds.map((bound) => ({ name: bound.name, shape: 0 }));
      case "Tquant":
        return expression.names.map((name) => ({ name, shape: 0 }));
      case "Lambda":
        return expression.params;
      case "SetSt":
      case "Choose":
        return [{ name: expression.name, shape: 0 }];
      default: {
        const message = "Cannot abstract over bound variables in a non-binding expression";
        onWarning({
          text: `${getAtPrefix(expression.location)}Error: ${message}`,
          channel: "stderr",
        });
        throw new TlaProofError(message, { failure: "Expr.Deref.deref_at" });
      }
    }
  })();
  const shifted = substituteExpr(getReversal(definitionCount, params.length), expression);
  return [params, instantiate(onWarning, shifted, getIndices(params.length))];
};

// Expr.Deref.deref_num. A position past the subexpressions raises Bad_index, which deref reports
// at the expression it started from.
const getNumbered = (
  onWarning: (warning: ObligationWarning) => void,
  definitions: Defn[],
  expression: Expr,
  position: number,
  origin: Expr,
  message: string,
): [Defn[], Expr] => {
  const checkAtMost = (count: number) => {
    if (position <= count) return;
    onWarning({ text: `${getAtPrefix(origin.location)}Error: ${message}`, channel: "stderr" });
    throw new TlaProofError(message, { failure: "Expr.Deref.deref_num" });
  };
  const pick = (items: Expr[]) => {
    checkAtMost(items.length);
    return items[position - 1];
  };
  const result = ((): [Defn[], Expr] => {
    switch (expression.kind) {
      case "Sequent": {
        const sequent = expression.sequent;
        checkAtMost(sequent.context.length + 1);
        const hyp = sequent.context[position - 1];
        if (hyp && hyp.kind !== "Fact") {
          const hypMessage = "subexpression reference does not resolve to an expression";
          onWarning({
            text: `${getAtPrefix(expression.location)}Error: ${hypMessage}`,
            channel: "stderr",
          });
          throw new TlaProofError(hypMessage, { failure: "Expr.Deref.deref_num" });
        }
        const shifted = substituteExpr(
          shift(-(position - 1)),
          hyp ? hyp.expression : sequent.active,
        );
        if (hasNegativeIndex(shifted)) {
          onWarning({
            text: `${getAtPrefix(expression.location)}Error: subexpression of ASSUME/PROVE uses identifiers declared therein\nTlapm does not handle yet such subexpression namings.`,
            channel: "stderr",
          });
          throw new TlaProofError(
            "Subexpression of ASSUME/PROVE uses identifiers declared therein\n\nTlapm does not handle yet such subexpression namings.",
            { failure: "Expr.Deref.deref_num" },
          );
        }
        return [definitions, shifted];
      }
      case "Apply":
        return [definitions, pick(expression.args)];
      case "With":
        return getNumbered(
          onWarning,
          definitions,
          expression.expression,
          position,
          origin,
          message,
        );
      case "If":
        return [
          definitions,
          pick([expression.condition, expression.consequent, expression.alternative]),
        ];
      case "List":
        return [definitions, pick(expression.items)];
      case "SetEnum":
      case "Tuple":
        return [definitions, pick(expression.elements)];
      case "Product":
        return [definitions, pick(expression.factors)];
      case "Let":
        checkAtMost(1);
        return [[...definitions, ...expression.definitions], expression.body];
      case "Quant":
      case "SetOf":
      case "Fcn":
        return [
          definitions,
          pick(
            expression.bounds.flatMap((bound) =>
              bound.domain.kind === "Domain" ? [bound.domain.expression] : [],
            ),
          ),
        ];
      case "Choose":
      case "SetSt":
        if (!expression.domain) break;
        return [definitions, pick([expression.domain])];
      case "Arrow":
        return [definitions, pick([expression.domain, expression.range])];
      case "FcnApp": {
        const argument =
          expression.args.length === 1
            ? expression.args[0]
            : at({ kind: "Tuple", elements: expression.args }, expression);
        return [definitions, pick([expression.function, argument])];
      }
      case "Rect":
      case "Record":
        return [definitions, pick(expression.fields.map((field) => field.value))];
      case "Dot":
        return [
          definitions,
          pick([
            expression.expression,
            at({ kind: "String", value: expression.field }, expression),
          ]),
        ];
      case "Except":
        return [
          definitions,
          pick([expression.function, ...expression.specs.map((spec) => spec.value)]),
        ];
      case "Sub":
      case "Tsub":
        return [definitions, pick([expression.action, expression.subscript])];
      case "Fair":
        return [definitions, pick([expression.subscript, expression.action])];
      case "Case":
        return [
          definitions,
          pick([
            ...expression.arms.map((arm) =>
              at({ kind: "Tuple", elements: [arm.condition, arm.body] }, arm.body),
            ),
            ...(expression.other
              ? [at({ kind: "Tuple", elements: [BAD, expression.other] }, expression.other)]
              : []),
          ]),
        ];
    }
    const emptyMessage = "Expression has no subexpressions";
    onWarning({
      text: `${getAtPrefix(expression.location)}Error: ${emptyMessage}`,
      channel: "stderr",
    });
    throw new TlaProofError(emptyMessage, { failure: "Expr.Deref.deref_num" });
  })();
  if (isBad(result[1])) {
    const badMessage = `Cannot resolve subexpression reference !${position}`;
    onWarning({
      text: `${getAtPrefix(expression.location)}Error: ${badMessage}`,
      channel: "stderr",
    });
    throw new TlaProofError(badMessage, { failure: "Expr.Deref.deref_num" });
  }
  return result;
};

// Reorders label arguments given in source order to the order of the label's de Bruijn indices.
const permute = (indices: number[], args: Expr[]) => {
  const count = indices.length;
  let current = indices;
  for (let offset = count - 1; offset >= 0; offset--) {
    if (current.includes(count - offset)) continue;
    current = current.map((index) => (index + offset < count ? index : index - 1));
  }
  return current.map((index) => args[count - index]);
};

const resolveLabel = (
  onWarning: (warning: ObligationWarning) => void,
  definitionCount: number,
  expression: Expr,
  label: string,
  labelArgs: Expr[],
): Deref => {
  const found = findLabel(expression, label, []);
  if (!found) {
    onWarning({
      text: `${getAtPrefix(expression.location)}Error: Could not find label ${label}`,
      channel: "stderr",
    });
    return { params: [], definitions: [], expression: BAD };
  }
  const indices = found.indices;
  if (indices.length !== labelArgs.length && labelArgs.length > 0) {
    const plural = indices.length === 1 ? "" : "s";
    const message = `Expected ${indices.length} argument${plural} for labelled reference !${label}, but found ${labelArgs.length}`;
    onWarning({
      text: `${getAtPrefix(found.expression.location)}Error: ${message}`,
      channel: "stderr",
    });
    throw new TlaProofError(message, { failure: "Expr.Deref.deref_lsub" });
  }
  const params =
    labelArgs.length === 0 ? indices.map((index) => ({ name: index.name, shape: 0 })) : [];
  const args = labelArgs.length === 0 ? getIndices(indices.length) : labelArgs;
  const reified = found.context.reduceRight((inner: Expr, hyp): Expr => {
    if (hyp.kind === "Defn")
      return at({ kind: "Let", definitions: [hyp.definition], body: inner }, inner);
    if (hyp.kind === "Fresh") {
      return at(
        {
          kind: "Quant",
          quantifier: "Forall",
          bounds: [{ name: hyp.name, level: "Constant", domain: { kind: "NoDomain" } }],
          body: inner,
        },
        inner,
      );
    }
    return substituteExpr(shift(-1), inner);
  }, found.expression);
  const shifted = substituteExpr(getReversal(definitionCount, params.length), reified);
  const definitions: Defn[] = [];
  let body = shifted;
  let remaining = permute(
    indices.map((index) => index.index),
    args,
  );
  while (remaining.length > 0) {
    if (body.kind === "Let" && body.definitions.length === 1) {
      definitions.push(body.definitions[0]);
      body = body.body;
      remaining = remaining.map((arg) => substituteExpr(shift(1), arg));
      continue;
    }
    if (body.kind !== "Quant" || body.bounds.length !== 1) {
      throw new TlapmBugError(
        'File "src/expr/e_deref.ml", line 477, characters 21-33: Assertion failed',
      );
    }
    body = substituteExpr(consSubstitution(remaining[0], shift(0)), body.body);
    remaining = remaining.slice(1);
  }
  return { params, definitions, expression: body };
};

const resolveLetOperator = (
  onWarning: (warning: ObligationWarning) => void,
  definitionCount: number,
  expression: Expr,
  label: string,
  args: Expr[],
): Deref => {
  if (expression.kind !== "Let") {
    onWarning({
      text: `${getAtPrefix(expression.location)}Error: not a LET expression`,
      channel: "stderr",
    });
    throw new TlaProofError("not a LET expression", { failure: "Expr.Deref.deref_letop" });
  }
  const index = expression.definitions.findIndex(
    (definition) => definition.kind === "Operator" && definition.name === label,
  );
  const definition = expression.definitions[index];
  if (!definition || definition.kind !== "Operator") {
    const message = `no definition of operator ${label}`;
    onWarning({ text: `${getAtPrefix(expression.location)}Error: ${message}`, channel: "stderr" });
    throw new TlaProofError(message, { failure: "Expr.Deref.deref_letop" });
  }
  const body = definition.body;
  const labelled =
    body.kind === "Lambda"
      ? at(
          {
            ...body,
            body: at(
              {
                kind: "Parens",
                expression: body.body,
                form: {
                  kind: "Xlabel",
                  label,
                  indices: body.params.map((param, position) => ({
                    name: param.name,
                    index: body.params.length - position,
                  })),
                },
              },
              body.body,
            ),
          },
          body,
        )
      : at(
          { kind: "Parens", expression: body, form: { kind: "Xlabel", label, indices: [] } },
          body,
        );
  return resolveLabel(
    onWarning,
    definitionCount,
    at({ kind: "Let", definitions: expression.definitions.slice(0, index), body: labelled }, body),
    label,
    args,
  );
};

const deref = (
  onWarning: (warning: ObligationWarning) => void,
  isLabel: boolean,
  state: Deref,
  selectors: Selector[],
): Expr => {
  const [selector, ...rest] = selectors;
  if (!selector) {
    const withDefinitions =
      state.definitions.length === 0
        ? state.expression
        : at(
            { kind: "Let", definitions: state.definitions, body: state.expression },
            state.expression,
          );
    const abstracted =
      state.params.length === 0
        ? withDefinitions
        : at({ kind: "Lambda", params: state.params, body: withDefinitions }, withDefinitions);
    return { ...clean(abstracted), isAtomic: true };
  }
  if (state.expression.isAtomic) {
    onWarning({
      text: `${getAtPrefix(state.expression.location)}Error: Expression has no subexpressions`,
      channel: "stderr",
    });
    return BAD;
  }
  const expression = isLabel ? state.expression : cleanParens(state.expression);
  const count = state.definitions.length;
  const next = ((): Deref & { rest: Selector[]; isLabel: boolean } => {
    const numbered = (position: number, message: string) => {
      const [definitions, inner] = getNumbered(
        onWarning,
        [],
        expression,
        position,
        state.expression,
        message,
      );
      return { params: [], definitions, expression: inner, rest, isLabel: false };
    };
    switch (selector.kind) {
      case "Down": {
        const [label, ...after] = rest;
        if (expression.kind === "Let" && label?.kind === "Label" && isLabel) {
          const result = resolveLetOperator(onWarning, count, expression, label.label, label.args);
          return { ...result, rest: after, isLabel: true };
        }
        if (isLabel) return { params: [], definitions: [], expression, rest, isLabel: false };
        throw new TlaProofError("!: is forbidden for this expression.\n", {
          failure: "Expr.Deref.deref: !:",
        });
      }
      case "Number":
        return numbered(selector.value, `Cannot resolve !${selector.value}`);
      case "Left":
        return numbered(1, "Cannot resolve !<<");
      case "Right":
        return numbered(2, "Cannot resolve !>>");
      case "Instance":
        return {
          params: [],
          definitions: [],
          expression: instantiate(onWarning, expression, selector.args),
          rest,
          isLabel: false,
        };
      case "Label": {
        const result =
          expression.kind === "Let" && !isLabel
            ? resolveLetOperator(onWarning, count, expression, selector.label, selector.args)
            : resolveLabel(onWarning, count, expression, selector.label, selector.args);
        return { ...result, rest, isLabel: true };
      }
      case "At": {
        const [params, inner] = abstract(onWarning, count, expression);
        return { params, definitions: [], expression: inner, rest, isLabel: false };
      }
    }
  })();
  return deref(
    onWarning,
    next.isLabel,
    {
      params: [...state.params, ...next.params],
      definitions: [...state.definitions, ...next.definitions],
      expression: next.expression,
    },
    next.rest.map((item) =>
      mapSelectorArgs(item, (arg) => substituteExpr(shift(next.definitions.length), arg)),
    ),
  );
};

const getInitialDeref = (
  onWarning: (warning: ObligationWarning) => void,
  operator: Expr,
  args: Expr[],
): Deref => {
  if (args.length > 0) {
    return { params: [], definitions: [], expression: instantiate(onWarning, operator, args) };
  }
  if (operator.kind !== "Lambda") return { params: [], definitions: [], expression: operator };
  const [params, expression] = abstract(onWarning, 0, operator);
  return { params, definitions: [], expression };
};

// Expr.Anon reports a reference that resolves to nothing at the reference, which the operator
// carries the locus of.
export const resolveSubexpression = (
  onWarning: (warning: ObligationWarning) => void,
  operator: Expr,
  args: Expr[],
  selectors: Selector[],
) => {
  const result = deref(onWarning, true, getInitialDeref(onWarning, operator, args), selectors);
  if (isBad(result)) {
    const message = "Could not resolve subexpression reference";
    onWarning({ text: `${getAtPrefix(operator.location)}Error: ${message}`, channel: "stderr" });
    throw new TlaProofError(message, { failure: "Expr.Anon: 2" });
  }
  return result;
};

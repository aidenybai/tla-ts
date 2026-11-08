// A port of tlapm's Expr.Deref, which resolves subexpression references such as Op!2!<<.

import { TlaProofError, TlapmBugError } from "../errors";
import { consAll, consSubstitution, shift, substituteExpr } from "./substitution";
import {
  at,
  getErrorNote,
  getErrorSetting,
  getBoundFresh,
  getChildren,
  getFresh,
  getParamFresh,
  mapChildren,
  mapSelectorArgs,
  warnError,
  type Bound,
  type Defn,
  type Expr,
  type Hyp,
  type Warn,
  type Param,
  type Selector,
} from "./expression";

interface Resolution {
  params: Param[];
  definitions: Defn[];
  expression: Expr;
}

interface LabelMatch {
  context: Hyp[];
  expression: Expr;
  indices: { name: string; index: number }[];
}

const UNRESOLVED = { kind: "Opaque", name: "$Bad" } satisfies Expr;

const isUnresolved = (expression: Expr) =>
  expression.kind === "Opaque" && expression.name === UNRESOLVED.name;

const stripParensAndAtomic = (expression: Expr): Expr => {
  const mapped =
    expression.kind === "Parens"
      ? stripParensAndAtomic(expression.expression)
      : mapChildren(expression, stripParensAndAtomic);
  if (!mapped.isAtomic) return mapped;
  const { isAtomic: _isAtomic, ...rest } = mapped;
  return rest;
};

// Parentheses go everywhere but in the definitions of a LET.
const stripParens = (expression: Expr): Expr => {
  if (expression.kind === "Let") {
    return at(
      { kind: "Let", definitions: expression.definitions, body: stripParens(expression.body) },
      expression.body,
    );
  }
  if (expression.kind === "Parens") return stripParens(expression.expression);
  return mapChildren(expression, stripParens);
};

const hasNegativeIndex = (expression: Expr): boolean =>
  expression.kind === "Ix" ? expression.index <= 0 : getChildren(expression).some(hasNegativeIndex);

// Stops at labels with other names and at declarations in an ASSUME.
const findLabel = (expression: Expr, label: string, context: Hyp[]): LabelMatch | undefined => {
  const search = (inner: Expr, innerContext = context) => findLabel(inner, label, innerContext);
  const searchBounds = (bounds: Bound[], body: Expr) =>
    bounds.reduce<LabelMatch | undefined>(
      (found, bound) =>
        found ?? (bound.domain.kind === "Domain" ? search(bound.domain.expression) : undefined),
      undefined,
    ) ?? search(body, [...context, ...bounds.map(getBoundFresh)]);
  switch (expression.kind) {
    case "Parens":
      if (expression.form.kind !== "Xlabel") return search(expression.expression);
      return expression.form.label === label
        ? { context, expression: expression.expression, indices: expression.form.indices }
        : undefined;
    case "Lambda":
      return search(expression.body, [...context, ...expression.params.map(getParamFresh)]);
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

const instantiate = (onWarning: Warn, expression: Expr, args: Expr[]): Expr => {
  switch (expression.kind) {
    case "Quant":
    case "Fcn":
    case "SetOf": {
      if (expression.bounds.length !== args.length) {
        const expected = expression.bounds.length;
        const message = `Arity mismatch in subexpression instance.\nExpected ${expected} argument${expected === 1 ? "" : "s"}, but found${args.length < expected ? " only" : ""} ${args.length}.`;
        onWarning(getErrorNote(expression.location, message));
        // Errors.set takes the message from Printf, which keeps the @ of Format's @\n.
        onWarning(getErrorSetting(expression.location, message.replace("\n", "@\n")));
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
        onWarning(getErrorNote(expression.location, message));
        onWarning(getErrorSetting(expression.location, message.replace("\n", "@\n")));
        throw new TlaProofError(message, { failure: "Expr.Deref.deref_inst" });
      }
      return substituteExpr(consAll(args, shift(0)), expression.body);
    default: {
      const message = "Cannot instantiate non-binding expression";
      warnError(onWarning, expression.location, message);
      throw new TlaProofError(message, { failure: "Expr.Deref.deref_inst" });
    }
  }
};

const abstract = (onWarning: Warn, definitionCount: number, expression: Expr): [Param[], Expr] => {
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
        warnError(onWarning, expression.location, message);
        throw new TlaProofError(message, { failure: "Expr.Deref.deref_at" });
      }
    }
  })();
  const shifted = substituteExpr(getReversal(definitionCount, params.length), expression);
  return [params, instantiate(onWarning, shifted, getIndices(params.length))];
};

const getNumbered = (
  onWarning: Warn,
  expression: Expr,
  position: number,
  origin: Expr,
  message: string,
): [Defn[], Expr] => {
  const checkAtMost = (count: number) => {
    if (position <= count) return;
    warnError(onWarning, origin.location, message);
    throw new TlaProofError(message, { failure: "Expr.Deref.deref_num" });
  };
  const pick = (items: Expr[]) => {
    checkAtMost(items.length);
    return items[position - 1];
  };
  if (expression.kind === "With") {
    return getNumbered(onWarning, expression.expression, position, origin, message);
  }
  const result = ((): Expr => {
    switch (expression.kind) {
      case "Sequent": {
        const sequent = expression.sequent;
        checkAtMost(sequent.context.length + 1);
        const hyp = sequent.context[position - 1];
        if (hyp && hyp.kind !== "Fact") {
          const hypMessage = "subexpression reference does not resolve to an expression";
          warnError(onWarning, expression.location, hypMessage);
          throw new TlaProofError(hypMessage, { failure: "Expr.Deref.deref_num" });
        }
        const shifted = substituteExpr(
          shift(-(position - 1)),
          hyp ? hyp.expression : sequent.active,
        );
        if (hasNegativeIndex(shifted)) {
          onWarning(
            getErrorNote(
              expression.location,
              `subexpression of ASSUME/PROVE uses identifiers declared therein\nTlapm does not handle yet such subexpression namings.`,
            ),
          );
          const message =
            "Subexpression of ASSUME/PROVE uses identifiers declared therein\n\nTlapm does not handle yet such subexpression namings.";
          onWarning(getErrorSetting(expression.location, message));
          throw new TlaProofError(message, { failure: "Expr.Deref.deref_num" });
        }
        return shifted;
      }
      case "Apply":
        return pick(expression.args);
      case "If":
        return pick([expression.condition, expression.consequent, expression.alternative]);
      case "List":
        return pick(expression.items);
      case "SetEnum":
      case "Tuple":
        return pick(expression.elements);
      case "Product":
        return pick(expression.factors);
      case "Let":
        checkAtMost(1);
        return expression.body;
      case "Quant":
      case "SetOf":
      case "Fcn":
        return pick(
          expression.bounds.flatMap((bound) =>
            bound.domain.kind === "Domain" ? [bound.domain.expression] : [],
          ),
        );
      case "Choose":
      case "SetSt":
        if (!expression.domain) break;
        return pick([expression.domain]);
      case "Arrow":
        return pick([expression.domain, expression.range]);
      case "FcnApp": {
        const argument =
          expression.args.length === 1
            ? expression.args[0]
            : at({ kind: "Tuple", elements: expression.args }, expression);
        return pick([expression.function, argument]);
      }
      case "Rect":
      case "Record":
        return pick(expression.fields.map((field) => field.value));
      case "Dot":
        return pick([
          expression.expression,
          at({ kind: "String", value: expression.field }, expression),
        ]);
      case "Except":
        return pick([expression.function, ...expression.specs.map((spec) => spec.value)]);
      case "Sub":
      case "Tsub":
        return pick([expression.action, expression.subscript]);
      case "Fair":
        return pick([expression.subscript, expression.action]);
      case "Case":
        return pick([
          ...expression.arms.map((arm) =>
            at({ kind: "Tuple", elements: [arm.condition, arm.body] }, arm.body),
          ),
          ...(expression.other
            ? [at({ kind: "Tuple", elements: [UNRESOLVED, expression.other] }, expression.other)]
            : []),
        ]);
    }
    const emptyMessage = "Expression has no subexpressions";
    warnError(onWarning, expression.location, emptyMessage);
    throw new TlaProofError(emptyMessage, { failure: "Expr.Deref.deref_num" });
  })();
  if (isUnresolved(result)) {
    const badMessage = `Cannot resolve subexpression reference !${position}`;
    warnError(onWarning, expression.location, badMessage);
    throw new TlaProofError(badMessage, { failure: "Expr.Deref.deref_num" });
  }
  return [expression.kind === "Let" ? expression.definitions : [], result];
};

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
  onWarning: Warn,
  definitionCount: number,
  expression: Expr,
  label: string,
  labelArgs: Expr[],
): Resolution => {
  const found = findLabel(expression, label, []);
  if (!found) {
    onWarning(getErrorNote(expression.location, `Could not find label ${label}`));
    return { params: [], definitions: [], expression: UNRESOLVED };
  }
  const indices = found.indices;
  if (indices.length !== labelArgs.length && labelArgs.length > 0) {
    const plural = indices.length === 1 ? "" : "s";
    const message = `Expected ${indices.length} argument${plural} for labelled reference !${label}, but found ${labelArgs.length}`;
    warnError(onWarning, found.expression.location, message);
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
  onWarning: Warn,
  definitionCount: number,
  expression: Expr,
  label: string,
  args: Expr[],
): Resolution => {
  if (expression.kind !== "Let") {
    const message = "not a LET expression";
    warnError(onWarning, expression.location, message);
    throw new TlaProofError(message, { failure: "Expr.Deref.deref_letop" });
  }
  const index = expression.definitions.findIndex(
    (definition) => definition.kind === "Operator" && definition.name === label,
  );
  const definition = expression.definitions[index];
  if (!definition || definition.kind !== "Operator") {
    const message = `no definition of operator ${label}`;
    warnError(onWarning, expression.location, message);
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

const resolveSelectors = (
  onWarning: Warn,
  isLabel: boolean,
  state: Resolution,
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
    return { ...stripParensAndAtomic(abstracted), isAtomic: true };
  }
  if (state.expression.isAtomic) {
    const message = "Expression has no subexpressions";
    warnError(onWarning, state.expression.location, message);
    return UNRESOLVED;
  }
  const expression = isLabel ? state.expression : stripParens(state.expression);
  const count = state.definitions.length;
  const next = ((): Resolution & { rest: Selector[]; isLabel: boolean } => {
    const numbered = (position: number, message: string) => {
      const [definitions, inner] = getNumbered(
        onWarning,
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
        onWarning(getErrorSetting(expression.location, "!: is forbidden for this expression.\n"));
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
  return resolveSelectors(
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

const getInitialResolution = (onWarning: Warn, operator: Expr, args: Expr[]): Resolution => {
  if (args.length > 0) {
    return { params: [], definitions: [], expression: instantiate(onWarning, operator, args) };
  }
  if (operator.kind !== "Lambda") return { params: [], definitions: [], expression: operator };
  const [params, expression] = abstract(onWarning, 0, operator);
  return { params, definitions: [], expression };
};

export const resolveSubexpression = (
  onWarning: Warn,
  operator: Expr,
  args: Expr[],
  selectors: Selector[],
) => {
  const result = resolveSelectors(
    onWarning,
    true,
    getInitialResolution(onWarning, operator, args),
    selectors,
  );
  if (isUnresolved(result)) {
    const message = "Could not resolve subexpression reference";
    warnError(onWarning, operator.location, message);
    throw new TlaProofError(message, { failure: "Expr.Anon: 2" });
  }
  return result;
};

import {
  describeLocation,
  type Bound,
  type BoundPattern,
  type Definition,
  type Expression,
  type Instance,
  type Module,
  type OperatorParam,
  type SourceLocation,
} from "./ast";
import { TlaSyntaxError } from "./errors";
import { getChildren, isLocallyResolved } from "./evaluate";
import { isBefore } from "./resolve";

const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) => getPatternNames(bound.pattern));

export const substitutedExpressions = new WeakSet<Expression>();

export const renameLocals = (
  expression: Expression,
  names: Map<string, string>,
  bound = new Set<string>(),
): Expression => {
  const mapped = mapChildren(expression, (child, childBound) =>
    renameLocals(
      child,
      names,
      childBound.length === 0 ? bound : new Set([...bound, ...childBound]),
    ),
  );
  if (mapped.kind === "Identifier" && isLocallyResolved(mapped) && !bound.has(mapped.name)) {
    return { ...mapped, name: names.get(mapped.name) ?? mapped.name };
  }
  if (mapped.kind === "Apply" && isLocallyResolved(mapped) && !bound.has(mapped.operator)) {
    return { ...mapped, operator: names.get(mapped.operator) ?? mapped.operator };
  }
  return mapped;
};

const mapBounds = (bounds: Bound[], map: (child: Expression) => Expression): Bound[] =>
  bounds.map((bound) => ({ pattern: bound.pattern, set: map(bound.set) }));

export const mapDefinition = (
  definition: Definition,
  map: (child: Expression, bound: string[]) => Expression,
): Definition =>
  definition.kind === "Function"
    ? {
        ...definition,
        bounds: mapBounds(definition.bounds, (child) => map(child, [])),
        body: map(definition.body, getBoundNames(definition.bounds)),
      }
    : {
        ...definition,
        body: map(
          definition.body,
          definition.params.map((param) => param.name),
        ),
      };

export const mapChildren = (
  expression: Expression,
  map: (child: Expression, bound: string[]) => Expression,
): Expression => {
  const plain = (child: Expression) => map(child, []);
  switch (expression.kind) {
    case "Number":
    case "String":
    case "Identifier":
    case "OperatorReference":
    case "ExceptAt":
      return expression;
    case "Apply":
      return { ...expression, args: expression.args.map(plain) };
    case "Lambda":
      return { ...expression, body: map(expression.body, expression.params) };
    case "And":
    case "Or":
      return { ...expression, operands: expression.operands.map(plain) };
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      return { ...expression, expression: plain(expression.expression) };
    case "If":
      return {
        ...expression,
        condition: plain(expression.condition),
        consequent: plain(expression.consequent),
        alternative: plain(expression.alternative),
      };
    case "Case":
      return {
        ...expression,
        arms: expression.arms.map((arm) => ({
          condition: plain(arm.condition),
          body: plain(arm.body),
        })),
        other: expression.other ? plain(expression.other) : undefined,
      };
    case "Let": {
      const names = expression.definitions.map((definition) => definition.name);
      return {
        ...expression,
        definitions: expression.definitions.map((definition) =>
          mapDefinition(definition, (child, bound) => map(child, [...names, ...bound])),
        ),
        body: map(expression.body, names),
      };
    }
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      return {
        ...expression,
        bounds: mapBounds(expression.bounds, plain),
        body: map(expression.body, getBoundNames(expression.bounds)),
      };
    case "UnboundedQuantifier":
      return { ...expression, body: map(expression.body, expression.names) };
    case "Choose":
      return {
        ...expression,
        set: expression.set ? plain(expression.set) : undefined,
        body: map(expression.body, getPatternNames(expression.pattern)),
      };
    case "SetEnumeration":
    case "Tuple":
      return { ...expression, elements: expression.elements.map(plain) };
    case "SetFilter":
      return {
        ...expression,
        bound: { pattern: expression.bound.pattern, set: plain(expression.bound.set) },
        predicate: map(expression.predicate, getPatternNames(expression.bound.pattern)),
      };
    case "SetMap":
      return {
        ...expression,
        bounds: mapBounds(expression.bounds, plain),
        expression: map(expression.expression, getBoundNames(expression.bounds)),
      };
    case "FunctionSet":
      return { ...expression, domain: plain(expression.domain), range: plain(expression.range) };
    case "Record":
    case "RecordSet":
      return {
        ...expression,
        fields: expression.fields.map((field) => ({ name: field.name, value: plain(field.value) })),
      };
    case "Except":
      return {
        ...expression,
        function: plain(expression.function),
        updates: expression.updates.map((update) => ({
          path: update.path.map((step) =>
            step.kind === "Index" ? { kind: "Index", args: step.args.map(plain) } : step,
          ),
          value: plain(update.value),
        })),
      };
    case "FunctionApplication":
      return {
        ...expression,
        function: plain(expression.function),
        args: expression.args.map(plain),
      };
    case "FieldAccess":
      return { ...expression, record: plain(expression.record) };
    case "Product":
      return { ...expression, factors: expression.factors.map(plain) };
    case "BoxAction":
    case "AngleAction":
      return {
        ...expression,
        action: plain(expression.action),
        subscript: plain(expression.subscript),
      };
    case "WeakFairness":
    case "StrongFairness":
      return {
        ...expression,
        subscript: plain(expression.subscript),
        action: plain(expression.action),
      };
    case "Label":
      return { ...expression, body: plain(expression.body) };
    case "Subexpression":
      return {
        ...expression,
        selectors: expression.selectors.map((selector) =>
          "args" in selector ? { ...selector, args: selector.args.map(plain) } : selector,
        ),
      };
  }
};

export interface Instantiation {
  params: OperatorParam[];
  substitutions: Map<string, Expression>;
  variables: Set<string>;
  getDefinition: (key: string) => Definition | undefined;
  isParameterized: (key: string) => boolean;
  addDefinition: (name: string, create: (key: string) => Definition) => string;
}

type RewriteMode = "Normal" | "Enabled" | "Primed";

interface Rewrite {
  instantiation: Instantiation;
  copies: Map<string, string>;
  mode: RewriteMode;
  modes: Map<RewriteMode, Rewrite>;
}

export const getEnabledVariableName = (name: string) => `${name}@ENABLED`;

const getMode = (rewrite: Rewrite, mode: RewriteMode) => rewrite.modes.get(mode) ?? rewrite;

const isVariable = (expression: Expression, rewrite: Rewrite, bound: Set<string>) =>
  expression.kind === "Identifier" &&
  !bound.has(expression.name) &&
  !isLocallyResolved(expression) &&
  rewrite.instantiation.variables.has(expression.name);

const getUnchangedVariables = (
  expression: Expression,
  rewrite: Rewrite,
  bound: Set<string>,
): string[] | undefined => {
  if (expression.kind === "Tuple") {
    const names = expression.elements.map((element) =>
      getUnchangedVariables(element, rewrite, bound),
    );
    return names.every((element) => element !== undefined) ? names.flat() : undefined;
  }
  if (expression.kind !== "Identifier") return undefined;
  if (isVariable(expression, rewrite, bound)) return [expression.name];
  const definition = isLocallyResolved(expression)
    ? undefined
    : rewrite.instantiation.getDefinition(expression.name);
  return definition?.kind === "Operator" && definition.params.length === 0
    ? getUnchangedVariables(definition.body, rewrite, new Set())
    : undefined;
};

const substituteInEnabled = (
  expression: Expression,
  rewrite: Rewrite,
  bound: Set<string>,
): Expression | undefined => {
  if (rewrite.mode === "Normal") return undefined;
  if (rewrite.mode === "Primed") {
    return isVariable(expression, rewrite, bound) && expression.kind === "Identifier"
      ? {
          kind: "Identifier",
          name: getEnabledVariableName(expression.name),
          location: expression.location,
        }
      : undefined;
  }
  if (expression.kind === "Prime") {
    return {
      ...expression,
      expression: substitute(expression.expression, getMode(rewrite, "Primed"), bound),
    };
  }
  if (expression.kind === "AngleAction") {
    const location = expression.location;
    return {
      kind: "And",
      operands: [
        substitute(expression.action, rewrite, bound),
        {
          kind: "Apply",
          operator: "#",
          args: [
            {
              kind: "Prime",
              expression: substitute(expression.subscript, getMode(rewrite, "Primed"), bound),
              location,
            },
            substitute(expression.subscript, rewrite, bound),
          ],
          location,
        },
      ],
      location,
    };
  }
  if (expression.kind !== "Unchanged") return undefined;
  const names = getUnchangedVariables(expression.expression, rewrite, bound);
  if (names === undefined) return undefined;
  return {
    kind: "And",
    operands: names.map((name) => ({
      kind: "Apply",
      operator: "=",
      args: [
        {
          kind: "Prime",
          expression: {
            kind: "Identifier",
            name: getEnabledVariableName(name),
            location: expression.location,
          },
          location: expression.location,
        },
        substitute({ kind: "Identifier", name, location: expression.location }, rewrite, bound),
      ],
      location: expression.location,
    })),
    location: expression.location,
  };
};

const getParamArguments = (params: OperatorParam[], location: SourceLocation): Expression[] =>
  params.map((param) => ({
    kind: "Identifier",
    name: param.name,
    location,
    resolution: { kind: "Local" },
  }));

const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

const getInstanceOperator = (
  key: string,
  params: OperatorParam[],
  arity: number,
  location: SourceLocation,
): Expression => {
  const names = Array.from({ length: arity }, (_, index) => `argument${index}`);
  return {
    kind: "Lambda",
    params: names,
    body: {
      kind: "Apply",
      operator: key,
      args: [
        ...getParamArguments(params, location),
        ...names.map((name): Expression => ({
          kind: "Identifier",
          name,
          location,
          resolution: { kind: "Local" },
        })),
      ],
      location,
    },
    location,
  };
};

const getCopy = (rewrite: Rewrite, key: string) =>
  rewrite.instantiation.isParameterized(key) ? copyDefinition(rewrite, key) : undefined;

const substitute = (expression: Expression, rewrite: Rewrite, bound: Set<string>): Expression => {
  const recurse = (node: Expression) => substitute(node, rewrite, bound);
  const instantiation = rewrite.instantiation;
  const params = instantiation.params;
  const isFree = (name: string) => !bound.has(name) && !isLocallyResolved(expression);
  if (expression.kind === "Enabled" && rewrite.mode === "Normal") {
    return {
      ...expression,
      expression: substitute(expression.expression, getMode(rewrite, "Enabled"), bound),
    };
  }
  if (
    (expression.kind === "WeakFairness" || expression.kind === "StrongFairness") &&
    rewrite.mode === "Normal"
  ) {
    const enabled = getMode(rewrite, "Enabled");
    return {
      ...expression,
      subscript: recurse(expression.subscript),
      action: recurse(expression.action),
      enabled: substitute(
        expression.enabled ?? {
          kind: "AngleAction",
          action: expression.action,
          subscript: expression.subscript,
          location: expression.location,
        },
        enabled,
        bound,
      ),
    };
  }
  const enabled = substituteInEnabled(expression, rewrite, bound);
  if (enabled) return enabled;
  if (expression.kind === "Identifier" && isFree(expression.name)) {
    const replacement = instantiation.substitutions.get(expression.name);
    if (replacement) {
      substitutedExpressions.add(replacement);
      return replacement;
    }
    const copy = getCopy(rewrite, expression.name);
    if (copy === undefined) return expression;
    if (params.length === 0) return { ...expression, name: copy };
    const definition = instantiation.getDefinition(expression.name);
    if (definition && getArity(definition) > 0) {
      return getInstanceOperator(copy, params, getArity(definition), expression.location);
    }
    return {
      kind: "Apply",
      operator: copy,
      args: getParamArguments(params, expression.location),
      location: expression.location,
    };
  }
  if (expression.kind === "Apply" && isFree(expression.operator)) {
    const args = expression.args.map(recurse);
    const replacement = instantiation.substitutions.get(expression.operator);
    if (replacement?.kind === "Identifier" || replacement?.kind === "OperatorReference") {
      const operator = replacement.kind === "Identifier" ? replacement.name : replacement.operator;
      return {
        ...expression,
        operator,
        args,
        resolution: replacement.kind === "Identifier" ? replacement.resolution : undefined,
      };
    }
    if (replacement?.kind === "Apply") {
      return {
        ...expression,
        operator: replacement.operator,
        args: [...replacement.args, ...args],
        resolution: replacement.resolution,
      };
    }
    if (replacement?.kind === "Lambda") {
      return {
        kind: "Let",
        definitions: [
          {
            kind: "Operator",
            name: replacement.kind,
            params: replacement.params.map((name) => ({ name, arity: 0 })),
            body: replacement.body,
            isLocal: true,
            isRecursive: false,
            location: replacement.location,
          },
        ],
        body: {
          ...expression,
          operator: replacement.kind,
          args,
          resolution: { kind: "Local" },
        },
        location: expression.location,
      };
    }
    if (replacement) {
      throw new TlaSyntaxError(
        `The operator ${expression.operator} can only be substituted by an operator at ${describeLocation(expression)}`,
      );
    }
    const copy = getCopy(rewrite, expression.operator);
    if (copy === undefined) return { ...expression, args };
    return {
      ...expression,
      operator: copy,
      args: [...getParamArguments(params, expression.location), ...args],
    };
  }
  if (expression.kind === "OperatorReference" && isFree(expression.operator)) {
    const copy = getCopy(rewrite, expression.operator);
    if (copy === undefined) return expression;
    const definition = instantiation.getDefinition(expression.operator);
    if (params.length > 0 && definition) {
      return getInstanceOperator(copy, params, getArity(definition), expression.location);
    }
    return { ...expression, operator: copy };
  }
  return mapChildren(expression, (child, names) =>
    names.length === 0 ? recurse(child) : substitute(child, rewrite, new Set([...bound, ...names])),
  );
};

const withInstanceParams = (
  definition: Definition,
  params: OperatorParam[],
  location: SourceLocation,
): Definition => {
  if (params.length === 0) return definition;
  if (definition.kind === "Operator") {
    return { ...definition, params: [...params, ...definition.params] };
  }
  return {
    kind: "Operator",
    name: definition.name,
    params,
    body: {
      kind: "Let",
      definitions: [definition],
      body: { kind: "Identifier", name: definition.name, location, resolution: { kind: "Local" } },
      location,
    },
    isLocal: definition.isLocal,
    isRecursive: false,
    location: definition.location,
  };
};

const copyDefinition = (rewrite: Rewrite, key: string): string => {
  const cached = rewrite.copies.get(key);
  if (cached !== undefined) return cached;
  const instantiation = rewrite.instantiation;
  const definition = instantiation.getDefinition(key);
  if (!definition) return key;
  return instantiation.addDefinition(definition.name, (copyKey) => {
    rewrite.copies.set(key, copyKey);
    const mapped = mapDefinition(definition, (child, bound) =>
      substitute(child, rewrite, new Set(bound)),
    );
    return withInstanceParams(mapped, instantiation.params, definition.location);
  });
};

export const createInstantiation = (instantiation: Instantiation) => {
  const modes = new Map<RewriteMode, Rewrite>();
  const createRewrite = (mode: RewriteMode): Rewrite => {
    const created = { instantiation, copies: new Map(), mode, modes };
    modes.set(mode, created);
    return created;
  };
  const rewrite = createRewrite("Normal");
  createRewrite("Enabled");
  createRewrite("Primed");
  return {
    getKey: (key: string) => getCopy(rewrite, key) ?? key,
    getQualifiedKey: (key: string) => {
      const copy = getCopy(rewrite, key);
      if (copy !== undefined) return copy;
      const definition = instantiation.getDefinition(key);
      if (!definition) return key;
      return instantiation.addDefinition(definition.name, () =>
        withInstanceParams(definition, instantiation.params, definition.location),
      );
    },
  };
};

const hasLetInstance = (expression: Expression): boolean =>
  (expression.kind === "Let" && expression.instances !== undefined) ||
  getChildren(expression).some(hasLetInstance);

const expandLetInstances = (
  expression: Expression,
  instantiate: (instance: Instance) => Definition[],
): Expression => {
  const mapped = mapChildren(expression, (child) => expandLetInstances(child, instantiate));
  if (mapped.kind !== "Let" || !mapped.instances) return mapped;
  const definitions = mapped.instances.reduce((current, instance) => {
    const position = current.findIndex((definition) =>
      isBefore(instance.location, definition.location),
    );
    const index = position === -1 ? current.length : position;
    return [...current.slice(0, index), ...instantiate(instance), ...current.slice(index)];
  }, mapped.definitions);
  return { kind: "Let", definitions, body: mapped.body, location: mapped.location };
};

export const withLetInstances = (
  module: Module,
  instantiate: (instance: Instance) => Definition[],
): Module => {
  const isExpanded =
    module.definitions.some((definition) => hasLetInstance(definition.body)) ||
    module.assumptions.some((assumption) => hasLetInstance(assumption.expression));
  if (!isExpanded) return module;
  return {
    ...module,
    definitions: module.definitions.map((definition) =>
      mapDefinition(definition, (child) => expandLetInstances(child, instantiate)),
    ),
    assumptions: module.assumptions.map((assumption) => ({
      ...assumption,
      expression: expandLetInstances(assumption.expression, instantiate),
    })),
  };
};

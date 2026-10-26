import type {
  Bound,
  BoundPattern,
  Definition,
  Expression,
  OperatorParam,
  SourceLocation,
} from "./ast";
import { TlaUnsupportedError } from "./errors";
import { isLocallyResolved } from "./evaluate";

const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) => getPatternNames(bound.pattern));

const getFreeNames = (expression: Expression, names = new Set<string>()): Set<string> => {
  if (expression.kind === "Identifier") names.add(expression.name);
  if (expression.kind === "Apply" || expression.kind === "OperatorReference") {
    names.add(expression.operator);
  }
  mapChildren(expression, (child) => {
    getFreeNames(child, names);
    return child;
  });
  return names;
};

const mapBounds = (bounds: Bound[], map: (child: Expression) => Expression): Bound[] =>
  bounds.map((bound) => ({ pattern: bound.pattern, set: map(bound.set) }));

const mapDefinition = (
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

interface Rewrite {
  instantiation: Instantiation;
  substitutedNames: Map<string, Set<string>>;
  copies: Map<string, string>;
  enabled: Rewrite | undefined;
}

export const getEnabledVariableName = (name: string) => `${name}@ENABLED`;

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
  return expression.kind === "Identifier" &&
    !bound.has(expression.name) &&
    rewrite.instantiation.variables.has(expression.name)
    ? [expression.name]
    : undefined;
};

const getEnabledVariable = (name: string, location: SourceLocation): Expression => ({
  kind: "Prime",
  expression: { kind: "Identifier", name: getEnabledVariableName(name), location },
  location,
});

const substituteInEnabled = (
  expression: Expression,
  rewrite: Rewrite,
  bound: Set<string>,
): Expression | undefined => {
  if (rewrite.enabled !== undefined) return undefined;
  if (
    expression.kind === "Prime" &&
    expression.expression.kind === "Identifier" &&
    !bound.has(expression.expression.name) &&
    rewrite.instantiation.variables.has(expression.expression.name)
  ) {
    return getEnabledVariable(expression.expression.name, expression.location);
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
        getEnabledVariable(name, expression.location),
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

const getCopy = (rewrite: Rewrite, key: string) =>
  rewrite.instantiation.isParameterized(key) ? copyDefinition(rewrite, key) : undefined;

const substitute = (expression: Expression, rewrite: Rewrite, bound: Set<string>): Expression => {
  const recurse = (node: Expression) => substitute(node, rewrite, bound);
  const instantiation = rewrite.instantiation;
  const params = instantiation.params;
  const isFree = (name: string) => !bound.has(name) && !isLocallyResolved(expression);
  if (expression.kind === "Enabled" && rewrite.enabled !== undefined) {
    return {
      ...expression,
      expression: substitute(expression.expression, rewrite.enabled, bound),
    };
  }
  const enabled = substituteInEnabled(expression, rewrite, bound);
  if (enabled) return enabled;
  if (expression.kind === "Identifier" && isFree(expression.name)) {
    const replacement = instantiation.substitutions.get(expression.name);
    if (replacement) {
      const captured = [...(rewrite.substitutedNames.get(expression.name) ?? [])].filter((name) =>
        bound.has(name),
      );
      if (captured.length > 0) {
        throw new TlaUnsupportedError(
          `Substituting ${expression.name} into an instance would capture the bound name ${captured[0]}`,
        );
      }
      return replacement;
    }
    const copy = getCopy(rewrite, expression.name);
    if (copy === undefined) return expression;
    if (params.length === 0) return { ...expression, name: copy };
    const definition = instantiation.getDefinition(expression.name);
    if (definition && getArity(definition) > 0) {
      throw new TlaUnsupportedError(
        `Passing ${definition.name} from a parameterized instance as an operator argument is not supported yet`,
      );
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
    if (replacement) {
      throw new TlaUnsupportedError(
        `Substituting the operator ${expression.operator} with an expression is not supported yet`,
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
    if (params.length > 0) {
      throw new TlaUnsupportedError(
        `Passing ${expression.operator} from a parameterized instance as an operator argument is not supported yet`,
      );
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
  const substitutedNames = new Map(
    [...instantiation.substitutions].map(([name, expression]) => [name, getFreeNames(expression)]),
  );
  const rewrite: Rewrite = {
    instantiation,
    substitutedNames,
    copies: new Map(),
    enabled: { instantiation, substitutedNames, copies: new Map(), enabled: undefined },
  };
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

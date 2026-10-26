import type {
  Bound,
  BoundPattern,
  Declaration,
  Definition,
  Expression,
  Instance,
  OperatorParam,
} from "./ast";
import { TlaUnsupportedError } from "./errors";

export interface FlatModule {
  name: string;
  constants: Declaration[];
  variables: string[];
  definitions: Definition[];
}

interface Rewrite {
  prefix: string;
  isLocal: boolean;
  params: OperatorParam[];
  definitionNames: Set<string>;
  substitutions: Map<string, Expression>;
  substitutedNames: Map<string, Set<string>>;
}

const LOCAL_RESOLUTION = { kind: "Local" } as const;

const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) => getPatternNames(bound.pattern));

const getLocalNames = (expression: Expression, names = new Set<string>()): Set<string> => {
  if (expression.kind === "Identifier" && expression.resolution?.kind === "Local") {
    names.add(expression.name);
  }
  if (expression.kind === "Apply" && expression.resolution?.kind === "Local") {
    names.add(expression.operator);
  }
  mapChildren(expression, (child) => {
    getLocalNames(child, names);
    return child;
  });
  return names;
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

const markParams = (expression: Expression, params: Set<string>): Expression => {
  const mapped = mapChildren(expression, (child) => markParams(child, params));
  if (mapped.kind === "Identifier" && params.has(mapped.name)) {
    return { ...mapped, resolution: { kind: "Local" } };
  }
  if (mapped.kind === "Apply" && params.has(mapped.operator)) {
    return { ...mapped, resolution: { kind: "Local" } };
  }
  return mapped;
};

const getParamArguments = (rewrite: Rewrite, location: Expression["location"]): Expression[] =>
  rewrite.params.map((param) => ({
    kind: "Identifier",
    name: param.name,
    location,
    resolution: { kind: "Local" },
  }));

const substitute = (expression: Expression, rewrite: Rewrite, bound: Set<string>): Expression => {
  const recurse = (node: Expression) => substitute(node, rewrite, bound);
  const isFree = (name: string) => !bound.has(name);
  if (expression.kind === "Identifier" && isFree(expression.name)) {
    const replacement = rewrite.substitutions.get(expression.name);
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
    if (rewrite.definitionNames.has(expression.name) && expression.resolution?.kind !== "Local") {
      const name = `${rewrite.prefix}${expression.name}`;
      const resolution = rewrite.isLocal ? LOCAL_RESOLUTION : undefined;
      return rewrite.params.length === 0
        ? { ...expression, name, resolution }
        : {
            kind: "Apply",
            operator: name,
            args: getParamArguments(rewrite, expression.location),
            location: expression.location,
            resolution,
          };
    }
    return expression;
  }
  if (expression.kind === "Apply" && isFree(expression.operator)) {
    const args = expression.args.map(recurse);
    const replacement = rewrite.substitutions.get(expression.operator);
    if (replacement?.kind === "Identifier" || replacement?.kind === "OperatorReference") {
      const operator = replacement.kind === "Identifier" ? replacement.name : replacement.operator;
      return {
        ...expression,
        operator,
        args,
        resolution: replacement.kind === "Identifier" ? replacement.resolution : undefined,
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
        body: { ...expression, operator: replacement.kind, args, resolution: LOCAL_RESOLUTION },
        location: expression.location,
      };
    }
    if (replacement) {
      throw new TlaUnsupportedError(
        `Substituting the operator ${expression.operator} with an expression is not supported yet`,
      );
    }
    if (
      rewrite.definitionNames.has(expression.operator) &&
      expression.resolution?.kind !== "Local"
    ) {
      return {
        ...expression,
        operator: `${rewrite.prefix}${expression.operator}`,
        args: [...getParamArguments(rewrite, expression.location), ...args],
        resolution: rewrite.isLocal ? LOCAL_RESOLUTION : undefined,
      };
    }
    return { ...expression, args };
  }
  if (expression.kind === "OperatorReference" && isFree(expression.operator)) {
    if (rewrite.definitionNames.has(expression.operator) && rewrite.params.length === 0) {
      return { ...expression, operator: `${rewrite.prefix}${expression.operator}` };
    }
    return expression;
  }
  return mapChildren(expression, (child, names) =>
    names.length === 0 ? recurse(child) : substitute(child, rewrite, new Set([...bound, ...names])),
  );
};

export const instantiateModule = (
  instance: Instance,
  flat: FlatModule,
  locals?: Set<string>,
): Definition[] => {
  const params = new Set([...(locals ?? []), ...instance.params.map((param) => param.name)]);
  const explicit = new Map(
    instance.substitutions.map((item) => [item.name, markParams(item.expression, params)]),
  );
  const declared = [...flat.constants.map((constant) => constant.name), ...flat.variables];
  const substitutions = new Map(
    declared.map((name): [string, Expression] => [
      name,
      explicit.get(name) ??
        markParams({ kind: "Identifier", name, location: instance.location }, params),
    ]),
  );
  const rewrite: Rewrite = {
    prefix: instance.name === undefined ? "" : `${instance.name}!`,
    isLocal: locals !== undefined,
    params: instance.params,
    definitionNames: new Set(flat.definitions.map((definition) => definition.name)),
    substitutions,
    substitutedNames: new Map(
      [...substitutions].map(([name, expression]) => [name, getLocalNames(expression)]),
    ),
  };
  return flat.definitions.map((definition): Definition => {
    const name = `${rewrite.prefix}${definition.name}`;
    const isLocal = instance.isLocal || definition.isLocal;
    if (definition.kind === "Function" && instance.params.length > 0) {
      return {
        kind: "Operator",
        name,
        params: instance.params,
        body: substitute(
          {
            kind: "FunctionConstruction",
            bounds: definition.bounds,
            body: definition.body,
            location: definition.location,
            isRecursive: true,
          },
          rewrite,
          new Set(),
        ),
        isLocal,
        isRecursive: definition.isRecursive,
        location: instance.location,
      };
    }
    const mapped = mapDefinition(definition, (child, bound) =>
      substitute(child, rewrite, new Set(bound)),
    );
    return definition.kind === "Function"
      ? { ...mapped, name, isLocal, location: instance.location }
      : {
          ...mapped,
          kind: "Operator",
          name,
          params: [...instance.params, ...definition.params],
          isLocal,
          location: instance.location,
        };
  });
};

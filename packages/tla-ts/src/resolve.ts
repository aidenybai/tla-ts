import type {
  Bound,
  BoundPattern,
  Definition,
  Expression,
  Instance,
  Module,
  OperatorParam,
  SourceLocation,
} from "./ast";
import { TlaSyntaxError } from "./errors";

export interface ModuleSymbol {
  key: string;
  arity: number;
}

export type Symbols = Map<string, ModuleSymbol>;

interface LocalName {
  name: string;
  arity: number;
  parent: LocalName | undefined;
}

interface Unit {
  imported: Symbols;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
  location: SourceLocation;
  self: Definition | undefined;
}

const LOCAL_RESOLUTION = { kind: "Local" } as const;

const renamedArities = new WeakMap<Expression, number>();

const CORE_SYMBOLS: Symbols = new Map(
  ["~>", "-+->", "\\cdot"].map((name) => [name, { key: name, arity: 2 }]),
);

const isBefore = (left: SourceLocation, right: SourceLocation) =>
  left.line < right.line || (left.line === right.line && left.column < right.column);

const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

const lookupLocal = (scope: LocalName | undefined, name: string) => {
  for (let current = scope; current; current = current.parent) {
    if (current.name === name) return current;
  }
  return undefined;
};

const bindNames = (scope: LocalName | undefined, names: string[], arity = 0) =>
  names.reduce<LocalName | undefined>((parent, name) => ({ name, arity, parent }), scope);

const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

const getSymbolArity = (
  expression: Expression & { kind: "Identifier" | "Apply" | "OperatorReference" },
  name: string,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const location = expression.location;
  const renamed = renamedArities.get(expression);
  if (renamed !== undefined) return renamed;
  const local = lookupLocal(scope, name);
  if (local && expression.kind !== "OperatorReference") expression.resolution = LOCAL_RESOLUTION;
  if (local) return local.arity;
  const definition = unit.definitions.get(name);
  const isVisible =
    definition !== undefined &&
    (definition === unit.self
      ? definition.kind === "Function" || definition.isRecursive
      : definition.isRecursive || isBefore(definition.location, unit.location));
  const symbol =
    definition && isVisible
      ? { key: unit.getKey(definition), arity: getArity(definition) }
      : unit.imported.get(name);
  if (symbol) {
    if (expression.kind === "Identifier") expression.name = symbol.key;
    else expression.operator = symbol.key;
    renamedArities.set(expression, symbol.arity);
    return symbol.arity;
  }
  throw new TlaSyntaxError(
    `Could not find declaration or definition of symbol ${name} at line ${location.line}, column ${location.column}`,
  );
};

const resolveBounds = (bounds: Bound[], scope: LocalName | undefined, unit: Unit) => {
  bounds.forEach((bound) => resolveExpression(bound.set, scope, unit));
  return bounds.reduce(
    (current, bound) => bindNames(current, getPatternNames(bound.pattern)),
    scope,
  );
};

const resolveDefinition = (definition: Definition, scope: LocalName | undefined, unit: Unit) => {
  const self = bindNames(scope, definition.kind === "Function" ? [definition.name] : []);
  if (definition.kind === "Function") {
    resolveExpression(definition.body, resolveBounds(definition.bounds, self, unit), unit);
    return;
  }
  const params = definition.params.reduce<LocalName | undefined>(
    (parent, param) => ({ name: param.name, arity: param.arity, parent }),
    self,
  );
  resolveExpression(definition.body, params, unit);
};

const resolveDefinitions = (
  definitions: Definition[],
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const recursiveScope = definitions
    .filter((definition) => definition.isRecursive)
    .reduce<LocalName | undefined>(
      (parent, definition) => ({ name: definition.name, arity: getArity(definition), parent }),
      scope,
    );
  return definitions.reduce((current, definition) => {
    resolveDefinition(definition, current, unit);
    return { name: definition.name, arity: getArity(definition), parent: current };
  }, recursiveScope);
};

const resolveApply = (
  expression: Expression & { kind: "Apply" },
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const arity = getSymbolArity(expression, expression.operator, scope, unit);
  if (arity !== expression.args.length) {
    throw new TlaSyntaxError(
      `The operator ${expression.operator} requires ${arity} arguments at line ${expression.location.line}, column ${expression.location.column}`,
    );
  }
  expression.args.forEach((arg) =>
    arg.kind === "Identifier"
      ? getSymbolArity(arg, arg.name, scope, unit)
      : resolveExpression(arg, scope, unit),
  );
};

const resolveExpression = (
  expression: Expression,
  scope: LocalName | undefined,
  unit: Unit,
): void => {
  const resolveAll = (expressions: Expression[]) =>
    expressions.forEach((child) => resolveExpression(child, scope, unit));
  switch (expression.kind) {
    case "Number":
    case "String":
    case "ExceptAt":
      return;
    case "Identifier": {
      const arity = getSymbolArity(expression, expression.name, scope, unit);
      if (arity > 0) {
        throw new TlaSyntaxError(
          `The operator ${expression.name} requires ${arity} arguments at line ${expression.location.line}, column ${expression.location.column}`,
        );
      }
      return;
    }
    case "OperatorReference":
      getSymbolArity(expression, expression.operator, scope, unit);
      return;
    case "Apply":
      resolveApply(expression, scope, unit);
      return;
    case "Lambda":
      resolveExpression(expression.body, bindNames(scope, expression.params), unit);
      return;
    case "And":
    case "Or":
      resolveAll(expression.operands);
      return;
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      resolveExpression(expression.expression, scope, unit);
      return;
    case "If":
      resolveAll([expression.condition, expression.consequent, expression.alternative]);
      return;
    case "Case":
      resolveAll(expression.arms.flatMap((arm) => [arm.condition, arm.body]));
      if (expression.other) resolveExpression(expression.other, scope, unit);
      return;
    case "Let":
      resolveExpression(
        expression.body,
        resolveDefinitions(expression.definitions, scope, unit),
        unit,
      );
      return;
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      resolveExpression(expression.body, resolveBounds(expression.bounds, scope, unit), unit);
      return;
    case "UnboundedQuantifier":
      resolveExpression(expression.body, bindNames(scope, expression.names), unit);
      return;
    case "Choose":
      if (expression.set) resolveExpression(expression.set, scope, unit);
      resolveExpression(
        expression.body,
        bindNames(scope, getPatternNames(expression.pattern)),
        unit,
      );
      return;
    case "SetEnumeration":
    case "Tuple":
      resolveAll(expression.elements);
      return;
    case "SetFilter":
      resolveExpression(expression.predicate, resolveBounds([expression.bound], scope, unit), unit);
      return;
    case "SetMap":
      resolveExpression(expression.expression, resolveBounds(expression.bounds, scope, unit), unit);
      return;
    case "FunctionSet":
      resolveAll([expression.domain, expression.range]);
      return;
    case "Record":
    case "RecordSet":
      if (new Set(expression.fields.map((field) => field.name)).size < expression.fields.length) {
        throw new TlaSyntaxError(
          `Non-unique fields in constructor at line ${expression.location.line}, column ${expression.location.column}`,
        );
      }
      resolveAll(expression.fields.map((field) => field.value));
      return;
    case "Except":
      resolveAll([
        expression.function,
        ...expression.updates.flatMap((update) => [
          ...update.path.flatMap((step) => (step.kind === "Index" ? step.args : [])),
          update.value,
        ]),
      ]);
      return;
    case "FunctionApplication":
      resolveAll([expression.function, ...expression.args]);
      return;
    case "FieldAccess":
      resolveExpression(expression.record, scope, unit);
      return;
    case "Product":
      resolveAll(expression.factors);
      return;
    case "BoxAction":
    case "AngleAction":
      resolveAll([expression.action, expression.subscript]);
      return;
    case "WeakFairness":
    case "StrongFairness":
      resolveAll([expression.subscript, expression.action]);
  }
};

interface ModuleUnit {
  imported: Symbols;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
}

const createSymbols = (module: Module, imported: Symbols) => {
  const symbols = new Map([...CORE_SYMBOLS, ...imported]);
  module.constants.forEach((constant) =>
    symbols.set(constant.name, { key: constant.name, arity: constant.arity }),
  );
  module.variables.forEach((variable) => symbols.set(variable, { key: variable, arity: 0 }));
  return symbols;
};

export const resolveSubstitutions = (
  instance: Instance,
  declarations: OperatorParam[],
  module: Module,
  unit: ModuleUnit,
) => {
  const scope = bindNames(
    undefined,
    instance.params.map((param) => param.name),
  );
  const context: Unit = {
    imported: createSymbols(module, unit.imported),
    definitions: unit.definitions,
    getKey: unit.getKey,
    location: instance.location,
    self: undefined,
  };
  const explicit = new Map(instance.substitutions.map((item) => [item.name, item.expression]));
  return new Map(
    declarations.map((declaration): [string, Expression] => {
      const expression: Expression = explicit.get(declaration.name) ?? {
        kind: "Identifier",
        name: declaration.name,
        location: instance.location,
      };
      if (declaration.arity > 0 && expression.kind === "Identifier") {
        getSymbolArity(expression, expression.name, scope, context);
      } else {
        resolveExpression(expression, scope, context);
      }
      return [declaration.name, expression];
    }),
  );
};

export const resolveModule = (module: Module, unit: ModuleUnit) => {
  const symbols = createSymbols(module, unit.imported);
  const resolveIn = (location: SourceLocation, self: Definition | undefined) => ({
    imported: symbols,
    definitions: unit.definitions,
    getKey: unit.getKey,
    location,
    self,
  });
  module.definitions.forEach((definition) =>
    resolveDefinition(definition, undefined, resolveIn(definition.location, definition)),
  );
  module.assumptions.forEach((assumption) =>
    resolveExpression(assumption.expression, undefined, resolveIn(assumption.location, undefined)),
  );
};

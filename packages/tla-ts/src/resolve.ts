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
import { getChildren, isLocallyResolved } from "./evaluate";

export interface ModuleSymbol {
  key: string;
  arity: number;
  declaration?: "Constant" | "Variable";
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

export const KEY_SEPARATOR = "@";

// A key is a name, the separator, and an id, so the operator @@ is not one.
const isKey = (name: string) => {
  const index = name.lastIndexOf(KEY_SEPARATOR);
  return index > 0 && index < name.length - 1;
};

const CORE_SYMBOLS: Symbols = new Map(
  ["~>", "-+->", "\\cdot"].map((name) => [name, { key: name, arity: 2 }]),
);

export const isBefore = (left: SourceLocation, right: SourceLocation) =>
  left.line < right.line || (left.line === right.line && left.column < right.column);

const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

const isInstantiated = (definition: Definition) => definition.name.includes("!");

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

const findSymbol = (name: string, unit: Unit): ModuleSymbol | undefined => {
  const definition = unit.definitions.get(name);
  const isVisible =
    definition !== undefined &&
    (definition === unit.self
      ? definition.kind === "Function" || definition.isRecursive
      : definition.isRecursive || isBefore(definition.location, unit.location));
  return definition && isVisible
    ? { key: unit.getKey(definition), arity: getArity(definition) }
    : unit.imported.get(name);
};

const getSymbolArity = (
  expression: Expression & { kind: "Identifier" | "Apply" | "OperatorReference" },
  name: string,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const location = expression.location;
  const renamed = renamedArities.get(expression);
  if (renamed !== undefined) return renamed;
  if (isKey(name)) return expression.kind === "Apply" ? expression.args.length : 0;
  const local = lookupLocal(scope, name);
  if (local && expression.kind !== "OperatorReference") expression.resolution = LOCAL_RESOLUTION;
  if (local) return local.arity;
  const symbol = findSymbol(name, unit);
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

const isReferenced = (expression: Expression, name: string): boolean =>
  (expression.kind === "Identifier" && expression.name === name && isLocallyResolved(expression)) ||
  getChildren(expression).some((child) => isReferenced(child, name));

const markRecursiveConstructions = (expression: Expression, name: string): void => {
  if (expression.kind === "FunctionConstruction" && isReferenced(expression.body, name)) {
    expression.isRecursive = true;
  }
  getChildren(expression).forEach((child) => markRecursiveConstructions(child, name));
};

const resolveDefinition = (definition: Definition, scope: LocalName | undefined, unit: Unit) => {
  const self = bindNames(scope, definition.kind === "Function" ? [definition.name] : []);
  if (definition.kind === "Function") {
    resolveExpression(definition.body, resolveBounds(definition.bounds, self, unit), unit);
    markRecursiveConstructions(definition.body, definition.name);
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
    if (!isInstantiated(definition)) resolveDefinition(definition, current, unit);
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
    case "Decimal":
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
      return;
    case "Label":
      resolveExpression(expression.body, scope, unit);
      return;
    case "Subexpression":
      resolveAll(
        expression.selectors.flatMap((selector) => ("args" in selector ? selector.args : [])),
      );
  }
};

interface ModuleUnit {
  imported: Symbols;
  importedAt: Map<string, SourceLocation>;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
}

interface ModuleName {
  name: string;
  kind: "Definition" | "Constant" | "Variable";
  location: SourceLocation;
  isRecursive: boolean;
}

type IsDefined = (name: string) => boolean;

const createRedefinitionError = (name: string, location: SourceLocation) =>
  new TlaSyntaxError(
    `Multiply-defined symbol '${name}' at line ${location.line}, column ${location.column}`,
  );

const bindUnique = (
  scope: LocalName | undefined,
  names: string[],
  isDefined: IsDefined,
  location: SourceLocation,
) =>
  names.reduce<LocalName | undefined>((parent, name) => {
    if (lookupLocal(parent, name) || isDefined(name)) throw createRedefinitionError(name, location);
    return { name, arity: 0, parent };
  }, scope);

const checkBoundNames = (
  bounds: Bound[],
  scope: LocalName | undefined,
  isDefined: IsDefined,
  location: SourceLocation,
) => {
  bounds.forEach((bound) => checkNames(bound.set, scope, isDefined));
  return bounds.reduce(
    (current, bound) => bindUnique(current, getPatternNames(bound.pattern), isDefined, location),
    scope,
  );
};

const checkDefinitionNames = (
  definition: Definition,
  scope: LocalName | undefined,
  isDefined: IsDefined,
) => {
  if (definition.kind === "Function") {
    const self = bindNames(scope, [definition.name]);
    const bound = checkBoundNames(definition.bounds, self, isDefined, definition.location);
    checkNames(definition.body, bound, isDefined);
    return;
  }
  const params = bindUnique(
    scope,
    definition.params.map((param) => param.name),
    isDefined,
    definition.location,
  );
  checkNames(definition.body, params, isDefined);
};

const checkNames = (
  expression: Expression,
  scope: LocalName | undefined,
  isDefined: IsDefined,
): void => {
  const location = expression.location;
  switch (expression.kind) {
    case "Lambda":
      checkNames(
        expression.body,
        bindUnique(scope, expression.params, isDefined, location),
        isDefined,
      );
      return;
    case "Let": {
      const recursive = expression.definitions
        .filter((definition) => definition.isRecursive)
        .map((definition) => definition.name);
      const inner = expression.definitions.reduce((current, definition) => {
        if (lookupLocal(current, definition.name) || isDefined(definition.name)) {
          throw createRedefinitionError(definition.name, definition.location);
        }
        checkDefinitionNames(definition, bindNames(current, recursive), isDefined);
        return bindNames(current, [definition.name]);
      }, scope);
      checkNames(
        expression.body,
        bindUnique(
          inner,
          (expression.instances ?? []).flatMap((instance) =>
            instance.name === undefined ? [] : [instance.name],
          ),
          isDefined,
          location,
        ),
        isDefined,
      );
      return;
    }
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      checkNames(
        expression.body,
        checkBoundNames(expression.bounds, scope, isDefined, location),
        isDefined,
      );
      return;
    case "SetFilter":
      checkNames(
        expression.predicate,
        checkBoundNames([expression.bound], scope, isDefined, location),
        isDefined,
      );
      return;
    case "SetMap":
      checkNames(
        expression.expression,
        checkBoundNames(expression.bounds, scope, isDefined, location),
        isDefined,
      );
      return;
    case "UnboundedQuantifier":
      checkNames(
        expression.body,
        bindUnique(scope, expression.names, isDefined, location),
        isDefined,
      );
      return;
    case "Choose":
      if (expression.set) checkNames(expression.set, scope, isDefined);
      checkNames(
        expression.body,
        bindUnique(scope, getPatternNames(expression.pattern), isDefined, location),
        isDefined,
      );
      return;
    default:
      getChildren(expression).forEach((child) => checkNames(child, scope, isDefined));
  }
};

const getModuleNames = (module: Module): ModuleName[] => [
  ...module.definitions.map((definition): ModuleName => ({
    name: definition.name,
    kind: "Definition",
    location: definition.location,
    isRecursive: definition.isRecursive,
  })),
  ...module.instances.flatMap((instance): ModuleName[] =>
    instance.name === undefined
      ? []
      : [
          {
            name: instance.name,
            kind: "Definition",
            location: instance.location,
            isRecursive: false,
          },
        ],
  ),
  ...module.constants.map((constant): ModuleName => ({
    name: constant.name,
    kind: "Constant",
    location: constant.location,
    isRecursive: false,
  })),
  ...module.variables.map((variable): ModuleName => ({
    name: variable.name,
    kind: "Variable",
    location: variable.location,
    isRecursive: false,
  })),
];

export const checkRedefinitions = (module: Module, unit: ModuleUnit) => {
  const byName = new Map<string, ModuleName[]>();
  getModuleNames(module)
    .sort((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
    .forEach((entry) => byName.set(entry.name, [...(byName.get(entry.name) ?? []), entry]));
  const isImportedBefore = (name: string, location: SourceLocation) => {
    if (!unit.imported.has(name) && !CORE_SYMBOLS.has(name)) return false;
    const importedAt = unit.importedAt.get(name);
    return importedAt === undefined || isBefore(importedAt, location);
  };
  byName.forEach((entries) =>
    entries.forEach((entry, index) => {
      const isDuplicate = entries
        .slice(0, index)
        .some(
          (earlier) =>
            earlier.kind === "Definition" ||
            entry.kind === "Definition" ||
            earlier.kind !== entry.kind,
        );
      // A module may declare again a constant or variable that it extends or that encloses it.
      const isRedeclared = unit.imported.get(entry.name)?.declaration === entry.kind;
      if (isDuplicate || (!isRedeclared && isImportedBefore(entry.name, entry.location)))
        throw createRedefinitionError(entry.name, entry.location);
    }),
  );
  const getIsDefined =
    (location: SourceLocation): IsDefined =>
    (name) =>
      (byName.get(name) ?? []).some(
        (entry) => entry.isRecursive || isBefore(entry.location, location),
      ) || isImportedBefore(name, location);
  module.definitions.forEach((definition) =>
    checkDefinitionNames(definition, undefined, getIsDefined(definition.location)),
  );
  module.assumptions.forEach((assumption) =>
    checkNames(assumption.expression, undefined, getIsDefined(assumption.location)),
  );
  module.instances.forEach((instance) => {
    const isDefined = getIsDefined(instance.location);
    const params = bindUnique(
      undefined,
      instance.params.map((param) => param.name),
      isDefined,
      instance.location,
    );
    instance.substitutions.forEach((substitution) =>
      checkNames(substitution.expression, params, isDefined),
    );
  });
};

const createSymbols = (module: Module, imported: Symbols) => {
  const symbols = new Map([...CORE_SYMBOLS, ...imported]);
  module.constants.forEach((constant) =>
    symbols.set(constant.name, { key: constant.name, arity: constant.arity }),
  );
  module.variables.forEach((variable) =>
    symbols.set(variable.name, { key: variable.name, arity: 0 }),
  );
  return symbols;
};

export const resolveSubstitutions = (
  instance: Instance,
  declarations: OperatorParam[],
  module: Module,
  unit: ModuleUnit,
) => {
  const scope = instance.params.reduce<LocalName | undefined>(
    (parent, param) => ({ name: param.name, arity: param.arity, parent }),
    undefined,
  );
  const context: Unit = {
    imported: createSymbols(module, unit.imported),
    definitions: unit.definitions,
    getKey: unit.getKey,
    location: instance.location,
    self: undefined,
  };
  const explicit = new Map(instance.substitutions.map((item) => [item.name, item.expression]));
  const position = `in the instance of ${instance.module} at line ${instance.location.line}, column ${instance.location.column}`;
  explicit.forEach((_, name) => {
    if (declarations.every((declaration) => declaration.name !== name)) {
      throw new TlaSyntaxError(
        `Identifier '${name}' is not a legal target of a substitution ${position}`,
      );
    }
  });
  return new Map(
    declarations.map((declaration): [string, Expression] => {
      const name = declaration.name;
      if (!explicit.has(name) && !lookupLocal(scope, name) && !findSymbol(name, context)) {
        throw new TlaSyntaxError(`Substitution missing for symbol ${name} ${position}`);
      }
      const expression: Expression = explicit.get(name) ?? {
        kind: "Identifier",
        name,
        location: instance.location,
      };
      if (declaration.arity === 0 || expression.kind !== "Identifier") {
        resolveExpression(expression, scope, context);
        return [name, expression];
      }
      if (getSymbolArity(expression, expression.name, scope, context) !== declaration.arity) {
        throw new TlaSyntaxError(
          `An operator must be substituted for symbol '${name}', and it must have arity ${declaration.arity} ${position}`,
        );
      }
      return [name, expression];
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

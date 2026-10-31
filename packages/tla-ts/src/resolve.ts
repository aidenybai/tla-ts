import {
  getChildren,
  isLocallyResolved,
  type AssumeProve,
  type Bound,
  type BoundPattern,
  type Definition,
  type Expression,
  type Instance,
  type Module,
  type NewSymbol,
  type OperatorParam,
  type Proof,
  type ProofStep,
  type SourceLocation,
  type Theorem,
} from "./ast";
import { TlaSyntaxError } from "./errors";

export interface ModuleSymbol {
  key: string;
  arity: number;
  declaration?: "Constant" | "Variable" | "Fact";
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
  facts: Set<string>;
}

export const LOCAL_RESOLUTION = { kind: "Local" } as const;

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

export const getArity = (definition: Definition) =>
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

const bindParams = (scope: LocalName | undefined, params: OperatorParam[]) =>
  params.reduce<LocalName | undefined>(
    (parent, param) => ({ name: param.name, arity: param.arity, parent }),
    scope,
  );

export const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

export const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) => getPatternNames(bound.pattern));

const getVisibleDefinition = (name: string, unit: Unit) => {
  const definition = unit.definitions.get(name);
  const isVisible =
    definition !== undefined &&
    (definition === unit.self
      ? definition.kind === "Function" || definition.isRecursive
      : definition.isRecursive || isBefore(definition.location, unit.location));
  return isVisible ? definition : undefined;
};

const findSymbol = (name: string, unit: Unit): ModuleSymbol | undefined => {
  const definition = getVisibleDefinition(name, unit);
  return definition
    ? { key: unit.getKey(definition), arity: getArity(definition) }
    : unit.imported.get(name);
};

// SANY names an undefined operator symbol such as + differently from an undefined identifier.
const isOperatorSymbol = (name: string) =>
  name[0].toLowerCase() === name[0].toUpperCase() &&
  name[0] !== "_" &&
  (name[0] < "0" || name[0] > "9");

const isStepName = (name: string) =>
  name.startsWith("<") && ((name[1] >= "0" && name[1] <= "9") || name[1] === "*");

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
  if (isStepName(name)) return 0;
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
  // A name such as Inv!P1 selects the label P1 of a definition or theorem, which takes its own
  // arguments.
  const prefix = name.slice(0, name.indexOf("!"));
  const isSelected =
    prefix !== "" &&
    (lookupLocal(scope, prefix) !== undefined ||
      findSymbol(prefix, unit) !== undefined ||
      unit.facts.has(prefix));
  if (isSelected) {
    return expression.kind === "Apply" ? expression.args.length : 0;
  }
  const position = `at line ${location.line}, column ${location.column}`;
  throw new TlaSyntaxError(
    isOperatorSymbol(name)
      ? `Could not find declaration or definition of symbol '${name}' ${position}`
      : `Unknown operator: \`${name}' ${position}`,
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
    definition.isSelfReferential = isReferenced(definition.body, definition.name);
    return;
  }
  resolveExpression(definition.body, bindParams(self, definition.params), unit);
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

// OpDefNode#match: a parameter of arity 0 takes an expression, and a parameter of arity n takes an
// operator of arity n whose own parameters take expressions.
const checkArgument = (
  definition: Definition,
  index: number,
  arg: Expression,
  argArity: number,
  argDefinition: Definition | undefined,
) => {
  const param = definition.kind === "Operator" ? definition.params[index] : undefined;
  const location = arg.location;
  if (param?.arity === 0 && argArity > 0) {
    throw new TlaSyntaxError(
      `Operator used in argument number ${index + 1} has incorrect number of arguments at line ${location.line}, column ${location.column}`,
    );
  }
  const isHigherOrder =
    argDefinition?.kind === "Operator" && argDefinition.params.some((inner) => inner.arity > 0);
  if (param !== undefined && param.arity > 0 && (argArity !== param.arity || isHigherOrder)) {
    throw new TlaSyntaxError(
      `Argument number ${index + 1} to operator '${definition.name}' should be a ${param.arity}-parameter operator at line ${location.line}, column ${location.column}`,
    );
  }
};

const getArgumentName = (arg: Expression) =>
  arg.kind === "Identifier"
    ? arg.name
    : arg.kind === "OperatorReference"
      ? arg.operator
      : undefined;

const resolveApply = (
  expression: Expression & { kind: "Apply" },
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const callee = lookupLocal(scope, expression.operator)
    ? undefined
    : getVisibleDefinition(expression.operator, unit);
  const arity = getSymbolArity(expression, expression.operator, scope, unit);
  if (arity !== expression.args.length) {
    throw new TlaSyntaxError(
      `The operator ${expression.operator} requires ${arity} arguments at line ${expression.location.line}, column ${expression.location.column}`,
    );
  }
  expression.args.forEach((arg, index) => {
    const name = getArgumentName(arg);
    const argDefinition =
      name === undefined || lookupLocal(scope, name) ? undefined : getVisibleDefinition(name, unit);
    const argArity = resolveArgument(arg, scope, unit);
    if (callee) checkArgument(callee, index, arg, argArity, argDefinition);
  });
};

// An argument may name an operator that takes arguments of its own.
const resolveArgument = (arg: Expression, scope: LocalName | undefined, unit: Unit) => {
  if (arg.kind === "Identifier") return getSymbolArity(arg, arg.name, scope, unit);
  if (arg.kind === "OperatorReference") return getSymbolArity(arg, arg.operator, scope, unit);
  resolveExpression(arg, scope, unit);
  return arg.kind === "Lambda" ? arg.params.length : 0;
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
      expression.selectors
        .flatMap((selector) => ("args" in selector ? selector.args : []))
        .forEach((arg) => resolveArgument(arg, scope, unit));
  }
};

const resolveNewSymbol = (symbol: NewSymbol, scope: LocalName | undefined, unit: Unit) => {
  if (symbol.set) resolveExpression(symbol.set, scope, unit);
  return { name: symbol.name, arity: symbol.arity, parent: scope };
};

// The NEW symbols of an ASSUME stay in scope for its conclusion and the proof that follows.
const resolveAssumeProve = (
  assumeProve: AssumeProve,
  scope: LocalName | undefined,
  unit: Unit,
): LocalName | undefined => {
  const assumed = assumeProve.assumptions.reduce((current, assumption) => {
    if (assumption.kind === "NewSymbol") return resolveNewSymbol(assumption, current, unit);
    if (assumption.kind === "AssumeProve") resolveAssumeProve(assumption, current, unit);
    else resolveExpression(assumption, current, unit);
    return current;
  }, scope);
  resolveExpression(assumeProve.conclusion, assumed, unit);
  return assumed;
};

const resolveStatement = (
  statement: Expression | AssumeProve,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  if (statement.kind === "AssumeProve") return resolveAssumeProve(statement, scope, unit);
  resolveExpression(statement, scope, unit);
  return scope;
};

// SANY resolves the expressions of a proof, while its facts and DEF clauses may also name
// theorems, assumptions, and modules.
const resolveProof = (proof: Proof | undefined, scope: LocalName | undefined, unit: Unit) => {
  if (proof?.kind !== "Steps") return;
  proof.steps.reduce((current, step) => resolveStep(step, current, unit), scope);
};

const resolveStep = (
  step: ProofStep,
  scope: LocalName | undefined,
  unit: Unit,
): LocalName | undefined => {
  const body = step.body;
  switch (body.kind) {
    case "Assert": {
      const assumed = resolveStatement(body.statement, scope, unit);
      resolveProof(step.proof, assumed, unit);
      return body.isSuffices ? assumed : scope;
    }
    case "Define":
      return resolveDefinitions(
        body.definitions.flatMap((definition) =>
          definition.kind === "Instance" ? [] : [definition],
        ),
        scope,
        unit,
      );
    case "Have":
    case "Case":
      resolveExpression(body.expression, scope, unit);
      resolveProof(step.proof, scope, unit);
      return scope;
    case "Witness":
      body.expressions.forEach((expression) => resolveExpression(expression, scope, unit));
      return scope;
    case "Take":
      return bindNames(resolveBounds(body.bounds, scope, unit), body.names);
    case "Pick": {
      const picked = bindNames(resolveBounds(body.bounds, scope, unit), body.names);
      resolveExpression(body.body, picked, unit);
      resolveProof(step.proof, scope, unit);
      return picked;
    }
    default:
      resolveProof(step.proof, scope, unit);
      return scope;
  }
};

const resolveTheorem = (theorem: Theorem, unit: Unit) => {
  const isDefinition = theorem.name !== undefined && theorem.statement.kind !== "AssumeProve";
  const scope = isDefinition ? undefined : resolveStatement(theorem.statement, undefined, unit);
  resolveProof(theorem.proof, scope, unit);
};

interface ModuleUnit {
  imported: Symbols;
  importedAt: Map<string, SourceLocation>;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
}

interface ModuleName {
  name: string;
  kind: "Definition" | "Constant" | "Variable" | "Fact";
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

export const getFactNames = (module: Module) =>
  new Set([...module.theorems, ...module.assumptions].flatMap((fact) => fact.name ?? []));

const getModuleNames = (module: Module) => {
  const facts = getFactNames(module);
  return [
    ...module.definitions.map((definition): ModuleName => ({
      name: definition.name,
      kind: facts.has(definition.name) ? "Fact" : "Definition",
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
};

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
      // A module may declare again a constant or variable that it extends or that encloses it, and
      // name a fact as one it imports.
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
  const scope = bindParams(undefined, instance.params);
  const context: Unit = {
    imported: createSymbols(module, unit.imported),
    definitions: unit.definitions,
    getKey: unit.getKey,
    location: instance.location,
    self: undefined,
    facts: new Set(),
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
  const facts = getFactNames(module);
  const createUnit = (location: SourceLocation, self: Definition | undefined) => ({
    imported: symbols,
    definitions: unit.definitions,
    getKey: unit.getKey,
    location,
    self,
    facts,
  });
  module.definitions.forEach((definition) =>
    resolveDefinition(definition, undefined, createUnit(definition.location, definition)),
  );
  module.assumptions.forEach((assumption) =>
    resolveExpression(assumption.expression, undefined, createUnit(assumption.location, undefined)),
  );
  module.theorems.forEach((theorem) =>
    resolveTheorem(theorem, createUnit(theorem.location, undefined)),
  );
};

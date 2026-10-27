import type {
  Assumption,
  Declaration,
  Definition,
  Expression,
  Instance,
  Module,
  OperatorParam,
  SourceLocation,
} from "./ast";
import { BUNDLED_MODULES } from "./bundled-modules";
import type { ConfigValue, ModelConfig } from "./config";
import type { FileSystem } from "./json";
import { TlaConfigError, TlaEvaluationError, TlaSyntaxError } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  createBigNumberError,
  createRealNumberError,
  getChildren,
  isConstantLevel,
  isTlcInteger,
  type Builtin,
  type Environment,
} from "./evaluate";
import {
  createInstantiation,
  getEnabledVariableName,
  renameLocals,
  withLetInstances,
} from "./instances";
import { overrideDefinitions } from "./java-overrides";
import { extractModule, parseModule } from "./parser";
import {
  checkRedefinitions,
  isBefore,
  KEY_SEPARATOR,
  resolveModule,
  resolveSubstitutions,
  type ModuleSymbol,
  type Symbols,
} from "./resolve";
import { createRuntime } from "./runtime";
import { CORE_OPERATORS, getStandardModule, STANDARD_DEPENDENCIES } from "./standard-modules";
import { resolveInstanceSubexpressions, resolveModuleSubexpressions } from "./subexpressions";
import { checkModuleLevels } from "./levels";
import { checkInstances, type InstanceCheck, type ModuleContext } from "./substitution-levels";
import {
  checkInteger,
  createModelValue,
  createSet,
  formatValue,
  valuesEqual,
  type Value,
} from "./values";

interface EnvironmentOptions {
  source: string;
  loadModule: ((name: string) => string | undefined) | undefined;
  loadClass?: (name: string) => Uint8Array | undefined;
  print: (text: string) => void;
  files: FileSystem;
  seed?: bigint;
}

interface Specification {
  environment: Environment;
  assumptions: Assumption[];
  variableLocations: SourceLocation[];
  instanceActions: Map<string, InstanceAction>;
}

export interface InstanceAction {
  name: string;
  location: SourceLocation;
}

const toValue = (value: ConfigValue): Value => {
  switch (value.kind) {
    case "Number":
      try {
        return checkInteger(value.value);
      } catch (error) {
        // TLC fails with an unexpected exception on a configuration number too big for it.
        throw setExitCode(error, EXIT_STATUS.error);
      }
    case "String":
    case "Boolean":
      return value.value;
    case "ModelValue":
      return createModelValue(value.name);
    case "Set":
      return createSet(value.elements.map(toValue));
  }
};

interface LinkedModule {
  module: Module;
  constants: Declaration[];
  variables: string[];
  variableLocations: SourceLocation[];
  visible: Symbols;
  exported: Symbols;
  modules: Map<string, LinkedModule>;
  extended: LinkedModule[];
}

interface ModuleScope {
  id: string;
  symbols: Symbols;
  modules: Map<string, LinkedModule>;
  nested: Module[];
}

const createModuleRedefinedError = (module: Module) =>
  new TlaSyntaxError(
    `Multiply-defined module '${module.name}' at line ${module.location.line}, column ${module.location.column}`,
  );

const LOCAL_RESOLUTION = { kind: "Local" } as const;

const createLocalFunction = (definition: Definition, key: string): Definition => ({
  kind: "Operator",
  name: key,
  params: [],
  body: {
    kind: "Let",
    definitions: [definition],
    body: {
      kind: "Identifier",
      name: definition.name,
      location: definition.location,
      resolution: LOCAL_RESOLUTION,
    },
    location: definition.location,
  },
  isLocal: true,
  isRecursive: false,
  location: definition.location,
});

const createOperatorConstant = (name: string, arity: number, rows: [Value[], Value][]): Builtin => {
  const table = `{ ${rows.map((row) => `<${[...row[0], row[1]].map((value) => formatValue(value)).join(", ")}>`).join(", ")}}`;
  return {
    kind: "Builtin",
    name,
    arity,
    evaluate: (args) => {
      const row = rows.find((candidate) => {
        if (candidate[0].length !== args.length) {
          throw new TlaEvaluationError(
            `Attempted to apply the operator ${table}\nwith wrong number of arguments.`,
          );
        }
        return candidate[0].every((value, index) => {
          const argument = args[index];
          return (
            !(typeof argument === "object" && argument.kind === "Operator") &&
            valuesEqual(value, argument)
          );
        });
      });
      if (row) return row[1];
      throw new TlaEvaluationError(
        `Attempted to apply operator:\n${table}\nto arguments (${args.map((argument) => (typeof argument === "object" && argument.kind === "Operator" ? argument.name : formatValue(argument))).join(", ")}), which is undefined.`,
      );
    },
    evaluateUnary: undefined,
    evaluateBinary: undefined,
  };
};

const mentionsName = (expression: Expression, names: Set<string>): boolean =>
  (expression.kind === "Identifier" && names.has(expression.name)) ||
  (expression.kind === "Apply" && names.has(expression.operator)) ||
  getChildren(expression).some((child) => mentionsName(child, names));

const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

const getVariableIndex = (variables: string[], declared: string[]) => {
  const index = new Map(variables.map((name, position) => [name, position]));
  new Set(declared).forEach((name) =>
    index.set(getEnabledVariableName(name), index.get(name) ?? index.size),
  );
  return index;
};

const getSubstitutions = (instances: Instance[]) =>
  instances.flatMap((instance) =>
    instance.substitutions.map((substitution) => substitution.expression),
  );

const rejectLiterals = (expressions: Expression[]): void =>
  expressions.forEach((expression) => {
    if (expression.kind === "Decimal") throw createRealNumberError(expression);
    if (expression.kind === "Number" && !isTlcInteger(expression.value)) {
      throw createBigNumberError(expression);
    }
    rejectLiterals(
      expression.kind === "Let"
        ? [...getChildren(expression), ...getSubstitutions(expression.instances ?? [])]
        : getChildren(expression),
    );
  });

export const createEnvironment = (
  config: ModelConfig,
  options: EnvironmentOptions,
): Specification => {
  const root = parseModule(options.source);
  const definitions = new Map<string, Definition>();
  const parameterized = new Map<string, boolean>();
  const builtins = new Map<string, Builtin>(
    CORE_OPERATORS.map((operator) => [operator.name, operator]),
  );
  const standardExports = new Map<string, Symbols>();
  const runtime = createRuntime(config.checkDeadlock, options.seed);
  const linkedModules = new Map<string, LinkedModule>();
  const nestedModules = new Map<string, LinkedModule>();
  const linkedList: LinkedModule[] = [];
  const dependencies = new Map<string, Set<string>>();
  const loading: Set<string>[] = [];
  // The top-level modules being linked, to report a cycle of EXTENDS or INSTANCE.
  const linking: string[] = [];

  const useModule = (name: string, used: Iterable<string>) =>
    loading.forEach((closure) => {
      closure.add(name);
      [...used].forEach((dependency) => closure.add(dependency));
    });
  const copyCount = { value: 0 };
  const createName = (name: string) => `${name}#${copyCount.value++}`;
  const instanceChecks: InstanceCheck[] = [];
  const instanceActions = new Map<string, InstanceAction>();

  const addStandardModule = (name: string): Symbols | undefined => {
    const cached = standardExports.get(name);
    if (cached) return cached;
    const standardModule = getStandardModule(name, options.print, runtime, options.files);
    if (!standardModule) return undefined;
    const exported: Symbols = new Map();
    standardModule.extends.forEach((extended) =>
      addStandardModule(extended)?.forEach((symbol, symbolName) =>
        exported.set(symbolName, symbol),
      ),
    );
    standardModule.operators.forEach((operator) => {
      builtins.set(operator.name, operator);
      exported.set(operator.name, { key: operator.name, arity: operator.arity });
    });
    standardExports.set(name, exported);
    return exported;
  };

  const getStandardSymbols = (name: string) => {
    const symbols = addStandardModule(name);
    if (symbols) useModule(name, STANDARD_DEPENDENCIES.get(name) ?? []);
    return symbols;
  };

  // Like TLC, reject a decimal or a big integer anywhere in a module, even where nothing evaluates it.
  const rejectModuleLiterals = (module: Module): Module => {
    rejectLiterals([
      ...module.definitions.flatMap((definition) =>
        definition.kind === "Function"
          ? [...definition.bounds.map((bound) => bound.set), definition.body]
          : [definition.body],
      ),
      ...module.assumptions.map((assumption) => assumption.expression),
      ...module.theorems.flatMap((theorem) =>
        theorem.statement.kind === "AssumeProve" ? [] : [theorem.statement],
      ),
      ...getSubstitutions(module.instances),
    ]);
    module.modules.forEach(rejectModuleLiterals);
    return module;
  };
  rejectModuleLiterals(root);

  const loadModule = (name: string, importer: string) => {
    const source =
      options.loadModule?.(name) ??
      BUNDLED_MODULES.get(name) ??
      extractModule(options.source, name);
    if (source === undefined)
      throw new TlaSyntaxError(
        `Cannot find source file for module ${name} imported in module ${importer}.`,
      );
    const module = parseModule(source);
    if (module.name !== name) {
      throw new TlaSyntaxError(
        `File name '${name}' does not match the name '${module.name}' of the top level module it contains.`,
      );
    }
    return rejectModuleLiterals(module);
  };

  const getDefinitionKey = (module: Module, id: string, name: string) =>
    module === root ? name : `${name}${KEY_SEPARATOR}${id}`;

  const linkTopLevel = (parsed: Module) => {
    const cycleStart = linking.indexOf(parsed.name);
    if (cycleStart !== -1) {
      const cycle = [...linking.slice(cycleStart), parsed.name].map((name) => `${name}.tla`);
      throw new TlaSyntaxError(
        `Circular dependency among .tla files; dependency cycle is: ${cycle.join(" --> ")}`,
      );
    }
    const closure = new Set<string>();
    const nested: Module[] = [];
    linking.push(parsed.name);
    loading.push(closure);
    const linked = linkModule(parsed, {
      id: parsed.name,
      symbols: new Map(),
      modules: new Map(),
      nested,
    });
    loading.pop();
    linking.pop();
    const duplicate = nested.find((module) => closure.has(module.name));
    if (duplicate) throw createModuleRedefinedError(duplicate);
    return { linked, closure };
  };

  const getLinkedModule = (name: string, importer: string): LinkedModule => {
    const cached = linkedModules.get(name);
    if (cached) {
      useModule(name, dependencies.get(name) ?? []);
      return cached;
    }
    const top = linkTopLevel(loadModule(name, importer));
    linkedModules.set(name, top.linked);
    dependencies.set(name, top.closure);
    useModule(name, top.closure);
    return top.linked;
  };

  const instantiate = (
    instance: Instance,
    module: Module,
    unit: {
      imported: Symbols;
      importedAt: Map<string, SourceLocation>;
      definitions: Map<string, Definition>;
      getKey: (definition: Definition) => string;
    },
    isParameterFree: boolean,
    nested: LinkedModule | undefined,
  ): Symbols => {
    const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return standardSymbols;
      return new Map(
        [...standardSymbols].map(([name, symbol]) => [`${instance.name}!${name}`, symbol]),
      );
    }
    const linked = nested ?? getLinkedModule(instance.module, module.name);
    const declarations = [
      ...linked.constants,
      ...linked.variables.map((variable) => ({ name: variable, arity: 0 })),
    ];
    const suffix = `#${copyCount.value++}`;
    const renamed = new Map(instance.params.map((param) => [param.name, `${param.name}${suffix}`]));
    const substitutions = resolveSubstitutions(
      resolveInstanceSubexpressions(instance, module),
      declarations,
      module,
      unit,
    );
    instanceChecks.push({
      module: instance.module,
      instancer: module.name,
      lets: [],
      substitutions,
      location: instance.location,
    });
    const instantiation = createInstantiation({
      params: instance.params.map((param) => ({ ...param, name: `${param.name}${suffix}` })),
      substitutions: new Map(
        [...substitutions].map(([name, expression]) => [name, renameLocals(expression, renamed)]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (name, create) => {
        const key = `${name}@${module.name}#${copyCount.value++}`;
        definitions.set(key, create(key));
        parameterized.set(key, !isParameterFree);
        return key;
      },
      createName,
    });
    const declared = new Set(declarations.map((declaration) => declaration.name));
    const symbols: Symbols = new Map();
    linked.exported.forEach((symbol, name) => {
      if (declared.has(name)) return;
      if (instance.name === undefined) {
        const key = instantiation.getKey(symbol.key);
        if (declarations.length > 0)
          instanceActions.set(key, { name, location: instance.location });
        symbols.set(name, { key, arity: symbol.arity });
        return;
      }
      const key = instantiation.getQualifiedKey(symbol.key);
      if (declarations.length > 0) {
        instanceActions.set(key, { name: `${instance.name}!${name}`, location: instance.location });
      }
      symbols.set(`${instance.name}!${name}`, {
        key,
        arity: symbol.arity + instance.params.length,
      });
    });
    return symbols;
  };

  const getLocalArguments = (params: OperatorParam[], location: SourceLocation) =>
    params.map((param): Expression => ({
      kind: "Identifier",
      name: param.name,
      location,
      resolution: LOCAL_RESOLUTION,
    }));

  const createLocalAlias = (
    name: string,
    key: string,
    params: OperatorParam[],
    forwarded: OperatorParam[],
    location: SourceLocation,
  ): Definition => ({
    kind: "Operator",
    name,
    params,
    body:
      forwarded.length === 0
        ? { kind: "Identifier", name: key, location }
        : { kind: "Apply", operator: key, args: getLocalArguments(forwarded, location), location },
    isLocal: true,
    isRecursive: false,
    location,
  });

  const getArguments = (arity: number) =>
    Array.from({ length: arity }, (_, index) => ({ name: `argument${index}`, arity: 0 }));

  const getSubstitutionBody = (
    replacement: Expression,
    declaration: OperatorParam,
    location: SourceLocation,
  ): { params: OperatorParam[]; body: Expression } => {
    if (declaration.arity === 0) return { params: [], body: replacement };
    if (replacement.kind === "Lambda") {
      return {
        params: replacement.params.map((name) => ({ name, arity: 0 })),
        body: replacement.body,
      };
    }
    const params = getArguments(declaration.arity);
    const operator =
      replacement.kind === "Identifier"
        ? replacement.name
        : replacement.kind === "OperatorReference"
          ? replacement.operator
          : declaration.name;
    return {
      params,
      body: { kind: "Apply", operator, args: getLocalArguments(params, location), location },
    };
  };

  const instantiateLocally = (
    instance: Instance,
    lets: Definition[],
    instancer: string,
    nested: LinkedModule | undefined,
  ): Definition[] => {
    const location = instance.location;
    const instanceParams = instance.params;
    const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return [];
      return [...standardSymbols].map(([name, symbol]) => {
        const forwarded = getArguments(symbol.arity);
        return createLocalAlias(
          `${instance.name}!${name}`,
          symbol.key,
          [...instanceParams, ...forwarded],
          forwarded,
          location,
        );
      });
    }
    const linked = nested ?? getLinkedModule(instance.module, instancer);
    const suffix = `#${copyCount.value++}`;
    const explicit = new Map(instance.substitutions.map((item) => [item.name, item.expression]));
    const declarations = [
      ...linked.constants,
      ...linked.variables.map((variable) => ({ name: variable, arity: 0 })),
    ];
    const getReplacement = (declaration: OperatorParam): Expression =>
      explicit.get(declaration.name) ?? { kind: "Identifier", name: declaration.name, location };
    instanceChecks.push({
      module: instance.module,
      instancer,
      lets,
      substitutions: new Map(
        declarations.map((declaration) => [declaration.name, getReplacement(declaration)]),
      ),
      location,
    });
    const instanceNames = new Set(instanceParams.map((param) => param.name));
    const isParameterDependent = (declaration: OperatorParam) =>
      mentionsName(getReplacement(declaration), instanceNames);
    const substitutionDefinitions = declarations.map((declaration): Definition => {
      const substitution = getSubstitutionBody(getReplacement(declaration), declaration, location);
      return {
        kind: "Operator",
        name: `${declaration.name}${suffix}`,
        params: [
          ...(isParameterDependent(declaration) ? instanceParams : []),
          ...substitution.params,
        ],
        body: substitution.body,
        isLocal: true,
        isRecursive: false,
        location,
      };
    });
    const copies: Definition[] = [];
    const instantiation = createInstantiation({
      params: instanceParams,
      substitutions: new Map(
        declarations.map((declaration): [string, Expression] => [
          declaration.name,
          !isParameterDependent(declaration)
            ? {
                kind: "Identifier",
                name: `${declaration.name}${suffix}`,
                location,
                resolution: LOCAL_RESOLUTION,
              }
            : {
                kind: "Apply",
                operator: `${declaration.name}${suffix}`,
                args: getLocalArguments(instanceParams, location),
                location,
                resolution: LOCAL_RESOLUTION,
              },
        ]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (name, create) => {
        const key = `${name}${KEY_SEPARATOR}${instance.module}${suffix}.${copies.length}`;
        const definition = create(key);
        copies.push(
          definition.kind === "Operator"
            ? { ...definition, name: key }
            : createLocalFunction(definition, key),
        );
        return key;
      },
      createName,
    });
    const declared = new Set(declarations.map((declaration) => declaration.name));
    const aliases = [...linked.exported]
      .filter(([name]) => !declared.has(name))
      .map(([name, symbol]) => {
        const key = instantiation.getKey(symbol.key);
        const own = getArguments(symbol.arity);
        const params = [...instanceParams, ...own];
        return createLocalAlias(
          instance.name === undefined ? name : `${instance.name}!${name}`,
          key,
          params,
          key === symbol.key ? own : params,
          location,
        );
      });
    return [...substitutionDefinitions, ...copies, ...aliases];
  };

  const getAvailableDefinitions = (visible: Symbols) =>
    [...visible].flatMap(([name, symbol]) => {
      const definition = definitions.get(symbol.key);
      return definition ? [{ ...definition, name }] : [];
    });

  const linkModule = (unlinked: Module, scope: ModuleScope): LinkedModule => {
    const parsed = overrideDefinitions(unlinked, options.loadClass?.(unlinked.name));
    const visible: Symbols = new Map([
      ...CORE_OPERATORS.map((operator): [string, ModuleSymbol] => [
        operator.name,
        { key: operator.name, arity: operator.arity },
      ]),
      ...scope.symbols,
    ]);
    const exported: Symbols = new Map();
    const modules = new Map<string, LinkedModule>();
    const extended: LinkedModule[] = [];
    const constants = [...parsed.constants];
    const variables = parsed.variables.map((variable) => variable.name);
    const variableLocations = parsed.variables.map((variable) => variable.location);
    const addSymbols = (symbols: Symbols, isExported: boolean) =>
      symbols.forEach((symbol, name) => {
        visible.set(name, symbol);
        if (isExported) exported.set(name, symbol);
      });
    parsed.extends.forEach((name) => {
      const nested = scope.modules.get(name);
      const standardSymbols = nested ? undefined : getStandardSymbols(name);
      if (standardSymbols) {
        addSymbols(standardSymbols, true);
        return;
      }
      const linked = nested ?? getLinkedModule(name, parsed.name);
      constants.push(
        ...linked.constants.filter((constant) =>
          constants.every((existing) => existing.name !== constant.name),
        ),
      );
      linked.variables.forEach((variable, index) => {
        if (variables.includes(variable)) return;
        variables.push(variable);
        variableLocations.push(linked.variableLocations[index]);
      });
      addSymbols(linked.exported, true);
      linked.modules.forEach((module, moduleName) => modules.set(moduleName, module));
      extended.push(linked);
    });
    parsed.constants.forEach((constant) =>
      exported.set(constant.name, {
        key: constant.name,
        arity: constant.arity,
        declaration: "Constant",
      }),
    );
    parsed.variables.forEach((variable) =>
      exported.set(variable.name, { key: variable.name, arity: 0, declaration: "Variable" }),
    );
    const isParameterFree = constants.length === 0 && variables.length === 0;
    const getKey = (definition: Definition) => getDefinitionKey(parsed, scope.id, definition.name);
    const importedAt = new Map<string, SourceLocation>();
    const getUnit = (module: Module) => ({
      imported: visible,
      importedAt,
      definitions: new Map(module.definitions.map((definition) => [definition.name, definition])),
      getKey,
    });
    const getVisibleModules = () => new Map([...scope.modules, ...modules]);
    const getSymbolsBefore = (location: SourceLocation): Symbols =>
      new Map([
        ...visible,
        ...[
          ...parsed.constants.map((constant) => ({ ...constant, kind: "Constant" as const })),
          ...parsed.variables.map((variable) => ({ ...variable, kind: "Variable" as const })),
        ]
          .filter((declaration) => isBefore(declaration.location, location))
          .map((declaration): [string, ModuleSymbol] => [
            declaration.name,
            { key: declaration.name, arity: declaration.arity, declaration: declaration.kind },
          ]),
        ...parsed.definitions
          .filter((definition) => isBefore(definition.location, location))
          .map((definition): [string, ModuleSymbol] => [
            definition.name,
            { key: getKey(definition), arity: getArity(definition) },
          ]),
      ]);
    const linkNested = (nested: Module) => {
      const visibleModules = getVisibleModules();
      if (visibleModules.has(nested.name)) throw createModuleRedefinedError(nested);
      scope.nested.push(nested);
      const linked = linkModule(nested, {
        id: `${scope.id}/${nested.name}`,
        symbols: getSymbolsBefore(nested.location),
        modules: visibleModules,
        nested: scope.nested,
      });
      modules.set(nested.name, linked);
      if (!nestedModules.has(nested.name)) nestedModules.set(nested.name, linked);
    };
    [
      ...parsed.instances.map((instance) => ({
        location: instance.location,
        link: () => {
          const symbols = instantiate(
            instance,
            parsed,
            getUnit(parsed),
            isParameterFree,
            getVisibleModules().get(instance.module),
          );
          symbols.forEach((_, name) => {
            if (!visible.has(name)) importedAt.set(name, instance.location);
          });
          addSymbols(symbols, !instance.isLocal);
        },
      })),
      ...parsed.modules.map((nested) => ({
        location: nested.location,
        link: () => linkNested(nested),
      })),
    ]
      .sort((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
      .forEach((unit) => unit.link());
    checkRedefinitions(parsed, getUnit(parsed));
    const isInstancedAfterDefinition = (nested: Module) => {
      const first = parsed.instances.find((instance) => instance.module === nested.name);
      return first !== undefined && isBefore(nested.location, first.location);
    };
    const getLetModule = (instance: Instance) => {
      const own = parsed.modules.find((nested) => nested.name === instance.module);
      if (!own) return getVisibleModules().get(instance.module);
      return isInstancedAfterDefinition(own) ? modules.get(own.name) : undefined;
    };
    const module = resolveModuleSubexpressions(
      withLetInstances(parsed, (instance, lets) =>
        instantiateLocally(instance, lets, parsed.name, getLetModule(instance)),
      ),
      getAvailableDefinitions(visible),
    );
    resolveModule(module, getUnit(module));
    module.definitions.forEach((definition) => {
      const key = getKey(definition);
      definitions.set(key, definition);
      parameterized.set(key, !isParameterFree);
      const symbol = { key, arity: getArity(definition) };
      visible.set(definition.name, symbol);
      if (!definition.isLocal) exported.set(definition.name, symbol);
    });
    checkModuleLevels(module, {
      constants: new Set(constants.map((constant) => constant.name)),
      variables: new Set(variables),
      getDefinition: (symbol) => definitions.get(visible.get(symbol)?.key ?? symbol),
    });
    const linked = {
      module,
      constants,
      variables,
      variableLocations,
      visible,
      exported,
      modules,
      extended,
    };
    linkedList.push(linked);
    return linked;
  };

  const linkedRoot = linkTopLevel(root).linked;
  const getRootKey = (name: string) => linkedRoot.visible.get(name)?.key ?? name;
  linkedRoot.visible.forEach((symbol, name) => {
    const definition = definitions.get(symbol.key);
    if (definition && symbol.key !== name) definitions.set(name, definition);
  });

  const assumptions: Assumption[] = [];
  const addAssumptions = (linked: LinkedModule, visited: Set<LinkedModule>) => {
    if (visited.has(linked)) return;
    visited.add(linked);
    linked.extended.forEach((extended) => addAssumptions(extended, visited));
    assumptions.push(...linked.module.assumptions);
  };
  addAssumptions(linkedRoot, new Set());
  const declaredConstants = linkedRoot.constants.map((constant) => constant.name);
  const variables = linkedRoot.variables;

  const getScopedKeys = (item: { name: string; module?: string }): string[] => {
    if (item.module === undefined) return [item.name, getRootKey(item.name)];
    if (item.module === root.name || declaredConstants.includes(item.name)) return [];
    const linked = linkedModules.get(item.module) ?? nestedModules.get(item.module);
    return [linked?.visible.get(item.name)?.key ?? item.name];
  };
  const getKeyArity = (key: string) => {
    const definition = definitions.get(key);
    return definition?.kind === "Operator"
      ? definition.params.length
      : (linkedRoot.constants.find((constant) => constant.name === key)?.arity ?? 0);
  };
  const constants = new Map<string, Value>();
  const operatorKeys = new Set<string>();
  const setOperator = (key: string, operator: Builtin) => {
    builtins.set(key, operator);
    definitions.delete(key);
    constants.delete(key);
    operatorKeys.add(key);
  };
  config.constants
    .filter((assignment) => assignment.args === undefined)
    .forEach((assignment) => {
      const value = toValue(assignment.value);
      getScopedKeys(assignment).forEach((key) => {
        const arity = getKeyArity(key);
        if (arity === 0) constants.set(key, value);
        else
          setOperator(key, {
            kind: "Builtin",
            name: key,
            arity,
            evaluate: () => value,
            evaluateUnary: undefined,
            evaluateBinary: undefined,
            isLazy: true,
          });
      });
    });
  const tables = new Map<string, { name: string; module?: string; rows: [Value[], Value][] }>();
  config.constants.forEach((assignment) => {
    if (assignment.args === undefined) return;
    const id = `${assignment.module ?? ""}!${assignment.name}`;
    const table = tables.get(id) ?? { name: assignment.name, module: assignment.module, rows: [] };
    if (table.rows.length > 0 && table.rows[0][0].length !== assignment.args.length) {
      throw new TlaConfigError(
        `The arity of the operator ${assignment.name} is inconsistent in the configuration file.`,
      );
    }
    table.rows.push([assignment.args.map(toValue), toValue(assignment.value)]);
    tables.set(id, table);
  });
  tables.forEach((table) =>
    getScopedKeys(table).forEach((key) =>
      setOperator(
        key,
        createOperatorConstant(table.name, getKeyArity(key) || table.rows[0][0].length, table.rows),
      ),
    ),
  );
  const substitutions = new Map(
    config.substitutions.flatMap((substitution) =>
      getScopedKeys(substitution).map((key): [string, string] => [
        key,
        getRootKey(substitution.target),
      ]),
    ),
  );
  config.substitutions
    .filter((substitution) => substitution.module === undefined)
    .forEach((substitution) => {
      const name = substitution.name;
      const target = substitution.target;
      if (!declaredConstants.includes(name) && !linkedRoot.visible.has(name)) {
        throw new TlaConfigError(
          `In the configuration file, the identifier ${name} does not appear in the specification.`,
        );
      }
      if (config.substitutions.some((other) => other.name === target)) {
        throw new TlaConfigError(
          `In the configuration file, the identifier ${target} appears\non the right-hand side of a <- after already appearing on the\nleft-hand side of one.`,
        );
      }
      const targetKey = getRootKey(target);
      const definition = definitions.get(targetKey);
      const isDefined =
        definition !== undefined ||
        builtins.has(targetKey) ||
        constants.has(targetKey) ||
        declaredConstants.includes(target) ||
        variables.includes(target);
      if (!isDefined) {
        throw new TlaConfigError(
          `The configuration file substitutes for ${name} with the undefined identifier ${target}.`,
        );
      }
      if (
        definition?.kind === "Operator" &&
        definition.params.length !==
          (linkedRoot.constants.find((constant) => constant.name === name)?.arity ??
            linkedRoot.visible.get(name)?.arity)
      ) {
        throw new TlaConfigError(
          `The configuration file substitutes for ${name} with ${target} of different number of arguments.`,
        );
      }
    });
  declaredConstants.forEach((name) => {
    if (!constants.has(name) && !substitutions.has(name) && !operatorKeys.has(name)) {
      throw new TlaConfigError(`The constant ${name} is not assigned a value by the configuration`);
    }
  });

  const environment: Environment = {
    runtime,
    definitions,
    builtins,
    constants,
    substitutions,
    variables,
    variableIndex: getVariableIndex(
      variables,
      linkedList.flatMap((linked) => linked.module.variables.map((variable) => variable.name)),
    ),
    definitionValues: new Map(),
    constantLevels: new Map(),
    evaluators: new WeakMap(),
  };
  checkInstances(instanceChecks, (name): ModuleContext => {
    const linked = linkedModules.get(name) ?? nestedModules.get(name) ?? linkedRoot;
    const getKey = (symbol: string) => linked.visible.get(symbol)?.key ?? symbol;
    return {
      constants: linked.constants,
      variables: linked.variables,
      definitions: [
        ...new Set(
          [...linked.visible.values()].flatMap((symbol) => definitions.get(symbol.key) ?? []),
        ),
      ],
      assumptions: linked.module.assumptions.map((assumption) => assumption.expression),
      getDefinition: (symbol) => definitions.get(getKey(symbol)),
    };
  });
  substitutions.forEach((target, name) => {
    const definition = definitions.get(target);
    if (
      declaredConstants.includes(name) &&
      definition &&
      !isConstantLevel(definition, environment)
    ) {
      throw new TlaConfigError(
        `The configuration file substitutes constant ${name} with non-constant ${target}`,
      );
    }
  });
  return {
    environment,
    assumptions,
    variableLocations: linkedRoot.variableLocations,
    instanceActions,
  };
};

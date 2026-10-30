import {
  getChildren,
  type Assumption,
  type Declaration,
  type Definition,
  type Expression,
  type Instance,
  type Module,
  type OperatorParam,
  type SourceLocation,
} from "./ast";
import { BUNDLED_MODULES } from "./bundled-modules";
import type { ConfigValue, ModelConfig } from "./config";
import type { FileSystem } from "./json";
import { TlaConfigError, TlaEvaluationError, TlaSyntaxError, TlaSanyFatalError } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  createBigNumberError,
  createRealNumberError,
  evaluate,
  getDefinition,
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
import { overrideDefinitions, type JavaOverride } from "./java-overrides";
import { extractModule, parseModule } from "./parser";
import {
  checkRedefinitions,
  getArity,
  isBefore,
  KEY_SEPARATOR,
  LOCAL_RESOLUTION,
  resolveModule,
  resolveSubstitutions,
  type ModuleSymbol,
  type Symbols,
} from "./resolve";
import { createRuntime } from "./runtime";
import {
  CORE_OPERATORS,
  getStandardModule,
  getTraceSpecArithmetic,
  STANDARD_DEPENDENCIES,
} from "./standard-modules";
import { resolveInstanceSubexpressions, resolveModuleSubexpressions } from "./subexpressions";
import { checkModuleLevels, createLevelAnalyzer } from "./levels";
import { checkInstances, type InstanceCheck } from "./substitution-levels";
import { isEvalException } from "./tlc-messages";
import { createTlcDefinitionOrder, getTlcDeclarationOrder } from "./tlc-order";
import {
  checkInteger,
  createModelValue,
  createSet,
  formatValue,
  valuesEqual,
  type Value,
  markNormalized,
} from "./values";
import type { TlcVersion } from "./tlc-version";

interface EnvironmentOptions {
  source: string;
  loadModule: ((name: string) => string | undefined) | undefined;
  loadClass?: (name: string) => Uint8Array | undefined;
  print: (text: string) => void;
  files: FileSystem;
  seed?: bigint;
  // Links the modules without a model, as SANY does, so a declared constant needs no value.
  isUnconfigured?: boolean;
  isTool?: boolean;
  // TLC loads Integers for the binary trace of its trace exploration spec, and Integers' Java
  // methods then compute the arithmetic of Naturals.
  isTraceRecorded?: boolean;
  isWarningEnabled?: boolean;
  version?: TlcVersion;
}

interface Specification {
  environment: Environment;
  assumptions: Assumption[];
  variableLocations: SourceLocation[];
  instanceActions: Map<string, InstanceAction>;
  // The definitions TLC computes when it starts, in the order it computes them.
  startupDefinitions: Definition[];
  rootConstants: Declaration[];
  rootSymbols: Symbols;
  // The methods of the modules' classes, in the order TLC loads the classes.
  javaOverrides: JavaOverride[];
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

const getDeclarations = (linked: LinkedModule) => [
  ...linked.constants,
  ...linked.variables.map((variable) => ({ name: variable, arity: 0 })),
];

const createModuleRedefinedError = (module: Module) =>
  new TlaSyntaxError(
    `Multiply-defined module '${module.name}' at line ${module.location.line}, column ${module.location.column}`,
  );

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
  // The definition each instance copy came from, and the instance parameters the copy adds.
  const copySources = new Map<string, { source: string; prefix: number }>();
  const substitutedDefinitions = new Set<Definition>();
  const builtins = new Map<string, Builtin>(
    CORE_OPERATORS.map((operator) => [operator.name, operator]),
  );
  const standardExports = new Map<string, Symbols>();
  const runtime = createRuntime(config.checkDeadlock, options.seed);
  runtime.isWarningEnabled = options.isWarningEnabled ?? true;
  runtime.isTool = options.isTool ?? false;
  runtime.version = options.version ?? "master";
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
  const instanceNames = new Map<string, string>();

  const addStandardModule = (name: string): Symbols | undefined => {
    const cached = standardExports.get(name);
    if (cached) return cached;
    const standardModule = getStandardModule(name, options.print, runtime, options.files, builtins);
    if (!standardModule) return undefined;
    // TLC loads the modules a standard module instantiates too, and the Java methods of each
    // replace the operators of every module, as those of Integers replace those of Naturals.
    STANDARD_DEPENDENCIES.get(name)?.forEach(addStandardModule);
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
      throw new TlaSanyFatalError(
        `Cannot find source file for module ${name} imported in module ${importer}.`,
        importer,
      );
    const module = parseModule(source);
    if (module.name !== name) {
      throw new TlaSanyFatalError(
        `File name '${name}' does not match the name '${module.name}' of the top level module it contains.`,
        undefined,
      );
    }
    return rejectModuleLiterals(module);
  };

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
    const declarations = getDeclarations(linked);
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
      addDefinition: (source, name, create) => {
        const key = createName(`${name}@${module.name}`);
        const definition = create(key);
        definitions.set(key, definition);
        if (declarations.length > 0) substitutedDefinitions.add(definition);
        if (instance.name !== undefined) {
          instanceNames.set(key, `${instance.name}!${instanceNames.get(source) ?? name}`);
        }
        parameterized.set(key, !isParameterFree);
        copySources.set(key, { source, prefix: instance.params.length });
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
    const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return [];
      return [...standardSymbols].map(([name, symbol]) => {
        const forwarded = getArguments(symbol.arity);
        return createLocalAlias(
          `${instance.name}!${name}`,
          symbol.key,
          [...instance.params, ...forwarded],
          forwarded,
          location,
        );
      });
    }
    const linked = nested ?? getLinkedModule(instance.module, instancer);
    const suffix = `#${copyCount.value++}`;
    const explicit = new Map(instance.substitutions.map((item) => [item.name, item.expression]));
    const declarations = getDeclarations(linked);
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
    const instanceNames = new Set(instance.params.map((param) => param.name));
    const isParameterDependent = (declaration: OperatorParam) =>
      mentionsName(getReplacement(declaration), instanceNames);
    const substitutionDefinitions = declarations.map((declaration): Definition => {
      const substitution = getSubstitutionBody(getReplacement(declaration), declaration, location);
      return {
        kind: "Operator",
        name: `${declaration.name}${suffix}`,
        params: [
          ...(isParameterDependent(declaration) ? instance.params : []),
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
      params: instance.params,
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
                args: getLocalArguments(instance.params, location),
                location,
                resolution: LOCAL_RESOLUTION,
              },
        ]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (_source, name, create) => {
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
        const params = [...instance.params, ...own];
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

  const javaOverrides = new Map<string, JavaOverride[]>();
  const linkModule = (unlinked: Module, scope: ModuleScope): LinkedModule => {
    const overridden = overrideDefinitions(
      unlinked,
      options.loadClass?.(unlinked.name),
      unlinked === root,
    );
    javaOverrides.set(unlinked.name, overridden.overrides);
    const parsed = overridden.module;
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
    const getKey = (definition: Definition) =>
      parsed === root ? definition.name : `${definition.name}${KEY_SEPARATOR}${scope.id}`;
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

  const getScopedKeys = (item: { name: string; module?: string }) => {
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
      markNormalized(value);
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
    const tableKey = `${assignment.module ?? ""}!${assignment.name}`;
    const table = tables.get(tableKey) ?? {
      name: assignment.name,
      module: assignment.module,
      rows: [],
    };
    if (table.rows.length > 0 && table.rows[0][0].length !== assignment.args.length) {
      throw new TlaConfigError(
        `The arity of the operator ${assignment.name} is inconsistent in the configuration file.`,
      );
    }
    table.rows.push([assignment.args.map(toValue), toValue(assignment.value)]);
    tables.set(tableKey, table);
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
  // TLC sets a module-scoped entry on the body of the module's definition, which every instance of
  // the module shares.
  const scopedKeys = new Set(
    [...config.constants, ...config.substitutions]
      .filter((item) => item.module !== undefined)
      .flatMap(getScopedKeys),
  );
  const getOverride = (
    key: string,
    prefix: number,
  ): { key: string; prefix: number } | undefined => {
    if (scopedKeys.has(key)) return { key, prefix };
    const copy = copySources.get(key);
    return copy && getOverride(copy.source, prefix + copy.prefix);
  };
  copySources.forEach((copy, key) => {
    const override = getOverride(copy.source, copy.prefix);
    const definition = definitions.get(key);
    if (!override || !definition) return;
    const params = definition.kind === "Operator" ? definition.params : [];
    const alias = createLocalAlias(
      key,
      override.key,
      params,
      params.slice(override.prefix),
      definition.location,
    );
    definitions.set(key, alias);
    linkedRoot.visible.forEach((symbol, name) => {
      if (symbol.key === key && name !== key) definitions.set(name, alias);
    });
  });
  const unassigned = declaredConstants.filter(
    (name) => !constants.has(name) && !substitutions.has(name) && !operatorKeys.has(name),
  );
  if (unassigned.length > 0 && !options.isUnconfigured) {
    const name =
      getTlcDeclarationOrder(options.source, options.loadModule, "constant").find((constant) =>
        unassigned.includes(constant),
      ) ?? unassigned[0];
    throw new TlaConfigError(
      `The constant parameter ${name} is not assigned a value by the configuration file.`,
    );
  }

  if (options.isTraceRecorded) {
    builtins.forEach((builtin, name) => {
      const replacement = getTraceSpecArithmetic(builtin);
      if (replacement) builtins.set(name, replacement);
    });
  }

  const environment: Environment = {
    runtime,
    definitions,
    builtins,
    constants,
    substitutions,
    instanceNames,
    variables,
    variableIndex: getVariableIndex(
      variables,
      linkedList.flatMap((linked) => linked.module.variables.map((variable) => variable.name)),
    ),
    definitionValues: new Map(),
    constantLevels: new Map(),
    substitutedDefinitions,
    evaluators: new WeakMap(),
  };
  checkInstances(instanceChecks, (name) => {
    const linked = linkedModules.get(name) ?? nestedModules.get(name) ?? linkedRoot;
    return {
      constants: linked.constants,
      variables: linked.variables,
      definitions: [
        ...new Set(
          [...linked.visible.values()].flatMap((symbol) => definitions.get(symbol.key) ?? []),
        ),
      ],
      assumptions: linked.module.assumptions.map((assumption) => assumption.expression),
      getDefinition: (symbol) => definitions.get(linked.visible.get(symbol)?.key ?? symbol),
    };
  });
  // TLC evaluates a substitute at startup and rejects it only when that fails and the level bound it
  // computes is above constant. The bound counts the operators that TLC's Java code overrides with
  // a minimum level as state-level, so the analyzer takes them for variables.
  const analyzer = createLevelAnalyzer({
    constants: new Set(constants.keys()),
    variables: new Set([
      ...variables,
      ...["TLCGet", "Trace", "CounterExample"].filter((name) => builtins.has(name)),
    ]),
    getDefinition: (name) => getDefinition(name, environment),
  });
  const getEvaluationError = (body: Expression) => {
    try {
      evaluate(body, { environment, scope: undefined, state: undefined, next: undefined });
      return undefined;
    } catch (error) {
      if (error instanceof TlaEvaluationError) return error;
      throw error;
    }
  };
  substitutions.forEach((target, name) => {
    const definition = definitions.get(target);
    const error =
      declaredConstants.includes(name) &&
      definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      analyzer.analyzeDefinition(definition, new Map()).level > 0
        ? getEvaluationError(definition.body)
        : undefined;
    if (error) {
      // TLC's SpecProcessor adds the message of a TLCRuntimeException, not of an EvalException.
      const addendum = isEvalException(error) ? "" : ` - specifically: ${error.message}`;
      throw new TlaConfigError(
        `The configuration file substitutes constant ${name} with non-constant ${target}${addendum}`,
      );
    }
  });
  // TLC 1.7.4 processes the whole spec before it creates its model checker, which TLCGet reads.
  if (runtime.version !== "1.7.4") runtime.isStarted = true;
  // TLC computes the constant definitions of each module in the order SANY finishes the modules,
  // except those of a module that an INSTANCE gives parameters to.
  const instantiated = new Set(
    linkedList.flatMap((linked) => linked.module.instances.map((instance) => instance.module)),
  );
  const getDefinitionOrder = createTlcDefinitionOrder(options.source, options.loadModule);
  return {
    environment,
    assumptions,
    variableLocations: linkedRoot.variableLocations,
    instanceActions,
    startupDefinitions: linkedList
      .filter(
        (linked) => !instantiated.has(linked.module.name) || getDeclarations(linked).length === 0,
      )
      .flatMap((linked) =>
        getDefinitionOrder(linked === linkedRoot ? undefined : linked.module.name).flatMap(
          (name) => {
            const definition = definitions.get(linked.visible.get(name)?.key ?? name);
            return definition ? [definition] : [];
          },
        ),
      ),
    rootConstants: linkedRoot.constants,
    rootSymbols: linkedRoot.visible,
    javaOverrides: linkedList.flatMap((linked) => javaOverrides.get(linked.module.name) ?? []),
  };
};

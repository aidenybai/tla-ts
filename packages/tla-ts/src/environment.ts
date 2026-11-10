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
import type { ModuleOperator } from "./check";
import type { ConfigValue, ModelConfig } from "./config";
import type { FileSystem } from "./json";
import {
  createSanyError,
  createMissingModuleError,
  formatRange,
  formatSanyWarnings,
  TlaConfigError,
  TlaEvaluationError,
  TlaFeatureUnsupportedError,
  TlaModuleError,
  TlaSyntaxError,
  UNEXPECTED_EXCEPTION,
  type SanyError,
} from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  bindOperatorArguments,
  createBigNumberError,
  createRealNumberError,
  evaluate,
  getDefinition,
  type Builtin,
  type BuiltinArgument,
  type Closure,
  type Context,
  type Environment,
} from "./evaluate";
import {
  createInstantiation,
  createLocalArguments,
  createLocalIdentifier,
  getEnabledVariableName,
  renameLocals,
  withLetInstances,
} from "./instances";
import { overrideDefinitions, type JavaOverride } from "./java-overrides";
import { extractModule } from "./parser";
import {
  getArity,
  getParamArities,
  isBefore,
  isTheoremDefinition,
  KEY_SEPARATOR,
  LOCAL_RESOLUTION,
  MODULE_START,
  resolveModule,
  resolveSubstitutions,
  type ModuleReport,
  type ModuleSymbol,
  type ModuleUnit,
  type SymbolKind,
  type Symbols,
} from "./resolve";
import { createRuntime } from "./runtime";
import { getSanyStandardModules } from "./sany/modules";
import { getSanyParseError } from "./sany/parse-error";
import {
  CORE_OPERATORS,
  getJavaOverrides,
  getStandardModule,
  getTraceSpecArithmetic,
  STANDARD_DEPENDENCIES,
} from "./standard-modules";
import { getStandardRange, STANDARD_LEVELS } from "./standard-definitions";
import { resolveInstanceSubexpressions, resolveModuleSubexpressions } from "./subexpressions";
import { checkModuleLevels, createLevelAnalyzer } from "./levels";
import { createInstanceChecker, type InstanceCheck } from "./substitution-levels";
import { isEvalException } from "./tlc/messages";
import { createDefinitionFacts } from "./dependencies";
import { createTlcOrder, type TlcOrder } from "./tlc/order";
import {
  isTlcInteger,
  createModelValue,
  formatValue,
  valuesEqual,
  toFiniteSet,
  type Value,
  markNormalized,
} from "./values";
import type { TlcVersion } from "./tlc/version";

interface EnvironmentOptions {
  source: string;
  loadModule: ((name: string) => string | undefined) | undefined;
  order?: TlcOrder;
  loadClass?: (name: string) => Uint8Array | undefined;
  print: (text: string) => void;
  files: FileSystem;
  seed?: bigint;
  // Links the modules without a model, as SANY does, so a declared constant needs no value.
  isUnconfigured?: boolean;
  isTool?: boolean;
  // TLC loads Integers for a trace exploration spec, whose methods then compute Naturals.
  traceFile?: string;
  isSanyReported?: boolean;
  isWarningEnabled?: boolean;
  version?: TlcVersion;
  moduleOperators?: ModuleOperator[];
}

export interface ResolvedModuleOperator extends ModuleOperator {
  key: string | undefined;
}

export interface Specification {
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
  moduleOperators: ResolvedModuleOperator[];
  rootName: string;
}

export interface InstanceAction {
  name: string;
  location: SourceLocation;
}

// The modules whose Java methods TLC binds through annotations rather than by name alone.
const ANNOTATED_OVERRIDE_MODULES = new Set(["IOUtils", "Json", "TLCExt"]);

const toValue = (value: ConfigValue): Value => {
  switch (value.kind) {
    case "Number":
      // ModelConfig#parseValue lets Integer.parseInt fail on a number too big for TLC, where
      // tla-ts reports it as TLC reports such a number in a module.
      if (!isTlcInteger(value.value)) {
        throw setExitCode(
          new TlaModuleError(`TLC can't handle a number this big.\n${value.value}`),
          EXIT_STATUS.error,
        );
      }
      return value.value;
    case "String":
    case "Boolean":
      return value.value;
    case "ModelValue":
      return createModelValue(value.name);
    case "Set":
      return toFiniteSet({ kind: "MixedSet", elements: value.elements.map(toValue) });
  }
};

// TLC sorts a config set as it starts, and reports a failure as an unexpected RuntimeException.
const toConstantValue = (value: ConfigValue) => {
  try {
    return toValue(value);
  } catch (error) {
    if (
      !(error instanceof TlaEvaluationError) ||
      error instanceof TlaModuleError ||
      error instanceof TlaFeatureUnsupportedError
    ) {
      throw error;
    }
    throw setExitCode(
      new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${error.message}`),
      EXIT_STATUS.error,
    );
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
  facts: Set<string>;
}

// SANY runs the level checks of a module's file only when it reports no error.
interface ModuleScope {
  id: string;
  symbols: Symbols;
  modules: Map<string, LinkedModule>;
  nested: Module[];
  errors: SanyError[];
  warnings: SanyError[];
  levelChecks: (() => void)[];
}

const getDeclarations = (linked: LinkedModule): Declaration[] => [
  ...linked.constants,
  ...linked.variables.map((variable, index) => ({
    name: variable,
    arity: 0,
    location: linked.variableLocations[index],
  })),
];

// A module SANY rejects fails as in TLC: SANY's message, then a fatal error naming the module.
const parseModuleFile = (source: string, name: string, order: TlcOrder) => {
  try {
    return order.parseModule(source);
  } catch (error) {
    if (!(error instanceof TlaSyntaxError)) throw error;
    const parseError = getSanyParseError(source);
    if (parseError === undefined) throw error;
    throw createSanyError(
      [
        {
          location: `In module ${name}`,
          message: `Could not parse module ${name} from file ${name}.tla`,
        },
      ],
      true,
      parseError,
    );
  }
};

const createModuleRedefinedError = (module: Module) =>
  new TlaSyntaxError(
    `Multiply-defined module '${module.name}' at line ${module.location.line}, column ${module.location.column}`,
  );

const getModuleRedefinition = (module: Module, existing: Module): SanyError | undefined =>
  module.location.range &&
  existing.location.range && {
    location: formatRange(module.location.range),
    message: `Multiply-defined module '${module.name}': this definition or declaration conflicts \nwith the one at ${formatRange(existing.location.range)}.`,
  };

// SANY names a definition or a parameter a definition, and any other symbol a declaration.
const getNodeWord = (kind: SymbolKind) =>
  ["Builtin", "Definition", "Instance", "Parameter"].includes(kind) ? "definition" : "declaration";

const getNodeClass = (kind: SymbolKind) =>
  kind === "Theorem" ? "ThmOrAssumpDefNode" : getNodeWord(kind);

const createLocalFunction = (definition: Definition, key: string): Definition => ({
  kind: "Operator",
  name: key,
  params: [],
  body: {
    kind: "Let",
    definitions: [definition],
    body: createLocalIdentifier(definition.name, definition.location),
    location: definition.location,
  },
  isLocal: true,
  isRecursive: false,
  location: definition.location,
});

const createOperatorTable = (name: string, arity: number, rows: [Value[], Value][]): Builtin => {
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
  const order = options.order ?? createTlcOrder(options.source, options.loadModule);
  const root = order.parseModule(options.source);
  const definitions = new Map<string, Definition>();
  const parameterized = new Map<string, boolean>();
  const copySources = new Map<string, { source: string; prefix: number }>();
  const substitutedDefinitions = new Set<Definition>();
  const instanceParams = new Set<OperatorParam>();
  const builtins = new Map<string, Builtin>(
    CORE_OPERATORS.map((operator) => [operator.name, operator]),
  );
  const standardExports = new Map<string, Symbols>();
  const runtime = createRuntime(config.checkDeadlock, options.seed);
  runtime.isWarningEnabled = options.isWarningEnabled ?? true;
  runtime.isTool = options.isTool ?? false;
  runtime.version = options.version ?? "master";
  const linkedModules = new Map<string, LinkedModule>();
  // From the time its level checks run.
  const checkedModules = new Map<string, LinkedModule>();
  const linkOrder: LinkedModule[] = [];
  const dependencies = new Map<string, Set<string>>();
  const loading: Set<string>[] = [];
  // To report a cycle of EXTENDS or INSTANCE.
  const linking: string[] = [];

  const useModule = (name: string, used: Iterable<string>) =>
    loading.forEach((closure) => {
      closure.add(name);
      [...used].forEach((dependency) => closure.add(dependency));
    });
  const copyCount = { value: 0 };
  const createName = (name: string) => `${name}#${copyCount.value++}`;
  const instanceChecks: InstanceCheck[] = [];
  const warnings: SanyError[] = [];
  const checkInstance = createInstanceChecker((name) => {
    const linked = checkedModules.get(name) ?? getLinkedModule(name, name);
    return {
      constants: linked.constants,
      variables: linked.variables,
      definitions: [
        ...new Set(
          [...linked.visible.values()].flatMap((symbol) => definitions.get(symbol.key) ?? []),
        ),
      ],
      assumptions: linked.module.assumptions.map((assumption) => assumption.expression),
      theorems: linked.module.theorems,
      getDefinition: (symbol) => definitions.get(linked.visible.get(symbol)?.key ?? symbol),
    };
  });
  const instanceActions = new Map<string, InstanceAction>();
  const instanceNames = new Map<string, string>();
  const qualifiedNames = new Map<string, string>();

  const addStandardModule = (name: string): Symbols | undefined => {
    const cached = standardExports.get(name);
    if (cached) return cached;
    const standardModule = getStandardModule(name, options.print, runtime, options.files, builtins);
    if (!standardModule) return undefined;
    // The Java methods of a standard module's dependencies replace operators too, as Integers' do.
    STANDARD_DEPENDENCIES.get(name)?.forEach(addStandardModule);
    const exported: Symbols = new Map();
    standardModule.extends.forEach((extended) =>
      addStandardModule(extended)?.forEach((symbol, symbolName) =>
        exported.set(symbolName, symbol),
      ),
    );
    standardModule.operators.forEach((operator) => {
      builtins.set(operator.name, operator);
      exported.set(operator.name, {
        key: operator.name,
        arity: operator.arity,
        params: STANDARD_LEVELS.get(operator.name)?.formals.map((formal) => formal.arity),
        kind: "Definition",
        range: getStandardRange(name, operator.name) ?? exported.get(operator.name)?.range,
      });
    });
    standardExports.set(name, exported);
    return exported;
  };

  const getStandardSymbols = (name: string) => {
    const dependencies = STANDARD_DEPENDENCIES.get(name) ?? [];
    // SANY reads a user's module before a standard one, so a standard module using it is linked.
    // TLCExt defines AssertEq and TLCGetAndSet in TLA+, so it is linked from its source too.
    if (
      name === "TLCExt" ||
      [name, ...dependencies].some((module) => options.loadModule?.(module) !== undefined)
    )
      return undefined;
    const symbols = addStandardModule(name);
    if (symbols) useModule(name, dependencies);
    // TLC loads each dependency's Java class, so using Integers overrides Naturals' arithmetic.
    if (symbols && dependencies.includes("Integers")) addStandardModule("Integers");
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
      getSanyStandardModules(runtime.version).get(name) ??
      extractModule(options.source, name);
    if (source === undefined) throw createMissingModuleError(name, importer);
    const module = parseModuleFile(source, name, order);
    if (module.name !== name) {
      throw createSanyError(
        [
          {
            location: "Unknown location",
            message: `File name '${name}' does not match the name '${module.name}' of the top level module it contains.`,
          },
        ],
        true,
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
    const errors: SanyError[] = [];
    const levelChecks: (() => void)[] = [];
    linking.push(parsed.name);
    loading.push(closure);
    const linked = linkModule(parsed, {
      id: parsed.name,
      symbols: new Map(),
      modules: new Map(),
      nested,
      errors,
      warnings,
      levelChecks,
    });
    loading.pop();
    linking.pop();
    if (errors.length > 0) throw createSanyError(errors, false, undefined, warnings);
    const duplicate = nested.find((module) => closure.has(module.name));
    const loaded = duplicate && linkedModules.get(duplicate.name);
    const redefinition = loaded && getModuleRedefinition(duplicate, loaded.module);
    if (redefinition) throw createSanyError([redefinition], false, undefined, warnings);
    if (duplicate) throw createModuleRedefinedError(duplicate);
    levelChecks.forEach((check) => check());
    return { linked, closure };
  };

  const getLinkedModule = (name: string, importer: string): LinkedModule => {
    const cached = linkedModules.get(name);
    if (cached) {
      useModule(name, dependencies.get(name) ?? []);
      return cached;
    }
    const top = linkTopLevel(loadModule(name, importer));
    const replaced = new Map<string, Definition>();
    const evaluateReplaced = (
      operator: string,
      args: BuiltinArgument[],
      context: Context | undefined,
    ) => {
      const definition = replaced.get(operator);
      const expressions = args.flatMap((arg) =>
        typeof arg === "object" && arg.kind === "Operator" && arg.expression
          ? [arg.expression]
          : [],
      );
      if (definition?.kind !== "Operator" || !context || expressions.length !== args.length) {
        throw new TlaEvaluationError(`No definition of ${operator} to fall back to`);
      }
      const closure: Closure = {
        kind: "Closure",
        name: definition.name,
        params: definition.params,
        body: definition.body,
        scope: undefined,
      };
      return evaluate(definition.body, {
        environment: context.environment,
        scope: bindOperatorArguments(closure, expressions, context),
        state: context.state,
        next: context.next,
        isKeepLazy: context.isKeepLazy,
      });
    };
    // TLC replaces only the definitions that have Java methods, so a user's Bags.tla keeps the
    // rest.
    getJavaOverrides(
      name,
      options.print,
      runtime,
      options.files,
      builtins,
      evaluateReplaced,
    )?.forEach((operator) => {
      const symbol = top.linked.visible.get(operator.name);
      if (symbol?.kind !== "Definition") return;
      if (symbol.arity !== operator.arity && ANNOTATED_OVERRIDE_MODULES.has(name)) return;
      const definition = definitions.get(symbol.key);
      if (definition) replaced.set(operator.name, definition);
      builtins.set(symbol.key, operator);
      definitions.delete(symbol.key);
    });
    linkedModules.set(name, top.linked);
    dependencies.set(name, top.closure);
    useModule(name, top.closure);
    return top.linked;
  };

  const instantiate = (
    instance: Instance,
    module: Module,
    unit: ModuleUnit,
    isParameterFree: boolean,
    nested: LinkedModule | undefined,
  ): Symbols => {
    const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
    if (standardSymbols) return getStandardInstanceSymbols(instance, standardSymbols);
    const linked = nested ?? getLinkedModule(instance.module, module.name);
    linked.facts.forEach((name) =>
      unit.facts.add(instance.name === undefined ? name : `${instance.name}!${name}`),
    );
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
    const params = instance.params.map((param) => ({ ...param, name: `${param.name}${suffix}` }));
    params.forEach((param) => instanceParams.add(param));
    const substitutionRange = instance.definitionRange
      ? {
          ...instance.definitionRange,
          start: { line: instance.location.line, column: instance.location.column },
        }
      : instance.instanceRange;
    const instantiation = createInstantiation({
      params,
      substitutions: new Map(
        [...substitutions].map(([name, expression]) => [name, renameLocals(expression, renamed)]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      getOuterDefinition: (name) =>
        module.definitions.find((definition) => definition.name === name),
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
      ...(declarations.length > 0 && {
        frame: {
          kind: "Identifier",
          name: instance.name ?? instance.module,
          location: { ...substitutionRange.start, range: substitutionRange },
        },
      }),
    });
    return getInstanceSymbols(instance, linked.exported, declarations, (key, name) => {
      const copy =
        instance.name === undefined
          ? instantiation.getKey(key)
          : instantiation.getQualifiedKey(key);
      if (declarations.length > 0) instanceActions.set(copy, { name, location: instance.location });
      if (instance.name !== undefined) qualifiedNames.set(copy, name);
      return copy;
    });
  };

  const getStandardInstanceSymbols = (instance: Instance, standardSymbols: Symbols): Symbols =>
    instance.name === undefined
      ? standardSymbols
      : new Map(
          [...standardSymbols].map(([name, symbol]) => [
            `${instance.name}!${name}`,
            { key: symbol.key, arity: symbol.arity, params: symbol.params, kind: symbol.kind },
          ]),
        );

  // SANY binds a copy of a definition that depends on the parameters at the INSTANCE.
  const getInstanceSymbols = (
    instance: Instance,
    exported: Symbols,
    declarations: Declaration[],
    getKey: (key: string, name: string) => string,
  ): Symbols => {
    const declared = new Set(declarations.map((declaration) => declaration.name));
    return new Map(
      [...exported]
        .filter(([name]) => !declared.has(name))
        .map(([name, symbol]): [string, ModuleSymbol] => {
          if (instance.name === undefined) {
            return [
              name,
              {
                key: getKey(symbol.key, name),
                arity: symbol.arity,
                params: symbol.params,
                kind: symbol.kind,
                range:
                  parameterized.get(symbol.key) === true ? instance.location.range : symbol.range,
              },
            ];
          }
          const qualified = `${instance.name}!${name}`;
          return [
            qualified,
            {
              key: getKey(symbol.key, qualified),
              arity: symbol.arity + instance.params.length,
              params: symbol.params && [
                ...instance.params.map((param) => param.arity),
                ...symbol.params,
              ],
              kind: symbol.kind,
            },
          ];
        }),
    );
  };

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
        : {
            kind: "Apply",
            operator: key,
            args: createLocalArguments(forwarded, location),
            location,
          },
    isLocal: true,
    isRecursive: false,
    location,
  });

  const createArgumentParams = (arity: number) =>
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
    const params = createArgumentParams(declaration.arity);
    const operator =
      replacement.kind === "Identifier"
        ? replacement.name
        : replacement.kind === "OperatorReference"
          ? replacement.operator
          : declaration.name;
    return {
      params,
      body: { kind: "Apply", operator, args: createLocalArguments(params, location), location },
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
        const forwarded = createArgumentParams(symbol.arity);
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
    const explicitSubstitutions = new Map(
      instance.substitutions.map((item) => [item.name, item.expression]),
    );
    const declarations = getDeclarations(linked);
    const getReplacement = (declaration: OperatorParam): Expression =>
      explicitSubstitutions.get(declaration.name) ?? {
        kind: "Identifier",
        name: declaration.name,
        location,
      };
    instanceChecks.push({
      module: instance.module,
      instancer,
      lets,
      substitutions: new Map(
        declarations.map((declaration) => [declaration.name, getReplacement(declaration)]),
      ),
      location,
    });
    const instanceParamNames = new Set(instance.params.map((param) => param.name));
    const isParameterDependent = (declaration: OperatorParam) =>
      mentionsName(getReplacement(declaration), instanceParamNames);
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
            ? createLocalIdentifier(`${declaration.name}${suffix}`, location)
            : {
                kind: "Apply",
                operator: `${declaration.name}${suffix}`,
                args: createLocalArguments(instance.params, location),
                location,
                resolution: LOCAL_RESOLUTION,
              },
        ]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      // Each substitution is a local definition, which the copies read by name.
      getOuterDefinition: () => undefined,
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
        const ownParams = createArgumentParams(symbol.arity);
        const params = [...instance.params, ...ownParams];
        return createLocalAlias(
          instance.name === undefined ? name : `${instance.name}!${name}`,
          key,
          params,
          key === symbol.key ? ownParams : params,
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
    const firstCheck = instanceChecks.length;
    const visible: Symbols = new Map([
      ...CORE_OPERATORS.map((operator): [string, ModuleSymbol] => [
        operator.name,
        { key: operator.name, arity: operator.arity, kind: "Builtin" },
      ]),
      ...scope.symbols,
    ]);
    const importedAt = new Map<string, SourceLocation>();
    const extendsReport: ModuleReport = { location: MODULE_START, errors: [], warnings: [] };
    const reports = [extendsReport];
    // SANY keeps the first symbol of a name the extended modules share, warns of two definitions
    // or two declarations, and rejects a definition and a declaration.
    const mergeExtended = (symbols: Symbols) =>
      symbols.forEach((symbol, name) => {
        const current = exported.get(name);
        if (!current) {
          visible.set(name, symbol);
          exported.set(name, symbol);
          return;
        }
        if (
          !current.range ||
          !symbol.range ||
          formatRange(current.range) === formatRange(symbol.range)
        ) {
          return;
        }
        const location = formatRange(symbol.range);
        const existing = formatRange(current.range);
        if (getNodeClass(current.kind) === getNodeClass(symbol.kind)) {
          extendsReport.warnings.push({
            location,
            message: `Warning: the ${getNodeWord(current.kind)} of '${name}' conflicts with \nits ${getNodeWord(current.kind)} at ${existing}.`,
          });
          return;
        }
        extendsReport.errors.push({
          location,
          message: `The ${getNodeWord(symbol.kind)} of '${name}' conflicts with \nits ${getNodeWord(current.kind)} at ${existing}.`,
        });
      });
    const exported: Symbols = new Map();
    const facts = new Set<string>();
    const modules = new Map<string, LinkedModule>();
    const extended: LinkedModule[] = [];
    const constants = [...parsed.constants];
    const declaredVariables = parsed.variables.filter(
      (variable, index) =>
        parsed.variables.findIndex((other) => other.name === variable.name) === index,
    );
    const variables = declaredVariables.map((variable) => variable.name);
    const variableLocations = declaredVariables.map((variable) => variable.location);
    parsed.extends.forEach((name) => {
      const nested = scope.modules.get(name);
      const standardSymbols = nested ? undefined : getStandardSymbols(name);
      if (standardSymbols) {
        mergeExtended(standardSymbols);
        return;
      }
      const linked = nested ?? getLinkedModule(name, parsed.name);
      constants.push(
        ...linked.constants.filter(
          (constant) =>
            constants.every((existing) => existing.name !== constant.name) &&
            !variables.includes(constant.name),
        ),
      );
      linked.variables.forEach((variable, index) => {
        const isDeclared =
          variables.includes(variable) || constants.some((constant) => constant.name === variable);
        if (isDeclared) return;
        variables.push(variable);
        variableLocations.push(linked.variableLocations[index]);
      });
      mergeExtended(linked.exported);
      linked.facts.forEach((name) => facts.add(name));
      linked.modules.forEach((module, moduleName) => modules.set(moduleName, module));
      extended.push(linked);
    });
    const bound = new Map(visible);
    const declarations = [
      ...parsed.constants.map((constant) => ({ ...constant, kind: "Constant" as const })),
      ...parsed.variables.map((variable) => ({ ...variable, kind: "Variable" as const })),
    ];
    const getDeclarationSymbol = (declaration: (typeof declarations)[number]): ModuleSymbol => ({
      key: declaration.name,
      arity: declaration.arity,
      kind: declaration.kind,
      range: declaration.location.range,
    });
    declarations.forEach((declaration) =>
      exported.set(declaration.name, getDeclarationSymbol(declaration)),
    );
    const getDefinitionSymbol = (definition: Definition): ModuleSymbol => ({
      key: getKey(definition),
      arity: getArity(definition),
      params: getParamArities(definition),
      kind: isTheoremDefinition(parsed, definition) ? "Theorem" : "Definition",
      range: definition.location.range,
    });
    const isParameterFree = constants.length === 0 && variables.length === 0;
    const getKey = (definition: Definition) =>
      parsed === root ? definition.name : `${definition.name}${KEY_SEPARATOR}${scope.id}`;
    const instanced = new Map<Instance, Symbols>();
    const getVisibleModules = () => new Map([...scope.modules, ...modules]);
    const getLetModule = (instance: Instance) => {
      const ownModule = parsed.modules.find((nested) => nested.name === instance.module);
      if (!ownModule) return getVisibleModules().get(instance.module);
      return isBefore(ownModule.location, instance.location)
        ? modules.get(ownModule.name)
        : undefined;
    };
    const getUnit = (module: Module): ModuleUnit => ({
      imported: visible,
      getInstance: (instance) => {
        const nested = getLetModule(instance);
        const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
        if (standardSymbols) {
          return {
            declarations: [],
            symbols: getStandardInstanceSymbols(instance, standardSymbols),
            instancer: parsed.name,
          };
        }
        const linked = nested ?? getLinkedModule(instance.module, parsed.name);
        const declarations = getDeclarations(linked);
        return {
          declarations,
          symbols: getInstanceSymbols(instance, linked.exported, declarations, (key) => key),
          instancer: parsed.name,
        };
      },
      bound,
      // SANY keeps the first of two definitions of a name.
      definitions: new Map(
        module.definitions.toReversed().map((definition) => [definition.name, definition]),
      ),
      getKey,
      instanced,
      facts,
      reports,
      warnings: scope.warnings,
    });
    // SANY keeps the first of two symbols of a name.
    const getSymbolsBefore = (location: SourceLocation): Symbols =>
      [
        ...declarations
          .filter((declaration) => isBefore(declaration.location, location))
          .map((declaration): [string, ModuleSymbol] => [
            declaration.name,
            getDeclarationSymbol(declaration),
          ]),
        ...parsed.definitions
          .filter((definition) => isBefore(definition.location, location))
          .map((definition): [string, ModuleSymbol] => [
            definition.name,
            getDefinitionSymbol(definition),
          ]),
      ].reduce(
        (symbols, [name, symbol]) => (symbols.has(name) ? symbols : symbols.set(name, symbol)),
        new Map(visible),
      );
    // SANY reports the errors of a nested module and goes on, then reports a module defined twice.
    const linkNested = (nested: Module) => {
      const visibleModules = getVisibleModules();
      const existing = visibleModules.get(nested.name);
      const redefinition = existing && getModuleRedefinition(nested, existing.module);
      if (existing && !redefinition) throw createModuleRedefinedError(nested);
      scope.nested.push(nested);
      const report: ModuleReport = { location: nested.location, errors: [], warnings: [] };
      reports.push(report);
      const linked = linkModule(nested, {
        id: `${scope.id}/${nested.name}`,
        symbols: getSymbolsBefore(nested.location),
        modules: visibleModules,
        nested: scope.nested,
        errors: report.errors,
        warnings: report.warnings,
        levelChecks: scope.levelChecks,
      });
      if (redefinition) report.errors.push(redefinition);
      if (!existing) modules.set(nested.name, linked);
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
          instanced.set(instance, symbols);
          symbols.forEach((symbol, name) => {
            if (visible.has(name)) return;
            importedAt.set(name, instance.location);
            visible.set(name, symbol);
            if (!instance.isLocal) exported.set(name, symbol);
          });
        },
      })),
      ...parsed.modules.map((nested) => ({
        location: nested.location,
        link: () => linkNested(nested),
      })),
    ]
      .sort((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
      .forEach((unit) => unit.link());
    const module = resolveModuleSubexpressions(
      withLetInstances(parsed, (instance, lets) =>
        instantiateLocally(instance, lets, parsed.name, getLetModule(instance)),
      ),
      getAvailableDefinitions(visible),
    );
    scope.errors.push(...resolveModule(module, getUnit(module)));
    module.definitions.forEach((definition) => {
      const key = getKey(definition);
      definitions.set(key, definition);
      parameterized.set(key, !isParameterFree);
      const symbol = getDefinitionSymbol(definition);
      const importedLocation = importedAt.get(definition.name);
      // SANY binds the name of a fact to a fact the module imports before it.
      if (
        symbol.kind === "Theorem" &&
        visible.get(definition.name)?.kind === "Theorem" &&
        (importedLocation === undefined || isBefore(importedLocation, definition.location))
      ) {
        return;
      }
      visible.set(definition.name, symbol);
      if (!definition.isLocal) exported.set(definition.name, symbol);
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
      facts: new Set([
        ...facts,
        ...[...module.theorems, ...module.assumptions].flatMap((fact) => fact.name ?? []),
      ]),
    };
    if (!checkedModules.has(parsed.name)) checkedModules.set(parsed.name, linked);
    // SANY checks instances with definitions and theorems, so it reports their errors together.
    const checks = instanceChecks
      .splice(firstCheck)
      .map((check) => ({ location: check.location, check: () => checkInstance(check) }));
    scope.levelChecks.push(() =>
      checkModuleLevels(
        module,
        {
          constants: new Set(constants.map((constant) => constant.name)),
          variables: new Set(variables),
          getDefinition: (symbol) => definitions.get(visible.get(symbol)?.key ?? symbol),
          getQualifiedName: (symbol) => qualifiedNames.get(visible.get(symbol)?.key ?? symbol),
        },
        checks,
        warnings,
      ),
    );
    linkOrder.push(linked);
    return linked;
  };

  const linkedRoot = linkTopLevel(root).linked;
  const traceFile = options.traceFile;
  // TLC records the binary trace of a trace exploration spec with a postcondition it adds last.
  const traceOperators: ModuleOperator[] =
    traceFile === undefined
      ? []
      : [
          {
            kind: "postcondition",
            module: "_TLCTrace",
            operator: "_TLCTraceSilent",
            constants: { _TLCTraceFile: traceFile },
          },
        ];
  // SANY reads these modules as extendees of the root, so TLC finishes them before the root.
  const moduleOperators = [...(options.moduleOperators ?? []), ...traceOperators].map(
    (operator): ResolvedModuleOperator => {
      const symbol = getLinkedModule(operator.module, root.name).visible.get(operator.operator);
      return { ...operator, key: symbol?.kind === "Definition" ? symbol.key : undefined };
    },
  );
  linkOrder.push(...linkOrder.splice(linkOrder.indexOf(linkedRoot), 1));
  if (warnings.length > 0 && !options.isSanyReported) options.print(formatSanyWarnings(warnings));
  const getRootKey = (name: string) => linkedRoot.visible.get(name)?.key ?? name;
  linkedRoot.visible.forEach((symbol, name) => {
    const definition = definitions.get(symbol.key);
    if (definition && symbol.key !== name) definitions.set(name, definition);
  });
  // TLC adds a constraint or a view it names on the command line to the root's definitions.
  moduleOperators.forEach((operator) => {
    const definition = operator.key === undefined ? undefined : definitions.get(operator.key);
    if (operator.kind !== "postcondition" && definition) {
      definitions.set(operator.operator, definition);
    }
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

  const moduleSymbols = new Map([
    ...standardExports,
    ...[...linkedModules].map(([name, linked]): [string, Symbols] => [name, linked.visible]),
    [root.name, linkedRoot.visible],
  ]);
  const getScopedSymbol = (item: { name: string; module?: string }) => {
    const symbol = moduleSymbols.get(item.module ?? "")?.get(item.name);
    return symbol?.kind === "Definition" ? symbol : undefined;
  };
  const getSubstitutedKeys = (item: { name: string; module?: string }) => {
    if (item.module === undefined) return [item.name, getRootKey(item.name)];
    const symbol = getScopedSymbol(item);
    return symbol ? [symbol.key] : [];
  };
  // TLC ignores a scoped value for a definition of the root module, though not a scoped override.
  const getScopedKeys = (item: { name: string; module?: string }) =>
    item.module === root.name ? [] : getSubstitutedKeys(item);
  const getKeyArity = (key: string) => {
    const definition = definitions.get(key);
    return definition?.kind === "Operator"
      ? definition.params.length
      : (linkedRoot.constants.find((constant) => constant.name === key)?.arity ??
          builtins.get(key)?.arity ??
          0);
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
      const value = toConstantValue(assignment.value);
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
      setOperator(key, createOperatorTable(table.name, getKeyArity(key), table.rows)),
    ),
  );
  const substitutions = new Map(
    config.substitutions.flatMap((substitution) =>
      getSubstitutedKeys(substitution).map((key): [string, string] => [
        key,
        getRootKey(substitution.target),
      ]),
    ),
  );
  [...substitutions.keys()].forEach((key) => constants.delete(key));
  const checkSubstitutionTarget = (name: string, target: string, arity: number | undefined) => {
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
    if (definition?.kind === "Operator" && definition.params.length !== arity) {
      throw new TlaConfigError(
        `The configuration file substitutes for ${name} with ${target} of different number of arguments.`,
      );
    }
  };
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
      checkSubstitutionTarget(
        name,
        target,
        linkedRoot.constants.find((constant) => constant.name === name)?.arity ??
          linkedRoot.visible.get(name)?.arity,
      );
    });
  // TLC replaces only the definitions of a named module, with definitions of the root module.
  const scopedSubstitutions = config.substitutions.filter(
    (substitution) => substitution.module !== undefined,
  );
  [...moduleSymbols.keys()].forEach((name) => {
    const inModule = scopedSubstitutions.filter((substitution) => substitution.module === name);
    inModule.forEach((substitution) => {
      const symbol = getScopedSymbol(substitution);
      if (!symbol) return;
      if (inModule.some((other) => other.name === substitution.target)) {
        throw new TlaConfigError(
          `In the configuration file, the identifier ${substitution.target} appears\non the right-hand side of a <- after already appearing on the\nleft-hand side of one.`,
        );
      }
      checkSubstitutionTarget(substitution.name, substitution.target, symbol.arity);
    });
    const missing = inModule.find((substitution) => !getScopedSymbol(substitution));
    if (missing) {
      throw new TlaConfigError(
        `In the configuration file, the identifier ${missing.name} does not appear in the specification.`,
      );
    }
  });
  const unknownModule = scopedSubstitutions.find(
    (substitution) => !moduleSymbols.has(substitution.module ?? ""),
  );
  if (unknownModule) {
    throw new TlaConfigError(
      `In the configuration file, the module name ${unknownModule.module} is not a module in the specification.`,
    );
  }
  // TLC sets a module-scoped entry on the definition's body, which every instance shares.
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
  moduleOperators.forEach((operator) =>
    getLinkedModule(operator.module, root.name).constants.forEach((constant) => {
      const value = operator.constants?.[constant.name];
      if (value !== undefined) constants.set(constant.name, value);
    }),
  );
  const unassigned = declaredConstants.filter(
    (name) => !constants.has(name) && !substitutions.has(name) && !operatorKeys.has(name),
  );
  if (unassigned.length > 0 && !options.isUnconfigured) {
    // TLC reports the first constant it finds unassigned in SANY's order of declarations.
    const name =
      order.getDeclarationOrder("constant").find((constant) => unassigned.includes(constant)) ??
      unassigned[0];
    throw new TlaConfigError(
      `The constant parameter ${name} is not assigned a value by the configuration file.`,
    );
  }

  if (options.traceFile !== undefined) {
    builtins.forEach((builtin, name) => {
      const replacement = getTraceSpecArithmetic(builtin);
      if (replacement) builtins.set(name, replacement);
    });
  }

  const variableIndex = getVariableIndex(
    variables,
    linkOrder.flatMap((linked) => linked.module.variables.map((variable) => variable.name)),
  );
  const facts = createDefinitionFacts({
    definitions,
    substitutions,
    constants,
    variableIndex,
    builtins,
    variables,
  });
  const environment: Environment = {
    runtime,
    definitions,
    builtins,
    constants,
    substitutions,
    instanceNames,
    variables,
    variableIndex,
    facts,
    startupValues: Array.from({ length: facts.ids.size }, (): Value | undefined => undefined),
    substitutedDefinitions,
    instanceParams,
    evaluators: new WeakMap(),
    entryEvaluators: new WeakMap(),
    definitionEvaluators: new WeakMap(),
  };
  // TLC rejects a substitute only when evaluating it at startup fails and its level bound is
  // above constant. TLC's Java overrides with a minimum level count as variables.
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
  // TLC computes constant definitions in the order SANY finishes modules, except instantiated ones.
  const instantiated = new Set(
    linkOrder.flatMap((linked) => linked.module.instances.map((instance) => instance.module)),
  );
  const getDefinitionOrder = order.createDefinitionOrder();
  return {
    environment,
    assumptions,
    variableLocations: linkedRoot.variableLocations,
    instanceActions,
    startupDefinitions: linkOrder
      .filter(
        (linked) => !instantiated.has(linked.module.name) || getDeclarations(linked).length === 0,
      )
      .flatMap((linked) =>
        getDefinitionOrder(linked === linkedRoot ? undefined : linked.module.name).flatMap(
          (name) => {
            const definition = definitions.get(linked.visible.get(name)?.key ?? name);
            // TLC doesn't compute the copy of a definition from a module instantiated with
            // substitutions.
            return definition ? [definition] : [];
          },
        ),
      ),
    rootConstants: linkedRoot.constants,
    rootSymbols: linkedRoot.visible,
    javaOverrides: linkOrder.flatMap((linked) => javaOverrides.get(linked.module.name) ?? []),
    moduleOperators,
    rootName: root.name,
  };
};

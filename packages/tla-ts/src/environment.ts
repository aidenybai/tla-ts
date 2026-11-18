import {
  getChildren,
  getDefinitionExpressions,
  getReferencedName,
  type Assumption,
  type Declaration,
  type Definition,
  type Expression,
  type FunctionDefinition,
  type Instance,
  type Module,
  type OperatorParam,
  type Proof,
  type SourceLocation,
  type SourceRange,
} from "./ast";
import type { ModuleOperator } from "./check";
import type { ModelConfig } from "./config";
import { applyConfig, type CopySource } from "./environment-config";
import type { FileSystem } from "./json";
import {
  createSanyError,
  createMissingModuleError,
  formatRange,
  formatSanyWarnings,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
  type SanyError,
} from "./errors";
import {
  bindOperatorArguments,
  createBigNumberError,
  createRealNumberError,
  evaluate,
  getDefinition,
  getDefinitionClosure,
  type Builtin,
  type BuiltinArgument,
  type Context,
  type Environment,
} from "./evaluate";
import {
  createInstantiation,
  createLocalAlias,
  createLocalArguments,
  createLocalIdentifier,
  frameSubstitutions,
  getEnabledVariableName,
  getLetInstanceExpansion,
  getOperatorDefinition,
  renameLocals,
  substitutedExpressions,
  withInstanceParams,
  withSubstitutionFrames,
  type Substitution,
} from "./instances";
import { overrideDefinitions, type JavaOverride } from "./java-overrides";
import { extractModule } from "./parser";
import {
  collectSemanticErrors,
  getArity,
  getFunctionArity,
  getKeyName,
  getParamArities,
  isBefore,
  isSameSanyError,
  isTheoremDefinition,
  isUnresolved,
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
import {
  CORE_OPERATORS,
  getJavaOverrides,
  getStandardOperators,
  getTraceSpecArithmetic,
  STANDARD_DEPENDENCIES,
  STANDARD_EXTENDS,
} from "./standard-modules";
import { getStandardRange, STANDARD_LEVELS } from "./standard-definitions";
import { createModuleSubexpressions, resolveInstanceSubexpressions } from "./subexpressions";
import {
  checkModuleLevels,
  createLevelAnalyzer,
  type InstanceCopy,
  type InstanceLevelCheck,
  type InstanceSubstitutes,
  type LetInstance,
} from "./levels";
import { createInstanceChecker, type KeyedDeclaration } from "./substitution-levels";
import { isEvalException } from "./tlc/messages";
import { createDefinitionFacts } from "./dependencies";
import { createTlcOrder, type TlcOrder } from "./tlc/order";
import { isTlcInteger, type Value } from "./values";
import type { TlcVersion } from "./tlc/version";

interface EnvironmentOptions {
  source: string;
  loadModule: ((name: string) => string | undefined) | undefined;
  order?: TlcOrder;
  loadClass?: (name: string) => Uint8Array | undefined;
  print: (text: string) => void;
  files: FileSystem;
  seed?: bigint;
  isTool?: boolean;
  traceFile?: string;
  isSanyReported?: boolean;
  isWarningEnabled?: boolean;
  version?: TlcVersion;
  moduleOperators?: ModuleOperator[];
  readLine?: () => string | undefined;
  runtimeInvariants?: RuntimeInvariant[];
}

export interface RuntimeInvariant {
  name: string;
  module: string | undefined;
}

export interface ResolvedModuleOperator extends ModuleOperator {
  key: string | undefined;
}

export interface Specification {
  environment: Environment;
  assumptions: Assumption[];
  variableLocations: SourceLocation[];
  instanceActions: Map<string, InstanceAction>;
  startupDefinitions: Definition[];
  javaOverrides: JavaOverride[];
  moduleOperators: ResolvedModuleOperator[];
  runtimeInvariants: RuntimeInvariant[];
  rootName: string;
}

export interface InstanceAction {
  name: string;
  location: SourceLocation;
  head: SourceRange | undefined;
  body: SourceRange | undefined;
}

const ANNOTATED_OVERRIDE_MODULES = new Set(["IOUtils", "Json", "TLCExt"]);

// TLC evaluates the definitions of these modules that it doesn't override, such as Bags' SubBag.
const SOURCE_STANDARD_MODULES = new Set(["Bags", "Randomization", "TLCExt"]);

// SANY's SubstInNode and APSubstInNode word the error for a body they can't substitute in apart.
const SUBSTITUTION_ERRORS = [
  {
    kind: "Definition",
    message: "Substitution error, probably due to error \nin module being instantiated.",
  },
  {
    kind: "Theorem",
    message: "Substitution error, probably due to error in module being instantiated.",
  },
];

export interface LinkedModule {
  module: Module;
  constants: KeyedDeclaration[];
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
  getDefinition: (name: string) => Definition | undefined;
  modules: Map<string, LinkedModule>;
  nested: Module[];
  errors: SanyError[];
  warnings: SanyError[];
  levelChecks: ReturnType<typeof checkModuleLevels>[];
}

const getDeclarations = (linked: LinkedModule): KeyedDeclaration[] => [
  ...linked.constants,
  ...linked.variables.map((variable, index) => ({
    name: variable,
    key: variable,
    arity: 0,
    location: linked.variableLocations[index],
  })),
];

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

const getNodeWord = (kind: SymbolKind) =>
  ["Builtin", "Definition", "Instance", "Parameter"].includes(kind) ? "definition" : "declaration";

const getNodeClass = (kind: SymbolKind) =>
  kind === "Theorem" ? "ThmOrAssumpDefNode" : getNodeWord(kind);

const createLocalFunction = (definition: FunctionDefinition, key: string): Definition => ({
  ...getOperatorDefinition(definition),
  name: key,
  isLocal: true,
});

const getSubstitutionFrame = (instance: Instance): Expression => {
  const range = instance.definitionRange
    ? {
        ...instance.definitionRange,
        start: { line: instance.location.line, column: instance.location.column },
      }
    : instance.instanceRange;
  return {
    kind: "Identifier",
    name: instance.name ?? instance.module,
    location: { ...range.start, range },
  };
};

const mentionsName = (expression: Expression, names: Set<string>): boolean => {
  const name = getReferencedName(expression);
  return (
    (name !== undefined && names.has(name)) ||
    getChildren(expression).some((child) => mentionsName(child, names))
  );
};

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

const getProofInstances = (proof: Proof | undefined): Instance[] =>
  proof?.kind === "Steps"
    ? proof.steps.flatMap((step) => [
        ...(step.body.kind === "Instance" ? [step.body] : []),
        ...(step.body.kind === "Define"
          ? step.body.definitions.flatMap((definition) =>
              definition.kind === "Instance" ? [definition] : [],
            )
          : []),
        ...getProofInstances(step.proof),
      ])
    : [];

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
  const unresolvedBodyKeys = new Set<string>();
  const copySources = new Map<string, CopySource>();
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
  runtime.readLine = options.readLine;
  const linkedModules = new Map<string, LinkedModule>();
  const checkedModules = new Map<string, LinkedModule>();
  const linkOrder: LinkedModule[] = [];
  const dependencies = new Map<string, Set<string>>();
  const loading: Set<string>[] = [];
  const linking: string[] = [];
  const usedModules = new Set<string>();

  const useModule = (name: string, used: Iterable<string>) =>
    [usedModules, ...loading].forEach((closure) => {
      closure.add(name);
      [...used].forEach((dependency) => closure.add(dependency));
    });
  let copyCount = 0;
  const createName = (name: string) => `${name}#${copyCount++}`;
  const instanceChecks: InstanceLevelCheck[] = [];
  const warnings: SanyError[] = [];
  const instanceCopies = new WeakMap<Definition, InstanceCopy>();
  const letInstances = new Map<string, LetInstance>();
  const createInstanceCopy = (
    sourceKey: string,
    module: string,
    substitutes: InstanceSubstitutes,
  ): InstanceCopy | undefined => {
    const source = definitions.get(sourceKey);
    return source && { ...substitutes, source, module };
  };
  const instanceLevels = createInstanceChecker(
    (name) => {
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
    },
    {
      getCopy: (definition) => instanceCopies.get(definition),
      getLetInstance: (instance) =>
        instance.location.range && letInstances.get(formatRange(instance.location.range)),
    },
  );
  const instanceActions = new Map<string, InstanceAction>();
  const instanceNames = new Map<string, string>();
  const qualifiedNames = new Map<string, string>();

  const addStandardModule = (name: string): Symbols | undefined => {
    const cached = standardExports.get(name);
    if (cached) return cached;
    const operators = getStandardOperators(name, options.print, runtime, options.files);
    if (!operators) return undefined;
    STANDARD_DEPENDENCIES.get(name)?.forEach(addStandardModule);
    const exported: Symbols = new Map();
    STANDARD_EXTENDS.get(name)?.forEach((extended) =>
      addStandardModule(extended)?.forEach((symbol, symbolName) =>
        exported.set(symbolName, symbol),
      ),
    );
    operators.forEach((operator) => {
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
    if (
      SOURCE_STANDARD_MODULES.has(name) ||
      [name, ...dependencies].some((module) => options.loadModule?.(module) !== undefined)
    )
      return undefined;
    const symbols = addStandardModule(name);
    if (symbols) useModule(name, dependencies);
    if (symbols && dependencies.includes("Integers")) addStandardModule("Integers");
    return symbols;
  };

  const rejectModuleLiterals = (module: Module): Module => {
    rejectLiterals([
      ...module.definitions.flatMap(getDefinitionExpressions),
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
    const module = order.parseFile(source, name);
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
    const levelChecks: ReturnType<typeof checkModuleLevels>[] = [];
    linking.push(parsed.name);
    loading.push(closure);
    const linked = linkModule(parsed, {
      id: parsed.name,
      symbols: new Map(),
      getDefinition: () => undefined,
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
    // SANY's Errors#addMessage drops a message it already has, such as an instantiated body's.
    const levelErrors = [
      ...collectSemanticErrors(
        levelChecks.flatMap((check) => check.sections),
        warnings,
      ),
      ...levelChecks.flatMap((check) => check.check(check !== levelChecks.at(-1))),
    ].filter(
      (error, index, all) => all.findIndex((other) => isSameSanyError(other, error)) === index,
    );
    if (levelErrors.length > 0) {
      throw createSanyError(
        levelErrors.map((error) => ({ location: error.location, message: error.message })),
        false,
        undefined,
        warnings,
      );
    }
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
      return evaluate(definition.body, {
        environment: context.environment,
        scope: bindOperatorArguments(getDefinitionClosure(definition), expressions, context),
        state: context.state,
        next: context.next,
        isKeepLazy: context.isKeepLazy,
      });
    };
    getJavaOverrides(name, options.print, runtime, options.files, evaluateReplaced)?.forEach(
      (operator) => {
        const symbol = top.linked.visible.get(operator.name);
        if (symbol?.kind !== "Definition") return;
        if (symbol.arity !== operator.arity && ANNOTATED_OVERRIDE_MODULES.has(name)) return;
        const definition = definitions.get(symbol.key);
        if (definition) replaced.set(operator.name, definition);
        builtins.set(symbol.key, operator);
        definitions.delete(symbol.key);
      },
    );
    linkedModules.set(name, top.linked);
    dependencies.set(name, top.closure);
    useModule(name, top.closure);
    return top.linked;
  };

  // SANY infers a substitution for each declaration the instancing module resolves, in the order of the instanced module's symbol table, and appends the others.
  const setFrameSubstitutions = (
    frame: Expression,
    module: string,
    replacements: Map<string, Expression>,
    isInferred: (name: string) => boolean,
  ) => {
    const byName = new Map(
      [...replacements].map((entry): [string, Substitution] => [
        entry[0],
        { frame, replacement: entry[1] },
      ]),
    );
    byName.forEach((substitution) =>
      substitutedExpressions.set(substitution.replacement, substitution),
    );
    frameSubstitutions.set(frame, () => {
      const inferred = order
        .getInstanceDeclarations(module)
        .filter((name) => byName.has(name) && isInferred(name));
      return [
        ...inferred.flatMap((name) => byName.get(name) ?? []),
        ...[...byName].flatMap((entry) => (inferred.includes(entry[0]) ? [] : [entry[1]])),
      ];
    });
  };

  const instantiate = (
    instance: Instance,
    module: Module,
    unit: ModuleUnit,
    isParameterFree: boolean,
    nested: LinkedModule | undefined,
    resolved: Symbols,
  ): Symbols => {
    const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
    if (standardSymbols) return getStandardInstanceSymbols(instance, standardSymbols);
    const linked = nested ?? getLinkedModule(instance.module, module.name);
    const declarations = getDeclarations(linked);
    const suffix = `#${copyCount++}`;
    const renamed = new Map(instance.params.map((param) => [param.name, `${param.name}${suffix}`]));
    const substitutions = resolveSubstitutions(
      resolveInstanceSubexpressions(instance, module),
      declarations,
      module,
      unit,
    );
    // SANY substitutes into the bodies of a module with parameters, or of any module a named instance substitutes for.
    const isSubstituted = (key: string) =>
      instance.name === undefined
        ? declarations.length > 0 && parameterized.get(key) === true
        : substitutions.size > 0;
    const range = instance.location.range;
    if (range) {
      const failed = [...linked.exported.values()].filter(
        (symbol) => unresolvedBodyKeys.has(symbol.key) && isSubstituted(symbol.key),
      );
      unit.reports.push({
        location: instance.location,
        errors: SUBSTITUTION_ERRORS.filter((error) =>
          failed.some((symbol) => symbol.kind === error.kind),
        ).map((error) => ({ location: formatRange(range), message: error.message })),
        warnings: [],
      });
    }
    const params = instance.params.map((param) => ({ ...param, name: `${param.name}${suffix}` }));
    params.forEach((param) => instanceParams.add(param));
    const replacements = new Map(
      [...substitutions].map((entry) => [entry[0], renameLocals(entry[1], renamed)]),
    );
    const substitutes = {
      params,
      substitutions: new Map(
        declarations.flatMap((declaration): [string, Expression][] => {
          const replacement = replacements.get(declaration.name);
          return replacement ? [[declaration.key, replacement]] : [];
        }),
      ),
    };
    instanceChecks.push({
      location: instance.location,
      check: () =>
        instanceLevels.checkInstance({
          module: instance.module,
          instancer: module.name,
          lets: [],
          substitutions,
          location: instance.location,
        }),
      substitutes,
    });
    const frame = declarations.length > 0 ? getSubstitutionFrame(instance) : undefined;
    if (frame) {
      setFrameSubstitutions(
        frame,
        instance.module,
        replacements,
        (name) =>
          substitutions.get(name)?.location === instance.location ||
          instance.params.some((param) => param.name === name) ||
          resolved.has(name),
      );
    }
    const instantiation = createInstantiation({
      params,
      substitutions: substitutes.substitutions,
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      getOuterDefinition: (key) =>
        module.definitions.find((definition) => unit.getKey(definition) === key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (source, name, create) => {
        const key = createName(`${name}@${module.name}`);
        const definition = create(key);
        definitions.set(key, definition);
        const copy = createInstanceCopy(source, instance.module, substitutes);
        if (copy) instanceCopies.set(definition, copy);
        if (declarations.length > 0) substitutedDefinitions.add(definition);
        if (instance.name !== undefined) {
          instanceNames.set(key, `${instance.name}!${instanceNames.get(source) ?? name}`);
        }
        parameterized.set(key, !isParameterFree);
        copySources.set(key, { source, prefix: instance.params.length });
        return key;
      },
      createName,
      frame,
    });
    return getInstanceSymbols(instance, linked.exported, declarations, (key, name) => {
      const copy =
        instance.name === undefined
          ? instantiation.getKey(key)
          : instantiation.getQualifiedKey(key);
      if (declarations.length > 0) {
        instanceActions.set(copy, {
          name,
          location: instance.location,
          head: instance.head ?? instance.location.range,
          body: frame?.location.range,
        });
      }
      if (instance.name !== undefined) qualifiedNames.set(copy, name);
      if (unresolvedBodyKeys.has(key) && !isSubstituted(key)) unresolvedBodyKeys.add(copy);
      return copy;
    });
  };

  const getStandardInstanceSymbols = (instance: Instance, standardSymbols: Symbols): Symbols =>
    instance.name === undefined
      ? standardSymbols
      : new Map(
          [...standardSymbols].map((entry) => [
            `${instance.name}!${entry[0]}`,
            {
              key: entry[1].key,
              arity: entry[1].arity,
              params: entry[1].params,
              kind: entry[1].kind,
            },
          ]),
        );

  const getInstanceSymbols = (
    instance: Instance,
    exported: Symbols,
    declarations: Declaration[],
    getKey: (key: string, name: string) => string,
  ): Symbols => {
    const declared = new Set(declarations.map((declaration) => declaration.name));
    return new Map(
      [...exported]
        .filter(
          (entry) =>
            !declared.has(entry[0]) &&
            (instance.name !== undefined || entry[1].kind !== "Instance") &&
            // SANY reuses a theorem that a module with parameters got from one without, but never adds its name.
            (instance.name !== undefined ||
              instance.isLocal ||
              declarations.length === 0 ||
              entry[1].kind !== "Theorem" ||
              parameterized.get(entry[1].key) === true),
        )
        .map((entry): [string, ModuleSymbol] => {
          if (instance.name === undefined) {
            return [
              entry[0],
              {
                key: getKey(entry[1].key, entry[0]),
                arity: entry[1].arity,
                params: entry[1].params,
                kind: entry[1].kind,
                range:
                  instance.isLocal || parameterized.get(entry[1].key) === true
                    ? instance.location.range
                    : entry[1].range,
                // SANY copies what a LOCAL INSTANCE imports to the instance, but a copy from a module without parameters stays the same definition.
                source:
                  instance.isLocal && parameterized.get(entry[1].key) !== true
                    ? (entry[1].source ?? entry[1].range)
                    : undefined,
                functionArity:
                  parameterized.get(entry[1].key) === true ? undefined : entry[1].functionArity,
                goal: entry[1].goal,
              },
            ];
          }
          const qualified = `${instance.name}!${entry[0]}`;
          return [
            qualified,
            {
              key: entry[1].kind === "Instance" ? qualified : getKey(entry[1].key, qualified),
              arity: entry[1].arity + instance.params.length,
              params: entry[1].params && [
                ...instance.params.map((param) => param.arity),
                ...entry[1].params,
              ],
              kind: entry[1].kind,
              functionArity: declarations.length > 0 ? undefined : entry[1].functionArity,
              goal: entry[1].goal,
            },
          ];
        }),
    );
  };

  const createArgumentParams = (arity: number, params: number[] | undefined) =>
    Array.from({ length: arity }, (_value, index) => ({
      name: `argument${index}`,
      arity: params?.[index] ?? 0,
    }));

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
    const params = createArgumentParams(declaration.arity, undefined);
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
    isResolved: (name: string) => boolean,
  ): Definition[] => {
    const location = instance.location;
    const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return [];
      return [...standardSymbols].map((entry) => {
        const forwarded = createArgumentParams(entry[1].arity, entry[1].params);
        return createLocalAlias(
          `${instance.name}!${entry[0]}`,
          entry[1].key,
          [...instance.params, ...forwarded],
          forwarded,
          location,
        );
      });
    }
    const linked = nested ?? getLinkedModule(instance.module, instancer);
    const suffix = `#${copyCount++}`;
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
    const instanceCheck = {
      module: instance.module,
      instancer,
      lets,
      substitutions: new Map(
        declarations.map((declaration) => [declaration.name, getReplacement(declaration)]),
      ),
      location,
    };
    const instanceParamNames = new Set(instance.params.map((param) => param.name));
    const isParameterDependent = (declaration: OperatorParam) =>
      mentionsName(getReplacement(declaration), instanceParamNames);
    const frame = declarations.length > 0 ? getSubstitutionFrame(instance) : undefined;
    const substitutionBodies = new Map<string, Expression>();
    const substitutionDefinitions = declarations.map((declaration): Definition => {
      const substitution = getSubstitutionBody(getReplacement(declaration), declaration, location);
      if (declaration.arity === 0) substitutionBodies.set(declaration.name, substitution.body);
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
    const localCopies = new Map<string, InstanceCopy>();
    const createLocalSubstitution = (declaration: KeyedDeclaration): Expression =>
      !isParameterDependent(declaration)
        ? createLocalIdentifier(`${declaration.name}${suffix}`, location)
        : {
            kind: "Apply",
            operator: `${declaration.name}${suffix}`,
            args: createLocalArguments(instance.params, location),
            location,
            resolution: LOCAL_RESOLUTION,
          };
    const substitutes = {
      params: instance.params,
      substitutions: new Map(
        declarations.map((declaration): [string, Expression] => [
          declaration.key,
          explicitSubstitutions.get(declaration.name) ?? createLocalSubstitution(declaration),
        ]),
      ),
    };
    const instantiation = createInstantiation({
      params: instance.params,
      substitutions: new Map(
        declarations.map((declaration): [string, Expression] => [
          declaration.key,
          createLocalSubstitution(declaration),
        ]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      getOuterDefinition: () => undefined,
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (source, name, create) => {
        const key = `${name}${KEY_SEPARATOR}${instance.module}${suffix}.${copies.length}`;
        const definition = create(key);
        const copy =
          definition.kind === "Operator"
            ? { ...definition, name: key }
            : createLocalFunction(definition, key);
        copies.push(copy);
        const instanceCopy = createInstanceCopy(source, instance.module, substitutes);
        if (instanceCopy) localCopies.set(key, instanceCopy);
        return key;
      },
      createName,
      isLocal: true,
    });
    if (frame) {
      setFrameSubstitutions(
        frame,
        instance.module,
        substitutionBodies,
        (name) =>
          !explicitSubstitutions.has(name) ||
          instanceParamNames.has(name) ||
          isResolved(name) ||
          lets.some((definition) => definition.name === name),
      );
    }
    const declared = new Set(declarations.map((declaration) => declaration.name));
    const exported = [...linked.exported]
      .filter((entry) => !declared.has(entry[0]) && entry[1].kind !== "Instance")
      .map((entry) => {
        const name = instance.name === undefined ? entry[0] : `${instance.name}!${entry[0]}`;
        const key = instantiation.getKey(entry[1].key);
        const copy = copies.find((candidate) => candidate.name === key);
        const original = definitions.get(key);
        const definition = copy ?? (original && withInstanceParams(original, instance.params));
        if (definition) {
          const operator =
            definition.kind === "Operator" ? definition : createLocalFunction(definition, name);
          const instanceCopy = localCopies.get(key);
          if (copy && instanceCopy) localCopies.set(name, instanceCopy);
          return {
            ...operator,
            name,
            body: withSubstitutionFrames(operator.body, frame ? [frame] : []),
          };
        }
        const ownParams = createArgumentParams(entry[1].arity, entry[1].params);
        return createLocalAlias(name, key, [...instance.params, ...ownParams], ownParams, location);
      });
    if (instance.location.range) {
      letInstances.set(formatRange(instance.location.range), {
        copies: localCopies,
        check: () => instanceLevels.checkInstance(instanceCheck),
      });
    }
    return [...substitutionDefinitions, ...copies, ...exported];
  };

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
    const extendsReport: ModuleReport = { location: MODULE_START, errors: [], warnings: [] };
    const reports = [extendsReport];
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
    const modules = new Map<string, LinkedModule>();
    const extended: LinkedModule[] = [];
    const getKey = (item: { name: string }) => `${item.name}${KEY_SEPARATOR}${scope.id}`;
    const constants = parsed.constants.map((constant) => ({ ...constant, key: getKey(constant) }));
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
      linked.modules.forEach((module, moduleName) => modules.set(moduleName, module));
      extended.push(linked);
    });
    const bound = new Map(visible);
    const declarations = [
      ...parsed.constants.map((constant) => ({ ...constant, kind: "Constant" as const })),
      ...parsed.variables.map((variable) => ({ ...variable, kind: "Variable" as const })),
    ];
    const getDeclarationSymbol = (declaration: (typeof declarations)[number]): ModuleSymbol => ({
      key: declaration.kind === "Constant" ? getKey(declaration) : declaration.name,
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
      functionArity: getFunctionArity(definition),
    });
    const isParameterFree = constants.length === 0 && variables.length === 0;
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
      isModuleKnown: (name, location) =>
        name === parsed.name ||
        usedModules.has(name) ||
        scope.modules.has(name) ||
        parsed.modules.some(
          (nested) => nested.name === name && isBefore(nested.location, location),
        ),
      instanced,
      reports,
      warnings: scope.warnings,
    });
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
        (symbols, entry) => (symbols.has(entry[0]) ? symbols : symbols.set(entry[0], entry[1])),
        new Map(visible),
      );
    const subexpressions = createModuleSubexpressions(
      parsed,
      getLetInstanceExpansion(parsed, (instance, lets) =>
        instantiateLocally(instance, lets, parsed.name, getLetModule(instance), (name) =>
          getSymbolsBefore(instance.location).has(name),
        ),
      ),
      (name) => {
        const symbol = visible.get(name);
        const definition = symbol && definitions.get(symbol.key);
        return definition ? { ...definition, name } : scope.getDefinition(name);
      },
      (name, location) =>
        bound.has(name) ||
        parsed.instances.some(
          (instance) =>
            isBefore(instance.location, location) && instanced.get(instance)?.has(name) === true,
        ) ||
        declarations.some(
          (declaration) => declaration.name === name && isBefore(declaration.location, location),
        ),
    );
    const linkNested = (nested: Module) => {
      const visibleModules = getVisibleModules();
      const existing = visibleModules.get(nested.name);
      const redefinition = existing && getModuleRedefinition(nested, existing.module);
      if (existing && !redefinition) throw createModuleRedefinedError(nested);
      scope.nested.push(nested);
      const report: ModuleReport = { location: nested.location, errors: [], warnings: [] };
      reports.push(report);
      const getDefinitionBefore = subexpressions.getDefinitionsBefore(nested.location);
      const linked = linkModule(nested, {
        id: `${scope.id}/${nested.name}`,
        symbols: getSymbolsBefore(nested.location),
        getDefinition: (name) => getDefinitionBefore(name) ?? scope.getDefinition(name),
        modules: visibleModules,
        nested: scope.nested,
        errors: report.errors,
        warnings: report.warnings,
        levelChecks: scope.levelChecks,
      });
      if (redefinition) report.errors.push(redefinition);
      if (!existing) modules.set(nested.name, linked);
    };
    const instancingUnit = getUnit(parsed);
    [
      ...parsed.instances.map((instance) => ({
        location: instance.location,
        link: () => {
          const symbols = instantiate(
            instance,
            parsed,
            instancingUnit,
            isParameterFree,
            getVisibleModules().get(instance.module),
            getSymbolsBefore(instance.location),
          );
          instanced.set(instance, symbols);
          symbols.forEach((symbol, name) => {
            if (visible.has(name)) return;
            visible.set(name, symbol);
            if (!instance.isLocal) exported.set(name, symbol);
          });
          if (instance.name !== undefined && !instance.isLocal) {
            exported.set(instance.name, {
              key: `${instance.name}${KEY_SEPARATOR}${scope.id}`,
              arity: instance.params.length,
              kind: "Instance",
              range: instance.location.range,
            });
          }
        },
      })),
      ...parsed.modules.map((nested) => ({
        location: nested.location,
        link: () => linkNested(nested),
      })),
    ]
      .sort((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
      .forEach((unit) => unit.link());
    const module = subexpressions.resolve();
    parsed.theorems
      .flatMap((theorem) => getProofInstances(theorem.proof))
      .filter((instance) => !getVisibleModules().has(instance.module))
      .forEach(
        (instance) =>
          getStandardSymbols(instance.module) ?? getLinkedModule(instance.module, parsed.name),
      );
    const unit = getUnit(module);
    const resolved = resolveModule(module, unit);
    scope.errors.push(...resolved.errors);
    unit.definitions.forEach((definition) => {
      const key = getKey(definition);
      definitions.set(key, definition);
      parameterized.set(key, !isParameterFree);
      if (definition.kind === "Operator" && isUnresolved(definition.body)) {
        unresolvedBodyKeys.add(key);
      }
    });
    resolved.boundDefinitions.forEach((definition) => {
      const symbol = getDefinitionSymbol(definition);
      visible.set(definition.name, symbol);
      if (!definition.isLocal) exported.set(definition.name, symbol);
    });
    resolved.boundTheorems.forEach((theorem) => {
      const key = getKey(theorem);
      parameterized.set(key, !isParameterFree);
      const symbol: ModuleSymbol = {
        key,
        arity: 0,
        kind: "Theorem",
        range: theorem.location.range,
        goal: theorem.goal,
      };
      visible.set(theorem.name, symbol);
      exported.set(theorem.name, symbol);
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
    if (!checkedModules.has(parsed.name)) checkedModules.set(parsed.name, linked);
    scope.levelChecks.push(
      checkModuleLevels(
        module,
        {
          constants: new Set(constants.map((constant) => constant.key)),
          variables: new Set(variables),
          getDefinition: (symbol) => definitions.get(visible.get(symbol)?.key ?? symbol),
          getQualifiedName: (symbol) => qualifiedNames.get(visible.get(symbol)?.key ?? symbol),
          instances: instanceLevels.instances,
        },
        instanceChecks.splice(firstCheck),
        warnings,
      ),
    );
    linkOrder.push(linked);
    return linked;
  };

  const linkedRoot = linkTopLevel(root).linked;
  const traceFile = options.traceFile;
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
  const moduleOperators = [...(options.moduleOperators ?? []), ...traceOperators].map(
    (operator): ResolvedModuleOperator => {
      const symbol = getLinkedModule(operator.module, root.name).visible.get(operator.operator);
      return { ...operator, key: symbol?.kind === "Definition" ? symbol.key : undefined };
    },
  );
  linkOrder.push(...linkOrder.splice(linkOrder.indexOf(linkedRoot), 1));
  if (warnings.length > 0 && !options.isSanyReported) options.print(formatSanyWarnings(warnings));
  const runtimeInvariants = options.runtimeInvariants ?? [];
  const rootKeys = new Map<string, string>();
  runtimeInvariants.forEach((invariant) => {
    if (invariant.module === undefined) return;
    linkedModules.set(root.name, linkedRoot);
    const linked = getLinkedModule(invariant.module, root.name);
    linkOrder.splice(linkOrder.indexOf(linked), 1);
    const key = linked.visible.get(invariant.name)?.key;
    if (key !== undefined && definitions.has(key)) rootKeys.set(invariant.name, key);
  });
  linkedRoot.visible.forEach((symbol, name) => rootKeys.set(name, symbol.key));
  linkedRoot.constants.forEach((constant) => rootKeys.set(constant.name, constant.key));
  moduleOperators.forEach((operator) => {
    if (
      operator.kind !== "postcondition" &&
      operator.key !== undefined &&
      definitions.has(operator.key)
    ) {
      rootKeys.set(operator.operator, operator.key);
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
  const variables = linkedRoot.variables;

  const applied = applyConfig(config, {
    root: linkedRoot,
    moduleSymbols: new Map([
      ...standardExports,
      ...[...linkedModules].map((entry): [string, Symbols] => [entry[0], entry[1].visible]),
      [root.name, linkedRoot.visible],
    ]),
    rootKeys,
    definitions,
    builtins,
    copySources,
    operatorConstants: new Map(
      moduleOperators.flatMap((operator) =>
        getLinkedModule(operator.module, root.name).constants.flatMap(
          (constant): [string, Value][] => {
            const value = operator.constants?.[constant.name];
            return value === undefined ? [] : [[constant.key, value]];
          },
        ),
      ),
    ),
    order,
  });
  const constants = applied.constants;
  const substitutions = applied.substitutions;

  if (traceFile !== undefined) {
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
    rootKeys,
    builtins,
    constants,
    substitutions,
    instanceNames,
    variables,
    variableIndex,
    facts,
    startupValues: Array.from({ length: facts.ids.size }, (): Value | undefined => undefined),
    tlcEvalValues: new WeakMap(),
    substitutedDefinitions,
    instanceParams,
    evaluators: new WeakMap(),
    entryEvaluators: new WeakMap(),
    definitionEvaluators: new WeakMap(),
    instances: instanceLevels.instances,
  };
  const analyzer = createLevelAnalyzer({
    constants: new Set(constants.keys()),
    variables: new Set([
      ...variables,
      ...["TLCGet", "Trace", "CounterExample"].filter((name) => builtins.has(name)),
    ]),
    getDefinition: (name) => getDefinition(name, environment),
    instances: instanceLevels.instances,
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
  substitutions.forEach((target, key) => {
    const definition = definitions.get(target);
    const error =
      linkedRoot.constants.some((constant) => constant.key === key) &&
      definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      analyzer.analyzeDefinition(definition, new Map()).level > 0
        ? getEvaluationError(definition.body)
        : undefined;
    if (error) {
      const addendum = isEvalException(error) ? "" : ` - specifically: ${error.message}`;
      throw new TlaConfigError(
        `The configuration file substitutes constant ${getKeyName(key)} with non-constant ${getKeyName(target)}${addendum}`,
      );
    }
  });
  if (runtime.version !== "1.7.4") runtime.isStarted = true;
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
            const key = linked.visible.get(name)?.key ?? name;
            const definition = definitions.get(key);
            return definition && !constants.has(key) && !substitutions.has(key) ? [definition] : [];
          },
        ),
      ),
    javaOverrides: linkOrder.flatMap((linked) => javaOverrides.get(linked.module.name) ?? []),
    moduleOperators,
    runtimeInvariants,
    rootName: root.name,
  };
};

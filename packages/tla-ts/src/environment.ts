import {
  getChildren,
  getDefinitionExpressions,
  type AssumeProve,
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
  letTheorems,
  mentionsName,
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
  compareLocations,
  CORE_SYMBOLS,
  getArity,
  getBoundNames,
  getFunctionArity,
  getInstanceBinding,
  getKeyName,
  getParamArities,
  getRecursiveCount,
  getRecursiveDefinitions,
  getTheoremGoal,
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
  type NestedRecursion,
  type RecursiveCount,
  type SubexpressionRecords,
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
import { getStandardModule, getStandardRange, STANDARD_LEVELS } from "./standard-definitions";
import { createModuleSubexpressions, resolveInstanceSubexpressions } from "./subexpressions";
import {
  checkModuleLevels,
  createLevelAnalyzer,
  type InstanceCopy,
  type InstanceLevelCheck,
  type InstanceSubstitutes,
  type LetInstance,
  type LevelData,
  type SectionMember,
} from "./levels";
import { createInstanceChecker, type KeyedDeclaration } from "./substitution-levels";
import { formatPrompt, isEvalException } from "./tlc/messages";
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
  hasUserFile?: boolean;
  traceFile?: string;
  isSanyReported?: boolean;
  isWarningEnabled?: boolean;
  version?: TlcVersion;
  moduleOperators?: ModuleOperator[];
  readLine?: () => string | undefined;
  printPrompt?: (text: string, code?: number) => void;
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

// SANY level-checks an instance's substitutes with the first definition it instances, an operator before a theorem, or else with the instance itself.
const getSubstitutesCheck = (exported: Symbols) => {
  const kinds = new Set([...exported.values()].map((symbol) => symbol.kind));
  if (kinds.has("Definition") || kinds.has("Builtin")) return "Definition";
  return kinds.has("Theorem") ? "Theorem" : "Instance";
};

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
  levelConstants: Map<string, number>;
  levelVariables: Set<string>;
  variableLocations: SourceLocation[];
  declarations: KeyedDeclaration[];
  visible: Symbols;
  enclosing: Symbols;
  exported: Symbols;
  modules: Map<string, LinkedModule>;
  extended: LinkedModule[];
  recursion: NestedRecursion;
}

interface ModuleScope {
  id: string;
  isHidden: boolean;
  symbols: Symbols;
  recursiveCount: RecursiveCount;
  getDefinition: (name: string) => Definition | undefined;
  modules: Map<string, LinkedModule>;
  nested: Module[];
  errors: SanyError[];
  warnings: SanyError[];
  levelChecks: ReturnType<typeof checkModuleLevels>[];
}

// Generator#processFunction looks a function's name up among its own bound names, so x[x \in S] defines nothing unless RECURSIVE x took the name first.
const isDefining = (definition: Definition) =>
  definition.kind !== "Function" ||
  definition.isRecursive ||
  !getBoundNames(definition.bounds).includes(definition.name);

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

const getInstanceRange = (instance: Instance): SourceRange =>
  instance.definitionRange
    ? {
        ...instance.definitionRange,
        start: { line: instance.location.line, column: instance.location.column },
      }
    : instance.instanceRange;

const getSubstitutionFrame = (instance: Instance): Expression => {
  const range = getInstanceRange(instance);
  return {
    kind: "Identifier",
    name: instance.name ?? instance.module,
    location: { ...range.start, range },
  };
};

const getVariableIndex = (variables: string[], declared: string[]) => {
  const index = new Map(variables.map((name, position) => [name, position]));
  new Set(declared).forEach((name) => index.set(getEnabledVariableName(name), index.size));
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
  const theorems = new Map<string, SourceRange>();
  const unlinkedTheorems = new Map<string, () => void>();
  const getLinkedDefinition = (key: string) => {
    unlinkedTheorems.get(key)?.();
    return definitions.get(key);
  };
  const parameterized = new Map<string, boolean>();
  const unresolvedBodyKeys = new Set<string>();
  const copySources = new Map<string, CopySource>();
  const substitutedDefinitions = new Set<Definition>();
  const enabledSubstitutions = new WeakSet<Expression>();
  const goalOperands = new WeakMap<Expression, Expression[]>();
  const goalSelections = new WeakMap<Expression, Expression>();
  const subexpressionRecords: SubexpressionRecords = {
    selectedDefinitions: new WeakMap(),
    instanceReferences: new WeakMap(),
  };
  const instanceParams = new Set<OperatorParam>();
  const builtins = new Map<string, Builtin>(
    CORE_OPERATORS.map((operator) => [operator.name, operator]),
  );
  const standardExports = new Map<string, Symbols>();
  const standardSources = new Map<string, LinkedModule>();
  const replacedDefinitions = new Map<string, Definition>();
  const builtinAliases = new Map<string, string>();
  const runtime = createRuntime(config.checkDeadlock, options.seed);
  runtime.isWarningEnabled = options.isWarningEnabled ?? true;
  runtime.isTool = options.isTool ?? false;
  runtime.hasUserFile = options.hasUserFile ?? false;
  runtime.version = options.version ?? "master";
  runtime.readLine = options.readLine;
  runtime.printPrompt =
    options.printPrompt ??
    ((text, code) => options.print(formatPrompt(runtime.isTool, text, code)));
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
  const originalNames = new Map<string, string>();
  const instanceChecks: InstanceLevelCheck[] = [];
  const semanticErrors: SanyError[] = [];
  const warnings: SanyError[] = [];
  const instanceCopies = new WeakMap<Definition, InstanceCopy>();
  const letInstances = new Map<string, LetInstance>();
  const locallyInstantiated = new Set<string>();
  const recursiveSections = new WeakMap<Definition, SectionMember[]>();
  const checkedNodes = new WeakMap<Expression, boolean>();
  const statementLevels = new Map<Expression | AssumeProve, LevelData>();
  const resolvedSubstitutions = new WeakMap<Instance, Map<string, Expression>>();
  // Each place that resolves an instance's selections, such as a theorem and its ASSUME/PROVE clause, copies the instance.
  const getInstanceKey = (instance: Instance) =>
    subexpressionRecords.instanceReferences.get(instance) ?? instance;
  const getInstanceSubstitute = (instance: Instance, name: string): Expression =>
    resolvedSubstitutions.get(getInstanceKey(instance))?.get(name) ??
    instance.substitutions.find((substitution) => substitution.name === name)?.expression ?? {
      kind: "Identifier",
      name,
      location: instance.location,
    };
  const getSubstitutedDeclarations = <Item extends Declaration>(
    instance: Instance,
    declarations: Item[],
  ) => {
    const names = [...(resolvedSubstitutions.get(getInstanceKey(instance))?.keys() ?? [])];
    const getOrder = (declaration: Item) => {
      const index = names.indexOf(declaration.name);
      return index === -1 ? names.length : index;
    };
    return declarations.toSorted((left, right) => getOrder(left) - getOrder(right));
  };
  const createInstanceCopy = (
    sourceKey: string,
    module: string,
    substitutes: InstanceSubstitutes,
  ): InstanceCopy | undefined => {
    const source = getLinkedDefinition(sourceKey);
    return source && { ...substitutes, source, module };
  };
  const getInstanceSubstitutes = (instance: Instance) => {
    const linked = checkedModules.get(instance.module);
    return (
      linked && {
        params: instance.params,
        substitutions: new Map(
          getSubstitutedDeclarations(instance, linked.declarations).map((declaration) => [
            declaration.key,
            getInstanceSubstitute(instance, declaration.name),
          ]),
        ),
      }
    );
  };
  const instanceLevels = createInstanceChecker(
    (name) => {
      const linked = checkedModules.get(name) ?? getLinkedModule(name, name);
      return {
        constants: linked.constants,
        variables: linked.variables,
        levelConstants: linked.levelConstants,
        levelVariables: linked.levelVariables,
        // SANY starts an inner module's Context empty, so it reads the enclosing module's symbols through the symbol table alone.
        getDefinitions: () => [
          ...new Set(
            [...linked.visible].flatMap((entry) =>
              entry[1].kind === "Theorem" ||
              (linked.enclosing.has(entry[0]) && !linked.exported.has(entry[0]))
                ? []
                : (getLinkedDefinition(entry[1].key) ?? []),
            ),
          ),
        ],
        assumptions: linked.module.assumptions.map((assumption) => assumption.expression),
        theorems: linked.module.theorems,
        instances: linked.module.instances,
        uses: linked.module.uses,
        extended: linked.extended.map((extended) => extended.module.name),
        getDefinition: (symbol) => getLinkedDefinition(linked.visible.get(symbol)?.key ?? symbol),
        getQualifiedName: (symbol) => qualifiedNames.get(linked.visible.get(symbol)?.key ?? symbol),
      };
    },
    {
      getCopy: (definition) => instanceCopies.get(definition),
      getSelectedDefinition: (expression) =>
        subexpressionRecords.selectedDefinitions.get(expression),
      getOriginalName: (name) => originalNames.get(name),
      getLetInstance: (instance) =>
        instance.location.range && letInstances.get(formatRange(instance.location.range)),
      checkInstantiation: (instance, instancer, scope) => {
        const linked = checkedModules.get(instance.module);
        if (!linked) return [];
        return instanceLevels.checkInstance({
          module: instance.module,
          instancer,
          scope,
          substitutions: new Map(
            getSubstitutedDeclarations(instance, linked.declarations).map((declaration) => [
              declaration.name,
              getInstanceSubstitute(instance, declaration.name),
            ]),
          ),
          location: instance.location,
        });
      },
      getInstanceDefinitions: (instance) => {
        const linked = checkedModules.get(instance.module);
        const substitutes = getInstanceSubstitutes(instance);
        if (!linked || !substitutes) return [];
        return [...linked.exported].flatMap((entry) => {
          const copy =
            entry[1].kind === "Definition" || entry[1].kind === "Theorem"
              ? createInstanceCopy(entry[1].key, instance.module, substitutes)
              : undefined;
          if (!copy) return [];
          const definition = {
            ...withInstanceParams(copy.source, instance.params),
            name: instance.name === undefined ? entry[0] : `${instance.name}!${entry[0]}`,
          };
          instanceCopies.set(definition, copy);
          return [definition];
        });
      },
      getSubstitutes: getInstanceSubstitutes,
    },
    recursiveSections,
    goalSelections,
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

  const linkTopLevel = (parsed: Module, isHidden = false) => {
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
      isHidden,
      symbols: new Map(),
      recursiveCount: { declarations: [], closed: 0 },
      getDefinition: () => undefined,
      modules: new Map(),
      nested,
      errors,
      warnings,
      levelChecks,
    });
    loading.pop();
    linking.pop();
    const duplicate = nested.find((module) => closure.has(module.name));
    const loaded =
      duplicate &&
      (linkedModules.get(duplicate.name)?.module ?? loadModule(duplicate.name, parsed.name));
    const redefinition = loaded && getModuleRedefinition(duplicate, loaded);
    if (duplicate && !redefinition) throw createModuleRedefinedError(duplicate);
    [...errors, ...(redefinition ? [redefinition] : [])].forEach((error) => {
      if (!semanticErrors.some((other) => isSameSanyError(other, error))) {
        semanticErrors.push(error);
      }
    });
    // SANY's Errors#addMessage drops a message it already has, such as an instantiated body's.
    if (semanticErrors.length === 0) {
      semanticErrors.push(
        ...[
          ...collectSemanticErrors(
            levelChecks.flatMap((check) => check.sections),
            warnings,
          ),
          ...levelChecks.flatMap((check) => check.check(check !== levelChecks.at(-1))),
        ]
          .filter(
            (error, index, all) =>
              all.findIndex((other) => isSameSanyError(other, error)) === index,
          )
          .map((error) => ({ location: error.location, message: error.message })),
      );
    }
    if (linking.length === 0 && semanticErrors.length > 0) {
      throw createSanyError(semanticErrors, false, undefined, warnings);
    }
    return { linked, closure };
  };

  const getLinkedModule = (name: string, importer: string): LinkedModule => {
    const cached = linkedModules.get(name);
    if (cached) {
      useModule(name, dependencies.get(name) ?? []);
      return cached;
    }
    const top = linkSource(name, importer, false);
    linkedModules.set(name, top.linked);
    dependencies.set(name, top.closure);
    useModule(name, top.closure);
    return top.linked;
  };

  const linkSource = (name: string, importer: string, isHidden: boolean) => {
    const top = linkTopLevel(loadModule(name, importer), isHidden);
    const evaluateReplaced = (
      operator: string,
      args: BuiltinArgument[],
      context: Context | undefined,
    ) => {
      const definition = replacedDefinitions.get(top.linked.visible.get(operator)?.key ?? operator);
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
        if (definition) replacedDefinitions.set(symbol.key, definition);
        builtins.set(symbol.key, operator);
        definitions.delete(symbol.key);
      },
    );
    return top;
  };

  const getStandardSource = (name: string) => {
    const cached = standardSources.get(name);
    if (cached) return cached;
    const linked = linkSource(name, name, true).linked;
    standardSources.set(name, linked);
    return linked;
  };

  // SANY substitutes for, arity-checks and reports missing an instanced module's declarations in its symbol table's hash order.
  const getSymbolTableOrdered = (module: string, declarations: KeyedDeclaration[]) => {
    const names = order.getInstanceDeclarations(module);
    return declarations.toSorted(
      (left, right) => names.indexOf(left.name) - names.indexOf(right.name),
    );
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

  // SANY substitutes into the bodies of a module with parameters, or of any module a named instance substitutes for.
  const isSubstituted = (
    instance: Instance,
    linked: LinkedModule,
    substitutionCount: number,
    key: string,
  ) =>
    instance.name === undefined
      ? linked.declarations.length > 0 && parameterized.get(key) === true
      : substitutionCount > 0;

  const getSubstitutionErrors = (
    instance: Instance,
    linked: LinkedModule,
    substitutionCount: number,
  ) => {
    const range = instance.location.range;
    if (!range) return [];
    const failed = [...linked.exported.values()].filter(
      (symbol) =>
        unresolvedBodyKeys.has(symbol.key) &&
        isSubstituted(instance, linked, substitutionCount, symbol.key),
    );
    return SUBSTITUTION_ERRORS.filter((error) =>
      failed.some((symbol) => symbol.kind === error.kind),
    ).map((error) => ({ location: formatRange(range), message: error.message }));
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
    if (standardSymbols) {
      return getStandardInstanceSymbols(instance, standardSymbols, (symbol, name) =>
        instance.params.length > 0
          ? addOwnArgumentsAlias(symbol, name, instance.params, module.name, instance.location)
          : symbol.key,
      );
    }
    const linked = nested ?? getLinkedModule(instance.module, module.name);
    const declarations = linked.declarations;
    const suffix = `#${copyCount++}`;
    const renamed = new Map(instance.params.map((param) => [param.name, `${param.name}${suffix}`]));
    const substitutions = resolveSubstitutions(
      resolveInstanceSubexpressions(instance, module, subexpressionRecords),
      getSymbolTableOrdered(instance.module, declarations),
      resolved,
      module.name,
      unit,
    );
    resolvedSubstitutions.set(getInstanceKey(instance), substitutions);
    unit.reports.push({
      location: instance.location,
      errors: getSubstitutionErrors(instance, linked, substitutions.size),
      warnings: [],
    });
    const params = instance.params.map((param) => ({ ...param, name: `${param.name}${suffix}` }));
    params.forEach((param) => instanceParams.add(param));
    const replacements = new Map(
      [...substitutions].map((entry) => [entry[0], renameLocals(entry[1], renamed)]),
    );
    const substitutes = {
      params,
      substitutions: new Map(
        getSubstitutedDeclarations(instance, declarations).flatMap(
          (declaration): [string, Expression][] => {
            const replacement = replacements.get(declaration.name);
            return replacement ? [[declaration.key, replacement]] : [];
          },
        ),
      ),
    };
    instanceChecks.push({
      location: instance.location,
      check: () =>
        instanceLevels.checkInstance({
          module: instance.module,
          instancer: module.name,
          scope: new Map(),
          substitutions,
          location: instance.location,
        }),
      substitutes,
      substitutesCheck: getSubstitutesCheck(linked.exported),
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
      substitutedVariables: new Set(
        linked.variables.filter((name) => {
          const replacement = substitutions.get(name);
          return !(
            replacement?.kind === "Identifier" &&
            replacement.name === name &&
            resolved.get(name)?.kind === "Variable"
          );
        }),
      ),
      enabledSubstitutions,
      getDefinition: getLinkedDefinition,
      getOuterDefinition: (key) =>
        module.definitions.find((definition) => unit.getKey(definition) === key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (source, name, create, reservedKey) => {
        const key = reservedKey ?? createName(`${name}@${module.name}`);
        const definition = create(key);
        definitions.set(key, definition);
        if (theorems.has(source)) theorems.set(key, getInstanceRange(instance));
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
      originalNames,
      frame,
    });
    const setInstanceNames = (copy: string, name: string) => {
      if (declarations.length > 0) {
        instanceActions.set(copy, {
          name,
          location: instance.location,
          head: instance.head ?? instance.location.range,
          body: frame?.location.range,
        });
      }
      if (instance.name !== undefined) qualifiedNames.set(copy, name);
    };
    return getInstanceSymbols(instance, linked.exported, declarations, (symbol, name) => {
      const key = symbol.key;
      if (
        symbol.goal?.statement.kind === "AssumeProve" &&
        (instance.name !== undefined || parameterized.get(key) === true)
      ) {
        const theoremKey = createName(key);
        parameterized.set(theoremKey, !isParameterFree);
        unlinkedTheorems.set(theoremKey, () => {
          unlinkedTheorems.delete(theoremKey);
          if (instance.name === undefined) instantiation.getKey(key, theoremKey);
          else instantiation.getQualifiedKey(key, theoremKey);
          setInstanceNames(theoremKey, name);
        });
        return theoremKey;
      }
      const copy =
        instance.name === undefined
          ? instantiation.getKey(key)
          : params.length > 0 && builtins.has(key) && !definitions.has(key)
            ? addOwnArgumentsAlias(symbol, name, params, module.name, instance.location)
            : instantiation.getQualifiedKey(key);
      setInstanceNames(copy, name);
      if (
        unresolvedBodyKeys.has(key) &&
        !isSubstituted(instance, linked, substitutions.size, key)
      ) {
        unresolvedBodyKeys.add(copy);
      }
      return copy;
    });
  };

  const getStandardInstanceSymbols = (
    instance: Instance,
    standardSymbols: Symbols,
    getKey: (symbol: ModuleSymbol, name: string) => string,
  ): Symbols =>
    instance.name === undefined
      ? standardSymbols
      : getInstanceSymbols(instance, standardSymbols, [], getKey);

  const getInstanceSymbols = (
    instance: Instance,
    exported: Symbols,
    declarations: Declaration[],
    getKey: (symbol: ModuleSymbol, name: string) => string,
  ): Symbols => {
    const declared = new Set(declarations.map((declaration) => declaration.name));
    return new Map(
      [...exported]
        .filter(
          (entry) =>
            !declared.has(entry[0]) &&
            (instance.name !== undefined ||
              (entry[1].kind !== "Instance" &&
                // SANY reuses a theorem that a module with parameters got from one without, but never adds its name.
                (instance.isLocal ||
                  declarations.length === 0 ||
                  entry[1].kind !== "Theorem" ||
                  parameterized.get(entry[1].key) === true))),
        )
        .map((entry): [string, ModuleSymbol] => {
          const isSubstituted =
            entry[1].isSubstituted === true ||
            (entry[1].kind === "Theorem" &&
              declarations.length > 0 &&
              (instance.name !== undefined || parameterized.get(entry[1].key) === true));
          const copiedArity = entry[1].params?.length ?? entry[1].arity;
          if (instance.name === undefined) {
            return [
              entry[0],
              {
                key: getKey(entry[1], entry[0]),
                arity:
                  instance.isLocal || parameterized.get(entry[1].key) === true
                    ? copiedArity
                    : entry[1].arity,
                params: entry[1].params,
                kind: entry[1].kind,
                range:
                  instance.isLocal || parameterized.get(entry[1].key) === true
                    ? instance.location.range
                    : entry[1].range,
                // SANY copies what a LOCAL INSTANCE imports to the instance, but a copy from a module without parameters stays the same definition.
                sourceRange:
                  instance.isLocal && parameterized.get(entry[1].key) !== true
                    ? entry[1].range
                    : undefined,
                functionArity:
                  parameterized.get(entry[1].key) === true ? undefined : entry[1].functionArity,
                goal: entry[1].goal,
                isSubstituted,
              },
            ];
          }
          const qualified = `${instance.name}!${entry[0]}`;
          return [
            qualified,
            {
              key: entry[1].kind === "Instance" ? qualified : getKey(entry[1], qualified),
              arity: copiedArity + instance.params.length,
              params: entry[1].params && [
                ...instance.params.map((param) => param.arity),
                ...entry[1].params,
              ],
              kind: entry[1].kind,
              functionArity: declarations.length > 0 ? undefined : entry[1].functionArity,
              goal: entry[1].goal,
              isSubstituted,
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

  // Deviation from TLC: TLC applies a Java override to the arguments of an instance with parameters too, which fails.
  const addOwnArgumentsAlias = (
    symbol: ModuleSymbol,
    name: string,
    params: OperatorParam[],
    instancer: string,
    location: SourceLocation,
  ) => {
    const key = createName(`${symbol.key}${KEY_SEPARATOR}${instancer}`);
    const ownParams = createArgumentParams(symbol.arity, symbol.params);
    definitions.set(
      key,
      createLocalAlias(key, symbol.key, [...params, ...ownParams], ownParams, location),
    );
    builtinAliases.set(key, symbol.key);
    instanceNames.set(key, name);
    return key;
  };

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
    const declarations = linked.declarations;
    const getReplacement = (declaration: OperatorParam): Expression =>
      explicitSubstitutions.get(declaration.name) ?? {
        kind: "Identifier",
        name: declaration.name,
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
        isLetSubstitute: true,
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
          (declaration.arity > 0 ? explicitSubstitutions.get(declaration.name) : undefined) ??
            createLocalSubstitution(declaration),
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
      substitutedVariables: new Set(linked.variables),
      enabledSubstitutions,
      getDefinition: getLinkedDefinition,
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
        if (theorems.has(source)) {
          theorems.set(key, getInstanceRange(instance));
          letTheorems.set(copy, getInstanceRange(instance));
        }
        const instanceCopy = createInstanceCopy(source, instance.module, substitutes);
        if (instanceCopy) localCopies.set(key, instanceCopy);
        return key;
      },
      createName,
      originalNames,
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
        const original = getLinkedDefinition(key);
        const definition = copy ?? (original && withInstanceParams(original, instance.params));
        if (definition) {
          const operator =
            definition.kind === "Operator" ? definition : createLocalFunction(definition, name);
          const instanceCopy = localCopies.get(key);
          if (copy && instanceCopy) localCopies.set(name, instanceCopy);
          const exportedDefinition = {
            ...operator,
            name,
            body: withSubstitutionFrames(operator.body, frame ? [frame] : []),
          };
          if (theorems.has(key)) letTheorems.set(exportedDefinition, getInstanceRange(instance));
          return exportedDefinition;
        }
        const ownParams = createArgumentParams(entry[1].arity, entry[1].params);
        return createLocalAlias(name, key, [...instance.params, ...ownParams], ownParams, location);
      });
    if (instance.location.range) {
      letInstances.set(formatRange(instance.location.range), {
        copies: localCopies,
        params: instance.params,
        substitutions: new Map(
          declarations.map((declaration) => [declaration.key, getReplacement(declaration)]),
        ),
        getArgParams: () => instanceLevels.getArgParams(instance.module),
        // Names resolve after the expansion, and with them the order of the substitutions.
        getSubstitutionNames: () =>
          getSubstitutedDeclarations(instance, declarations).map(
            (declaration) => `${declaration.name}${suffix}`,
          ),
        substitutesCheck: getSubstitutesCheck(linked.exported),
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
    const extendedConstants: KeyedDeclaration[] = [];
    // SANY's nested module doesn't declare a name its enclosing module already binds.
    const declaredVariables = parsed.variables.filter(
      (variable, index) =>
        parsed.variables.findIndex((other) => other.name === variable.name) === index &&
        !scope.symbols.has(variable.name),
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
      extendedConstants.push(
        ...linked.constants.filter(
          (constant) =>
            extendedConstants.every((existing) => existing.name !== constant.name) &&
            !variables.includes(constant.name),
        ),
      );
      linked.variables.forEach((variable, index) => {
        const isDeclared =
          variables.includes(variable) ||
          parsed.constants.some((constant) => constant.name === variable) ||
          extendedConstants.some((constant) => constant.name === variable);
        if (isDeclared) return;
        variables.push(variable);
        variableLocations.push(linked.variableLocations[index]);
      });
      mergeExtended(linked.exported);
      linked.modules.forEach((module, moduleName) => modules.set(moduleName, module));
      extended.push(linked);
    });
    const constants = [
      ...parsed.constants
        .filter(
          (constant) =>
            extendedConstants.every((existing) => existing.name !== constant.name) &&
            !scope.symbols.has(constant.name),
        )
        .map((constant) => ({ ...constant, key: getKey(constant) })),
      ...extendedConstants,
    ];
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
    const firstDeclarations = new Map<string, (typeof declarations)[number]>();
    declarations.forEach((declaration) => {
      const first = firstDeclarations.get(declaration.name);
      if (first === undefined || isBefore(declaration.location, first.location)) {
        firstDeclarations.set(declaration.name, declaration);
      }
    });
    declarations
      .filter(
        (declaration) =>
          !bound.has(declaration.name) && firstDeclarations.get(declaration.name) === declaration,
      )
      .forEach((declaration) => exported.set(declaration.name, getDeclarationSymbol(declaration)));
    const recursiveDeclarations = parsed.units.flatMap((item) =>
      item.kind === "Recursive" ? item.declarations : [],
    );
    const outerRecursive = scope.recursiveCount.declarations
      .filter((declared) => !declared.isTaken)
      .map((declared) => declared.declaration);
    const definedRecursive = [...outerRecursive, ...recursiveDeclarations];
    const firstRecursive = new Map(
      definedRecursive.toReversed().map((declaration) => [declaration.name, declaration]),
    );
    const recursiveDefinitions = getRecursiveDefinitions(
      parsed,
      definedRecursive,
      parsed.definitions,
    );
    // SANY's OpDefNode for a RECURSIVE operator keeps the declared arity.
    const getDefinitionSymbol = (definition: Definition): ModuleSymbol => {
      const declared = firstRecursive.get(definition.name);
      return {
        key: getKey(definition),
        arity:
          declared !== undefined && isBefore(declared.location, definition.location)
            ? declared.arity
            : getArity(definition),
        params: getParamArities(definition),
        kind: isTheoremDefinition(parsed, definition) ? "Theorem" : "Definition",
        range: definition.location.range,
        functionArity: getFunctionArity(definition),
      };
    };
    const getRecursiveSymbol = (declaration: Declaration): ModuleSymbol => ({
      key: getKey(declaration),
      arity: declaration.arity,
      params: Array(declaration.arity).fill(0),
      kind: "Definition",
      range: declaration.location.range,
    });
    const getInstanceSymbol = (instance: Instance, name: string): ModuleSymbol => ({
      key: `${name}${KEY_SEPARATOR}${scope.id}`,
      ...getInstanceBinding(instance),
    });
    const isParameterFree = constants.length === 0 && variables.length === 0;
    const instanced = new Map<Instance, Symbols>();
    const nestedRecursion = new Map<Module, NestedRecursion>();
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
      linkTheorem: getLinkedDefinition,
      getInstance: (instance) => {
        locallyInstantiated.add(instance.module);
        const nested = getLetModule(instance);
        const standardSymbols = nested ? undefined : getStandardSymbols(instance.module);
        if (standardSymbols) {
          return {
            declarations: [],
            symbols: getStandardInstanceSymbols(instance, standardSymbols, (symbol) => symbol.key),
            instancer: parsed.name,
            getSubstitutionErrors: () => [],
            setSubstitutions: () => {},
          };
        }
        const linked = nested ?? getLinkedModule(instance.module, parsed.name);
        return {
          declarations: getSymbolTableOrdered(instance.module, linked.declarations),
          symbols: getInstanceSymbols(
            instance,
            linked.exported,
            linked.declarations,
            (symbol) => symbol.key,
          ),
          instancer: parsed.name,
          getSubstitutionErrors: (substitutionCount) =>
            getSubstitutionErrors(instance, linked, substitutionCount),
          setSubstitutions: (substitutions) =>
            resolvedSubstitutions.set(getInstanceKey(instance), substitutions),
        };
      },
      bound,
      // SANY keeps the first of two definitions of a name.
      definitions: new Map(
        module.definitions
          .filter(isDefining)
          .toReversed()
          .map((definition) => [definition.name, definition]),
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
      goalOperands,
      goalSelections,
      recursiveCount: scope.recursiveCount,
      nestedRecursion: [...nestedRecursion.values()],
    });
    const symbolsBefore = new Map(bound);
    const boundLocations = new Map<string, SourceLocation>();
    const bindBefore = (name: string, symbol: ModuleSymbol, location: SourceLocation) => {
      if (symbolsBefore.has(name)) return;
      symbolsBefore.set(name, symbol);
      boundLocations.set(name, location);
    };
    const pendingRecursive = new Set<string>();
    const bindDefinitionBefore = (definition: Definition, location: SourceLocation) => {
      if (!pendingRecursive.delete(definition.name)) {
        bindBefore(definition.name, getDefinitionSymbol(definition), location);
        return;
      }
      symbolsBefore.set(definition.name, getDefinitionSymbol(definition));
    };
    const isBoundBefore = (name: string, location: SourceLocation) => {
      const boundLocation = boundLocations.get(name);
      return bound.has(name) || (boundLocation !== undefined && isBefore(boundLocation, location));
    };
    const subexpressions = createModuleSubexpressions(
      parsed,
      getLetInstanceExpansion(parsed, (instance, lets) =>
        instantiateLocally(instance, lets, parsed.name, getLetModule(instance), (name) =>
          isBoundBefore(name, instance.location),
        ),
      ),
      (name) => {
        const symbol = visible.get(name);
        const definition =
          symbol && !builtinAliases.has(symbol.key) ? getLinkedDefinition(symbol.key) : undefined;
        if (!definition) return scope.getDefinition(name);
        const named = { ...definition, name };
        const copy = instanceCopies.get(definition);
        if (copy) instanceCopies.set(named, copy);
        return named;
      },
      (name) => {
        const symbol = visible.get(name);
        if (symbol?.kind !== "Definition") return undefined;
        const builtin = builtinAliases.get(symbol.key) ?? symbol.key;
        if (!builtins.has(builtin)) return undefined;
        const source = getStandardModule(builtin);
        const key =
          source !== undefined && getSanyStandardModules(runtime.version).has(source)
            ? getStandardSource(source).visible.get(builtin)?.key
            : builtin;
        const definition = key === undefined ? undefined : replacedDefinitions.get(key);
        if (definition?.kind !== "Operator") return definition && { ...definition, name };
        return {
          ...definition,
          name,
          params: [
            ...createArgumentParams(symbol.arity - definition.params.length, symbol.params),
            ...definition.params,
          ],
        };
      },
      subexpressionRecords,
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
      const countedNames = new Set(outerRecursive.map((declaration) => declaration.name));
      const counted = recursiveDeclarations.map((declaration) => {
        const isTaken =
          CORE_SYMBOLS.has(declaration.name) ||
          isBoundBefore(declaration.name, declaration.location) ||
          countedNames.has(declaration.name);
        countedNames.add(declaration.name);
        return { declaration, isTaken };
      });
      const linked = linkModule(nested, {
        id: `${scope.id}/${nested.name}`,
        isHidden: scope.isHidden,
        symbols: new Map([...symbolsBefore].filter((entry) => !pendingRecursive.has(entry[0]))),
        recursiveCount: getRecursiveCount(
          scope.recursiveCount,
          counted,
          [...nestedRecursion.values()],
          recursiveDefinitions,
          nested.location,
        ),
        getDefinition: (name) => getDefinitionBefore(name) ?? scope.getDefinition(name),
        modules: visibleModules,
        nested: scope.nested,
        errors: report.errors,
        warnings: report.warnings,
        levelChecks: scope.levelChecks,
      });
      if (redefinition) report.errors.push(redefinition);
      if (!existing) modules.set(nested.name, linked);
      nestedRecursion.set(nested, linked.recursion);
      linked.recursion.definitions.forEach((definition) => {
        recursiveDefinitions.set(definition.name, [
          ...(recursiveDefinitions.get(definition.name) ?? []),
          definition,
        ]);
        bindDefinitionBefore(definition, nested.location);
      });
    };
    const instancingUnit = getUnit(parsed);
    [
      ...declarations.map((declaration) => ({
        location: declaration.location,
        link: () =>
          bindBefore(declaration.name, getDeclarationSymbol(declaration), declaration.location),
      })),
      ...recursiveDeclarations.map((declaration) => ({
        location: declaration.location,
        link: () => {
          if (!symbolsBefore.has(declaration.name)) pendingRecursive.add(declaration.name);
          bindBefore(declaration.name, getRecursiveSymbol(declaration), declaration.location);
        },
      })),
      ...parsed.definitions.filter(isDefining).map((definition) => ({
        location: definition.location,
        link: () => bindDefinitionBefore(definition, definition.location),
      })),
      ...parsed.theorems.map((theorem) => ({
        location: theorem.location,
        link: () => {
          const goal = getTheoremGoal(theorem);
          if (theorem.name === undefined || goal === undefined) return;
          bindBefore(
            theorem.name,
            {
              key: getKey({ name: theorem.name }),
              arity: 0,
              kind: "Theorem",
              range: theorem.location.range,
              goal,
            },
            theorem.location,
          );
        },
      })),
      ...parsed.instances.map((instance) => ({
        location: instance.location,
        link: () => {
          const symbols = instantiate(
            instance,
            parsed,
            instancingUnit,
            isParameterFree,
            getVisibleModules().get(instance.module),
            new Map(symbolsBefore),
          );
          instanced.set(instance, symbols);
          symbols.forEach((symbol, name) => {
            if (symbolsBefore.has(name)) return;
            visible.set(name, symbol);
            if (!instance.isLocal) exported.set(name, symbol);
          });
          if (
            instance.name !== undefined &&
            !instance.isLocal &&
            !symbolsBefore.has(instance.name)
          ) {
            exported.set(instance.name, getInstanceSymbol(instance, instance.name));
          }
          if (instance.name !== undefined) {
            bindBefore(
              instance.name,
              getInstanceSymbol(instance, instance.name),
              instance.location,
            );
          }
          symbols.forEach((symbol, name) => bindBefore(name, symbol, instance.location));
        },
      })),
      ...parsed.modules.map((nested) => ({
        location: nested.location,
        link: () => linkNested(nested),
      })),
    ]
      .sort((left, right) => compareLocations(left.location, right.location))
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
      if (symbol.kind === "Theorem" && symbol.range) theorems.set(symbol.key, symbol.range);
    });
    resolved.boundRecursive.forEach((declaration) => {
      const symbol = getRecursiveSymbol(declaration);
      parameterized.set(symbol.key, !isParameterFree);
      unresolvedBodyKeys.add(symbol.key);
      visible.set(declaration.name, symbol);
      exported.set(declaration.name, symbol);
    });
    resolved.boundTheorems.forEach((theorem) => {
      const key = getKey(theorem);
      parameterized.set(key, !isParameterFree);
      const body = subexpressions.getAssumeProve(theorem.name);
      const statement = theorem.goal.statement;
      if (body && statement.kind === "AssumeProve") {
        definitions.set(key, {
          kind: "Operator",
          name: theorem.name,
          params: [],
          body,
          statement,
          isLocal: false,
          isRecursive: false,
          location: theorem.location,
        });
      }
      const symbol: ModuleSymbol = {
        key,
        arity: 0,
        kind: "Theorem",
        range: theorem.location.range,
        goal: theorem.goal,
      };
      if (symbol.range) theorems.set(key, symbol.range);
      visible.set(theorem.name, symbol);
      exported.set(theorem.name, symbol);
    });
    const linked = {
      module,
      constants,
      variables,
      levelConstants: new Map([
        ...[...scope.symbols.values()].flatMap((symbol): [string, number][] =>
          symbol.kind === "Constant" ? [[symbol.key, symbol.arity]] : [],
        ),
        ...constants.map((constant): [string, number] => [constant.key, constant.arity]),
      ]),
      levelVariables: new Set([
        ...[...scope.symbols.values()].flatMap((symbol) =>
          symbol.kind === "Variable" ? [symbol.key] : [],
        ),
        ...variables,
      ]),
      variableLocations,
      declarations: [
        ...declarations
          .filter((declaration) => !isBoundBefore(declaration.name, declaration.location))
          .map((declaration) => ({ ...declaration, key: getDeclarationSymbol(declaration).key })),
        ...extended
          .flatMap((other) => other.declarations)
          .filter(
            (declaration, index, all) =>
              bound.get(declaration.name)?.key === declaration.key &&
              all.findIndex((other) => other.key === declaration.key) === index,
          ),
      ],
      visible,
      enclosing: scope.symbols,
      exported,
      modules,
      extended,
      recursion: resolved.recursion,
    };
    if (!checkedModules.has(parsed.name)) checkedModules.set(parsed.name, linked);
    scope.levelChecks.push(
      checkModuleLevels(
        module,
        {
          module: module.name,
          constants: linked.levelConstants,
          variables: linked.levelVariables,
          getDefinition: (symbol) => getLinkedDefinition(visible.get(symbol)?.key ?? symbol),
          getQualifiedName: (symbol) => qualifiedNames.get(visible.get(symbol)?.key ?? symbol),
          instances: instanceLevels.instances,
          recursiveSections,
          checkedNodes,
          goalSelections,
          statementLevels,
        },
        instanceChecks.splice(firstCheck),
        warnings,
      ),
    );
    if (!scope.isHidden) linkOrder.push(linked);
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
    if (key !== undefined && getLinkedDefinition(key)) rootKeys.set(invariant.name, key);
  });
  // TLC's defns holds no theorem, so a name a root theorem shares with a Java override reaches the override.
  linkedRoot.visible.forEach((symbol, name) => {
    if (symbol.kind !== "Theorem") rootKeys.set(name, symbol.key);
  });
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
  const bodyValues = applied.bodyValues;
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
    theorems,
    substitutions,
    constants,
    bodyValues,
    variableIndex,
    builtins,
    variables,
  });
  const environment: Environment = {
    runtime,
    definitions,
    theorems,
    rootKeys,
    builtins,
    constants,
    bodyValues,
    substitutions,
    instanceNames,
    variables,
    variableIndex,
    facts,
    startupValues: Array.from({ length: facts.ids.size }, (): Value | undefined => undefined),
    tlcEvalValues: new WeakMap(),
    substitutedDefinitions,
    enabledSubstitutions,
    instanceParams,
    evaluators: new WeakMap(),
    entryEvaluators: new WeakMap(),
    definitionEvaluators: new WeakMap(),
    instances: instanceLevels.instances,
    recursiveSections,
  };
  const analyzer = createLevelAnalyzer({
    // TLC's getLevelBound counts a theorem's arguments but not its body.
    constants: new Map([...constants.keys(), ...theorems.keys()].map((key) => [key, 0])),
    variables: new Set([
      ...variables,
      ...["TLCGet", "Trace", "CounterExample"].filter((name) => builtins.has(name)),
    ]),
    getDefinition: (name) => getDefinition(name, environment),
    instances: instanceLevels.instances,
    recursiveSections,
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
  const instantiated = new Set([
    ...linkOrder.flatMap((linked) => linked.module.instances.map((instance) => instance.module)),
    ...locallyInstantiated,
  ]);
  const isProcessedAtStartup = (linked: LinkedModule) =>
    !instantiated.has(linked.module.name) || linked.declarations.length === 0;
  const getModuleName = (linked: LinkedModule) =>
    linked === linkedRoot ? undefined : linked.module.name;
  const getStartupModules = (linked: LinkedModule): LinkedModule[] => [
    linked,
    ...order.getInnerModuleOrder(getModuleName(linked)).flatMap((name) => {
      const nested = linked.modules.get(name);
      return nested ? getStartupModules(nested) : [];
    }),
  ];
  const nestedModules = new Set(linkOrder.flatMap((linked) => [...linked.modules.values()]));
  const getDefinitionKey = (linked: LinkedModule, name: string) =>
    linked.visible.get(name)?.key ?? name;
  const getOwnDefinitionOrder = order.createDefinitionOrder();
  const origins = new Map(
    linkOrder.flatMap((linked) =>
      getOwnDefinitionOrder(getModuleName(linked)).map((name) => [
        getDefinitionKey(linked, name),
        linked,
      ]),
    ),
  );
  return {
    environment,
    assumptions,
    variableLocations: linkedRoot.variableLocations,
    instanceActions,
    // TLC's SpecProcessor#processConstantDefns walks a module's whole context, inherited definitions too, and skips each by the module it comes from.
    startupDefinitions: linkOrder
      .filter((linked) => !nestedModules.has(linked) && isProcessedAtStartup(linked))
      .flatMap(getStartupModules)
      .flatMap((linked) =>
        order.getDefinitionOrder(getModuleName(linked)).flatMap((name) => {
          const key = getDefinitionKey(linked, name);
          const definition = definitions.get(key);
          return definition &&
            isProcessedAtStartup(origins.get(key) ?? linked) &&
            !constants.has(key) &&
            !substitutions.has(key)
            ? [definition]
            : [];
        }),
      ),
    javaOverrides: linkOrder.flatMap((linked) => javaOverrides.get(linked.module.name) ?? []),
    moduleOperators,
    runtimeInvariants,
    rootName: root.name,
  };
};

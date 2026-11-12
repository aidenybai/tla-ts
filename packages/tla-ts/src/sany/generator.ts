import type { TlcVersion } from "../tlc/version";
import {
  type AssumeProve,
  type Expression,
  getChildren,
  type Instance,
  type Module,
  type Proof,
} from "../ast";
import { TlaMissingModuleError, TlaSanyFatalError, TlaSyntaxError } from "../errors";
import { parseSanyModule } from "../parser";
import { isBefore } from "../resolve";
import { createBuiltins } from "./builtins";
import { getSany174LexicalError } from "./lexer";
import { getSanyParseError } from "./parse-error";
import {
  addSanyMessage,
  addToContext,
  CONSTANT_DECL_KIND,
  createContext,
  formatSanyLocation,
  getContextModule,
  getContextSymbol,
  type ModuleNode,
  type SanyLocation,
  type SanyMessage,
  type SymbolNode,
  VARIABLE_DECL_KIND,
} from "./nodes";
import { createSelectorResolver } from "./selectors";
import {
  createSourceFile,
  getPreComments,
  getSpanLocation,
  getTokenIndex,
  getUnboxedSource,
  type SourceFile,
} from "./source";
import {
  createFormalParam,
  createNullNode,
  createOpAppl,
  createOpArg,
  createOpDef,
  getBuiltin,
  getModule,
  getTopContext,
  getUnitSpan,
  isSameOrigin,
  matchArguments,
  type ModuleGeneration,
  resolveModule,
  resolveSymbol,
  resolveSynonym,
  type SymbolTable,
} from "./generation";
import {
  checkForUndefinedRecursiveOps,
  checkRecursiveSection,
  createDeclaration,
  createSubstIn,
  generateInstance,
  processFunction,
  processModuleDefinition,
  processOperator,
  processRecursive,
} from "./generator-definitions";
import { generateArgument, generateExpression } from "./generator-expressions";
import { generateUseOrHide, processAssumption, processTheorem } from "./generator-proofs";

export interface SanySpecification {
  root: ModuleNode;
  modules: ModuleNode[];
  messages: SanyMessage[];
}

interface SanyGenerationOptions {
  rootFileName?: string;
  rootFilePath?: string;
  onParse?: (name: string) => void;
  onAnalyze?: (name: string) => void;
  onModule?: (module: ModuleNode, messages: SanyMessage[]) => void;
  version?: TlcVersion;
  rootExtendees?: string[];
}

interface UnresolvedName {
  name: string;
  importer: string;
  namingModule: string;
}

const getKindName = (symbol: SymbolNode) =>
  symbol.kind === "OpDef" || symbol.kind === "FormalParam" ? "definition" : "declaration";

const getLetInstances = (expression: Expression): Instance[] => [
  ...(expression.kind === "Let" ? (expression.instances ?? []) : []),
  ...getChildren(expression).flatMap(getLetInstances),
];

const getStatementInstances = (statement: Expression | AssumeProve): Instance[] =>
  statement.kind === "AssumeProve"
    ? [...statement.assumptions, statement.conclusion].flatMap((part) =>
        part.kind === "NewSymbol" ? [] : getStatementInstances(part),
      )
    : getLetInstances(statement);

const getProofInstances = (proof: Proof | undefined): Instance[] =>
  proof?.kind !== "Steps"
    ? []
    : proof.steps.flatMap((step) => [
        ...(step.body.kind === "Instance" ? [step.body] : []),
        ...(step.body.kind === "Define"
          ? step.body.definitions.flatMap((definition) =>
              definition.kind === "Instance" ? [definition] : [],
            )
          : []),
        ...getProofInstances(step.proof),
      ]);

const isInternalInstance = (module: Module, instance: Instance) => {
  const seen = new Set<string>();
  for (const unit of module.units) {
    if (unit.kind === "Module") seen.add(unit.module.name);
    if (unit.kind === "Instance" && unit.instance.module === instance.module) {
      return seen.has(instance.module);
    }
  }
  return module.modules.some(
    (inner) => inner.name === instance.module && isBefore(inner.location, instance.location),
  );
};

const getDependencies = (module: Module) => {
  const extendees: string[] = [];
  const instancees: string[] = [];
  const importers = new Map<string, string>();
  const visit = (current: Module, context: Map<string, Module>) => {
    const isRoot = current === module;
    const addImports = (names: string[], imports: string[]) =>
      names.forEach((name) => {
        imports.push(name);
        if (!importers.has(name)) importers.set(name, current.name);
      });
    const isExternal = (name: string) => !context.has(name);
    addImports(current.extends.filter(isExternal), extendees);
    const instances = current.units.flatMap((unit) => {
      if (unit.kind === "Instance") return [unit.instance];
      if (unit.kind === "Definition") return getLetInstances(unit.definition.body);
      if (unit.kind === "Theorem" && isRoot) {
        return [
          ...getStatementInstances(unit.theorem.statement),
          ...getProofInstances(unit.theorem.proof),
        ];
      }
      if (unit.kind === "Assumption" && isRoot) return getLetInstances(unit.assumption.expression);
      return [];
    });
    addImports(
      instances
        .filter((instance) => isExternal(instance.module) && !isInternalInstance(current, instance))
        .map((instance) => instance.module),
      instancees,
    );
    const peers = new Map(context);
    current.modules.forEach((inner) => {
      const innerContext = new Map(peers);
      const extenders = new Set<Module>();
      const addExtendedInnerModules = (extender: Module) => {
        if (extenders.has(extender)) return;
        extenders.add(extender);
        extender.extends.forEach((name) => {
          const extendee = innerContext.get(name);
          if (extendee === undefined) return;
          extendee.modules.forEach((extendeeInner) => {
            if (!innerContext.has(extendeeInner.name)) {
              innerContext.set(extendeeInner.name, extendeeInner);
            }
          });
          addExtendedInnerModules(extendee);
        });
      };
      addExtendedInnerModules(inner);
      visit(inner, innerContext);
      peers.set(inner.name, inner);
    });
  };
  visit(module, new Map());
  return { extendees, instancees, importers };
};

export const generateSanySpecification = (
  rootSource: string,
  loadModule: (name: string) => string | undefined,
  options: SanyGenerationOptions = {},
): SanySpecification => {
  const messages: SanyMessage[] = [];
  const addError = (location: SanyLocation | string | undefined, text: string) =>
    addSanyMessage(messages, { location, text, isWarning: false });
  const addWarning = (location: SanyLocation | undefined, text: string) =>
    addSanyMessage(messages, { location, text, isWarning: true });
  let lastId = options.version === "1.7.4" ? -1 : 0;
  const getId = () => ++lastId;
  let nullApplicationId = 0;

  // SANY creates the builtins twice, in Context's static initializer and in frontEndInitialize.
  if (options.version !== "1.7.4") createBuiltins(getId);
  const builtins = createBuiltins(getId);
  getId();
  const builtinsByName = new Map(builtins.map((builtin) => [builtin.name, builtin]));
  const externalModules = new Map<string, ModuleNode>();
  const sources = new Map<string, { file: SourceFile; module: Module }>();

  const parseSource = (name: string, text: string) => {
    const file = (name === options.rootFileName && options.rootFilePath) || `${name}.tla`;
    const getParseFailure = (parseError: string) =>
      new TlaSanyFatalError(`Could not parse module ${name} from file ${file}`, name, parseError);
    const lexicalError = options.version === "1.7.4" ? getSany174LexicalError(text) : undefined;
    if (lexicalError !== undefined) throw getParseFailure(lexicalError);
    // HACK: the parser's errors are not SANY's, so a module that fails to parse gets the report of
    // SANY's parser, or the parser's own where SANY's parser would accept the module.
    try {
      return parseSanyModule(getUnboxedSource(text));
    } catch (error) {
      if (!(error instanceof TlaSyntaxError)) throw error;
      throw getParseFailure(getSanyParseError(text) ?? `***Parse Error***\n${error.message}`);
    }
  };

  const getSource = (name: string, text: string | undefined, importer?: string) => {
    const cached = sources.get(name);
    if (cached) return cached;
    if (text === undefined) {
      throw new TlaMissingModuleError(name, importer, options.version !== "1.7.4");
    }
    options.onParse?.(name);
    const module = parseSource(name, text);
    if (module.name !== name) {
      throw new TlaSanyFatalError(
        `File name '${name}' does not match the name '${module.name}' of the top level module it contains.`,
        undefined,
      );
    }
    const entry = { file: createSourceFile(module.name, text), module };
    sources.set(name, entry);
    return entry;
  };

  const order: string[] = [];
  const visiting = new Set<string>();
  const path: string[] = [];
  const calculateDependencies = (name: string, text: string | undefined, importer?: string) => {
    const cycleStart = path.indexOf(name);
    if (cycleStart !== -1) {
      throw new TlaSanyFatalError(
        `Circular dependency among .tla files; dependency cycle is:\n\n  ${[...path.slice(cycleStart), name].map((file) => `${file}.tla`).join(" --> ")}`,
        undefined,
      );
    }
    if (visiting.has(name)) return;
    visiting.add(name);
    path.push(name);
    const dependencies = getModuleDependencies(name, getSource(name, text, importer).module);
    [...dependencies.extendees, ...dependencies.instancees].forEach((dependency) =>
      calculateDependencies(dependency, loadModule(dependency), name),
    );
    path.pop();
    order.push(name);
  };
  const resolutions = new Set<string>();
  const isResolved = (importer: string, name: string) => resolutions.has(`${importer} ${name}`);
  const findUnresolved = (
    name: string,
    kind: "extendees" | "instancees",
    visited: Set<string>,
  ): UnresolvedName | undefined => {
    const entry = sources.get(name);
    if (!entry || visited.has(name)) return undefined;
    visited.add(name);
    const dependencies = getModuleDependencies(name, entry.module);
    const unresolved = dependencies[kind].find((dependency) => !isResolved(name, dependency));
    if (unresolved !== undefined) {
      const namingModule = dependencies.importers.get(unresolved) ?? name;
      return { name: unresolved, importer: name, namingModule };
    }
    for (const dependency of [...dependencies.extendees, ...dependencies.instancees]) {
      const found = isResolved(name, dependency)
        ? findUnresolved(dependency, kind, visited)
        : undefined;
      if (found) return found;
    }
    return undefined;
  };
  const loadSpecification = (rootName: string) => {
    getSource(rootName, rootSource);
    const findNext = () =>
      findUnresolved(rootName, "extendees", new Set()) ??
      findUnresolved(rootName, "instancees", new Set());
    for (let next = findNext(); next !== undefined; next = findNext()) {
      if (!sources.has(next.name)) {
        getSource(next.name, loadModule(next.name), next.namingModule);
      }
      resolutions.add(`${next.importer} ${next.name}`);
    }
  };
  const rootName = options.rootFileName ?? parseSource("", rootSource).name;
  const getModuleDependencies = (name: string, module: Module) => {
    const dependencies = getDependencies(module);
    if (name !== rootName || options.rootExtendees === undefined) return dependencies;
    dependencies.extendees.splice(module.extends.length, 0, ...options.rootExtendees);
    options.rootExtendees.forEach((extendee) => {
      if (!dependencies.importers.has(extendee)) dependencies.importers.set(extendee, name);
    });
    return dependencies;
  };
  loadSpecification(rootName);
  calculateDependencies(rootName, rootSource);

  const generateModule = (
    ast: Module,
    file: SourceFile,
    parent: ModuleNode | undefined,
    symbolTable: SymbolTable,
  ): ModuleNode => {
    const currentModule: ModuleNode = {
      kind: "Module",
      id: getId(),
      name: ast.name,
      location: getSpanLocation(file, getUnitSpan(file, ast.location)),
      extendees: [],
      context: getTopContext(symbolTable),
      topLevel: [],
      definitions: [],
      opDefsInRecursiveSection: [],
      isLevelChecked: false,
      levelCorrect: true,
      argLevelParams: new Map(),
      levelConstraints: new Map(),
      argLevelConstraints: new Map(),
      records: [],
    };
    if (parent) parent.definitions.push(currentModule);
    const generation: ModuleGeneration = {
      version: options.version,
      addError,
      addWarning,
      getId,
      builtinsByName,
      externalModules,
      nullApplicationId,
      file,
      symbolTable,
      currentModule,
      curLevel: 0,
      unresolvedCount: [0],
      unresolvedSum: 0,
      recursiveSectionCount: 0,
      functions: [],
      exceptStack: [],
      exceptSpecStack: [],
      labelScopes: [],
      assumeContexts: new WeakSet(),
      assumeProveState: {
        depth: 0,
        isDeclared: [],
        goal: undefined,
        goalClause: 0,
      },
      assumeProveScopes: new WeakMap(),
      labelGoals: new WeakMap(),
      recursiveDeclarations: [],
      selectorToNode: createSelectorResolver({
        version: options.version,
        resolveSymbol: (name) => resolveSymbol(symbolTable, name),
        resolveSynonym,
        generateExpression: (expression) => generateExpression(generation, expression),
        generateArgument: (operator, index, argument, location) =>
          generateArgument(generation, operator, index, argument, location),
        createOpAppl: (operator, operands, location) => {
          const node = createOpAppl(generation, operator, operands, location);
          matchArguments(generation, operator, operands, location);
          return node;
        },
        createOpArg: (operator, location) => createOpArg(generation, operator, location),
        createFormalParam: (name, arity, location) =>
          createFormalParam(generation, name, arity, location, false),
        createLambda: (params, body, location) =>
          createOpDef(generation, {
            name: "LAMBDA",
            params,
            body,
            location,
            preComments: getPreComments(
              file,
              getTokenIndex(file, { line: location.beginLine, column: location.beginColumn }),
            ),
          }),
        copySubstIn: (prefix, body) =>
          createSubstIn(
            generation,
            "SubstIn",
            prefix.substs,
            body,
            prefix.instantiatedModule,
            prefix.location,
            prefix.instantiatingModule,
          ),
        getBuiltin: (name) => getBuiltin(generation, name),
        addError: (location, text) => {
          addError(location, text);
          return createNullNode(generation);
        },
        isOutOfLabelScope: (label) => {
          const goal = generation.labelGoals.get(label);
          return (
            goal !== undefined &&
            goal.scope.isDeclaredBefore[goal.clause] &&
            goal.scope.isSuffices === goal.scope.isInProof
          );
        },
        isOutOfClauseScope: (assumeProve, position) => {
          const scope = generation.assumeProveScopes.get(assumeProve);
          return (
            scope !== undefined &&
            scope.isDeclaredBefore[position - 1] &&
            (!scope.hasGoal || scope.isSuffices === scope.isInProof)
          );
        },
      }),
    };

    ast.extends.forEach((name) => {
      const extendee = getModule(generation, name);
      currentModule.extendees.push(extendee);
      const context = getTopContext(symbolTable);
      extendee.context.symbols.forEach((symbol) => {
        if (
          symbol.kind !== "Module" &&
          symbol.kind !== "FormalParam" &&
          symbol.kind !== "OpDecl" &&
          symbol.isLocal
        ) {
          return;
        }
        const existing =
          symbol.kind === "Module"
            ? getContextModule(context, symbol.name)
            : getContextSymbol(context, symbol.name);
        if (existing === undefined) addToContext(context, symbol);
        else if (existing !== symbol && existing.kind !== symbol.kind) {
          addError(
            symbol.location,
            `The ${getKindName(symbol)} of '${symbol.name}' conflicts with \nits ${getKindName(existing)} at ${formatSanyLocation(existing.location)}.`,
          );
        } else if (existing !== symbol && !isSameOrigin(existing, symbol)) {
          // Context.mergeExtendContext names the kind of the existing symbol twice.
          addWarning(
            symbol.location,
            `Warning: the ${getKindName(existing)} of '${symbol.name}' conflicts with \nits ${getKindName(existing)} at ${formatSanyLocation(existing.location)}.`,
          );
        }
      });
      currentModule.topLevel.push(...extendee.topLevel);
    });

    ast.units.forEach((unit) => {
      switch (unit.kind) {
        case "Variables":
          checkRecursiveSection(generation, unit.location, "A VARIABLE declaration");
          unit.declarations.forEach((declaration) =>
            createDeclaration(generation, declaration, VARIABLE_DECL_KIND),
          );
          break;
        case "Constants":
          checkRecursiveSection(generation, unit.location, "A declaration");
          unit.declarations.forEach((declaration) =>
            createDeclaration(generation, declaration, CONSTANT_DECL_KIND),
          );
          break;
        case "Recursive":
          processRecursive(generation, unit.declarations);
          break;
        case "Definition":
          if (unit.definition.kind === "Function")
            processFunction(generation, unit.definition, undefined);
          else processOperator(generation, unit.definition, undefined);
          break;
        case "Instance":
          if (unit.instance.name === undefined) generateInstance(generation, unit.instance);
          else processModuleDefinition(generation, unit.instance, undefined, undefined);
          break;
        case "Assumption":
          checkRecursiveSection(generation, unit.assumption.location, "An ASSUME");
          processAssumption(generation, unit.assumption);
          break;
        case "Theorem":
          checkRecursiveSection(generation, unit.theorem.location, "A THEOREM");
          processTheorem(generation, unit.theorem);
          break;
        case "Use":
          checkRecursiveSection(generation, unit.use.location, "A USE or HIDE");
          currentModule.topLevel.push(generateUseOrHide(generation, unit.use));
          break;
        case "Module": {
          checkRecursiveSection(generation, unit.module.location, "A MODULE ");
          const innerTable = { contexts: [...symbolTable.contexts, createContext()] };
          const inner = generateModule(unit.module, file, currentModule, innerTable);
          const binding = resolveModule(generation, inner.name);
          if (binding === undefined) addToContext(getTopContext(symbolTable), inner);
          else if (binding !== inner) {
            addError(
              inner.location,
              `Multiply-defined module '${inner.name}': this definition or declaration conflicts \nwith the one at ${formatSanyLocation(binding.location)}.`,
            );
          }
          break;
        }
      }
    });

    checkForUndefinedRecursiveOps(generation);

    return currentModule;
  };

  const modules = order.map((name) => {
    options.onAnalyze?.(name);
    // Each module's Generator creates its nullODN, nullOAN, nullOpArg and nullLabelNode.
    nullApplicationId = Array.from({ length: 4 }, getId)[1];
    const entry = getSource(name, undefined);
    const context = createContext();
    builtins.toReversed().forEach((builtin) => addToContext(context, builtin));
    const module = generateModule(entry.module, entry.file, undefined, {
      contexts: [context],
    });
    externalModules.set(name, module);
    options.onModule?.(module, messages);
    return module;
  });
  return { root: modules[modules.length - 1], modules, messages };
};

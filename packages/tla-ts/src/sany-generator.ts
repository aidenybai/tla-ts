import { TEMPORAL_LEVEL } from "./levels";
import type { TlcVersion } from "./tlc-version";
import type {
  AssumeProve,
  Assumption,
  Fact,
  Bound,
  Declaration,
  Definition,
  Expression,
  FunctionDefinition,
  Instance,
  Module,
  OperatorDefinition,
  OperatorParam,
  NewSymbol,
  Proof,
  ProofStep,
  SourceLocation,
  Theorem,
  UseOrHide,
} from "./ast";
import { getChildren } from "./ast";
import { TlaSanyFatalError, TlaSyntaxError, TlaUnsupportedError } from "./errors";
import { parseSanyModule } from "./parser";
import { createBuiltins, createLevelFields } from "./sany-builtins";
import { getSany174LexicalError } from "./sany-lexer";
import { getSanyParseError } from "./sany-parse-error";
import {
  addSanyMessage,
  CONSTANT_DECL_KIND,
  NEW_CONSTANT_KIND,
  VARIABLE_DECL_KIND,
  addToContext,
  createContext,
  getContextModule,
  formatSanyLocation,
  getContextSymbol,
  getSymbolArity,
  getDeclarations,
  getHashtableValues,
  isAbsent,
  type AssumeNode,
  type AssumeProveNode,
  type Context,
  type DefStepNode,
  type ExprNode,
  type ExprOrOpArgNode,
  type FactNode,
  type FormalParamNode,
  type InstanceNode,
  type LabelNode,
  type LetInNode,
  type LeafProofNode,
  type LevelNode,
  type ModuleNode,
  type NewSymbNode,
  type NonLeafProofNode,
  type OpApplNode,
  type OpArgNode,
  type OpDeclNode,
  type OpDefNode,
  type ProofStepNode,
  type SanyLocation,
  type SanyMessage,
  type Subst,
  type SubstInNode,
  type SymbolNode,
  type TheoremNode,
  type ThmOrAssumpDefNode,
  type UseOrHideNode,
} from "./sany-nodes";
import {
  createSelectorResolver,
  getSelectorItems,
  isGeneralId,
  type SelectorItem,
} from "./sany-selectors";
import {
  createSourceFile,
  findNameTokens,
  findToken,
  getExpressionSpan,
  getMatchingIndex,
  getParenthesizedSpan,
  getPreComments,
  getRangeSpan,
  getSpanLocation,
  getTokenIndex,
  getTokenLocation,
  getTokenSource,
  getUnboxedSource,
  isBoxToken,
  isToken,
  type SourceFile,
  type TokenSpan,
} from "./sany-source";
import { SANY_OPERATOR_SYNONYMS } from "./tlc-modules";

const SYNONYMS = new Map(
  SANY_OPERATOR_SYNONYMS.flatMap(([canonical, ...synonyms]) =>
    synonyms.map((synonym) => [synonym, canonical]),
  ),
);

// tla2sany.parser.Operators.resolveSynonym, applied to each part of a name like I!\cup.
const resolveSynonym = (name: string) =>
  name
    .split("!")
    .map((part) => SYNONYMS.get(part) ?? (part === "~" ? "\\lnot" : part))
    .join("!");

// The fields of SANY's AssumeProveNode that tell whether a reference to a clause lies in the scope
// of a declaration in the clauses before it. See AssumeProveNode.java.
interface AssumeProveScope {
  // AssumeProveNode.inScopeOfDecl: whether any of the first i clauses is a NEW.
  isDeclaredBefore: boolean[];
  // Whether the ASSUME/PROVE is the statement of a named theorem or step, whose suffices and
  // inProof fields decide where its declarations are visible.
  hasGoal: boolean;
  isSuffices: boolean;
  isInProof: boolean;
}

// Where the generator is among nested ASSUME/PROVEs: the depth, whether each level declares a
// symbol, and the goal and clause a label lies in.
interface AssumeProveState {
  depth: number;
  isDeclared: boolean[];
  goal: AssumeProveScope | undefined;
  goalClause: number;
}

interface LabelGoal {
  scope: AssumeProveScope;
  clause: number;
}

const NEW_SYMBOL_KINDS = {
  Constant: { declKind: NEW_CONSTANT_KIND, level: 0 },
  Variable: { declKind: 25, level: 1 },
  State: { declKind: 26, level: 1 },
  Action: { declKind: 27, level: 2 },
  Temporal: { declKind: 28, level: 3 },
};

// Whether SANY names an operator by an identifier rather than by a symbol.
const isIdentifier = (name: string) => /^[A-Za-z0-9_]+$/.test(name);

export interface SanySpecification {
  root: ModuleNode;
  modules: ModuleNode[];
  messages: SanyMessage[];
}

export interface SanyGenerationOptions {
  // The name of the root module's file, which SANY requires to match the module's name.
  rootFileName?: string;
  // Called before SANY parses the file of each module, and before it analyzes each external
  // module, in its order.
  onParse?: (name: string) => void;
  onAnalyze?: (name: string) => void;
  // Called after each external module, in the order SANY analyzes them.
  onModule?: (module: ModuleNode, messages: SanyMessage[]) => void;
  // The TLC whose SANY to reproduce, which decides how SANY numbers the nodes it creates.
  version?: TlcVersion;
}

interface SymbolTable {
  contexts: Context[];
}

interface BoundSymbols {
  bounded: FormalParamNode[][];
  tupleOrs: boolean[];
  ranges: ExprNode[];
}

interface OpApplBinding {
  unbounded?: FormalParamNode[];
  bounded?: FormalParamNode[][];
  tupleOrs?: boolean[];
  ranges?: ExprNode[];
}

const getTopContext = (table: SymbolTable) => table.contexts[table.contexts.length - 1];

const resolveSymbol = (table: SymbolTable, name: string) => {
  for (let index = table.contexts.length - 1; index >= 0; index--) {
    const symbol = getContextSymbol(table.contexts[index], name);
    if (symbol) return symbol;
  }
  return undefined;
};

// SANY's kind of a symbol, which a symbol that takes another's name must share.
const getSymbolKind = (symbol: SymbolNode) =>
  symbol.kind === "OpDecl"
    ? `${symbol.kind}${symbol.declKind}`
    : symbol.kind === "OpDef"
      ? symbol.defKind
      : symbol.kind;

// Context.kindOfNode.
const getKindName = (symbol: SymbolNode) =>
  symbol.kind === "OpDef" || symbol.kind === "FormalParam" ? "definition" : "declaration";

// SymbolNode.sameOriginallyDefinedInModule: two symbols are the same definition of a module without
// parameters.
const isSameOrigin = (symbol: SymbolNode, other: SymbolNode) => {
  if (symbol.kind === "OpDef" && other.kind === "OpDef") {
    const source = symbol.source ?? symbol;
    if (source !== (other.source ?? other)) return false;
    return source.module === undefined || isParameterFree(source.module);
  }
  if (symbol.kind === "ThmOrAssumpDef" && other.kind === "ThmOrAssumpDef") {
    return symbol.module === other.module && isParameterFree(symbol.module);
  }
  return false;
};

const isParameterFree = (module: ModuleNode) =>
  getDeclarations(module, CONSTANT_DECL_KIND).length === 0 &&
  getDeclarations(module, VARIABLE_DECL_KIND).length === 0;

const getLetInstances = (expression: Expression): Instance[] => [
  ...(expression.kind === "Let" ? (expression.instances ?? []) : []),
  ...getChildren(expression).flatMap(getLetInstances),
];

// The LET instances of a theorem or assumption's statement.
const getStatementInstances = (statement: Expression | AssumeProve): Instance[] =>
  statement.kind === "AssumeProve"
    ? [...statement.assumptions, statement.conclusion].flatMap((part) =>
        part.kind === "NewSymbol" ? [] : getStatementInstances(part),
      )
    : getLetInstances(statement);

// SpecObj.instanceResolvesToInternalModule: SANY finds a module that the root module instantiates
// among its inner modules only when its first top-level INSTANCE of the module follows the inner
// module, and otherwise looks for a file.
const isInternalInstance = (module: Module, name: string) => {
  const seen = new Set<string>();
  for (const unit of module.units) {
    if (unit.kind === "Module") seen.add(unit.module.name);
    if (unit.kind === "Instance" && unit.instance.module === name) return seen.has(name);
  }
  return false;
};

// The modules a file extends and instantiates, as SANY's ParseUnit collects them, and the module of
// the file that names each one. SANY looks at a module's own EXTENDS and INSTANCEs before those of
// its inner modules.
const getDependencies = (module: Module) => {
  const innerNames = new Set<string>();
  const extendees: string[] = [];
  const instancees: { name: string; isRoot: boolean }[] = [];
  const importers = new Map<string, string>();
  const visit = (current: Module) => {
    innerNames.add(current.name);
    const isRoot = current === module;
    const addImporters = (names: string[]) =>
      names.forEach((name) => {
        if (!importers.has(name)) importers.set(name, current.name);
      });
    extendees.push(...current.extends);
    addImporters(current.extends);
    const addInstances = (instances: Instance[]) => {
      instancees.push(...instances.map((instance) => ({ name: instance.module, isRoot })));
      addImporters(instances.map((instance) => instance.module));
    };
    current.units.forEach((unit) => {
      if (unit.kind === "Instance") addInstances([unit.instance]);
      if (unit.kind === "Definition") addInstances(getLetInstances(unit.definition.body));
      if (unit.kind === "Theorem" && isRoot) {
        addInstances(getStatementInstances(unit.theorem.statement));
      }
      if (unit.kind === "Assumption" && isRoot) {
        addInstances(getLetInstances(unit.assumption.expression));
      }
    });
    current.units.forEach((unit) => {
      if (unit.kind === "Module") visit(unit.module);
    });
  };
  visit(module);
  return {
    extendees: extendees.filter((name) => !innerNames.has(name)),
    instancees: instancees
      .filter((instancee) =>
        instancee.isRoot
          ? instancee.name !== module.name && !isInternalInstance(module, instancee.name)
          : !innerNames.has(instancee.name),
      )
      .map((instancee) => instancee.name),
    importers,
  };
};

// Builds the semantic graph SANY builds for a specification and its modules, in the order SANY
// analyzes them: a module after the modules it extends and instantiates.
const POSTFIX_OPERATOR_TEXTS = new Set(["'", "^+", "^*", "^#"]);

// SANY's syntax node for an operator that appears where an expression is required. The parser reads
// a prefix operator other than ~ and -. as a LAMBDA.
const getOperatorNodeKind = (
  expression: Expression & { kind: "OperatorReference" | "Lambda" },
  text: string,
) => {
  if (POSTFIX_OPERATOR_TEXTS.has(text)) return "N_GenPostfixOp";
  return expression.kind === "Lambda" || text === "~" || text === "-."
    ? "N_GenNonExpPrefixOp"
    : "N_GenInfixOp";
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
  // TLC 1.7.4's SANY numbers its first node 0, and the master builds create one before.
  const counter = { value: options.version === "1.7.4" ? -1 : 0 };
  const getId = () => ++counter.value;
  // The UID of the nullOAN of the Generator of the module being generated.
  const nullApplication = { id: 0 };

  // SymbolTable.addSymbol: a symbol joins the innermost context unless its name is taken, which is
  // an error unless the symbols agree in kind and arity, and then a warning unless they are the
  // same definition of a module without parameters.
  const addSymbol = (table: SymbolTable, symbol: SymbolNode) => {
    const binding = resolveSymbol(table, symbol.name);
    if (binding === symbol) return;
    if (binding === undefined) {
      addToContext(getTopContext(table), symbol);
      return;
    }
    const isConflict =
      symbol.kind === "FormalParam" ||
      getSymbolKind(binding) !== getSymbolKind(symbol) ||
      getSymbolArity(binding) !== getSymbolArity(symbol);
    // TLC 1.7.4's SANY reports a conflict before the redefinition of a built-in operator.
    const isBuiltIn = binding.kind === "OpDef" && binding.defKind === "BuiltIn";
    if (isBuiltIn && !(isConflict && options.version === "1.7.4")) {
      addError(
        symbol.location,
        `Symbol ${symbol.name} is a built-in operator, and cannot be redefined.`,
      );
      return;
    }
    if (isConflict) {
      addError(
        symbol.location,
        `Multiply-defined symbol '${symbol.name}': this definition or declaration conflicts \nwith the one at ${formatSanyLocation(binding.location)}.`,
      );
    } else if (!isSameOrigin(symbol, binding)) {
      addWarning(
        symbol.location,
        `Multiple declarations or definitions for symbol ${symbol.name}.  \nThis duplicates the one at ${formatSanyLocation(binding.location)}.`,
      );
    }
  };
  // SANY numbers its semantic nodes as it creates them, which the UIDs of its XML export show:
  // Context's static initializer creates the builtins, SANY.frontEndInitialize creates them again
  // for the specification, and the Generator class creates its InAssumeDummyNode. TLC 1.7.4's SANY
  // creates the builtins only for the specification.
  if (options.version !== "1.7.4") createBuiltins(getId);
  const builtins = createBuiltins(getId);
  getId();
  const builtinsByName = new Map(builtins.map((builtin) => [builtin.name, builtin]));
  const externalModules = new Map<string, ModuleNode>();
  const sources = new Map<string, { file: SourceFile; module: Module }>();

  const parseSource = (name: string, text: string) => {
    const getParseFailure = (parseError: string) =>
      new TlaSanyFatalError(
        `Could not parse module ${name} from file ${name}.tla`,
        name,
        parseError,
      );
    const lexicalError = options.version === "1.7.4" ? getSany174LexicalError(text) : undefined;
    if (lexicalError !== undefined) throw getParseFailure(lexicalError);
    // HACK: the parser's errors are not SANY's, so a module that fails to parse gets the report
    // of SANY's parser, and the parser's own report where SANY's parser would accept the module,
    // such as for an error SANY finds after parsing.
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
      // TLC 1.7.4's SANY gives the error no location.
      throw new TlaSanyFatalError(
        `Cannot find source file for module ${name} imported in module ${importer}.`,
        options.version === "1.7.4" ? undefined : importer,
      );
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
    // SpecObj.nonCircularityTest.
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
    const dependencies = getDependencies(getSource(name, text, importer).module);
    [...dependencies.extendees, ...dependencies.instancees].forEach((dependency) =>
      calculateDependencies(dependency, loadModule(dependency), name),
    );
    path.pop();
    order.push(name);
  };
  // SpecObj.loadSpec: SANY resolves the first name it finds unresolved searching from the root,
  // each module's extended modules before the modules they import, and the instantiated modules
  // only once it has resolved every extended module. SANY resolves a name in the context of the
  // module that names it, so a module another module loaded is unresolved until SANY reaches it
  // from this one.
  const resolutions = new Set<string>();
  const isResolved = (importer: string, name: string) => resolutions.has(`${importer} ${name}`);
  const findUnresolved = (
    name: string,
    kind: "extendees" | "instancees",
    visited: Set<string>,
  ): { name: string; importer: string; namingModule: string } | undefined => {
    const entry = sources.get(name);
    if (!entry || visited.has(name)) return undefined;
    visited.add(name);
    const dependencies = getDependencies(entry.module);
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
  loadSpecification(rootName);
  calculateDependencies(rootName, rootSource);

  const generateModule = (
    ast: Module,
    file: SourceFile,
    parent: ModuleNode | undefined,
    symbolTable: SymbolTable,
  ): ModuleNode => {
    const state = {
      curLevel: 0,
      unresolvedCount: [0],
      unresolvedSum: 0,
      recursiveSectionCount: 0,
    };
    const functions: { name: string; node: OpApplNode }[] = [];
    const exceptStack: OpApplNode[] = [];
    const exceptSpecStack: OpApplNode[] = [];
    // SANY's stack of the labels of the definitions, theorems and labels being generated.
    const labelSets: Map<string, LabelNode>[] = [];
    // The contexts in which SANY's $$InAssume marks the scope of an ordinary ASSUME's assumptions.
    const assumeContexts = new WeakSet<Context>();
    const popLabels = () => labelSets.pop() ?? new Map<string, LabelNode>();
    // Generator.assumeProveDepth, inScopeOfAPDecl, currentGoal and currentGoalClause: where the
    // node being generated lies among the ASSUME/PROVEs of a theorem or step.
    const assumeProveState: AssumeProveState = {
      depth: 0,
      isDeclared: [],
      goal: undefined,
      goalClause: 0,
    };
    const assumeProveScopes = new WeakMap<AssumeProveNode, AssumeProveScope>();
    const labelGoals = new WeakMap<LabelNode, LabelGoal>();
    const endProof = (statement: LevelNode) => {
      const scope = statement.kind === "AssumeProve" ? assumeProveScopes.get(statement) : undefined;
      if (scope) scope.isInProof = false;
    };

    const getLocation = (expression: Expression) =>
      getSpanLocation(file, getExpressionSpan(file, expression));

    const getUnitSpan = (location: SourceLocation) =>
      location.range
        ? getRangeSpan(file, location.range)
        : { start: getTokenIndex(file, location), end: getTokenIndex(file, location) };

    const currentModule: ModuleNode = {
      kind: "Module",
      id: getId(),
      name: ast.name,
      location: getSpanLocation(file, getUnitSpan(ast.location)),
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

    const resolveModule = (name: string) => {
      for (let index = symbolTable.contexts.length - 1; index >= 0; index--) {
        const module = getContextModule(symbolTable.contexts[index], name);
        if (module?.kind === "Module") return module;
      }
      return externalModules.get(name);
    };

    const getModule = (name: string) => {
      const module = resolveModule(name);
      if (module === undefined) throw new TlaSyntaxError(`Could not find module ${name}`);
      return module;
    };

    const withContext = <Result>(context: Context, generate: () => Result) => {
      symbolTable.contexts.push(context);
      const result = generate();
      symbolTable.contexts.pop();
      return result;
    };

    const createFormalParam = (
      name: string,
      arity: number,
      location: SanyLocation | undefined,
      isAdded: boolean,
    ): FormalParamNode => {
      const param: FormalParamNode = {
        ...createLevelFields(getId()),
        kind: "FormalParam",
        name,
        arity,
        location,
      };
      if (isAdded) addSymbol(symbolTable, param);
      return param;
    };

    const createOpDef = (
      fields: Partial<OpDefNode> & Pick<OpDefNode, "name" | "location">,
    ): OpDefNode => ({
      ...createLevelFields(getId()),
      kind: "OpDef",
      defKind: "UserDefined",
      arity: fields.params?.length ?? 0,
      params: [],
      body: undefined,
      isLocal: false,
      module: currentModule,
      source: undefined,
      preComments: [],
      isDefined: true,
      inRecursive: false,
      inRecursiveSection: false,
      recursiveSection: -1,
      letInLevel: 0,
      weights: (fields.params ?? []).map(() => 0),
      isLeibnizArg: (fields.params ?? []).map(() => true),
      isLeibniz: true,
      opLevelCond: undefined,
      maxLevels: (fields.params ?? []).map(() => TEMPORAL_LEVEL),
      minMaxLevel: undefined,
      labels: new Map(),
      step: undefined,
      ...fields,
    });

    const setRecursionFields = (definition: OpDefNode) => {
      definition.letInLevel = state.curLevel;
      if (state.unresolvedSum > 0) {
        definition.recursiveSection = state.recursiveSectionCount;
        definition.inRecursiveSection = state.unresolvedCount[state.curLevel] > 0;
        currentModule.opDefsInRecursiveSection.push(definition);
      }
    };

    const createOpAppl = (
      operator: SymbolNode,
      operands: (ExprOrOpArgNode | undefined)[],
      location: SanyLocation,
      binding: OpApplBinding = {},
      id = getId(),
    ): OpApplNode => ({
      ...createLevelFields(id),
      kind: "OpAppl",
      operator,
      operands,
      unbounded: binding.unbounded,
      bounded: binding.bounded,
      tupleOrs: binding.tupleOrs,
      ranges: binding.ranges ?? [],
      location,
    });

    // Generator.nullOAN, which SANY returns where it reported an error and carries on.
    const createNullNode = (location: SanyLocation): OpApplNode => ({
      ...createOpAppl(getBuiltin("$Nop"), [], location, {}, nullApplication.id),
      isNull: true,
    });

    const getBuiltin = (name: string) => {
      const builtin = builtinsByName.get(name);
      if (!builtin) throw new TlaUnsupportedError(`SANY has no builtin operator ${name}`);
      return builtin;
    };

    const applyBuiltin = (
      name: string,
      operands: (ExprOrOpArgNode | undefined)[],
      location: SanyLocation,
      binding: OpApplBinding = {},
    ) => createOpAppl(getBuiltin(name), operands, location, binding);

    const createString = (value: string, location: SanyLocation): ExprNode => ({
      ...createLevelFields(getId()),
      kind: "String",
      value,
      location,
    });

    const createOpArg = (op: SymbolNode, location: SanyLocation): OpArgNode => ({
      ...createLevelFields(getId()),
      kind: "OpArg",
      op,
      location,
    });

    const resolveName = (name: string, location: SanyLocation) => {
      const symbol = resolveSymbol(symbolTable, resolveSynonym(name));
      if (symbol === undefined || symbol.kind === "Module") {
        throw new TlaSyntaxError(
          `Unknown operator: \`${name}' at line ${location.beginLine}, column ${location.beginColumn} of module ${location.file}`,
        );
      }
      return symbol;
    };

    // OpDefNode.match: an operator a definition takes must be given an operator of its arity
    // that takes no operators.
    const matchArguments = (
      operator: SymbolNode,
      operands: ExprOrOpArgNode[],
      location: SanyLocation,
    ) => {
      if (operator.kind !== "OpDef" || operator.defKind !== "UserDefined") return;
      const params = operator.params ?? [];
      if (params.length !== operands.length) return;
      params.forEach((param, index) => {
        const operand = operands[index];
        if (param.arity === 0 && operand.kind === "OpArg") {
          addError(
            location,
            `Operator used in argument number ${index + 1} has incorrect number of arguments.`,
          );
        }
        const isMatching =
          operand.kind === "OpArg" &&
          getSymbolArity(operand.op) === param.arity &&
          !(
            operand.op.kind === "OpDef" &&
            (operand.op.params ?? []).some((parameter) => parameter.arity > 0)
          );
        if (param.arity > 0 && !isMatching) {
          addError(
            location,
            `Argument number ${index + 1} to operator '${operator.name}' \nshould be a ${param.arity}-parameter operator.`,
          );
        }
      });
    };

    const selectorToNode = createSelectorResolver({
      version: options.version,
      resolveSymbol: (name) => resolveSymbol(symbolTable, name),
      resolveSynonym,
      generateExpression: (expression) => generateExpression(expression),
      generateArgument: (operator, index, argument) => generateArgument(operator, index, argument),
      createOpAppl: (operator, operands, location) => {
        const node = createOpAppl(operator, operands, location);
        matchArguments(operator, operands, location);
        return node;
      },
      createOpArg,
      createFormalParam: (name, arity, location) => createFormalParam(name, arity, location, false),
      createLambda: (params, body, location) =>
        createOpDef({
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
          "SubstIn",
          prefix.substs,
          body,
          prefix.instantiatedModule,
          prefix.location,
          prefix.instantiatingModule,
        ),
      getBuiltin,
      addError: (location, text) => {
        addError(location, text);
        return createNullNode(location);
      },
      isOutOfLabelScope: (label) => {
        const goal = labelGoals.get(label);
        return (
          goal !== undefined &&
          goal.scope.isDeclaredBefore[goal.clause] &&
          goal.scope.isSuffices === goal.scope.isInProof
        );
      },
      isOutOfClauseScope: (assumeProve, position) => {
        const scope = assumeProveScopes.get(assumeProve);
        return (
          scope !== undefined &&
          scope.isDeclaredBefore[position - 1] &&
          (!scope.hasGoal || scope.isSuffices === scope.isInProof)
        );
      },
    });

    // The parts of a selector at the tokens of the expression that SANY locates them at, from the
    // name or selector itself to its parenthesized arguments.
    const locateSelectorItems = (items: SelectorItem[], span: TokenSpan) => {
      const cursor = { value: span.start };
      return items.map((item): SelectorItem => {
        const text = item.op === "Name" ? item.name : item.op === "Null" ? "(" : String(item.op);
        const index = findToken(file, cursor.value, span.end, text);
        if (index === -1) return item;
        if (item.op === "Null") {
          const close = getMatchingIndex(file, index);
          cursor.value = close + 1;
          return { ...item, location: getSpanLocation(file, { start: index, end: close }) };
        }
        cursor.value = index + 1;
        const location = getTokenLocation(file, index);
        if (item.args === undefined || !isToken(file, index + 1, "(")) return { ...item, location };
        const close = getMatchingIndex(file, index + 1);
        cursor.value = close + 1;
        return {
          ...item,
          location,
          argsLocation: getSpanLocation(file, { start: index + 1, end: close }),
        };
      });
    };

    const generateSelector = (
      expression: Expression,
      expectedArity: number,
      isFact: boolean,
      isDef: boolean,
    ) => {
      const items = getSelectorItems(expression);
      if (items === undefined)
        throw new TlaSyntaxError(`Expected a name, found ${expression.kind}`);
      return selectorToNode(
        locateSelectorItems(items, getExpressionSpan(file, expression)),
        expectedArity,
        isFact,
        isDef,
        getLocation(expression),
      );
    };

    const generateSelectorExpression = (expression: Expression) => {
      const node = generateSelector(expression, 0, false, false);
      if (node.kind !== "OpAppl") throw new TlaSyntaxError("Expected an expression");
      return node;
    };

    const checkRecursion = (node: ExprNode) => {
      if (node.kind !== "OpAppl") return;
      const recursive = functions.find((entry) => entry.name === node.operator.name);
      if (recursive) recursive.node.operator = getBuiltin("$RecursiveFcnSpec");
    };

    // The bound groups of a quantifier, set filter, set map or function: tla-ts expands
    // \A x, y \in S into a bound per name that shares the set, and SANY keeps one group.
    const getBoundGroups = (bounds: Bound[]) =>
      bounds.reduce<Bound[][]>((groups, bound) => {
        const last = groups[groups.length - 1];
        const isSameGroup =
          last !== undefined &&
          last[0].set === bound.set &&
          bound.pattern.kind === "Name" &&
          last[0].pattern.kind === "Name";
        if (isSameGroup) last.push(bound);
        else groups.push([bound]);
        return groups;
      }, []);

    // processQuantBoundArgs: SANY generates every bounding set before it declares the symbols,
    // each named at its token between the end of the previous group and its set.
    const generateBounds = (bounds: Bound[], searchStart: number) =>
      generateBoundsWithRanges(
        bounds,
        searchStart,
        getBoundGroups(bounds).map((group) => generateExpression(group[0].set)),
      );

    const generateLambda = (expression: Expression & { kind: "Lambda" }): OpDefNode => {
      const span = getExpressionSpan(file, expression);
      const nameIndexes = findNameTokens(file, span.start, span.end, expression.params);
      return withContext(createContext(), () => {
        const params = expression.params.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, nameIndexes[index]), true),
        );
        const body = generateExpression(expression.body);
        return createOpDef({
          name: "LAMBDA",
          params,
          body,
          location: getSpanLocation(file, span),
          preComments: getPreComments(file, span.start),
        });
      });
    };

    const generateOperatorArgument = (argument: Expression, expectedArity: number): OpArgNode => {
      const location = getLocation(argument);
      if (argument.kind === "Lambda") {
        if (argument.location.range !== undefined)
          return createOpArg(generateLambda(argument), location);
        // tla-ts desugars an operator symbol passed as an argument, such as SUBSET or -., into a
        // LAMBDA without a range.
        const name =
          argument.body.kind === "Apply"
            ? argument.body.operator
            : file.tokens[getTokenIndex(file, argument.location)].text;
        return createOpArg(resolveName(name, location), location);
      }
      if (argument.kind === "Identifier" || argument.kind === "Subexpression") {
        const node = generateSelector(argument, expectedArity, false, false);
        if (node.kind !== "OpArg") {
          throw new TlaSyntaxError(
            `Expected an operator argument at line ${location.beginLine}, column ${location.beginColumn}`,
          );
        }
        return node;
      }
      if (argument.kind === "OperatorReference") {
        return createOpArg(resolveName(argument.operator, location), location);
      }
      throw new TlaSyntaxError(
        `An expression appears where an operator is required at line ${location.beginLine}`,
      );
    };

    // generateExprOrOpArg: an argument is an operator where the parameter takes arguments.
    const generateArgument = (operator: SymbolNode, index: number, argument: Expression) => {
      const isDefinition =
        operator.kind === "OpDef" &&
        (operator.defKind === "UserDefined" || operator.defKind === "ModuleInstance");
      const expectedArity = isDefinition ? (operator.params?.[index]?.arity ?? 0) : 0;
      return expectedArity === 0
        ? generateExpression(argument)
        : generateOperatorArgument(argument, expectedArity);
    };

    // A /\ B /\ C nests as ((A /\ B) /\ C) in SANY; tla-ts flattens it.
    const generateJunction = (expression: Expression & { kind: "And" | "Or" }) => {
      const location = getLocation(expression);
      if (expression.isBulleted) {
        return applyBuiltin(
          expression.kind === "And" ? "$ConjList" : "$DisjList",
          expression.operands.map(generateExpression),
          location,
        );
      }
      const span = getExpressionSpan(file, expression);
      const name = expression.kind === "And" ? "\\land" : "\\lor";
      const [first, ...rest] = expression.operands;
      return rest.reduce<ExprNode>((left, operand, index) => {
        const operandSpan = getParenthesizedSpan(file, getExpressionSpan(file, operand));
        const end = index === rest.length - 1 ? span.end : operandSpan.end;
        return applyBuiltin(
          name,
          [left, generateExpression(operand)],
          getSpanLocation(file, { start: span.start, end }),
        );
      }, generateExpression(first));
    };

    const generateCase = (expression: Expression & { kind: "Case" }) => {
      const span = getExpressionSpan(file, expression);
      const arms = expression.arms.map((arm, index) => {
        const condition = getParenthesizedSpan(file, getExpressionSpan(file, arm.condition));
        const isLast = index === expression.arms.length - 1 && expression.other === undefined;
        const body = getParenthesizedSpan(file, getExpressionSpan(file, arm.body));
        const operands = [generateExpression(arm.condition), generateExpression(arm.body)];
        return applyBuiltin(
          "$Pair",
          operands,
          getSpanLocation(file, { start: condition.start, end: isLast ? span.end : body.end }),
        );
      });
      const other = expression.other;
      if (other) {
        const body = getParenthesizedSpan(file, getExpressionSpan(file, other));
        const otherIndex = findTokenBefore(body.start, "OTHER");
        arms.push(
          applyBuiltin(
            "$Pair",
            [undefined, generateExpression(other)],
            getSpanLocation(file, { start: otherIndex, end: span.end }),
          ),
        );
      }
      return applyBuiltin("$Case", arms, getSpanLocation(file, span));
    };

    const findTokenBefore = (index: number, text: string) => {
      for (let current = index; current >= 0; current--) {
        if (isToken(file, current, text)) return current;
      }
      return index;
    };

    const generateExcept = (expression: Expression & { kind: "Except" }) => {
      const span = getExpressionSpan(file, expression);
      const location = getSpanLocation(file, span);
      const operands: ExprOrOpArgNode[] = [generateExpression(expression.function)];
      const exceptNode = applyBuiltin("$Except", operands, location);
      const functionSpan = getExpressionSpan(file, expression.function);
      const cursor = { value: findToken(file, functionSpan.end + 1, span.end, "EXCEPT") + 1 };
      expression.updates.forEach((update) => {
        const bang = findToken(file, cursor.value, span.end, "!");
        const valueSpan = getParenthesizedSpan(file, getExpressionSpan(file, update.value));
        const specLocation = getSpanLocation(file, { start: bang, end: valueSpan.end });
        const pathCursor = { value: bang + 1 };
        const components = update.path.map((step): ExprNode => {
          if (step.kind === "Field") {
            const nameIndex = findNameOrKeyword(pathCursor.value, step.name);
            pathCursor.value = nameIndex + 1;
            return createString(step.name, getTokenLocation(file, nameIndex));
          }
          const open = findToken(file, pathCursor.value, span.end, "[");
          const close = getMatchingIndex(file, open);
          pathCursor.value = close + 1;
          if (step.args.length === 1) return generateExpression(step.args[0]);
          return applyBuiltin(
            "$Tuple",
            step.args.map(generateExpression),
            getSpanLocation(file, { start: open, end: close }),
          );
        });
        const sequence = applyBuiltin("$Seq", components, specLocation);
        const pair = applyBuiltin("$Pair", [sequence], specLocation);
        exceptSpecStack.push(pair);
        exceptStack.push(exceptNode);
        pair.operands.push(generateExpression(update.value));
        exceptSpecStack.pop();
        exceptStack.pop();
        operands.push(pair);
        cursor.value = valueSpan.end + 1;
      });
      return exceptNode;
    };

    const findNameOrKeyword = (start: number, name: string) => {
      for (let index = start; index < file.tokens.length; index++) {
        if (file.tokens[index].text === name && file.tokens[index].kind !== "String") return index;
      }
      return start;
    };

    const generateRecordFields = (
      operator: "$RcdConstructor" | "$SetOfRcds",
      expression: Expression & { kind: "Record" | "RecordSet" },
    ) => {
      const span = getExpressionSpan(file, expression);
      const cursor = { value: span.start + 1 };
      const pairs = expression.fields.map((field, fieldIndex) => {
        const nameIndex = findNameOrKeyword(cursor.value, field.name);
        const valueSpan = getParenthesizedSpan(file, getExpressionSpan(file, field.value));
        cursor.value = valueSpan.end + 1;
        if (expression.fields.slice(0, fieldIndex).some((other) => other.name === field.name)) {
          addError(getTokenLocation(file, nameIndex), "Non-unique fields in constructor.");
        }
        return applyBuiltin(
          "$Pair",
          [
            createString(field.name, getTokenLocation(file, nameIndex)),
            generateExpression(field.value),
          ],
          getSpanLocation(file, { start: nameIndex, end: valueSpan.end }),
        );
      });
      const record = applyBuiltin(operator, pairs, getSpanLocation(file, span));
      currentModule.records.push(record);
      return record;
    };

    const getTokenPosition = (index: number) => ({
      line: file.tokens[index].line,
      column: file.tokens[index].column,
    });

    // The declarations of a RECURSIVE statement, which the syntax tree of a LET leaves out:
    // names, each with (_, ...) for its arguments.
    const getRecursiveDeclarations = (start: number) => {
      const declarations: Declaration[] = [];
      let index = start;
      while (file.tokens[index]?.kind === "Identifier") {
        const end = isToken(file, index + 1, "(") ? getMatchingIndex(file, index + 1) : index;
        const arity = file.tokens
          .slice(index + 1, end)
          .filter((token) => token.text === "_").length;
        declarations.push({
          name: file.tokens[index].text,
          arity,
          location: {
            ...getTokenPosition(index),
            range: {
              module: file.name,
              start: getTokenPosition(index),
              end: getTokenPosition(end),
            },
          },
        });
        if (!isToken(file, end + 1, ",")) break;
        index = end + 2;
      }
      return declarations;
    };

    // The units of a LET in source order, with its RECURSIVE statements found among its tokens.
    const getLetUnits = (expression: Expression & { kind: "Let" }) => {
      const units = [
        ...expression.definitions.map((definition) => ({
          unit: { kind: "Definition", definition } satisfies LetUnit,
          span: getDefinitionSpan(definition),
        })),
        ...(expression.instances ?? []).map((instance) => ({
          unit: { kind: "Instance", instance } satisfies LetUnit,
          span: getDefinitionSpan(instance),
        })),
      ];
      const letStart = getExpressionSpan(file, expression).start;
      const bodyStart = getParenthesizedSpan(file, getExpressionSpan(file, expression.body)).start;
      const recursives: { unit: LetUnit; span: TokenSpan }[] = [];
      for (let index = letStart + 1; index < bodyStart; index++) {
        const isInUnit = units.some(
          (entry) => entry.span.start <= index && index <= entry.span.end,
        );
        if (isToken(file, index, "RECURSIVE") && !isInUnit) {
          recursives.push({
            unit: { kind: "Recursive", declarations: getRecursiveDeclarations(index + 1) },
            span: { start: index, end: index },
          });
        }
      }
      return [...units, ...recursives]
        .toSorted((first, second) => first.span.start - second.span.start)
        .map((entry) => entry.unit);
    };

    const generateLet = (expression: Expression & { kind: "Let" }): LetInNode => {
      const context = createContext();
      return withContext(context, () => {
        state.curLevel++;
        state.unresolvedCount[state.curLevel] = 0;
        const opDefs: (OpDefNode | ThmOrAssumpDefNode)[] = [];
        const instances: InstanceNode[] = [];
        getLetUnits(expression).forEach((unit) => {
          if (unit.kind === "Recursive") processRecursive(unit.declarations);
          else if (unit.kind === "Instance") {
            processModuleDefinition(unit.instance, opDefs, instances);
          } else if (unit.definition.kind === "Function") {
            processFunction(unit.definition, opDefs);
          } else processOperator(unit.definition, opDefs);
        });
        checkForUndefinedRecursiveOps();
        state.curLevel = Math.max(state.curLevel - 1, 0);
        const body = generateExpression(expression.body);
        return {
          ...createLevelFields(getId()),
          kind: "LetIn",
          opDefs,
          instances,
          body,
          context,
          location: getLocation(expression),
        };
      });
    };

    const generateChoose = (expression: Expression & { kind: "Choose" }) => {
      const span = getExpressionSpan(file, expression);
      const location = getSpanLocation(file, span);
      return withContext(createContext(), () => {
        const pattern = expression.pattern;
        const names = pattern.kind === "Name" ? [pattern.name] : pattern.names;
        if (expression.set === undefined) {
          const indexes = findNameTokens(file, span.start, span.end, names);
          // SANY locates the symbol of CHOOSE x : P at the CHOOSE keyword.
          const params = names.map((name, index) =>
            createFormalParam(
              name,
              0,
              getTokenLocation(file, pattern.kind === "Name" ? span.start : indexes[index]),
              true,
            ),
          );
          const body = generateExpression(expression.body);
          return applyBuiltin("$UnboundedChoose", [body], location, { unbounded: params });
        }
        const range = generateExpression(expression.set);
        const setSpan = getExpressionSpan(file, expression.set);
        const indexes = findNameTokens(file, span.start, setSpan.start, names);
        const params = names.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, indexes[index]), true),
        );
        const body = generateExpression(expression.body);
        return applyBuiltin("$BoundedChoose", [body], location, {
          bounded: [params],
          tupleOrs: [pattern.kind === "Tuple"],
          ranges: [range],
        });
      });
    };

    // An infix, prefix or postfix operator that no symbol defines, with the token SANY names it by.
    const getUnresolvedOperator = (expression: Expression & { kind: "Apply" }) => {
      if (
        isIdentifier(expression.operator) ||
        expression.operator.includes("!") ||
        expression.args.length > 2
      ) {
        return undefined;
      }
      if (resolveSymbol(symbolTable, resolveSynonym(expression.operator)) !== undefined) {
        return undefined;
      }
      const span = getExpressionSpan(file, expression);
      // SANY reports an operator applied like a function, as in op(a, b), as an unknown operator.
      if (
        file.tokens[span.start].text === expression.operator &&
        isToken(file, span.start + 1, "(")
      ) {
        return undefined;
      }
      const firstSpan = getParenthesizedSpan(file, getExpressionSpan(file, expression.args[0]));
      const isPrefix = expression.args.length === 1 && firstSpan.start !== span.start;
      const index = isPrefix ? span.start : firstSpan.end + 1;
      const text = getTokenSource(file, index);
      return {
        index,
        name: isPrefix && text === "-" ? "-." : text,
        fixity: isPrefix ? "prefix" : expression.args.length === 2 ? "infix" : "postfix",
      };
    };

    const generateExpression = (expression: Expression): ExprNode => {
      const location = getLocation(expression);
      switch (expression.kind) {
        case "Number":
          return {
            ...createLevelFields(getId()),
            kind: "Numeral",
            value: getNumeralValue(expression.text ?? String(expression.value)),
            location,
          };
        case "Decimal": {
          const [integralPart, fractionalPart] = expression.text.split(".");
          const mantissa = BigInt(integralPart + fractionalPart);
          const isLong = mantissa <= 9223372036854775807n;
          return {
            ...createLevelFields(getId()),
            kind: "Decimal",
            mantissa: mantissa.toString(),
            exponent: isLong ? String(-fractionalPart.length) : String(fractionalPart.length),
            integralPart,
            fractionalPart,
            location,
          };
        }
        case "String":
          return createString(expression.value, location);
        case "Identifier": {
          const node = generateSelectorExpression(expression);
          checkRecursion(node);
          return node;
        }
        case "Apply": {
          const unresolved = getUnresolvedOperator(expression);
          if (unresolved !== undefined) {
            addError(
              getTokenLocation(file, unresolved.index),
              `Could not find declaration or definition of symbol '${unresolved.name}'.`,
            );
            addError(
              location,
              `Couldn't resolve ${unresolved.fixity} operator symbol \`${unresolved.name}'.`,
            );
            return { ...createNullNode(location), isAbsent: true };
          }
          const node = generateSelectorExpression(expression);
          if (expression.operator.includes("!") || isIdentifier(expression.operator)) {
            checkRecursion(node);
          }
          return node;
        }
        case "Bracket":
          addError(
            getTokenLocation(file, getExpressionSpan(file, expression).start),
            "Unsupported expression type `['.",
          );
          return { ...createNullNode(location), isAbsent: true };
        case "OperatorReference":
        case "Lambda": {
          const text = file.tokens[getExpressionSpan(file, expression).start].text;
          addError(
            location,
            text === "LAMBDA"
              ? "LAMBDA expression used where an expression is required."
              : `Unsupported expression type \`${getOperatorNodeKind(expression, text)}'.`,
          );
          return { ...createNullNode(location), isAbsent: true };
        }
        case "And":
        case "Or":
          return generateJunction(expression);
        case "Prime":
          return applyBuiltin("'", [generateExpression(expression.expression)], location);
        case "Unchanged":
          return applyBuiltin("UNCHANGED", [generateExpression(expression.expression)], location);
        case "Enabled":
          return applyBuiltin("ENABLED", [generateExpression(expression.expression)], location);
        case "Always":
          return applyBuiltin("[]", [generateExpression(expression.expression)], location);
        case "Eventually":
          return applyBuiltin("<>", [generateExpression(expression.expression)], location);
        case "If":
          return applyBuiltin(
            "$IfThenElse",
            [
              generateExpression(expression.condition),
              generateExpression(expression.consequent),
              generateExpression(expression.alternative),
            ],
            location,
          );
        case "Case":
          return generateCase(expression);
        case "Let":
          return generateLet(expression);
        case "Forall":
        case "Exists": {
          const span = getExpressionSpan(file, expression);
          return withContext(createContext(), () => {
            const bounds = generateBounds(expression.bounds, span.start);
            const body = generateExpression(expression.body);
            return applyBuiltin(
              expression.kind === "Forall" ? "$BoundedForall" : "$BoundedExists",
              [body],
              location,
              bounds,
            );
          });
        }
        case "UnboundedQuantifier": {
          const span = getExpressionSpan(file, expression);
          const bodySpan = getExpressionSpan(file, expression.body);
          const indexes = findNameTokens(file, span.start, bodySpan.start, expression.names);
          const name = expression.isTemporal
            ? expression.quantifier === "Forall"
              ? "$TemporalForall"
              : "$TemporalExists"
            : expression.quantifier === "Forall"
              ? "$UnboundedForall"
              : "$UnboundedExists";
          return withContext(createContext(), () => {
            const params = expression.names.map((paramName, index) =>
              createFormalParam(paramName, 0, getTokenLocation(file, indexes[index]), true),
            );
            const body = generateExpression(expression.body);
            return applyBuiltin(name, [body], location, { unbounded: params });
          });
        }
        case "Choose":
          return generateChoose(expression);
        case "SetEnumeration":
          return applyBuiltin(
            "$SetEnumerate",
            expression.elements.map(generateExpression),
            location,
          );
        case "Tuple":
          return applyBuiltin("$Tuple", expression.elements.map(generateExpression), location);
        case "SetFilter": {
          const range = generateExpression(expression.bound.set);
          const span = getExpressionSpan(file, expression);
          return withContext(createContext(), () => {
            const bounds = generateBoundsWithRanges([expression.bound], span.start, [range]);
            const body = generateExpression(expression.predicate);
            return applyBuiltin("$SubsetOf", [body], location, bounds);
          });
        }
        case "SetMap": {
          const expressionSpan = getExpressionSpan(file, expression.expression);
          return withContext(createContext(), () => {
            const bounds = generateBounds(expression.bounds, expressionSpan.end + 1);
            const body = generateExpression(expression.expression);
            return applyBuiltin("$SetOfAll", [body], location, bounds);
          });
        }
        case "FunctionConstruction": {
          const span = getExpressionSpan(file, expression);
          return withContext(createContext(), () => {
            const bounds = generateBounds(expression.bounds, span.start);
            const body = generateExpression(expression.body);
            return applyBuiltin("$FcnConstructor", [body], location, bounds);
          });
        }
        case "FunctionSet":
          return applyBuiltin(
            "$SetOfFcns",
            [generateExpression(expression.domain), generateExpression(expression.range)],
            location,
          );
        case "Record":
          return generateRecordFields("$RcdConstructor", expression);
        case "RecordSet":
          return generateRecordFields("$SetOfRcds", expression);
        case "Except":
          return generateExcept(expression);
        case "ExceptAt": {
          const except = exceptStack[exceptStack.length - 1];
          const component = exceptSpecStack[exceptSpecStack.length - 1];
          if (except === undefined || component === undefined) {
            throw new TlaSyntaxError(
              `@ used where its meaning is not defined at line ${location.beginLine}`,
            );
          }
          return {
            ...createLevelFields(getId()),
            kind: "At",
            except,
            component,
            location: component.location,
          };
        }
        case "FunctionApplication": {
          const fn = generateExpression(expression.function);
          checkRecursion(fn);
          const argument =
            expression.args.length === 1
              ? generateExpression(expression.args[0])
              : applyBuiltin("$Tuple", expression.args.map(generateExpression), location);
          return applyBuiltin("$FcnApply", [fn, argument], location);
        }
        case "FieldAccess": {
          const record = generateExpression(expression.record);
          const span = getExpressionSpan(file, expression);
          return applyBuiltin(
            "$RcdSelect",
            [record, createString(expression.field, getTokenLocation(file, span.end))],
            location,
          );
        }
        case "Product":
          return applyBuiltin(
            "$CartesianProd",
            expression.factors.map(generateExpression),
            location,
          );
        case "BoxAction":
        case "AngleAction":
          return applyBuiltin(
            expression.kind === "BoxAction" ? "$SquareAct" : "$AngleAct",
            [generateExpression(expression.action), generateExpression(expression.subscript)],
            location,
          );
        case "WeakFairness":
        case "StrongFairness":
          return applyBuiltin(
            expression.kind === "WeakFairness" ? "$WF" : "$SF",
            [generateExpression(expression.subscript), generateExpression(expression.action)],
            location,
          );
        case "Label":
          return generateLabel(expression);
        case "Subexpression":
          return generateSelectorExpression(expression);
      }
    };

    const generateBoundsWithRanges = (
      bounds: Bound[],
      searchStart: number,
      ranges: ExprNode[],
    ): BoundSymbols => {
      const groups = getBoundGroups(bounds);
      const cursor = { value: searchStart };
      const bounded = groups.map((group) => {
        const setSpan = getExpressionSpan(file, group[0].set);
        const names = group.flatMap((bound) =>
          bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names,
        );
        const indexes = findNameTokens(file, cursor.value, setSpan.start, names);
        cursor.value = setSpan.end + 1;
        return names.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, indexes[index]), true),
        );
      });
      return {
        bounded,
        tupleOrs: groups.map((group) => group[0].pattern.kind === "Tuple"),
        ranges,
      };
    };

    const generateLabel = (expression: Expression & { kind: "Label" }): LabelNode | OpApplNode => {
      const location = getLocation(expression);
      // Generator.noLabelsAllowed: no label lies in the scope of a declaration of a nested
      // ASSUME/PROVE.
      if (assumeProveState.isDeclared.slice(2, assumeProveState.depth + 1).some(Boolean)) {
        addError(location, "Label not allowed within scope of declaration in nested ASSUME/PROVE.");
        return createNullNode(location);
      }
      labelSets.push(new Map());
      const body = generateExpression(expression.body);
      const labels = popLabels();
      const params = expression.params.map((name) => {
        const symbol = resolveSymbol(symbolTable, name);
        return symbol?.kind === "FormalParam"
          ? symbol
          : createFormalParam(name, 0, location, false);
      });
      const label: LabelNode = {
        ...createLevelFields(getId()),
        kind: "Label",
        name: expression.name,
        params,
        body,
        labels,
        isAssumeProve: false,
        location,
      };
      const labelSet = labelSets[labelSets.length - 1];
      if (labelSet !== undefined && !labelSet.has(label.name)) labelSet.set(label.name, label);
      const goal = assumeProveState.goal;
      if (goal) labelGoals.set(label, { scope: goal, clause: assumeProveState.goalClause });
      return label;
    };

    // The parameters of a definition's left-hand side, located as SANY locates them: a name, or a
    // name with its underscores like Op(_, _).
    const getParams = (
      definition: OperatorDefinition | Instance,
      span: TokenSpan,
      isAdded: boolean,
    ) => {
      const cursor = { value: span.start };
      return definition.params.map((param: OperatorParam) => {
        const index = param.location
          ? getTokenIndex(file, param.location)
          : findNameOrKeyword(cursor.value, param.name);
        const span = getOperatorSpan(index, param.arity);
        cursor.value = span.end + 1;
        return createFormalParam(
          resolveSynonym(param.name),
          param.arity,
          getSpanLocation(file, span),
          isAdded,
        );
      });
    };

    // The span of a definition or instance, with the LOCAL before it.
    const getDefinitionSpan = (definition: { location: SourceLocation; isLocal?: boolean }) => {
      const span = getUnitSpan(definition.location);
      return definition.isLocal &&
        !isToken(file, span.start, "LOCAL") &&
        isToken(file, span.start - 1, "LOCAL")
        ? { start: span.start - 1, end: span.end }
        : span;
    };

    const processOperator = (
      definition: OperatorDefinition,
      definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
    ) => {
      const span = getDefinitionSpan(definition);
      const location = getSpanLocation(file, span);
      const name = resolveSynonym(definition.name);
      const paramsSpan = { start: definition.isLocal ? span.start + 1 : span.start, end: span.end };
      const generated = withContext(createContext(), () => {
        const params = getParams(definition, paramsSpan, true);
        const existing = resolveSymbol(symbolTable, name);
        if (existing?.kind === "OpDef" && existing.inRecursive && !existing.isDefined) {
          // SANY compares only the arity of the last parameter.
          const isMatching =
            existing.params?.length === params.length &&
            (params.length === 0 || params[params.length - 1].arity === 0);
          if (existing.letInLevel !== state.curLevel) {
            addError(location, `Recursive operator ${name} defined at wrong LET/IN level.`);
          } else if (!isMatching) {
            addError(
              location,
              `Definition of ${existing.name} has different arity than its RECURSIVE declaration.`,
            );
          }
        } else if (existing !== undefined) {
          addError(location, `Operator ${name} already defined or declared.`);
        }
        labelSets.push(new Map());
        return { params, body: generateExpression(definition.body), existing };
      });
      const labels = popLabels();
      const existing = generated.existing;
      const params = generated.params;
      const preComments = getPreComments(file, span.start);
      if (
        existing?.kind === "OpDef" &&
        existing.inRecursive &&
        !existing.isDefined &&
        existing.letInLevel === state.curLevel
      ) {
        existing.params = params;
        existing.arity = params.length;
        existing.weights = params.map(() => 0);
        existing.maxLevels = params.map(() => TEMPORAL_LEVEL);
        existing.isLeibnizArg = params.map(() => true);
        existing.labels = labels;
        endOpDefNode(existing, generated.body, location, preComments);
        currentModule.definitions.push(existing);
        definitions?.push(existing);
        return;
      }
      const node = createOpDef({
        name,
        params,
        body: generated.body,
        isLocal: definition.isLocal,
        location,
        preComments,
        labels,
      });
      addSymbol(symbolTable, node);
      setRecursionFields(node);
      currentModule.definitions.push(node);
      definitions?.push(node);
    };

    const endOpDefNode = (
      node: OpDefNode,
      body: ExprNode,
      location: SanyLocation,
      preComments: string[],
    ) => {
      node.isDefined = true;
      node.body = body;
      node.location = location;
      node.preComments = preComments;
      if (node.inRecursive) {
        state.unresolvedCount[state.curLevel]--;
        state.unresolvedSum--;
      }
    };

    const processFunction = (
      definition: FunctionDefinition,
      definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
    ) => {
      const span = getDefinitionSpan(definition);
      const location = getSpanLocation(file, span);
      const context = createContext();
      const nameIndex = definition.isLocal ? span.start + 1 : span.start;
      const bounds = withContext(context, () => generateBounds(definition.bounds, nameIndex + 1));
      const existing = resolveSymbol(symbolTable, definition.name);
      const recursionParam = withContext(context, () =>
        createFormalParam(definition.name, 0, location, existing === undefined),
      );
      const node = applyBuiltin("$NonRecursiveFcnSpec", [], location, {
        unbounded: [recursionParam],
        ...bounds,
      });
      const isPendingRecursive =
        existing?.kind === "OpDef" && existing.inRecursive && !existing.isDefined;
      const isRecursive = isPendingRecursive && existing.letInLevel === state.curLevel;
      if (isRecursive) {
        if (existing.arity !== 0) {
          addError(
            location,
            `Function ${existing.name} has operator arguments in its RECURSIVE declaration.`,
          );
        }
      } else if (isPendingRecursive) {
        addError(location, `Recursive function ${definition.name} defined at wrong LET/IN level.`);
      } else if (existing !== undefined) {
        addError(location, `Function name \`${definition.name}' already defined or declared.`);
      }
      const preComments = getPreComments(file, span.start);
      const definitionNode = isRecursive
        ? existing
        : createOpDef({
            name: definition.name,
            params: [],
            body: node,
            isLocal: definition.isLocal,
            location,
            preComments,
          });
      if (isRecursive) endOpDefNode(existing, node, location, preComments);
      else if (existing === undefined) {
        addSymbol(symbolTable, definitionNode);
        setRecursionFields(definitionNode);
      }
      currentModule.definitions.push(definitionNode);
      definitions?.push(definitionNode);
      functions.unshift({ name: definition.name, node });
      labelSets.push(new Map());
      const body = withContext(context, () => generateExpression(definition.body));
      definitionNode.labels = popLabels();
      functions.shift();
      node.operands = [body];
      if (node.operator.name === "$NonRecursiveFcnSpec") node.unbounded = undefined;
    };

    const processRecursive = (declarations: Declaration[]) => {
      if (state.unresolvedSum === 0) state.recursiveSectionCount++;
      state.unresolvedCount[state.curLevel] += declarations.length;
      state.unresolvedSum += declarations.length;
      declarations.forEach((declaration) => {
        const span = getDeclarationSpan(declaration);
        // The OpDeclNode buildParameter makes of the declaration to read its name and arity.
        getId();
        const params = Array.from({ length: declaration.arity }, () =>
          createFormalParam("", 0, undefined, false),
        );
        const node = createOpDef({
          name: resolveSynonym(declaration.name),
          params,
          location: getSpanLocation(file, span),
          isDefined: false,
          inRecursive: true,
          inRecursiveSection: true,
          recursiveSection: state.recursiveSectionCount,
          letInLevel: state.curLevel,
        });
        addSymbol(symbolTable, node);
        currentModule.opDefsInRecursiveSection.push(node);
      });
    };

    const checkForUndefinedRecursiveOps = () => {
      if (state.unresolvedCount[state.curLevel] > 0) {
        state.unresolvedSum -= state.unresolvedCount[state.curLevel];
      }
    };

    // SubstInNode's constructor and processSubst: an implicit substitution for each declaration of
    // the instantiated module whose name the instantiating module can resolve, in the order of the
    // instantiated module's Hashtable, then the explicit WITH substitutions.
    const processSubstitutions = (
      instance: Instance,
      instanceeContext: Context,
      location: SanyLocation,
    ) => {
      // The SubstInNode processSubst creates to hold the substitutions, which only their
      // templates use.
      getId();
      const declarations = getHashtableValues(instanceeContext.table).filter(
        (symbol): symbol is OpDeclNode => symbol.kind === "OpDecl",
      );
      const substs: Subst[] = declarations.flatMap((declaration) => {
        const symbol = resolveSymbol(symbolTable, declaration.name);
        if (symbol === undefined) return [];
        const isExpression =
          declaration.declKind === VARIABLE_DECL_KIND ||
          (declaration.declKind === CONSTANT_DECL_KIND && declaration.arity === 0);
        return [
          {
            op: declaration,
            expr: isExpression ? createOpAppl(symbol, [], location) : createOpArg(symbol, location),
            isImplicit: true,
          },
        ];
      });
      // Generator.checkSubstitutionForCorrectArity.
      const checkArity = (target: OpDeclNode, expr: ExprOrOpArgNode) => {
        const arity = expr.kind === "OpArg" ? getSymbolArity(expr.op) : 0;
        if (arity !== target.arity) {
          addError(
            expr.location,
            `An operator must be substituted for symbol '${target.name}', and it must have arity ${target.arity}.`,
          );
        }
      };
      const span = getDefinitionSpan(instance);
      // The targets follow WITH, after the parameters of a definition that instantiates.
      const cursor = { value: findToken(file, span.start, span.end, "WITH") + 1 };
      instance.substitutions.forEach((substitution) => {
        const targetIndex = findToken(file, cursor.value, span.end, substitution.name);
        if (targetIndex !== -1) cursor.value = targetIndex + 1;
        const target = getContextSymbol(instanceeContext, resolveSynonym(substitution.name));
        if (target?.kind !== "OpDecl") {
          addError(
            targetIndex === -1 ? location : getTokenLocation(file, targetIndex),
            `Identifier '${substitution.name}' is not a legal target of a substitution. \nA legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. \n(Also, check for warnings about multiple declarations of this same identifier.)`,
          );
          return;
        }
        const expr =
          target.arity === 0
            ? generateExpression(substitution.expression)
            : generateOperatorArgument(substitution.expression, target.arity);
        checkArity(target, expr);
        const existing = substs.find((subst) => subst.op.name === target.name);
        if (existing && !existing.isImplicit) {
          addError(
            getLocation(substitution.expression),
            `Multiple substitutions for symbol '${target.name}' in substitution.`,
          );
        } else if (existing) {
          existing.expr = expr;
          existing.isImplicit = false;
        } else substs.push({ op: target, expr, isImplicit: false });
      });
      // TLC 1.7.4's SANY checks the arity of only the substitutions that the INSTANCE writes.
      substs
        .filter((subst) => subst.isImplicit && options.version !== "1.7.4")
        .forEach((subst) => checkArity(subst.op, subst.expr));
      // SubstInNode.matchAll.
      declarations
        .filter((declaration) => !substs.some((subst) => subst.op.name === declaration.name))
        .forEach((declaration) =>
          addError(
            location,
            `Substitution missing for symbol ${declaration.name} declared at ${formatSanyLocation(declaration.location)} \nand instantiated in module ${currentModule.name}.`,
          ),
        );
      return substs;
    };

    const createSubstIn = (
      kind: "SubstIn" | "APSubstIn",
      substs: Subst[],
      body: LevelNode,
      instantiatedModule: ModuleNode,
      location: SanyLocation,
      instantiatingModule = currentModule,
    ): SubstInNode => {
      if (isAbsent(body)) {
        addError(
          location,
          kind === "SubstIn"
            ? "Substitution error, probably due to error \nin module being instantiated."
            : "Substitution error, probably due to error in module being instantiated.",
        );
      }
      return {
        ...createLevelFields(getId()),
        kind,
        substs,
        body,
        instantiatingModule,
        instantiatedModule,
        location,
      };
    };

    const processModuleDefinition = (
      instance: Instance,
      definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
      instances: InstanceNode[] | undefined,
    ) => {
      const span = getDefinitionSpan(instance);
      const location = getSpanLocation(file, span);
      const preComments = getPreComments(file, span.start);
      const name = instance.name ?? "";
      const parameterContext = createContext();
      const nameIndex = instance.isLocal ? span.start + 1 : span.start;
      if (instance.params.length > 0) symbolTable.contexts.push(parameterContext);
      const args = getParams(
        instance,
        { start: nameIndex, end: span.end },
        instance.params.length > 0,
      );
      const instanceeModule = getModule(instance.module);
      const instanceeContext = instanceeModule.context;
      const substs = processSubstitutions(instance, instanceeContext, location);
      if (instance.params.length > 0) symbolTable.contexts.pop();
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "OpDef" || symbol.isLocal) return;
        if (symbol.defKind !== "UserDefined" && symbol.defKind !== "ModuleInstance") return;
        const params = [...args, ...(symbol.params ?? [])];
        const qualifiedName = `${name}!${symbol.name}`;
        const node =
          symbol.defKind === "UserDefined"
            ? createOpDef({
                name: qualifiedName,
                params,
                body:
                  substs.length > 0 && symbol.body
                    ? createSubstIn("SubstIn", substs, symbol.body, instanceeModule, location)
                    : symbol.body,
                isLocal: instance.isLocal,
                location,
                source: symbol.source ?? symbol,
                preComments,
                labels: symbol.labels,
              })
            : createOpDef({
                defKind: "ModuleInstance",
                name: qualifiedName,
                params,
                isLocal: instance.isLocal,
                location,
                module: symbol.module,
                source: symbol.source ?? symbol,
                preComments,
              });
        addSymbol(symbolTable, node);
        if (symbol.defKind === "UserDefined") setRecursionFields(node);
        (definitions ?? currentModule.definitions).push(node);
      });
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "ThmOrAssumpDef" || symbol.isLocal) return;
        // SANY creates the APSubstInNode before the ThmOrAssumpDefNode that holds it.
        const body =
          substs.length > 0
            ? createSubstIn("APSubstIn", substs, symbol.body, instanceeModule, location)
            : symbol.body;
        const node: ThmOrAssumpDefNode = {
          ...createLevelFields(getId()),
          kind: "ThmOrAssumpDef",
          name: `${name}!${symbol.name}`,
          isTheorem: symbol.isTheorem,
          body,
          params: [...args, ...symbol.params],
          isLocal: instance.isLocal,
          location,
          module: currentModule,
          labels: symbol.labels,
          isLeibnizArg: [],
          isLeibniz: false,
          opLevelCond: [],
          maxLevels: [],
          minMaxLevel: [],
        };
        addSymbol(symbolTable, node);
        (definitions ?? currentModule.definitions).push(node);
      });
      const instanceNode: InstanceNode = {
        ...createLevelFields(getId()),
        kind: "Instance",
        name,
        isLocal: instance.isLocal,
        params: args,
        module: instanceeModule,
        substs,
        location,
      };
      (instances ?? currentModule.topLevel).push(instanceNode);
      const moduleDefinition = createOpDef({
        defKind: "ModuleInstance",
        name,
        params: args,
        isLocal: instance.isLocal,
        location,
        preComments,
      });
      addSymbol(symbolTable, moduleDefinition);
      // TLC 1.7.4's SANY leaves the definition out of the definitions of a LET.
      if (options.version !== "1.7.4") definitions?.push(moduleDefinition);
    };

    // generateInstance: an INSTANCE step of a proof is located at the step's body and adds no
    // theorem definitions or instance to the module.
    const generateInstance = (
      instance: Instance,
      isTopLevel = true,
      stepLocation: SanyLocation | undefined = undefined,
    ) => {
      const span = getDefinitionSpan(instance);
      const location = stepLocation ?? getSpanLocation(file, span);
      const preComments = getPreComments(file, span.start);
      const instanceeModule = getModule(instance.module);
      const instanceeContext = instanceeModule.context;
      const substs = processSubstitutions(instance, instanceeContext, location);
      const isLocal = instance.isLocal;
      const isInstanceeParameterFree = isParameterFree(instanceeModule);
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "OpDef" || symbol.defKind !== "UserDefined" || symbol.isLocal) return;
        const copyFrom = (module: ModuleNode | undefined, body: ExprNode | undefined) => {
          const node = createOpDef({
            name: symbol.name,
            params: symbol.params,
            body,
            isLocal,
            location,
            module,
            source: symbol.source ?? symbol,
            preComments,
            labels: symbol.labels,
          });
          addSymbol(symbolTable, node);
          return node;
        };
        const reuse = () => {
          addSymbol(symbolTable, symbol);
          return symbol;
        };
        const isOriginParameterFree = symbol.module === undefined || isParameterFree(symbol.module);
        const node = !isInstanceeParameterFree
          ? isOriginParameterFree
            ? isLocal
              ? copyFrom(symbol.module, symbol.body)
              : reuse()
            : copyFrom(
                currentModule,
                symbol.body &&
                  createSubstIn("SubstIn", substs, symbol.body, instanceeModule, location),
              )
          : isLocal
            ? copyFrom(symbol.module, symbol.body)
            : reuse();
        currentModule.definitions.push(node);
        setRecursionFields(node);
      });
      // SANY reuses a theorem of a parameter-free module without adding it to the symbol table
      // when the instantiated module has parameters.
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "ThmOrAssumpDef" || symbol.isLocal) return;
        const copyFrom = (module: ModuleNode, body: LevelNode) => {
          const node: ThmOrAssumpDefNode = {
            ...symbol,
            ...createLevelFields(getId()),
            body,
            isLocal,
            location,
            module,
          };
          addSymbol(symbolTable, node);
          return node;
        };
        const reuse = () => {
          addSymbol(symbolTable, symbol);
          return symbol;
        };
        const node = !isInstanceeParameterFree
          ? isParameterFree(symbol.module)
            ? isLocal
              ? copyFrom(currentModule, symbol.body)
              : symbol
            : copyFrom(
                currentModule,
                createSubstIn("APSubstIn", substs, symbol.body, instanceeModule, location),
              )
          : isLocal
            ? copyFrom(symbol.module, symbol.body)
            : reuse();
        if (isTopLevel) currentModule.definitions.push(node);
      });
      const instanceNode: InstanceNode = {
        ...createLevelFields(getId()),
        kind: "Instance",
        name: undefined,
        isLocal,
        params: [],
        module: instanceeModule,
        substs,
        location,
      };
      if (isTopLevel) currentModule.topLevel.push(instanceNode);
      return instanceNode;
    };

    const getFactModule = (name: string) => {
      const module =
        resolveModule(name) ?? (name === currentModule.name ? currentModule : undefined);
      if (module === undefined) {
        throw new TlaSyntaxError(`Module \`${name}' used without being extended or instantiated.`);
      }
      return module;
    };

    // A fact is a module, or an expression such as the name of a theorem; a DEF names a defined
    // operator, theorem or assumption, or a module.
    const generateFacts = (facts: Fact[]) =>
      facts.map((fact): FactNode => {
        if (fact.kind !== "ModuleFact") {
          const items = getSelectorItems(fact);
          if (items === undefined || !isGeneralId(items)) return generateExpression(fact);
          const node = generateSelector(fact, 0, true, false);
          if (node.kind === "ThmOrAssumpDef") throw new TlaSyntaxError("Expected a fact");
          return node;
        }
        return getFactModule(fact.name);
      });

    const generateDefs = (defs: Fact[]) =>
      defs.flatMap((fact): UseOrHideNode["defs"] => {
        if (fact.kind === "ModuleFact") return [getFactModule(fact.name)];
        const symbol = generateSelector(
          fact.kind === "OperatorReference"
            ? { kind: "Identifier", name: fact.operator, location: fact.location }
            : fact,
          -1,
          false,
          true,
        );
        // SANY rejects the name of a proof step in a DEF clause, and leaves out an entry it rejects.
        // Errors.addMessage drops the message when selectorToNode already reported it.
        const isDefinition =
          symbol.kind === "OpDef" ||
          (symbol.kind === "ThmOrAssumpDef" && !symbol.name.startsWith("<"));
        if (!isDefinition) {
          addError(getLocation(fact), "DEF clause entry should describe a defined operator.");
          return [];
        }
        return [symbol];
      });

    const generateUseOrHide = (use: UseOrHide): UseOrHideNode => {
      const facts = generateFacts(use.facts);
      const defs = generateDefs(use.defs);
      const location = getSpanLocation(file, getUnitSpan(use.location));
      if (facts.length + defs.length === 0) addError(location, "Empty USE or HIDE statement.");
      // UseOrHideNode.factCheck, after SANY generates the node: a HIDE cites facts by name only.
      if (use.kind === "Hide") {
        facts
          .filter((fact) => fact.kind === "OpAppl" && fact.operator.kind !== "ThmOrAssumpDef")
          .forEach((fact) =>
            addError(
              fact.location,
              "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
            ),
          );
      }
      return {
        ...createLevelFields(getId()),
        kind: "UseOrHide",
        facts,
        defs,
        isOnly: use.isOnly,
        isHide: use.kind === "Hide",
        location,
      };
    };

    // generateNewSymb: the set is generated before the symbol is declared.
    const generateNewSymbol = (symbol: NewSymbol): NewSymbNode => {
      const span = getUnitSpan(symbol.location);
      const set = symbol.set && generateExpression(symbol.set);
      const nameIndex = findNameOrKeyword(span.start, symbol.name);
      const kind = NEW_SYMBOL_KINDS[symbol.level];
      const declaration: OpDeclNode = {
        ...createLevelFields(getId()),
        levelChecked: 1,
        level: kind.level,
        kind: "OpDecl",
        name: resolveSynonym(symbol.name),
        arity: symbol.arity,
        declKind: kind.declKind,
        location: getSpanLocation(file, getOperatorSpan(nameIndex, symbol.arity)),
        module: currentModule,
      };
      addSymbol(symbolTable, declaration);
      return {
        ...createLevelFields(getId()),
        kind: "NewSymb",
        declaration,
        set,
        location: getSpanLocation(file, span),
      };
    };

    // generateAssumeProve: an ASSUME/PROVE nested in another one has a context of its own.
    const generateAssumeProve = (
      assumeProve: AssumeProve,
      depth: number,
      goal?: { isSuffices: boolean },
    ): AssumeProveNode => {
      const span = getUnitSpan(assumeProve.location);
      const isBoxed = isBoxToken(file, span.start - 1);
      const conclusionStart = getExpressionSpan(file, assumeProve.conclusion).start;
      const proveIndex = file.tokens.findLastIndex(
        (token, index) =>
          index < conclusionStart && token.kind === "Keyword" && token.text === "PROVE",
      );
      if (isBoxed !== isBoxToken(file, proveIndex - 1)) {
        throw new TlaSyntaxError(
          isBoxed
            ? "[]ASSUME matched by PROVE instead of []PROVE"
            : "ASSUME matched by []PROVE instead of PROVE",
        );
      }
      // SANY creates the AssumeProveNode, numbering it, before it generates its clauses.
      const id = getId();
      if (depth > 1) symbolTable.contexts.push(createContext());
      if (isBoxed && symbolTable.contexts.some((context) => assumeContexts.has(context))) {
        throw new TlaSyntaxError(
          "[]ASSUME used within the scope of an ordinary ASSUME's assumptions",
        );
      }
      if (!isBoxed) assumeContexts.add(getTopContext(symbolTable));
      const scope: AssumeProveScope = {
        isDeclaredBefore: [false],
        hasGoal: goal !== undefined,
        isSuffices: goal?.isSuffices ?? false,
        isInProof: true,
      };
      assumeProveState.depth = depth;
      assumeProveState.isDeclared[depth] = false;
      if (depth === 1) {
        assumeProveState.goal = goal && scope;
        assumeProveState.goalClause = 0;
      }
      const assumptions = assumeProve.assumptions.map((assumption, index): LevelNode => {
        const isNew = assumption.kind === "NewSymbol";
        const node =
          assumption.kind === "AssumeProve"
            ? generateAssumeProve(assumption, depth + 1)
            : isNew
              ? generateNewSymbol(assumption)
              : generateExpression(assumption);
        assumeProveState.depth = depth;
        if (isNew) assumeProveState.isDeclared[depth] = true;
        scope.isDeclaredBefore.push(scope.isDeclaredBefore[index] || isNew);
        if (depth === 1) assumeProveState.goalClause++;
        return node;
      });
      const conclusion = generateExpression(assumeProve.conclusion);
      if (depth > 1) symbolTable.contexts.pop();
      assumeProveState.depth = depth - 1;
      if (depth === 1) assumeProveState.goal = undefined;
      const node: AssumeProveNode = {
        ...createLevelFields(id),
        kind: "AssumeProve",
        assumptions,
        goal: conclusion,
        isSuffices: scope.isSuffices,
        isBoxed,
        location: getSpanLocation(file, {
          start: isBoxed ? span.start - 1 : span.start,
          end: span.end,
        }),
      };
      assumeProveScopes.set(node, scope);
      return node;
    };

    // SANY creates the ThmOrAssumpDefNode of a named theorem or proof step, numbering it, before it
    // generates what it asserts.
    const createTheoremDefinition = (
      id: number,
      name: string,
      body: LevelNode,
      location: SanyLocation,
      labels: Map<string, LabelNode>,
      isTheorem = true,
    ): ThmOrAssumpDefNode => ({
      ...createLevelFields(id),
      kind: "ThmOrAssumpDef",
      name,
      isTheorem,
      body,
      params: [],
      isLocal: false,
      location,
      module: currentModule,
      labels,
      isLeibnizArg: [],
      isLeibniz: false,
      opLevelCond: [],
      maxLevels: [],
      minMaxLevel: [],
    });

    const generateLeafProof = (proof: Exclude<Proof, { kind: "Steps" }>): LeafProofNode => {
      const facts = proof.kind === "By" ? generateFacts(proof.facts) : [];
      const defs = proof.kind === "By" ? generateDefs(proof.defs) : [];
      // SANY reads a BY proof's facts and definitions from the UseOrHideNode it makes of them.
      if (proof.kind === "By") getId();
      const location = getSpanLocation(file, getUnitSpan(proof.location));
      if (proof.kind === "By" && facts.length + defs.length === 0) addError(location, "Empty BY");
      return {
        ...createLevelFields(getId()),
        kind: "LeafProof",
        facts,
        defs,
        isOmitted: proof.kind === "Omitted",
        isOnly: proof.kind === "By" && proof.isOnly,
        location,
      };
    };

    const generateStepBody = (step: ProofStep, bodySpan: TokenSpan) => {
      const body = step.body;
      const bodyLocation = getSpanLocation(file, bodySpan);
      switch (body.kind) {
        case "Have":
          return {
            node: applyBuiltin("$Have", [generateExpression(body.expression)], bodyLocation),
            isPick: false,
          };
        case "Case":
          return {
            node: applyBuiltin("$Pfcase", [generateExpression(body.expression)], bodyLocation),
            isPick: false,
          };
        case "Witness":
          return {
            node: applyBuiltin("$Witness", body.expressions.map(generateExpression), bodyLocation),
            isPick: false,
          };
        case "Qed":
          return { node: applyBuiltin("$Qed", [], bodyLocation), isPick: false };
        case "Take":
        case "Pick": {
          const isPick = body.kind === "Pick";
          const name = isPick ? "$Pick" : "$Take";
          if (isPick) symbolTable.contexts.push(createContext());
          const getOperands = () => (body.kind === "Pick" ? [generateExpression(body.body)] : []);
          if (body.bounds.length > 0) {
            const bounds = generateBounds(body.bounds, bodySpan.start);
            const operands = getOperands();
            return { node: applyBuiltin(name, operands, bodyLocation, bounds), isPick };
          }
          const indexes = findNameTokens(file, bodySpan.start, bodySpan.end + 1, body.names);
          const unbounded = body.names.map((paramName, index) =>
            createFormalParam(paramName, 0, getTokenLocation(file, indexes[index]), true),
          );
          const operands = getOperands();
          return { node: applyBuiltin(name, operands, bodyLocation, { unbounded }), isPick };
        }
      }
      return undefined;
    };

    // An expression SANY parses as N_InfixExpr: a binary operator between its operands.
    const isInfixExpression = (expression: Expression) => {
      if ((expression.kind === "And" || expression.kind === "Or") && !expression.isBulleted)
        return true;
      if (expression.kind !== "Apply" || expression.args.length !== 2) return false;
      const left = getParenthesizedSpan(file, getExpressionSpan(file, expression.args[0]));
      const start = getExpressionSpan(file, expression).start;
      return left.start === start && !isToken(file, left.end + 1, "(");
    };

    // generateProof: a proof's steps share a context, into which the step names, the symbols of
    // a TAKE or PICK, and the NEW symbols of a SUFFICES ASSUME go.
    const generateProof = (proof: Proof): LeafProofNode | NonLeafProofNode => {
      if (proof.kind !== "Steps") return generateLeafProof(proof);
      const proofContext = createContext();
      symbolTable.contexts.push(proofContext);
      const instances: InstanceNode[] = [];
      const sufficesContexts: Context[] = [];
      // An assertion step @ = e continues the infix assertion of the step before it, whose right
      // side the @ stands for.
      const infixStep: { previousRight: ExprOrOpArgNode | undefined } = {
        previousRight: undefined,
      };
      // A DEFINE, USE, HIDE or INSTANCE step.
      const generateOtherStep = (
        body: ProofStep["body"],
        stepSpan: TokenSpan,
        bodySpan: TokenSpan,
      ): DefStepNode | UseOrHideNode | InstanceNode | undefined => {
        if (body.kind === "Define") {
          const defs = body.definitions.map((definition) => {
            const defined: (OpDefNode | ThmOrAssumpDefNode)[] = [];
            if (definition.kind === "Instance")
              processModuleDefinition(definition, defined, instances);
            else if (definition.kind === "Function") processFunction(definition, defined);
            else processOperator(definition, defined);
            const last = defined[definition.kind === "Instance" ? defined.length - 1 : 0];
            if (last?.kind !== "OpDef")
              throw new TlaSyntaxError("A DEFINE step defines no operator");
            return last;
          });
          return {
            ...createLevelFields(getId()),
            kind: "DefStep",
            defs,
            location: getSpanLocation(file, bodySpan),
          };
        }
        if (body.kind === "Use" || body.kind === "Hide") {
          return { ...generateUseOrHide(body), location: getSpanLocation(file, stepSpan) };
        }
        if (body.kind === "Instance") {
          return generateInstance(body, false, getSpanLocation(file, bodySpan));
        }
        return undefined;
      };
      const steps = proof.steps.map((step): ProofStepNode => {
        const stepSpan = getUnitSpan(step.location);
        const headSpan = getRangeSpan(file, step.head);
        const bodySpan = { start: headSpan.start + 1, end: headSpan.end };
        const body = step.body;
        if (step.name !== undefined) labelSets.push(new Map());
        const definitionId = step.name === undefined ? undefined : getId();
        if (body.kind !== "Assert") infixStep.previousRight = undefined;
        const otherStep = generateOtherStep(body, stepSpan, bodySpan);
        if (otherStep !== undefined) {
          // SANY puts a NumberedProofStep definition for a named step that asserts nothing in the
          // symbol table, for a DEF clause to name.
          if (step.name !== undefined) {
            addSymbol(
              symbolTable,
              createOpDef({
                defKind: "NumberedProofStep",
                name: step.name,
                location: getSpanLocation(file, stepSpan),
                labels: popLabels(),
                step: otherStep,
              }),
            );
          }
          return otherStep;
        }
        const isAssumeProve = body.kind === "Assert" && body.statement.kind === "AssumeProve";
        if (isAssumeProve) infixStep.previousRight = undefined;
        const isSuffices = body.kind === "Assert" && body.isSuffices;
        const assumeContext = createContext();
        const generateAssertion = (statement: Expression | AssumeProve): LevelNode => {
          if (statement.kind === "AssumeProve") {
            const node = withContext(assumeContext, () =>
              generateAssumeProve(
                statement,
                1,
                step.name === undefined ? undefined : { isSuffices },
              ),
            );
            node.isSuffices = isSuffices;
            return node;
          }
          if (isSuffices) {
            const expression = generateExpression(statement);
            return applyBuiltin("$Suffices", [expression], getSpanLocation(file, bodySpan));
          }
          const previousRight = infixStep.previousRight;
          const isAtStep =
            previousRight !== undefined &&
            statement.kind === "Apply" &&
            isInfixExpression(statement) &&
            statement.args[0].kind === "ExceptAt";
          // SANY generates an @ step's right side before the $Nop that stands for its @.
          const atRight = isAtStep ? generateExpression(statement.args[1]) : undefined;
          const expression = isAtStep
            ? createOpAppl(
                resolveName(statement.operator, getLocation(statement)),
                [applyBuiltin("$Nop", [previousRight], getLocation(statement.args[0])), atRight],
                getLocation(statement),
              )
            : generateExpression(statement);
          const right = expression.kind === "OpAppl" ? expression.operands[1] : undefined;
          infixStep.previousRight = isInfixExpression(statement) ? right : undefined;
          return expression;
        };
        const generated =
          body.kind === "Assert"
            ? { node: generateAssertion(body.statement), isPick: false }
            : generateStepBody(step, bodySpan);
        if (generated === undefined) throw new TlaSyntaxError(`Unexpected proof step ${body.kind}`);
        const pickContext = generated.isPick ? symbolTable.contexts.pop() : undefined;
        const definition =
          step.name === undefined || definitionId === undefined
            ? undefined
            : createTheoremDefinition(
                definitionId,
                step.name,
                generated.node,
                getTokenLocation(file, getTokenIndex(file, step.location)),
                popLabels(),
              );
        if (definition) addSymbol(symbolTable, definition);
        const isScoped = isAssumeProve && !isSuffices;
        if (isScoped) symbolTable.contexts.push(assumeContext);
        const stepProof = step.proof && generateProof(step.proof);
        if (isScoped) symbolTable.contexts.pop();
        endProof(generated.node);
        if (isAssumeProve && isSuffices) {
          sufficesContexts.push(assumeContext);
          symbolTable.contexts.push(assumeContext);
        }
        pickContext?.symbols.forEach((symbol) => addSymbol(symbolTable, symbol));
        return {
          ...createLevelFields(getId()),
          kind: "Theorem",
          definition,
          body: generated.node,
          proof: stepProof,
          isSuffices,
          location: getSpanLocation(file, stepSpan),
        };
      });
      sufficesContexts.forEach(() => {
        symbolTable.contexts.pop()?.symbols.forEach((symbol) => addToContext(proofContext, symbol));
      });
      symbolTable.contexts.pop();
      return {
        ...createLevelFields(getId()),
        kind: "NonLeafProof",
        steps,
        instances,
        proofLevel: proof.level,
        location: getSpanLocation(file, getUnitSpan(proof.location)),
      };
    };

    // processTheorem: a theorem's ASSUME/PROVE has a context of its own, which its proof sees and
    // its definition does not.
    const processTheorem = (theorem: Theorem) => {
      const location = getSpanLocation(file, getUnitSpan(theorem.location));
      const statement = theorem.statement;
      const assumeContext = createContext();
      if (theorem.name !== undefined) labelSets.push(new Map());
      const definitionId = theorem.name === undefined ? undefined : getId();
      if (statement.kind === "AssumeProve") symbolTable.contexts.push(assumeContext);
      const body =
        statement.kind === "AssumeProve"
          ? generateAssumeProve(
              statement,
              1,
              theorem.name === undefined ? undefined : { isSuffices: false },
            )
          : generateExpression(statement);
      const definition =
        theorem.name === undefined || definitionId === undefined
          ? undefined
          : createTheoremDefinition(definitionId, theorem.name, body, location, popLabels());
      if (definition) {
        if (statement.kind === "AssumeProve") symbolTable.contexts.pop();
        addSymbol(symbolTable, definition);
        currentModule.definitions.push(definition);
        if (statement.kind === "AssumeProve") symbolTable.contexts.push(assumeContext);
      }
      const proof = theorem.proof && generateProof(theorem.proof);
      if (statement.kind === "AssumeProve") symbolTable.contexts.pop();
      endProof(body);
      const node: TheoremNode = {
        ...createLevelFields(getId()),
        kind: "Theorem",
        definition,
        body,
        proof,
        isSuffices: false,
        location,
      };
      currentModule.topLevel.push(node);
    };

    const processAssumption = (assumption: Assumption) => {
      const span = getUnitSpan(assumption.location);
      const location = getSpanLocation(file, span);
      if (assumption.name !== undefined) labelSets.push(new Map());
      const body = generateExpression(assumption.expression);
      const definition =
        assumption.name === undefined
          ? undefined
          : createTheoremDefinition(getId(), assumption.name, body, location, popLabels(), false);
      if (definition) {
        addSymbol(symbolTable, definition);
        currentModule.definitions.push(definition);
      }
      const node: AssumeNode = {
        ...createLevelFields(getId()),
        kind: "Assume",
        definition,
        body,
        location,
      };
      currentModule.topLevel.push(node);
    };

    // A declared operator or operator parameter is located with its arguments: F(_, _), _ + _,
    // -. _ or _ ^+.
    const getOperatorSpan = (start: number, arity: number) => {
      if (arity === 0) return { start, end: start };
      if (isToken(file, start, "_")) {
        return { start, end: isToken(file, start + 2, "_") ? start + 2 : start + 1 };
      }
      if (isToken(file, start + 1, "(")) return { start, end: getMatchingIndex(file, start + 1) };
      return { start, end: isToken(file, start + 1, "_") ? start + 1 : start };
    };

    const getDeclarationSpan = (declaration: Declaration) =>
      getOperatorSpan(getUnitSpan(declaration.location).start, declaration.arity);

    const createDeclaration = (declaration: Declaration, declKind: number): OpDeclNode => {
      const span = getDeclarationSpan(declaration);
      const node: OpDeclNode = {
        ...createLevelFields(getId()),
        levelChecked: 1,
        level: declKind === VARIABLE_DECL_KIND ? 1 : 0,
        kind: "OpDecl",
        name: resolveSynonym(declaration.name),
        arity: declaration.arity,
        declKind,
        location: getSpanLocation(file, span),
        module: currentModule,
      };
      if (declKind === CONSTANT_DECL_KIND) {
        node.levelParams.add(node);
        node.allParams.add(node);
      }
      addSymbol(symbolTable, node);
      return node;
    };

    // processExtendsList: the extended module's symbols join this module's context in the order
    // they joined the extended module's, apart from LOCAL ones and those already present.
    ast.extends.forEach((name) => {
      const extendee = getModule(name);
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
          unit.declarations.forEach((declaration) =>
            createDeclaration(declaration, VARIABLE_DECL_KIND),
          );
          break;
        case "Constants":
          unit.declarations.forEach((declaration) =>
            createDeclaration(declaration, CONSTANT_DECL_KIND),
          );
          break;
        case "Recursive":
          processRecursive(unit.declarations);
          break;
        case "Definition":
          if (unit.definition.kind === "Function") processFunction(unit.definition, undefined);
          else processOperator(unit.definition, undefined);
          break;
        case "Instance":
          if (unit.instance.name === undefined) generateInstance(unit.instance);
          else processModuleDefinition(unit.instance, undefined, undefined);
          break;
        case "Assumption":
          processAssumption(unit.assumption);
          break;
        case "Theorem":
          processTheorem(unit.theorem);
          break;
        case "Use":
          currentModule.topLevel.push(generateUseOrHide(unit.use));
          break;
        case "Module": {
          const innerTable = { contexts: [...symbolTable.contexts, createContext()] };
          const inner = generateModule(unit.module, file, currentModule, innerTable);
          // SymbolTable.addModule: an inner module's name must not be taken by another module,
          // inner or external.
          const binding = resolveModule(inner.name);
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
    checkForUndefinedRecursiveOps();
    return currentModule;
  };

  const modules = order.map((name) => {
    options.onAnalyze?.(name);
    // Each module's Generator creates its nullODN, nullOAN, nullOpArg and nullLabelNode.
    nullApplication.id = Array.from({ length: 4 }, getId)[1];
    const entry = getSource(name, undefined);
    const context = createContext();
    // A module's context starts as a copy of SANY's global context of builtins, whose list of
    // symbols runs from the last builtin to the first.
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

type LetUnit =
  | { kind: "Recursive"; declarations: Declaration[] }
  | { kind: "Instance"; instance: Instance }
  | { kind: "Definition"; definition: Definition };

const getNumeralValue = (text: string) => {
  const lower = text.toLowerCase();
  const radix = lower.startsWith("\\b")
    ? 2
    : lower.startsWith("\\o")
      ? 8
      : lower.startsWith("\\h")
        ? 16
        : 10;
  const digits = radix === 10 ? lower : lower.slice(2);
  return [...digits]
    .reduce((value, digit) => value * BigInt(radix) + BigInt(parseInt(digit, radix)), 0n)
    .toString();
};

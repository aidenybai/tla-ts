import { TEMPORAL_LEVEL } from "../levels";
import type { TlcVersion } from "../tlc/version";
import type { Expression, SourceLocation } from "../ast";
import { TlaSyntaxError, TlaUnsupportedError } from "../errors";
import { BUILTIN_LOCATION, createLevelFields } from "./builtins";
import {
  addToContext,
  type AssumeProveNode,
  CONSTANT_DECL_KIND,
  type Context,
  type ExprNode,
  type ExprOrOpArgNode,
  type FormalParamNode,
  formatSanyLocation,
  getContextModule,
  getContextSymbol,
  getDeclarations,
  getSymbolArity,
  type LabelNode,
  type LevelNode,
  type ModuleNode,
  type OpApplNode,
  type OpArgNode,
  type OpDefNode,
  type SanyLocation,
  type SymbolNode,
  VARIABLE_DECL_KIND,
} from "./nodes";
import { createSelectorResolver } from "./selectors";
import {
  getExpressionSpan,
  getRangeSpan,
  getSpanLocation,
  getTokenIndex,
  type SourceFile,
} from "./source";
import { SANY_OPERATOR_SYNONYMS } from "../tlc/jar-data";

const SYNONYMS = new Map(
  SANY_OPERATOR_SYNONYMS.flatMap(([canonical, ...synonyms]) =>
    synonyms.map((synonym) => [synonym, canonical]),
  ),
);

export const resolveSynonym = (name: string) =>
  name
    .split("!")
    .map((part) => SYNONYMS.get(part) ?? (part === "~" ? "\\lnot" : part))
    .join("!");

export interface AssumeProveScope {
  isDeclaredBefore: boolean[];
  hasGoal: boolean;
  isSuffices: boolean;
  isInProof: boolean;
}

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

interface OpApplBinding {
  unbounded?: FormalParamNode[];
  bounded?: FormalParamNode[][];
  tupleOrs?: boolean[];
  ranges?: ExprNode[];
}

export const getTopContext = (contexts: Context[]) => contexts[contexts.length - 1];

export const resolveSymbol = (contexts: Context[], name: string) => {
  for (let index = contexts.length - 1; index >= 0; index--) {
    const symbol = getContextSymbol(contexts[index], name);
    if (symbol) return symbol;
  }
  return undefined;
};

const getSymbolKind = (symbol: SymbolNode) =>
  symbol.kind === "OpDecl"
    ? `${symbol.kind}${symbol.declKind}`
    : symbol.kind === "OpDef"
      ? symbol.defKind
      : symbol.kind;

export const isSameOrigin = (symbol: SymbolNode, other: SymbolNode) => {
  if (symbol.kind === "OpDef" && other.kind === "OpDef") {
    const source = symbol.source ?? symbol;
    if (source !== (other.source ?? other)) return false;
    return source.module === undefined || isParameterFree(source.module);
  }
  if (symbol.kind === "ThmOrAssumpDef" && other.kind === "ThmOrAssumpDef") {
    const source = symbol.source ?? symbol;
    return source === (other.source ?? other) && isParameterFree(source.module);
  }
  return false;
};

export const isParameterFree = (module: ModuleNode) =>
  getDeclarations(module, CONSTANT_DECL_KIND).length === 0 &&
  getDeclarations(module, VARIABLE_DECL_KIND).length === 0;

interface LabelScope {
  labels: Map<string, LabelNode>;
  params: FormalParamNode[][];
}

export interface ModuleGeneration {
  version: TlcVersion | undefined;
  addError: (location: SanyLocation | string | undefined, text: string) => void;
  addWarning: (location: SanyLocation | undefined, text: string) => void;
  getId: () => number;
  builtinsByName: Map<string, OpDefNode>;
  externalModules: Map<string, ModuleNode>;
  nullApplicationId: number;
  file: SourceFile;
  contexts: Context[];
  currentModule: ModuleNode;
  curLevel: number;
  unresolvedCount: number[];
  unresolvedSum: number;
  recursiveSectionCount: number;
  functions: { name: string; node: OpApplNode }[];
  exceptStack: OpApplNode[];
  exceptSpecStack: OpApplNode[];
  labelScopes: LabelScope[];
  assumeContexts: WeakSet<Context>;
  assumeProveState: AssumeProveState;
  assumeProveScopes: WeakMap<AssumeProveNode, AssumeProveScope>;
  labelGoals: WeakMap<LabelNode, LabelGoal>;
  recursiveDeclarations: OpDefNode[];
  selectorToNode: ReturnType<typeof createSelectorResolver>;
}

export const addSymbol = (generation: ModuleGeneration, symbol: SymbolNode) => {
  const binding = resolveSymbol(generation.contexts, symbol.name);
  if (binding === symbol) return;
  if (binding === undefined) {
    addToContext(getTopContext(generation.contexts), symbol);
    return;
  }
  const isConflict =
    symbol.kind === "FormalParam" ||
    getSymbolKind(binding) !== getSymbolKind(symbol) ||
    getSymbolArity(binding) !== getSymbolArity(symbol);
  const isBuiltIn = binding.kind === "OpDef" && binding.defKind === "BuiltIn";
  if (isBuiltIn && !(isConflict && generation.version === "1.7.4")) {
    generation.addError(
      symbol.location,
      `Symbol ${symbol.name} is a built-in operator, and cannot be redefined.`,
    );
    return;
  }
  if (isConflict) {
    generation.addError(
      symbol.location,
      `Multiply-defined symbol '${symbol.name}': this definition or declaration conflicts \nwith the one at ${formatSanyLocation(binding.location)}.`,
    );
  } else if (!isSameOrigin(symbol, binding)) {
    generation.addWarning(
      symbol.location,
      `Multiple declarations or definitions for symbol ${symbol.name}.  \nThis duplicates the one at ${formatSanyLocation(binding.location)}.`,
    );
  }
};

export const pushLabelScope = (generation: ModuleGeneration) =>
  generation.labelScopes.push({ labels: new Map(), params: [] });

export const popLabels = (generation: ModuleGeneration) =>
  generation.labelScopes.pop()?.labels ?? new Map<string, LabelNode>();

export const endProof = (generation: ModuleGeneration, statement: LevelNode) => {
  const scope =
    statement.kind === "AssumeProve" ? generation.assumeProveScopes.get(statement) : undefined;
  if (scope) scope.isInProof = false;
};

export const getLocation = (file: SourceFile, expression: Expression) =>
  getSpanLocation(file, getExpressionSpan(file, expression));

export const getUnitSpan = (file: SourceFile, location: SourceLocation) =>
  location.range
    ? getRangeSpan(file, location.range)
    : { start: getTokenIndex(file, location), end: getTokenIndex(file, location) };

export const resolveModule = (generation: ModuleGeneration, name: string) => {
  for (let index = generation.contexts.length - 1; index >= 0; index--) {
    const module = getContextModule(generation.contexts[index], name);
    if (module?.kind === "Module") return module;
  }
  return generation.externalModules.get(name);
};

export const getModule = (generation: ModuleGeneration, name: string) => {
  const module = resolveModule(generation, name);
  if (module === undefined) throw new TlaSyntaxError(`Could not find module ${name}`);
  return module;
};

export const withContext = <Result>(
  generation: ModuleGeneration,
  context: Context,
  generate: () => Result,
) => {
  generation.contexts.push(context);
  const result = generate();
  generation.contexts.pop();
  return result;
};

export const createFormalParam = (
  generation: ModuleGeneration,
  name: string,
  arity: number,
  location: SanyLocation | undefined,
  isAdded: boolean,
): FormalParamNode => {
  const param: FormalParamNode = {
    ...createLevelFields(generation.getId()),
    kind: "FormalParam",
    name,
    arity,
    location,
  };
  if (isAdded) addSymbol(generation, param);
  return param;
};

export const createOpDef = (
  generation: ModuleGeneration,
  fields: Partial<OpDefNode> & Pick<OpDefNode, "name" | "location">,
): OpDefNode => ({
  ...createLevelFields(generation.getId()),
  kind: "OpDef",
  defKind: "UserDefined",
  arity: fields.params?.length ?? 0,
  params: [],
  body: undefined,
  isLocal: false,
  module: generation.currentModule,
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

export const setRecursionFields = (generation: ModuleGeneration, definition: OpDefNode) => {
  definition.letInLevel = generation.curLevel;
  if (generation.unresolvedSum > 0) {
    definition.recursiveSection = generation.recursiveSectionCount;
    definition.inRecursiveSection = generation.unresolvedCount[generation.curLevel] > 0;
    generation.currentModule.opDefsInRecursiveSection.push(definition);
  }
};

export const createOpAppl = (
  generation: ModuleGeneration,
  operator: SymbolNode,
  operands: (ExprOrOpArgNode | undefined)[],
  location: SanyLocation,
  binding: OpApplBinding = {},
  id = generation.getId(),
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

export const createNullNode = (generation: ModuleGeneration): OpApplNode => ({
  ...createOpAppl(
    generation,
    getBuiltin(generation, "$Nop"),
    [],
    BUILTIN_LOCATION,
    {},
    generation.nullApplicationId,
  ),
  nullKind: "null",
});

export const getBuiltin = (generation: ModuleGeneration, name: string) => {
  const builtin = generation.builtinsByName.get(name);
  if (!builtin) throw new TlaUnsupportedError(`SANY has no builtin operator ${name}`);
  return builtin;
};

export const applyBuiltin = (
  generation: ModuleGeneration,
  name: string,
  operands: (ExprOrOpArgNode | undefined)[],
  location: SanyLocation,
  binding: OpApplBinding = {},
) => createOpAppl(generation, getBuiltin(generation, name), operands, location, binding);

export const createString = (
  generation: ModuleGeneration,
  value: string,
  location: SanyLocation,
): ExprNode => ({
  ...createLevelFields(generation.getId()),
  kind: "String",
  value,
  location,
});

export const createOpArg = (
  generation: ModuleGeneration,
  operator: SymbolNode,
  location: SanyLocation,
): OpArgNode => ({
  ...createLevelFields(generation.getId()),
  kind: "OpArg",
  op: operator,
  location,
});

export const resolveName = (generation: ModuleGeneration, name: string, location: SanyLocation) => {
  const symbol = resolveSymbol(generation.contexts, resolveSynonym(name));
  if (symbol === undefined || symbol.kind === "Module") {
    throw new TlaSyntaxError(
      `Unknown operator: \`${name}' at line ${location.beginLine}, column ${location.beginColumn} of module ${location.file}`,
    );
  }
  return symbol;
};

export const matchArguments = (
  generation: ModuleGeneration,
  operator: SymbolNode,
  operands: ExprOrOpArgNode[],
  location: SanyLocation,
) => {
  if (operator.kind !== "OpDef" || operator.defKind !== "UserDefined") return;
  const params = operator.params ?? [];
  if (params.length !== operands.length) {
    generation.addError(
      location,
      `Wrong number of arguments (${operands.length}) given to operator '${operator.name}', \nwhich requires ${params.length} arguments.`,
    );
    return;
  }
  params.forEach((param, index) => {
    const operand = operands[index];
    if (param.arity === 0 && operand.kind === "OpArg") {
      generation.addError(
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
      generation.addError(
        location,
        `Argument number ${index + 1} to operator '${operator.name}' \nshould be a ${param.arity}-parameter operator.`,
      );
    }
  });
};

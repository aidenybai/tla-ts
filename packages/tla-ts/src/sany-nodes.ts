// The semantic nodes of SANY's tla2sany.semantic package that its XMLExporter writes out, with the
// fields that the export and SANY's level checking read.

export interface SanyLocation {
  file: string;
  beginLine: number;
  beginColumn: number;
  endLine: number;
  endColumn: number;
}

// An error or warning SANY reports, with the location its message names. A location of undefined
// is SANY's unknown location, and one that is just a module name stands for the whole module.
export interface SanyMessage {
  location: SanyLocation | string | undefined;
  text: string;
  isWarning: boolean;
  // The ErrorCode SANY files a message under, where another check files the same text.
  code?: string;
}

// Errors.addMessage: SANY keeps one copy of each message, and after TLC 1.7.4 one for each code.
export const addSanyMessage = (messages: SanyMessage[], message: SanyMessage) => {
  const key = JSON.stringify(message);
  if (!messages.some((candidate) => JSON.stringify(candidate) === key)) messages.push(message);
};

// Location.toString.
export const formatSanyLocation = (location: SanyMessage["location"]) => {
  if (location === undefined) return "Unknown location";
  if (typeof location === "string") return `In module ${location}`;
  // Location.toString names only the module of a location at line 0, column 0.
  if (
    location.beginLine === 0 &&
    location.beginColumn === 0 &&
    location.endLine === 0 &&
    location.endColumn === 0
  ) {
    return `In module ${location.file}`;
  }
  return `line ${location.beginLine}, col ${location.beginColumn} to line ${location.endLine}, col ${location.endColumn} of module ${location.file}`;
};

// SANY's ArgLevelParam: the level of argument index of operator op depends on param.
export interface ArgLevelParam {
  op: SymbolNode;
  index: number;
  param: SymbolNode;
}

// SANY's ParamAndPosition with its level in a SetOfArgLevelConstraints: the argument at position of
// operator param must be allowed a level of at least level.
export interface ArgLevelConstraint {
  param: SymbolNode;
  position: number;
  level: number;
}

// The fields of SANY's LevelNode. levelChecked is 0 until levelCheck runs, and SANY exports a level
// only for the nodes it has level-checked.
export interface LevelFields {
  id: number;
  levelChecked: number;
  level: number;
  levelParams: Set<SymbolNode>;
  allParams: Set<SymbolNode>;
  nonLeibnizParams: Set<SymbolNode>;
  argLevelParams: Map<string, ArgLevelParam>;
  levelCorrect: boolean;
  // SetOfLevelConstraints: the highest level each parameter may have.
  levelConstraints: Map<SymbolNode, number>;
  argLevelConstraints: Map<string, ArgLevelConstraint>;
}

// SANY's kinds of declared symbols, from tla2sany.semantic.ASTConstants.
export const CONSTANT_DECL_KIND = 2;
export const VARIABLE_DECL_KIND = 3;
export const NEW_CONSTANT_KIND = 24;

export interface FormalParamNode extends LevelFields {
  kind: "FormalParam";
  name: string;
  arity: number;
  location: SanyLocation | undefined;
}

export interface OpDeclNode extends LevelFields {
  kind: "OpDecl";
  name: string;
  arity: number;
  declKind: number;
  location: SanyLocation;
  module: ModuleNode;
}

export interface OpDefNode extends LevelFields {
  kind: "OpDef";
  defKind: "UserDefined" | "BuiltIn" | "ModuleInstance" | "NumberedProofStep";
  name: string;
  arity: number;
  params: FormalParamNode[] | undefined;
  body: ExprNode | undefined;
  isLocal: boolean;
  location: SanyLocation;
  module: ModuleNode | undefined;
  source: OpDefNode | undefined;
  preComments: string[];
  isDefined: boolean;
  inRecursive: boolean;
  inRecursiveSection: boolean;
  recursiveSection: number;
  letInLevel: number;
  weights: number[];
  isLeibnizArg: boolean[] | undefined;
  isLeibniz: boolean;
  opLevelCond: boolean[][][] | undefined;
  maxLevels: number[];
  minMaxLevel: number[][] | undefined;
  labels: Map<string, LabelNode>;
  // The DEFINE, USE, HIDE or INSTANCE step that a NumberedProofStep definition names.
  step: ProofStepNode | undefined;
}

export interface ThmOrAssumpDefNode extends LevelFields {
  kind: "ThmOrAssumpDef";
  name: string;
  isTheorem: boolean;
  body: LevelNode;
  params: FormalParamNode[];
  isLocal: boolean;
  location: SanyLocation;
  module: ModuleNode;
  source: ThmOrAssumpDefNode | undefined;
  labels: Map<string, LabelNode>;
  isLeibnizArg: boolean[];
  isLeibniz: boolean;
  opLevelCond: boolean[][][];
  maxLevels: number[];
  minMaxLevel: number[][];
}

export interface ModuleNode {
  kind: "Module";
  id: number;
  name: string;
  location: SanyLocation;
  extendees: ModuleNode[];
  context: Context;
  topLevel: TopLevelNode[];
  definitions: SemanticNode[];
  opDefsInRecursiveSection: OpDefNode[];
  isLevelChecked: boolean;
  levelCorrect: boolean;
  argLevelParams: Map<string, ArgLevelParam>;
  levelConstraints: Map<SymbolNode, number>;
  argLevelConstraints: Map<string, ArgLevelConstraint>;
  // ModuleNode.getRecords: the record constructors and sets of records generated for the module.
  records: OpApplNode[];
}

export type SymbolNode = FormalParamNode | OpDeclNode | OpDefNode | ThmOrAssumpDefNode | ModuleNode;

export interface OpApplNode extends LevelFields {
  kind: "OpAppl";
  operator: SymbolNode;
  operands: (ExprOrOpArgNode | undefined)[];
  unbounded: FormalParamNode[] | undefined;
  bounded: FormalParamNode[][] | undefined;
  tupleOrs: boolean[] | undefined;
  ranges: ExprNode[];
  location: SanyLocation;
  // Generator.nullOAN, whose operator, nullODN, has no kind that the XMLExporter can export.
  isNull?: boolean;
  // The null that SANY generates for an operator it cannot resolve.
  isAbsent?: boolean;
}

export const isAbsent = (node: LevelNode | undefined) =>
  node?.kind === "OpAppl" && node.isAbsent === true;

export interface NumeralNode extends LevelFields {
  kind: "Numeral";
  value: string;
  location: SanyLocation;
}

export interface StringNode extends LevelFields {
  kind: "String";
  value: string;
  location: SanyLocation;
}

export interface DecimalNode extends LevelFields {
  kind: "Decimal";
  mantissa: string;
  exponent: string;
  integralPart: string;
  fractionalPart: string;
  location: SanyLocation;
}

export interface LetInNode extends LevelFields {
  kind: "LetIn";
  opDefs: (OpDefNode | ThmOrAssumpDefNode)[];
  instances: InstanceNode[];
  body: ExprNode;
  context: Context;
  location: SanyLocation;
}

export interface LabelNode extends LevelFields {
  kind: "Label";
  name: string;
  params: FormalParamNode[];
  body: LevelNode;
  labels: Map<string, LabelNode>;
  isAssumeProve: boolean;
  location: SanyLocation;
}

export interface OpArgNode extends LevelFields {
  kind: "OpArg";
  op: SymbolNode;
  location: SanyLocation;
}

export interface AtNode extends LevelFields {
  kind: "At";
  except: OpApplNode;
  component: OpApplNode;
  location: SanyLocation;
}

export interface Subst {
  op: OpDeclNode;
  expr: ExprOrOpArgNode;
  isImplicit: boolean;
}

export interface SubstInNode extends LevelFields {
  kind: "SubstIn" | "APSubstIn";
  substs: Subst[];
  body: LevelNode;
  instantiatingModule: ModuleNode;
  instantiatedModule: ModuleNode;
  location: SanyLocation;
}

export interface InstanceNode extends LevelFields {
  kind: "Instance";
  name: string | undefined;
  isLocal: boolean;
  params: FormalParamNode[];
  module: ModuleNode;
  substs: Subst[];
  location: SanyLocation;
}

export interface AssumeNode extends LevelFields {
  kind: "Assume";
  definition: ThmOrAssumpDefNode | undefined;
  body: ExprNode;
  location: SanyLocation;
}

export interface TheoremNode extends LevelFields {
  kind: "Theorem";
  definition: ThmOrAssumpDefNode | undefined;
  body: LevelNode;
  proof: ProofNode | undefined;
  isSuffices: boolean;
  location: SanyLocation;
}

// A fact of a BY, USE or HIDE: an expression, an ASSUME/PROVE or NEW clause, a module, or the
// definition of a module instance.
export type FactNode = LevelNode | ModuleNode | OpDefNode;

export interface LeafProofNode extends LevelFields {
  kind: "LeafProof";
  facts: FactNode[];
  defs: (OpDefNode | ThmOrAssumpDefNode | ModuleNode)[];
  isOmitted: boolean;
  isOnly: boolean;
  location: SanyLocation;
}

export interface DefStepNode extends LevelFields {
  kind: "DefStep";
  defs: OpDefNode[];
  location: SanyLocation;
}

export type ProofStepNode = TheoremNode | DefStepNode | UseOrHideNode | InstanceNode;

export interface NonLeafProofNode extends LevelFields {
  kind: "NonLeafProof";
  steps: ProofStepNode[];
  instances: InstanceNode[];
  proofLevel: number;
  location: SanyLocation;
}

export type ProofNode = LeafProofNode | NonLeafProofNode;

export interface NewSymbNode extends LevelFields {
  kind: "NewSymb";
  declaration: OpDeclNode;
  set: ExprNode | undefined;
  location: SanyLocation;
}

export interface AssumeProveNode extends LevelFields {
  kind: "AssumeProve";
  assumptions: LevelNode[];
  goal: ExprNode;
  isSuffices: boolean;
  isBoxed: boolean;
  location: SanyLocation;
}

export interface UseOrHideNode extends LevelFields {
  kind: "UseOrHide";
  facts: FactNode[];
  defs: (OpDefNode | ThmOrAssumpDefNode | ModuleNode)[];
  isOnly: boolean;
  isHide: boolean;
  location: SanyLocation;
}

export type ExprNode =
  | OpApplNode
  | NumeralNode
  | StringNode
  | DecimalNode
  | LetInNode
  | LabelNode
  | AtNode
  | SubstInNode;

export type ExprOrOpArgNode = ExprNode | OpArgNode;

export type LevelNode = ExprOrOpArgNode | AssumeProveNode | NewSymbNode;

export type ProofPartNode = ProofNode | DefStepNode;

export type TopLevelNode = InstanceNode | AssumeNode | TheoremNode | UseOrHideNode;

export type SemanticNode = SymbolNode | LevelNode | TopLevelNode | ProofPartNode;

// SANY's Context: a java.util.Hashtable from names to symbols, whose iteration order SANY's lists
// of constants, variables and instantiated definitions follow, and the symbols in the order they
// were added.
export interface Context {
  table: JavaHashtable;
  symbols: SymbolNode[];
}

interface HashtableEntry {
  hash: number;
  key: string;
  value: SymbolNode;
}

export interface JavaHashtable {
  buckets: HashtableEntry[][];
  count: number;
  threshold: number;
}

// java.lang.String.hashCode, over UTF-16 code units.
const getJavaHash = (text: string) => {
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  }
  return hash;
};

// A java.util.Hashtable with its default capacity of 11 and load factor of 0.75.
const createJavaHashtable = (): JavaHashtable => ({
  buckets: Array.from({ length: 11 }, () => []),
  count: 0,
  threshold: 8,
});

const getBucketIndex = (hash: number, length: number) => (hash & 0x7fffffff) % length;

const rehash = (table: JavaHashtable) => {
  const capacity = table.buckets.length * 2 + 1;
  const buckets: HashtableEntry[][] = Array.from({ length: capacity }, () => []);
  for (let index = table.buckets.length - 1; index >= 0; index--) {
    table.buckets[index].forEach((entry) =>
      buckets[getBucketIndex(entry.hash, capacity)].unshift(entry),
    );
  }
  table.buckets = buckets;
  table.threshold = Math.floor(capacity * 0.75);
};

const getHashtableValue = (table: JavaHashtable, key: string, hashKey = key) =>
  table.buckets[getBucketIndex(getJavaHash(hashKey), table.buckets.length)].find(
    (entry) => entry.key === key,
  )?.value;

const putHashtableValue = (table: JavaHashtable, key: string, value: SymbolNode, hashKey = key) => {
  const hash = getJavaHash(hashKey);
  const existing = table.buckets[getBucketIndex(hash, table.buckets.length)].find(
    (entry) => entry.key === key,
  );
  if (existing) {
    existing.value = value;
    return;
  }
  if (table.count >= table.threshold) rehash(table);
  table.buckets[getBucketIndex(hash, table.buckets.length)].unshift({ hash, key, value });
  table.count++;
};

// The values in the order of Hashtable.elements(), from the last bucket to the first.
export const getHashtableValues = (table: JavaHashtable) =>
  table.buckets.toReversed().flatMap((bucket) => bucket.map((entry) => entry.value));

const MODULE_KEY_PREFIX = "\u0000module ";

export const createContext = (): Context => ({ table: createJavaHashtable(), symbols: [] });

const getSymbolKey = (symbol: SymbolNode) =>
  symbol.kind === "Module" ? MODULE_KEY_PREFIX + symbol.name : symbol.name;

export const addToContext = (context: Context, symbol: SymbolNode) => {
  putHashtableValue(context.table, getSymbolKey(symbol), symbol, symbol.name);
  context.symbols.push(symbol);
};

export const getSymbolArity = (node: SymbolNode) =>
  node.kind === "ThmOrAssumpDef" ? node.params.length : node.kind === "Module" ? 0 : node.arity;

export const getContextSymbol = (context: Context, name: string) =>
  getHashtableValue(context.table, name);

export const getContextModule = (context: Context, name: string) =>
  getHashtableValue(context.table, MODULE_KEY_PREFIX + name, name);

// ModuleNode.getOpDefs: the definitions in the order they joined the context, without builtins
// and module instances.
export const getOpDefs = (module: ModuleNode) =>
  module.context.symbols.filter(
    (symbol): symbol is OpDefNode => symbol.kind === "OpDef" && symbol.defKind === "UserDefined",
  );

// ModuleNode.getConstantDecls and getVariableDecls reverse the Hashtable's order.
export const getDeclarations = (module: ModuleNode, declKind: number) =>
  getHashtableValues(module.context.table)
    .filter(
      (symbol): symbol is OpDeclNode => symbol.kind === "OpDecl" && symbol.declKind === declKind,
    )
    .toReversed();

export const getThmOrAssumpDefs = (module: ModuleNode) =>
  module.context.symbols.filter(
    (symbol): symbol is ThmOrAssumpDefNode => symbol.kind === "ThmOrAssumpDef",
  );

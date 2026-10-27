export interface LocalResolution {
  kind: "Local";
}

export interface SourceLocation {
  line: number;
  column: number;
  range?: SourceRange;
}

export interface SourceRange {
  module: string;
  start: SourceLocation;
  end: SourceLocation;
}

export interface NumberExpression {
  kind: "Number";
  value: number;
  text?: string;
  location: SourceLocation;
}

export interface DecimalExpression {
  kind: "Decimal";
  text: string;
  location: SourceLocation;
}

export interface StringExpression {
  kind: "String";
  value: string;
  location: SourceLocation;
}

export interface IdentifierExpression {
  kind: "Identifier";
  name: string;
  location: SourceLocation;
  resolution?: LocalResolution;
}

export interface ApplyExpression {
  kind: "Apply";
  operator: string;
  args: Expression[];
  // The number of args each part of a name like F(x)!l(y) takes, when a part before the last takes
  // some.
  argumentCounts?: number[];
  location: SourceLocation;
  resolution?: LocalResolution;
}

export interface OperatorReferenceExpression {
  kind: "OperatorReference";
  operator: string;
  location: SourceLocation;
}

export interface LambdaExpression {
  kind: "Lambda";
  params: string[];
  body: Expression;
  location: SourceLocation;
}

export interface JunctionExpression {
  kind: "And" | "Or";
  operands: Expression[];
  isBulleted?: boolean;
  location: SourceLocation;
}

export interface PrimeExpression {
  kind: "Prime";
  expression: Expression;
  location: SourceLocation;
}

export interface UnchangedExpression {
  kind: "Unchanged";
  expression: Expression;
  location: SourceLocation;
}

export interface EnabledExpression {
  kind: "Enabled";
  expression: Expression;
  location: SourceLocation;
}

export interface IfExpression {
  kind: "If";
  condition: Expression;
  consequent: Expression;
  alternative: Expression;
  location: SourceLocation;
}

export interface CaseArm {
  condition: Expression;
  body: Expression;
}

export interface CaseExpression {
  kind: "Case";
  arms: CaseArm[];
  other: Expression | undefined;
  location: SourceLocation;
}

export interface LetExpression {
  kind: "Let";
  definitions: Definition[];
  instances?: Instance[];
  body: Expression;
  location: SourceLocation;
}

export type BoundPattern = { kind: "Name"; name: string } | { kind: "Tuple"; names: string[] };

export interface Bound {
  pattern: BoundPattern;
  set: Expression;
}

export interface QuantifierExpression {
  kind: "Forall" | "Exists";
  bounds: Bound[];
  body: Expression;
  location: SourceLocation;
}

export interface UnboundedQuantifierExpression {
  kind: "UnboundedQuantifier";
  quantifier: "Forall" | "Exists";
  names: string[];
  isTemporal?: boolean;
  body: Expression;
  location: SourceLocation;
}

export interface ChooseExpression {
  kind: "Choose";
  pattern: BoundPattern;
  set: Expression | undefined;
  body: Expression;
  location: SourceLocation;
}

export interface SetEnumerationExpression {
  kind: "SetEnumeration";
  elements: Expression[];
  location: SourceLocation;
}

export interface SetFilterExpression {
  kind: "SetFilter";
  bound: Bound;
  predicate: Expression;
  location: SourceLocation;
}

export interface SetMapExpression {
  kind: "SetMap";
  expression: Expression;
  bounds: Bound[];
  location: SourceLocation;
}

export interface TupleExpression {
  kind: "Tuple";
  elements: Expression[];
  location: SourceLocation;
}

export interface FunctionConstructionExpression {
  kind: "FunctionConstruction";
  bounds: Bound[];
  body: Expression;
  location: SourceLocation;
  isRecursive?: boolean;
}

export interface FunctionSetExpression {
  kind: "FunctionSet";
  domain: Expression;
  range: Expression;
  location: SourceLocation;
}

export interface RecordField {
  name: string;
  value: Expression;
}

export interface RecordExpression {
  kind: "Record" | "RecordSet";
  fields: RecordField[];
  location: SourceLocation;
}

export type ExceptPathStep =
  | { kind: "Field"; name: string }
  | { kind: "Index"; args: Expression[] };

export interface ExceptUpdate {
  path: ExceptPathStep[];
  value: Expression;
}

export interface ExceptExpression {
  kind: "Except";
  function: Expression;
  updates: ExceptUpdate[];
  location: SourceLocation;
}

export interface ExceptAtExpression {
  kind: "ExceptAt";
  location: SourceLocation;
}

export interface FunctionApplicationExpression {
  kind: "FunctionApplication";
  function: Expression;
  args: Expression[];
  location: SourceLocation;
}

export interface FieldAccessExpression {
  kind: "FieldAccess";
  record: Expression;
  field: string;
  location: SourceLocation;
}

export interface ProductExpression {
  kind: "Product";
  factors: Expression[];
  location: SourceLocation;
}

export interface TemporalExpression {
  kind: "Always" | "Eventually";
  expression: Expression;
  location: SourceLocation;
}

export interface ActionExpression {
  kind: "BoxAction" | "AngleAction";
  action: Expression;
  subscript: Expression;
  location: SourceLocation;
}

export interface FairnessExpression {
  kind: "WeakFairness" | "StrongFairness";
  subscript: Expression;
  action: Expression;
  enabled?: Expression;
  location: SourceLocation;
}

export interface LabelExpression {
  kind: "Label";
  name: string;
  params: string[];
  body: Expression;
  location: SourceLocation;
}

export type Selector =
  | { kind: "Name"; name: string; args: Expression[] }
  | { kind: "Operand"; operand: number | "<<" | ">>" }
  | { kind: "Bound"; args: Expression[] }
  | { kind: "At" }
  | { kind: "Colon" };

export interface SubexpressionExpression {
  kind: "Subexpression";
  selectors: Selector[];
  location: SourceLocation;
}

export type Expression =
  | NumberExpression
  | DecimalExpression
  | StringExpression
  | IdentifierExpression
  | ApplyExpression
  | OperatorReferenceExpression
  | LambdaExpression
  | JunctionExpression
  | PrimeExpression
  | UnchangedExpression
  | EnabledExpression
  | IfExpression
  | CaseExpression
  | LetExpression
  | QuantifierExpression
  | UnboundedQuantifierExpression
  | ChooseExpression
  | SetEnumerationExpression
  | SetFilterExpression
  | SetMapExpression
  | TupleExpression
  | FunctionConstructionExpression
  | FunctionSetExpression
  | RecordExpression
  | ExceptExpression
  | ExceptAtExpression
  | FunctionApplicationExpression
  | FieldAccessExpression
  | ProductExpression
  | TemporalExpression
  | ActionExpression
  | FairnessExpression
  | LabelExpression
  | SubexpressionExpression;

export interface OperatorParam {
  name: string;
  arity: number;
}

export interface OperatorDefinition {
  kind: "Operator";
  name: string;
  params: OperatorParam[];
  body: Expression;
  bodyRange?: SourceRange;
  isLocal: boolean;
  isRecursive: boolean;
  location: SourceLocation;
}

export interface FunctionDefinition {
  kind: "Function";
  name: string;
  bounds: Bound[];
  body: Expression;
  isLocal: boolean;
  isRecursive: boolean;
  location: SourceLocation;
}

export type Definition = OperatorDefinition | FunctionDefinition;

export interface Declaration {
  name: string;
  arity: number;
  location: SourceLocation;
}

export interface Assumption {
  name: string | undefined;
  expression: Expression;
  isAxiom: boolean;
  location: SourceLocation;
}

export interface InstanceSubstitution {
  name: string;
  expression: Expression;
}

export interface Instance {
  kind: "Instance";
  name: string | undefined;
  params: OperatorParam[];
  module: string;
  substitutions: InstanceSubstitution[];
  isLocal: boolean;
  location: SourceLocation;
}

export interface NewSymbol {
  kind: "NewSymbol";
  name: string;
  arity: number;
  level: "Constant" | "Variable" | "State" | "Action" | "Temporal";
  set: Expression | undefined;
  location: SourceLocation;
}

export interface AssumeProve {
  kind: "AssumeProve";
  assumptions: (Expression | NewSymbol | AssumeProve)[];
  conclusion: Expression;
  location: SourceLocation;
}

export type Fact = Expression | { kind: "ModuleFact"; name: string; location: SourceLocation };

// keyword is the range of the USE or HIDE token and any ONLY after it.
export interface UseOrHide {
  kind: "Use" | "Hide";
  isOnly: boolean;
  facts: Fact[];
  defs: Fact[];
  keyword: SourceRange;
  location: SourceLocation;
}

// keyword is the range of the BY, OBVIOUS, or OMITTED token, and isKeyword records a PROOF keyword
// before the first step.
export type Proof =
  | { kind: "Obvious" | "Omitted"; keyword: SourceRange; location: SourceLocation }
  | {
      kind: "By";
      isOnly: boolean;
      facts: Fact[];
      defs: Fact[];
      keyword: SourceRange;
      location: SourceLocation;
    }
  | {
      kind: "Steps";
      level: number;
      steps: ProofStep[];
      isKeyword: boolean;
      location: SourceLocation;
    };

export interface DefineStep {
  kind: "Define";
  definitions: (Definition | Instance)[];
  location: SourceLocation;
}

export type StepBody =
  | UseOrHide
  | Instance
  | DefineStep
  | { kind: "Have"; expression: Expression }
  | { kind: "Take"; names: string[]; bounds: Bound[] }
  | { kind: "Witness"; expressions: Expression[] }
  | { kind: "Pick"; names: string[]; bounds: Bound[]; body: Expression }
  | { kind: "Case"; expression: Expression }
  | { kind: "Assert"; isSuffices: boolean; statement: Expression | AssumeProve }
  | { kind: "Qed" };

// head is the range of the step number and its statement, without the proof.
export interface ProofStep {
  name: string | undefined;
  token: string;
  body: StepBody;
  head: SourceRange;
  proof: Proof | undefined;
  location: SourceLocation;
}

export interface Theorem {
  name: string | undefined;
  statement: Expression | AssumeProve;
  proof: Proof | undefined;
  location: SourceLocation;
}

// The units of a module in source order, for consumers that need the order across kinds.
export type ModuleUnit =
  | { kind: "Constants"; declarations: Declaration[] }
  | { kind: "Variables"; declarations: Declaration[] }
  | { kind: "Recursive"; declarations: Declaration[] }
  | { kind: "Definition"; definition: Definition }
  | { kind: "Instance"; instance: Instance }
  | { kind: "Assumption"; assumption: Assumption }
  | { kind: "Theorem"; theorem: Theorem }
  | { kind: "Use"; use: UseOrHide }
  | { kind: "Module"; module: Module };

export interface Module {
  name: string;
  modules: Module[];
  extends: string[];
  constants: Declaration[];
  variables: Declaration[];
  definitions: Definition[];
  instances: Instance[];
  assumptions: Assumption[];
  location: SourceLocation;
  theorems: Theorem[];
  uses: UseOrHide[];
  units: ModuleUnit[];
}

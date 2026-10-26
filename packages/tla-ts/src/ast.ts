import type { GlobalName, GlobalOperator } from "./evaluate";

export interface SourceLocation {
  line: number;
  column: number;
}

export interface NumberExpression {
  kind: "Number";
  value: number;
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
  resolution?: GlobalName;
}

export interface ApplyExpression {
  kind: "Apply";
  operator: string;
  args: Expression[];
  location: SourceLocation;
  resolution?: GlobalOperator;
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
  names: string[];
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
  location: SourceLocation;
}

export type Expression =
  | NumberExpression
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
  | FairnessExpression;

export interface OperatorParam {
  name: string;
  arity: number;
}

export interface OperatorDefinition {
  kind: "Operator";
  name: string;
  params: OperatorParam[];
  body: Expression;
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
}

export interface Assumption {
  name: string | undefined;
  expression: Expression;
  isAxiom: boolean;
  location: SourceLocation;
}

export interface Module {
  name: string;
  extends: string[];
  constants: Declaration[];
  variables: string[];
  definitions: Definition[];
  assumptions: Assumption[];
}

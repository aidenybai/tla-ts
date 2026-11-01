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

// selectorRanges holds the range of each part of a name such as foo!lab, where SANY reports an
// error in selecting that part.
export interface IdentifierExpression {
  kind: "Identifier";
  name: string;
  selectorRanges?: SourceRange[];
  location: SourceLocation;
  resolution?: LocalResolution;
}

// spelling holds the text of an operator written as a synonym, such as (+) for \oplus, which SANY
// reports as written.
export interface ApplyExpression {
  kind: "Apply";
  operator: string;
  spelling?: string;
  args: Expression[];
  // The number of args each part of a name like F(x)!l(y) takes, when a part before the last takes
  // some.
  argumentCounts?: number[];
  // The range of the parenthesized arguments of a named operator, where SANY reports their count.
  argumentsRange?: SourceRange;
  selectorRanges?: SourceRange[];
  // The range of the arguments of each part of a name like F(x)!l(y), for a part that takes some.
  argumentRanges?: (SourceRange | undefined)[];
  location: SourceLocation;
  resolution?: LocalResolution;
}

export interface OperatorReferenceExpression {
  kind: "OperatorReference";
  operator: string;
  spelling?: string;
  location: SourceLocation;
}

// operator holds the operator, such as SUBSET, that an argument names, which tla-ts reads as a
// LAMBDA.
export interface LambdaExpression {
  kind: "Lambda";
  params: string[];
  paramRanges?: SourceRange[];
  body: Expression;
  operator?: string;
  location: SourceLocation;
}

export interface JunctionExpression {
  kind: "And" | "Or";
  operands: Expression[];
  isBulleted?: boolean;
  // SANY parses an infix chain such as A /\ B /\ C as (A /\ B) /\ C, whose node of each prefix of
  // two or more operands ends after the parentheses of its last operand.
  prefixEnds?: SourceLocation[];
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

// ranges holds the range of each name the pattern binds.
export type BoundPattern =
  | { kind: "Name"; name: string; ranges?: SourceRange[] }
  | { kind: "Tuple"; names: string[]; ranges?: SourceRange[] };

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
  nameRanges?: SourceRange[];
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
  location: SourceLocation;
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

// SANY parses [e1, ..., en] as a function application without the function, and its semantic
// checker rejects it.
export interface BracketExpression {
  kind: "Bracket";
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
  paramRanges?: SourceRange[];
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
  selectorRanges?: SourceRange[];
  argumentRanges?: (SourceRange | undefined)[];
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
  | BracketExpression
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
  location?: SourceLocation;
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
  // Whether the body applies the function, which SANY makes a recursive function definition.
  isSelfReferential?: boolean;
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
  nameRange: SourceRange;
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
  instanceRange: SourceRange;
  definitionRange?: SourceRange;
}

export interface NewSymbol {
  kind: "NewSymbol";
  name: string;
  arity: number;
  level: "Constant" | "Variable" | "State" | "Action" | "Temporal";
  set: Expression | undefined;
  nameRange?: SourceRange;
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

// keyword is the range of the BY, OBVIOUS, or OMITTED token.
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
  | { kind: "Take"; names: string[]; nameRanges?: SourceRange[]; bounds: Bound[] }
  | { kind: "Witness"; expressions: Expression[] }
  | {
      kind: "Pick";
      names: string[];
      nameRanges?: SourceRange[];
      bounds: Bound[];
      body: Expression;
    }
  | { kind: "Case"; expression: Expression }
  | { kind: "Assert"; isSuffices: boolean; statement: Expression | AssumeProve }
  | { kind: "Qed" };

// head is the range of the step number and its statement, without the proof, and statement is the
// range of the statement alone.
export interface ProofStep {
  name: string | undefined;
  token: string;
  body: StepBody;
  head: SourceRange;
  statement: SourceRange;
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
  | { kind: "Constants" | "Variables"; declarations: Declaration[]; location: SourceLocation }
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
  extendsRanges: SourceRange[];
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

export const getChildren = (expression: Expression): Expression[] => {
  switch (expression.kind) {
    case "Number":
    case "Decimal":
    case "String":
    case "Identifier":
    case "OperatorReference":
    case "ExceptAt":
      return [];
    case "Apply":
      return expression.args;
    case "Lambda":
      return [expression.body];
    case "And":
    case "Or":
      return expression.operands;
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      return [expression.expression];
    case "If":
      return [expression.condition, expression.consequent, expression.alternative];
    case "Case":
      return [
        ...expression.arms.flatMap((arm) => [arm.condition, arm.body]),
        ...(expression.other ? [expression.other] : []),
      ];
    case "Let":
      return [
        ...expression.definitions.flatMap((definition) =>
          definition.kind === "Function"
            ? [...definition.bounds.map((bound) => bound.set), definition.body]
            : [definition.body],
        ),
        expression.body,
      ];
    case "Forall":
    case "Exists":
      return [...expression.bounds.map((bound) => bound.set), expression.body];
    case "UnboundedQuantifier":
      return [expression.body];
    case "Choose":
      return [...(expression.set ? [expression.set] : []), expression.body];
    case "SetEnumeration":
    case "Tuple":
      return expression.elements;
    case "SetFilter":
      return [expression.bound.set, expression.predicate];
    case "SetMap":
      return [expression.expression, ...expression.bounds.map((bound) => bound.set)];
    case "FunctionConstruction":
      return [...expression.bounds.map((bound) => bound.set), expression.body];
    case "FunctionSet":
      return [expression.domain, expression.range];
    case "Record":
    case "RecordSet":
      return expression.fields.map((field) => field.value);
    case "Except":
      return [
        expression.function,
        ...expression.updates.flatMap((update) => [
          ...update.path.flatMap((step) => (step.kind === "Index" ? step.args : [])),
          update.value,
        ]),
      ];
    case "FunctionApplication":
      return [expression.function, ...expression.args];
    case "Bracket":
      return expression.args;
    case "FieldAccess":
      return [expression.record];
    case "Product":
      return expression.factors;
    case "BoxAction":
    case "AngleAction":
      return [expression.action, expression.subscript];
    case "WeakFairness":
    case "StrongFairness":
      return [expression.subscript, expression.action];
    case "Label":
      return [expression.body];
    case "Subexpression":
      return expression.selectors.flatMap((selector) => ("args" in selector ? selector.args : []));
  }
};

export const isLocallyResolved = (expression: Expression) =>
  (expression.kind === "Identifier" || expression.kind === "Apply") &&
  expression.resolution?.kind === "Local";

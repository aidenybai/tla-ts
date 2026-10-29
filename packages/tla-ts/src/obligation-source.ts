// Converts the tla-ts AST into tlapm's parse trees: expressions name operators opaquely until
// anonymization resolves them, and proof steps get tlapm's levels and anonymous step numbers.

import type {
  AssumeProve,
  Definition,
  Expression,
  Fact,
  Instance,
  Module,
  NewSymbol,
  ProofStep,
  QuantifierExpression,
  SourceLocation,
  SourceRange,
  UseOrHide,
} from "./ast";
import { TlaProofError, TlaUnsupportedError } from "./errors";
import {
  at,
  type Bound,
  type Builtin,
  type Defn,
  type Expr,
  type Hyp,
  type InstanceDefinition,
  type Locus,
  type Selector,
  type Sequent,
} from "./obligation-expression";
import type { ModuleUnit, Mule } from "./obligation-module";
import { readNewMethod } from "./obligation-pragma";
import {
  expandChoose,
  expandFcn,
  expandQuant,
  expandSetOf,
  expandSetSt,
  getUnbounded,
  type TuplyBound,
} from "./obligation-tuples";
import { lookupOperator, type Fixity, type Operator } from "./obligation-printer";
import {
  getUnique,
  type Counter,
  type Proof,
  type Step,
  type StepNumber,
  type UseDef,
  type Usable,
} from "./obligation-proof";

const BUILTINS: Record<string, Builtin> = {
  "=>": "Implies",
  "<=>": "Equiv",
  "/\\": "Conj",
  "\\/": "Disj",
  "~": "Neg",
  "=": "Eq",
  "#": "Neq",
  SUBSET: "SUBSET",
  UNION: "UNION",
  DOMAIN: "DOMAIN",
  "\\subseteq": "Subseteq",
  "\\in": "Mem",
  "\\notin": "Notmem",
  "\\": "Setminus",
  "\\cap": "Cap",
  "\\cup": "Cup",
  "'": "Prime",
  "~>": "Leadsto",
  ENABLED: "ENABLED",
  UNCHANGED: "UNCHANGED",
  "\\cdot": "Cdot",
  "-+->": "Actplus",
  "[]": "BoxTrue",
  "<>": "Diamond",
  TRUE: "TRUE",
  FALSE: "FALSE",
  BOOLEAN: "BOOLEAN",
  STRING: "STRING",
};

// Optable maps each spelling to its canonical name, and a prefix minus is the operator -.
const getCanonicalName = (name: string, isPrefix = false) =>
  isPrefix && name === "-" ? "-." : lookupOperator(name).name;

const STEP_PATTERN = /^<(\d+|\*|\+)>([A-Za-z0-9_]*)\.*$/;

const mergeLoci = (left: Locus | undefined, right: Locus | undefined): Locus | undefined => {
  if (!left || !right) return left ?? right;
  const isLeftFirst =
    left.startLine < right.startLine ||
    (left.startLine === right.startLine && left.startColumn <= right.startColumn);
  const isLeftLast =
    left.endLine > right.endLine ||
    (left.endLine === right.endLine && left.endColumn >= right.endColumn);
  return {
    file: left.file,
    startLine: isLeftFirst ? left.startLine : right.startLine,
    startColumn: isLeftFirst ? left.startColumn : right.startColumn,
    endLine: isLeftLast ? left.endLine : right.endLine,
    endColumn: isLeftLast ? left.endColumn : right.endColumn,
  };
};

type Grouping =
  | { kind: "Attached"; expression: Expression }
  | { kind: "Reduced"; isFinal: boolean };

const PREFIX_KEYWORDS: Partial<Record<Expression["kind"], string>> = {
  Always: "[]",
  Eventually: "<>",
  Enabled: "ENABLED",
  Unchanged: "UNCHANGED",
};

const isSamePosition = (left: SourceLocation | undefined, right: SourceLocation | undefined) =>
  left !== undefined &&
  right !== undefined &&
  left.line === right.line &&
  left.column === right.column;

const getStart = (expression: Expression) => expression.location.range?.start;

const getEnd = (expression: Expression) => expression.location.range?.end;

const withEnd = (expression: Expression, end: SourceLocation | undefined): Expression => {
  const range = expression.location.range;
  return range && end
    ? { ...expression, location: { ...expression.location, range: { ...range, end } } }
    : expression;
};

// The operator an expression leaves open on tlapm's parse stack, with the operand after it.
const getOpenOperator = (expression: Expression) => {
  if (expression.kind === "Apply") {
    const operator = lookupOperator(expression.operator);
    const isInfix = expression.args.length === 2 && operator.fixity.startsWith("Infix");
    const isPrefix = expression.args.length === 1 && operator.fixity === "Prefix";
    if (!isInfix && !isPrefix) return undefined;
    const last = expression.args.length - 1;
    return {
      operator,
      isInfix,
      operand: expression.args[last],
      replace: (operand: Expression): Expression => ({
        ...expression,
        args: [...expression.args.slice(0, last), operand],
      }),
    };
  }
  const keyword = PREFIX_KEYWORDS[expression.kind];
  if (keyword === undefined || !("expression" in expression)) return undefined;
  return {
    operator: lookupOperator(keyword),
    isInfix: false,
    operand: expression.expression,
    replace: (operand: Expression): Expression => ({ ...expression, expression: operand }),
  };
};

const isBelow = (left: Operator, right: Operator) => left.high < right.low;

// Pco.resolve: tlapm's parser lets an operator take in every later infix operator that is not
// entirely below it, so SUBSET S \ T is SUBSET (S \ T) to tlapm though SANY reads (SUBSET S) \ T.
// This regroups an infix application the way tlapm does.
const regroup = (expression: Extract<Expression, { kind: "Apply" }>): Expression => {
  const operator = lookupOperator(expression.operator);
  const [left, right] = expression.args;
  const end = getEnd(expression);
  const getInfix = (operand: Expression): Expression => {
    const range = expression.location.range;
    const start = getStart(operand);
    return {
      ...expression,
      args: [operand, right],
      location:
        range && start
          ? { ...expression.location, range: { ...range, start } }
          : expression.location,
    };
  };
  const attach = (node: Expression, isOpen: boolean): Grouping => {
    const open = isOpen ? getOpenOperator(node) : undefined;
    if (!open) return { kind: "Reduced", isFinal: false };
    const inner = attach(open.operand, isSamePosition(getEnd(open.operand), getEnd(node)));
    if (inner.kind === "Attached")
      return { kind: "Attached", expression: withEnd(open.replace(inner.expression), end) };
    const isReduced =
      !inner.isFinal &&
      (isBelow(operator, open.operator) ||
        (open.isInfix &&
          operator.fixity === "InfixLeft" &&
          open.operator.fixity === "InfixLeft" &&
          !isBelow(open.operator, operator)));
    if (isReduced) return { kind: "Reduced", isFinal: !isBelow(operator, open.operator) };
    return { kind: "Attached", expression: withEnd(open.replace(getInfix(open.operand)), end) };
  };
  const grouping = attach(left, isSamePosition(getStart(left), getStart(expression)));
  return grouping.kind === "Attached" ? grouping.expression : expression;
};

const TUPLY_FAILURE = "use instead the class`E_visit.iter_concrete`";

export const createSource = (file: string, text: string, counter: Counter, isExpanded: boolean) => {
  const lines = text.split("\n");

  const getRangeLocus = (range: SourceRange): Locus => ({
    file,
    startLine: range.start.line,
    startColumn: range.start.column,
    endLine: range.end.line,
    endColumn: range.end.column + 1,
  });

  const withPragma = (locus: Locus) => {
    const position = { line: locus.endLine - 1, column: locus.endColumn - 1 };
    const isBlank = (character: string | undefined) => character === " " || character === "\r";
    while (position.line < lines.length) {
      const line = lines[position.line];
      while (isBlank(line[position.column])) position.column++;
      if (position.column < line.length) break;
      position.line++;
      position.column = 0;
    }
    if (!(lines[position.line] ?? "").startsWith("(*{", position.column)) return locus;
    for (let index = position.line; index < lines.length; index++) {
      const close = lines[index].indexOf("}*)", index === position.line ? position.column : 0);
      if (close !== -1) return { ...locus, endLine: index + 1, endColumn: close + 4 };
    }
    return locus;
  };

  const getNameLocus = (name: string, location: SourceLocation): Locus => ({
    file,
    startLine: location.line,
    startColumn: location.column,
    endLine: location.line,
    endColumn: location.column + name.length,
  });

  const getLocus = (location: SourceLocation): Locus =>
    location.range
      ? getRangeLocus(location.range)
      : {
          file,
          startLine: location.line,
          startColumn: location.column,
          endLine: location.line,
          endColumn: location.column + 1,
        };

  const getOperator = (name: string, location: Locus | undefined): Expr => {
    const canonical = getCanonicalName(name);
    const builtin = BUILTINS[canonical];
    return at(builtin ? { kind: "Internal", builtin } : { kind: "Opaque", name: canonical }, {
      location,
    });
  };

  // A name with ! selects through instances, which anonymization resolves by joining the names.
  const getName = (
    name: string,
    args: Expr[],
    location: Locus,
    argumentCounts?: number[],
  ): Expr => {
    if (name.startsWith("<")) {
      const operator = at({ kind: "Opaque", name }, { location });
      return at({ kind: "Bang", expression: operator, selectors: [] }, { location });
    }
    const builtin = BUILTINS[name];
    if (builtin && args.length === 0) return at({ kind: "Internal", builtin }, { location });
    const names = name.split("!");
    if (names.length === 1) {
      const operator = at({ kind: "Opaque", name }, { location });
      return args.length === 0 ? operator : at({ kind: "Apply", operator, args }, { location });
    }
    const counts =
      argumentCounts ?? names.map((_name, index) => (index === names.length - 1 ? args.length : 0));
    const offsets = counts.map((_count, index) =>
      counts.slice(0, index).reduce((total, count) => total + count, 0),
    );
    const getArgs = (index: number) => args.slice(offsets[index], offsets[index] + counts[index]);
    const head = at({ kind: "Opaque", name: names[0] }, { location });
    return at(
      {
        kind: "Bang",
        expression:
          counts[0] === 0
            ? head
            : at({ kind: "Apply", operator: head, args: getArgs(0) }, { location }),
        selectors: names.slice(1).map((label, index) => ({
          kind: "Label",
          label: getCanonicalName(label),
          args: getArgs(index + 1),
        })),
      },
      { location },
    );
  };

  const convertBounds = (bounds: QuantifierExpression["bounds"], isExcept: boolean): Bound[] =>
    bounds.map((bound, index) => {
      if (bound.pattern.kind === "Tuple")
        throw new TlaProofError("Unexpected tuple declaration", { failure: TUPLY_FAILURE });
      const isDitto = index > 0 && bounds[index - 1].set === bound.set;
      return {
        name: bound.pattern.name,
        level: "Constant",
        domain: isDitto
          ? { kind: "Ditto" }
          : { kind: "Domain", expression: convertExpression(bound.set, isExcept) },
      };
    });

  const getTuplyBounds = (
    bounds: QuantifierExpression["bounds"],
    isExcept: boolean,
  ): TuplyBound[] =>
    bounds.map((bound, index) => {
      const domain = convertExpression(bound.set, isExcept);
      if (bound.pattern.kind === "Tuple")
        return { kind: "Tuple", names: bound.pattern.names, domain };
      const isDitto = index > 0 && bounds[index - 1].set === bound.set;
      return {
        kind: "Name",
        name: bound.pattern.name,
        domain: isDitto ? { kind: "Ditto" } : { kind: "Domain", expression: domain },
      };
    });

  const expandTuples = (expand: () => Expr, location: Locus) => {
    if (!isExpanded)
      throw new TlaProofError("Unexpected tuple declaration", { failure: TUPLY_FAILURE });
    return at(expand(), { location });
  };

  const hasTuple = (bounds: QuantifierExpression["bounds"]) =>
    bounds.some((bound) => bound.pattern.kind === "Tuple");

  const convertExpression = (expression: Expression, isExcept: boolean): Expr => {
    const location = getLocus(expression.location);
    const recurse = (inner: Expression) => convertExpression(inner, isExcept);
    // tlapm locates an operator application by its operator and operands, and a parenthesized
    // operand by what is inside the parentheses.
    const getOperatorLocus = (args: Expr[], fixity: Fixity) => {
      if (args.length === 2) return mergeLoci(args[0].location, args[1].location);
      if (args.length !== 1 || !args[0].location) return location;
      if (fixity === "Prefix") {
        return mergeLoci(
          { ...location, endLine: location.startLine, endColumn: location.startColumn + 1 },
          args[0].location,
        );
      }
      if (fixity === "Postfix") {
        return mergeLoci(
          { ...location, startLine: location.endLine, startColumn: location.endColumn - 1 },
          args[0].location,
        );
      }
      return location;
    };
    const applyPrefix = (builtin: Builtin, operand: Expr): Expr =>
      at(
        { kind: "Apply", operator: { kind: "Internal", builtin }, args: [operand] },
        { location: getOperatorLocus([operand], "Prefix") },
      );
    switch (expression.kind) {
      case "Number":
        return at(
          { kind: "Num", integer: expression.text ?? String(expression.value), fraction: "" },
          { location },
        );
      case "Decimal": {
        const [integer, fraction] = expression.text.split(".");
        return at({ kind: "Num", integer, fraction }, { location });
      }
      case "String": {
        // tlapm's lexer keeps a string's escapes as written. The location ends at the closing
        // quote.
        const written = /"((?:[^"\\]|\\.)*)"$/.exec(
          (lines[location.endLine - 1] ?? "").slice(0, location.endColumn - 1),
        );
        return at({ kind: "String", value: written?.[1] ?? expression.value }, { location });
      }
      case "Identifier":
        return getName(expression.name, [], location);
      case "Apply": {
        if (expression.args.length === 2) {
          const regrouped = regroup(expression);
          if (regrouped !== expression) return recurse(regrouped);
        }
        const args = expression.args.map(recurse);
        const operator = lookupOperator(expression.operator);
        if (operator.fixity !== "Nonfix") {
          return at(
            { kind: "Apply", operator: getOperator(expression.operator, undefined), args },
            { location: getOperatorLocus(args, operator.fixity) },
          );
        }
        return getName(expression.operator, args, location, expression.argumentCounts);
      }
      case "OperatorReference":
        return getOperator(expression.operator, location);
      case "Lambda":
        return at(
          {
            kind: "Lambda",
            params: expression.params.map((name) => ({ name, shape: 0 })),
            body: recurse(expression.body),
          },
          { location },
        );
      case "And":
      case "Or": {
        const items = expression.operands.map(recurse);
        if (expression.isBulleted)
          return at({ kind: "List", bullet: expression.kind, items }, { location });
        const builtin = expression.kind === "And" ? "Conj" : "Disj";
        return items.reduce((left, right) =>
          at(
            { kind: "Apply", operator: { kind: "Internal", builtin }, args: [left, right] },
            { location: mergeLoci(left.location, right.location) },
          ),
        );
      }
      case "Prime": {
        const operand = recurse(expression.expression);
        return at(
          { kind: "Apply", operator: { kind: "Internal", builtin: "Prime" }, args: [operand] },
          { location: getOperatorLocus([operand], "Postfix") },
        );
      }
      case "Unchanged":
        return applyPrefix("UNCHANGED", recurse(expression.expression));
      case "Enabled":
        return applyPrefix("ENABLED", recurse(expression.expression));
      case "If":
        return at(
          {
            kind: "If",
            condition: recurse(expression.condition),
            consequent: recurse(expression.consequent),
            alternative: recurse(expression.alternative),
          },
          { location },
        );
      case "Case":
        return at(
          {
            kind: "Case",
            arms: expression.arms.map((arm) => ({
              condition: recurse(arm.condition),
              body: recurse(arm.body),
            })),
            other: expression.other && recurse(expression.other),
          },
          { location },
        );
      case "Let":
        return at(
          {
            kind: "Let",
            definitions: [...expression.definitions, ...(expression.instances ?? [])]
              .sort(
                (left, right) =>
                  left.location.line - right.location.line ||
                  left.location.column - right.location.column,
              )
              .map((definition) => convertDefinition(definition, isExcept)),
            body: recurse(expression.body),
          },
          { location },
        );
      case "Forall":
      case "Exists":
        if (hasTuple(expression.bounds)) {
          const bounds = getTuplyBounds(expression.bounds, isExcept);
          const body = recurse(expression.body);
          return expandTuples(() => expandQuant(expression.kind, bounds, body), location);
        }
        return at(
          {
            kind: "Quant",
            quantifier: expression.kind,
            bounds: convertBounds(expression.bounds, isExcept),
            body: recurse(expression.body),
          },
          { location },
        );
      case "UnboundedQuantifier": {
        const body = recurse(expression.body);
        const quantifier = expression.quantifier;
        return expression.isTemporal
          ? at({ kind: "Tquant", quantifier, names: expression.names, body }, { location })
          : at(
              { kind: "Quant", quantifier, bounds: getUnbounded(expression.names), body },
              { location },
            );
      }
      case "Choose":
        if (expression.pattern.kind === "Tuple") {
          const names = expression.pattern.names;
          const domain = expression.set && recurse(expression.set);
          const body = recurse(expression.body);
          return expandTuples(() => expandChoose(names, domain, body), location);
        }
        return at(
          {
            kind: "Choose",
            name: expression.pattern.name,
            domain: expression.set && recurse(expression.set),
            body: recurse(expression.body),
          },
          { location },
        );
      case "SetEnumeration":
        return at({ kind: "SetEnum", elements: expression.elements.map(recurse) }, { location });
      case "SetFilter":
        if (expression.bound.pattern.kind === "Tuple") {
          const names = expression.bound.pattern.names;
          const domain = recurse(expression.bound.set);
          const body = recurse(expression.predicate);
          return expandTuples(() => expandSetSt(names, domain, body), location);
        }
        return at(
          {
            kind: "SetSt",
            name: expression.bound.pattern.name,
            domain: recurse(expression.bound.set),
            body: recurse(expression.predicate),
          },
          { location },
        );
      case "SetMap":
        if (hasTuple(expression.bounds)) {
          const element = recurse(expression.expression);
          const bounds = getTuplyBounds(expression.bounds, isExcept);
          return expandTuples(() => expandSetOf(element, bounds), location);
        }
        return at(
          {
            kind: "SetOf",
            element: recurse(expression.expression),
            bounds: convertBounds(expression.bounds, isExcept),
          },
          { location },
        );
      case "Tuple":
        // tlapm's tuple parser binds as (<< >>> elements) >>= ">>", which keeps only the location
        // of the closing >>.
        return at(
          { kind: "Tuple", elements: expression.elements.map(recurse) },
          {
            location: {
              ...location,
              startLine: location.endLine,
              startColumn: location.endColumn - 2,
            },
          },
        );
      case "FunctionConstruction":
        if (hasTuple(expression.bounds)) {
          const bounds = getTuplyBounds(expression.bounds, isExcept);
          const body = recurse(expression.body);
          return expandTuples(() => expandFcn(bounds, body), location);
        }
        return at(
          {
            kind: "Fcn",
            bounds: convertBounds(expression.bounds, isExcept),
            body: recurse(expression.body),
          },
          { location },
        );
      case "FunctionSet":
        return at(
          { kind: "Arrow", domain: recurse(expression.domain), range: recurse(expression.range) },
          { location },
        );
      case "Record":
      case "RecordSet":
        return at(
          {
            kind: expression.kind === "Record" ? "Record" : "Rect",
            fields: expression.fields.map((field) => ({
              name: field.name,
              value: recurse(field.value),
            })),
          },
          { location },
        );
      case "Except":
        return at(
          {
            kind: "Except",
            function: recurse(expression.function),
            specs: expression.updates.map((update) => ({
              trail: update.path.map((point) =>
                point.kind === "Field"
                  ? { kind: "Dot", field: point.name }
                  : {
                      kind: "Apply",
                      expression:
                        point.args.length === 1
                          ? recurse(point.args[0])
                          : { kind: "Tuple", elements: point.args.map(recurse) },
                    },
              ),
              value: convertExpression(update.value, true),
            })),
          },
          { location },
        );
      case "ExceptAt":
        return at({ kind: "At", isExcept }, { location });
      case "FunctionApplication":
        return at(
          {
            kind: "FcnApp",
            function: recurse(expression.function),
            args: expression.args.map(recurse),
          },
          { location },
        );
      case "FieldAccess":
        return at(
          { kind: "Dot", expression: recurse(expression.record), field: expression.field },
          { location },
        );
      case "Product":
        return at({ kind: "Product", factors: expression.factors.map(recurse) }, { location });
      case "Always":
      case "Eventually": {
        const inner = expression.expression;
        if (expression.kind === "Always" && inner.kind === "BoxAction") {
          return at(
            {
              kind: "Tsub",
              modal: "Box",
              action: recurse(inner.action),
              subscript: recurse(inner.subscript),
            },
            { location },
          );
        }
        if (expression.kind === "Eventually" && inner.kind === "AngleAction") {
          return at(
            {
              kind: "Tsub",
              modal: "Dia",
              action: recurse(inner.action),
              subscript: recurse(inner.subscript),
            },
            { location },
          );
        }
        return applyPrefix(expression.kind === "Always" ? "BoxTrue" : "Diamond", recurse(inner));
      }
      case "BoxAction":
      case "AngleAction":
        return at(
          {
            kind: "Sub",
            modal: expression.kind === "BoxAction" ? "Box" : "Dia",
            action: recurse(expression.action),
            subscript: recurse(expression.subscript),
          },
          { location },
        );
      case "WeakFairness":
      case "StrongFairness":
        return at(
          {
            kind: "Fair",
            fairness: expression.kind === "WeakFairness" ? "Weak" : "Strong",
            subscript: recurse(expression.subscript),
            action: recurse(expression.action),
          },
          { location },
        );
      case "Label":
        return at(
          {
            kind: "Parens",
            expression: recurse(expression.body),
            form: { kind: "Nlabel", label: expression.name, names: expression.params },
          },
          { location },
        );
      case "Subexpression": {
        const [head, ...selectors] = expression.selectors;
        if (head.kind !== "Name") throw new TlaProofError("Unexpected subexpression reference");
        const operator = at({ kind: "Opaque", name: head.name }, { location });
        const base =
          head.args.length === 0
            ? operator
            : at({ kind: "Apply", operator, args: head.args.map(recurse) }, { location });
        return at(
          {
            kind: "Bang",
            expression: base,
            selectors: selectors.map((selector): Selector => {
              switch (selector.kind) {
                case "Name":
                  return {
                    kind: "Label",
                    label: getCanonicalName(selector.name),
                    args: selector.args.map(recurse),
                  };
                case "Operand":
                  if (selector.operand === "<<") return { kind: "Left" };
                  if (selector.operand === ">>") return { kind: "Right" };
                  return { kind: "Number", value: selector.operand };
                case "Bound":
                  return { kind: "Instance", args: selector.args.map(recurse) };
                case "At":
                  return { kind: "At" };
                case "Colon":
                  return { kind: "Down" };
              }
            }),
          },
          { location },
        );
      }
    }
  };

  const convertInstance = (instance: Instance): InstanceDefinition => ({
    location: getRangeLocus(instance.definitionRange ?? instance.instanceRange),
    args: instance.params.map((param) => param.name),
    module: instance.module,
    substitutions: instance.substitutions.map((substitution) => ({
      name: getCanonicalName(substitution.name),
      expression: convertExpression(substitution.expression, false),
    })),
  });

  const convertDefinition = (definition: Definition | Instance, isExcept = false): Defn => {
    const location = getLocus(definition.location);
    if (definition.kind === "Instance") {
      if (definition.name === undefined) throw new TlaProofError("Unexpected keyword INSTANCE");
      return {
        kind: "Instance",
        name: definition.name,
        instance: convertInstance(definition),
        location,
      };
    }
    const name = getCanonicalName(
      definition.name,
      definition.kind === "Operator" && definition.params.length === 1 && definition.name === "-",
    );
    const body = convertExpression(definition.body, isExcept);
    if (definition.kind === "Function" && hasTuple(definition.bounds)) {
      const bounds = getTuplyBounds(definition.bounds, isExcept);
      return {
        kind: "Operator",
        name,
        body: expandTuples(() => expandFcn(bounds, body), location),
        location,
      };
    }
    if (definition.kind === "Function") {
      const bounds = convertBounds(definition.bounds, isExcept);
      return {
        kind: "Operator",
        name,
        body: at({ kind: "Fcn", bounds, body }, { location }),
        location,
      };
    }
    const operatorBody =
      definition.params.length === 0
        ? body
        : at(
            {
              kind: "Lambda",
              params: definition.params.map((param) => ({
                name: getCanonicalName(param.name),
                shape: param.arity,
                ...(param.location && { location: getNameLocus(param.name, param.location) }),
              })),
              body,
            },
            { location },
          );
    const end = definition.location.range?.end;
    const methods = end && readNewMethod(lines, { line: end.line - 1, column: end.column });
    return methods
      ? { kind: "Bpragma", name, body: operatorBody, methods, location }
      : { kind: "Operator", name, body: operatorBody, location };
  };

  const convertNewSymbol = (symbol: NewSymbol): Hyp => {
    const location = getLocus(symbol.location);
    if (symbol.level === "Variable") return { kind: "Flex", name: symbol.name, location };
    return {
      kind: "Fresh",
      name: symbol.name,
      shape: symbol.arity,
      level: symbol.level,
      domain: symbol.set && convertExpression(symbol.set, false),
      domainVisibility: "Visible",
      location,
    };
  };

  const convertSequent = (statement: Expression | AssumeProve): Sequent => {
    if (statement.kind !== "AssumeProve")
      return { context: [], active: convertExpression(statement, false) };
    return {
      context: statement.assumptions.map((assumption): Hyp => {
        if (assumption.kind === "NewSymbol") return convertNewSymbol(assumption);
        if (assumption.kind === "AssumeProve") {
          const location = getLocus(assumption.location);
          return {
            kind: "Fact",
            expression: at({ kind: "Sequent", sequent: convertSequent(assumption) }, { location }),
            visibility: "Visible",
            location,
          };
        }
        const expression = convertFactLabel(assumption);
        return { kind: "Fact", expression, visibility: "Visible", location: expression.location };
      }),
      active: convertExpression(statement.conclusion, false),
    };
  };

  // A labeled hypothesis is an Xlabel without parameters, not an Nlabel like a labeled expression.
  const convertFactLabel = (expression: Expression): Expr => {
    if (expression.kind !== "Label" || expression.params.length > 0)
      return convertExpression(expression, false);
    const location = getLocus(expression.location);
    return at(
      {
        kind: "Parens",
        expression: convertExpression(expression.body, false),
        form: { kind: "Xlabel", label: expression.name, indices: [] },
      },
      { location },
    );
  };

  const convertFact = (fact: Fact): Expr => {
    if (fact.kind === "ModuleFact") {
      throw new TlaUnsupportedError("MODULE facts in proof obligations are not supported");
    }
    const expression = convertExpression(fact, false);
    return expression.kind === "Bang" && expression.selectors.length === 0
      ? expression.expression
      : expression;
  };

  const convertDef = (fact: Fact): UseDef => {
    const location = getLocus(fact.location);
    if (fact.kind === "ModuleFact") return { kind: "Dvar", name: fact.name, location };
    if (fact.kind === "Identifier")
      return { kind: "Dvar", name: getCanonicalName(fact.name), location };
    if (fact.kind === "OperatorReference")
      return { kind: "Dvar", name: getCanonicalName(fact.operator), location };
    throw new TlaUnsupportedError("This DEF clause in proof obligations is not supported");
  };

  const convertUsable = (use: { facts: Fact[]; defs: Fact[] }): Usable => ({
    facts: use.facts.map(convertFact),
    defs: use.defs.map(convertDef),
  });

  const getStepNumber = (token: RegExpExecArray | null, level: number): StepNumber => {
    const label = token ? token[2] : "";
    return label === ""
      ? { kind: "Unnamed", level, id: getUnique(counter) }
      : { kind: "Named", level, label, isAnonymous: false };
  };

  // to_proof: a missing proof is implicitly omitted where the enclosing step is.
  const convertProof = (
    proof: ProofStep["proof"],
    level: number,
    enclosing: Locus | undefined,
  ): Proof => {
    if (!proof) return { kind: "Omitted", omission: "Implicit", location: enclosing };
    switch (proof.kind) {
      case "Obvious":
        return { kind: "Obvious", location: withPragma(getRangeLocus(proof.keyword)) };
      case "Omitted":
        return {
          kind: "Omitted",
          omission: "Explicit",
          location: getRangeLocus(proof.keyword),
        };
      case "By":
        return {
          kind: "By",
          usable: convertUsable(proof),
          isOnly: proof.isOnly,
          location: getRangeLocus(proof.keyword),
          step: { kind: "Unnamed", level, id: 0 },
        };
      case "Steps": {
        // A <*> first step takes the enclosing level only after PROOF, and the top level
        // always counts as PROOF.
        const tokens = proof.steps.map((step) => STEP_PATTERN.exec(step.token));
        const first = tokens[0];
        const stepLevel = first && first[1] !== "*" && first[1] !== "+" ? Number(first[1]) : level;
        // The parser ends the steps at the first QED.
        const steps = proof.steps
          .slice(0, -1)
          .map((step, index) =>
            convertStep(step, getStepNumber(tokens[index], stepLevel), stepLevel),
          );
        const last = proof.steps[proof.steps.length - 1];
        const number = getStepNumber(tokens[tokens.length - 1], stepLevel);
        const head = getRangeLocus(last.head);
        const qedProof = convertProof(last.proof, stepLevel + 1, head);
        const qed = { proof: qedProof, location: mergeLoci(head, qedProof.location), step: number };
        const location = steps.reduce<Locus | undefined>(
          (merged, step) => mergeLoci(merged, step.location),
          qed.location,
        );
        return { kind: "Steps", steps, qed, location, step: qed.step };
      }
    }
  };

  // tlapm locates a USE or HIDE by its keywords and DEF clause, since its parser drops the
  // facts' location.
  const getUseLocus = (use: UseOrHide) =>
    mergeLoci(
      getRangeLocus(use.keyword),
      use.defs.length > 0 ? getLocus(use.defs[use.defs.length - 1].location) : undefined,
    );

  const convertStep = (step: ProofStep, number: StepNumber, level: number): Step => {
    const head = getRangeLocus(step.head);
    const body = step.body;
    const withProof = (make: (proof: Proof) => Step): Step => {
      const proof = convertProof(step.proof, level + 1, head);
      return { ...make(proof), location: mergeLoci(head, proof.location), step: number };
    };
    const plain = (converted: Step): Step => ({ ...converted, location: head, step: number });
    switch (body.kind) {
      case "Use":
      case "Hide": {
        const location = mergeLoci(
          getRangeLocus({ ...step.head, end: step.head.start }),
          getUseLocus(body),
        );
        const usable = convertUsable(body);
        return body.kind === "Use"
          ? { kind: "Use", usable, isOnly: body.isOnly, location, step: number }
          : { kind: "Hide", usable, location, step: number };
      }
      case "Instance":
        throw new TlaProofError("Unexpected keyword INSTANCE");
      case "Define":
        return plain({
          kind: "Define",
          definitions: body.definitions.map((definition) => convertDefinition(definition)),
        });
      case "Have":
        return plain({ kind: "Have", expression: convertExpression(body.expression, false) });
      case "Take":
        return plain({
          kind: "Take",
          bounds:
            body.names.length > 0 ? getUnbounded(body.names) : convertBounds(body.bounds, false),
        });
      case "Witness":
        return plain({
          kind: "Witness",
          expressions: body.expressions.map((expression) => convertExpression(expression, false)),
        });
      case "Pick": {
        const bounds =
          body.names.length > 0 ? getUnbounded(body.names) : convertBounds(body.bounds, false);
        const expression = convertExpression(body.body, false);
        return withProof((proof) => ({ kind: "Pick", bounds, expression, proof }));
      }
      case "Case": {
        const expression = convertExpression(body.expression, false);
        return withProof((proof) => ({ kind: "Pcase", expression, proof }));
      }
      case "Assert": {
        const sequent = convertSequent(body.statement);
        return withProof((proof) =>
          body.isSuffices
            ? { kind: "Suffices", sequent, proof }
            : { kind: "Assert", sequent, proof },
        );
      }
      case "Qed":
        throw new TlaUnsupportedError("QED in the middle of a proof");
    }
  };

  const convertModule = (module: Module): Mule => ({
    name: module.name,
    extendees: module.extends,
    extendeeLocations: module.extendsRanges.map(getRangeLocus),
    isImportant: false,
    location: getLocus(module.location),
    body: module.units.map((unit): ModuleUnit => {
      switch (unit.kind) {
        case "Constants":
        case "Recursive":
          return {
            kind: unit.kind === "Constants" ? "Constants" : "Recursives",
            declarations: unit.declarations.map((declaration) => ({
              name: getCanonicalName(declaration.name),
              shape: declaration.arity,
            })),
            location: getLocus(unit.declarations[0].location),
          };
        case "Variables":
          return {
            kind: "Variables",
            names: unit.declarations.map((declaration) => declaration.name),
            location: getLocus(unit.declarations[0].location),
          };
        case "Definition":
          return {
            kind: "Definition",
            definition: convertDefinition(unit.definition),
            whereDefined: "User",
            visibility: "Hidden",
            isLocal: unit.definition.isLocal,
            location: getLocus(unit.definition.location),
          };
        case "Instance": {
          const instance = unit.instance;
          const location = getLocus(instance.location);
          return instance.name === undefined
            ? {
                kind: "Anoninst",
                instance: convertInstance(instance),
                isLocal: instance.isLocal,
                location,
              }
            : {
                kind: "Definition",
                definition: convertDefinition(instance),
                whereDefined: "User",
                visibility: "Hidden",
                isLocal: instance.isLocal,
                location: getRangeLocus(instance.instanceRange),
              };
        }
        case "Assumption":
          return {
            kind: "Axiom",
            name: unit.assumption.name,
            expression: convertExpression(unit.assumption.expression, false),
            location: getLocus(unit.assumption.location),
          };
        case "Theorem": {
          const theorem = unit.theorem;
          const location = getLocus(theorem.location);
          const end = withPragma(location);
          return {
            kind: "Theorem",
            name: theorem.name,
            sequent: convertSequent(theorem.statement),
            axiomCount: 0,
            proof: convertProof(theorem.proof, 0, {
              ...end,
              startLine: end.endLine,
              startColumn: end.endColumn,
            }),
            location,
          };
        }
        case "Use":
          return {
            kind: "Mutate",
            mode: unit.use.kind,
            isSuppressed: false,
            usable: convertUsable(unit.use),
            location: getUseLocus(unit.use),
          };
        case "Module":
          return { kind: "Submod", module: { ...convertModule(unit.module), isImportant: true } };
      }
    }),
  });

  return { convertModule };
};

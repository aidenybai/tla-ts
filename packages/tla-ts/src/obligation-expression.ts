// tlapm's expression IR (E_t) with de Bruijn indices, and its substitutions (E_subst) and
// alpha-equivalence (E_eq).

import { TlaProofError } from "./errors";

export interface Locus {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export type Builtin =
  | "TRUE"
  | "FALSE"
  | "Implies"
  | "Equiv"
  | "Conj"
  | "Disj"
  | "Neg"
  | "Eq"
  | "Neq"
  | "STRING"
  | "BOOLEAN"
  | "SUBSET"
  | "UNION"
  | "DOMAIN"
  | "Subseteq"
  | "Mem"
  | "Notmem"
  | "Setminus"
  | "Cap"
  | "Cup"
  | "Prime"
  | "StrongPrime"
  | "Leadsto"
  | "ENABLED"
  | "UNCHANGED"
  | "Cdot"
  | "Actplus"
  | "BoxTrue"
  | "BoxFalse"
  | "Diamond"
  | "Nat"
  | "Int"
  | "Real"
  | "Plus"
  | "Minus"
  | "Uminus"
  | "Times"
  | "Ratio"
  | "Quotient"
  | "Remainder"
  | "Exp"
  | "Infinity"
  | "Lteq"
  | "Lt"
  | "Gteq"
  | "Gt"
  | "Divides"
  | "Range"
  | "Seq"
  | "Len"
  | "BSeq"
  | "Cat"
  | "Append"
  | "Head"
  | "Tail"
  | "SubSeq"
  | "SelectSeq"
  | "OneArg"
  | "Extend"
  | "Print"
  | "PrintT"
  | "Assert"
  | "JavaTime"
  | "TLCGet"
  | "TLCSet"
  | "Permutations"
  | "SortSeq"
  | "RandomElement"
  | "Any"
  | "ToString"
  | "Unprimable"
  | "Irregular";

export type Shape = number;

export type Level = "Constant" | "State" | "Action" | "Temporal" | "Unknown";

export type BoundDomain =
  | { kind: "NoDomain" }
  | { kind: "Domain"; expression: Expr }
  | { kind: "Ditto" };

export interface Bound {
  name: string;
  level: Level;
  domain: BoundDomain;
}

export type Selector =
  | { kind: "Down" }
  | { kind: "Number"; value: number }
  | { kind: "Left" }
  | { kind: "Right" }
  | { kind: "At" }
  | { kind: "Instance"; args: Expr[] }
  | { kind: "Label"; label: string; args: Expr[] };

type ExceptPoint = { kind: "Dot"; field: string } | { kind: "Apply"; expression: Expr };

interface ExceptSpec {
  trail: ExceptPoint[];
  value: Expr;
}

export type ParenForm =
  | { kind: "Syntax" }
  | { kind: "Nlabel"; label: string; names: string[] }
  | { kind: "Xlabel"; label: string; indices: { name: string; index: number }[] };

export interface Param {
  name: string;
  shape: Shape;
}

// isAtomic is Expr.Deref.atomic: a resolved subexpression reference, which has no subexpressions.
export type Expr = ExprCore & { location?: Locus; isAtomic?: boolean };

export type ExprCore =
  | { kind: "Ix"; index: number }
  | { kind: "Opaque"; name: string }
  | { kind: "Internal"; builtin: Builtin }
  | { kind: "Lambda"; params: Param[]; body: Expr }
  | { kind: "Sequent"; sequent: Sequent }
  | { kind: "Bang"; expression: Expr; selectors: Selector[] }
  | { kind: "Apply"; operator: Expr; args: Expr[] }
  | { kind: "With"; expression: Expr; method: string }
  | { kind: "If"; condition: Expr; consequent: Expr; alternative: Expr }
  | { kind: "List"; bullet: "And" | "Or" | "Refs"; items: Expr[] }
  | { kind: "Let"; definitions: Defn[]; body: Expr }
  | { kind: "Quant"; quantifier: "Forall" | "Exists"; bounds: Bound[]; body: Expr }
  | { kind: "Tquant"; quantifier: "Forall" | "Exists"; names: string[]; body: Expr }
  | { kind: "Choose"; name: string; domain: Expr | undefined; body: Expr }
  | { kind: "SetSt"; name: string; domain: Expr; body: Expr }
  | { kind: "SetOf"; element: Expr; bounds: Bound[] }
  | { kind: "SetEnum"; elements: Expr[] }
  | { kind: "Product"; factors: Expr[] }
  | { kind: "Tuple"; elements: Expr[] }
  | { kind: "Fcn"; bounds: Bound[]; body: Expr }
  | { kind: "FcnApp"; function: Expr; args: Expr[] }
  | { kind: "Arrow"; domain: Expr; range: Expr }
  | { kind: "Rect"; fields: Field[] }
  | { kind: "Record"; fields: Field[] }
  | { kind: "Except"; function: Expr; specs: ExceptSpec[] }
  | { kind: "Dot"; expression: Expr; field: string }
  | { kind: "Sub"; modal: "Box" | "Dia"; action: Expr; subscript: Expr }
  | { kind: "Tsub"; modal: "Box" | "Dia"; action: Expr; subscript: Expr }
  | { kind: "Fair"; fairness: "Weak" | "Strong"; subscript: Expr; action: Expr }
  | { kind: "Case"; arms: { condition: Expr; body: Expr }[]; other: Expr | undefined }
  | { kind: "String"; value: string }
  | { kind: "Num"; integer: string; fraction: string }
  | { kind: "At"; isExcept: boolean }
  | { kind: "Parens"; expression: Expr; form: ParenForm };

interface Field {
  name: string;
  value: Expr;
}

export interface InstanceDefinition {
  args: string[];
  module: string;
  substitutions: { name: string; expression: Expr }[];
}

export type Defn = DefnCore & { location?: Locus };

type DefnCore =
  | { kind: "Recursive"; name: string; shape: Shape }
  | { kind: "Operator"; name: string; body: Expr }
  | { kind: "Instance"; name: string; instance: InstanceDefinition }
  | { kind: "Bpragma"; name: string; body: Expr };

export type WhereDefined = "Builtin" | "Proof" | "User";

export type Visibility = "Visible" | "Hidden";

export type Hyp = HypCore & { location?: Locus };

type HypCore =
  | {
      kind: "Fresh";
      name: string;
      shape: Shape;
      level: Level;
      domain: Expr | undefined;
      domainVisibility: Visibility;
    }
  | { kind: "Flex"; name: string }
  | {
      kind: "Defn";
      definition: Defn;
      whereDefined: WhereDefined;
      visibility: Visibility;
      isLocal: boolean;
    }
  | { kind: "Fact"; expression: Expr; visibility: Visibility };

export interface Sequent {
  context: Hyp[];
  active: Expr;
}

export type Substitution =
  | { kind: "Shift"; amount: number }
  | { kind: "Cons"; expression: Expr; rest: Substitution }
  | { kind: "Compose"; outer: Substitution; inner: Substitution }
  | { kind: "Bump"; amount: number; rest: Substitution };

export const shift = (amount: number): Substitution => ({ kind: "Shift", amount });

export const consSubstitution = (expression: Expr, rest: Substitution): Substitution => ({
  kind: "Cons",
  expression,
  rest,
});

export const bumpBy = (amount: number, substitution: Substitution): Substitution =>
  substitution.kind === "Bump"
    ? { kind: "Bump", amount: substitution.amount + amount, rest: substitution.rest }
    : { kind: "Bump", amount, rest: substitution };

// tlapm's core @@ from, which takes the properties of from.
export const at = (core: ExprCore, from: { location?: Locus; isAtomic?: boolean }): Expr => {
  const located = from.location ? { ...core, location: from.location } : core;
  return from.isAtomic ? { ...located, isAtomic: true } : located;
};

export const getHypName = (hyp: Hyp) => {
  switch (hyp.kind) {
    case "Fresh":
    case "Flex":
      return hyp.name;
    case "Defn":
      return hyp.definition.name;
    case "Fact":
      return undefined;
  }
};

export const getFresh = (name: string, level: Level, shape = 0): Hyp => ({
  kind: "Fresh",
  name,
  shape,
  level,
  domain: undefined,
  domainVisibility: "Visible",
});

export const getBoundedFresh = (name: string, domain: Expr): Hyp => ({
  kind: "Fresh",
  name,
  shape: 0,
  level: "Constant",
  domain,
  domainVisibility: "Visible",
});

const applyIndex = (substitution: Substitution, index: number, from: Expr): Expr => {
  switch (substitution.kind) {
    case "Shift":
      return at({ kind: "Ix", index: substitution.amount + index }, from);
    case "Cons":
      return index === 1
        ? at(stripProps(substitution.expression), from)
        : applyIndex(substitution.rest, index - 1, from);
    case "Compose":
      return substituteExpr(substitution.outer, applyIndex(substitution.inner, index, from));
    case "Bump":
      return index <= substitution.amount
        ? at({ kind: "Ix", index }, from)
        : substituteExpr(
            shift(substitution.amount),
            applyIndex(substitution.rest, index - substitution.amount, from),
          );
  }
};

export const substituteExprs = (substitution: Substitution, expressions: Expr[]) =>
  expressions.map((expression) => substituteExpr(substitution, expression));

// Beta-reduces a lambda applied to arguments, as E_subst.normalize does.
export const normalizeApply = (operator: Expr, args: Expr[]): ExprCore => {
  if (operator.kind === "Lambda") {
    if (operator.params.length !== args.length) throw new TlaProofError("Arity mismatch");
    const substitution = args.reduce<Substitution>(
      (rest, arg) => consSubstitution(arg, rest),
      shift(0),
    );
    return stripProps(substituteExpr(substitution, operator.body));
  }
  if (operator.kind === "Apply") {
    return { kind: "Apply", operator: operator.operator, args: [...operator.args, ...args] };
  }
  return args.length === 0 ? stripProps(operator) : { kind: "Apply", operator, args };
};

// The node without its properties, as tlapm's e.core.
export const stripProps = (expression: Expr): ExprCore => {
  if (!expression.location && !expression.isAtomic) return expression;
  const { location: _location, isAtomic: _isAtomic, ...core } = expression;
  return core;
};

export const substituteBounds = (
  substitution: Substitution,
  bounds: Bound[],
): [Substitution, Bound[]] => [
  bumpBy(bounds.length, substitution),
  bounds.map((bound) =>
    bound.domain.kind === "Domain"
      ? {
          ...bound,
          domain: {
            kind: "Domain",
            expression: substituteExpr(substitution, bound.domain.expression),
          },
        }
      : bound,
  ),
];

export const substituteSelector = (substitution: Substitution, selector: Selector): Selector =>
  selector.kind === "Instance" || selector.kind === "Label"
    ? { ...selector, args: substituteExprs(substitution, selector.args) }
    : selector;

export const substituteDefn = (substitution: Substitution, definition: Defn): Defn => {
  switch (definition.kind) {
    case "Recursive":
      return definition;
    case "Operator":
    case "Bpragma":
      return { ...definition, body: substituteExpr(substitution, definition.body) };
    case "Instance": {
      const inner = bumpBy(definition.instance.args.length, substitution);
      return {
        ...definition,
        instance: {
          ...definition.instance,
          substitutions: definition.instance.substitutions.map((entry) => ({
            name: entry.name,
            expression: substituteExpr(inner, entry.expression),
          })),
        },
      };
    }
  }
};

// Each item binds one name for the items after it.
const substituteEach = <Item>(
  substitution: Substitution,
  items: Item[],
  substituteItem: (substitution: Substitution, item: Item) => Item,
): [Substitution, Item[]] => {
  let current = substitution;
  const result = items.map((item) => {
    const substituted = substituteItem(current, item);
    current = bumpBy(1, current);
    return substituted;
  });
  return [current, result];
};

export const substituteHyp = (substitution: Substitution, hyp: Hyp): Hyp => {
  switch (hyp.kind) {
    case "Fresh":
      return hyp.domain ? { ...hyp, domain: substituteExpr(substitution, hyp.domain) } : hyp;
    case "Flex":
      return hyp;
    case "Defn":
      return { ...hyp, definition: substituteDefn(substitution, hyp.definition) };
    case "Fact":
      return { ...hyp, expression: substituteExpr(substitution, hyp.expression) };
  }
};

export const substituteSequent = (substitution: Substitution, sequent: Sequent): Sequent => {
  const [inner, context] = substituteEach(substitution, sequent.context, substituteHyp);
  return { context, active: substituteExpr(inner, sequent.active) };
};

export const substituteExpr = (substitution: Substitution, expression: Expr): Expr => {
  const recurse = (inner: Expr) => substituteExpr(substitution, inner);
  switch (expression.kind) {
    case "Internal":
    case "Opaque":
    case "String":
    case "Num":
    case "At":
      return expression;
    case "Ix":
      return applyIndex(substitution, expression.index, expression);
    case "Apply":
      return at(
        normalizeApply(
          recurse(expression.operator),
          substituteExprs(substitution, expression.args),
        ),
        expression,
      );
    case "Bang":
      return {
        ...expression,
        expression: recurse(expression.expression),
        selectors: expression.selectors.map((selector) =>
          substituteSelector(substitution, selector),
        ),
      };
    case "Lambda":
      return {
        ...expression,
        body: substituteExpr(bumpBy(expression.params.length, substitution), expression.body),
      };
    case "Let": {
      const [inner, definitions] = substituteEach(
        substitution,
        expression.definitions,
        substituteDefn,
      );
      return { ...expression, definitions, body: substituteExpr(inner, expression.body) };
    }
    case "Sequent":
      return { ...expression, sequent: substituteSequent(substitution, expression.sequent) };
    case "With":
      return { ...expression, expression: recurse(expression.expression) };
    case "If":
      return {
        ...expression,
        condition: recurse(expression.condition),
        consequent: recurse(expression.consequent),
        alternative: recurse(expression.alternative),
      };
    case "List":
      return { ...expression, items: substituteExprs(substitution, expression.items) };
    case "Quant": {
      const [inner, bounds] = substituteBounds(substitution, expression.bounds);
      return { ...expression, bounds, body: substituteExpr(inner, expression.body) };
    }
    case "Tquant":
      return {
        ...expression,
        body: substituteExpr(bumpBy(expression.names.length, substitution), expression.body),
      };
    case "Choose":
      return {
        ...expression,
        domain: expression.domain && recurse(expression.domain),
        body: substituteExpr(bumpBy(1, substitution), expression.body),
      };
    case "SetSt":
      return {
        ...expression,
        domain: recurse(expression.domain),
        body: substituteExpr(bumpBy(1, substitution), expression.body),
      };
    case "SetOf": {
      const [inner, bounds] = substituteBounds(substitution, expression.bounds);
      return { ...expression, bounds, element: substituteExpr(inner, expression.element) };
    }
    case "SetEnum":
      return { ...expression, elements: substituteExprs(substitution, expression.elements) };
    case "Arrow":
      return {
        ...expression,
        domain: recurse(expression.domain),
        range: recurse(expression.range),
      };
    case "Fcn": {
      const [inner, bounds] = substituteBounds(substitution, expression.bounds);
      return { ...expression, bounds, body: substituteExpr(inner, expression.body) };
    }
    case "FcnApp":
      return {
        ...expression,
        function: recurse(expression.function),
        args: substituteExprs(substitution, expression.args),
      };
    case "Product":
      return { ...expression, factors: substituteExprs(substitution, expression.factors) };
    case "Tuple":
      return { ...expression, elements: substituteExprs(substitution, expression.elements) };
    case "Rect":
    case "Record":
      return {
        ...expression,
        fields: expression.fields.map((field) => ({
          name: field.name,
          value: recurse(field.value),
        })),
      };
    case "Except":
      return {
        ...expression,
        function: recurse(expression.function),
        specs: expression.specs.map((spec) => ({
          trail: spec.trail.map((point) =>
            point.kind === "Apply"
              ? { kind: "Apply", expression: recurse(point.expression) }
              : point,
          ),
          value: recurse(spec.value),
        })),
      };
    case "Dot":
      return { ...expression, expression: recurse(expression.expression) };
    case "Sub":
    case "Tsub":
      return {
        ...expression,
        action: recurse(expression.action),
        subscript: recurse(expression.subscript),
      };
    case "Fair":
      return {
        ...expression,
        subscript: recurse(expression.subscript),
        action: recurse(expression.action),
      };
    case "Case":
      return {
        ...expression,
        arms: expression.arms.map((arm) => ({
          condition: recurse(arm.condition),
          body: recurse(arm.body),
        })),
        other: expression.other && recurse(expression.other),
      };
    case "Parens":
      return { ...expression, expression: recurse(expression.expression) };
  }
};

export const shiftExpr = (amount: number, expression: Expr) =>
  amount === 0 ? expression : substituteExpr(shift(amount), expression);

const isEqualList = <Item>(
  left: Item[],
  right: Item[],
  isEqual: (left: Item, right: Item) => boolean,
) => left.length === right.length && left.every((item, index) => isEqual(item, right[index]));

const isEqualFields = (left: Field[], right: Field[]) => {
  const leftMap = new Map(left.map((field) => [field.name, field.value]));
  const rightMap = new Map(right.map((field) => [field.name, field.value]));
  if (leftMap.size !== rightMap.size) return false;
  for (const [name, value] of leftMap) {
    const other = rightMap.get(name);
    if (!other || !isEqualExpr(value, other)) return false;
  }
  return true;
};

const isEqualBound = (left: Bound, right: Bound) =>
  left.level === right.level &&
  left.domain.kind === right.domain.kind &&
  (left.domain.kind !== "Domain" ||
    (right.domain.kind === "Domain" &&
      isEqualExpr(left.domain.expression, right.domain.expression)));

const isEqualSelector = (left: Selector, right: Selector) => {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "Number":
      return right.kind === "Number" && left.value === right.value;
    case "Instance":
      return right.kind === "Instance" && isEqualList(left.args, right.args, isEqualExpr);
    case "Label":
      return (
        right.kind === "Label" &&
        left.label === right.label &&
        isEqualList(left.args, right.args, isEqualExpr)
      );
    default:
      return true;
  }
};

const isEqualDefn = (left: Defn, right: Defn): boolean => {
  if (left.kind === "Operator" && right.kind === "Operator")
    return isEqualExpr(left.body, right.body);
  if (left.kind === "Bpragma" && right.kind === "Bpragma")
    return isEqualExpr(left.body, right.body);
  if (left.kind === "Instance" && right.kind === "Instance") {
    const leftSubstitutions = left.instance.substitutions.map((entry): Field => ({
      name: entry.name,
      value: entry.expression,
    }));
    const rightSubstitutions = right.instance.substitutions.map((entry): Field => ({
      name: entry.name,
      value: entry.expression,
    }));
    return (
      isEqualList(
        left.instance.args,
        right.instance.args,
        (leftArg, rightArg) => leftArg === rightArg,
      ) &&
      left.instance.module === right.instance.module &&
      isEqualFields(leftSubstitutions, rightSubstitutions)
    );
  }
  return false;
};

export const isEqualHyp = (left: Hyp, right: Hyp): boolean => {
  if (left.kind === "Fresh" && right.kind === "Fresh") {
    if (left.level !== right.level || left.shape !== right.shape) return false;
    if (!left.domain || !right.domain) return !left.domain && !right.domain;
    return isEqualExpr(left.domain, right.domain);
  }
  if (left.kind === "Flex" && right.kind === "Flex") return true;
  if (left.kind === "Defn" && right.kind === "Defn") {
    return isEqualDefn(left.definition, right.definition) && left.isLocal === right.isLocal;
  }
  if (left.kind === "Fact" && right.kind === "Fact") {
    return isEqualExpr(left.expression, right.expression);
  }
  return false;
};

const isEqualSequent = (left: Sequent, right: Sequent) =>
  isEqualList(left.context, right.context, isEqualHyp) && isEqualExpr(left.active, right.active);

// Alpha-equivalence, including E_eq's quirk of comparing only the first CASE arm.
export const isEqualExpr = (left: Expr, right: Expr): boolean => {
  if (left.kind === "Parens") return isEqualExpr(left.expression, right);
  if (right.kind === "Parens") return isEqualExpr(left, right.expression);
  switch (left.kind) {
    case "Ix":
      return right.kind === "Ix" && left.index === right.index;
    case "Opaque":
      return right.kind === "Opaque" && left.name === right.name;
    case "Internal":
      return right.kind === "Internal" && left.builtin === right.builtin;
    case "Lambda":
      return (
        right.kind === "Lambda" &&
        left.params.length === right.params.length &&
        isEqualExpr(left.body, right.body)
      );
    case "Apply":
      return (
        right.kind === "Apply" &&
        isEqualExpr(left.operator, right.operator) &&
        isEqualList(left.args, right.args, isEqualExpr)
      );
    case "Sequent":
      return right.kind === "Sequent" && isEqualSequent(left.sequent, right.sequent);
    case "Bang":
      return (
        right.kind === "Bang" &&
        isEqualExpr(left.expression, right.expression) &&
        isEqualList(left.selectors, right.selectors, isEqualSelector)
      );
    case "With":
      return right.kind === "With" && isEqualExpr(left.expression, right.expression);
    case "Let":
      return (
        right.kind === "Let" &&
        isEqualList(left.definitions, right.definitions, isEqualDefn) &&
        isEqualExpr(left.body, right.body)
      );
    case "If":
      return (
        right.kind === "If" &&
        isEqualExpr(left.condition, right.condition) &&
        isEqualExpr(left.consequent, right.consequent) &&
        isEqualExpr(left.alternative, right.alternative)
      );
    case "List":
      return (
        right.kind === "List" &&
        left.bullet === right.bullet &&
        isEqualList(left.items, right.items, isEqualExpr)
      );
    case "Quant":
      return (
        right.kind === "Quant" &&
        left.quantifier === right.quantifier &&
        isEqualList(left.bounds, right.bounds, isEqualBound) &&
        isEqualExpr(left.body, right.body)
      );
    case "Tquant":
      return (
        right.kind === "Tquant" &&
        left.quantifier === right.quantifier &&
        isEqualList(left.names, right.names, (leftName, rightName) => leftName === rightName) &&
        isEqualExpr(left.body, right.body)
      );
    case "Choose":
      if (right.kind !== "Choose") return false;
      if (left.domain && right.domain) {
        return isEqualExpr(left.domain, right.domain) && isEqualExpr(left.body, right.body);
      }
      return !left.domain && !right.domain && isEqualExpr(left.body, right.body);
    case "SetSt":
      return (
        right.kind === "SetSt" &&
        isEqualExpr(left.domain, right.domain) &&
        isEqualExpr(left.body, right.body)
      );
    case "SetOf":
      return (
        right.kind === "SetOf" &&
        isEqualExpr(left.element, right.element) &&
        isEqualList(left.bounds, right.bounds, isEqualBound)
      );
    case "SetEnum":
      return right.kind === "SetEnum" && isEqualList(left.elements, right.elements, isEqualExpr);
    case "Arrow":
      return (
        right.kind === "Arrow" &&
        isEqualExpr(left.domain, right.domain) &&
        isEqualExpr(left.range, right.range)
      );
    case "Fcn":
      return (
        right.kind === "Fcn" &&
        isEqualList(left.bounds, right.bounds, isEqualBound) &&
        isEqualExpr(left.body, right.body)
      );
    case "FcnApp":
      return (
        right.kind === "FcnApp" &&
        isEqualList([left.function, ...left.args], [right.function, ...right.args], isEqualExpr)
      );
    case "Tuple":
      return right.kind === "Tuple" && isEqualList(left.elements, right.elements, isEqualExpr);
    case "Product":
      return right.kind === "Product" && isEqualList(left.factors, right.factors, isEqualExpr);
    case "Rect":
      return right.kind === "Rect" && isEqualFields(left.fields, right.fields);
    case "Record":
      return right.kind === "Record" && isEqualFields(left.fields, right.fields);
    case "Except":
      return (
        right.kind === "Except" &&
        isEqualExpr(left.function, right.function) &&
        isEqualList(
          left.specs,
          right.specs,
          (leftSpec, rightSpec) =>
            isEqualList(leftSpec.trail, rightSpec.trail, (leftPoint, rightPoint) =>
              leftPoint.kind === "Dot"
                ? rightPoint.kind === "Dot" && leftPoint.field === rightPoint.field
                : rightPoint.kind === "Apply" &&
                  isEqualExpr(leftPoint.expression, rightPoint.expression),
            ) && isEqualExpr(leftSpec.value, rightSpec.value),
        )
      );
    case "Dot":
      return (
        right.kind === "Dot" &&
        isEqualExpr(left.expression, right.expression) &&
        left.field === right.field
      );
    case "Sub":
    case "Tsub":
      return (
        right.kind === left.kind &&
        left.modal === right.modal &&
        isEqualExpr(left.action, right.action) &&
        isEqualExpr(left.subscript, right.subscript)
      );
    case "Fair":
      return (
        right.kind === "Fair" &&
        left.fairness === right.fairness &&
        isEqualExpr(left.subscript, right.subscript) &&
        isEqualExpr(left.action, right.action)
      );
    case "Case": {
      if (right.kind !== "Case") return false;
      const isArmsEqual =
        left.arms.length === 0 || right.arms.length === 0
          ? left.arms.length === right.arms.length
          : isEqualExpr(left.arms[0].condition, right.arms[0].condition) &&
            isEqualExpr(left.arms[0].body, right.arms[0].body);
      if (!isArmsEqual) return false;
      if (left.other && right.other) return isEqualExpr(left.other, right.other);
      return !left.other && !right.other;
    }
    case "String":
      return right.kind === "String" && left.value === right.value;
    case "Num":
      return (
        right.kind === "Num" && left.integer === right.integer && left.fraction === right.fraction
      );
    case "At":
      return right.kind === "At" && left.isExcept === right.isExcept;
  }
};

// Visit.map for the expression forms @ can appear under; binders do not change @.
export const mapChildren = (expression: Expr, map: (inner: Expr) => Expr): Expr => {
  switch (expression.kind) {
    case "Ix":
    case "Opaque":
    case "Internal":
    case "String":
    case "Num":
    case "At":
      return expression;
    case "Lambda":
      return { ...expression, body: map(expression.body) };
    case "Sequent":
      return {
        ...expression,
        sequent: {
          context: expression.sequent.context.map((hyp): Hyp => {
            if (hyp.kind === "Fact") return { ...hyp, expression: map(hyp.expression) };
            if (hyp.kind === "Fresh" && hyp.domain) return { ...hyp, domain: map(hyp.domain) };
            if (hyp.kind === "Defn" && hyp.definition.kind === "Operator") {
              return { ...hyp, definition: { ...hyp.definition, body: map(hyp.definition.body) } };
            }
            return hyp;
          }),
          active: map(expression.sequent.active),
        },
      };
    case "Bang":
      return {
        ...expression,
        expression: map(expression.expression),
        selectors: expression.selectors.map((selector) =>
          selector.kind === "Instance" || selector.kind === "Label"
            ? { ...selector, args: selector.args.map(map) }
            : selector,
        ),
      };
    case "Apply":
      return { ...expression, operator: map(expression.operator), args: expression.args.map(map) };
    case "With":
      return { ...expression, expression: map(expression.expression) };
    case "If":
      return {
        ...expression,
        condition: map(expression.condition),
        consequent: map(expression.consequent),
        alternative: map(expression.alternative),
      };
    case "List":
      return { ...expression, items: expression.items.map(map) };
    case "Let":
      return {
        ...expression,
        definitions: expression.definitions.map((definition) =>
          definition.kind === "Operator" || definition.kind === "Bpragma"
            ? { ...definition, body: map(definition.body) }
            : definition,
        ),
        body: map(expression.body),
      };
    case "Quant":
    case "SetOf":
    case "Fcn": {
      const bounds = expression.bounds.map((bound) =>
        bound.domain.kind === "Domain"
          ? {
              ...bound,
              domain: { kind: "Domain" as const, expression: map(bound.domain.expression) },
            }
          : bound,
      );
      if (expression.kind === "SetOf")
        return { ...expression, bounds, element: map(expression.element) };
      return { ...expression, bounds, body: map(expression.body) };
    }
    case "Tquant":
      return { ...expression, body: map(expression.body) };
    case "Choose":
      return {
        ...expression,
        domain: expression.domain && map(expression.domain),
        body: map(expression.body),
      };
    case "SetSt":
      return { ...expression, domain: map(expression.domain), body: map(expression.body) };
    case "SetEnum":
      return { ...expression, elements: expression.elements.map(map) };
    case "Product":
      return { ...expression, factors: expression.factors.map(map) };
    case "Tuple":
      return { ...expression, elements: expression.elements.map(map) };
    case "FcnApp":
      return { ...expression, function: map(expression.function), args: expression.args.map(map) };
    case "Arrow":
      return { ...expression, domain: map(expression.domain), range: map(expression.range) };
    case "Rect":
    case "Record":
      return {
        ...expression,
        fields: expression.fields.map((field) => ({ name: field.name, value: map(field.value) })),
      };
    case "Except":
      return {
        ...expression,
        function: map(expression.function),
        specs: expression.specs.map((spec) => ({
          trail: spec.trail.map((point) =>
            point.kind === "Apply"
              ? { kind: "Apply" as const, expression: map(point.expression) }
              : point,
          ),
          value: map(spec.value),
        })),
      };
    case "Dot":
      return { ...expression, expression: map(expression.expression) };
    case "Sub":
    case "Tsub":
      return {
        ...expression,
        action: map(expression.action),
        subscript: map(expression.subscript),
      };
    case "Fair":
      return {
        ...expression,
        subscript: map(expression.subscript),
        action: map(expression.action),
      };
    case "Case":
      return {
        ...expression,
        arms: expression.arms.map((arm) => ({
          condition: map(arm.condition),
          body: map(arm.body),
        })),
        other: expression.other && map(expression.other),
      };
    case "Parens":
      return { ...expression, expression: map(expression.expression) };
  }
};

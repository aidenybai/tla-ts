// tlapm's E_eq: alpha-equivalence of expressions.

import type { Bound, Defn, Expr, Field, Hyp, Selector, Sequent } from "./expression";

const isEqualList = <Item>(
  left: Item[],
  right: Item[],
  isEqual: (left: Item, right: Item) => boolean,
) => left.length === right.length && left.every((item, index) => isEqual(item, right[index]));

const isEqualOptional = (left: Expr | undefined, right: Expr | undefined) =>
  left && right ? isEqualExpr(left, right) : !left && !right;

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
  if ((left.kind === "Operator" || left.kind === "Bpragma") && right.kind === left.kind)
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
    return (
      left.level === right.level &&
      left.shape === right.shape &&
      isEqualOptional(left.domain, right.domain)
    );
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
      return (
        right.kind === "Choose" &&
        isEqualOptional(left.domain, right.domain) &&
        isEqualExpr(left.body, right.body)
      );
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
    case "Tuple":
      return right.kind === left.kind && isEqualList(left.elements, right.elements, isEqualExpr);
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
    case "Product":
      return right.kind === "Product" && isEqualList(left.factors, right.factors, isEqualExpr);
    case "Rect":
    case "Record":
      return right.kind === left.kind && isEqualFields(left.fields, right.fields);
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
      return isArmsEqual && isEqualOptional(left.other, right.other);
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

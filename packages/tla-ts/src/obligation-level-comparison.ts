// A port of tlapm's Expr.LevelComparison, the LevelComparison frontend: it proves an obligation
// whose goal is a visible fact, or the goal of a visible ASSUME/PROVE fact, with identifiers
// renamed to identifiers of no higher level, each renamed one declared by the fact.

import { TlapmBugError, TlaProverError } from "./errors";
import {
  adjoin,
  adjoinAll,
  getBoundedFresh,
  getFresh,
  getScopeAt,
  getScopeHyps,
  type Bound,
  type Defn,
  type Expr,
  type Hyp,
  type Level,
  type Param,
  type Scope,
  type Sequent,
} from "./obligation-expression";
import { getLevelInfo } from "./obligation-levels";

interface Declaration {
  name: string;
  kind: Level | "Variable" | "Definition";
  level: number;
}

const RANKS: Partial<Record<Declaration["kind"], number>> = {
  Constant: 0,
  State: 1,
  Action: 2,
  Temporal: 3,
};

// The lists match item by item, and tlapm compares the items before it finds a missing one.
const isPairwise = <Item>(left: Item[], right: Item[], isSameItem: (left: Item, right: Item) => boolean) =>
  left.every((item, index) => index < right.length && isSameItem(item, right[index])) &&
  left.length === right.length;

// Util.Coll.Sm built from a list, where the first entry of a name wins, in key order.
const getSortedFields = (fields: { name: string; value: Expr }[]) =>
  [...new Map(fields.toReversed().map((field) => [field.name, field.value]))].toSorted(
    (first, second) => (first[0] < second[0] ? -1 : 1),
  );

const getDeclaration = (scope: Scope | undefined, index: number): Declaration => {
  const hypScope = getScopeAt(scope, index - 1);
  if (!hypScope) throw new TlapmBugError();
  const hyp = hypScope.hyp;
  if (hyp.kind === "Fresh") return { name: hyp.name, kind: hyp.level, level: RANKS[hyp.level] ?? -1 };
  if (hyp.kind === "Flex") return { name: hyp.name, kind: "Variable", level: 1 };
  if (hyp.kind === "Defn" && hyp.definition.kind === "Operator") {
    const level = getLevelInfo(hypScope.rest, hyp.definition.body).level;
    return { name: hyp.definition.name, kind: "Definition", level };
  }
  throw new TlapmBugError();
};

const bindBounds = (scope: Scope | undefined, bounds: Bound[]) =>
  bounds.reduce((current, bound) => adjoin(current, getFresh(bound.name, bound.level)), scope);

const bindParams = (scope: Scope | undefined, params: Param[]) =>
  params.reduce(
    (current, param) => adjoin(current, getFresh(param.name, "Unknown", param.shape)),
    scope,
  );

const bindDefinitions = (scope: Scope | undefined, definitions: Defn[]) =>
  definitions.reduce<Scope | undefined>(
    (current, definition) =>
      adjoin(current, {
        kind: "Defn",
        definition,
        whereDefined: "User",
        visibility: "Visible",
        isLocal: true,
      }),
    scope,
  );

const bindFlexible = (scope: Scope | undefined, names: string[]) =>
  names.reduce<Scope | undefined>((current, name) => adjoin(current, { kind: "Flex", name }), scope);

// level_comparison#compare: the expressions match up to a renaming that maps each name one way,
// and the fact's context declares each name it changes.
const compare = (
  factScope: Scope | undefined,
  goalScope: Scope | undefined,
  fact: Expr,
  goal: Expr,
) => {
  const renaming = new Map<string, string>();

  const isSameIndex = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    leftIndex: number,
    rightIndex: number,
  ) => {
    const left = getDeclaration(leftScope, leftIndex);
    const right = getDeclaration(rightScope, rightIndex);
    if (left.kind === "Unknown") return leftIndex === rightIndex;
    if (left.kind === "Variable" || left.kind === "Definition") {
      return left.name === right.name && right.kind === left.kind;
    }
    const rightRank = RANKS[right.kind];
    const isLower =
      (rightRank !== undefined && rightRank <= left.level) ||
      (right.kind === "Definition" && right.level <= left.level);
    if (!isLower) return false;
    const renamed = renaming.get(left.name);
    if (renamed !== undefined) return renamed === right.name;
    renaming.set(left.name, right.name);
    return true;
  };

  const isSameDefinition = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: Defn,
    right: Defn,
  ): boolean => {
    if (
      (left.kind === "Operator" && right.kind === "Operator") ||
      (left.kind === "Bpragma" && right.kind === "Bpragma")
    ) {
      return isSame(leftScope, rightScope, left.body, right.body);
    }
    if (left.kind !== "Instance" || right.kind !== "Instance") return false;
    const leftArgs = left.instance.args;
    const rightArgs = right.instance.args;
    const bindArgs = (scope: Scope | undefined, args: string[]) =>
      args.reduce((current, name) => adjoin(current, getFresh(name, "Unknown")), scope);
    const getFields = (definition: typeof left.instance) =>
      getSortedFields(
        definition.substitutions.map((entry) => ({ name: entry.name, value: entry.expression })),
      );
    return (
      isPairwise(leftArgs, rightArgs, (leftArg, rightArg) => leftArg === rightArg) &&
      left.instance.module === right.instance.module &&
      isSameFields(
        bindArgs(leftScope, leftArgs),
        bindArgs(rightScope, rightArgs),
        getFields(left.instance),
        getFields(right.instance),
      )
    );
  };

  const isSameFields = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: [string, Expr][],
    right: [string, Expr][],
  ) =>
    isPairwise(
      left,
      right,
      (leftField, rightField) =>
        leftField[0] === rightField[0] &&
        isSame(leftScope, rightScope, leftField[1], rightField[1]),
    );

  const isSameBounds = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: Bound[],
    right: Bound[],
  ) =>
    isPairwise(left, right, (leftBound, rightBound) => {
      if (leftBound.level !== rightBound.level) return false;
      const leftDomain = leftBound.domain;
      const rightDomain = rightBound.domain;
      if (leftDomain.kind === "Domain" && rightDomain.kind === "Domain") {
        return isSame(leftScope, rightScope, leftDomain.expression, rightDomain.expression);
      }
      return leftDomain.kind === rightDomain.kind && leftDomain.kind !== "Domain";
    });

  const isSameHyp = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: Hyp,
    right: Hyp,
  ) => {
    if (left.kind === "Fresh" && right.kind === "Fresh") {
      if (left.level !== right.level || left.shape !== right.shape) return false;
      if (left.domain && right.domain) {
        return isSame(leftScope, rightScope, left.domain, right.domain);
      }
      return !left.domain && !right.domain;
    }
    if (left.kind === "Flex" && right.kind === "Flex") return true;
    if (left.kind === "Defn" && right.kind === "Defn") {
      return (
        isSameDefinition(leftScope, rightScope, left.definition, right.definition) &&
        left.isLocal === right.isLocal
      );
    }
    if (left.kind === "Fact" && right.kind === "Fact") {
      return isSame(leftScope, rightScope, left.expression, right.expression);
    }
    return false;
  };

  const isSameContext = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: Hyp[],
    right: Hyp[],
  ): boolean => {
    if (left.length === 0 || right.length === 0) return left.length === right.length;
    return (
      isSameHyp(leftScope, rightScope, left[0], right[0]) &&
      isSameContext(adjoin(leftScope, left[0]), adjoin(rightScope, right[0]), left.slice(1), right.slice(1))
    );
  };

  const isSameBinder = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: { name: string; domain: Expr | undefined; body: Expr },
    right: { name: string; domain: Expr | undefined; body: Expr },
  ) => {
    if (!left.domain || !right.domain) {
      return (
        !left.domain &&
        !right.domain &&
        isSame(
          adjoin(leftScope, getFresh(left.name, "Constant")),
          adjoin(rightScope, getFresh(right.name, "Constant")),
          left.body,
          right.body,
        )
      );
    }
    return (
      isSame(leftScope, rightScope, left.domain, right.domain) &&
      isSame(
        adjoin(leftScope, getBoundedFresh(left.name, left.domain)),
        adjoin(rightScope, getBoundedFresh(right.name, right.domain)),
        left.body,
        right.body,
      )
    );
  };

  const isSame = (
    leftScope: Scope | undefined,
    rightScope: Scope | undefined,
    left: Expr,
    right: Expr,
  ): boolean => {
    if (left.kind === "Parens") return isSame(leftScope, rightScope, left.expression, right);
    if (right.kind === "Parens") return isSame(leftScope, rightScope, left, right.expression);
    const recurse = (leftInner: Expr, rightInner: Expr) =>
      isSame(leftScope, rightScope, leftInner, rightInner);
    const recurseList = (leftInner: Expr[], rightInner: Expr[]) =>
      isPairwise(leftInner, rightInner, recurse);
    switch (left.kind) {
      case "Ix":
        return (
          right.kind === "Ix" && isSameIndex(leftScope, rightScope, left.index, right.index)
        );
      case "Opaque":
        return right.kind === "Opaque" && left.name === right.name;
      case "Internal":
        return right.kind === "Internal" && left.builtin === right.builtin;
      case "Lambda":
        return (
          right.kind === "Lambda" &&
          left.params.length === right.params.length &&
          isSame(
            bindParams(leftScope, left.params),
            bindParams(rightScope, right.params),
            left.body,
            right.body,
          )
        );
      case "Apply":
        return (
          right.kind === "Apply" &&
          recurse(left.operator, right.operator) &&
          recurseList(left.args, right.args)
        );
      case "Sequent":
        return (
          right.kind === "Sequent" &&
          isSameContext(leftScope, rightScope, left.sequent.context, right.sequent.context) &&
          isSame(
            adjoinAll(leftScope, left.sequent.context),
            adjoinAll(rightScope, right.sequent.context),
            left.sequent.active,
            right.sequent.active,
          )
        );
      case "Bang": {
        if (right.kind !== "Bang" || !recurse(left.expression, right.expression)) return false;
        const rightSelectors = right.selectors;
        const isPrefix = left.selectors.every((selector, index) => {
          const other = rightSelectors[index];
          if (!other) return true;
          if (selector.kind === "Number" && other.kind === "Number") {
            return selector.value === other.value;
          }
          if (selector.kind === "Instance" && other.kind === "Instance") {
            return recurseList(selector.args, other.args);
          }
          if (selector.kind === "Label" && other.kind === "Label") {
            return selector.label === other.label && recurseList(selector.args, other.args);
          }
          return selector.kind === other.kind;
        });
        // List.for_all2 raises when the lists differ in length after a matching prefix.
        if (isPrefix && left.selectors.length !== rightSelectors.length) {
          throw new TlapmBugError("Invalid_argument");
        }
        return isPrefix;
      }
      case "With":
        return right.kind === "With" && recurse(left.expression, right.expression);
      case "Let":
        return (
          right.kind === "Let" &&
          isPairwise(left.definitions, right.definitions, (leftDefinition, rightDefinition) =>
            isSameDefinition(leftScope, rightScope, leftDefinition, rightDefinition),
          ) &&
          isSame(
            bindDefinitions(leftScope, left.definitions),
            bindDefinitions(rightScope, right.definitions),
            left.body,
            right.body,
          )
        );
      case "If":
        return (
          right.kind === "If" &&
          recurse(left.condition, right.condition) &&
          recurse(left.consequent, right.consequent) &&
          recurse(left.alternative, right.alternative)
        );
      case "List":
        return (
          right.kind === "List" &&
          left.bullet === right.bullet &&
          recurseList(left.items, right.items)
        );
      // tlapm binds the goal's bound names as the fact's.
      case "Quant":
        return (
          right.kind === "Quant" &&
          left.quantifier === right.quantifier &&
          isSameBounds(leftScope, rightScope, left.bounds, right.bounds) &&
          isSame(
            bindBounds(leftScope, left.bounds),
            bindBounds(rightScope, left.bounds),
            left.body,
            right.body,
          )
        );
      case "Tquant":
        return (
          right.kind === "Tquant" &&
          left.quantifier === right.quantifier &&
          isPairwise(left.names, right.names, (leftName, rightName) => leftName === rightName) &&
          isSame(
            bindFlexible(leftScope, left.names),
            bindFlexible(rightScope, right.names),
            left.body,
            right.body,
          )
        );
      case "Choose":
        return right.kind === "Choose" && isSameBinder(leftScope, rightScope, left, right);
      case "SetSt":
        return right.kind === "SetSt" && isSameBinder(leftScope, rightScope, left, right);
      case "SetOf":
        return (
          right.kind === "SetOf" &&
          isSame(
            bindBounds(leftScope, left.bounds),
            bindBounds(rightScope, right.bounds),
            left.element,
            right.element,
          ) &&
          isSameBounds(leftScope, rightScope, left.bounds, right.bounds)
        );
      case "SetEnum":
        return right.kind === "SetEnum" && recurseList(left.elements, right.elements);
      case "Arrow":
        return (
          right.kind === "Arrow" &&
          recurse(left.domain, right.domain) &&
          recurse(left.range, right.range)
        );
      case "Fcn":
        return (
          right.kind === "Fcn" &&
          isSameBounds(leftScope, rightScope, left.bounds, right.bounds) &&
          isSame(
            bindBounds(leftScope, left.bounds),
            bindBounds(rightScope, right.bounds),
            left.body,
            right.body,
          )
        );
      case "FcnApp":
        return (
          right.kind === "FcnApp" &&
          recurseList([left.function, ...left.args], [right.function, ...right.args])
        );
      case "Tuple":
        return right.kind === "Tuple" && recurseList(left.elements, right.elements);
      case "Product":
        return right.kind === "Product" && recurseList(left.factors, right.factors);
      case "Rect":
        return (
          right.kind === "Rect" &&
          isSameFields(
            leftScope,
            rightScope,
            getSortedFields(left.fields),
            getSortedFields(right.fields),
          )
        );
      case "Record":
        return (
          right.kind === "Record" &&
          isSameFields(
            leftScope,
            rightScope,
            getSortedFields(left.fields),
            getSortedFields(right.fields),
          )
        );
      case "Except":
        return (
          right.kind === "Except" &&
          recurse(left.function, right.function) &&
          isPairwise(
            left.specs,
            right.specs,
            (leftSpec, rightSpec) =>
              isPairwise(leftSpec.trail, rightSpec.trail, (leftPoint, rightPoint) => {
                if (leftPoint.kind === "Dot") {
                  return rightPoint.kind === "Dot" && leftPoint.field === rightPoint.field;
                }
                return (
                  rightPoint.kind === "Apply" && recurse(leftPoint.expression, rightPoint.expression)
                );
              }) && recurse(leftSpec.value, rightSpec.value),
          )
        );
      case "Dot":
        return (
          right.kind === "Dot" &&
          recurse(left.expression, right.expression) &&
          left.field === right.field
        );
      case "Sub":
        return (
          right.kind === "Sub" &&
          left.modal === right.modal &&
          recurse(left.action, right.action) &&
          recurse(left.subscript, right.subscript)
        );
      case "Tsub":
        return (
          right.kind === "Tsub" &&
          left.modal === right.modal &&
          recurse(left.action, right.action) &&
          recurse(left.subscript, right.subscript)
        );
      case "Fair":
        return (
          right.kind === "Fair" &&
          left.fairness === right.fairness &&
          recurse(left.subscript, right.subscript) &&
          recurse(left.action, right.action)
        );
      // Like E_eq, tlapm compares only the first arms.
      case "Case": {
        if (right.kind !== "Case") return false;
        const leftArm = left.arms[0];
        const rightArm = right.arms[0];
        const isSameArm =
          leftArm && rightArm
            ? recurse(leftArm.condition, rightArm.condition) && recurse(leftArm.body, rightArm.body)
            : !leftArm && !rightArm;
        if (!isSameArm) return false;
        if (left.other && right.other) return recurse(left.other, right.other);
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

  const isMatch = isSame(factScope, goalScope, fact, goal);
  const factHyps = getScopeHyps(factScope);
  const isDeclared = [...renaming].map(
    (entry) =>
      entry[0] === entry[1] ||
      factHyps.reduce((isFound, hyp) => {
        if (hyp.kind === "Fact") return isFound;
        if (hyp.kind === "Defn" && hyp.definition.kind !== "Operator") throw new TlapmBugError();
        return isFound || (hyp.kind === "Defn" ? hyp.definition.name : hyp.name) === entry[0];
      }, false),
  );
  return isMatch && isDeclared.every(Boolean);
};

// check_level_change: the first visible fact that matches proves the goal, which becomes TRUE.
// When none does, tlapm records the obligation as not tried.
export const checkLevelChange = (sequent: Sequent): Sequent => {
  const goalScope = adjoinAll(undefined, sequent.context);
  const isProved = sequent.context.some((hyp, index) => {
    if (hyp.kind !== "Fact" || hyp.visibility !== "Visible") return false;
    const factScope = getScopeAt(goalScope, sequent.context.length - index);
    const fact = hyp.expression;
    return fact.kind === "Sequent"
      ? compare(
          adjoinAll(factScope, fact.sequent.context),
          goalScope,
          fact.sequent.active,
          sequent.active,
        )
      : compare(factScope, goalScope, fact, sequent.active);
  });
  if (!isProved) throw new TlaProverError("LevelComparison proof directive did not succeed.\n");
  return { ...sequent, active: { kind: "Internal", builtin: "TRUE" } };
};

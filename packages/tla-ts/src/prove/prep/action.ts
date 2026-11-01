// A port of tlapm's action frontend (Action.process_obligation), which makes an obligation first
// order for the backends: [A]_v, <<A>>_v and UNCHANGED become primes (Expr.Tla_norm), primes move
// down to the variables (Symbol_commute), and what remains modal becomes opaque (Coalesce).

import { TlapmBugError } from "../../errors";
import { rewriteUnchanged } from "../../obligations/action";
import {
  adjoin,
  applyBuiltin,
  at,
  createContextMap,
  getBoundedFresh,
  getFresh,
  getScopeAt,
  getScopeHyps,
  mapAccumulate,
  mapHyp,
  mapScoped,
  type Builtin,
  type Defn,
  type Expr,
  type Hyp,
  type Level,
  type Scope,
  type Sequent,
} from "../../obligations/expression";
import { renderDoc } from "../../obligations/format";
import { getLevelInfo } from "../../obligations/levels";
import { printExpression } from "../../obligations/printer";
import { getMd5 } from "./md5";

type Map = (scope: Scope | undefined, expression: Expr) => Expr;

const getHyp = (scope: Scope | undefined, index: number) => {
  const hyp = getScopeAt(scope, index - 1)?.hyp;
  if (!hyp) throw new TlapmBugError();
  return hyp;
};

const getLevel = (scope: Scope | undefined, expression: Expr) =>
  getLevelInfo(scope, expression).level;

const isBuiltin = (expression: Expr, builtins: Builtin[]) =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  builtins.includes(expression.operator.builtin);

// Visit.map over a sequent: each hypothesis maps in the scope before it, hidden ones too if hyps
// is "all". The context maps by the obligation's own hypotheses, from which it derives.
const createSequentMap = (map: Map, hyps: "visible" | "all") => {
  const mapContext = createContextMap<Scope | undefined>(undefined, (scope, hyp) => {
    const mapped = mapHyp(hyp, (inner) => map(scope, inner), hyps);
    return [adjoin(scope, mapped), mapped];
  });
  return (keys: Hyp[], sequent: Sequent): Sequent => {
    const mapped = mapContext(keys, sequent.context);
    return { context: mapped.context, active: map(mapped.state, sequent.active) };
  };
};

// Expr.Tla_norm.expand_action, then expand_unchanged.
const expandAction: Map = (scope, expression) => {
  if (expression.kind === "Sub" || expression.kind === "Tsub") {
    const action = expandAction(scope, expression.action);
    const subscript = expandAction(scope, expression.subscript);
    const unchanged = applyBuiltin("UNCHANGED", [subscript], expression);
    const step =
      expression.modal === "Box"
        ? applyBuiltin("Disj", [action, unchanged], expression)
        : applyBuiltin("Conj", [action, applyBuiltin("Neg", [unchanged], expression)], expression);
    if (expression.kind === "Sub") return step;
    return applyBuiltin(expression.modal === "Box" ? "BoxTrue" : "Diamond", [step], expression);
  }
  return mapScoped(scope, expression, expandAction, adjoin, "all");
};

const expandUnchanged: Map = (scope, expression) =>
  expression.kind === "Apply" &&
  isBuiltin(expression, ["UNCHANGED"]) &&
  expression.args.length === 1
    ? rewriteUnchanged(expression.args[0])
    : mapScoped(scope, expression, expandUnchanged, adjoin, "all");

const getModal = (builtin: Builtin, expression: Expr) =>
  applyBuiltin(builtin, [expression], expression);

// prime_commuter: a prime distributes down to the declarations that are not constant.
const commutePrime: Map = (scope, expression) => {
  if (expression.kind === "Ix") {
    const hyp = getHyp(scope, expression.index);
    if (hyp.kind === "Fresh" && hyp.level === "Constant") return expression;
    if (
      hyp.kind === "Defn" &&
      hyp.definition.kind === "Operator" &&
      getLevel(getScopeAt(scope, expression.index), hyp.definition.body) === 0
    )
      return expression;
    return getModal("Prime", expression);
  }
  if (
    isBuiltin(expression, ["ENABLED"]) ||
    expression.kind === "Opaque" ||
    expression.kind === "Sequent" ||
    expression.kind === "Let"
  )
    return getModal("Prime", expression);
  if (
    isBuiltin(expression, [
      "UNCHANGED",
      "Cdot",
      "Leadsto",
      "Actplus",
      "BoxTrue",
      "BoxFalse",
      "Diamond",
    ]) ||
    expression.kind === "Tquant" ||
    expression.kind === "Sub" ||
    expression.kind === "Tsub" ||
    expression.kind === "Fair"
  )
    throw new TlapmBugError();
  return mapScoped(scope, expression, commutePrime, adjoin);
};

// box_commuter and dia_commuter: [] distributes over /\ and \A, and <> over \/ and \E, and both
// vanish on a constant.
const getModalCommuter = (builtin: "BoxTrue" | "Diamond"): Map => {
  const connective: Builtin = builtin === "BoxTrue" ? "Conj" : "Disj";
  const quantifier = builtin === "BoxTrue" ? "Forall" : "Exists";
  const commute: Map = (scope, expression) => {
    if (getLevel(scope, expression) === 0) return expression;
    const isDistributed =
      isBuiltin(expression, [connective]) ||
      ((expression.kind === "Quant" || expression.kind === "Tquant") &&
        expression.quantifier === quantifier);
    return isDistributed
      ? mapScoped(scope, expression, commute, adjoin)
      : getModal(builtin, expression);
  };
  return commute;
};

const COMMUTERS: Partial<Record<Builtin, Map>> = {
  Prime: commutePrime,
  BoxTrue: getModalCommuter("BoxTrue"),
  Diamond: getModalCommuter("Diamond"),
};

// symbol_commute: each prime, [] and <> commutes down its operand.
const commuteSymbols: Map = (scope, expression) => {
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const commuter = COMMUTERS[expression.operator.builtin];
    if (commuter) {
      if (expression.args.length !== 1) throw new TlapmBugError();
      return commuter(scope, expression.args[0]);
    }
  }
  return mapScoped(scope, expression, commuteSymbols, adjoin, "all");
};

const LEVEL_KINDS = ["CONSTANT", "STATE", "ACTION", "TEMPORAL"];

const FRESH_KINDS: Record<Level, string> = {
  Constant: "CONSTANT",
  State: "STATE",
  Action: "ACTION",
  Temporal: "TEMPORAL",
  Unknown: "Unknown",
};

const getRenamed = (kind: string, name: string) => `${kind}_${name}_`;

interface RenameState {
  scope: Scope | undefined;
  original: Scope | undefined;
}

// rename_with_loc: each declaration's name tells its level, as in CONSTANT_x_ or VARIABLE_x_. A
// definition's level is the one its body had before the commuters ran, unless given.
const renameDefn = (scope: Scope | undefined, definition: Defn, level?: number): Defn => {
  if (definition.kind !== "Operator") {
    return definition.kind === "Bpragma"
      ? { ...definition, body: rename(scope, definition.body) }
      : definition;
  }
  const body = rename(scope, definition.body);
  const kind = LEVEL_KINDS[level ?? getLevel(scope, body)];
  if (kind === undefined) throw new TlapmBugError();
  return { ...definition, name: getRenamed(kind, definition.name), body };
};

const renameHyp = (scope: Scope | undefined, hyp: Hyp, level?: number): Hyp => {
  switch (hyp.kind) {
    case "Fresh":
      return {
        ...hyp,
        name: getRenamed(FRESH_KINDS[hyp.level], hyp.name),
        domain: hyp.domain && rename(scope, hyp.domain),
      };
    case "Flex":
      return { ...hyp, name: getRenamed("VARIABLE", hyp.name) };
    case "Defn":
      return { ...hyp, definition: renameDefn(scope, hyp.definition, level) };
    case "Fact":
      return { ...hyp, expression: rename(scope, hyp.expression) };
  }
};

// tlapm reads levels from properties that Expr.Levels computes before the frontend rewrites
// anything, and each node it builds takes the properties of a node it replaces: UNCHANGED's
// equalities those of the tuple or its only element, and a commuted prime, [] or <> those of its
// operand. A definition's name tells the level its body's top node ends up with.
const getOriginalLevel = (scope: Scope | undefined, hyp: Hyp) => {
  if (hyp.kind !== "Defn" || hyp.definition.kind !== "Operator") return undefined;
  const getNodeLevel = (expression: Expr) => {
    if (!isBuiltin(expression, ["UNCHANGED"]) || expression.kind !== "Apply") {
      return getLevel(scope, expression);
    }
    const flatten = (inner: Expr): Expr[] =>
      inner.kind === "Tuple" ? inner.elements.flatMap(flatten) : [inner];
    const items = flatten(expression.args[0]);
    return getLevel(scope, items.length === 1 ? items[0] : expression.args[0]);
  };
  const body = hyp.definition.body;
  const isCommuted =
    isBuiltin(body, ["Prime", "BoxTrue", "Diamond"]) &&
    body.kind === "Apply" &&
    body.args.length === 1;
  return getNodeLevel(isCommuted && body.kind === "Apply" ? body.args[0] : body);
};

// renameSequent on the obligation, with the levels of its definitions from before commuting.
const renameContext = createContextMap<RenameState>(
  { scope: undefined, original: undefined },
  (current, hyp, original) => {
    const renamed = renameHyp(current.scope, hyp, getOriginalLevel(current.original, original));
    const next = {
      scope: adjoin(current.scope, renamed),
      original: adjoin(current.original, original),
    };
    return [next, renamed];
  },
);

const renameObligation = (commuted: Sequent, original: Sequent): Sequent => {
  const renamed = renameContext(original.context, commuted.context);
  return { context: renamed.context, active: rename(renamed.state.scope, commuted.active) };
};

const renameSequent = (scope: Scope | undefined, sequent: Sequent): Sequent => {
  const [inner, context] = mapAccumulate(scope, sequent.context, (current, hyp) => {
    const renamed = renameHyp(current, hyp);
    return [adjoin(current, renamed), renamed];
  });
  return { context, active: rename(inner, sequent.active) };
};

const rename: Map = (scope, expression) => {
  switch (expression.kind) {
    case "Lambda": {
      const params = expression.params.map((param) => ({
        ...param,
        name: getRenamed("Unknown", param.name),
      }));
      const inner = params.reduce(
        (current, param) => adjoin(current, getFresh(param.name, "Unknown", param.shape)),
        scope,
      );
      return { ...expression, params, body: rename(inner, expression.body) };
    }
    case "Tquant": {
      const inner = expression.names.reduce(
        (current, name) => adjoin(current, { kind: "Flex", name: getRenamed("VARIABLE", name) }),
        scope,
      );
      return { ...expression, body: rename(inner, expression.body) };
    }
    case "Choose": {
      const domain = expression.domain && rename(scope, expression.domain);
      const name = getRenamed("CONSTANT", expression.name);
      const hyp = domain ? getBoundedFresh(name, domain) : getFresh(name, "Constant");
      return { ...expression, name, domain, body: rename(adjoin(scope, hyp), expression.body) };
    }
    case "SetSt": {
      const domain = rename(scope, expression.domain);
      const name = getRenamed("CONSTANT", expression.name);
      const body = rename(adjoin(scope, getBoundedFresh(name, domain)), expression.body);
      return { ...expression, name, domain, body };
    }
    case "Quant":
    case "Fcn":
    case "SetOf": {
      const bounds = expression.bounds.map((bound) => ({
        ...bound,
        name: getRenamed(FRESH_KINDS[bound.level], bound.name),
        domain:
          bound.domain.kind === "Domain"
            ? { kind: "Domain" as const, expression: rename(scope, bound.domain.expression) }
            : bound.domain,
      }));
      const inner = bounds.reduce(
        (current, bound) => adjoin(current, getFresh(bound.name, bound.level)),
        scope,
      );
      return expression.kind === "SetOf"
        ? { ...expression, bounds, element: rename(inner, expression.element) }
        : { ...expression, bounds, body: rename(inner, expression.body) };
    }
    case "Let": {
      const [inner, definitions] = mapAccumulate(
        scope,
        expression.definitions,
        (current, definition) => {
          const renamed = renameDefn(current, definition);
          const hyp: Hyp = {
            kind: "Defn",
            definition: renamed,
            whereDefined: "User",
            visibility: "Visible",
            isLocal: true,
          };
          return [adjoin(current, hyp), renamed];
        },
      );
      return { ...expression, definitions, body: rename(inner, expression.body) };
    }
    case "Sequent":
      return { ...expression, sequent: renameSequent(scope, expression.sequent) };
    default:
      return mapScoped(scope, expression, rename, adjoin, "all");
  }
};

// E_substitutive.make_array: for each parameter of an operator, counting from the last, whether
// the body uses it only outside primes and the other modal operators.
const substitutiveArgs = new WeakMap<Defn, boolean[]>();

const getSubstitutiveArgs = (scope: Scope | undefined, definition: Defn): boolean[] => {
  const cached = substitutiveArgs.get(definition);
  if (cached) return cached;
  const body = definition.kind === "Operator" ? definition.body : undefined;
  if (body?.kind !== "Lambda") return [];
  const inner = body.params.reduce(
    (current, param) => adjoin(current, getFresh(param.name, "Unknown", param.shape)),
    scope,
  );
  const result = body.params.map((_param, index) =>
    isSubstitutive(inner, body.body, index + 1, true),
  );
  substitutiveArgs.set(definition, result);
  return result;
};

// compute_substitutivity_array: whether the parameter at index occurs only where scope holds.
const isSubstitutive = (
  scope: Scope | undefined,
  expression: Expr,
  index: number,
  isInScope: boolean,
): boolean => {
  if (expression.kind === "Ix") return isInScope || expression.index !== index;
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const builtin = expression.operator.builtin;
    const isUnary = [
      "Prime",
      "StrongPrime",
      "BoxTrue",
      "BoxFalse",
      "Diamond",
      "ENABLED",
      "UNCHANGED",
    ];
    const isBinary = ["Leadsto", "Actplus", "Cdot"];
    if (
      (isUnary.includes(builtin) && expression.args.length === 1) ||
      (isBinary.includes(builtin) && expression.args.length === 2)
    ) {
      return expression.args.every((arg) => isSubstitutive(scope, arg, index, false));
    }
  }
  if (expression.kind === "Sub") {
    return [expression.action, expression.subscript].every((inner) =>
      isSubstitutive(scope, inner, index, false),
    );
  }
  if (expression.kind === "Apply" && expression.operator.kind === "Ix") {
    const hypScope = getScopeAt(scope, expression.operator.index - 1);
    const hyp = hypScope?.hyp;
    if (hypScope && hyp?.kind === "Defn" && hyp.definition.kind === "Operator") {
      const args = getSubstitutiveArgs(hypScope.rest, hyp.definition);
      return expression.args.every((arg, position) => {
        const isArgInScope = args[position];
        if (isArgInScope === undefined) throw new TlapmBugError();
        return isSubstitutive(scope, arg, index, isArgInScope);
      });
    }
  }
  let isSubstitutiveHere = true;
  mapScoped(
    { scope, index },
    expression,
    (state, inner) => {
      if (isSubstitutiveHere && !isSubstitutive(state.scope, inner, state.index, isInScope)) {
        isSubstitutiveHere = false;
      }
      return inner;
    },
    (state, hyp) => ({ scope: adjoin(state.scope, hyp), index: state.index + 1 }),
    "all",
  );
  return isSubstitutiveHere;
};

// Coalesce.crypthash: h and the first five hexadecimal digits of the MD5 of the expression as
// tlapm prints it.
const getHashName = (scope: Scope | undefined, expression: Expr) => {
  const text = renderDoc(printExpression(getScopeHyps(scope), expression));
  return `h${getMd5(text).slice(0, 5)}`;
};

const coalesce = (scope: Scope | undefined, expression: Expr): Expr =>
  at({ kind: "Opaque", name: getHashName(scope, expression) }, expression);

// coalesce_operator: an operator applied to arguments that are not all substitutive is opaque,
// hiding the arguments that are constant or substitutive.
const coalesceOperator = (
  scope: Scope | undefined,
  name: string,
  substitutive: boolean[],
  from: Expr,
  args: Expr[],
) => {
  const starred = args.map((arg, position) => {
    const isHidden = getLevel(scope, arg) === 0 || substitutive[args.length - position - 1];
    return isHidden ? at({ kind: "Opaque", name: "*" }, arg) : arg;
  });
  return coalesce(
    scope,
    at({ kind: "Apply", operator: { kind: "Opaque", name }, args: starred }, from),
  );
};

const MODAL_BUILTINS: Builtin[] = [
  "Prime",
  "StrongPrime",
  "BoxTrue",
  "BoxFalse",
  "Diamond",
  "Leadsto",
  "ENABLED",
  "Cdot",
  "UNCHANGED",
];

// coalesce_modal_visitor: a primed declaration becomes the opaque name#prime, and every other
// modal expression an opaque name. tlapm means to apply that name to the expression's free
// variables, but compute_vars collects them into an instance variable and returns its own empty
// set, so the name always stands alone.
const coalesceModal: Map = (scope, expression) => {
  if (expression.kind !== "Apply") return mapScoped(scope, expression, coalesceModal, adjoin);
  const operator = expression.operator;
  const [arg] = expression.args;
  if (
    isBuiltin(expression, ["Prime", "StrongPrime"]) &&
    expression.args.length === 1 &&
    arg.kind === "Ix"
  ) {
    const hyp = getHyp(scope, arg.index);
    if (hyp.kind === "Fresh" || hyp.kind === "Flex") {
      return at({ kind: "Opaque", name: `${hyp.name}#prime` }, expression);
    }
  }
  if (isBuiltin(expression, MODAL_BUILTINS)) return coalesce(scope, expression);
  if (operator.kind !== "Ix") return mapScoped(scope, expression, coalesceModal, adjoin);
  const hypScope = getScopeAt(scope, operator.index - 1);
  const hyp = hypScope?.hyp;
  if (!hyp) throw new TlapmBugError();
  const args = expression.args;
  if (hyp.kind === "Defn" && hyp.definition.kind === "Operator") {
    const substitutive = getSubstitutiveArgs(hypScope.rest, hyp.definition);
    const isKept = args.every(
      (inner, position) => getLevel(scope, inner) === 0 || substitutive[args.length - position - 1],
    );
    if (isKept) return mapScoped(scope, expression, coalesceModal, adjoin);
    const opaque = coalesceOperator(scope, hyp.definition.name, substitutive, operator, args);
    return at(
      { kind: "Apply", operator: opaque, args: args.map((inner) => coalesceModal(scope, inner)) },
      expression,
    );
  }
  if (hyp.kind === "Flex") return mapScoped(scope, expression, coalesceModal, adjoin);
  if (hyp.kind === "Fresh") {
    if (hyp.level === "Constant") {
      return at(
        { kind: "Apply", operator, args: args.map((inner) => coalesceModal(scope, inner)) },
        expression,
      );
    }
    const notSubstitutive = args.map(() => false);
    return coalesceOperator(scope, hyp.name, notSubstitutive, operator, args);
  }
  throw new TlapmBugError();
};

// process_eob, on an obligation's sequent.
const expandActionSequent = createSequentMap(expandAction, "all");

const expandUnchangedSequent = createSequentMap(expandUnchanged, "all");

const commuteSequent = createSequentMap(commuteSymbols, "all");

const coalesceSequent = createSequentMap(coalesceModal, "visible");

export const processObligation = (sequent: Sequent): Sequent => {
  const keys = sequent.context;
  const expanded = expandUnchangedSequent(keys, expandActionSequent(keys, sequent));
  const commuted = commuteSequent(keys, expanded);
  return coalesceSequent(keys, renameObligation(commuted, sequent));
};

// tlapm's Expr.Action.lambdify, which instantiation applies to each definition and theorem. Each
// ENABLED and \cdot takes a LAMBDA over the variables it binds, after expanding the definitions
// in its scope that soundness needs expanded.

import { TlaProofError, TlapmBugError } from "./errors";
import type { Anonymizer } from "./obligation-anon";
import {
  adjoin,
  applyBuiltin,
  at,
  bumpBy,
  getAtPrefix,
  getScopeAt,
  mapScoped,
  normalizeApply,
  shift,
  stripProps,
  substituteExpr,
  type Expr,
  type ObligationWarning,
  type Scope,
  type Substitution,
} from "./obligation-expression";
import { getLevelInfo } from "./obligation-levels";

interface FreshNames {
  names: string[];
  depth: number;
}

const getHyp = (scope: Scope | undefined, index: number) => {
  const hyp = getScopeAt(scope, index - 1)?.hyp;
  if (!hyp) throw new TlapmBugError();
  return hyp;
};

const isActionOperator = (
  expression: Expr,
): expression is Expr & { kind: "Internal"; builtin: "ENABLED" | "Cdot" } =>
  expression.kind === "Internal" &&
  (expression.builtin === "ENABLED" || expression.builtin === "Cdot");

const isLambdified = (expression: Expr) =>
  expression.kind === "Apply" &&
  expression.args.length === 1 &&
  expression.args[0].kind === "Lambda" &&
  (isActionOperator(expression.operator) ||
    (expression.operator.kind === "Opaque" &&
      (expression.operator.name === "EnabledWrapper" ||
        expression.operator.name === "CdotWrapper")));

const getInitialLevel = (level: number | undefined) =>
  level === undefined ? 2 : Math.min(2, level);

const getDecrementedLevel = (level: number | undefined) =>
  level === undefined ? undefined : Math.max(1, level - 1);

// auto_expansion_of_defs. ENABLED and the first argument of \cdot need every definition of action
// level expanded, a prime lowers that bound to 1, and so does the second argument of \cdot.
const expandDefinitions = (
  onWarning: (warning: ObligationWarning) => void,
  scope: Scope | undefined,
  expression: Expr,
  level: number | undefined,
): Expr => {
  const recurse = (inner: Expr, innerLevel = level) =>
    expandDefinitions(onWarning, scope, inner, innerLevel);
  if (isLambdified(expression)) return expression;
  if (expression.kind === "Sub") {
    return {
      ...expression,
      action: recurse(expression.action),
      subscript: recurse(expression.subscript, getDecrementedLevel(level)),
    };
  }
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const builtin = expression.operator.builtin;
    const [first, second] = expression.args;
    if (builtin === "Cdot" && expression.args.length === 2) {
      return { ...expression, args: [recurse(first, getInitialLevel(level)), recurse(second, 1)] };
    }
    if (builtin === "ENABLED" && expression.args.length === 1) {
      return { ...expression, args: [recurse(first, getInitialLevel(level))] };
    }
    if ((builtin === "Prime" || builtin === "UNCHANGED") && expression.args.length === 1) {
      return { ...expression, args: [recurse(first, getDecrementedLevel(level))] };
    }
  }
  const head =
    expression.kind === "Apply" && expression.operator.kind === "Ix"
      ? expression.operator
      : expression;
  if (head.kind !== "Ix") {
    return mapScoped(
      scope,
      expression,
      (inner, child) => expandDefinitions(onWarning, inner, child, level),
      adjoin,
    );
  }
  if (level === undefined) return expression;
  const expressionLevel = getLevelInfo(scope, expression).level;
  const hyp = getHyp(scope, head.index);
  if (hyp.kind === "Fresh" && hyp.level === "Unknown") throw new TlapmBugError();
  if (expressionLevel < level) return expression;
  if (expressionLevel > 2 || hyp.kind === "Fact") throw new TlapmBugError();
  if (hyp.kind === "Flex") {
    if (expression.kind !== "Ix") throw new TlapmBugError();
    return expression;
  }
  if (hyp.kind === "Fresh") {
    throw new TlaProofError(
      `The expression that results from applying the declared operator \`${hyp.name}\` has expression level ${expressionLevel} within the scope of \`ENABLED\` or \`\\cdot\` where soundness requires expanding expressions of level >= ${level}. A declared operator cannot be expanded.`,
    );
  }
  const definition = hyp.definition;
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
    throw new TlapmBugError();
  }
  onWarning({
    text: `${getAtPrefix(expression.location)}[INFO]: Auto-expanding the definition of operator:  ${definition.name}\n`,
    channel: "stdout",
  });
  const body = substituteExpr(shift(head.index), definition.body);
  return recurse(
    stripProps(expression.kind === "Apply" ? normalizeApply(body, expression.args) : body),
  );
};

const getEquality = (expression: Expr): Expr =>
  applyBuiltin("Eq", [applyBuiltin("Prime", [expression], expression), expression], expression);

// E_tla_norm.rewrite_unch: UNCHANGED <<x, <<y>>>> as x' = x /\ y' = y.
const rewriteUnchanged = (expression: Expr): Expr => {
  const flatten = (inner: Expr): Expr[] =>
    inner.kind === "Tuple" ? inner.elements.flatMap(flatten) : [inner];
  const items = flatten(expression);
  if (items.length === 0) return at({ kind: "Internal", builtin: "TRUE" }, expression);
  if (items.length === 1) return getEquality(items[0]);
  return at({ kind: "List", bullet: "And", items: items.map(getEquality) }, expression);
};

// expand_propositional_action_operators: UNCHANGED v, [A]_v and <<A>>_v in terms of primes.
const expandPropositional = (expression: Expr): Expr => {
  if (expression.kind === "Apply" && expression.args.length === 1) {
    return rewriteUnchanged(expression.args[0]);
  }
  if (expression.kind !== "Sub") throw new TlapmBugError();
  const unchanged = rewriteUnchanged(expression.subscript);
  const second =
    expression.modal === "Box" ? unchanged : applyBuiltin("Neg", [unchanged], expression);
  return applyBuiltin(
    expression.modal === "Box" ? "Disj" : "Conj",
    [expression.action, second],
    expression,
  );
};

// OCaml's Hashtbl.hash of a string: caml_hash's MurmurHash3 over the bytes.
const getHash = (text: string) => {
  const rotate = (value: number, amount: number) => (value << amount) | (value >>> (32 - amount));
  const mix = (hash: number, data: number) => {
    const word = Math.imul(rotate(Math.imul(data, 0xcc9e2d51), 15), 0x1b873593);
    return (Math.imul(rotate(hash ^ word, 13), 5) + 0xe6546b64) | 0;
  };
  const bytes = new TextEncoder().encode(text);
  const blocks = bytes.length - (bytes.length % 4);
  let hash = 0;
  for (let index = 0; index < blocks; index += 4) {
    hash = mix(
      hash,
      bytes[index] | (bytes[index + 1] << 8) | (bytes[index + 2] << 16) | (bytes[index + 3] << 24),
    );
  }
  const tail = bytes.subarray(blocks).reduceRight((word, byte) => (word << 8) | byte, 0);
  if (bytes.length > blocks) hash = mix(hash, tail);
  hash ^= bytes.length;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) & 0x3fffffff;
};

// The keys of an OCaml Hashtbl.create 16 in Hashtbl.to_seq_keys order. Hashtbl.add prepends to a
// bucket and doubles the buckets once the table holds more than twice their count.
const getHashtblKeys = (names: string[]) => {
  let buckets: string[][] = Array.from({ length: 16 }, () => []);
  names.forEach((name, index) => {
    buckets[getHash(name) & (buckets.length - 1)].unshift(name);
    if (index + 1 <= buckets.length * 2) return;
    const resized: string[][] = Array.from({ length: buckets.length * 2 }, () => []);
    buckets.flat().forEach((key) => resized[getHash(key) & (resized.length - 1)].push(key));
    buckets = resized;
  });
  return buckets.flat();
};

// lambdify_action_operators. A variable met directly binds into current, and one met under a prime
// into primed. ENABLED A binds the primes of A, and A \cdot B binds those of A and the unprimed
// variables of B, each as an opaque name such as x#enabled#prime1.
const bindVariables = (
  current: FreshNames | undefined,
  primed: FreshNames | undefined,
  scope: Scope | undefined,
  expression: Expr,
): Expr => {
  const recurse = (inner: Expr) => bindVariables(current, primed, scope, inner);
  const isInScope = current !== undefined || primed !== undefined;
  const lambdifyOperator = (operator: Expr, args: Expr[]) => {
    const fresh: FreshNames = {
      names: [],
      depth: Math.max(current?.depth ?? 0, primed?.depth ?? 0) + 1,
    };
    const [first, second] = args;
    const bound = [
      bindVariables(current, fresh, scope, first),
      ...(second ? [bindVariables(fresh, primed, scope, second)] : []),
    ];
    const params = fresh.names.length === 0 ? ["r#0"] : getHashtblKeys(fresh.names);
    return at(
      {
        kind: "Apply",
        operator,
        args: [
          {
            kind: "Lambda",
            params: ["_", ...params].map((name) => ({ name, shape: 0 })),
            body: bound.length === 1 ? bound[0] : { kind: "List", bullet: "And", items: bound },
          },
        ],
      },
      expression,
    );
  };
  if (isLambdified(expression)) return expression;
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const builtin = expression.operator.builtin;
    if (
      (builtin === "ENABLED" && expression.args.length === 1) ||
      (builtin === "Cdot" && expression.args.length === 2)
    ) {
      return lambdifyOperator(expression.operator, expression.args);
    }
    if (builtin === "Prime" && expression.args.length === 1) {
      const arg = bindVariables(primed, undefined, scope, expression.args[0]);
      return primed ? arg : { ...expression, args: [arg] };
    }
    if (builtin === "UNCHANGED" && isInScope) return recurse(expandPropositional(expression));
  }
  if (expression.kind === "Sub" && isInScope) return recurse(expandPropositional(expression));
  if (expression.kind === "Ix") {
    if (!current) return expression;
    const hyp = getHyp(scope, expression.index);
    if (hyp.kind === "Fact") throw new TlapmBugError();
    if (hyp.kind !== "Flex") return expression;
    const name = `${hyp.name}#enabled#prime${current.depth}`;
    if (!current.names.includes(name)) current.names.push(name);
    return at({ kind: "Opaque", name }, expression);
  }
  if (expression.kind === "Apply" && expression.operator.kind === "Opaque") {
    throw new TlapmBugError();
  }
  return mapScoped(
    scope,
    expression,
    (inner, child) => bindVariables(current, primed, inner, child),
    adjoin,
  );
};

// shift_indices_after_lambdify, a Subst.map_visible_hyp that makes room in each new LAMBDA body
// for its parameters and drops the placeholder parameter.
const shiftIndices = (substitution: Substitution, expression: Expr): Expr => {
  if (expression.kind === "Apply" && isActionOperator(expression.operator)) {
    const [lambda] = expression.args;
    if (expression.args.length !== 1 || lambda.kind !== "Lambda") {
      throw new TlapmBugError();
    }
    const [placeholder, ...params] = lambda.params;
    if (placeholder.name !== "_") return expression;
    const body = shiftIndices(
      { kind: "Compose", outer: substitution, inner: shift(params.length) },
      lambda.body,
    );
    return {
      kind: "Apply",
      operator: expression.operator,
      args: [{ kind: "Lambda", params, body }],
    };
  }
  if (expression.kind === "Ix") return substituteExpr(substitution, expression);
  if (expression.kind === "Apply") {
    return at(
      normalizeApply(
        shiftIndices(substitution, expression.operator),
        expression.args.map((arg) => shiftIndices(substitution, arg)),
      ),
      expression,
    );
  }
  return mapScoped(substitution, expression, shiftIndices, (current) => bumpBy(1, current));
};

// normalize_lambda_param_names: the parameters become r#0, r#1, ... and the operator
// EnabledWrapper or CdotWrapper.
const renameParams = (expression: Expr): Expr => {
  if (expression.kind === "Apply" && isActionOperator(expression.operator)) {
    const [lambda] = expression.args;
    if (expression.args.length !== 1 || lambda.kind !== "Lambda" || lambda.params[0].name === "_") {
      throw new TlapmBugError();
    }
    const name = expression.operator.builtin === "Cdot" ? "CdotWrapper" : "EnabledWrapper";
    return {
      kind: "Apply",
      operator: at({ kind: "Opaque", name }, expression.operator),
      args: [
        {
          kind: "Lambda",
          params: lambda.params.map((_param, index) => ({ name: `r#${index}`, shape: 0 })),
          body: renameParams(lambda.body),
        },
      ],
    };
  }
  return mapScoped(
    undefined,
    expression,
    (_state, child) => renameParams(child),
    () => undefined,
  );
};

// check_arity: no \cdot keeps a single argument that is not a LAMBDA.
const checkArity = (expression: Expr): Expr => {
  const isInvalid =
    expression.kind === "Apply" &&
    expression.operator.kind === "Internal" &&
    expression.operator.builtin === "Cdot" &&
    expression.args.length === 1 &&
    expression.args[0].kind !== "Lambda";
  if (isInvalid) throw new TlapmBugError();
  return mapScoped(
    undefined,
    expression,
    (_state, child) => checkArity(child),
    () => undefined,
  );
};

export const lambdify = (
  anonymizer: Anonymizer,
  onWarning: (warning: ObligationWarning) => void,
  scope: Scope | undefined,
  expression: Expr,
) => {
  const expanded = expandDefinitions(onWarning, scope, expression, undefined);
  const bound = shiftIndices(shift(0), bindVariables(undefined, undefined, scope, expanded));
  return checkArity(renameParams(anonymizer.expr(scope, bound)));
};

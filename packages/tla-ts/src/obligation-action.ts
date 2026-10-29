// A port of tlapm's Expr.Action. Instantiation lambdifies each definition and theorem: each
// ENABLED and \cdot takes a LAMBDA over the variables it binds, after expanding the definitions
// in its scope that soundness needs expanded. The ExpandENABLED and ExpandCdot frontends then
// replace each LAMBDA with an existential quantifier.

import { TlaProofError, TlapmBugError, TlaProverError } from "./errors";
import type { Anonymizer } from "./obligation-anon";
import {
  adjoin,
  adjoinAll,
  applyBuiltin,
  at,
  bumpBy,
  getAtPrefix,
  getErrorNote,
  getFresh,
  getLocusText,
  getScopeAt,
  mapScoped,
  normalizeApply,
  shift,
  stripProps,
  substituteExpr,
  type Expr,
  type ObligationWarning,
  type Param,
  type Scope,
  type Substitution,
} from "./obligation-expression";
import { getLevelInfo, LEVEL_NUMBERS } from "./obligation-levels";

// Which of ENABLED and \cdot a pass handles, and whether it may expand the definitions that
// soundness needs expanded, as the AutoUSE directive allows.
export interface ActionOptions {
  isEnabled: boolean;
  isCdot: boolean;
  isAutoUse: boolean;
}

interface FreshNames {
  names: string[];
  depth: number;
}

type Warn = (warning: ObligationWarning) => void;

const ENABLED_WRAPPER = "EnabledWrapper";
const CDOT_WRAPPER = "CdotWrapper";

const NESTED_ENABLED =
  "Nested occurrence of the operator `ENABLED` found in scope of `\\cdot` when expanding `\\cdot`. Using the proof directive `ExpandENABLED` from the module `TLAPS` is expected to avoid this error.For example, writing `BY ExpandENABLED`.";

const NESTED_CDOT =
  "Nested occurrence of the operator `\\cdot` found in scope of `ENABLED` when expanding `ENABLED`. Using the proof directive `ExpandCdot` from the module `TLAPS` is expected to avoid this error.";

// Util.eprintf ~at:from "%s" printed, then failwith failure, which keeps a backend from running.
const fail = (onWarning: Warn, from: Expr, printed: string, failure = printed): never => {
  onWarning(getErrorNote(from.location, printed));
  throw new TlaProverError(failure);
};

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

const isWrapper = (expression: Expr) =>
  expression.kind === "Opaque" &&
  (expression.name === ENABLED_WRAPPER || expression.name === CDOT_WRAPPER);

const isLambdified = (expression: Expr) =>
  expression.kind === "Apply" &&
  expression.args.length === 1 &&
  expression.args[0].kind === "Lambda" &&
  (isActionOperator(expression.operator) || isWrapper(expression.operator));

const isBuiltinApply = (expression: Expr, builtin: "ENABLED" | "Cdot") =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  expression.operator.builtin === builtin;

const getInitialLevel = (level: number | undefined) =>
  level === undefined ? 2 : Math.min(2, level);

const getDecrementedLevel = (level: number | undefined) =>
  level === undefined ? undefined : Math.max(1, level - 1);

// auto_expansion_of_defs. ENABLED and the first argument of \cdot need every definition of action
// level expanded, a prime lowers that bound to 1, and so does the second argument of \cdot.
const expandDefinitions = (
  options: ActionOptions,
  onWarning: Warn,
  scope: Scope | undefined,
  expression: Expr,
  level: number | undefined,
): Expr => {
  const recurse = (inner: Expr, innerLevel = level) =>
    expandDefinitions(options, onWarning, scope, inner, innerLevel);
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
      if (level !== undefined && !options.isCdot) {
        fail(
          onWarning,
          expression,
          `${NESTED_CDOT}For example, writing \`BY ExpandCdot\`.`,
          "Expr.Action",
        );
      }
      return {
        ...expression,
        args: options.isCdot
          ? [recurse(first, getInitialLevel(level)), recurse(second, 1)]
          : [recurse(first), recurse(second)],
      };
    }
    if (builtin === "ENABLED" && expression.args.length === 1) {
      if (level !== undefined && !options.isEnabled) {
        fail(onWarning, expression, NESTED_ENABLED, "Expr.Action");
      }
      return {
        ...expression,
        args: [options.isEnabled ? recurse(first, getInitialLevel(level)) : recurse(first)],
      };
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
      (inner, child) => expandDefinitions(options, onWarning, inner, child, level),
      adjoin,
    );
  }
  if (level === undefined) return expression;
  const expressionLevel = getLevelInfo(scope, expression).level;
  const hyp = getHyp(scope, head.index);
  const getDeclaration = (name: string) =>
    `The operator \`${name}\` is declared at:\n${hyp.location ? getLocusText(hyp.location) : "<unknown location>"}`;
  if (hyp.kind === "Fresh" && hyp.level === "Unknown") {
    onWarning(
      getErrorNote(
        expression.location,
        `Declared operator \`${hyp.name}\` has unknown level and occurs within the scope of \`ENABLED\` or \`\\cdot\` where soundness requires expanding expressions of level >= ${level}.\nIf a constant operator is substituted for this operator, then the expression that results from applying this declared operator has expression level ${expressionLevel}.\n May need expansion. A declared operator cannot be expanded.\n${getDeclaration(hyp.name)}\n and has arity: ${hyp.shape}`,
      ),
    );
    throw new TlapmBugError(
      'File "src/expr/e_action.ml", line 367, characters 20-26: Assertion failed',
    );
  }
  if (expressionLevel < level) return expression;
  if (expressionLevel > 2 || hyp.kind === "Fact") throw new TlapmBugError();
  if (hyp.kind === "Flex") {
    if (expression.kind !== "Ix") throw new TlapmBugError();
    return expression;
  }
  if (hyp.kind === "Fresh") {
    const message = `The expression that results from applying the declared operator \`${hyp.name}\` has expression level ${expressionLevel} within the scope of \`ENABLED\` or \`\\cdot\` where soundness requires expanding expressions of level >= ${level}. A declared operator cannot be expanded.\n${getDeclaration(hyp.name)}\n and has level: ${LEVEL_NUMBERS[hyp.level]}\n and arity: ${hyp.shape}`;
    onWarning(getErrorNote(expression.location, message));
    throw new TlaProofError(message);
  }
  const definition = hyp.definition;
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
    throw new TlapmBugError();
  }
  if (!options.isAutoUse) {
    const names =
      options.isEnabled && options.isCdot
        ? [
            "the operators `ENABLED` and `\\cdot`",
            "the proof directives `ExpandENABLED` and `ExpandCdot`",
          ]
        : options.isEnabled
          ? ["the operator `ENABLED`", "`ExpandENABLED` proof directive"]
          : ["the operator `\\cdot`", "`ExpandCdot` proof directive"];
    const body = definition.body.kind === "Lambda" ? definition.body.body : definition.body;
    const getAt = (from: Expr) =>
      from.location ? getLocusText(from.location) : "<unknown location>";
    fail(
      onWarning,
      expression,
      `Hidden definition of operator \`${definition.name}\` needs expansion for soundly expanding ${names[0]} (using rigid quantification).\nThe expansion of ${names[0]} has been activated with the ${names[1]} from the module \`TLAPS\`.\nThe operator \`${definition.name}\` is defined at: \n\t${getAt(body)}\nand the operator \`${definition.name}\` occurs at: \n\t${getAt(expression)}\nUsing the proof directive \`AutoUSE\` from the module \`TLAPS\`, or \`BY DEF ${definition.name}\` is expected to avoid this error.\n`,
    );
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
export const rewriteUnchanged = (expression: Expr): Expr => {
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
  options: ActionOptions,
  onWarning: Warn,
  current: FreshNames | undefined,
  primed: FreshNames | undefined,
  scope: Scope | undefined,
  expression: Expr,
): Expr => {
  const recurse = (inner: Expr) => bindVariables(options, onWarning, current, primed, scope, inner);
  const isInScope = current !== undefined || primed !== undefined;
  const lambdifyOperator = (operator: Expr, args: Expr[]) => {
    const fresh: FreshNames = {
      names: [],
      depth: Math.max(current?.depth ?? 0, primed?.depth ?? 0) + 1,
    };
    const [first, second] = args;
    const bound = [
      bindVariables(options, onWarning, current, fresh, scope, first),
      ...(second ? [bindVariables(options, onWarning, fresh, primed, scope, second)] : []),
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
      (options.isEnabled && builtin === "ENABLED" && expression.args.length === 1) ||
      (options.isCdot && builtin === "Cdot" && expression.args.length === 2)
    ) {
      return lambdifyOperator(expression.operator, expression.args);
    }
    if (builtin === "ENABLED" && isInScope)
      fail(onWarning, expression, NESTED_ENABLED, "Expr.Action");
    if (builtin === "Cdot" && isInScope) {
      fail(
        onWarning,
        expression,
        `${NESTED_CDOT} For example, writing \`BY ExpandCdot\`.`,
        "Expr.Action",
      );
    }
    if (builtin === "Prime" && expression.args.length === 1) {
      const arg = bindVariables(options, onWarning, primed, undefined, scope, expression.args[0]);
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
    onWarning(
      getErrorNote(
        expression.location,
        `Named operator \`${expression.operator.name}\` unexpected after anonymization.`,
      ),
    );
    throw new TlapmBugError(
      'File "src/expr/e_action.ml", line 1048, characters 12-18: Assertion failed',
    );
  }
  return mapScoped(
    scope,
    expression,
    (inner, child) => bindVariables(options, onWarning, current, primed, inner, child),
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

// normalize_lambda_param_names: the parameters keep their names or become r#0, r#1, ..., and the
// operator becomes EnabledWrapper or CdotWrapper.
const renameParams = (isKeepingNames: boolean, expression: Expr): Expr => {
  if (expression.kind === "Apply" && isActionOperator(expression.operator)) {
    const [lambda] = expression.args;
    if (expression.args.length !== 1 || lambda.kind !== "Lambda" || lambda.params[0].name === "_") {
      throw new TlapmBugError();
    }
    const name = expression.operator.builtin === "Cdot" ? CDOT_WRAPPER : ENABLED_WRAPPER;
    return {
      kind: "Apply",
      operator: at({ kind: "Opaque", name }, expression.operator),
      args: [
        {
          kind: "Lambda",
          params: lambda.params.map((param, index) => ({
            name: isKeepingNames ? param.name : `r#${index}`,
            shape: 0,
          })),
          body: renameParams(isKeepingNames, lambda.body),
        },
      ],
    };
  }
  return mapScoped(
    undefined,
    expression,
    (_state, child) => renameParams(isKeepingNames, child),
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

// lambdify_action_operators#expand: binding, shifting, anonymizing the bound names, and renaming.
const lambdifyOperators = (
  anonymizer: Anonymizer,
  onWarning: Warn,
  scope: Scope | undefined,
  expression: Expr,
  options: ActionOptions,
  isKeepingNames: boolean,
) => {
  const bound = bindVariables(options, onWarning, undefined, undefined, scope, expression);
  return renameParams(isKeepingNames, anonymizer.expr(scope, shiftIndices(shift(0), bound)));
};

const LAMBDIFY_ALL: ActionOptions = { isEnabled: true, isCdot: true, isAutoUse: true };

export const lambdify = (
  anonymizer: Anonymizer,
  onWarning: Warn,
  scope: Scope | undefined,
  expression: Expr,
  options = LAMBDIFY_ALL,
) => {
  const expanded = expandDefinitions(options, onWarning, scope, expression, undefined);
  return checkArity(lambdifyOperators(anonymizer, onWarning, scope, expanded, options, false));
};

// replace_action_operators_with_quantifiers: each lambdified ENABLED or \cdot that the frontend
// expands becomes \E over the parameters of its LAMBDA.
const replaceWithQuantifiers = (
  options: ActionOptions,
  onWarning: Warn,
  scope: Scope | undefined,
  expression: Expr,
  isInScope: boolean,
): Expr => {
  const quantify = (params: Param[], body: Expr): Expr => ({
    kind: "Quant",
    quantifier: "Exists",
    bounds: params.map((param) => ({
      name: param.name,
      level: "Constant",
      domain: { kind: "NoDomain" },
    })),
    body: replaceWithQuantifiers(
      options,
      onWarning,
      adjoinAll(
        scope,
        params.map((param) => getFresh(param.name, "Unknown", param.shape)),
      ),
      body,
      true,
    ),
  });
  const isExpanded = (builtin: "ENABLED" | "Cdot") =>
    builtin === "ENABLED" ? options.isEnabled : options.isCdot;
  if (expression.kind === "Apply" && expression.args.length === 1) {
    const operator = expression.operator;
    const [lambda] = expression.args;
    if (lambda.kind === "Lambda") {
      if (
        operator.kind === "Opaque" &&
        ((options.isEnabled && operator.name === ENABLED_WRAPPER) ||
          (options.isCdot && operator.name === CDOT_WRAPPER))
      ) {
        return quantify(lambda.params, lambda.body);
      }
      if (operator.kind === "Ix" && (options.isEnabled || options.isCdot)) {
        const hyp = getHyp(scope, operator.index);
        const isWrapperDefinition =
          hyp.kind === "Defn" &&
          hyp.definition.kind === "Operator" &&
          (hyp.definition.name === ENABLED_WRAPPER || hyp.definition.name === CDOT_WRAPPER);
        if (isWrapperDefinition) return quantify(lambda.params, lambda.body);
      }
      if (isActionOperator(operator) && isExpanded(operator.builtin)) {
        return quantify(lambda.params, lambda.body);
      }
    }
    if (isActionOperator(operator) && isExpanded(operator.builtin)) {
      return replaceWithQuantifiers(options, onWarning, scope, lambda, true);
    }
  }
  if (isBuiltinApply(expression, "ENABLED") && isInScope) {
    fail(onWarning, expression, NESTED_ENABLED, "Expr.Action");
  }
  if (isBuiltinApply(expression, "Cdot") && isInScope) {
    fail(
      onWarning,
      expression,
      `${NESTED_CDOT} For example, writing \`BY ExpandCdot\`.`,
      "Expr.Action",
    );
  }
  return mapScoped(
    scope,
    expression,
    (inner, child) => replaceWithQuantifiers(options, onWarning, inner, child, isInScope),
    adjoin,
  );
};

// commute_exists_disjunction: \E x : A \/ B as (\E x : A) \/ (\E x : B), everywhere.
const commuteExistsDisjunction = (expression: Expr): Expr => {
  if (expression.kind === "Quant" && expression.quantifier === "Exists") {
    const body = expression.body;
    if (body.kind === "List" && body.bullet === "Or") {
      return commuteExistsDisjunction({
        ...body,
        items: body.items.map((item) => ({ ...expression, body: item })),
      });
    }
    if (
      body.kind === "Apply" &&
      body.operator.kind === "Internal" &&
      body.operator.builtin === "Disj"
    ) {
      if (body.args.length !== 2) throw new TlapmBugError();
      return commuteExistsDisjunction({
        ...body,
        args: body.args.map((arg) => ({ ...expression, body: arg })),
      });
    }
  }
  return mapScoped(
    undefined,
    expression,
    (_state, child) => commuteExistsDisjunction(child),
    () => undefined,
  );
};

// expand_action_operators, the ExpandENABLED and ExpandCdot frontends.
export const expandActionOperators = (
  anonymizer: Anonymizer,
  onWarning: Warn,
  scope: Scope | undefined,
  expression: Expr,
  options: ActionOptions,
) => {
  const expanded = expandDefinitions(options, onWarning, scope, expression, undefined);
  const lambdified = lambdifyOperators(anonymizer, onWarning, scope, expanded, options, true);
  return commuteExistsDisjunction(
    replaceWithQuantifiers(options, onWarning, scope, lambdified, false),
  );
};

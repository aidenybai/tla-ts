// tlapm's expression IR (E_t) with de Bruijn indices, and the visitors that map over it (Visit).

import type { OldMethod, PragmaSetting } from "./pragma";

export interface Locus {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface ObligationWarning {
  text: string;
  channel: "toolbox" | "toolboxOnly" | "stderr" | "stdout";
}

export type Warn = (warning: ObligationWarning) => void;

export const getLocusPosition = (locus: Locus) => {
  const end = locus.endColumn - 1;
  if (locus.startLine !== locus.endLine)
    return `line ${locus.startLine}, character ${locus.startColumn} to line ${locus.endLine}, character ${end}`;
  return locus.startColumn >= end
    ? `line ${locus.startLine}, character ${locus.startColumn}`
    : `line ${locus.startLine}, characters ${locus.startColumn}-${end}`;
};

export const getLocusText = (locus: Locus) =>
  `File ${JSON.stringify(locus.file)}, ${getLocusPosition(locus)}`;

export const getLocationText = (locus: Locus | undefined) =>
  locus ? getLocusText(locus) : "<unknown location>";

export const getAtPrefix = (locus: Locus | undefined) => `${getLocationText(locus)}:\n`;

export const getErrorNote = (locus: Locus | undefined, message: string): ObligationWarning => ({
  text: `${getAtPrefix(locus)}Error: ${message}`,
  channel: "stderr",
});

export const getLocusPrefix = (locus: Locus | undefined) =>
  locus ? `${getLocusText(locus)} :\n` : "";

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

export type ExceptPoint = { kind: "Dot"; field: string } | { kind: "Apply"; expression: Expr };

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
  location?: Locus;
}

// isAtomic is Expr.Deref.atomic: a resolved subexpression reference, which has no subexpressions.
interface ExprProps {
  location?: Locus;
  isAtomic?: boolean;
}

export type Expr = ExprCore & ExprProps;

export type ExprCore =
  | { kind: "Ix"; index: number }
  | { kind: "Opaque"; name: string }
  | { kind: "Internal"; builtin: Builtin }
  | { kind: "Lambda"; params: Param[]; body: Expr }
  | { kind: "Sequent"; sequent: Sequent }
  | { kind: "Bang"; expression: Expr; selectors: Selector[] }
  | { kind: "Apply"; operator: Expr; args: Expr[] }
  | { kind: "With"; expression: Expr; method: OldMethod }
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

export interface Field {
  name: string;
  value: Expr;
}

export interface InstanceDefinition {
  args: string[];
  module: string;
  substitutions: { name: string; expression: Expr }[];
  location?: Locus;
}

export type Defn = DefnCore & { location?: Locus };

type DefnCore =
  | { kind: "Recursive"; name: string; shape: Shape }
  | { kind: "Operator"; name: string; body: Expr }
  | { kind: "Instance"; name: string; instance: InstanceDefinition }
  | { kind: "Bpragma"; name: string; body: Expr; methods: PragmaSetting[][] };

export type Visibility = "Visible" | "Hidden";

// When a fact holds: at every point of a behavior, or only at the current one.
export type Time = "Now" | "Always";

// A step or a DEFINE in a proof keeps the time of the scope it is made in.
export type WhereDefined = "Builtin" | "User" | { kind: "Proof"; time: Time };

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
      // Module.Elab judges whether each module definition is constant. One that anonymization meets
      // in a proof, such as a step or a DEFINE, has no judgment, so tlapm never counts it constant.
      isConstnessUnset?: boolean;
    }
  | { kind: "Fact"; expression: Expr; visibility: Visibility; time: Time; useLocation?: Locus };

export interface Sequent {
  context: Hyp[];
  active: Expr;
}

// tlapm's core @@ from, which takes the properties of from.
export const at = (core: ExprCore, from: ExprProps): Expr => {
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

export const isBuiltinApply = (
  expression: Expr,
  builtin: Builtin,
): expression is Extract<Expr, { kind: "Apply" }> =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  expression.operator.builtin === builtin;

export const applyBuiltin = (builtin: Builtin, args: Expr[], from: ExprProps): Expr =>
  at({ kind: "Apply", operator: at({ kind: "Internal", builtin }, from), args }, from);

export const exprifySequent = (sequent: Sequent): ExprCore =>
  sequent.context.length === 0 ? sequent.active : { kind: "Sequent", sequent };

// A persistent context, newest hypothesis first, so binders extend it without copying.
export interface Scope {
  hyp: Hyp;
  rest: Scope | undefined;
  size: number;
}

export const adjoin = (scope: Scope | undefined, hyp: Hyp): Scope => ({
  hyp,
  rest: scope,
  size: (scope?.size ?? 0) + 1,
});

export const adjoinAll = (scope: Scope | undefined, hyps: Hyp[]) =>
  hyps.reduce<Scope | undefined>(adjoin, scope);

export const getScopeHyps = (scope: Scope | undefined): Hyp[] => {
  const hyps: Hyp[] = [];
  for (let current = scope; current; current = current.rest) hyps.push(current.hyp);
  return hyps.reverse();
};

export const findNamed = (scope: Scope | undefined, name: string) => {
  let depth = 0;
  for (let current = scope; current; current = current.rest) {
    if (getHypName(current.hyp) === name) return { depth, hyp: current.hyp };
    depth++;
  }
  return undefined;
};

export const getScopeAt = (scope: Scope | undefined, depth: number) => {
  let current = scope;
  for (let index = 0; index < depth && current; index++) current = current.rest;
  return current;
};

export const mapAccumulate = <State, Item, Result>(
  state: State,
  items: Item[],
  step: (state: State, item: Item) => [State, Result],
): [State, Result[]] => {
  const results: Result[] = [];
  const final = items.reduce((current, item) => {
    const [next, result] = step(current, item);
    results.push(result);
    return next;
  }, state);
  return [final, results];
};

// A mapped context prefix: the hypothesis its last key maps to, if any, and the state after it.
interface MappedPrefix<State> {
  state: State;
  hyp: Hyp | undefined;
  parent: MappedPrefix<State> | undefined;
  next: WeakMap<Hyp, MappedPrefix<State>>;
}

// mapAccumulate over a context that maps each prefix of keys once, as the obligations of a module
// share most of their context by identity. The input at each position must depend on the keys up
// to it alone, and the step on the input, its key, and the state.
export const createContextMap = <State>(
  initial: State,
  step: (state: State, input: Hyp, key: Hyp) => [State, Hyp | undefined],
) => {
  const empty: MappedPrefix<State> = {
    state: initial,
    hyp: undefined,
    parent: undefined,
    next: new WeakMap(),
  };
  return (keys: Hyp[], inputs = keys) => {
    const last = keys.reduce((prefix, key, index) => {
      const known = prefix.next.get(key);
      if (known) return known;
      const [state, hyp] = step(prefix.state, inputs[index], key);
      const mapped: MappedPrefix<State> = { state, hyp, parent: prefix, next: new WeakMap() };
      prefix.next.set(key, mapped);
      return mapped;
    }, empty);
    const context: Hyp[] = [];
    for (let prefix: MappedPrefix<State> | undefined = last; prefix; prefix = prefix.parent) {
      if (prefix.hyp) context.push(prefix.hyp);
    }
    return { state: last.state, context: context.reverse() };
  };
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

export const getFact = (
  expression: Expr,
  visibility: Visibility,
  time: Time,
  location: Locus | undefined,
) => ({ kind: "Fact", expression, visibility, time, location }) satisfies Hyp;

// What a quantifier binds each name as, a LAMBDA each parameter, and a LET each definition, as
// Visit.map does.
export const getBoundFresh = (bound: Bound) => getFresh(bound.name, bound.level);

export const getParamFresh = (param: Param) => getFresh(param.name, "Unknown", param.shape);

export const getLocalDefn = (definition: Defn) =>
  ({
    kind: "Defn",
    definition,
    whereDefined: "User",
    visibility: "Visible",
    isLocal: true,
  }) satisfies Hyp;

// The node without its properties, as tlapm's e.core.
export const stripProps = (expression: Expr): ExprCore => {
  if (!expression.location && !expression.isAtomic) return expression;
  const { location: _location, isAtomic: _isAtomic, ...core } = expression;
  return core;
};

export const mapBoundDomains = (bounds: Bound[], map: (domain: Expr) => Expr): Bound[] =>
  bounds.map((bound) =>
    bound.domain.kind === "Domain"
      ? { ...bound, domain: { kind: "Domain", expression: map(bound.domain.expression) } }
      : bound,
  );

export const mapSelectorArgs = (selector: Selector, map: (arg: Expr) => Expr): Selector =>
  selector.kind === "Instance" || selector.kind === "Label"
    ? { ...selector, args: selector.args.map(map) }
    : selector;

export const mapExceptSpecs = (specs: ExceptSpec[], map: (inner: Expr) => Expr): ExceptSpec[] =>
  specs.map((spec) => {
    const value = map(spec.value);
    const trail = spec.trail.map((point): ExceptPoint =>
      point.kind === "Apply" ? { kind: "Apply", expression: map(point.expression) } : point,
    );
    return { trail, value };
  });

export const mapDefnBody = (definition: Defn, map: (body: Expr) => Expr): Defn =>
  definition.kind === "Operator" || definition.kind === "Bpragma"
    ? { ...definition, body: map(definition.body) }
    : definition;

export const mapHyp = (hyp: Hyp, map: (inner: Expr) => Expr, hyps: "visible" | "all"): Hyp => {
  if (hyp.kind === "Fresh") return hyp.domain ? { ...hyp, domain: map(hyp.domain) } : hyp;
  if (hyp.kind === "Flex" || (hyps === "visible" && hyp.visibility === "Hidden")) return hyp;
  if (hyp.kind === "Defn") return { ...hyp, definition: mapDefnBody(hyp.definition, map) };
  return { ...hyp, expression: map(hyp.expression) };
};

// Visit.map, threading a state through each binder: a scope or a substitution. Visit.map_visible_hyp
// binds hidden hypotheses without visiting them, and Visit.map visits them too. Children map in
// OCaml evaluation order, last constructor argument first, which decides the error tlapm reports.
export const mapScoped = <State>(
  state: State,
  expression: Expr,
  map: (state: State, inner: Expr) => Expr,
  bind: (state: State, hyp: Hyp) => State,
  hyps: "visible" | "all" = "visible",
): Expr => {
  const recurse = (inner: Expr) => map(state, inner);
  const bindBounds = (bounds: Bound[]) =>
    bounds.reduce((current, bound) => bind(current, getBoundFresh(bound)), state);
  switch (expression.kind) {
    case "Ix":
    case "Internal":
    case "Opaque":
    case "String":
    case "Num":
    case "At":
      return expression;
    case "Lambda": {
      const inner = expression.params.reduce((current, param) => {
        const fresh = getParamFresh(param);
        return bind(current, param.location ? { ...fresh, location: param.location } : fresh);
      }, state);
      return { ...expression, body: map(inner, expression.body) };
    }
    case "Sequent": {
      const [inner, context] = mapAccumulate(state, expression.sequent.context, (current, hyp) => {
        const mapped = mapHyp(hyp, (child) => map(current, child), hyps);
        return [bind(current, mapped), mapped];
      });
      return { ...expression, sequent: { context, active: map(inner, expression.sequent.active) } };
    }
    case "Let": {
      const [inner, definitions] = mapAccumulate(
        state,
        expression.definitions,
        (current, definition) => {
          const mapped = mapDefnBody(definition, (body) => map(current, body));
          return [bind(current, getLocalDefn(mapped)), mapped];
        },
      );
      return { ...expression, definitions, body: map(inner, expression.body) };
    }
    case "Quant":
    case "Fcn": {
      const bounds = mapBoundDomains(expression.bounds, recurse);
      return { ...expression, bounds, body: map(bindBounds(bounds), expression.body) };
    }
    case "SetOf": {
      const bounds = mapBoundDomains(expression.bounds, recurse);
      return { ...expression, bounds, element: map(bindBounds(bounds), expression.element) };
    }
    case "Tquant": {
      const inner = expression.names.reduce(
        (current, name) => bind(current, { kind: "Flex", name }),
        state,
      );
      return { ...expression, body: map(inner, expression.body) };
    }
    case "Choose": {
      const domain = expression.domain && recurse(expression.domain);
      const hyp = domain
        ? getBoundedFresh(expression.name, domain)
        : getFresh(expression.name, "Constant");
      return { ...expression, domain, body: map(bind(state, hyp), expression.body) };
    }
    case "SetSt": {
      const domain = recurse(expression.domain);
      const hyp = getBoundedFresh(expression.name, domain);
      return { ...expression, domain, body: map(bind(state, hyp), expression.body) };
    }
    case "Bang": {
      const selectors = expression.selectors.map((selector) => mapSelectorArgs(selector, recurse));
      return { ...expression, expression: recurse(expression.expression), selectors };
    }
    case "Apply": {
      const args = expression.args.map(recurse);
      return { ...expression, operator: recurse(expression.operator), args };
    }
    case "With":
    case "Dot":
    case "Parens":
      return { ...expression, expression: recurse(expression.expression) };
    case "If": {
      const alternative = recurse(expression.alternative);
      const consequent = recurse(expression.consequent);
      return { ...expression, condition: recurse(expression.condition), consequent, alternative };
    }
    case "List":
      return { ...expression, items: expression.items.map(recurse) };
    case "SetEnum":
    case "Tuple":
      return { ...expression, elements: expression.elements.map(recurse) };
    case "Product":
      return { ...expression, factors: expression.factors.map(recurse) };
    case "FcnApp": {
      const args = expression.args.map(recurse);
      return { ...expression, function: recurse(expression.function), args };
    }
    case "Arrow": {
      const range = recurse(expression.range);
      return { ...expression, domain: recurse(expression.domain), range };
    }
    case "Rect":
    case "Record":
      return {
        ...expression,
        fields: expression.fields.map((field) => ({
          name: field.name,
          value: recurse(field.value),
        })),
      };
    case "Except": {
      const specs = mapExceptSpecs(expression.specs, recurse);
      return { ...expression, function: recurse(expression.function), specs };
    }
    case "Sub":
    case "Tsub":
    case "Fair":
      return {
        ...expression,
        subscript: recurse(expression.subscript),
        action: recurse(expression.action),
      };
    case "Case": {
      const other = expression.other && recurse(expression.other);
      const arms = expression.arms.map((arm) => {
        const body = recurse(arm.body);
        return { condition: recurse(arm.condition), body };
      });
      return { ...expression, arms, other };
    }
  }
};

// Visit.map without a state: every child, the hidden hypotheses of an ASSUME included.
export const mapChildren = (expression: Expr, map: (inner: Expr) => Expr): Expr =>
  mapScoped(
    undefined,
    expression,
    (_state, inner) => map(inner),
    () => undefined,
    "all",
  );

export const getChildren = (expression: Expr) => {
  const children: Expr[] = [];
  mapChildren(expression, (inner) => {
    children.push(inner);
    return inner;
  });
  return children;
};

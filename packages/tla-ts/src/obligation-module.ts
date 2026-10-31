// A port of tlapm's module pipeline: flattening EXTENDS (Module.Flatten), normalization
// (Module.Elab.normalize) and obligation generation (Module.Gen).

import { TlaProofError, TlapmBugError } from "./errors";
import { lambdify } from "./obligation-action";
import type { Anonymizer } from "./obligation-anon";
import {
  adjoinAll,
  at,
  bumpBy,
  consAll,
  consSubstitution,
  exprifySequent,
  findNamed,
  getAtPrefix,
  getLocusText,
  getLocusPrefix,
  getScopeHyps,
  mapAccumulate,
  getFresh,
  isEqualHyp,
  shiftExpr,
  substituteDefn,
  substituteExpr,
  substituteExprs,
  substituteHyp,
  substituteSequent,
  shift,
  type Builtin,
  type Defn,
  type Expr,
  type Hyp,
  type InstanceDefinition,
  type Locus,
  type ObligationWarning,
  type Scope,
  type Sequent,
  type Substitution,
  type Visibility,
  type WhereDefined,
} from "./obligation-expression";
import {
  EMPTY_SUMMARY,
  getProofSummary,
  joinSummaries,
  type Generator,
  type ProofSummary,
} from "./obligation-generate";
import {
  getUnique,
  type Counter,
  type Obligation,
  type Proof,
  type Usable,
} from "./obligation-proof";
import { getScopeTime } from "./obligation-temporal";

export type ModuleUnit = ModuleUnitCore & { location?: Locus };

type ModuleUnitCore =
  | { kind: "Constants" | "Recursives"; declarations: { name: string; shape: number }[] }
  | { kind: "Variables"; names: string[] }
  | {
      kind: "Definition";
      definition: Defn;
      whereDefined: WhereDefined;
      visibility: Visibility;
      isLocal: boolean;
    }
  | { kind: "Axiom"; name: string | undefined; expression: Expr }
  | {
      kind: "Theorem";
      name: string | undefined;
      sequent: Sequent;
      axiomCount: number;
      proof: Proof;
    }
  | { kind: "Submod"; module: Mule }
  | { kind: "Mutate"; mode: "Use" | "Hide"; isSuppressed: boolean; usable: Usable }
  | { kind: "Anoninst"; instance: InstanceDefinition; isLocal: boolean };

// depth is the size of the context the module was normalized in, which instantiation shifts
// its body by.
export interface Mule {
  name: string;
  extendees: string[];
  extendeeLocations?: Locus[];
  body: ModuleUnit[];
  isImportant: boolean;
  isStandard?: boolean;
  depth?: number;
  location?: Locus;
}

const getBuiltinConstant = (name: string, builtin: Builtin): ModuleUnit => ({
  kind: "Definition",
  definition: { kind: "Operator", name, body: { kind: "Internal", builtin } },
  whereDefined: "Builtin",
  visibility: "Visible",
  isLocal: false,
});

const getBuiltinOperator = (arity: number, name: string, builtin: Builtin): ModuleUnit => ({
  kind: "Definition",
  definition: {
    kind: "Operator",
    name,
    body: {
      kind: "Lambda",
      params: Array.from({ length: arity }, (_item, index) => ({
        name: `x${index + 1}`,
        shape: 0,
      })),
      body: {
        kind: "Apply",
        operator: { kind: "Internal", builtin },
        args: Array.from({ length: arity }, (_item, index) => ({
          kind: "Ix",
          index: arity - index,
        })),
      },
    },
  },
  whereDefined: "Builtin",
  visibility: "Visible",
  isLocal: false,
});

const NATURALS: ModuleUnit[] = [
  getBuiltinConstant("Nat", "Nat"),
  getBuiltinOperator(2, "+", "Plus"),
  getBuiltinOperator(2, "-", "Minus"),
  getBuiltinOperator(2, "*", "Times"),
  getBuiltinOperator(2, "^", "Exp"),
  getBuiltinOperator(2, "<", "Lt"),
  getBuiltinOperator(2, ">", "Gt"),
  getBuiltinOperator(2, "=<", "Lteq"),
  getBuiltinOperator(2, ">=", "Gteq"),
  getBuiltinOperator(2, "%", "Remainder"),
  getBuiltinOperator(2, "\\div", "Quotient"),
  getBuiltinOperator(2, "..", "Range"),
];

const INTEGERS = [
  ...NATURALS,
  getBuiltinConstant("Int", "Int"),
  getBuiltinOperator(1, "-.", "Uminus"),
];

const REALS = [
  ...INTEGERS,
  getBuiltinConstant("Real", "Real"),
  getBuiltinOperator(2, "/", "Ratio"),
  getBuiltinConstant("Infinity", "Infinity"),
];

const SEQUENCES = [
  getBuiltinOperator(1, "Seq", "Seq"),
  getBuiltinOperator(1, "Len", "Len"),
  getBuiltinOperator(2, "BSeq", "BSeq"),
  getBuiltinOperator(2, "\\o", "Cat"),
  getBuiltinOperator(2, "Append", "Append"),
  getBuiltinOperator(1, "Head", "Head"),
  getBuiltinOperator(1, "Tail", "Tail"),
  getBuiltinOperator(3, "SubSeq", "SubSeq"),
  getBuiltinOperator(2, "SelectSeq", "SelectSeq"),
];

const TLC = [
  getBuiltinOperator(2, "Print", "Print"),
  getBuiltinOperator(1, "PrintT", "PrintT"),
  getBuiltinOperator(2, "Assert", "Assert"),
  getBuiltinConstant("JavaTime", "JavaTime"),
  getBuiltinOperator(1, "TLCGet", "TLCGet"),
  getBuiltinOperator(2, "TLCSet", "TLCSet"),
  getBuiltinOperator(2, ":>", "OneArg"),
  getBuiltinOperator(2, "@@", "Extend"),
  getBuiltinOperator(1, "Permutations", "Permutations"),
  getBuiltinOperator(2, "SortSeq", "SortSeq"),
  getBuiltinOperator(1, "RandomElement", "RandomElement"),
  getBuiltinConstant("Any", "Any"),
  getBuiltinOperator(1, "ToString", "ToString"),
];

const getStandard = (name: string, body: ModuleUnit[]): Mule => ({
  name,
  extendees: [],
  body,
  isImportant: false,
  isStandard: true,
});

// Module.Standard.initctx, apart from $TLAPM, whose Builtins! names no module of the corpora uses.
export const STANDARD_MODULES = new Map(
  [
    getStandard("Naturals", NATURALS),
    getStandard("Integers", INTEGERS),
    getStandard("Reals", REALS),
    getStandard("Sequences", SEQUENCES),
    getStandard("TLC", TLC),
  ].map((module) => [module.name, module]),
);

const getUnitHyps = (unit: ModuleUnit): Hyp[] => {
  const location = unit.location;
  switch (unit.kind) {
    case "Constants":
      return unit.declarations.map((declaration) => ({
        kind: "Fresh",
        name: declaration.name,
        shape: declaration.shape,
        level: "Constant",
        domain: undefined,
        domainVisibility: "Visible",
        location,
      }));
    case "Recursives":
      return unit.declarations.map((declaration) => ({
        kind: "Defn",
        definition: {
          kind: "Recursive",
          name: declaration.name,
          shape: declaration.shape,
          location,
        },
        whereDefined: "User",
        visibility: "Hidden",
        isLocal: false,
        location,
      }));
    case "Variables":
      return unit.names.map((name) => ({ kind: "Flex", name, location }));
    case "Definition":
      return [
        {
          kind: "Defn",
          definition: unit.definition,
          whereDefined: unit.whereDefined,
          visibility: unit.visibility,
          isLocal: unit.isLocal,
          location,
        },
      ];
    case "Axiom":
      return unit.name === undefined
        ? [
            {
              kind: "Fact",
              expression: unit.expression,
              visibility: "Hidden",
              time: "Always",
              location,
            },
          ]
        : getNamedFact(unit.name, unit.expression, location);
    case "Theorem": {
      const sequent = substituteSequent(shift(-unit.axiomCount), {
        ...unit.sequent,
        context: unit.sequent.context.slice(unit.axiomCount),
      });
      const body = at(exprifySequent(sequent), unit);
      return unit.name === undefined
        ? [{ kind: "Fact", expression: body, visibility: "Hidden", time: "Always", location }]
        : getNamedFact(unit.name, body, location);
    }
    case "Mutate":
      return unit.mode === "Use"
        ? unit.usable.facts.map((fact, index) => ({
            kind: "Fact",
            expression: shiftExpr(index, fact),
            visibility: "Visible",
            time: "Always",
            location,
          }))
        : [];
    case "Submod":
    case "Anoninst":
      return [];
  }
};

const getHypSize = (unit: ModuleUnit) =>
  unit.kind === "Axiom" || unit.kind === "Theorem"
    ? unit.name === undefined
      ? 1
      : 2
    : getUnitHyps(unit).length;

const getNamedFact = (name: string, expression: Expr, location: Locus | undefined): Hyp[] => [
  {
    kind: "Defn",
    definition: { kind: "Operator", name, body: expression, location },
    whereDefined: "User",
    visibility: "Visible",
    isLocal: false,
    location,
  },
  {
    kind: "Fact",
    expression: { kind: "Ix", index: 1, location },
    visibility: "Hidden",
    time: "Always",
    location,
  },
];

// Module.Flatten.exports: what an extending module sees, with local definitions inlined like
// builtins and proofs omitted.
const getExports = (module: Mule): ModuleUnit[] =>
  module.body.flatMap((unit): ModuleUnit[] => {
    switch (unit.kind) {
      case "Definition":
        return [{ ...unit, whereDefined: unit.isLocal ? "Builtin" : unit.whereDefined }];
      case "Mutate":
        return [];
      case "Theorem":
        return [
          { ...unit, proof: { kind: "Omitted", omission: "Elsewhere", location: unit.location } },
        ];
      case "Submod":
        return [{ ...unit, module: { ...unit.module, body: getExports(unit.module) } }];
      default:
        return [unit];
    }
  });

// tlapm recurses on a module that extends itself until the stack overflows.
export const flatten = (
  modules: Map<string, Mule>,
  module: Mule,
  seen: Set<string>,
  extending = new Set([module.name]),
): Mule => {
  const extension: ModuleUnit[] = [];
  for (const name of module.extendees) {
    if (seen.has(name)) continue;
    if (extending.has(name)) throw new TlapmBugError("Stack overflow");
    const extended = modules.get(name);
    if (!extended) throw new TlaProofError(`Module "${name}" unknown`);
    extension.push(...getExports(flatten(modules, extended, seen, new Set([...extending, name]))));
    seen.add(name);
  }
  return {
    ...module,
    body: [...extension, ...module.body].map((unit) =>
      unit.kind === "Submod" ? { ...unit, module: flatten(modules, unit.module, new Set()) } : unit,
    ),
  };
};

// Module.Dep.external_deps: the modules a module extends or instantiates, including those of its
// submodules.
export const getDependencies = (module: Mule) => {
  const dependencies = new Map<string, Locus | undefined>();
  const addDependency = (name: string, location: Locus | undefined) => {
    if (!dependencies.has(name)) dependencies.set(name, location);
  };
  const addExtendees = (extending: Mule) =>
    extending.extendees.forEach((name, index) =>
      addDependency(name, extending.extendeeLocations?.[index]),
    );
  const locals = new Set<string>();
  const submodules = new Map<string, Mule>();
  // Every INSTANCE definition inside a value, such as one in a LET.
  const addInstances = (value: unknown) => {
    if (typeof value !== "object" || value === null) return;
    if ("instance" in value && isInstanceDefinition(value.instance)) {
      addDependency(value.instance.module, value.instance.location);
    }
    Object.values(value).forEach(addInstances);
  };
  // The hypotheses of each unit, leaving out the proofs of theorems.
  const visit = (unit: ModuleUnit) => {
    if (unit.kind === "Theorem") addInstances(unit.sequent);
    else if (unit.kind !== "Submod") addInstances(unit);
    if (unit.kind !== "Submod") return;
    locals.add(unit.module.name);
    submodules.set(unit.module.name, unit.module);
    addExtendees(unit.module);
    unit.module.body.forEach(visit);
  };
  module.body.forEach(visit);
  locals.forEach((name) => dependencies.delete(name));
  addExtendees(module);
  return {
    dependencies: [...dependencies.keys()].sort(compareNames),
    locations: dependencies,
    submodules,
  };
};

const isInstanceDefinition = (value: unknown): value is InstanceDefinition =>
  typeof value === "object" &&
  value !== null &&
  "module" in value &&
  typeof value.module === "string" &&
  "substitutions" in value;

export const compareNames = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

// latestModules is the module context of the latest anonymization of an axiom, theorem or USE,
// which tlapm's anonymizer keeps using for the instances inside later definitions.
export interface Pipeline {
  anonymizer: Anonymizer;
  generator: Generator;
  salts: Counter;
  latestModules: Map<string, Mule>;
  onWarning: (warning: ObligationWarning) => void;
}

const substituteUsable = (substitution: Substitution, usable: Usable): Usable => ({
  facts: substituteExprs(substitution, usable.facts),
  defs: usable.defs.map((def) => {
    if (def.kind === "Dvar") return def;
    const substituted = substituteExpr(substitution, { kind: "Ix", index: def.index });
    if (substituted.kind !== "Ix") throw new TlaProofError("substitution produced bad definition");
    return { ...def, index: substituted.index };
  }),
});

// Module.Subst.app_modunit. Instantiated theorems carry omitted proofs, which a substitution leaves
// alone.
const substituteUnit = (
  substitution: Substitution,
  unit: ModuleUnit,
): [Substitution, ModuleUnit] => {
  switch (unit.kind) {
    case "Constants":
    case "Recursives":
      return [bumpBy(unit.declarations.length, substitution), unit];
    case "Variables":
      return [bumpBy(unit.names.length, substitution), unit];
    case "Definition":
      return [
        bumpBy(1, substitution),
        { ...unit, definition: substituteDefn(substitution, unit.definition) },
      ];
    case "Axiom":
      return [
        bumpBy(getHypSize(unit), substitution),
        { ...unit, expression: substituteExpr(substitution, unit.expression) },
      ];
    case "Theorem":
      return [
        bumpBy(getHypSize(unit), substitution),
        { ...unit, sequent: substituteSequent(substitution, unit.sequent) },
      ];
    case "Submod":
      return [
        substitution,
        {
          ...unit,
          module: { ...unit.module, body: substituteUnits(substitution, unit.module.body) },
        },
      ];
    case "Mutate":
      return [
        unit.mode === "Hide" ? substitution : bumpBy(unit.usable.facts.length, substitution),
        { ...unit, usable: substituteUsable(substitution, unit.usable) },
      ];
    case "Anoninst":
      return [
        substitution,
        {
          ...unit,
          instance: {
            ...unit.instance,
            substitutions: unit.instance.substitutions.map((entry) => ({
              name: entry.name,
              expression: substituteExpr(substitution, entry.expression),
            })),
          },
        },
      ];
  }
};

const substituteUnits = (substitution: Substitution, units: ModuleUnit[]) =>
  mapAccumulate(substitution, units, substituteUnit)[1];

const lambdifyTheorem = (
  pipeline: Pipeline,
  scope: Scope | undefined,
  name: string | undefined,
  sequent: Sequent,
) => {
  try {
    const lambdified = lambdify(pipeline.anonymizer, pipeline.onWarning, scope, {
      kind: "Sequent",
      sequent,
    });
    if (lambdified.kind !== "Sequent") throw new TlapmBugError();
    return lambdified.sequent;
  } catch (error) {
    if (!(error instanceof TlaProofError) || error.failure === undefined) throw error;
    const location = sequent.active.location;
    const message = `${error.failure}\nCould not instantiate the theorem ${name === undefined ? "" : `named: ${name}, `}at: ${location ? getLocusText(location) : "<unknown location>"}`;
    pipeline.onWarning({ text: `${getAtPrefix(location)}[ERROR]${message}`, channel: "stdout" });
    pipeline.onWarning({ text: message, channel: "toolboxOnly" });
    return { context: [], active: at({ kind: "Internal", builtin: "TRUE" }, sequent.active) };
  }
};

const lambdifyUnit = (pipeline: Pipeline, scope: Scope | undefined, unit: ModuleUnit) => {
  if (unit.kind === "Theorem") {
    return { ...unit, sequent: lambdifyTheorem(pipeline, scope, unit.name, unit.sequent) };
  }
  if (unit.kind !== "Definition") return unit;
  const definition = unit.definition;
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma") return unit;
  const body = lambdify(pipeline.anonymizer, pipeline.onWarning, scope, definition.body);
  return { ...unit, definition: { ...definition, body } };
};

// lambdify_enabled_cdot: the ENABLED and \cdot of each definition and theorem statement bind
// their variables before instantiation substitutes for them. A theorem that cannot be lambdified
// states TRUE.
const lambdifyUnits = (
  pipeline: Pipeline,
  scope: Scope | undefined,
  units: ModuleUnit[],
): [Scope | undefined, ModuleUnit[]] =>
  mapAccumulate(scope, units, (current, unit): [Scope | undefined, ModuleUnit] => {
    if (unit.kind === "Submod") {
      const [inner, body] = lambdifyUnits(pipeline, current, unit.module.body);
      return [inner, { ...unit, module: { ...unit.module, body } }];
    }
    const lambdified = lambdifyUnit(pipeline, current, unit);
    return [adjoinAll(current, getUnitHyps(lambdified)), lambdified];
  });

// apply_subst: each parameter declaration of the instancee gives way to its substitute.
const applyParameters = (units: ModuleUnit[], substitutes: Map<string, Expr>) => {
  const body: ModuleUnit[] = [];
  let size = 0;
  let rest = units;
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    const split =
      unit.kind === "Constants"
        ? {
            name: unit.declarations[0].name,
            remaining: { ...unit, declarations: unit.declarations.slice(1) },
          }
        : unit.kind === "Variables"
          ? { name: unit.names[0], remaining: { ...unit, names: unit.names.slice(1) } }
          : undefined;
    if (split) {
      const substitute = substitutes.get(split.name);
      if (!substitute) throw new TlaProofError(`Parameter ${split.name} has no substitute`);
      const isEmpty = getHypSize(split.remaining) === 0;
      rest = substituteUnits(
        consSubstitution(shiftExpr(size, substitute), shift(0)),
        isEmpty ? tail : [split.remaining, ...tail],
      );
      continue;
    }
    body.push(unit);
    size += getHypSize(unit);
    rest = tail;
  }
  return body;
};

// resub_for: references to the instancee's own units become applications to the instance
// arguments, which the definitions now bind themselves.
const getLocalSubstitution = (
  count: number,
  argumentCount: number,
  location: Locus | undefined,
): Substitution => {
  const args = Array.from({ length: argumentCount }, (_item, index) =>
    at({ kind: "Ix", index: argumentCount - index }, { location }),
  );
  const parameters = Array.from({ length: argumentCount }, (_item, index) =>
    at({ kind: "Ix", index: index + 1 }, { location }),
  );
  const locals = Array.from({ length: count }, (_item, index): Expr => {
    const operator = at({ kind: "Ix", index: index + argumentCount + 1 }, { location });
    return argumentCount > 0 ? at({ kind: "Apply", operator, args }, { location }) : operator;
  });
  return consAll([...locals, ...parameters].reverse(), shift(count + argumentCount));
};

const addParameters = (expression: Expr, args: string[]): Expr => {
  const params = args.map((name) => ({ name, shape: 0 }));
  if (expression.kind === "Lambda")
    return { ...expression, params: [...params, ...expression.params] };
  return args.length === 0
    ? expression
    : at({ kind: "Lambda", params, body: expression }, expression);
};

// localize: renames the instancee's units under the instance name, salts its local definitions
const localize = (
  pipeline: Pipeline,
  units: ModuleUnit[],
  prefix: string,
  instance: InstanceDefinition,
  isLocal: boolean,
  location: Locus | undefined,
) => {
  const getName = (name: string) => (prefix === "" ? name : `${prefix}!${name}`);
  const argumentCount = instance.args.length;
  const body: ModuleUnit[] = [];
  let size = 0;
  let rest = units;
  let isComplained = argumentCount === 0;
  const complain = (text: string) => {
    if (isComplained) return;
    isComplained = true;
    pipeline.onWarning({ text, channel: "stderr" });
  };
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    rest = tail;
    const localized = (expression: Expr) =>
      addParameters(
        substituteExpr(getLocalSubstitution(size, argumentCount, location), expression),
        instance.args,
      );
    switch (unit.kind) {
      case "Definition": {
        const definition = unit.definition;
        if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
          throw new TlaProofError("Module.Elab.localize");
        }
        const name = unit.isLocal
          ? `${definition.name}$${getUnique(pipeline.salts)}`
          : definition.name;
        body.push({
          ...unit,
          definition: { ...definition, name: getName(name), body: localized(definition.body) },
          whereDefined: unit.isLocal ? "Builtin" : unit.whereDefined,
          isLocal: unit.isLocal || isLocal,
        });
        size += 1;
        continue;
      }
      case "Axiom": {
        complain(
          `${getLocusPrefix(location)}Instancing produces parametric axioms.\nSuch axioms will be forcibly hidden and cannot be cited.\n(This warning appears at-most once per INSTANCE declaration.)`,
        );
        const axiom: ModuleUnit = {
          ...unit,
          name: unit.name === undefined ? undefined : getName(unit.name),
          expression: localized(unit.expression),
        };
        body.push(axiom);
        size += getHypSize(axiom);
        continue;
      }
      case "Theorem": {
        complain(
          `${getAtPrefix(location)}Warning: Instancing produces parametric theorems.\nSuch theorems will be forcibly hidden and cannot be cited.\n(This warning appears at-most once per INSTANCE declaration.)`,
        );
        const expression = localized(at(exprifySequent(unit.sequent), unit));
        body.push({
          ...unit,
          name: unit.name === undefined ? undefined : getName(unit.name),
          sequent:
            expression.kind === "Sequent"
              ? expression.sequent
              : { context: [], active: expression },
          proof: { kind: "Omitted", omission: "Elsewhere", location: unit.location },
        });
        size += 1;
        continue;
      }
      case "Mutate":
        if (unit.mode === "Use") rest = substituteUnits(shift(-unit.usable.facts.length), rest);
        continue;
      case "Submod":
        continue;
      default:
        throw new TlaProofError("Module.Elab.localize");
    }
  }
  return body;
};

// localize_axioms: an axiom becomes a hypothesis of each theorem after it, and a named one also a
// definition.
const localizeAxioms = (units: ModuleUnit[]) => {
  const body: ModuleUnit[] = [];
  let rest = units;
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    if (unit.kind !== "Axiom") {
      body.push(unit);
      rest = tail;
      continue;
    }
    const location = unit.location;
    if (unit.name !== undefined) {
      body.push({
        kind: "Definition",
        definition: { kind: "Operator", name: unit.name, body: unit.expression, location },
        whereDefined: { kind: "Proof", time: "Always" },
        visibility: "Visible",
        isLocal: false,
        location,
      });
    }
    const hyp: Hyp = {
      kind: "Fact",
      expression:
        unit.name === undefined
          ? shiftExpr(1, unit.expression)
          : at({ kind: "Ix", index: 2 }, unit),
      visibility: "Visible",
      time: "Always",
      location,
    };
    let distance = 0;
    const inserted = tail.map((next): ModuleUnit => {
      const size = distance;
      distance += getHypSize(next);
      if (next.kind !== "Theorem") return next;
      const sequent = substituteSequent(shift(1), next.sequent);
      return {
        ...next,
        sequent: { ...sequent, context: [substituteHyp(shift(size), hyp), ...sequent.context] },
        axiomCount: next.axiomCount + 1,
      };
    });
    rest = substituteUnits(shift(-1), inserted);
  }
  return body;
};

const getParameters = (module: Mule) =>
  new Set(
    module.body.flatMap((unit) =>
      unit.kind === "Constants"
        ? unit.declarations.map((declaration) => declaration.name)
        : unit.kind === "Variables"
          ? unit.names
          : [],
    ),
  );

// Module.Elab.instantiate: the units of an instantiated module, in the context of the instance.
const instantiate = (
  pipeline: Pipeline,
  modules: Map<string, Mule>,
  scope: Scope | undefined,
  instance: InstanceDefinition,
  isLocal: boolean,
  prefix: string,
  location: Locus | undefined,
) => {
  const module = modules.get(instance.module);
  if (!module) throw new TlaProofError(`Module "${instance.module}" unknown`);
  const parameters = getParameters(module);
  for (const substitution of instance.substitutions) {
    if (!parameters.has(substitution.name)) {
      throw new TlaProofError(
        `Parameter ${substitution.name} occurs in the statement \`INSTANCE ${instance.module} WITH\`, and is not declared in the module ${instance.module}`,
      );
    }
  }
  const instanceScope = adjoinAll(
    scope,
    instance.args.map((name) => getFresh(name, "Unknown")),
  );
  const substitutes = new Map(
    instance.substitutions.map((entry) => [entry.name, entry.expression]),
  );
  for (const name of [...parameters].sort(compareNames)) {
    if (substitutes.has(name)) continue;
    if (!findNamed(instanceScope, name)) {
      throw new TlaProofError(
        `Required parameter ${name} for module ${instance.module} could not be inferred.`,
      );
    }
    substitutes.set(name, at({ kind: "Opaque", name }, { location }));
  }
  const anonymized = new Map(
    [...substitutes].map(([name, expression]) => [
      name,
      pipeline.anonymizer.expr(instanceScope, expression),
    ]),
  );
  const body = substituteUnits(
    shift((instanceScope?.size ?? 0) - (module.depth ?? 0)),
    module.body.map((unit): ModuleUnit =>
      unit.kind === "Theorem"
        ? {
            ...unit,
            proof: { kind: "Omitted", omission: "Implicit", location: unit.proof.location },
          }
        : unit,
    ),
  );
  const [, lambdified] = lambdifyUnits(pipeline, instanceScope, body);
  return localizeAxioms(
    localize(
      pipeline,
      applyParameters(lambdified, anonymized),
      prefix,
      instance,
      isLocal,
      location,
    ),
  );
};

// A named theorem binds its name as a proof definition, which its statement shifts past.
const bindTheoremName = (
  name: string | undefined,
  sequent: Sequent,
  location: Locus | undefined,
): { hyps: Hyp[]; sequent: Sequent } =>
  name === undefined
    ? { hyps: [], sequent }
    : {
        hyps: [
          {
            kind: "Defn",
            definition: {
              kind: "Operator",
              name,
              body: at(exprifySequent(sequent), { location }),
              location,
            },
            whereDefined: { kind: "Proof", time: "Always" },
            visibility: "Visible",
            isLocal: false,
            location,
          },
        ],
        sequent: substituteSequent(shift(1), sequent),
      };

// make_defs: the definitions among the units an INSTANCE inside a LET or DEFINE stands for.
export const expandInstance = (
  pipeline: Pipeline,
  scope: Scope | undefined,
  definition: Extract<Defn, { kind: "Instance" }>,
): Defn[] => {
  const name = definition.instance.module;
  if (!pipeline.latestModules.has(name)) {
    pipeline.onWarning({
      text: `${getLocusPrefix(definition.instance.location)}Module ${JSON.stringify(name)} unknown\n`,
      channel: "toolbox",
    });
    throw new TlaProofError(`Module ${JSON.stringify(name)} unknown`, {
      failure: "Module.Elab.anon#defns",
    });
  }
  const units = instantiate(
    pipeline,
    pipeline.latestModules,
    scope,
    definition.instance,
    true,
    definition.name,
    definition.location,
  );
  const definitions: Defn[] = [];
  let rest = units;
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    if (unit.kind !== "Definition") {
      rest = substituteUnits(shift(-getHypSize(unit)), tail);
      continue;
    }
    definitions.push(unit.definition);
    rest = tail;
  }
  return definitions;
};

// Module.Elab.normalize: anonymizes each unit in the context of the ones before it, expands
// instances, merges repeated definitions, and simplifies the proofs of important modules. The
// result also joins the modules that later instances can name.
export const normalize = (
  pipeline: Pipeline,
  modules: Map<string, Mule>,
  scope: Scope | undefined,
  module: Mule,
): Mule => {
  const body: ModuleUnit[] = [];
  let current = scope;
  const emit = (unit: ModuleUnit) => {
    body.push(unit);
    current = adjoinAll(current, getUnitHyps(unit));
  };
  const isRedundant = (name: string | undefined) =>
    name !== undefined && findNamed(current, name) !== undefined;
  // Instantiated units arrive anonymized.
  const queue = module.body.map((unit) => ({ unit, isAnonymized: false }));
  for (let index = 0; index < queue.length; index++) {
    const unit = queue[index].unit;
    const expand = (instance: InstanceDefinition, isLocal: boolean, prefix: string) => {
      const units = instantiate(
        pipeline,
        modules,
        current,
        instance,
        isLocal,
        prefix,
        unit.location,
      );
      queue.splice(index + 1, 0, ...units.map((inner) => ({ unit: inner, isAnonymized: true })));
    };
    switch (unit.kind) {
      case "Anoninst":
        expand(unit.instance, unit.isLocal, "");
        continue;
      case "Definition": {
        const definition = unit.definition;
        if (definition.kind === "Instance") {
          expand(definition.instance, unit.isLocal, definition.name);
          continue;
        }
        const anonymized =
          definition.kind === "Recursive" || queue[index].isAnonymized
            ? definition
            : pipeline.anonymizer.defn(current, definition);
        const normalized: ModuleUnit = { ...unit, definition: anonymized };
        if (definition.kind === "Recursive") {
          emit(normalized);
          continue;
        }
        const hyp = getUnitHyps(normalized)[0];
        const found = findNamed(current, definition.name);
        if (found?.hyp.kind === "Defn") {
          const isMerged =
            found.hyp.definition.kind === "Recursive" ||
            isEqualHyp(substituteHyp(shift(found.depth + 1), found.hyp), hyp);
          if (isMerged) {
            const rest = queue.slice(index + 1);
            const substituted = substituteUnits(
              consSubstitution(at({ kind: "Ix", index: found.depth + 1 }, unit), shift(0)),
              rest.map((entry) => entry.unit),
            );
            queue.splice(
              index + 1,
              rest.length,
              ...rest.map((entry, offset) => ({ ...entry, unit: substituted[offset] })),
            );
            continue;
          }
        }
        emit(normalized);
        continue;
      }
      case "Recursives":
      case "Constants":
      case "Variables":
        emit(unit);
        continue;
      case "Axiom":
        if (isRedundant(unit.name)) continue;
        pipeline.latestModules = new Map(modules);
        emit({ ...unit, expression: pipeline.anonymizer.expr(current, unit.expression) });
        continue;
      case "Theorem": {
        const isDuplicate = isRedundant(unit.name);
        const name = isDuplicate ? `(redundant)${unit.name}` : unit.name;
        const proof: Proof = isDuplicate
          ? { kind: "Obvious", location: unit.proof.location }
          : unit.proof;
        pipeline.latestModules = new Map(modules);
        const sequent = pipeline.anonymizer.sequent(current, unit.sequent);
        const binding = bindTheoremName(name, sequent, unit.location);
        const proofScope = adjoinAll(
          adjoinAll(
            current,
            binding.hyps.map((hyp) => ({ ...hyp, isConstnessUnset: true })),
          ),
          binding.sequent.context,
        );
        const anonymized = pipeline.anonymizer.proof(proofScope, proof);
        const simplified = module.isImportant
          ? pipeline.generator.simplify(
              getScopeHyps(proofScope),
              binding.sequent.active,
              anonymized,
              getScopeTime(binding.sequent.context, "Always"),
            )
          : anonymized;
        emit({ ...unit, name, sequent, proof: simplified });
        continue;
      }
      case "Mutate":
        pipeline.latestModules = new Map(modules);
        emit({ ...unit, usable: pipeline.anonymizer.usable(current, unit.usable) });
        continue;
      case "Submod":
        emit({ ...unit, module: normalize(pipeline, modules, current, unit.module) });
        continue;
    }
  }
  const normalized = { ...module, body, depth: scope?.size ?? 0 };
  modules.set(module.name, normalized);
  return normalized;
};

export interface TheoremSummary extends ProofSummary {
  location: Locus | undefined;
}

export interface ModuleSummary extends ProofSummary {
  theorems: TheoremSummary[];
}

// Module.Gen.generate: a named theorem binds its name as a proof definition for what follows.
export const generate = (
  pipeline: Pipeline,
  context: Hyp[],
  module: Mule,
): { obligations: Obligation[]; summary: ModuleSummary } => {
  const obligations: Obligation[] = [];
  const theorems: TheoremSummary[] = [];
  let summary = EMPTY_SUMMARY;
  let current = context;
  for (const unit of module.body) {
    switch (unit.kind) {
      case "Theorem": {
        const binding = bindTheoremName(unit.name, unit.sequent, unit.location);
        const named = [...current, ...binding.hyps];
        const context = [...named, ...binding.sequent.context];
        const proof = pipeline.generator.generate(
          { context, active: binding.sequent.active },
          unit.proof,
          getScopeTime(context, "Always"),
        );
        obligations.push(...pipeline.generator.collect(proof));
        const theorem = getProofSummary(proof);
        theorems.push({ ...theorem, location: unit.location });
        summary = joinSummaries(summary, theorem);
        const fact: Expr =
          unit.name === undefined
            ? at(exprifySequent(unit.sequent), unit)
            : { kind: "Ix", index: 1, location: unit.location };
        current = [
          ...named,
          {
            kind: "Fact",
            expression: fact,
            visibility: "Hidden",
            time: "Always",
            location: unit.location,
          },
        ];
        continue;
      }
      case "Submod": {
        const generated = generate(pipeline, current, unit.module);
        obligations.push(...generated.obligations);
        summary = joinSummaries(summary, generated.summary);
        continue;
      }
      case "Mutate": {
        const [next, generated] = pipeline.generator.mutate(
          current,
          unit.mode,
          unit.usable,
          unit.location,
        );
        obligations.push(...generated);
        current = next;
        continue;
      }
      default:
        current = [...current, ...getUnitHyps(unit)];
    }
  }
  return { obligations, summary: { ...summary, theorems } };
};

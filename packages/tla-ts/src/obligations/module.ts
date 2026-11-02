// tlapm's module units, with the standard modules, flattening EXTENDS (Module.Flatten), the
// modules a module depends on (Module.Dep), and substitution in units (Module.Subst).

import { TlaProofError, TlapmBugError } from "../errors";
import {
  at,
  exprifySequent,
  getFact,
  mapAccumulate,
  type Builtin,
  type Defn,
  type Expr,
  type Hyp,
  type InstanceDefinition,
  type Locus,
  type Sequent,
  type Visibility,
  type WhereDefined,
} from "./expression";
import type { Proof, Usable } from "./proof";
import {
  bumpBy,
  shift,
  shiftExpr,
  substituteDefn,
  substituteExpr,
  substituteExprs,
  substituteSequent,
  type Substitution,
} from "./substitution";

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
  | { kind: "Mutate"; mode: "Use" | "Hide"; usable: Usable }
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

const getBuiltin = (arity: number, name: string, builtin: Builtin): ModuleUnit => ({
  kind: "Definition",
  definition: {
    kind: "Operator",
    name,
    body:
      arity === 0
        ? { kind: "Internal", builtin }
        : {
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
  getBuiltin(0, "Nat", "Nat"),
  getBuiltin(2, "+", "Plus"),
  getBuiltin(2, "-", "Minus"),
  getBuiltin(2, "*", "Times"),
  getBuiltin(2, "^", "Exp"),
  getBuiltin(2, "<", "Lt"),
  getBuiltin(2, ">", "Gt"),
  getBuiltin(2, "=<", "Lteq"),
  getBuiltin(2, ">=", "Gteq"),
  getBuiltin(2, "%", "Remainder"),
  getBuiltin(2, "\\div", "Quotient"),
  getBuiltin(2, "..", "Range"),
];

const INTEGERS = [...NATURALS, getBuiltin(0, "Int", "Int"), getBuiltin(1, "-.", "Uminus")];

const REALS = [
  ...INTEGERS,
  getBuiltin(0, "Real", "Real"),
  getBuiltin(2, "/", "Ratio"),
  getBuiltin(0, "Infinity", "Infinity"),
];

const SEQUENCES = [
  getBuiltin(1, "Seq", "Seq"),
  getBuiltin(1, "Len", "Len"),
  getBuiltin(2, "BSeq", "BSeq"),
  getBuiltin(2, "\\o", "Cat"),
  getBuiltin(2, "Append", "Append"),
  getBuiltin(1, "Head", "Head"),
  getBuiltin(1, "Tail", "Tail"),
  getBuiltin(3, "SubSeq", "SubSeq"),
  getBuiltin(2, "SelectSeq", "SelectSeq"),
];

const TLC = [
  getBuiltin(2, "Print", "Print"),
  getBuiltin(1, "PrintT", "PrintT"),
  getBuiltin(2, "Assert", "Assert"),
  getBuiltin(0, "JavaTime", "JavaTime"),
  getBuiltin(1, "TLCGet", "TLCGet"),
  getBuiltin(2, "TLCSet", "TLCSet"),
  getBuiltin(2, ":>", "OneArg"),
  getBuiltin(2, "@@", "Extend"),
  getBuiltin(1, "Permutations", "Permutations"),
  getBuiltin(2, "SortSeq", "SortSeq"),
  getBuiltin(1, "RandomElement", "RandomElement"),
  getBuiltin(0, "Any", "Any"),
  getBuiltin(1, "ToString", "ToString"),
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

export const getUnitHyps = (unit: ModuleUnit): Hyp[] => {
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
    case "Theorem": {
      const expression =
        unit.kind === "Axiom"
          ? unit.expression
          : at(
              exprifySequent(
                substituteSequent(shift(-unit.axiomCount), {
                  ...unit.sequent,
                  context: unit.sequent.context.slice(unit.axiomCount),
                }),
              ),
              unit,
            );
      return unit.name === undefined
        ? [getFact(expression, "Hidden", "Always", location)]
        : getNamedFact(unit.name, expression, location);
    }
    case "Mutate":
      return unit.mode === "Use"
        ? unit.usable.facts.map((fact, index) =>
            getFact(shiftExpr(index, fact), "Visible", "Always", location),
          )
        : [];
    case "Submod":
    case "Anoninst":
      return [];
  }
};

export const getHypSize = (unit: ModuleUnit) =>
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
  getFact({ kind: "Ix", index: 1, location }, "Hidden", "Always", location),
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
  // Leaves out the proofs of theorems.
  const visit = (unit: ModuleUnit) => {
    if (unit.kind !== "Submod") {
      addInstances(unit.kind === "Theorem" ? unit.sequent : unit);
      return;
    }
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

export const substituteUnits = (substitution: Substitution, units: ModuleUnit[]) =>
  mapAccumulate(substitution, units, substituteUnit)[1];

// A named theorem binds its name as a proof definition, which its statement shifts past.
export const bindTheoremName = (
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

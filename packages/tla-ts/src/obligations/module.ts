// A port of tlapm's Module.Standard, Module.Flatten, Module.Dep and Module.Subst.

import { TlaProofError, TlapmBugError } from "../errors";
import {
  at,
  exprifySequent,
  getDefinitionHyp,
  getFact,
  getFresh,
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

const defineBuiltin = (arity: number, name: string, builtin: Builtin): ModuleUnit => ({
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
  defineBuiltin(0, "Nat", "Nat"),
  defineBuiltin(2, "+", "Plus"),
  defineBuiltin(2, "-", "Minus"),
  defineBuiltin(2, "*", "Times"),
  defineBuiltin(2, "^", "Exp"),
  defineBuiltin(2, "<", "Lt"),
  defineBuiltin(2, ">", "Gt"),
  defineBuiltin(2, "=<", "Lteq"),
  defineBuiltin(2, ">=", "Gteq"),
  defineBuiltin(2, "%", "Remainder"),
  defineBuiltin(2, "\\div", "Quotient"),
  defineBuiltin(2, "..", "Range"),
];

const INTEGERS = [...NATURALS, defineBuiltin(0, "Int", "Int"), defineBuiltin(1, "-.", "Uminus")];

const REALS = [
  ...INTEGERS,
  defineBuiltin(0, "Real", "Real"),
  defineBuiltin(2, "/", "Ratio"),
  defineBuiltin(0, "Infinity", "Infinity"),
];

const SEQUENCES = [
  defineBuiltin(1, "Seq", "Seq"),
  defineBuiltin(1, "Len", "Len"),
  defineBuiltin(2, "BSeq", "BSeq"),
  defineBuiltin(2, "\\o", "Cat"),
  defineBuiltin(2, "Append", "Append"),
  defineBuiltin(1, "Head", "Head"),
  defineBuiltin(1, "Tail", "Tail"),
  defineBuiltin(3, "SubSeq", "SubSeq"),
  defineBuiltin(2, "SelectSeq", "SelectSeq"),
];

const TLC = [
  defineBuiltin(2, "Print", "Print"),
  defineBuiltin(1, "PrintT", "PrintT"),
  defineBuiltin(2, "Assert", "Assert"),
  defineBuiltin(0, "JavaTime", "JavaTime"),
  defineBuiltin(1, "TLCGet", "TLCGet"),
  defineBuiltin(2, "TLCSet", "TLCSet"),
  defineBuiltin(2, ":>", "OneArg"),
  defineBuiltin(2, "@@", "Extend"),
  defineBuiltin(1, "Permutations", "Permutations"),
  defineBuiltin(2, "SortSeq", "SortSeq"),
  defineBuiltin(1, "RandomElement", "RandomElement"),
  defineBuiltin(0, "Any", "Any"),
  defineBuiltin(1, "ToString", "ToString"),
];

const getStandardModule = (name: string, body: ModuleUnit[]): Mule => ({
  name,
  extendees: [],
  body,
  isImportant: false,
  isStandard: true,
});

export const STANDARD_MODULES = new Map(
  [
    getStandardModule("Naturals", NATURALS),
    getStandardModule("Integers", INTEGERS),
    getStandardModule("Reals", REALS),
    getStandardModule("Sequences", SEQUENCES),
    getStandardModule("TLC", TLC),
  ].map((module) => [module.name, module]),
);

export const getUnitHyps = (unit: ModuleUnit): Hyp[] => {
  const location = unit.location;
  switch (unit.kind) {
    case "Constants":
      return unit.declarations.map((declaration) => ({
        ...getFresh(declaration.name, "Constant", declaration.shape),
        location,
      }));
    case "Recursives":
      return unit.declarations.map((declaration) =>
        getDefinitionHyp(
          { kind: "Recursive", name: declaration.name, shape: declaration.shape, location },
          "User",
          "Hidden",
          false,
          location,
        ),
      );
    case "Variables":
      return unit.names.map((name) => ({ kind: "Flex", name, location }));
    case "Definition":
      return [
        getDefinitionHyp(
          unit.definition,
          unit.whereDefined,
          unit.visibility,
          unit.isLocal,
          location,
        ),
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
  getDefinitionHyp(
    { kind: "Operator", name, body: expression, location },
    "User",
    "Visible",
    false,
    location,
  ),
  getFact({ kind: "Ix", index: 1, location }, "Hidden", "Always", location),
];

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
  const addInstances = (value: unknown) => {
    if (typeof value !== "object" || value === null) return;
    if ("instance" in value && isInstanceDefinition(value.instance)) {
      addDependency(value.instance.module, value.instance.location);
    }
    Object.values(value).forEach(addInstances);
  };
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

export const bindTheoremName = (
  name: string | undefined,
  sequent: Sequent,
  location: Locus | undefined,
): { hyps: Hyp[]; sequent: Sequent } =>
  name === undefined
    ? { hyps: [], sequent }
    : {
        hyps: [
          getDefinitionHyp(
            { kind: "Operator", name, body: at(exprifySequent(sequent), { location }), location },
            { kind: "Proof", time: "Always" },
            "Visible",
            false,
            location,
          ),
        ],
        sequent: substituteSequent(shift(1), sequent),
      };

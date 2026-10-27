import type { Context } from "./context";
import { TsproverError } from "./errors";
import type { Model } from "./model";

// The parts of a spec and its config, in the order that the model declares them.
export interface Sections {
  init: string[];
  actions: string[];
  next: string[];
  fairness: string[];
  predicates: string[];
  temporal: string[];
  invariants: string[];
  properties: string[];
  constraints: string[];
  actionConstraints: string[];
  views: string[];
  postconditions: string[];
  assumptions: string[];
}

export interface CompiledSpec {
  source: string;
  config: string;
}

const REM =
  "Rem(a, b) ==\n  LET m == IF b < 0 THEN -b ELSE b\n  IN  IF a >= 0 THEN a % m ELSE -((-a) % m)";

const QUOT =
  "Quot(a, b) ==\n  LET q == (IF a < 0 THEN -a ELSE a) \\div (IF b < 0 THEN -b ELSE b)\n  IN  IF (a < 0) = (b < 0) THEN q ELSE -q";

export const createSections = (): Sections => ({
  init: [],
  actions: [],
  next: [],
  fairness: [],
  predicates: [],
  temporal: [],
  invariants: [],
  properties: [],
  constraints: [],
  actionConstraints: [],
  views: [],
  postconditions: [],
  assumptions: [],
});

const formatConjunction = (items: string[]) =>
  items.length === 1 ? ` ${items[0]}` : `\n${items.map((item) => `  /\\ ${item}`).join("\n")}`;

const formatDisjunction = (items: string[]) =>
  items.length === 0
    ? " FALSE"
    : items.length === 1
      ? ` ${items[0]}`
      : `\n${items.map((item) => `  \\/ ${item}`).join("\n")}`;

const formatConfigSection = (keyword: string, values: string[]) =>
  values.length > 0 ? [`${keyword} ${values.join(" ")}`] : [];

export const emit = (model: Model, sections: Sections, context: Context): CompiledSpec => {
  if (sections.views.length > 1) throw new TsproverError("Tag only one function @view");
  const recursive = [...context.recursive].map((declaration) => {
    const definition = context.definitions.get(declaration);
    if (definition === undefined || definition.parameters.length === 0) {
      throw new TsproverError("A constant can't refer to itself", declaration);
    }
    return `${definition.name}(${definition.parameters.map(() => "_").join(", ")})`;
  });
  const prelude = context.prelude;
  const constants = [
    ...(prelude.has("Null") ? ["Null"] : []),
    ...(prelude.has("Undefined") ? ["Undefined"] : []),
    ...context.modelValues.values(),
  ];
  const variables = model.variables.map((variable) => variable.name);
  const symmetrySets = model.symmetrySets;
  const source = [
    "---- MODULE Spec ----",
    "EXTENDS Integers, Sequences, FiniteSets, TLC",
    ...(constants.length > 0 ? [`CONSTANTS ${constants.join(", ")}`] : []),
    ...(variables.length > 0 ? [`VARIABLES ${variables.join(", ")}`] : []),
    `vars == <<${variables.join(", ")}>>`,
    ...(recursive.length > 0 ? [`RECURSIVE ${recursive.join(", ")}`] : []),
    ...(prelude.has("Rem") ? [REM] : []),
    ...(prelude.has("Quot") ? [QUOT] : []),
    ...context.output,
    `Init ==${formatConjunction(sections.init.length > 0 ? sections.init : ["TRUE"])}`,
    ...sections.actions,
    `Next ==${formatDisjunction(sections.next)}`,
    `Spec ==${formatConjunction(["Init", "[][Next]_vars", ...sections.fairness])}`,
    ...sections.predicates,
    ...sections.temporal,
    ...sections.assumptions.map((assumption) => `ASSUME ${assumption}`),
    ...(symmetrySets.length > 0
      ? [`Perms == ${symmetrySets.map((set) => `Permutations(${set})`).join(" \\cup ")}`]
      : []),
    "====",
  ].join("\n");
  const config = [
    "SPECIFICATION Spec",
    ...(constants.length > 0
      ? ["CONSTANTS", ...constants.map((constant) => `  ${constant} = ${constant}`)]
      : []),
    ...formatConfigSection("INVARIANTS", sections.invariants),
    ...formatConfigSection("PROPERTIES", sections.properties),
    ...formatConfigSection("CONSTRAINTS", sections.constraints),
    ...formatConfigSection("ACTION_CONSTRAINTS", sections.actionConstraints),
    ...formatConfigSection("VIEW", sections.views),
    ...formatConfigSection("POSTCONDITIONS", sections.postconditions),
    ...(symmetrySets.length > 0 ? ["SYMMETRY Perms"] : []),
    ...(model.isDeadlockChecked ? [] : ["CHECK_DEADLOCK FALSE"]),
  ].join("\n");
  return { source, config };
};

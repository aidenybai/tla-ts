import ts from "@typescript/typescript6";
import type {
  Assumption,
  Declaration,
  Expression,
  Module,
  ModuleUnit,
  OperatorDefinition,
} from "../ast";
import type { Context } from "./context";
import { TlaTypeScriptError } from "../errors";
import type { Model } from "./model";
import {
  apply,
  boolean,
  boxAction,
  define,
  getLocation,
  identifier,
  ifExpression,
  junction,
  letExpression,
  locate,
  number,
  temporal,
  tuple,
} from "./tla";
import { JAVASCRIPT_MODULE, SPECIAL_NUMBERS } from "./javascript";
import { getRegions, type Region } from "./regions";

// The parts of a spec and its config, in the order that the model declares them.
export interface Sections {
  init: Expression[];
  actions: OperatorDefinition[];
  next: Expression[];
  fairness: Expression[];
  predicates: OperatorDefinition[];
  temporal: OperatorDefinition[];
  invariants: string[];
  properties: string[];
  constraints: string[];
  actionConstraints: string[];
  views: string[];
  postconditions: string[];
  assumptions: string[];
}

// A state variable's TypeScript type, split into the members of a union, and its initializer.
export interface StateVariable {
  name: string;
  types: string[];
  initial: string | undefined;
}

export interface CompiledSpec {
  name: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
  regions: Region[];
  variables: StateVariable[];
}

const getMagnitude = (value: Expression) =>
  ifExpression(apply("<", [value, number(0)]), apply("-.", [value]), value);

const getRem = () => {
  const left = identifier("a");
  return define(
    "Rem",
    [
      { name: "a", arity: 0 },
      { name: "b", arity: 0 },
    ],
    letExpression(
      [define("m", [], getMagnitude(identifier("b")))],
      ifExpression(
        apply(">=", [left, number(0)]),
        apply("%", [left, identifier("m")]),
        apply("-.", [apply("%", [apply("-.", [left]), identifier("m")])]),
      ),
    ),
  );
};

const getQuot = () =>
  define(
    "Quot",
    [
      { name: "a", arity: 0 },
      { name: "b", arity: 0 },
    ],
    letExpression(
      [
        define(
          "q",
          [],
          apply("\\div", [getMagnitude(identifier("a")), getMagnitude(identifier("b"))]),
        ),
      ],
      ifExpression(
        apply("=", [
          apply("<", [identifier("a"), number(0)]),
          apply("<", [identifier("b"), number(0)]),
        ]),
        identifier("q"),
        apply("-.", [identifier("q")]),
      ),
    ),
  );

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

const conjoin = (items: Expression[]) =>
  items.length === 0 ? boolean(true) : items.length === 1 ? items[0] : junction("And", items, true);

const disjoin = (items: Expression[]) =>
  items.length === 0 ? boolean(false) : items.length === 1 ? items[0] : junction("Or", items, true);

const formatConfigSection = (keyword: string, values: string[]) =>
  values.length > 0 ? [`${keyword} ${values.join(" ")}`] : [];

export const emit = (
  moduleName: string,
  sourceFile: ts.SourceFile,
  model: Model,
  sections: Sections,
  context: Context,
): CompiledSpec => {
  if (sections.views.length > 1) throw new TlaTypeScriptError("Tag only one function @view");
  const location = getLocation(sourceFile);
  const recursive = [...context.recursive].map((declaration): Declaration => {
    const definition = context.definitions.get(declaration);
    if (definition === undefined || definition.parameters.length === 0) {
      throw new TlaTypeScriptError("A constant can't refer to itself", declaration);
    }
    return { name: definition.name, arity: definition.parameters.length, location };
  });
  const prelude = context.prelude;
  const isJavaScript = prelude.has("JavaScript");
  const constants = [
    ...(prelude.has("Null") && !isJavaScript ? ["Null"] : []),
    ...(prelude.has("Undefined") && !isJavaScript ? ["Undefined"] : []),
    ...context.modelValues.values(),
    ...context.constructors.values(),
    ...context.symbols,
  ];
  const modelValues = [
    ...(isJavaScript ? ["Undefined", "Null", "Ref", ...SPECIAL_NUMBERS] : []),
    ...constants,
  ];
  const heap = context.heap === undefined ? undefined : context.variables.get(context.heap);
  const variables = [
    ...model.variables.map((variable) => variable.name),
    ...(heap?.kind === "Identifier" ? [heap.name] : []),
  ];
  const symmetrySets = model.symmetrySets;
  const defineHere = (name: string, body: Expression) => ({
    ...define(name, [], locate(body, location)),
    location,
  });
  const recursiveNames = new Set(recursive.map((declaration) => declaration.name));
  const definitions = [
    defineHere("vars", tuple(variables.map((name) => identifier(name)))),
    ...(prelude.has("Rem") ? [getRem()] : []),
    ...(prelude.has("Quot") ? [getQuot()] : []),
    ...context.output.map((definition) => ({
      ...definition,
      isRecursive: recursiveNames.has(definition.name),
    })),
    defineHere("Init", conjoin(sections.init)),
    ...sections.actions,
    defineHere("Next", disjoin(sections.next)),
    defineHere(
      "Spec",
      conjoin([
        identifier("Init"),
        temporal("Always", boxAction(identifier("Next"), identifier("vars"))),
        ...sections.fairness,
      ]),
    ),
    ...sections.predicates,
    ...sections.temporal,
    ...(symmetrySets.length > 0
      ? [
          defineHere(
            "Perms",
            symmetrySets
              .map((set) => apply("Permutations", [set]))
              .reduce((left, right) => apply("\\cup", [left, right])),
          ),
        ]
      : []),
  ].map((definition) => ({ ...definition, body: locate(definition.body, location) }));
  const assumptions = sections.assumptions.map((name): Assumption => ({
    name: undefined,
    expression: locate(identifier(name), location),
    isAxiom: false,
    location,
  }));
  // SANY resolves a name only after the unit that defines it, by location, and TypeScript allows
  // any order, so each unit's location is its position in the module.
  const units = [
    ...(constants.length > 0 ? [{ kind: "Constants" as const, names: constants }] : []),
    ...(variables.length > 0 ? [{ kind: "Variables" as const, names: variables }] : []),
    ...definitions.slice(0, 1).map((definition) => ({ kind: "Definition" as const, definition })),
    ...(recursive.length > 0 ? [{ kind: "Recursive" as const, declarations: recursive }] : []),
    ...definitions.slice(1).map((definition) => ({ kind: "Definition" as const, definition })),
    ...assumptions.map((assumption) => ({ kind: "Assumption" as const, assumption })),
  ].map((unit, position): ModuleUnit => {
    const ordinal = { line: 0, column: position + 1 };
    if (unit.kind === "Constants" || unit.kind === "Variables") {
      return {
        kind: unit.kind,
        declarations: unit.names.map((name) => ({ name, arity: 0, location: ordinal })),
        location: ordinal,
      };
    }
    if (unit.kind === "Recursive") {
      return {
        kind: unit.kind,
        declarations: unit.declarations.map((declaration) => ({
          ...declaration,
          location: ordinal,
        })),
      };
    }
    if (unit.kind === "Definition") {
      return { kind: unit.kind, definition: { ...unit.definition, location: ordinal } };
    }
    return { kind: unit.kind, assumption: { ...unit.assumption, location: ordinal } };
  });
  const getDeclarations = (kind: "Constants" | "Variables") =>
    units.flatMap((unit) => (unit.kind === kind ? unit.declarations : []));
  const source: Module = {
    name: moduleName,
    modules: [],
    extends: [
      "Integers",
      "Sequences",
      "FiniteSets",
      "TLC",
      ...(isJavaScript ? ["JavaScript"] : []),
    ],
    extendsRanges: [],
    constants: getDeclarations("Constants"),
    variables: getDeclarations("Variables"),
    definitions: units.flatMap((unit) => (unit.kind === "Definition" ? [unit.definition] : [])),
    instances: [],
    assumptions: units.flatMap((unit) => (unit.kind === "Assumption" ? [unit.assumption] : [])),
    location,
    theorems: [],
    uses: [],
    units,
  };
  const config = [
    "SPECIFICATION Spec",
    ...(modelValues.length > 0
      ? [
          "CONSTANTS",
          ...modelValues.map((constant) => `  ${constant} = ${constant}`),
          ...(isJavaScript
            ? [
                "  BuiltIns <- UsedBuiltIns",
                "  ConstantFunctions <- UsedConstantFunctions",
                "  Symbols <- UsedSymbols",
              ]
            : []),
        ]
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
  return {
    name: moduleName,
    source,
    config,
    loadModule: (name) => (isJavaScript && name === "JavaScript" ? JAVASCRIPT_MODULE : undefined),
    regions: getRegions(source, sourceFile, model, context),
    variables: model.variables.map((variable) => {
      const declaration = variable.declaration;
      const type = context.checker.getTypeAtLocation(declaration.name ?? declaration);
      return {
        name: variable.name,
        types: (type.isUnion() ? type.types : [type]).map((member) =>
          context.checker.typeToString(member),
        ),
        initial: ts.isVariableDeclaration(declaration)
          ? declaration.initializer?.getText()
          : undefined,
      };
    }),
  };
};

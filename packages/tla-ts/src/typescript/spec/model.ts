import ts from "@typescript/typescript6";
import type { Bound, Definition, Expression, OperatorDefinition } from "../../ast";
import { parseConfig } from "../../config";
import { TlaTypeScriptError } from "../../errors";
import { printDefinition } from "../../printer";
import { getJsxText, type Library } from "../program";
import { CANONICAL_MODULE } from "./canonical";
import { getLoweredBindings, LOWERED_DEFINITIONS } from "./lowered";
import { getNativeFunctions, NATIVE_DEFINITIONS } from "./native";
import { compileToEscore, type EscoreSpec } from "./compile";
import { frameModel, type StateVariable } from "./frame";
import { foldNames } from "./library";
import type { EscoreRuntime } from "./prepare";

export interface EscoreModel extends EscoreSpec {
  isScript: false;
  variables: StateVariable[];
  notes: string[];
}

// A module whose exported functions the model calls none of, which runs as a script does.
export interface EscoreScript {
  isScript: true;
  notes: string[];
}

// The definitions every model's steps read: how a step calls a function that the module binds,
// what a check shows of a JavaScript value, and the message of what a step throws.
const MODEL_DEFINITIONS =
  foldNames(String.raw`CharacterOf == [u \in {CharacterUnits[c] : c \in DOMAIN CharacterUnits} |-> CHOOSE c \in DOMAIN CharacterUnits : CharacterUnits[c] = u]
RECURSIVE UnitsToString(_)
UnitsToString(units) ==
  IF units = <<>> THEN ""
  ELSE IF Head(units) \notin DOMAIN CharacterOf THEN Assert(FALSE, "tla-ts can't show a string of a character TLA+ strings lack")
  ELSE CharacterOf[Head(units)] \o UnitsToString(Tail(units))
\* The value that the module binds to name.
BindingValue(s, name) == GetValue(s, Val(ResolveBinding(s, ModelContext(s), name, TRUE)))
\* A call of the function that the module binds to name, and the jobs and timers it leaves.
ModelCall(s, name, args) ==
  LET f == BindingValue(s, name) IN
  IF IsAbrupt(f) THEN f ELSE
  LET r == Call(f.s, Val(f), Undefined, args) IN
  IF IsAbrupt(r) THEN r ELSE ModelSettle(r)
\* The text of what a step threw: an error's message, as Node prints it, or the value as a string.
ThrownText(r) ==
  LET v == r.c.value
      m == IF IsObject(v) THEN Get(r.s, v, SV("message")) ELSE Ok(r.s, Undefined)
      t == IF ~IsAbrupt(m) /\ IsString(Val(m)) THEN m ELSE ToStr(r.s, v)
  IN IF ~IsAbrupt(t) /\ IsString(Val(t)) THEN UnitsToString(Val(t).value) ELSE "a value that isn't a string"
Completed(r) == IF r.c.type = "throw" THEN Assert(FALSE, ThrownText(r)) ELSE r
\* A step's state, which starts counting the writes to what exists.
StepStart(s) == [s EXCEPT !.written = FALSE, !.writeMark = [objects |-> s.objs.size, environments |-> s.envs.size]]
\* Whether a call of name returns true.
HoldsOf(s, name, args) == Val(Completed(ModelCall(s, name, args))) = True
\* Whether a call of name returns, for a check that only calls it.
ReturnsOf(s, name, args) == Completed(ModelCall(s, name, args)).c.type = "normal"
\* What a check shows of a value: TLA+'s values of today's compiler's model, where a number is an
\* integer, a string a string, an array a sequence, a Set a set, a Map a function, and another
\* object a record of its enumerable own data properties.
RECURSIVE Shown(_, _, _)
ShownKey(k) == IF IsArrayIndex(k) THEN NumToInt(StrToNum(k.value)) ELSE UnitsToString(k.value)
Shown(s, v, depth) ==
  IF depth > 64 THEN Assert(FALSE, "tla-ts can't show an object that holds itself") ELSE
  CASE v.type = "undefined" -> TsUndefined
    [] v.type = "null" -> TsNull
    [] v.type = "boolean" -> v.value
    [] v.type = "number" ->
         IF NumIsIntegral(v.value) /\ NumFitsInt(v.value) THEN NumToInt(v.value) ELSE UnitsToString(NumToString(v.value))
    [] v.type = "string" -> UnitsToString(v.value)
    [] v.type = "object" ->
         LET o == O(s, v)
             data(k) == o.props[PropBucket(k)][k].value
             shown(k) == IF data(k) = Absent THEN Assert(FALSE, "tla-ts can't show an accessor") ELSE Shown(s, data(k), depth + 1)
         IN CASE o.class = "array" ->
                   LET length == NumToInt(data(SV("length")).value)
                       key(i) == Str(NumToString(NumFromInt(i - 1)))
                   IN [i \in 1..length |-> IF HasProp(o, key(i)) THEN shown(key(i)) ELSE TsUndefined]
              [] o.class = "set" -> {Shown(s, e, depth + 1) : e \in Range(SelectSeq(o.slots.setData, LAMBDA e : e # Empty))}
              [] o.class = "map" ->
                   LET entries == SelectSeq(o.slots.mapData, LAMBDA e : e # Empty)
                       keys == {Shown(s, entries[i].key, depth + 1) : i \in DOMAIN entries}
                   IN [k \in keys |-> Shown(s, entries[CHOOSE i \in DOMAIN entries : Shown(s, entries[i].key, depth + 1) = k].value, depth + 1)]
              [] o.class \in {"function", "builtin", "bound"} -> [function |-> UnitsToString(Val(ToStr(s, data(SV("name")))).value)]
              [] OTHER ->
                   LET keys == SelectSeq(OwnKeysOf(o), LAMBDA k : IsString(k) /\ o.props[PropBucket(k)][k].enumerable = True)
                   IN [k \in {ShownKey(keys[i]) : i \in DOMAIN keys} |-> shown(keys[CHOOSE i \in DOMAIN keys : ShownKey(keys[i]) = k])]
    [] OTHER -> Assert(FALSE, "tla-ts can't show a symbol or a BigInt yet")
ShownBinding(s, name) == LET v == BindingValue(s, name) IN IF IsAbrupt(v) THEN TsUndefined ELSE Shown(v.s, Val(v), 0)
\* The elements of the Set that a call returns, which a guard chooses a parameter from.
GuardElements(s, name, args) ==
  LET r == Completed(ModelCall(s, name, args)) IN
  IF ~IsObject(Val(r)) \/ O(r.s, Val(r)).class # "set" THEN Assert(FALSE, "tla-ts can't choose a parameter from a value other than a Set")
  ELSE [state |-> r.s, elements |-> Range(SelectSeq(O(r.s, Val(r)).slots.setData, LAMBDA e : e # Empty))]
\* The built-in methods that change the collection or array they're called on, as today's compiler
\* reads a step's changes: a step that calls one on what existed before it changes the state, as
\* one that writes does, even where the collection stays as it was.
Mutators ==
  {<<"Array", m>> : m \in {"copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"}}
  \cup {<<"Map", m>> : m \in {"clear", "delete", "set"}} \cup {<<"Set", m>> : m \in {"add", "clear", "delete"}}
  \cup {<<"WeakMap", m>> : m \in {"delete", "set"}} \cup {<<"WeakSet", m>> : m \in {"add", "delete"}}
ModelCallBuiltin(s, f, id, this, args, nt) ==
  ProgramCallBuiltin(IF id \in Mutators /\ IsObject(this) /\ this.id <= s.writeMark.objects THEN [s EXCEPT !.written = TRUE] ELSE s,
                     f, id, this, args, nt)
RECURSIVE SetToSeq(_)
SetToSeq(set) == IF set = {} THEN <<>> ELSE LET x == CHOOSE x \in set : TRUE IN <<x>> \o SetToSeq(set \ {x})
NewArray(s, values) == LET a == CreateArrayFromList(s, values) IN [s |-> a.s, v |-> Val(a)]
NewRecord(s, pairs) ==
  LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
      object == WithDataProps(O(o.s, Val(o)), pairs)
  IN [s |-> SetO(o.s, Val(o), object), v |-> Val(o)]
NewSet(s, values) ==
  LET o == OrdinaryCreateFromConstructor(s, Intrinsic(s, "Set"), "SetPrototype", "set", [setData |-> values])
  IN [s |-> o.s, v |-> Val(o)]
NewMap(s, entries) ==
  LET o == OrdinaryCreateFromConstructor(s, Intrinsic(s, "Map"), "MapPrototype", "map", [mapData |-> entries])
  IN [s |-> o.s, v |-> Val(o)]
\* A copy, in the state s, of the value v of the state from, which a check of a step reads as the
\* state before it: [s, v].
RECURSIVE CopyIn(_, _, _, _)
RECURSIVE CopyList(_, _, _, _)
CopyList(s, from, list, depth) ==
  IF list = <<>> THEN [s |-> s, args |-> <<>>]
  ELSE LET head == CopyIn(s, from, Head(list), depth)
           rest == CopyList(head.s, from, Tail(list), depth)
       IN [s |-> rest.s, args |-> <<head.v>> \o rest.args]
CopyIn(s, from, v, depth) ==
  IF depth > 64 THEN Assert(FALSE, "tla-ts can't copy an object that holds itself") ELSE
  IF ~IsObject(v) THEN [s |-> s, v |-> v] ELSE
  LET o == O(from, v)
      data(k) == o.props[PropBucket(k)][k].value
  IN CASE o.class = "array" ->
            LET length == NumToInt(data(Str(<<108, 101, 110, 103, 116, 104>>)).value)
                key(i) == Str(NumToString(NumFromInt(i - 1)))
                e == CopyList(s, from, [i \in 1..length |-> IF HasProp(o, key(i)) THEN data(key(i)) ELSE Undefined], depth + 1)
            IN NewArray(e.s, e.args)
       [] o.class = "set" ->
            LET e == CopyList(s, from, SelectSeq(o.slots.setData, LAMBDA x : x # Empty), depth + 1) IN NewSet(e.s, e.args)
       [] o.class = "map" ->
            LET entries == SelectSeq(o.slots.mapData, LAMBDA x : x # Empty)
                k == CopyList(s, from, [i \in DOMAIN entries |-> entries[i].key], depth + 1)
                e == CopyList(k.s, from, [i \in DOMAIN entries |-> entries[i].value], depth + 1)
            IN NewMap(e.s, [i \in DOMAIN entries |-> [key |-> k.args[i], value |-> e.args[i]]])
       [] o.class = "ordinary" /\ \A k \in Range(OwnKeysOf(o)) : data(k) # Absent ->
            LET keys == OwnKeysOf(o)
                e == CopyList(s, from, [i \in DOMAIN keys |-> data(keys[i])], depth + 1)
            IN NewRecord(e.s, [i \in DOMAIN keys |-> <<keys[i], e.args[i]>>])
       [] OTHER -> Assert(FALSE, "tla-ts can't copy this object of the state before a step yet")
\* The object of the state variables' values in from, the state before a step, made in s.
BeforeOf(s, from, names) ==
  LET values == CopyList(s, from, [i \in DOMAIN names |-> Val(BindingValue(from, names[i]))], 0)
  IN NewRecord(values.s, [i \in DOMAIN names |-> <<Str(names[i]), values.args[i]>>])`);

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

const printText = (definition: Definition) => printDefinition(definition).join("\n");

const printExpression = (expression: Expression) =>
  printText({
    kind: "Operator",
    name: "X",
    params: [],
    body: expression,
    isLocal: false,
    isRecursive: false,
    location: expression.location,
  }).replace(/^X ==\s*/, "");

// A lowered model's definitions of its bindings: the state the module's top level leaves, its
// declarative environment, ModelBase, and how a step's state materializes and lowers the bindings.
const getLoweredSteps = (names: string[]) => {
  const reset = (env: string) =>
    `[${env} EXCEPT ${names.map((name) => `!.b[${getUnits(name)}].value = Undefined`).join(", ")}]`;
  return [
    LOWERED_DEFINITIONS,
    "ModelRun == ApplyTo(ModelStart, InitialState)",
    "ModelEnv == E(ModelRun, ModelRun.globalEnv).declRec",
    `ModelBase == CanonicalState([ModelRun EXCEPT !.envs = HeapSet(@, ModelEnv, ${reset("E(ModelRun, ModelEnv)")}), !.written = FALSE, !.writeMark = [objects |-> 0, environments |-> 0]])`,
    `ModelInitial == [${names.map((name) => `${name} |-> LowerValue(ModelRun, E(ModelRun, ModelEnv).b[${getUnits(name)}].value, 0).v`).join(", ")}]`,
    `ModelState(m) ==\n  LET ${names.map((name, index) => `v${index + 1} == MaterializeValue(${index === 0 ? "ModelBase" : `v${index}.s`}, m.${name})`).join("\n      ")}\n  IN [v${names.length}.s EXCEPT !.envs = HeapSet(@, ModelEnv, [E(v${names.length}.s, ModelEnv) EXCEPT ${names.map((name, index) => `!.b[${getUnits(name)}].value = v${index + 1}.v`).join(", ")}])]`,
    `LowerModel(s) ==\n  LET env == E(s, ModelEnv)\n      ${names.map((name, index) => `l${index + 1} == LowerValue(s, env.b[${getUnits(name)}].value, 0)`).join("\n      ")}\n      ids == ${names.map((_, index) => `l${index + 1}.ids`).join(" \\o ")}\n  IN IF Cardinality(Range(ids)) # Len(ids) THEN LowerStop("an object that two places hold")\n     ELSE IF ~BaseKept(ModelBase, ModelEnv, s, ${reset("env")}) THEN LowerStop("a change outside the module's bindings")\n     ELSE [${names.map((name, index) => `${name} |-> l${index + 1}.v`).join(", ")}]`,
    "StepEnd(s) == LowerModel(s)",
    "StartState(s) == ModelStart(s)",
  ];
};

// A step that calls name with the arguments that convert makes, from the state s: no state where
// the call writes nothing that existed before it, and otherwise the state StepEnd makes of the
// state it ends in.
const STEP_OF = String.raw`StepOf(s, name, converted) ==
  LET r == Completed(ModelCall(converted.s, name, converted.args)) IN
  IF r.s.written THEN {StepEnd(r.s)} ELSE {}`;

// The global that holds the values the initial state chose for the state variables without an
// initializer, as the module's top level runs.
const INITIAL = "$tlaTsInitial";

// Today's names of the values that JavaScript has one of each of, as the model's constants.
const MODEL_VALUES = new Map([
  ["Null", "TsNull"],
  ["Undefined", "TsUndefined"],
]);

// An expression with each of today's model values by the model's name for it.
const renameModelValues = (expression: Expression): Expression =>
  JSON.parse(JSON.stringify(expression), (key, value: unknown) =>
    key === "name" && typeof value === "string" && MODEL_VALUES.has(value)
      ? MODEL_VALUES.get(value)
      : value,
  );

const getNames = (node: unknown, names = new Set<string>()): Set<string> => {
  if (Array.isArray(node)) node.forEach((inner) => getNames(inner, names));
  else if (typeof node === "object" && node !== null) {
    const record = node as Record<string, unknown>;
    if (record.kind === "Identifier" && typeof record.name === "string") names.add(record.name);
    if (record.kind === "Apply" && typeof record.operator === "string") names.add(record.operator);
    Object.values(record).forEach((inner) => getNames(inner, names));
  }
  return names;
};

interface Application {
  name: string;
  args: string[];
}

interface Converter {
  // The definition of an operator of a state and a TLA+ value of the domain, which gives the state
  // and the JavaScript value that the value stands for.
  name: string;
}

// The model of a TypeScript module, checked on ESCore: one variable holds ESCore's state after the
// module's top level, as model, the module's bindings lowered out of ESCore's heap (see
// lowered.ts), where the module lets it, or else as heap, the canonical state. Each exported
// function that today's compiler makes an action calls the function through ESCore with the
// arguments that today's compiler chooses, natively where it can (see native.ts). Invariants,
// properties, and the other checks call the functions they name. A trace shows each state
// variable as today's compiler does.
export const compileModelToEscore = (
  source: string,
  fileName: string,
  runtime: EscoreRuntime,
  library?: Library,
  // Whether the state may lower out of ESCore's heap, which a test turns off to check the heap.
  isLowerable = true,
): EscoreModel | EscoreScript => {
  // The module's text with its JSX the calls it compiles to, which the steps run.
  const text = getJsxText(fileName, source);
  const file = ts.createSourceFile(fileName, text, ts.ScriptTarget.ESNext, true);
  // A model that imports files runs as the ES module it is, whose frame TypeScript's checker gives.
  const isModule = file.statements.some(
    (statement) =>
      (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly !== true) ||
      (ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier !== undefined &&
        !statement.isTypeOnly),
  );
  const today = frameModel(source, fileName, library, runtime.names);
  if (today.isScript) return { isScript: true, notes: today.notes };
  const module = today.source;
  const config = parseConfig(today.config);
  // The binding of the function that each of the spec's names calls.
  const bindings = today.bindings;
  const getBinding = (name: string) => getUnits(bindings.get(name) ?? name);
  const definitions = new Map<string, Definition>(
    module.definitions.map((definition) => [definition.name, definition]),
  );
  const variables = new Set(module.variables.map((variable) => variable.name));
  // The module's exported functions, by name, with their parameters and tags.
  const exported = new Map<
    string,
    {
      parameters: string[];
      types: (ts.TypeNode | undefined)[];
      tags: Map<string, string>;
      node: ts.FunctionLikeDeclaration;
    }
  >();
  // A function that a declaration's initializer gives, through parentheses and casts.
  const getFunction = (node: ts.Node | undefined): ts.FunctionLikeDeclaration | undefined =>
    node === undefined
      ? undefined
      : ts.isArrowFunction(node) || ts.isFunctionExpression(node)
        ? node
        : ts.isParenthesizedExpression(node) ||
            ts.isAsExpression(node) ||
            ts.isSatisfiesExpression(node) ||
            ts.isNonNullExpression(node)
          ? getFunction(node.expression)
          : undefined;
  // The local names that the module exports in a list of its own.
  const listed = new Set(
    file.statements.flatMap((statement) =>
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
        ? statement.exportClause.elements.map(
            (element) => element.propertyName?.getText() ?? element.name.text,
          )
        : [],
    ),
  );
  const getTags = (node: ts.Node) =>
    new Map(
      ts
        .getJSDocTags(node)
        .map((tag) => [
          tag.tagName.text,
          typeof tag.comment === "string" ? tag.comment.trim() : "",
        ]),
    );
  for (const statement of file.statements) {
    const isExported =
      ts.canHaveModifiers(statement) &&
      (ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name !== undefined &&
      (isExported || listed.has(statement.name.text))
    ) {
      exported.set(statement.name.text, {
        parameters: statement.parameters.map((parameter) => parameter.name.getText()),
        types: statement.parameters.map((parameter) => parameter.type),
        tags: getTags(statement),
        node: statement,
      });
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const fn = getFunction(declaration.initializer);
        if (
          fn !== undefined &&
          ts.isIdentifier(declaration.name) &&
          (isExported || listed.has(declaration.name.text))
        ) {
          exported.set(declaration.name.text, {
            parameters: fn.parameters.map((parameter) => parameter.name.getText()),
            types: fn.parameters.map((parameter) => parameter.type),
            tags: getTags(statement),
            node: fn,
          });
        }
      }
    }
  }
  bindings.forEach((binding, name) => {
    const found = exported.get(binding);
    if (found === undefined) {
      throw new TlaTypeScriptError(`tla-ts can't find the exported function ${binding}`);
    }
    exported.set(name, found);
  });
  const steps: string[] = [];
  const appended: string[] = [];
  const entries = new Set<string>();
  let count = 0;
  const define = (prefix: string, text: (name: string) => string) => {
    count += 1;
    const name = `${prefix}${count}`;
    steps.push(text(name));
    return name;
  };
  // Today's definitions that a domain reads, which read no state, under names of their own.
  const copied = new Map<string, string>();
  const copyDefinitions = (expression: Expression): Expression => {
    for (const name of getNames(expression)) {
      const definition = definitions.get(name);
      if (definition === undefined || copied.has(name) || definition.kind !== "Operator") continue;
      copied.set(name, `Today${name}`);
      const body = copyDefinitions(definition.body);
      steps.push(printText({ ...definition, name: `Today${name}`, body: renameModelValues(body) }));
    }
    return JSON.parse(JSON.stringify(expression), (key, value: unknown) =>
      (key === "name" || key === "operator") && typeof value === "string" && copied.has(value)
        ? copied.get(value)
        : value,
    );
  };
  const isStateful = (expression: Expression, seen = new Set<string>()): boolean =>
    [...getNames(expression)].some((name) => {
      if (variables.has(name)) return true;
      const definition = definitions.get(name);
      if (definition === undefined || seen.has(name)) return false;
      seen.add(name);
      return isStateful(definition.body, seen);
    });
  // The converter of the values of a domain: TLA+'s values of today's model as JavaScript's.
  const converters = new Map<string, Converter>();
  // A parameter's type, where today's domain of it is an expression of no shape the converters
  // know, such as a helper's set of numbers, converts its values: a number, a string, or a
  // boolean.
  const PRIMITIVE_TYPES = new Map([
    [ts.SyntaxKind.NumberKeyword, "IntV(x)"],
    [ts.SyntaxKind.StringKeyword, "Str(StringUnits(x))"],
    [ts.SyntaxKind.BooleanKeyword, "Bool(x)"],
  ]);
  const getConverter = (domain: Expression, type?: ts.TypeNode): Converter => {
    const key = JSON.stringify(domain, (field, value: unknown) =>
      field === "location" ? undefined : value,
    );
    const known = converters.get(key);
    if (known !== undefined) return known;
    const converter = { name: createConverter(domain, type) };
    converters.set(key, converter);
    return converter;
  };
  const unsupported = (domain: Expression, type?: ts.TypeNode): string => {
    const primitive = type === undefined ? undefined : PRIMITIVE_TYPES.get(type.kind);
    if (primitive === undefined) {
      throw new TlaTypeScriptError(
        `tla-ts can't pass a value of ${printExpression(domain)} to an ESCore model yet`,
      );
    }
    return define("Convert", (name) => `${name}(s, x) == [s |-> s, v |-> ${primitive}]`);
  };
  const getUnion = (expression: Expression): Expression[] =>
    expression.kind === "Apply" && expression.operator === "\\cup"
      ? expression.args.flatMap(getUnion)
      : [expression];
  // The domain of the elements of a set of tuples: {<<>>}, {<<e>> : e \in D}, or D \X D, by its
  // text, or "" for the set of the empty tuple.
  const getTupleElements = (set: Expression): string | undefined =>
    set.kind === "SetEnumeration" &&
    set.elements.length === 1 &&
    set.elements[0].kind === "Tuple" &&
    set.elements[0].elements.length === 0
      ? ""
      : set.kind === "SetMap" &&
          set.expression.kind === "Tuple" &&
          set.expression.elements.length === 1 &&
          set.bounds.length === 1
        ? printExpression(set.bounds[0].set)
        : set.kind === "Product" &&
            set.factors.every(
              (factor) => printExpression(factor) === printExpression(set.factors[0]),
            )
          ? printExpression(set.factors[0])
          : undefined;
  // How the elements of a domain convert: "number", "string", "boolean", or the operator that
  // converts them.
  const getPrimitive = (element: Expression): string | undefined =>
    element.kind === "Number" ||
    (element.kind === "Apply" && element.operator === "-." && element.args[0].kind === "Number")
      ? "IntV(x)"
      : element.kind === "String"
        ? "Str(StringUnits(x))"
        : element.kind === "Identifier" && (element.name === "TRUE" || element.name === "FALSE")
          ? "Bool(x)"
          : undefined;
  // A list of TLA+ values as JavaScript values, each converted in turn.
  const defineList = (element: string) =>
    define(
      "ConvertList",
      (name) =>
        `RECURSIVE ${name}(_, _)\n${name}(s, values) ==\n  IF values = <<>> THEN [s |-> s, args |-> <<>>]\n  ELSE LET head == ${element}(s, Head(values))\n           rest == ${name}(head.s, Tail(values))\n       IN [s |-> rest.s, args |-> <<head.v>> \\o rest.args]`,
    );
  const createConverter = (domain: Expression, type?: ts.TypeNode): string => {
    const plain = (body: string) =>
      define("Convert", (name) => `${name}(s, x) == [s |-> s, v |-> ${body}]`);
    if (domain.kind === "Identifier" && domain.name === "BOOLEAN") return plain("Bool(x)");
    if (domain.kind === "Apply" && domain.operator === "..") return plain("IntV(x)");
    if (domain.kind === "Identifier") {
      const definition = definitions.get(domain.name);
      return definition?.kind === "Operator" && definition.params.length === 0
        ? createConverter(definition.body)
        : unsupported(domain, type);
    }
    if (domain.kind === "SetEnumeration") {
      const primitives = domain.elements.flatMap((element) =>
        element.kind === "Identifier" && MODEL_VALUES.has(element.name)
          ? []
          : [getPrimitive(element)],
      );
      const kinds = new Set(primitives);
      if (kinds.size > 1 || kinds.has(undefined)) return unsupported(domain, type);
      const names = new Set(
        domain.elements.flatMap((element) => (element.kind === "Identifier" ? [element.name] : [])),
      );
      const primitive = [...kinds][0] ?? "Undefined";
      return plain(
        `${names.has("Null") ? "IF x = TsNull THEN Null ELSE " : ""}${names.has("Undefined") ? "IF x = TsUndefined THEN Undefined ELSE " : ""}${primitive}`,
      );
    }
    if (domain.kind === "Product") {
      const factors = domain.factors.map((factor) => getConverter(factor));
      return define(
        "Convert",
        (name) =>
          `${name}(s, x) ==\n  LET ${factors.map((factor, index) => `e${index + 1} == ${factor.name}(${index === 0 ? "s" : `e${index}.s`}, x[${index + 1}])`).join("\n      ")}\n  IN NewArray(e${factors.length}.s, <<${factors.map((_, index) => `e${index + 1}.v`).join(", ")}>>)`,
      );
    }
    if (domain.kind === "RecordSet") {
      const fields = domain.fields.map((field) => ({
        name: field.name,
        converter: getConverter(field.value),
      }));
      return define(
        "Convert",
        (name) =>
          `${name}(s, x) ==\n  LET ${fields.map((field, index) => `e${index + 1} == ${field.converter.name}(${index === 0 ? "s" : `e${index}.s`}, x.${field.name})`).join("\n      ")}\n  IN NewRecord(e${fields.length}.s, <<${fields.map((field, index) => `<<Str(${getUnits(field.name)}), e${index + 1}.v>>`).join(", ")}>>)`,
      );
    }
    // Arrays up to a length: UNION {[1 .. length -> D] : length \in L}.
    if (
      domain.kind === "Apply" &&
      domain.operator === "UNION" &&
      domain.args[0].kind === "SetMap" &&
      domain.args[0].expression.kind === "FunctionSet"
    ) {
      const set = domain.args[0].expression;
      const range = getConverter(set.range);
      const isArray = set.domain.kind === "Apply" && set.domain.operator === "..";
      // Maps: UNION {[keys -> V] : keys \in SUBSET K}.
      const bound = domain.args[0].bounds[0];
      const keys =
        !isArray && bound.set.kind === "Apply" && bound.set.operator === "SUBSET"
          ? getConverter(bound.set.args[0])
          : undefined;
      if (!isArray && keys === undefined) return unsupported(domain, type);
      return define("Convert", (name) =>
        keys === undefined
          ? `${name}(s, x) ==\n  LET e == ${defineList(range.name)}(s, x) IN NewArray(e.s, e.args)`
          : `${name}(s, x) ==\n  LET order == SetToSeq(DOMAIN x)\n      k == ${defineList(keys.name)}(s, order)\n      e == ${defineList(range.name)}(k.s, [i \\in DOMAIN order |-> x[order[i]]])\n  IN NewMap(e.s, [i \\in DOMAIN order |-> [key |-> k.args[i], value |-> e.args[i]]])`,
      );
    }
    // Arrays up to a length of one element type, as a union of sets of tuples.
    const union = getUnion(domain);
    const tuples = union.map(getTupleElements);
    const elements = new Set(tuples.filter((element) => element !== ""));
    if (
      union.length > 1 &&
      tuples.every((element) => element !== undefined) &&
      elements.size === 1
    ) {
      const part = union.find((inner) => getTupleElements(inner) !== "");
      const elementDomain =
        part?.kind === "SetMap"
          ? part.bounds[0].set
          : part?.kind === "Product"
            ? part.factors[0]
            : undefined;
      if (elementDomain !== undefined) {
        const element = getConverter(elementDomain);
        return define(
          "Convert",
          (name) =>
            `${name}(s, x) ==\n  LET e == ${defineList(element.name)}(s, x) IN NewArray(e.s, e.args)`,
        );
      }
    }
    // A union, such as a discriminated union of record sets or a literal's set with undefined:
    // each value by the set it's in, which TLC compares it with, as today's domain is of values
    // it can compare.
    if (domain.kind === "Apply" && domain.operator === "\\cup") {
      const parts = getUnion(domain).map((arg) => ({
        set: printExpression(renameModelValues(arg)),
        converter: getConverter(arg),
      }));
      return define(
        "Convert",
        (name) =>
          `${name}(s, x) ==\n  ${parts.map((part, index) => (index === parts.length - 1 ? `${part.converter.name}(s, x)` : `IF x \\in ${part.set} THEN ${part.converter.name}(s, x) ELSE `)).join("")}`,
      );
    }
    if (domain.kind === "Apply" && domain.operator === "SUBSET") {
      const element = getConverter(domain.args[0]);
      return define(
        "Convert",
        (name) =>
          `${name}(s, x) ==\n  LET e == ${defineList(element.name)}(s, SetToSeq(x)) IN NewSet(e.s, e.args)`,
      );
    }
    return unsupported(domain, type);
  };

  const notes = [...today.notes];
  // The guards that choose a parameter from a set, by action and parameter: the function the
  // module gets appended, which returns the set from the parameters its guard reads.
  const getGuard = (action: string, parameter: string) => {
    const definition = exported.get(action);
    const body = definition?.node.body;
    const statement =
      body !== undefined && ts.isBlock(body)
        ? body.statements.find(
            (candidate) =>
              ts.isIfStatement(candidate) &&
              ts.isPrefixUnaryExpression(candidate.expression) &&
              candidate.expression.operator === ts.SyntaxKind.ExclamationToken &&
              (() => {
                const operand = ts.isParenthesizedExpression(candidate.expression.operand)
                  ? candidate.expression.operand.expression
                  : candidate.expression.operand;
                return (
                  ts.isCallExpression(operand) &&
                  ts.isPropertyAccessExpression(operand.expression) &&
                  operand.expression.name.text === "has" &&
                  operand.arguments.length === 1 &&
                  operand.arguments[0].getText() === parameter
                );
              })(),
          )
        : undefined;
    if (statement === undefined || definition === undefined || !ts.isIfStatement(statement)) {
      throw new TlaTypeScriptError(
        `tla-ts can't find the guard that chooses ${action}'s parameter ${parameter}`,
      );
    }
    const condition = statement.expression;
    const operand =
      ts.isPrefixUnaryExpression(condition) && ts.isParenthesizedExpression(condition.operand)
        ? condition.operand.expression
        : ts.isPrefixUnaryExpression(condition)
          ? condition.operand
          : condition;
    const set =
      ts.isCallExpression(operand) && ts.isPropertyAccessExpression(operand.expression)
        ? operand.expression.expression
        : operand;
    const read = new Set<string>();
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node)) read.add(node.text);
      ts.forEachChild(node, visit);
    };
    visit(set);
    const parameters = definition.parameters.filter((name) => read.has(name));
    const name = `$tlaTsGuard${appended.length}`;
    appended.push(`const ${name} = (${parameters.join(", ")}) => ${set.getText()};`);
    entries.add(name);
    return { name, parameters };
  };
  // An expression of today's spec with the parts that read today's state variables in their
  // place: the set a guard chooses a parameter from, which the module's function gives. The names
  // of the model's own definitions stay, which the model defines its own way.
  const KEPT = new Set(["Init", "Next", "vars", "Spec"]);
  const isKept = (name: string) => KEPT.has(name) || exported.has(name);
  const rewriteGuards = (expression: Expression, application?: Application): Expression => {
    switch (expression.kind) {
      case "Or":
      case "And":
        return {
          ...expression,
          operands: expression.operands.map((operand) => rewriteGuards(operand, application)),
        };
      case "Exists":
      case "Forall": {
        const inner = application ?? getApplication(expression.body);
        return {
          ...expression,
          bounds: expression.bounds.map((bound) => rewriteBound(bound, inner)),
          body: rewriteGuards(expression.body, inner),
        };
      }
      case "WeakFairness":
      case "StrongFairness":
        return {
          ...expression,
          action: rewriteGuards(
            expression.action,
            application ?? getApplication(expression.action),
          ),
        };
      case "BoxAction":
      case "AngleAction":
        return { ...expression, action: rewriteGuards(expression.action, application) };
      case "Always":
      case "Eventually":
      case "Unchanged":
        return { ...expression, expression: rewriteGuards(expression.expression, application) };
      case "Identifier":
        if (isKept(expression.name)) return expression;
        break;
      case "Apply":
        if (isKept(expression.operator)) {
          return {
            ...expression,
            args: expression.args.map((arg) => rewriteGuards(arg, application)),
          };
        }
        // A fairness condition that a guard checks: proc \in set.
        if (
          expression.operator === "\\in" &&
          application !== undefined &&
          expression.args[0].kind === "Identifier" &&
          isStateful(expression.args[1])
        ) {
          return {
            ...expression,
            args: [expression.args[0], getGuardDomain(application, expression.args[0].name)],
          };
        }
        break;
      default:
        break;
    }
    if (isStateful(expression)) {
      throw new TlaTypeScriptError(
        `tla-ts can't read today's state in ${printExpression(expression)} on ESCore yet`,
      );
    }
    return copyDefinitions(renameModelValues(expression));
  };
  // The exported function that an action or a fairness condition applies, with the names it
  // passes as arguments.
  const getApplication = (expression: Expression): Application | undefined =>
    expression.kind === "Apply" && exported.has(expression.operator)
      ? {
          name: expression.operator,
          args: expression.args.map((arg) => (arg.kind === "Identifier" ? arg.name : "")),
        }
      : expression.kind === "Identifier" && exported.has(expression.name)
        ? { name: expression.name, args: [] }
        : expression.kind === "And"
          ? expression.operands.map(getApplication).find((found) => found !== undefined)
          : expression.kind === "Exists" || expression.kind === "Forall"
            ? getApplication(expression.body)
            : expression.kind === "WeakFairness" || expression.kind === "StrongFairness"
              ? getApplication(expression.action)
              : undefined;
  // The names today's action binds its parameters to, by the module's parameter names.
  const actionParameters = new Map<string, string[]>();
  const getGuardDomain = (application: Application, bound: string): Expression => {
    const action = application.name;
    const parameters = application.args;
    const position = parameters.indexOf(bound);
    const parameter = exported.get(action)?.parameters[position];
    if (parameter === undefined) {
      throw new TlaTypeScriptError(`tla-ts can't tell which parameter of ${action} ${bound} is`);
    }
    const guard = getGuard(action, parameter);
    // A parameter that the guard reads converts from its domain, or, where an earlier guard that
    // reads no parameter chose it, is the element of that guard's set that shows as its value.
    const read = guard.parameters.map((name) => {
      const index = exported.get(action)?.parameters.indexOf(name) ?? -1;
      const choice = guardChoices.get(`${action} ${index}`);
      return {
        bound: parameters[index],
        converter: boundConverters.get(`${action} ${index}`),
        choice: choice?.parameters.length === 0 ? choice : undefined,
      };
    });
    if (read.some((entry) => entry.converter === undefined && entry.choice === undefined)) {
      throw new TlaTypeScriptError(
        `tla-ts can't pass the parameters that ${action}'s guard reads to ESCore yet`,
      );
    }
    const getRead = (entry: (typeof read)[number], index: number) => {
      const previous = index === 0 ? getState("a[1]") : `e${index}.s`;
      return entry.choice === undefined
        ? `e${index + 1} == ${entry.converter}(${previous}, a[${index + 2}])`
        : `c${index + 1} == GuardElements(${previous}, ${getUnits(entry.choice.name)}, <<>>)\n      e${index + 1} == [s |-> c${index + 1}.state, v |-> CHOOSE e \\in c${index + 1}.elements : Shown(c${index + 1}.state, e, 0) = a[${index + 2}]]`;
    };
    const operator = define(
      "GuardDomain",
      (name) =>
        `${name}(a) ==\n  LET ${read.map(getRead).join("\n      ")}${read.length === 0 ? "" : "\n     "} g == GuardElements(${read.length === 0 ? getState("a[1]") : `e${read.length}.s`}, ${getUnits(guard.name)}, <<${read.map((_, index) => `e${index + 1}.v`).join(", ")}>>)\n  IN {Shown(g.state, e, 0) : e \\in g.elements}`,
    );
    guardChoices.set(`${action} ${position}`, guard);
    return {
      kind: "Apply",
      operator: "ApplyTo",
      args: [
        { kind: "Identifier", name: operator, location: module.location },
        {
          kind: "Tuple",
          elements: [
            { kind: "Identifier", name: variable, location: module.location },
            ...read.map((entry) => ({
              kind: "Identifier" as const,
              name: entry.bound,
              location: module.location,
            })),
          ],
          location: module.location,
        },
      ],
      location: module.location,
    };
  };
  // The converter of each action's parameter by "action position", from the domain today's Next
  // chooses it from, and the guards that choose a parameter from a set instead.
  const boundConverters = new Map<string, string>();
  const guardChoices = new Map<string, { name: string; parameters: string[] }>();
  const rewriteBound = (bound: Bound, application: Application | undefined): Bound => {
    if (bound.pattern.kind !== "Name" || application === undefined) {
      throw new TlaTypeScriptError("tla-ts can't bind these parameters on ESCore yet");
    }
    const name = bound.pattern.name;
    const position = application.args.indexOf(name);
    if (isStateful(bound.set)) return { ...bound, set: getGuardDomain(application, name) };
    if (position >= 0) {
      boundConverters.set(
        `${application.name} ${position}`,
        getConverter(bound.set, exported.get(application.name)?.types[position]).name,
      );
    }
    return { ...bound, set: rewriteGuards(bound.set, application) };
  };

  // The actions: each of today's definitions that Next applies, by its parameters.
  const next = definitions.get("Next");
  const terminating = [...exported]
    .filter((entry) => entry[1].tags.has("terminating"))
    .map((entry) => entry[0]);
  const findApplied = (expression: Expression): void => {
    if (expression.kind === "Identifier" && terminating.includes(expression.name)) return;
    if (expression.kind === "Apply" && exported.has(expression.operator)) {
      actionParameters.set(
        expression.operator,
        expression.args.map((arg) => (arg.kind === "Identifier" ? arg.name : "")),
      );
    } else if (expression.kind === "Identifier" && exported.has(expression.name)) {
      actionParameters.set(expression.name, []);
    } else if (expression.kind === "Or" || expression.kind === "And") {
      expression.operands.forEach(findApplied);
    } else if (expression.kind === "Exists") findApplied(expression.body);
  };
  if (next?.kind === "Operator") findApplied(next.body);
  const actions = [...actionParameters];
  // The state variables that start at every value of their type, and the predicates the initial
  // states satisfy.
  const init = definitions.get("Init");
  const conjuncts =
    init?.kind !== "Operator" ? [] : init.body.kind === "And" ? init.body.operands : [init.body];
  const choices = conjuncts.flatMap((conjunct) =>
    conjunct.kind === "Apply" &&
    conjunct.operator === "\\in" &&
    conjunct.args[0].kind === "Identifier" &&
    variables.has(conjunct.args[0].name)
      ? [{ name: conjunct.args[0].name, domain: conjunct.args[1] }]
      : [],
  );
  // A model without state variables or actions has one state, the one its module's top level
  // leaves, which no step compares with another, so it keeps it as it is.
  const isStateless = module.variables.length === 0 && actions.length === 0;
  const isAsync = /\b(?:async|Promise|then|setTimeout)\b/.test(text);
  // The bindings that the state lowers out of ESCore's heap, where the module lets it (see
  // lowered.ts), whose variable model holds them, and otherwise the variable heap holds ESCore's
  // state. A step's or a check's ESCore state is what the variable's value gives.
  const lowered =
    isStateless || isAsync || isModule || !isLowerable
      ? undefined
      : getLoweredBindings(file, new Set(choices.map((choice) => choice.name)));
  const variable = lowered === undefined ? "heap" : "model";
  const getState = (state: string) => (lowered === undefined ? state : `ModelState(${state})`);
  // A lowered model's functions run natively where they can, and on ESCore where that bails.
  const native = lowered === undefined ? undefined : getNativeFunctions(file, lowered);
  // The native call of a function in the lowered state model, with the arguments of the values
  // given, converted and lowered, or undefined where the function runs on ESCore only.
  const getNativeCall = (name: string, model: string, values: (index: number) => string) => {
    const operator = native?.getOperator(name);
    const parameters = exported.get(name)?.parameters ?? [];
    const converters = parameters.map((_, index) =>
      guardChoices.has(`${name} ${index}`) ? undefined : boundConverters.get(`${name} ${index}`),
    );
    return operator === undefined || converters.some((converter) => converter === undefined)
      ? undefined
      : `${operator}(${[model, "FALSE", ...converters.map((converter, index) => `LowerConverted(${converter}(ModelBase, ${values(index)}))`)].join(", ")})`;
  };
  // A step's or a check's arguments, converted in turn from a[1], the state, with the
  // parameters' values from a[2] on.
  const getArguments = (action: string, state: string, values: (position: number) => string) => {
    const parameters = exported.get(action)?.parameters ?? [];
    return parameters.length === 0
      ? `[s |-> ${state}, args |-> <<>>]`
      : `LET ${parameters
          .map((_, index) => {
            const choice = guardChoices.get(`${action} ${index}`);
            const converter = boundConverters.get(`${action} ${index}`);
            const previous = index === 0 ? state : `e${index}.s`;
            return choice !== undefined
              ? `g${index + 1} == GuardElements(${previous}, ${getUnits(choice.name)}, <<${choice.parameters.map((name) => `e${parameters.indexOf(name) + 1}.v`).join(", ")}>>)\n      e${index + 1} == [s |-> ${previous}, v |-> CHOOSE e \\in g${index + 1}.elements : Shown(g${index + 1}.state, e, 0) = ${values(index)}]`
              : converter === undefined
                ? (() => {
                    throw new TlaTypeScriptError(
                      `tla-ts can't tell the domain of ${action}'s parameter ${parameters[index]}`,
                    );
                  })()
                : `e${index + 1} == ${converter}(${previous}, ${values(index)})`;
          })
          .join(
            "\n      ",
          )}\n  IN [s |-> e${parameters.length}.s, args |-> <<${parameters.map((_, index) => `e${index + 1}.v`).join(", ")}>>]`;
  };
  const rewrittenNext = next?.kind === "Operator" ? rewriteGuards(next.body) : undefined;
  for (const [action, bounds] of actions) {
    entries.add(bindings.get(action) ?? action);
    const step = define(
      "Step",
      (name) =>
        `${name}(a) ==\n  LET s == StepStart(${getState("a[1]")})\n      converted == ${getArguments(action, "s", (index) => `a[${index + 2}]`).replaceAll("\n", "\n      ")}\n  IN StepOf(s, ${getBinding(action)}, converted)`,
    );
    const nativeCall = getNativeCall(action, "a[1]", (index) => `a[${index + 2}]`);
    const run =
      nativeCall === undefined
        ? step
        : define(
            "NativeStep",
            (name) =>
              `${name}(a) ==\n  LET n == ${nativeCall} IN\n  IF n.type = "bail" THEN ${step}(a) ELSE IF n.w THEN {n.m} ELSE {}`,
          );
    steps.push(
      `${action}${bounds.length === 0 ? "" : `(${bounds.join(", ")})`} == ${variable}' \\in ApplyTo(${run}, <<${variable}${bounds.map((bound) => `, ${bound}`).join("")}>>)`,
    );
  }
  // A check of a function's result at a state: whether it holds, or only that it returns.
  const defineCheck = (name: string, kind: "HoldsOf" | "ReturnsOf", bounds: Bound[]) => {
    entries.add(bindings.get(name) ?? name);
    const names = bounds.map((bound) => (bound.pattern.kind === "Name" ? bound.pattern.name : ""));
    bounds.forEach((bound, index) =>
      boundConverters.set(`${name} ${index}`, getConverter(bound.set).name),
    );
    actionParameters.set(name, names);
    const operator = define(
      "Check",
      (operatorName) =>
        `${operatorName}(a) ==\n  LET converted == ${getArguments(name, getState("a[1]"), (index) => `a[${index + 2}]`).replaceAll("\n", "\n      ")}\n  IN ${kind}(converted.s, ${getBinding(name)}, converted.args)`,
    );
    const nativeCall = getNativeCall(name, "a[1]", (index) => `a[${index + 2}]`);
    const checked =
      nativeCall === undefined
        ? operator
        : define(
            "NativeCheck",
            (operatorName) =>
              `${operatorName}(a) ==\n  LET n == ${nativeCall} IN\n  IF n.type = "bail" THEN ${operator}(a) ELSE ${kind === "HoldsOf" ? "n.v = True" : "TRUE"}`,
          );
    return (state: string, values: string[]) =>
      `ApplyTo(${checked}, <<${[state, ...values].join(", ")}>>)`;
  };
  // The bounds that today's check of a function quantifies its parameters over, the first ones
  // of its \A, as many as the function's parameters.
  const getBounds = (name: string, expression: Expression | undefined): Bound[] => {
    const count = exported.get(name)?.parameters.length ?? 0;
    const collect = (inner: Expression | undefined, found: Bound[]): Bound[] =>
      found.length >= count || inner?.kind !== "Forall"
        ? found
        : collect(inner.body, [...found, ...inner.bounds]);
    const bounds = collect(expression, []);
    if (bounds.length < count) {
      throw new TlaTypeScriptError(`tla-ts can't find the domains of ${name}'s parameters`);
    }
    return bounds.slice(0, count);
  };
  const quantify = (bounds: Bound[], body: string) =>
    bounds.length === 0
      ? body
      : `\\A ${bounds.map((bound) => `${bound.pattern.kind === "Name" ? bound.pattern.name : ""} \\in ${printExpression(rewriteGuards(bound.set))}`).join(", ")} : ${body}`;
  const boundNames = (bounds: Bound[]) =>
    bounds.map((bound) => (bound.pattern.kind === "Name" ? bound.pattern.name : ""));
  // Invariants, and the checks that only call a function, which today's spec defines as
  // \A bounds : LET result == ... IN result = result, where result may take a fresh name.
  const isCallCheck = (expression: Expression | undefined): boolean =>
    expression?.kind === "Forall"
      ? isCallCheck(expression.body)
      : expression?.kind === "Let" &&
        expression.body.kind === "Apply" &&
        expression.body.operator === "=" &&
        expression.definitions.some(
          (definition) =>
            /^result(?:_\d+)?$/.test(definition.name) &&
            expression.body.kind === "Apply" &&
            expression.body.args.every(
              (arg) => arg.kind === "Identifier" && arg.name === definition.name,
            ),
        );
  const current = variable;
  const defined = new Set<string>();
  const defineInvariant = (name: string) => {
    if (defined.has(name)) return;
    defined.add(name);
    const definition = definitions.get(name);
    const body = definition?.kind === "Operator" ? definition.body : undefined;
    const bounds = getBounds(name, body);
    const check = defineCheck(name, isCallCheck(body) ? "ReturnsOf" : "HoldsOf", bounds);
    const holds = quantify(bounds, check(current, boundNames(bounds)));
    // An @assume that reads state holds in the initial states, as today's invariant checks it.
    steps.push(
      `${name} == ${exported.get(name)?.tags.has("assume") === true ? `TLCGet("level") > 1 \\/ ${holds}` : holds}`,
    );
  };
  config.invariants.forEach(defineInvariant);
  config.constraints.forEach(defineInvariant);
  config.postconditions.forEach(defineInvariant);
  module.assumptions.forEach((assumption) => {
    if (assumption.expression.kind === "Identifier") {
      const name = assumption.expression.name;
      const definition = definitions.get(name);
      const body = definition?.kind === "Operator" ? definition.body : undefined;
      const bounds = getBounds(name, body);
      const check = defineCheck(name, isCallCheck(body) ? "ReturnsOf" : "HoldsOf", bounds);
      defined.add(name);
      steps.push(`${name} == ${quantify(bounds, check("ModelStartState", boundNames(bounds)))}`);
    }
  });
  // The temporal properties, from the tags of the functions that today's properties name.
  // A check of a step, of a function of before, the state before the step, which the function
  // reads as an object of the state variables' values, copied into the state after the step.
  const shownNames = today.variables.map((variable) => variable.name);
  const defineStepCheck = (name: string) => {
    entries.add(name);
    defined.add(name);
    const operator = define(
      "StepCheck",
      (operatorName) =>
        `${operatorName}(a) ==\n  LET before == ${lowered === undefined ? `BeforeOf(a[2], a[1], <<${shownNames.map(getUnits).join(", ")}>>)` : `MaterializeValue(ModelState(a[2]), LObj(<<${shownNames.map(getUnits).join(", ")}>>, <<${shownNames.map((shownName) => `a[1].${shownName}`).join(", ")}>>))`}\n  IN HoldsOf(before.s, ${getUnits(name)}, <<before.v>>)`,
    );
    const nativeOperator =
      exported.get(name)?.parameters.length === 1 ? native?.getOperator(name) : undefined;
    const checked =
      nativeOperator === undefined
        ? operator
        : define(
            "NativeStepCheck",
            (operatorName) =>
              `${operatorName}(a) ==\n  LET n == ${nativeOperator}(a[2], FALSE, LObj(<<${shownNames.map(getUnits).join(", ")}>>, <<${shownNames.map((shownName) => `a[1].${shownName}`).join(", ")}>>)) IN\n  IF n.type = "bail" THEN ${operator}(a) ELSE n.v = True`,
          );
    return `ApplyTo(${checked}, <<${variable}, ${variable}'>>)`;
  };
  for (const name of config.properties) {
    const definition = definitions.get(name);
    const tags = exported.get(name)?.tags;
    const body = definition?.kind === "Operator" ? definition.body : undefined;
    if (tags === undefined) {
      throw new TlaTypeScriptError(`tla-ts can't find the function of the property ${name}`);
    }
    if (tags.has("always")) {
      steps.push(`${name} == [][${defineStepCheck(name)}]_vars`);
      continue;
    }
    const bounds = getBounds(name, body);
    const names = boundNames(bounds);
    const predicate = defineCheck(name, "HoldsOf", bounds)(variable, names);
    defined.add(name);
    if (tags.has("eventually")) steps.push(`${name} == ${quantify(bounds, `<>(${predicate})`)}`);
    else if (tags.has("alwaysEventually"))
      steps.push(`${name} == ${quantify(bounds, `[]<>(${predicate})`)}`);
    else if (tags.has("eventuallyAlways"))
      steps.push(`${name} == ${quantify(bounds, `<>[](${predicate})`)}`);
    else if (tags.has("leadsTo")) {
      const target = tags.get("leadsTo")?.split(/\s/)[0] ?? "";
      entries.add(target);
      const operator = define(
        "Target",
        (operatorName) =>
          `${operatorName}(a) ==\n  LET converted == ${getArguments(name, getState("a[1]"), (index) => `a[${index + 2}]`).replaceAll("\n", "\n      ")}\n  IN HoldsOf(converted.s, ${getUnits(target)}, converted.args)`,
      );
      steps.push(
        `${name} == ${quantify(bounds, `(${predicate}) ~> ApplyTo(${operator}, <<${variable}${names.map((bound) => `, ${bound}`).join("")}>>)`)}`,
      );
    } else {
      throw new TlaTypeScriptError(`tla-ts can't check the property ${name} on ESCore yet`);
    }
  }
  config.actionConstraints.forEach((name) => steps.push(`${name} == ${defineStepCheck(name)}`));
  if (config.symmetry !== undefined) {
    throw new TlaTypeScriptError("tla-ts can't check a symmetric model on ESCore yet");
  }
  const initially = [...exported]
    .filter((entry) => entry[1].tags.has("initially"))
    .map((entry) => entry[0]);
  initially.forEach((name) => entries.add(name));
  const view = config.view;
  if (view !== undefined) entries.add(view);
  const choose = choices.map((choice, index) => ({
    ...choice,
    bound: `v${index + 1}`,
    converter: getConverter(choice.domain).name,
    set: printExpression(rewriteGuards(choice.domain)),
  }));
  // As compileToEscore runs a script's jobs and timers, a step runs the ones a call leaves.
  const settle =
    "ModelSettle(r) == LET t == SettleJobs(r.s) IN IF IsAbrupt(t) THEN t ELSE [t EXCEPT !.c = r.c]";
  // The module's top level reads each state variable that starts at every value of its type, at
  // its declaration, from the global $tlaTsInitial, which the initial state's choice holds before
  // the module runs, and which the module deletes as it ends.
  // A lowered model's initial states each convert the choice's values in ModelBase and lower
  // them, with the values that ModelBase's module gave the other bindings.
  const loweredInitialSteps = [
    `InitialChoice(a) ==\n  LET s0 == ModelBase${choose
      .map(
        (choice, index) =>
          `\n      c${index + 1} == ${choice.converter}(${index === 0 ? "s0" : `c${index}.s`}, a[${index + 2}])\n      l${index + 1} == LowerValue(c${index + 1}.s, c${index + 1}.v, 0)`,
      )
      .join(
        "",
      )}\n      m == ${choose.length === 0 ? "ModelInitial" : `[ModelInitial EXCEPT ${choose.map((choice, index) => `!.${choice.name} = l${index + 1}.v`).join(", ")}]`}\n  IN IF ${
      initially.length === 0
        ? "TRUE"
        : initially
            .map((name) => {
              const call = getNativeCall(name, "m", () => "");
              return call === undefined
                ? `HoldsOf(ModelState(m), ${getUnits(name)}, <<>>)`
                : `(LET n == ${call} IN IF n.type = "bail" THEN HoldsOf(ModelState(m), ${getUnits(name)}, <<>>) ELSE n.v = True)`;
            })
            .join(" /\\ ")
    } THEN {m} ELSE {}`,
  ];
  const initialSteps = [
    `InitialChoice(a) ==\n  LET s0 == a[1]${choose
      .map(
        (choice, index) =>
          `\n      c${index + 1} == ${choice.converter}(${index === 0 ? "s0" : `c${index}.s`}, a[${index + 2}])`,
      )
      .join("")}${
      choose.length === 0
        ? "\n      s == ModelStart(s0)"
        : `\n      list == NewArray(c${choose.length}.s, <<${choose.map((_, index) => `c${index + 1}.v`).join(", ")}>>)\n      g == Completed(CreateDataPropertyOrThrow(list.s, Intrinsic(list.s, "GlobalObject"), Str(${getUnits(INITIAL)}), list.v))\n      s == ModelStart(g.s)`
    }\n  IN IF ${initially.length === 0 ? "TRUE" : initially.map((name) => `HoldsOf(s, ${getUnits(name)}, <<>>)`).join(" /\\ ")} THEN {StepEnd(s)} ELSE {}`,
    `InitialStates(s) ==\n  UNION {ApplyTo(InitialChoice, <<s${choose.map((choice) => `, ${choice.bound}`).join("")}>>) : ${choose.length === 0 ? "x \\in {0}" : choose.map((choice) => `${choice.bound} \\in ${choice.set}`).join(", ")}}`,
    `Init == ${variable} \\in ApplyTo(InitialStates, InitialState)`,
  ];
  steps.push(
    ...(isStateless
      ? [`Init == ${variable} = ModelStartState`]
      : lowered === undefined
        ? initialSteps
        : [...loweredInitialSteps, ...initialSteps.slice(1)]),
  );
  if (rewrittenNext !== undefined) {
    // A @terminating function's state, where Next stutters, which isn't a deadlock.
    terminating.forEach(defineInvariant);
    steps.push(printText({ ...(next as OperatorDefinition), body: rewrittenNext }));
  }
  const spec = definitions.get("Spec");
  if (spec?.kind === "Operator") {
    steps.push(printText({ ...spec, body: rewriteGuards(spec.body) }));
  }
  if (view !== undefined) {
    const operator = define(
      "View",
      (name) =>
        `${name}(s) == LET r == Completed(ModelCall(${getState("s")}, ${getUnits(view)}, <<>>)) IN Shown(r.s, Val(r), 0)`,
    );
    steps.push(`${view} == ApplyTo(${operator}, ${variable})`);
  }
  const shown = today.variables.map((variable) => variable.name);
  const alias = define(
    "Shown",
    (name) =>
      `${name}(m) == LET s == ${getState("m")} IN [${shown.map((shownName) => `${shownName} |-> ShownBinding(s, ${getUnits(shownName)})`).join(", ") || "heap |-> s.objs.size"}]`,
  );
  // The declarations of the state variables that start at every value of their type, which read
  // their values from $tlaTsInitial.
  const declarations = file.statements.flatMap((statement) =>
    ts.isVariableStatement(statement) ? statement.declarationList.declarations : [],
  );
  // A module that imports none runs as a strict script, whose top-level declarations the steps
  // read by name, so its declarations lose their export keywords and its export lists go.
  const exports = file.statements.flatMap((statement) =>
    isModule
      ? []
      : ts.isExportDeclaration(statement) && statement.moduleSpecifier === undefined
        ? [{ start: statement.getStart(), end: statement.getEnd(), text: "" }]
        : ts.canHaveModifiers(statement)
          ? (ts.getModifiers(statement) ?? []).flatMap((modifier) =>
              modifier.kind === ts.SyntaxKind.ExportKeyword
                ? [{ start: modifier.getStart(), end: modifier.getEnd(), text: "" }]
                : [],
            )
          : [],
  );
  const replaced = (lowered === undefined ? choose : [])
    .map((choice, index) => {
      const declaration = declarations.find(
        (candidate) =>
          ts.isIdentifier(candidate.name) &&
          candidate.name.text === choice.name &&
          candidate.initializer === undefined,
      );
      if (declaration === undefined) {
        throw new TlaTypeScriptError(`tla-ts can't find the declaration of ${choice.name}`);
      }
      return {
        start: declaration.getStart(),
        end: declaration.getEnd(),
        text: `${choice.name} = ${INITIAL}[${index}]`,
      };
    })
    .concat(exports)
    .sort((left, right) => right.start - left.start)
    .reduce(
      (changed, change) => changed.slice(0, change.start) + change.text + changed.slice(change.end),
      text,
    );
  const augmented = [
    replaced,
    ...appended,
    ...(choose.length === 0 || lowered !== undefined
      ? []
      : [`delete (globalThis as { ${INITIAL}?: unknown }).${INITIAL};`]),
    "",
  ].join("\n");
  const modelSteps = [
    "CONSTANTS TsNull, TsUndefined",
    `VARIABLE ${variable}`,
    `vars == <<${variable}>>`,
    "CanonicalState(s) == CanonicalStateOf(s, InitialState)",
    settle,
    // The scope that a step reads the module's bindings in: the script's, or the module's own.
    isModule
      ? "ModelContext(s) == ModuleContext(ModuleAt(s, s.moduleIds[<<s.realmId, 1>>]).env)"
      : "ModelContext(s) == ScriptContext(s)",
    MODEL_DEFINITIONS,
    "ModelStart(s) == Completed(ApplyTo(RunProgram, s)).s",
    // The state after the module's top level, which a model without state checks.
    "ModelStartState == ApplyTo(ModelStart, InitialState)",
    ...(lowered === undefined
      ? [
          "StepEnd(s) == CanonicalState([s EXCEPT !.written = FALSE, !.writeMark = [objects |-> 0, environments |-> 0]])",
          "StartState(s) == StepEnd(ModelStart(s))",
        ]
      : [...getLoweredSteps(lowered), NATIVE_DEFINITIONS, ...(native?.definitions ?? [])]),
    STEP_OF,
    ...steps,
    `ModelAlias == ApplyTo(${alias}, ${variable})`,
  ].join("\n");
  // The module runs as an ES module does, in strict mode.
  const compiled = compileToEscore(
    isModule ? augmented : `"use strict";\n${augmented}`,
    fileName,
    runtime,
    isModule,
    {
      steps: modelSteps,
      entries: [...entries],
      reads: CANONICAL_MODULE,
    },
  );
  const configLines = [
    ...compiled.config
      .trimEnd()
      .split("\n")
      .filter((line) => !/^(INIT|NEXT) /.test(line))
      .map((line) =>
        line === "CONSTANT CallBuiltin <- ProgramCallBuiltin"
          ? "CONSTANT CallBuiltin <- ModelCallBuiltin"
          : line,
      ),
    "CONSTANTS TsNull = Null TsUndefined = Undefined",
    config.specification === undefined
      ? "INIT Init\nNEXT Next"
      : `SPECIFICATION ${config.specification}`,
    ...config.invariants.map((name) => `INVARIANT ${name}`),
    ...config.properties.map((name) => `PROPERTY ${name}`),
    ...config.constraints.map((name) => `CONSTRAINT ${name}`),
    ...config.actionConstraints.map((name) => `ACTION_CONSTRAINT ${name}`),
    ...config.postconditions.map((name) => `POSTCONDITION ${name}`),
    ...(view === undefined ? [] : [`VIEW ${view}`]),
    // A model without state variables or actions has one state, which TLC checks no deadlock of,
    // as it checks none where a spec has no variables.
    ...(config.checkDeadlock && !isStateless ? [] : ["CHECK_DEADLOCK FALSE"]),
    "ALIAS ModelAlias",
    "",
  ];
  const assumptions = module.assumptions.flatMap((assumption) =>
    assumption.expression.kind === "Identifier" ? [`ASSUME ${assumption.expression.name}`] : [],
  );
  const finalCode = (compiled.loadModule("ProgramCode") ?? "")
    .replace("\nEXTENDS ESRuntime\n", "\nEXTENDS ESRuntime, ESCanonical\n")
    .replace(
      /\n====\n$/,
      `\n${assumptions.join("\n")}${assumptions.length === 0 ? "" : "\n"}====\n`,
    );
  return {
    ...compiled,
    config: configLines.join("\n"),
    loadModule: (name) =>
      name === "ProgramCode" ? finalCode : name === "ESCanonical" ? CANONICAL_MODULE : undefined,
    isScript: false,
    variables: today.variables,
    notes,
  };
};

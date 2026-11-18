import { runInNewContext } from "node:vm";
import { TlaError } from "../../errors";
import type { GeneratedDefinition, Library } from "./library";

// The ESCore operators that a compiled spec defines its own way, each a port of ESCore's with
// what the parse node gave as a parameter: a function's code is the record [id, strict, kind,
// length, sourceText] that its function object holds as its body, and CallCode, which the
// compile generates, runs the body of the code with an id.
const DEFINITIONS = [
  `CodeFunctionCreate(s, proto, code, isLexicalThis, env, priv) ==
  LET thisMode == IF isLexicalThis THEN "lexical" ELSE IF code.strict THEN "strict" ELSE "global"
      o == PutProp(MakeObject(proto, "function",
                              FunctionSlots(code.kind, <<>>, code, env, priv, thisMode, code.strict, code.sourceText, s.realmId)),
                   SV("length"), DataDesc(IntV(code.length), FALSE, FALSE, TRUE))
  IN Alloc(s, o)`,
  `OrdinaryCallEvaluateBody(s, f, ctx, args) == CallCode(s, f, ctx, args, O(s, f).slots.body.id)`,
  `UpdateValueThen(isIncrement, isPostfix, r) ==
  IF IsAbrupt(r) THEN r ELSE
  IF Val(r).type # "reference" THEN ThrowError(r.s, "ReferenceError") ELSE
  LET ref == ToKeyedReference(r.s, Val(r)) IN
  IF IsAbrupt(ref) THEN ref ELSE
  LET old == GetValue(ref.s, Val(ref)) IN
  IF IsAbrupt(old) THEN old ELSE
  LET num == ToNumeric(old.s, Val(old)) IN
  IF IsAbrupt(num) THEN num ELSE
  LET v == Val(num)
      new == IF IsNumber(v)
             THEN Num(IF isIncrement THEN NumAdd(v.value, NumFromInt(1)) ELSE NumSub(v.value, NumFromInt(1)))
             ELSE BigInt(IF isIncrement THEN BigIntAdd(v.value, BigIntFromInt(1)) ELSE BigIntSub(v.value, BigIntFromInt(1)))
      p == PutValue(num.s, Val(ref), new)
  IN IF IsAbrupt(p) THEN p ELSE Ok(p.s, IF isPostfix THEN v ELSE new)`,
  // A call's function and this value, from the result r of evaluating its callee.
  `CalleeThen(r) ==
  IF IsAbrupt(r) THEN r ELSE
  LET f == GetValue(r.s, Val(r)) IN
  IF IsAbrupt(f) THEN f ELSE Ok(f.s, [f |-> Val(f), this |-> CallThisValue(f.s, Val(r))])`,
  // An array literal's element at key, from the result r of evaluating it.
  `ArrayElementResult(array, key, r) ==
  IF IsAbrupt(r) THEN r ELSE CreateDataPropertyOrThrow(r.s, array, key, Val(r))`,
  // A statement's result r in a statement list, whose value is last's where r has none.
  `StatementResult(r, last) ==
  IF IsAbrupt(r) THEN Abrupt(r.s, UpdateEmpty(r.c, last))
  ELSE Ok(r.s, IF Val(r) = Empty THEN last ELSE Val(r))`,
  `InitializeReferencedThen(ref, r) == IF IsAbrupt(r) THEN r ELSE InitializeReferencedBinding(r.s, ref, Val(r))`,
  `DefineElementOn(home, r, enumerable) ==
  IF IsAbrupt(r) \\/ Val(r).key.type = "private" THEN r ELSE
  LET e == Val(r)
      d == DefinePropertyOrThrow(r.s, home, e.key,
             CASE e.kind = "method" -> DataDesc(e.value, TRUE, enumerable, TRUE)
               [] e.kind = "getter" -> AccessorDesc(e.get, Absent, enumerable, TRUE)
               [] OTHER -> AccessorDesc(Absent, e.set, enumerable, TRUE))
  IN IF IsAbrupt(d) THEN d ELSE Ok(d.s, e)`,
  `ClassParents(s, superclass) ==
  IF superclass = Null THEN Ok(s, [proto |-> Null, ctor |-> Intrinsic(s, "FunctionPrototype")])
  ELSE IF ~IsConstructor(s, superclass) THEN ThrowTypeError(s)
  ELSE LET p == Get(s, superclass, SV("prototype")) IN
       IF IsAbrupt(p) THEN p
       ELSE IF ~IsObject(Val(p)) /\\ Val(p) # Null THEN ThrowTypeError(p.s)
       ELSE Ok(p.s, [proto |-> Val(p), ctor |-> superclass])`,
  `CreateMappedArgumentsObjectOf(s, f, names, args, env) ==
  LET base == MakeObject(Intrinsic(s, "ObjectPrototype"), "arguments", [map |-> <<>>, env |-> env])
      withArgs == AddIndexProps(base, args, 1)
      withLength == PutProp(withArgs, SV("length"), DataDesc(IntV(Len(args)), TRUE, FALSE, TRUE))
      mapped == {i \\in 1..Len(names) : i <= Len(args) /\\ \\A j \\in (i + 1)..Len(names) : names[j] # names[i]}
      map == [k \\in {Str(NumToString(NumFromInt(i - 1))) : i \\in mapped} |->
                names[NumToSmallInt(StrToNum(k.value)) + 1]]
      withMap == [withLength EXCEPT !.slots.map = map]
      withIterator == PutProp(withMap, SymIterator,
                              DataDesc(Intrinsic(s, "ArrayProto_values"), TRUE, FALSE, TRUE))
      withCallee == PutProp(withIterator, SV("callee"), DataDesc(f, TRUE, FALSE, TRUE))
  IN Alloc(s, withCallee)`,
  // The realm's tables, folded in halves so that building the realm nests log n deep, not n.
  `AddRealmProperties(s, ps) == AddRealmPropertiesIn(s, ps, 1, Len(ps))`,
  `AddRealmPropertiesIn(s, ps, lo, hi) ==
  IF lo > hi THEN s
  ELSE IF lo = hi THEN AddRealmProperty(s, ps[lo])
  ELSE LET mid == (lo + hi) \\div 2 IN AddRealmPropertiesIn(AddRealmPropertiesIn(s, ps, lo, mid), ps, mid + 1, hi)`,
  `HeapAppendFrom(h, seq, i) == HeapAppendIn(h, seq, i, Len(seq))`,
  `HeapAppendIn(h, seq, lo, hi) ==
  IF lo > hi THEN h
  ELSE IF lo = hi THEN HeapAppend(h, seq[lo])
  ELSE LET mid == (lo + hi) \\div 2 IN HeapAppendIn(HeapAppendIn(h, seq, lo, mid), seq, mid + 1, hi)`,
  // HoistFunctions for a script, whose lexical and var environments are the global one, with
  // each function a record [name, site] rather than its node.
  `HoistGlobalFunctions(s, env, fns, declared) ==
  IF fns = <<>> THEN Ok(s, Empty) ELSE
  LET name == Head(fns).name IN
  IF HasLexicalDeclaration(s, env, name) THEN HoistGlobalFunctions(s, env, Tail(fns), declared) ELSE
  LET definable == CanDeclareGlobalVar(s, env, name) IN
  IF IsAbrupt(definable) THEN definable
  ELSE IF Val(definable) = False THEN HoistGlobalFunctions(definable.s, env, Tail(fns), declared) ELSE
  LET created == IF name \\in declared THEN Ok(definable.s, Empty) ELSE CreateGlobalVarBinding(definable.s, env, name, FALSE) IN
  IF IsAbrupt(created) THEN created
  ELSE HoistGlobalFunctions(HoldEnvs([created.s EXCEPT !.hoisted = @ \\cup {<<env, Head(fns).site>>}]),
                            env, Tail(fns), declared \\cup {name})`,
  // FunctionDeclarationInstantiation (§10.2.11) of a function whose parameters are distinct names
  // without initializers and whose body declares nothing and needs no arguments object: the state
  // and the context its body runs in.
  `PlainInstantiation(s, ctx, names, args, strict) ==
  LET bound == BindArguments(CreateBindings(s, ctx.lex, names, strict, FALSE), ctx.lex, names, args, 1)
      le == NewDeclarativeEnvironment(bound, ctx.lex)
  IN IF strict THEN [s |-> bound, ctx |-> [ctx EXCEPT !.var = ctx.lex]]
     ELSE [s |-> le.s, ctx |-> [ctx EXCEPT !.lex = le.e, !.var = ctx.lex]]`,
  `BindArguments(s, env, names, args, i) ==
  IF i > Len(names) THEN s
  ELSE BindArguments(InitializeBinding(s, env, names[i], Arg(args, i)).s, env, names, args, i + 1)`,
  `Unsupported(s, what) == Assert(FALSE, "tla-ts can't run a part of ECMAScript that ESCore leaves out")`,
];

// The characters that a TLA+ string can hold, as a string spells each, by code unit.
const CHARACTERS = new Map([
  [9, "\\t"],
  [10, "\\n"],
  [12, "\\f"],
  [13, "\\r"],
  ...Array.from(
    { length: 95 },
    (_, index) =>
      [
        index + 32,
        index + 32 === 34 ? '\\"' : index + 32 === 92 ? "\\\\" : String.fromCharCode(index + 32),
      ] as const,
  ),
]);

// A text as a TLA+ string, if a string can hold each of its characters.
export const getTlaString = (text: string) =>
  [...text].every((character) => CHARACTERS.has(character.charCodeAt(0)))
    ? `"${[...text].map((character) => CHARACTERS.get(character.charCodeAt(0))).join("")}"`
    : undefined;

export const RUNTIME_DEFINITIONS: GeneratedDefinition[] = [
  ...DEFINITIONS,
  // The code units of a TLA+ string's characters.
  `StringUnits(t) == [i \\in 1..Len(t) |-> CharacterUnits[SubSeq(t, i, i)]]`,
  // The code unit of each character that a TLA+ string can hold.
  `CharacterUnits ==
  LET characters == <<${[...CHARACTERS.values()].map((character) => `"${character}"`).join(", ")}>>
      units == <<${[...CHARACTERS.keys()].join(", ")}>>
  IN [c \\in {characters[i] : i \\in 1..Len(characters)} |-> units[CHOOSE i \\in 1..Len(characters) : characters[i] = c]]`,
].map((text) => {
  const header = /^([A-Z][A-Za-z0-9_]*)(?:\((.*?)\))?\s*==/.exec(text);
  return {
    name: header?.[1] ?? "",
    arity: header?.[2] === undefined ? 0 : header[2].split(",").length,
    text,
  };
});

// ESCore's interpreter, which a compiled spec never runs: its evaluation of parse nodes, and eval
// and the Function constructor, which make code at run time.
export const INTERPRETER = new Set([
  "Evaluate",
  "EvaluateValue",
  "EvaluateStatement",
  "EvaluateStatementList",
  "EvaluateBlock",
  "EvaluateDisposing",
  "NamedEvaluation",
  "EvaluateNamed",
  "FunctionDeclarationInstantiation",
  "InstantiateFunctionObject",
  "InstantiateFunctionExpression",
  "InstantiateArrowFunctionExpression",
  "ClassDefinitionEvaluation",
  "BindingInitialization",
  "IteratorBindingInitializationList",
  "DestructuringAssignmentEvaluation",
  "GlobalDeclarationInstantiation",
  "ScriptEvaluation",
  "PerformEval",
  "CreateDynamicFunction",
  "ResumeFrame",
  "ResumeFrames",
  "EvaluateGeneratorBody",
  "EvaluateAsyncFunctionBody",
  "EvaluateAsyncGeneratorBody",
  "EvaluateFieldInitializer",
]);

// Where ESCore, which has no Intl, as engine262 has none, and a host with ICU, as Node, answer
// differently, a compiled spec stops: at a calendar other than ISO 8601, at a named time zone
// other than UTC, and at a date string in none of the formats that ECMA-262 defines, which a host
// may still read. The method names CallBuiltin stops at are the locale-sensitive built-ins'.
export const LOCALE_METHODS = [
  "toLocaleString",
  "toLocaleDateString",
  "toLocaleTimeString",
  "localeCompare",
];

// The languages whose case mappings ICU tailors, where a host's toLocaleLowerCase and
// toLocaleUpperCase differ from toLowerCase and toUpperCase.
const TAILORED_CASING = new Set(["az", "el", "hy", "lt", "tr"]);

const HOST_PATCHES = [
  {
    name: "CanonicalizeCalendar",
    from: `ELSE ThrowError(s, "RangeError")`,
    to: `ELSE Unsupported(s, <<>>)`,
  },
  {
    name: "ToTemporalTimeZoneIdentifier",
    from: `ELSE ThrowError(r.s, "RangeError")`,
    to: `ELSE Unsupported(r.s, <<>>)`,
  },
  {
    name: "ZonedConstructorTimeZone",
    from: `ELSE ThrowError(r.s, "RangeError")`,
    to: `ELSE Unsupported(r.s, <<>>)`,
  },
  {
    name: "ParseISODateTime",
    from: `TPLower(calendar.calendar) # N("iso8601") THEN ThrowError(s, "RangeError")`,
    to: `TPLower(calendar.calendar) # N("iso8601") THEN Unsupported(s, <<>>)`,
  },
  { name: "ParseDate", from: "ParseDate(u) ==", to: "ParseSpecDate(u) ==" },
  // ESCore runs toLocaleLowerCase and toLocaleUpperCase as toLowerCase and toUpperCase, which the
  // host does too in its default locale, unless that locale tailors case, and in no locale given.
  {
    name: "StringProperties",
    from: `SV("toLocaleLowerCase"), "String", "toLowerCase", 0),\n     M("StringPrototype", SV("toLocaleUpperCase"), "String", "toUpperCase", 0)`,
    to: `SV("toLocaleLowerCase"), "String", "toLocaleLowerCase", 0),\n     M("StringPrototype", SV("toLocaleUpperCase"), "String", "toLocaleUpperCase", 0)`,
  },
  {
    name: "StringMethod",
    from: `    [] m = "toLowerCase" ->`,
    to: `    [] m \\in {"toLocaleLowerCase", "toLocaleUpperCase"} ->
         IF Arg(args, 1) # Undefined \\/ ${TAILORED_CASING.has(new Intl.Locale(new Intl.DateTimeFormat().resolvedOptions().locale).language) ? "TRUE" : "FALSE"} THEN Unsupported(s, <<>>)
         ELSE Ok(s, Str(IF m = "toLocaleLowerCase" THEN ToLowercase(units) ELSE ToUppercase(units)))
    [] m = "toLowerCase" ->`,
  },
  // A program's functions hold their source text as the program's code gives it, which
  // SourceUnits makes code units of when a program reads it.
  {
    name: "FunctionBuiltin",
    from: "Ok(s, Str(slots.sourceText))",
    to: "Ok(s, Str(SourceUnits(slots.sourceText)))",
  },
];

export const getHostDefinitions = (library: Library): GeneratedDefinition[] => [
  ...HOST_PATCHES.map((patch) => {
    const definition = library.definitions.get(patch.name);
    if (definition === undefined || !definition.text.includes(patch.from)) {
      throw new TlaError(`ESCore's ${patch.name} no longer reads as the compiled spec patches it`);
    }
    return {
      name: patch.name === "ParseDate" ? "ParseSpecDate" : patch.name,
      arity: definition.arity,
      text: definition.text.replace(patch.from, patch.to),
    };
  }),
  {
    name: "ParseDate",
    arity: 1,
    text: `ParseDate(u) ==
  LET t == ParseSpecDate(u) IN
  IF t = NaN THEN Assert(FALSE, "tla-ts can't tell whether the host reads this date string") ELSE t`,
  },
];

// The host whose behavior a compiled spec models is the one that compiles it, running a script in
// a new context of its virtual machine, as the reference a program runs on: the global object of
// such a context, which has ECMAScript's globals and the host's own, such as Intl and console, and
// not Node's module globals, such as process and global.
const HOST_GLOBAL: object = runInNewContext("globalThis");

// The host's timers, which a host adds to a script's context to run its jobs later.
const HOST_TIMERS = ["setTimeout", "setInterval", "setImmediate", "queueMicrotask"];

// The object an intrinsic of ESCore's names in the host, if it has one.
const getHostObject = (owner: string): object | undefined => {
  if (owner === "GlobalObject") return HOST_GLOBAL;
  const isPrototype = owner.endsWith("Prototype");
  const base = isPrototype ? owner.slice(0, -"Prototype".length) : owner;
  const temporal: unknown = Reflect.get(HOST_GLOBAL, "Temporal");
  const found: unknown =
    base === "TypedArray"
      ? Object.getPrototypeOf(Reflect.get(HOST_GLOBAL, "Int8Array"))
      : base.startsWith("Temporal") &&
          base !== "Temporal" &&
          typeof temporal === "object" &&
          temporal !== null
        ? Reflect.get(temporal, base.slice("Temporal".length))
        : Reflect.get(HOST_GLOBAL, base);
  if ((typeof found !== "object" && typeof found !== "function") || found === null)
    return undefined;
  const object: unknown = isPrototype ? Reflect.get(found, "prototype") : found;
  return (typeof object === "object" || typeof object === "function") && object !== null
    ? object
    : undefined;
};

// The realm's properties that the host lacks, such as proposals engine262 has and Node doesn't,
// which the spec's realm leaves out, so that a program that tests for one takes the host's path.
const getMissingProperties = (library: Library) =>
  library.properties.filter((property) => {
    const object = getHostObject(property.owner);
    return object !== undefined && !(property.key in object);
  });

// The host's globals that ESCore's realm lacks, such as Intl, at whose names a compile stops.
export const getHostOnlyGlobals = (library: Library) => {
  const realm = new Set(
    library.properties
      .filter((property) => property.owner === "GlobalObject")
      .map((property) => property.key),
  );
  return [...Object.getOwnPropertyNames(HOST_GLOBAL), ...HOST_TIMERS].filter(
    (name) => !realm.has(name),
  );
};

// The keys of the host's built-ins that ESCore's realm has nowhere, such as V8's
// Error.captureStackTrace, at whose names a compile stops.
export const getHostOnlyKeys = (library: Library) => {
  const known = new Set(
    [...library.definitions.values()].flatMap((definition) =>
      [...definition.text.matchAll(/\bSV\("([^"]+)"\)/g)].map((match) => match[1]),
    ),
  );
  return [
    ...new Set(
      [...new Set(library.properties.map((property) => property.owner))].flatMap((owner) => {
        const object = owner === "GlobalObject" ? undefined : getHostObject(owner);
        return object === undefined
          ? []
          : Object.getOwnPropertyNames(object).filter((key) => !known.has(key));
      }),
    ),
  ];
};

export const getRealmDefinitions = (library: Library): GeneratedDefinition[] => {
  const all = library.definitions.get("RealmProperties")?.text ?? "";
  const missing = getMissingProperties(library).map(
    (property) => `<<"${property.owner}", Str(${getUnitsOf(property.key)})>>`,
  );
  return [
    {
      name: "HostRealmProperties",
      arity: 0,
      text: all.replace("RealmProperties ==", "HostRealmProperties =="),
    },
    {
      name: "RealmProperties",
      arity: 0,
      text: `RealmProperties == SelectSeq(HostRealmProperties, LAMBDA p : <<p.o, p.k>> \\notin {${missing.join(", ")}})`,
    },
  ];
};

const getUnitsOf = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

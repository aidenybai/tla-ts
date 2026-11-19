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
  // A generator's body, whose slots hold the id of its code, which RunBody runs.
  `RunGeneratorBody(s, gen) ==
  LET slots == O(s, gen).slots IN RunBody(s, [slots.ctx EXCEPT !.gen = gen], slots.body)`,
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
  // The end of a program once its jobs ran: a throw of the reason of the first promise rejected
  // that nothing handles, as the host that runs the program reports it.
  `UnhandledRejection(s) ==
  LET rejected == {i \\in 1..s.objs.size :
                     LET o == HeapGet(s.objs, i) IN
                     o.class = "promise" /\\ o.slots.state = "rejected" /\\ ~o.slots.isHandled}
  IN IF rejected = {} THEN Ok(s, Undefined)
     ELSE ThrowValue(s, HeapGet(s.objs, CHOOSE i \\in rejected : \\A j \\in rejected : i <= j).slots.result)`,
  // The timers a program set, each a task of its own after the jobs before it ran, as Node runs
  // timers of no delay.
  `RunTimers(s) ==
  IF s.timers = <<>> THEN Ok(s, Undefined) ELSE
  LET r == Call([s EXCEPT !.timers = Tail(@)], Head(s.timers), Undefined, <<>>) IN IF IsAbrupt(r) THEN r ELSE
  LET j == RunJobs(r.s) IN IF IsAbrupt(j) THEN j ELSE
  LET u == UnhandledRejection(j.s) IN IF IsAbrupt(u) THEN u ELSE RunTimers(u.s)`,
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
  // A compiled module's code gives the entries and requests that ParseModule (§16.2.1.7.1) reads
  // of the module's parse node, which ModuleNode gives the program's modules as.
  `ImportEntries(node) == node.imports`,
  `ExportEntries(node) == node.exports`,
  `ModuleRequests(node) == node.requests`,
  `ModuleRequestPhases(node) == node.phases`,
  // HostLoadImportedModule (§16.2.1.10) for a program's host, which loads the module of the file
  // that the referrer's request names, made the first time the host loads it in the realm.
  `HostLoadModuleFrom(s, referrer, request) ==
  LoadModuleNode(s, ModuleNode(ModuleAt(s, referrer).node.targets[request.specifier]))`,
  // A CommonJS module that an ES module imports is a Synthetic Module Record whose default export
  // is the module's exports, as Node's ModuleWrap for it gives them.
  `LoadModuleNode(s, node) ==
  IF <<s.realmId, node.file>> \\in DOMAIN s.moduleIds THEN Ok(s, s.moduleIds[<<s.realmId, node.file>>])
  ELSE LET m == Len(s.modules) + 1
           record == IF node.kind = "commonjs"
                     THEN ModuleRecord("synthetic", node, Undefined, <<>>, <<>>, FALSE, <<>>, <<>>, <<>>, <<>>)
                     ELSE SourceTextModule(node)
       IN Ok([s EXCEPT !.modules = Append(@, record), !.moduleIds = (<<s.realmId, node.file>> :> m) @@ @], m)`,
  // The evaluation of a Synthetic Module Record in InnerModuleEvaluation, with the result value
  // given. A CommonJS module's runs its code, as Node's ModuleWrap does once, and sets its default
  // export to the exports, and evaluates to the error it threw from then on.
  `SyntheticEvaluateThen(s, m, value) ==
  LET rec == ModuleAt(s, m) IN
  CASE rec.node = None -> Ok(SyntheticEvaluate(s, m), value)
    [] rec.status = "evaluated" -> IF rec.error = Empty THEN Ok(s, value) ELSE ThrowValue(s, rec.error)
    [] OTHER ->
         LET r == RequireFile(s, rec.node.file) IN
         IF IsAbrupt(r) THEN Abrupt(SetModule(r.s, m, [status |-> "evaluated", error |-> r.c.value]), r.c)
         ELSE Ok(SetModule(SetMutableBinding(r.s, rec.env, N("default"), Val(r), TRUE).s, m, [status |-> "evaluated"]), value)`,
  // RunModule for a program whose code is a module, as the host runs its entry: the module loaded,
  // linked, and evaluated, with the promise of its evaluation as the result's value.
  `RunModuleNode(s, node) ==
  LET loaded == LoadModuleNode(s, node)
      loading == LoadRequestedModules(loaded.s, Val(loaded))
  IN IF Slots(loading.s, Val(loading)).state = "rejected" THEN ThrowValue(loading.s, Slots(loading.s, Val(loading)).result) ELSE
     LET link == ModuleLink(loading.s, Val(loaded)) IN
     IF IsAbrupt(link) THEN link ELSE ModuleEvaluate(link.s, Val(loaded))`,
  // Module._load of Node's CommonJS loader (lib/internal/modules/cjs/loader.js) for a file of the
  // program, which require calls: the exports of the module, whose code runs the first time, in
  // the function Node wraps it in, with this as its exports; and, for a module whose code still
  // runs, its exports so far. The state's required holds each module object and whether its code
  // ran, and forgets a module whose code threw.
  `RequireFile(s, id) ==
  IF id \\in DOMAIN s.required THEN
    LET exports == Get(s, s.required[id].module, SV("exports")) IN
    IF IsAbrupt(exports) \\/ s.required[id].loaded THEN exports ELSE CircularExports(exports.s, Val(exports))
  ELSE LET node == ModuleNode(id) IN
  IF node.kind # "commonjs" THEN Assert(FALSE, "tla-ts can't require an ES module yet") ELSE
  LET exports == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
      module == OrdinaryObjectCreate(exports.s, Intrinsic(exports.s, "ObjectPrototype"))
      made == CreateDataProperty(module.s, Val(module), SV("exports"), Val(exports))
      require == CreateBuiltinFunction(made.s, <<"Module", "require">>, 1, N("require"), id)
      moduleProxy == StoppingProxy(require.s, Val(module), <<[trap |-> SV("get"), method |-> "moduleExportsGet"],
                                                              [trap |-> SV("set"), method |-> "moduleExportsSet"]>>)
      requireProxy == StoppingProxy(moduleProxy.s, Val(require), <<[trap |-> SV("apply"), method |-> "requireApply"]>>)
      f == CodeFunctionCreate(requireProxy.s, Intrinsic(requireProxy.s, "FunctionPrototype"), node.code, FALSE, s.globalEnv, NoPrivateEnvironment)
      r == Call([f.s EXCEPT !.required = (id :> [module |-> Val(module), loaded |-> FALSE]) @@ @], f.v, Val(exports),
                <<Val(exports), Val(requireProxy), Val(moduleProxy), Str(node.filename), Str(node.dirname)>>)
  IN IF IsAbrupt(r) THEN Abrupt([r.s EXCEPT !.required = [i \\in DOMAIN @ \\ {id} |-> @[i]]], r.c)
     ELSE Get([r.s EXCEPT !.required[id].loaded = TRUE], Val(module), SV("exports"))`,
  // getExportsForCircularRequire of Node's CommonJS loader, which gives the exports of a module
  // whose code still runs a prototype that warns of each property that it lacks, where they are
  // an object of Object.prototype that doesn't mark itself an ES module's.
  `CircularExports(s, exports) ==
  IF ~IsObject(exports) \\/ O(s, exports).class = "proxy" \\/ O(s, exports).proto # Intrinsic(s, "ObjectPrototype") THEN Ok(s, exports) ELSE
  LET esModule == Get(s, exports, SV("__esModule")) IN
  IF IsAbrupt(esModule) \\/ ToBooleanValue(Val(esModule)) THEN IF IsAbrupt(esModule) THEN esModule ELSE Ok(esModule.s, exports)
  ELSE Assert(FALSE, "tla-ts can't give the exports of a CommonJS module in a cycle the prototype that Node gives them")`,
  // What of Node a program reaches that the runtime has only part of, such as a CommonJS module's
  // module and require: a proxy whose handler stops at every operation but its allowed traps,
  // which reach only what the runtime has, such as module.exports and a call of require.
  `StoppingProxy(s, target, allowed) ==
  LET handler == OrdinaryObjectCreate(s, Null)
      stop == CreateBuiltinFunction(handler.s, <<"Module", "commonJsStop">>, 0, <<>>, Empty)
  IN ProxyCreate(AllowTraps(DefineTraps(stop.s, Val(handler), Val(stop), CommonJsTraps), Val(handler), allowed),
                 target, Val(handler))`,
  `CommonJsTraps ==
  <<SV("getPrototypeOf"), SV("setPrototypeOf"), SV("isExtensible"), SV("preventExtensions"), SV("getOwnPropertyDescriptor"),
    SV("defineProperty"), SV("has"), SV("get"), SV("set"), SV("deleteProperty"), SV("ownKeys"), SV("apply"), SV("construct")>>`,
  `DefineTraps(s, handler, trap, names) ==
  IF names = <<>> THEN s ELSE DefineTraps(CreateDataProperty(s, handler, Head(names), trap).s, handler, trap, Tail(names))`,
  `AllowTraps(s, handler, allowed) ==
  IF allowed = <<>> THEN s ELSE
  LET f == CreateBuiltinFunction(s, <<"Module", Head(allowed).method>>, 0, <<>>, Empty) IN
  AllowTraps(CreateDataProperty(f.s, handler, Head(allowed).trap, Val(f)).s, handler, Tail(allowed))`,
  // The host's globals and built-ins' properties that a module program names and ESCore's realm
  // lacks, on the global object and the intrinsics as the host's own context has them, where a
  // module runs. One whose value is a primitive has the host's value. One whose value is a function
  // or an object is a proxy whose handler stops at every operation, whose target is a function
  // where the host's value is one, and one that the host gives a getter has a getter that gives the
  // proxy, or undefined where the host's gives undefined, and a setter that stops. Any other
  // accessor stops where it's read or written.
  `DefineHost(s, properties) ==
  LET handler == OrdinaryObjectCreate(s, Null)
      trap == CreateBuiltinFunction(handler.s, <<"Module", "hostTrap">>, 0, <<>>, Empty)
      traps == DefineTraps(trap.s, Val(handler), Val(trap), CommonJsTraps)
  IN DefineHostWith([traps EXCEPT !.hostHandler = Val(handler)], Val(handler), properties)`,
  `DefineHostWith(s, handler, properties) ==
  IF properties = <<>> THEN Ok(s, Empty) ELSE
  LET p == Head(properties)
      stop == CreateBuiltinFunction(s, <<"Module", "hostStop">>, 0, <<>>, p.name)
      target == CASE p.kind = "function" -> stop
                  [] p.kind = "console" -> ConsoleObject(stop.s)
                  [] OTHER -> LET a == Alloc(stop.s, MakeObject(Null, "ordinary", [hostName |-> p.name])) IN Ok(a.s, a.v)
      value == CASE p.kind = "value" -> Ok(target.s, p.value)
                 [] p.kind \\in {"undefined", "accessor"} -> Ok(target.s, Undefined)
                 [] p.kind = "console" -> StoppingProxy(target.s, Val(target), <<[trap |-> SV("get"), method |-> "consoleGet"]>>)
                 [] OTHER -> ProxyCreate(target.s, Val(target), handler)
      getter == IF p.kind = "accessor" THEN Ok(value.s, Val(stop))
                ELSE CreateBuiltinFunction(value.s, <<"Module", "hostGlobal">>, 0, <<>>, Val(value))
      d == IF p.isAccessor
           THEN DefinePropertyOrThrow(getter.s, Intrinsic(s, p.owner), Str(p.name), AccessorDesc(Val(getter), Val(stop), p.enumerable, p.configurable))
           ELSE DefinePropertyOrThrow(value.s, Intrinsic(s, p.owner), Str(p.name), DataDesc(Val(value), p.writable, p.enumerable, p.configurable))
  IN IF IsAbrupt(d) THEN d ELSE DefineHostWith(d.s, handler, Tail(properties))`,
  // A stop at what of the host that ESCore leaves out a program uses, by its name's code units.
  `HostStop(name) == Assert(FALSE, "tla-ts can't run the host's " \\o UnitsText(name) \\o ", which ESCore leaves out")`,
  // The TLA+ string of code units that a TLA+ string can hold.
  `UnitsText(units) ==
  IF units = <<>> THEN "" ELSE (CHOOSE c \\in DOMAIN CharacterUnits : CharacterUnits[c] = Head(units)) \\o UnitsText(Tail(units))`,
  // Node's console, of which a program reads only the methods that write what they're given and
  // createTask: each of the former writes nothing that the program reads, where the values it's
  // given are primitives, which no code of the program runs to format.
  `ConsoleObject(s) ==
  LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
      run == CreateBuiltinFunction(o.s, <<"Module", "taskRun">>, 0, N("run"), Empty)
      createTask == CreateBuiltinFunction(run.s, <<"Module", "createTask">>, 0, N("createTask"), Val(run))
      made == CreateDataProperty(createTask.s, Val(o), SV("createTask"), Val(createTask))
  IN Ok(ConsoleMethods(made.s, Val(o), <<N("log"), N("info"), N("debug"), N("warn"), N("error")>>), Val(o))`,
  `ConsoleMethods(s, o, names) ==
  IF names = <<>> THEN s ELSE
  LET f == CreateBuiltinFunction(s, <<"Module", "consoleWrite">>, 0, Head(names), Empty) IN
  ConsoleMethods(CreateDataProperty(f.s, o, Str(Head(names)), Val(f)).s, o, Tail(names))`,
  // Module.prototype.require of Node's CommonJS loader for the module of the file referrer, which
  // loads the file of a specifier that its code requires.
  `Require(s, referrer, id) ==
  IF ~IsString(id) \\/ id.value \\notin DOMAIN ModuleNode(referrer).targets
  THEN Assert(FALSE, "tla-ts can't require a module other than a file that a string names")
  ELSE RequireFile(s, ModuleNode(referrer).targets[id.value])`,
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
  // setTimeout, of a callback and no delay, whose callback RunTimers calls once the jobs ran. In a
  // module program, which runs in the host's own context, it gives a Timeout, as Node does, which
  // stops at any use, and a script may only call it as a statement.
  {
    name: "GlobalBuiltin",
    from: `    [] m = "gc" ->`,
    to: `    [] m = "setTimeout" ->
         IF Len(args) > 1 \\/ ~IsCallable(s, Arg(args, 1)) THEN Unsupported(s, <<>>)
         ELSE IF s.hostHandler = Empty THEN Ok([s EXCEPT !.timers = Append(@, Arg(args, 1))], Undefined)
         ELSE LET timeout == Alloc([s EXCEPT !.timers = Append(@, Arg(args, 1))], MakeObject(Null, "ordinary", [hostName |-> N("Timeout")]))
              IN ProxyCreate(timeout.s, timeout.v, s.hostHandler)
    [] m = "gc" ->`,
  },
  // A frame of a program's code, whose step is "Code" and whose arguments start with the id of the
  // operator that resumes it, which ResumeCode runs.
  {
    name: "ResumeFrame",
    from: "ResumeFrame(frame, r) ==\n  CASE ",
    to: 'ResumeFrame(frame, r) ==\n  CASE frame.step = "Code" -> ResumeCode(frame.args, r)\n    [] ',
  },
  // A program's module loads the files of its requests, links the declarations that its code
  // instantiates, and runs its body as the code gives it.
  {
    name: "LoadRequests",
    from: "HostLoadModule(s, request)",
    to: "HostLoadModuleFrom(s, m, request)",
  },
  {
    name: "InitializeEnvironment",
    from: `LET vars == CreateVarBindings(imported.s, env.e, Dedupe(ConcatMap(VarScopedDeclarations(rec.node), BoundNames)), env.e, FALSE, {})
      lexicals == LexicallyScopedDeclarations(rec.node)
  IN Ok(InitializeModuleFunctions(CreateLexicalBindings(vars, env.e, lexicals), ModuleContext(env.e), env.e,
                                  SelectSeq(lexicals, LAMBDA d : d.type \\in FunctionDeclarationTypes)),
        Empty)`,
    to: "ModuleDeclarations(imported.s, ModuleContext(env.e), rec.node)",
  },
  {
    name: "ExecuteModule",
    from: "EvaluateDisposing(s, ModuleContext(ModuleAt(s, m).env), ModuleItems(ModuleAt(s, m).node))",
    to: "RunBody(s, ModuleContext(ModuleAt(s, m).env), ModuleAt(s, m).node.body)",
  },
  {
    name: "ExecuteAsyncModule",
    from: "EvaluateDisposing(then.s, ModuleContext(ModuleAt(s, m).env), ModuleItems(ModuleAt(s, m).node))",
    to: "RunBody(then.s, ModuleContext(ModuleAt(s, m).env), ModuleAt(s, m).node.body)",
  },
  // A Synthetic Module Record links once, as Node's does, so that a CommonJS module that a later
  // link reaches keeps its exports.
  {
    name: "SyntheticLink",
    from: "SyntheticLink(s, m) ==\n",
    to: "SyntheticLink(s, m) ==\n  IF ModuleAt(s, m).env # 0 THEN s ELSE\n",
  },
  {
    name: "InnerModuleEvaluation",
    from: `CASE rec.kind = "synthetic" -> Ok(SyntheticEvaluate(s, m), [stack |-> stack, index |-> index])`,
    to: `CASE rec.kind = "synthetic" -> SyntheticEvaluateThen(s, m, [stack |-> stack, index |-> index])`,
  },
  // The require that a CommonJS module's code calls.
  {
    name: "ModuleBuiltin",
    from: `    [] m = "importEvaluated" -> ResolveImport(s, data)`,
    to: `    [] m = "importEvaluated" -> ResolveImport(s, data)
    [] m = "require" -> Require(s, data, Arg(args, 1))
    [] m = "moduleExportsGet" ->
         IF Arg(args, 2) # SV("exports") THEN Assert(FALSE, "tla-ts can't use a CommonJS module's module other than for module.exports")
         ELSE Get(s, Arg(args, 1), SV("exports"))
    [] m = "moduleExportsSet" ->
         IF Arg(args, 2) # SV("exports") THEN Assert(FALSE, "tla-ts can't use a CommonJS module's module other than for module.exports")
         ELSE ResultThen(True, Set(s, Arg(args, 1), SV("exports"), Arg(args, 3), TRUE))
    [] m = "requireApply" ->
         LET list == CreateListFromArrayLike(s, Arg(args, 3), "all") IN
         IF IsAbrupt(list) THEN list ELSE Call(list.s, Arg(args, 1), Arg(args, 2), Val(list))
    [] m = "hostGlobal" -> Ok(s, data)
    [] m = "consoleGet" ->
         IF Arg(args, 2) \\notin {SV("log"), SV("info"), SV("debug"), SV("warn"), SV("error"), SV("createTask")}
         THEN Assert(FALSE, "tla-ts can't use the host's console other than to write primitives and createTask")
         ELSE Get(s, Arg(args, 1), Arg(args, 2))
    [] m = "consoleWrite" ->
         IF \\E i \\in DOMAIN args : IsObject(args[i])
         THEN Assert(FALSE, "tla-ts can't write an object to the host's console, which formats it")
         ELSE Ok(s, Undefined)
    [] m = "createTask" ->
         IF ~IsString(Arg(args, 1)) \\/ Arg(args, 1).value = <<>> THEN Assert(FALSE, "tla-ts can't make a task of the host's console without a name")
         ELSE LET task == Alloc(s, MakeObject(Intrinsic(s, "ObjectPrototype"), "ordinary", [consoleTask |-> TRUE])) IN
              ResultThen(task.v, CreateDataProperty(task.s, task.v, SV("run"), data))
    [] m = "taskRun" ->
         IF ~IsObject(this) \\/ "consoleTask" \\notin DOMAIN O(s, this).slots \\/ ~IsCallable(s, Arg(args, 1))
         THEN Assert(FALSE, "tla-ts can't run a task of the host's console other than a function")
         ELSE Call(s, Arg(args, 1), Undefined, <<>>)
    [] m = "hostStop" -> HostStop(data)
    [] m = "hostTrap" ->
         HostStop(IF "hostName" \\in DOMAIN O(s, Arg(args, 1)).slots THEN O(s, Arg(args, 1)).slots.hostName ELSE O(s, Arg(args, 1)).slots.data)
    [] m = "commonJsStop" -> Assert(FALSE, "tla-ts can't use a CommonJS module's module or require other than for module.exports and a call")`,
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
const HOST_TIMERS = ["setInterval", "setImmediate", "queueMicrotask"];

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

// The host's globals that ESCore's realm lacks, such as Intl, at whose names a compile stops: a
// script's, of a new context, and a module's, which the host runs in its own context, whose
// global object has the host's globals too, such as process.
export const getHostOnlyGlobals = (library: Library, host: object = HOST_GLOBAL) => {
  const realm = new Set([
    ...library.properties
      .filter((property) => property.owner === "GlobalObject")
      .map((property) => property.key),
    "setTimeout",
    // The parameters of the function that Node wraps a CommonJS module's code in, which the process
    // that compiles may hold as globals.
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
  ]);
  return [...Object.getOwnPropertyNames(host), ...HOST_TIMERS].filter((name) => !realm.has(name));
};

// The properties of the host's built-ins whose keys ESCore's realm has nowhere, such as V8's
// Error.captureStackTrace, by the intrinsic that holds each, with the host's descriptor of it.
export const getHostOnlyProperties = (library: Library) => {
  const known = new Set(
    [...library.definitions.values()].flatMap((definition) =>
      [...definition.text.matchAll(/\bSV\("([^"]+)"\)/g)].map((match) => match[1]),
    ),
  );
  return [...new Set(library.properties.map((property) => property.owner))].flatMap((owner) => {
    const object = owner === "GlobalObject" ? undefined : getHostObject(owner);
    return object === undefined
      ? []
      : Object.getOwnPropertyNames(object)
          .filter((key) => !known.has(key))
          .map((key) => ({ owner, key, descriptor: Object.getOwnPropertyDescriptor(object, key) }));
  });
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
      text: `RealmProperties == SelectSeq(HostRealmProperties, LAMBDA p : <<p.o, p.k>> \\notin {${missing.join(", ")}}) \\o <<M("GlobalObject", Str(${getUnitsOf("setTimeout")}), "Global", "setTimeout", 2)>>`,
    },
  ];
};

const getUnitsOf = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

import { runInNewContext } from "node:vm";
import { TlaError } from "../../errors";
import type { GeneratedDefinition, Library } from "./library";
import { TIME_ZONES } from "./time-zones";

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
  LET r == Call([s EXCEPT !.timers = Tail(@), !.task = [kind |-> "timer"]], Head(s.timers), Undefined, <<>>) IN IF IsAbrupt(r) THEN r ELSE
  LET j == RunJobs(r.s) IN IF IsAbrupt(j) THEN j ELSE
  LET u == UnhandledRejection(j.s) IN IF IsAbrupt(u) THEN u ELSE RunTimers(u.s)`,
  // An error's own stack accessor, as V8 gives each error one, of the two functions that the realm
  // keeps in the slots of %Error.prototype%.
  `InstallStack(s, o) ==
  LET fns == O(s, Intrinsic(s, "ErrorPrototype")).slots
  IN SetO(s, o, PutProp(O(s, o), SV("stack"), AccessorDesc(fns.stackGet, fns.stackSet, FALSE, TRUE)))`,
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
  // ran, and forgets a module whose code threw. Node's require is a function that new constructs
  // too, which the proxy of it stops at.
  `RequireFile(s, id) ==
  IF id \\in DOMAIN s.required THEN
    LET exports == Get(s, s.required[id].module, SV("exports")) IN
    IF IsAbrupt(exports) \\/ s.required[id].loaded THEN exports ELSE CircularExports(exports.s, Val(exports))
  ELSE LET node == ModuleNode(id) IN
  IF node.kind # "commonjs" THEN Assert(FALSE, "tla-ts can't require an ES module yet") ELSE
  LET exports == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
      module == OrdinaryObjectCreate(exports.s, Intrinsic(exports.s, "ObjectPrototype"))
      made == CreateDataProperty(module.s, Val(module), SV("exports"), Val(exports))
      require == LET a == Alloc(made.s, BuiltinObject(Intrinsic(made.s, "FunctionPrototype"), <<"Module", "require">>, 1,
                                                       N("require"), TRUE, id, made.s.realmId))
                 IN Ok(a.s, a.v)
      moduleProxy == StoppingProxy(require.s, Val(module), N("module"), <<[trap |-> SV("get"), method |-> "moduleExportsGet"],
                                                              [trap |-> SV("set"), method |-> "moduleExportsSet"]>>)
      requireProxy == StoppingProxy(moduleProxy.s, Val(require), N("require"), <<[trap |-> SV("apply"), method |-> "requireApply"]>>)
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
  `StoppingProxy(s, target, name, allowed) ==
  LET handler == OrdinaryObjectCreate(s, Null)
      stop == CreateBuiltinFunction(handler.s, <<"Module", "hostStop">>, 0, <<>>, name)
  IN ProxyCreate(AllowTraps(DefineTraps(stop.s, Val(handler), Val(stop), CommonJsTraps), Val(handler), allowed),
                 target, Val(handler))`,
  `CommonJsTraps ==
  <<SV("getPrototypeOf"), SV("setPrototypeOf"), SV("isExtensible"), SV("preventExtensions"), SV("getOwnPropertyDescriptor"),
    SV("defineProperty"), SV("has"), SV("get"), SV("set"), SV("deleteProperty"), SV("ownKeys"), SV("apply"), SV("construct")>>`,
  `DefineTraps(s, handler, trap, names) ==
  IF names = <<>> THEN s ELSE DefineTraps(CreateDataProperty(s, handler, Head(names), trap).s, handler, trap, Tail(names))`,
  `AllowTraps(s, handler, allowed) ==
  IF allowed = <<>> THEN s ELSE
  LET f == CreateBuiltinFunction(s, <<"Module", Head(allowed).method>>, 0, <<>>, IF "data" \\in DOMAIN Head(allowed) THEN Head(allowed).data ELSE Empty) IN
  AllowTraps(CreateDataProperty(f.s, handler, Head(allowed).trap, Val(f)).s, handler, Tail(allowed))`,
  // The host's globals and built-ins' properties that a module program names and ESCore's realm
  // lacks, on the global object and the intrinsics as the host's own context has them, where a
  // module runs. One whose value is a primitive has the host's value. One whose value is a function
  // or an object is a proxy whose handler stops at every operation, whose target is a function
  // where the host's value is one, and a constructor where it's one, so that a new of it reaches
  // the handler. A new of a constructor that makes an object quietly, which runs nothing a program
  // sees but its arguments' conversions until it uses the object, as TextEncoder's, makes a proxy
  // that stops at every operation. One that the host gives a getter has a getter that gives the
  // proxy, or undefined where the host's gives undefined, and a setter that stops. Any other
  // accessor stops where it's read or written.
  `DefineHost(s, properties) ==
  LET handler == OrdinaryObjectCreate(s, Null)
      trap == CreateBuiltinFunction(handler.s, <<"Module", "hostTrap">>, 0, <<>>, Empty)
      construct == CreateBuiltinFunction(trap.s, <<"Module", "hostConstruct">>, 0, <<>>, Empty)
      traps == AllowTraps(DefineTraps(construct.s, Val(handler), Val(trap), CommonJsTraps), Val(handler),
                          <<[trap |-> SV("construct"), method |-> "hostConstruct"]>>)
  IN DefineHostWith([traps EXCEPT !.hostHandler = Val(handler)], Val(handler), properties)`,
  `DefineHostWith(s, handler, properties) ==
  IF properties = <<>> THEN Ok(s, Empty) ELSE
  LET p == Head(properties)
      stop == LET a == Alloc(s, BuiltinObject(Intrinsic(s, "FunctionPrototype"),
                                              <<"Module", IF p.isQuiet THEN "hostQuietConstructor" ELSE "hostStop">>, 0, <<>>,
                                              p.isConstructor, p.name, s.realmId))
              IN Ok(a.s, a.v)
      target == CASE p.kind = "function" -> stop
                  [] p.kind = "console" -> ConsoleObject(stop.s)
                  [] p.kind = "process" -> ProcessObject(stop.s)
                  [] OTHER -> LET a == Alloc(stop.s, MakeObject(Null, "ordinary", [hostName |-> p.name])) IN Ok(a.s, a.v)
      value == CASE p.kind = "value" -> Ok(target.s, p.value)
                 [] p.kind \\in {"undefined", "accessor"} -> Ok(target.s, Undefined)
                 [] p.kind = "console" -> StoppingProxy(target.s, Val(target), p.name, <<[trap |-> SV("get"), method |-> "consoleGet"]>>)
                 [] p.kind = "process" -> StoppingProxy(target.s, Val(target), p.name, <<[trap |-> SV("get"), method |-> "processGet"]>>)
                 [] OTHER -> ProxyCreate(target.s, Val(target), handler)
      getter == IF p.kind = "accessor" THEN Ok(value.s, Val(stop))
                ELSE CreateBuiltinFunction(value.s, <<"Module", "hostGlobal">>, 0, <<>>, Val(value))
      d == IF p.isAccessor
           THEN DefinePropertyOrThrow(getter.s, Intrinsic(s, p.owner), Str(p.name), AccessorDesc(Val(getter), Val(stop), p.enumerable, p.configurable))
           ELSE DefinePropertyOrThrow(value.s, Intrinsic(s, p.owner), Str(p.name), DataDesc(Val(value), p.writable, p.enumerable, p.configurable))
  IN IF IsAbrupt(d) THEN d ELSE DefineHostWith(d.s, handler, Tail(properties))`,
  // import.meta of module m, as Node gives it: an object without a prototype whose dirname,
  // filename, resolve, and url, which the runtime leaves out, are accessors that stop, and whose
  // main tells whether m is the entry, the module the host loaded first.
  `ImportMeta(s, m) ==
  LET o == OrdinaryObjectCreate(s, Null)
      stop == CreateBuiltinFunction(o.s, <<"Module", "hostStop">>, 0, <<>>, N("import.meta"))
      d == DefineMetaProperties(stop.s, Val(o), Val(stop), <<N("dirname"), N("filename"), N("main"), N("resolve"), N("url")>>, m = 1)
  IN IF IsAbrupt(d) THEN d ELSE Ok(d.s, Val(o))`,
  `DefineMetaProperties(s, o, stop, names, isMain) ==
  IF names = <<>> THEN Ok(s, Empty) ELSE
  LET d == DefinePropertyOrThrow(s, o, Str(Head(names)),
             IF Head(names) = N("main") THEN DataDesc(Bool(isMain), TRUE, TRUE, TRUE) ELSE AccessorDesc(stop, stop, TRUE, TRUE))
  IN IF IsAbrupt(d) THEN d ELSE DefineMetaProperties(d.s, o, stop, Tail(names), isMain)`,
  // The steps of a constructor of the host that makes its object quietly, from the arguments it
  // converts: TextEncoder's, which converts none, and TextDecoder's, as Node's runs them
  // (lib/internal/encoding.js), of a label of UTF-8, and of options that it reads fatal and ignoreBOM
  // of, then ignoreBOM and fatal again. A label of another encoding, which the host's table of labels
  // decides, stops.
  `QuietConstruct(s, name, args) ==
  IF name = N("TextEncoder") THEN Ok(s, Empty) ELSE
  LET label == IF Arg(args, 1) = Undefined THEN Ok(s, Str(N("utf-8"))) ELSE ToStr(s, Arg(args, 1))
      options == Arg(args, 2)
  IN IF IsAbrupt(label) THEN label
     ELSE IF options \\notin {Undefined, Null} /\\ ~IsObject(options) THEN HostStop(name)
     ELSE IF Val(label).value \\notin {N("utf-8"), N("utf8"), N("unicode-1-1-utf-8"), N("unicode11utf8"), N("unicode20utf8"), N("x-unicode20utf8")}
     THEN HostStop(name)
     ELSE IF options \\in {Undefined, Null} THEN Ok(label.s, Empty)
     ELSE ReadOptions(label.s, options, <<SV("fatal"), SV("ignoreBOM"), SV("ignoreBOM"), SV("fatal")>>)`,
  `ReadOptions(s, options, keys) ==
  IF keys = <<>> THEN Ok(s, Empty) ELSE
  LET r == Get(s, options, Head(keys)) IN IF IsAbrupt(r) THEN r ELSE ReadOptions(r.s, options, Tail(keys))`,
  // A stop at what of the host that ESCore leaves out a program uses, by its name's code units.
  `HostStop(name) == Assert(FALSE, "tla-ts can't run the host's " \\o UnitsText(name) \\o ", which ESCore leaves out")`,
  // The TLA+ string of code units that a TLA+ string can hold.
  `UnitsText(units) ==
  IF units = <<>> THEN "" ELSE (CHOOSE c \\in DOMAIN CharacterUnits : CharacterUnits[c] = Head(units)) \\o UnitsText(Tail(units))`,
  // TextEncoder's encode, as Node's runs it: the UTF-8 bytes of the string of input, where a lone
  // surrogate is U+FFFD, in a new Uint8Array.
  `TextEncode(s, input) ==
  LET str == ToStr(s, input) IN
  IF IsAbrupt(str) THEN str ELSE
  LET bytes == Utf8Bytes(Val(str).value, 1, <<>>)
      array == CreateArrayFromList(str.s, [i \\in 1..Len(bytes) |-> IntV(bytes[i])])
  IN IF IsAbrupt(array) THEN array
     ELSE Construct(array.s, Intrinsic(array.s, "Uint8Array"), <<Val(array)>>, Intrinsic(array.s, "Uint8Array"))`,
  `Utf8Bytes(u, k, acc) ==
  IF k > Len(u) THEN acc ELSE
  IF u[k] >= 55296 /\\ u[k] <= 56319 /\\ k < Len(u) /\\ u[k + 1] >= 56320 /\\ u[k + 1] <= 57343
  THEN Utf8Bytes(u, k + 2, acc \\o UTF8Encode((u[k] - 55296) * 1024 + u[k + 1] - 56320 + 65536))
  ELSE Utf8Bytes(u, k + 1, acc \\o UTF8Encode(IF u[k] >= 55296 /\\ u[k] <= 57343 THEN 65533 ELSE u[k]))`,
  // A function of the host, as a proxy that stops at every operation but typeof.
  `HostFunction(s, name) ==
  LET stop == Alloc(s, BuiltinObject(Intrinsic(s, "FunctionPrototype"), <<"Module", "hostStop">>, 0, <<>>, FALSE, name, s.realmId))
  IN ProxyCreate(stop.s, stop.v, s.hostHandler)`,
  // Node's process, of which a program reads only hrtime, whose bigint it may only read, and
  // getBuiltinModule, of async_hooks, of which it reads
  // only AsyncResource, whose objects run a function in their scope and emit their destroy, as
  // Node's do (lib/async_hooks.js) where no hook of async_hooks observes them, which a program would
  // make by reading more of async_hooks. A program reads process.env as the compile gives it.
  `ProcessObject(s) ==
  LET bigint == HostFunction(s, N("process.hrtime.bigint"))
      hrtimeTarget == Alloc(bigint.s, BuiltinObject(Intrinsic(s, "FunctionPrototype"), <<"Module", "hostStop">>, 0, <<>>, FALSE,
                                                    N("process.hrtime"), s.realmId))
      hrtime == StoppingProxy(hrtimeTarget.s, hrtimeTarget.v, N("process.hrtime"),
                              <<[trap |-> SV("get"), method |-> "hrtimeGet", data |-> Val(bigint)]>>)
      o == OrdinaryObjectCreate(hrtime.s, Intrinsic(s, "ObjectPrototype"))
      withHrtime == CreateDataProperty(o.s, Val(o), SV("hrtime"), Val(hrtime))
      run == CreateBuiltinFunction(withHrtime.s, <<"Module", "asyncRun">>, 1, N("runInAsyncScope"), Empty)
      destroy == CreateBuiltinFunction(run.s, <<"Module", "asyncDestroy">>, 0, N("emitDestroy"), Empty)
      resource == Alloc(destroy.s, BuiltinObject(Intrinsic(destroy.s, "FunctionPrototype"), <<"Module", "asyncResource">>, 1,
                                                 N("AsyncResource"), TRUE, [run |-> Val(run), destroy |-> Val(destroy)], destroy.s.realmId))
      hooks == OrdinaryObjectCreate(resource.s, Null)
      withResource == CreateDataProperty(hooks.s, Val(hooks), SV("AsyncResource"), resource.v)
      hooksProxy == StoppingProxy(withResource.s, Val(hooks), N("async_hooks"), <<[trap |-> SV("get"), method |-> "asyncHooksGet"]>>)
      load == CreateBuiltinFunction(hooksProxy.s, <<"Module", "getBuiltinModule">>, 1, N("getBuiltinModule"), Val(hooksProxy))
      made == CreateDataProperty(load.s, Val(o), SV("getBuiltinModule"), Val(load))
  IN Ok(made.s, Val(o))`,
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

// V8's stack traces as Node 26 writes them: each call's frame records the position of the call in
// the frame below, an error constructor captures the frames of the state's calls, and the error's
// stack accessor writes their text when a program first reads it.
const STACK_DEFINITIONS = [
  // A call that a program's code makes, from the position <<file, line, column>> that V8 gives it,
  // which the call's frame keeps.
  `CallArgumentsAt(site, f, this, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsCallable(r.s, f) THEN ThrowTypeError(r.s)
  ELSE CallObjectAt(r.s, f, this, Val(r), site)`,
  `NewArgumentsAt(site, constructor, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF ~IsConstructor(r.s, constructor) THEN ThrowTypeError(r.s)
  ELSE ConstructObjectAt(r.s, constructor, Val(r), constructor, site)`,
  // SuperCallThen, from the position of the super call.
  `SuperCallAt(site, thisEnv, func, newTarget, args) ==
  IF IsAbrupt(args) THEN args
  ELSE IF ~IsConstructor(args.s, func) THEN ThrowTypeError(args.s)
  ELSE LET result == ConstructObjectAt(args.s, func, Val(args), newTarget, site) IN
     IF IsAbrupt(result) THEN result ELSE
     LET b == BindThisValue(result.s, thisEnv, Val(result)) IN
     IF IsAbrupt(b) THEN b ELSE
     LET i == InitializeInstanceElements(b.s, Val(result), E(b.s, thisEnv).fn) IN
     IF IsAbrupt(i) THEN i ELSE Ok(i.s, Val(result))`,
  // CallObject and ConstructObject of a function that a call of a program's code reaches, whose
  // frame keeps the call's position; a proxy's or a wrapped function's, of which V8 has no frame,
  // drops it.
  `CallObjectAt(s, f, this, args, site) ==
  LET o == O(s, f) IN
  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushFrame(s, f, this, args, FALSE, site), o.slots.realm), f, o.slots.id, this, args, Undefined))
    [] o.class = "bound" -> CallObjectAt(s, o.slots.target, o.slots.this, o.slots.args \\o args, site)
    [] o.class = "function" -> InCallerRealm(s, OrdinaryCall(EnterRealm(PushFrame(s, f, this, args, FALSE, site), o.slots.realm), f, this, args))
    [] OTHER -> CallObject(s, f, this, args)`,
  `ConstructObjectAt(s, f, args, newTarget, site) ==
  LET o == O(s, f) IN
  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushFrame(s, f, newTarget, args, TRUE, site), o.slots.realm), f, o.slots.id, Undefined, args, newTarget))
    [] o.class = "bound" ->
         ConstructObjectAt(s, o.slots.target, o.slots.args \\o args, IF SameValue(f, newTarget) THEN o.slots.target ELSE newTarget, site)
    [] o.class = "function" -> InCallerRealm(s, OrdinaryConstruct(PushFrame(s, f, newTarget, args, TRUE, site), f, args, newTarget))
    [] OTHER -> ConstructObject(s, f, args, newTarget)`,
  // The frame of a call of f, a built-in or ECMAScript function, with its this value, or new.target
  // where new made it, and the position in the frame below of the call, or <<>> where the call is
  // ESCore's own, as V8 records each frame of a stack.
  `PushFrame(s, f, this, args, isNew, site) ==
  [s EXCEPT !.callers = [f |-> f, args |-> args, this |-> this, isNew |-> isNew, site |-> site, next |-> s.callers]]`,
  // The value of a data property of an object or the objects it inherits from, Undefined for an
  // accessor or past a proxy, and Absent where none has it (JSReceiver::GetDataProperty).
  `DataOnChain(s, o, k) ==
  IF o = Null THEN Absent
  ELSE IF O(s, o).class = "proxy" THEN Undefined
  ELSE LET d == OrdinaryGetOwnProperty(O(s, o), k) IN
       IF d = Absent THEN DataOnChain(s, O(s, o).proto, k)
       ELSE IF IsDataDescriptor(d) THEN d.value ELSE Undefined`,
  // Error.stackTraceLimit as V8 reads it when it makes an error (Isolate::GetStackTraceLimit): a
  // number clamped to 0..2^31-1, or -1 for no stack at all. Its key is the host's, which a module
  // program's realm has and a script's lacks, where Node's is 10.
  `StackTraceLimit(s) ==
  LET v == DataOnChain(s, Intrinsic(s, "Error"), Str(N("stackTraceLimit"))) IN
  IF v = Absent THEN HostDefaultStackTraceLimit(1) ELSE
  IF ~IsNumber(v) THEN -1 ELSE
  LET n == NumToIntegerOrInfinity(v.value) IN
  IF ~NumLess(n, NumFromInt(2147483647)) THEN 2147483647
  ELSE IF NumLess(n, NumFromInt(0)) THEN 0
  ELSE NumToInt(n)`,
  // The error constructors, whose frame V8 skips at the top of an error's stack.
  `IsErrorConstructor(s, f) ==
  O(s, f).class = "builtin" /\\
  (O(s, f).slots.id \\in {<<"Error", "constructor">>, <<"AggregateError", "constructor">>} \\/ O(s, f).slots.id[1] = "NativeError")`,
  // The stack that an error constructor captures of the frames that called it, which the error's
  // stack reads as text (ErrorUtils::Construct): its frames from those of the calls of the state,
  // to skip until new.target's, or the first, the limit, and the task that runs. An error whose
  // new.target is its constructor is one V8 made for the constructor itself, as madeBy marks.
  `CaptureStack(s, o, newTarget) ==
  IF s.callers = Null \\/ ~IsErrorConstructor(s, s.callers.f) THEN s ELSE
  LET target == IF IsObject(newTarget) /\\ O(s, newTarget).class \\in {"function", "builtin"} THEN newTarget ELSE Empty
      trace == [callers |-> s.callers, target |-> target, limit |-> StackTraceLimit(s), task |-> s.task, realm |-> s.realmId]
  IN SetO(s, o, [O(s, o) EXCEPT !.slots = (IF SameValue(newTarget, s.callers.f) THEN [trace |-> trace, madeBy |-> newTarget] ELSE [trace |-> trace]) @@ @])`,
  // An error's stack as Node writes it, once, when a program first reads it: Node's
  // prepareStackTraceCallback, which defers to a program's Error.prepareStackTrace, and otherwise
  // writes the header of Error.prototype.toString, which reads the error's name and message, and
  // the frames V8 captured.
  `FormatStack(s, error, t) ==
  IF t.realm # 1 \\/ s.realmId # 1 THEN Assert(FALSE, "tla-ts can't read the stack of an error of another realm as Node writes it") ELSE
  LET e == Get(s, Intrinsic(s, "GlobalObject"), SV("Error")) IN IF IsAbrupt(e) THEN e ELSE
  LET p == CASE IsNullish(Val(e)) -> Ok(e.s, Undefined)
              [] IsObject(Val(e)) -> Get(e.s, Val(e), SV("prepareStackTrace"))
              [] OTHER -> Assert(FALSE, "tla-ts can't read prepareStackTrace of a global Error that isn't an object") IN
  IF IsAbrupt(p) THEN p ELSE
  LET q == Get(p.s, Intrinsic(p.s, "Error"), SV("prepareStackTrace")) IN IF IsAbrupt(q) THEN q ELSE
  IF IsCallable(q.s, Val(p)) \\/ IsCallable(q.s, Val(q)) THEN Assert(FALSE, "tla-ts can't run a program's Error.prepareStackTrace") ELSE
  IF ProxyOnChain(q.s, error) THEN Assert(FALSE, "tla-ts can't ask a proxy whether an error is one of Node's") ELSE
  LET header == ErrorBuiltin(q.s, Undefined, "toString", error, <<>>, Undefined) IN IF IsAbrupt(header) THEN header ELSE
  Ok(header.s, Str(Val(header).value \\o JoinFrames(WalkFrames(header.s, t, t.callers, <<>>, [skipping |-> TRUE, count |-> 0, lines |-> <<>>]))))`,
  `ProxyOnChain(s, o) == o # Null /\\ (O(s, o).class = "proxy" \\/ ProxyOnChain(s, O(s, o).proto))`,
  `JoinFrames(lines) == IF lines = <<>> THEN <<>> ELSE <<10>> \\o N("    at ") \\o Head(lines) \\o JoinFrames(Tail(lines))`,
  // The built-ins that run a function with no frame of their own on V8's stack, and those whose
  // frame V8 shows, as Node 26 does.
  `HiddenBuiltins == {<<"Function", "call">>, <<"Function", "apply">>, <<"Reflect", "apply">>, <<"Reflect", "construct">>}`,
  `ShownBuiltins ==
  {<<"Error", "constructor">>, <<"AggregateError", "constructor">>} \\cup {<<"NativeError", e>> : e \\in Range(NativeErrors)} \\cup
  {<<"Array", m>> : m \\in {"map", "forEach", "filter", "some", "every", "find", "findIndex", "findLast", "findLastIndex",
                            "flatMap", "reduce", "reduceRight", "sort", "toSorted", "join", "from"}} \\cup
  {<<"String", "replace">>, <<"String", "replaceAll">>, <<"String", "constructor">>, <<"Number", "constructor">>,
   <<"JSON", "parse">>, <<"JSON", "stringify">>, <<"Promise", "constructor">>, <<"Promise", "resolve">>,
   <<"Map", "forEach">>, <<"Set", "forEach">>, <<"Map", "groupBy">>,
   <<"Object", "assign">>, <<"Object", "keys">>, <<"Object", "fromEntries">>, <<"Object", "groupBy">>}`,
  // The methods of a generator that run its body, whose frame V8 shows above theirs.
  `GeneratorResumes == {<<"Generator", "next">>, <<"Generator", "return">>, <<"Generator", "throw">>}`,
  // The frames of a stack, from the frame of the call e, whose position is pos, down
  // (CallSiteBuilder): a frame of a built-in that V8 hides counts for nothing, as a class's default
  // constructor that a derived class's super calls, which V8 skips; and one that tla-ts can't tell
  // stops, but where V8 skips it anyway.
  `WalkFrames(s, t, e, pos, r) ==
  IF r.count >= t.limit THEN r.lines
  ELSE IF e = Null THEN BottomFrames(s, t, pos, r)
  ELSE LET o == O(s, e.f)
           frame == [kind |-> o.class, f |-> e.f, this |-> e.this, isNew |-> e.isNew, pos |-> pos]
       IN CASE o.class = "function" -> WalkFrames(s, t, e.next, e.site, VisitFrame(s, t, frame, r))
            [] o.class = "builtin" /\\ o.slots.id \\in HiddenBuiltins -> WalkFrames(s, t, e.next, e.site, r)
            [] o.class = "builtin" /\\ o.slots.id \\in GeneratorResumes ->
                 WalkFrames(s, t, e.next, e.site, VisitFrame(s, t, frame, VisitFrame(s, t, GeneratorFrame(s, e.this, pos), r)))
            [] o.class = "builtin" /\\ o.slots.id \\in ShownBuiltins -> WalkFrames(s, t, e.next, e.site, VisitFrame(s, t, frame, r))
            [] o.class = "builtin" /\\ o.slots.id = <<"Class", "default">> ->
                 IF SameValue(e.this, e.f) THEN WalkFrames(s, t, e.next, e.site, VisitFrame(s, t, [frame EXCEPT !.kind = "default"], r))
                 ELSE WalkFrames(s, t, e.next, e.site, r)
            [] r.skipping /\\ t.target # Empty /\\ ~SameValue(e.f, t.target) -> WalkFrames(s, t, e.next, e.site, r)
            [] OTHER -> Assert(FALSE, "tla-ts can't tell whether Node shows this frame of a stack")`,
  // The frame of a generator's body, which its function has, with its this value.
  `GeneratorFrame(s, gen, pos) ==
  LET ctx == O(s, gen).slots.ctx IN
  [kind |-> "function", f |-> ctx.fn, this |-> E(s, GetThisEnvironment(s, ctx.lex)).this, isNew |-> FALSE, pos |-> pos]`,
  // A frame that V8 counts, past those it skips until new.target's function, or the first
  // (CallSiteBuilder::ShouldIncludeFrame).
  `VisitFrame(s, t, frame, r) ==
  IF r.count >= t.limit THEN r
  ELSE IF r.skipping THEN
    IF t.target = Empty \\/ (frame.kind \\in {"function", "builtin", "default"} /\\ SameValue(frame.f, t.target)) THEN [r EXCEPT !.skipping = FALSE] ELSE r
  ELSE [r EXCEPT !.count = @ + 1, !.lines = Append(@, FrameText(s, frame))]`,
  // The frames below a program's: the top level of an entry module and the host's frames that run
  // it, nothing below a promise job's function but async frames, which stop, and in a job, code at
  // the top level, which a resumed async body or module is, stops.
  `BottomFrames(s, t, pos, r) ==
  CASE t.task.kind = "main" ->
         LET top == VisitFrame(s, t, [kind |-> "top", pos |-> pos], r) IN
         IF top.count >= t.limit THEN top.lines
         ELSE IF HostEntryFrames(1) = Empty THEN Assert(FALSE, "tla-ts can't tell the frames that Node runs this program from")
         ELSE VisitHostFrames(s, t, HostEntryFrames(1), top).lines
    [] t.task.kind = "reaction" /\\ pos = <<>> ->
         IF t.task.promise # Empty /\\ O(s, t.task.promise).slots.state = "pending" /\\
            Len(O(s, t.task.promise).slots.fulfillReactions) = 1 /\\
            O(s, t.task.promise).slots.fulfillReactions[1].handler # Empty /\\
            O(s, O(s, t.task.promise).slots.fulfillReactions[1].handler).class = "builtin"
         THEN Assert(FALSE, "tla-ts can't write the async frames of a stack as Node does")
         ELSE r.lines
    [] OTHER -> Assert(FALSE, "tla-ts can't tell the frames below this job's as Node writes them")`,
  `VisitHostFrames(s, t, lines, r) ==
  IF lines = <<>> THEN r ELSE VisitHostFrames(s, t, Tail(lines), VisitFrame(s, t, [kind |-> "host", text |-> Head(lines)], r))`,
  // A frame's text (SerializeJSStackFrame), where a built-in's location is <anonymous>, and a
  // class's default constructor's is the class's.
  `FrameText(s, frame) ==
  CASE frame.kind = "host" -> frame.text
    [] frame.kind = "top" -> Location(frame.pos)
    [] frame.kind = "builtin" -> CallText(s, frame, N("<anonymous>"))
    [] frame.kind = "default" -> CallText(s, frame, Location(O(s, frame.f).slots.data))
    [] OTHER -> CallText(s, frame, Location(frame.pos))`,
  // Where a frame is, as Node gives its file and V8 its line and column.
  `Location(pos) ==
  IF pos = <<>> THEN Assert(FALSE, "tla-ts can't tell the position V8 gives this frame") ELSE
  IF HostFileLocation(pos[1]) = Empty THEN Assert(FALSE, "tla-ts can't tell the location Node gives this file") ELSE
  HostFileLocation(pos[1]) \\o <<58>> \\o NumToString(NumFromInt(pos[2])) \\o <<58>> \\o NumToString(NumFromInt(pos[3]))`,
  `CallText(s, frame, location) ==
  LET name == FunctionName(s, frame.f) IN
  IF ~frame.isNew /\\ ~IsToplevel(s, frame.this) THEN MethodCallText(s, frame, name) \\o N(" (") \\o location \\o N(")")
  ELSE IF frame.isNew THEN N("new ") \\o (IF name = <<>> THEN N("<anonymous>") ELSE name) \\o N(" (") \\o location \\o N(")")
  ELSE IF name # <<>> THEN name \\o N(" (") \\o location \\o N(")")
  ELSE location`,
  // A frame's receiver that makes it no method call: none, or the global object.
  `IsToplevel(s, v) == IsNullish(v) \\/ SameValue(v, Intrinsic(s, "GlobalObject"))`,
  // AppendMethodCall.
  `MethodCallText(s, frame, name) ==
  IF name # <<>> THEN
    (IF IsIdentifierUnits(name) /\\ TypeName(s, frame.this) # <<>> /\\ TypeName(s, frame.this) # name
     THEN TypeName(s, frame.this) \\o <<46>> ELSE <<>>) \\o name \\o
    (IF MethodName(s, frame.f, frame.this) # <<>> /\\ ~EndsWithMethodName(name, MethodName(s, frame.f, frame.this))
     THEN N(" [as ") \\o MethodName(s, frame.f, frame.this) \\o N("]") ELSE <<>>)
  ELSE (IF TypeName(s, frame.this) # <<>> THEN TypeName(s, frame.this) \\o <<46>> ELSE <<>>) \\o
       (IF MethodName(s, frame.f, frame.this) # <<>> THEN MethodName(s, frame.f, frame.this) ELSE N("<anonymous>"))`,
  // Whether a name is subject or ends in it after a . or a space.
  `EndsWithMethodName(subject, pattern) ==
  \\/ subject = pattern
  \\/ /\\ Len(subject) > Len(pattern)
     /\\ SubSeq(subject, Len(subject) - Len(pattern) + 1, Len(subject)) = pattern
     /\\ subject[Len(subject) - Len(pattern)] \\in {32, 46}`,
  // String::IsIdentifier, by code unit.
  `IsIdentifierUnits(u) ==
  u # <<>> /\\ IdentifierUnit(u[1], TRUE) /\\ \\A i \\in 2..Len(u) : IdentifierUnit(u[i], FALSE)`,
  `IdentifierUnit(c, isStart) ==
  \\/ (c >= 65 /\\ c <= 90) \\/ (c >= 97 /\\ c <= 122) \\/ c = 36 \\/ c = 95
  \\/ (~isStart /\\ c >= 48 /\\ c <= 57)
  \\/ (c >= 128 /\\ RxIsIdentifierChar(c, isStart))`,
  // The name of a function that a frame shows (JSFunction::GetDebugName): its name property where
  // it's a String that V8 holds as one, which a function a computed key names does, and otherwise
  // the name its literal has or V8 infers; a class's initializers have names of their own.
  `FunctionName(s, f) ==
  LET o == O(s, f)
      d == OrdinaryGetOwnProperty(o, SV("name"))
      isString == d # Absent /\\ IsDataDescriptor(d) /\\ IsString(d.value)
  IN CASE o.class = "builtin" -> IF isString THEN d.value.value ELSE o.slots.initialName
       [] o.class = "function" /\\ "naming" \\in DOMAIN o.slots.body ->
            IF o.slots.body.naming.naming \\in {"instanceInit", "staticInit"} THEN o.slots.body.naming.sfi
            ELSE IF isString /\\ (d.value.value # <<>> \\/ o.slots.body.naming.naming # "anonymous") THEN d.value.value
            ELSE LiteralName(o.slots.body.naming)
       [] OTHER -> Assert(FALSE, "tla-ts can't tell the name V8 gives this function")`,
  // The name of a function's literal, or the name V8 infers for it (SharedFunctionInfo::DebugName).
  `LiteralName(naming) ==
  IF naming.sfi # <<>> THEN naming.sfi
  ELSE IF naming.inferred = Empty THEN Assert(FALSE, "tla-ts can't tell the name V8 infers for this function")
  ELSE naming.inferred`,
  `SfiNameOf(s, f) ==
  CASE O(s, f).class = "builtin" -> O(s, f).slots.initialName
    [] O(s, f).class = "function" /\\ "naming" \\in DOMAIN O(s, f).slots.body -> LiteralName(O(s, f).slots.body.naming)
    [] OTHER -> Assert(FALSE, "tla-ts can't tell the name V8 gives this function")`,
  // The type of a frame's receiver (CallSiteInfo::GetTypeName).
  `TypeName(s, v) ==
  CASE IsNumber(v) -> N("Number")
    [] IsString(v) -> N("String")
    [] IsBoolean(v) -> N("Boolean")
    [] IsSymbol(v) -> N("Symbol")
    [] IsBigInt(v) -> N("BigInt")
    [] O(s, v).class = "proxy" -> N("Proxy")
    [] O(s, v).class \\in {"function", "builtin"} /\\ FunctionName(s, v) # <<>> -> FunctionName(s, v)
    [] OTHER -> ConstructorName(s, v)`,
  // The name of the constructor of each kind of object that a built-in constructor makes.
  `NaturalNames ==
  [map |-> N("Map"), set |-> N("Set"), weakMap |-> N("WeakMap"), weakSet |-> N("WeakSet"), weakRef |-> N("WeakRef"),
   promise |-> N("Promise"), date |-> N("Date"), regexp |-> N("RegExp"), boolean |-> N("Boolean"),
   number |-> N("Number"), dataView |-> N("DataView"), array |-> N("Array"), function |-> N("Function"),
   builtin |-> N("Function"), bound |-> N("Function")]`,
  // JSReceiver::GetConstructorName: the name of the constructor of V8's map of the object where V8
  // made it for that constructor and it's no prototype, and otherwise that of its
  ``,
  // toStringTag or of the constructor of what it inherits from. tla-ts knows the first only where
  // the object records its maker, and stops where the two differ.
  `ConstructorName(s, o) ==
  LET a == ChainConstructorName(s, o, o)
      b == MapConstructorName(s, o)
  IN IF b = <<>> \\/ b = a THEN a ELSE Assert(FALSE, "tla-ts can't tell the constructor name V8 gives this object")`,
  `MapConstructorName(s, o) ==
  LET obj == O(s, o) IN
  CASE "madeBy" \\in DOMAIN obj.slots -> IF SfiNameOf(s, obj.slots.madeBy) = N("Object") THEN <<>> ELSE SfiNameOf(s, obj.slots.madeBy)
    [] obj.class \\in {"ordinary", "error"} -> <<>>
    [] obj.class = "generator" -> IF SfiNameOf(s, obj.slots.ctx.fn) = N("Object") THEN <<>> ELSE SfiNameOf(s, obj.slots.ctx.fn)
    [] obj.class \\in DOMAIN NaturalNames -> NaturalNames[obj.class]
    [] OTHER -> Assert(FALSE, "tla-ts can't tell the constructor name V8 gives this object")`,
  `ChainConstructorName(s, receiver, cur) ==
  IF cur = Null \\/ O(s, cur).class = "proxy" THEN ClassName(s, receiver) ELSE
  LET tag == OwnDataValue(O(s, cur), SymToStringTag)
      c == IF SameValue(cur, receiver) THEN Absent ELSE OwnDataValue(O(s, cur), SV("constructor"))
  IN IF tag # Absent /\\ IsString(tag) THEN tag.value
     ELSE IF c # Absent /\\ IsObject(c) /\\ O(s, c).class \\in {"function", "builtin"} /\\ SfiNameOf(s, c) \\notin {<<>>, N("Object")}
     THEN SfiNameOf(s, c)
     ELSE ChainConstructorName(s, receiver, O(s, cur).proto)`,
  `OwnDataValue(obj, k) ==
  LET d == OrdinaryGetOwnProperty(obj, k) IN IF d = Absent \\/ ~IsDataDescriptor(d) THEN Absent ELSE d.value`,
  // JSReceiver::class_name.
  `ClassName(s, o) ==
  CASE O(s, o).class = "ordinary" -> N("Object")
    [] O(s, o).class = "error" -> N("Error")
    [] O(s, o).class \\in DOMAIN NaturalNames -> NaturalNames[O(s, o).class]
    [] OTHER -> Assert(FALSE, "tla-ts can't tell the class name V8 gives this object")`,
  // The key a frame's function is called by on its receiver (CallSiteInfo::GetMethodName): the name
  // of its literal, without get or set, or after the last . of the name V8 infers, where the
  // receiver or what it inherits holds the function there, and otherwise the one enumerable key
  // that holds it. Where tla-ts can't tell the name V8 infers, the key that holds the function,
  // where there is no other, is the one.
  `MethodName(s, f, v) ==
  IF O(s, f).class = "function" /\\ "naming" \\in DOMAIN O(s, f).slots.body /\\
     O(s, f).slots.body.naming.naming \\in {"instanceInit", "staticInit"} THEN <<>> ELSE
  LET start == ReceiverStart(s, v)
      literal == IF O(s, f).class = "builtin" THEN O(s, f).slots.initialName
                 ELSE IF "naming" \\in DOMAIN O(s, f).slots.body THEN O(s, f).slots.body.naming.sfi
                 ELSE Assert(FALSE, "tla-ts can't tell the name V8 gives this function")
      isPrefixed == Len(literal) > 4 /\\ SubSeq(literal, 1, 4) \\in {N("get "), N("set ")}
  IN IF isPrefixed THEN LookupMethodName(s, start, start, f, SubSeq(literal, 5, Len(literal)))
     ELSE IF literal # <<>> THEN LookupMethodName(s, start, start, f, literal)
     ELSE IF O(s, f).class = "builtin" THEN InferMethodName(s, start, f, [n |-> 0, key |-> <<>>])
     ELSE IF O(s, f).slots.body.naming.inferred # Empty THEN LookupMethodName(s, start, start, f, AfterLastDot(O(s, f).slots.body.naming.inferred))
     ELSE LET inferred == InferMethodName(s, start, f, [n |-> 0, key |-> <<>>]) IN
          IF KeysHolding(s, start, f) \\subseteq {inferred} THEN inferred
          ELSE Assert(FALSE, "tla-ts can't tell the name V8 infers for this function")`,
  // The object a lookup on a receiver starts at: the receiver, or a primitive's prototype, which
  // holds what its wrapper would.
  `ReceiverStart(s, v) ==
  CASE IsNumber(v) -> Intrinsic(s, "NumberPrototype")
    [] IsString(v) -> Intrinsic(s, "StringPrototype")
    [] IsBoolean(v) -> Intrinsic(s, "BooleanPrototype")
    [] IsSymbol(v) -> Intrinsic(s, "SymbolPrototype")
    [] IsBigInt(v) -> Intrinsic(s, "BigIntPrototype")
    [] OTHER -> v`,
  `AfterLastDot(u) == IF \\E i \\in DOMAIN u : u[i] = 46 THEN SubSeq(u, (CHOOSE i \\in DOMAIN u : u[i] = 46 /\\ \\A j \\in DOMAIN u : u[j] = 46 => j <= i) + 1, Len(u)) ELSE u`,
  // Whether a descriptor holds f.
  `HoldsFunction(d, f) == IF IsDataDescriptor(d) THEN SameValue(d.value, f) ELSE d.get = f \\/ d.set = f`,
  // The name where the first object of the chain from start that has it holds f there, and
  // otherwise InferMethodName.
  `LookupMethodName(s, start, o, f, name) ==
  IF name = <<>> \\/ o = Null \\/ O(s, o).class = "proxy" THEN InferMethodName(s, start, f, [n |-> 0, key |-> <<>>])
  ELSE LET d == OrdinaryGetOwnProperty(O(s, o), Str(name)) IN
       IF d = Absent THEN LookupMethodName(s, start, O(s, o).proto, f, name)
       ELSE IF HoldsFunction(d, f) THEN name ELSE InferMethodName(s, start, f, [n |-> 0, key |-> <<>>])`,
  // InferMethodName: the one enumerable String key, but for an index, of the chain from o that
  // holds f, or none where there are more.
  `InferMethodName(s, o, f, acc) ==
  IF o = Null \\/ O(s, o).class = "proxy" THEN (IF acc.n = 1 THEN acc.key ELSE <<>>)
  ELSE InferMethodName(s, O(s, o).proto, f, InferKeys(O(s, o), SelectSeq(O(s, o).keys, IsString), f, acc))`,
  `InferKeys(obj, keys, f, acc) ==
  IF keys = <<>> THEN acc
  ELSE LET d == OrdinaryGetOwnProperty(obj, Head(keys))
           matches == d # Absent /\\ d.enumerable = True /\\ HoldsFunction(d, f)
       IN InferKeys(obj, Tail(keys), f,
                    IF ~matches THEN acc
                    ELSE IF acc.n = 0 THEN [n |-> 1, key |-> Head(keys).value]
                    ELSE IF acc.key = Head(keys).value THEN acc ELSE [n |-> 2, key |-> <<>>])`,
  // Every key of the chain from o, past a proxy, that holds f.
  `KeysHolding(s, o, f) ==
  IF o = Null \\/ O(s, o).class = "proxy" THEN {}
  ELSE {k.value : k \\in {k \\in Range(OwnKeysOf(O(s, o))) : IsString(k) /\\ HoldsFunction(OrdinaryGetOwnProperty(O(s, o), k), f)}} \\cup
       KeysHolding(s, O(s, o).proto, f)`,
];

export const RUNTIME_DEFINITIONS: GeneratedDefinition[] = [
  ...DEFINITIONS,
  ...STACK_DEFINITIONS,
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
// differently, a compiled spec stops: at a calendar other than ISO 8601, at a named time zone that
// the host's recorded table leaves out, and at a date string in none of the formats that ECMA-262
// defines, which a host may still read. The method names CallBuiltin stops at are the
// locale-sensitive built-ins'.
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
  // An error's stack: V8's accessor, whose getter and setter are nameless functions shared by every
  // error. The text it reads is the host's, which ESCore can't write, so reading it stops, but for a
  // value a program set.
  {
    name: "AddRealmProperty",
    from: `    [] p.t = "g" ->`,
    to: `    [] p.t = "g" /\\ p.o = "ErrorPrototype" /\\ p.k = SV("stack") ->
         LET g == Alloc(s, BuiltinObject(Intrinsic(s, "FunctionPrototype"), p.get, 0, <<>>, FALSE, Empty, s.realmId))
             st == Alloc(g.s, BuiltinObject(Intrinsic(g.s, "FunctionPrototype"), p.set, 1, <<>>, FALSE, Empty, g.s.realmId))
         IN SetO(st.s, owner, [O(st.s, owner) EXCEPT !.slots = [stackGet |-> g.v, stackSet |-> st.v]])
    [] p.t = "g" ->`,
  },
  {
    name: "ErrorBuiltin",
    from: `    [] m = "getStack" ->
         IF ~IsObject(this) THEN ThrowTypeError(s) ELSE Ok(s, IF O(s, this).class = "error" THEN EmptyStr ELSE Undefined)
    [] m = "setStack" ->
         IF ~IsObject(this) \\/ ~IsString(Arg(args, 1)) THEN ThrowTypeError(s)
         ELSE LET r == SetterThatIgnoresPrototypeProperties(s, this, Intrinsic(s, "ErrorPrototype"), SV("stack"), Arg(args, 1)) IN
              IF IsAbrupt(r) THEN r ELSE Ok(r.s, Undefined)`,
    to: `    [] m = "getStack" ->
         IF ~IsObject(this) \\/ O(s, this).class # "error" THEN Ok(s, Undefined)
         ELSE IF "stack" \\in DOMAIN O(s, this).slots THEN Ok(s, O(s, this).slots.stack)
         ELSE IF "trace" \\notin DOMAIN O(s, this).slots THEN Assert(FALSE, "tla-ts can't read an error's stack as Node writes it")
         ELSE IF O(s, this).slots.trace.limit < 0 THEN Ok(s, Undefined)
         ELSE LET text == FormatStack(s, this, O(s, this).slots.trace) IN
              IF IsAbrupt(text) THEN text ELSE Ok(SetO(text.s, this, [O(text.s, this) EXCEPT !.slots = [stack |-> Val(text)] @@ @]), Val(text))
    [] m = "setStack" ->
         IF ~IsObject(this) \\/ O(s, this).class # "error" THEN Ok(s, Undefined)
         ELSE Ok(SetO(s, this, [O(s, this) EXCEPT !.slots = [stack |-> Arg(args, 1)] @@ @]), Undefined)`,
  },
  {
    name: "ErrorConstructor",
    from: `LET msg == IF message = Undefined THEN Ok(o.s, Empty) ELSE ToStr(o.s, message) IN
  IF IsAbrupt(msg) THEN msg ELSE
  LET m == IF Val(msg) = Empty THEN Ok(msg.s, Empty) ELSE CreateMethodProperty(msg.s, Val(o), SV("message"), Val(msg)) IN
  LET c == InstallErrorCause(m.s, Val(o), options) IN
  IF IsAbrupt(c) THEN c ELSE Ok(c.s, Val(o))`,
    to: `LET withStack == InstallStack(o.s, Val(o))
      msg == IF message = Undefined THEN Ok(withStack, Empty) ELSE ToStr(withStack, message) IN
  IF IsAbrupt(msg) THEN msg ELSE
  LET m == IF Val(msg) = Empty THEN Ok(msg.s, Empty) ELSE CreateMethodProperty(msg.s, Val(o), SV("message"), Val(msg)) IN
  LET c == InstallErrorCause(m.s, Val(o), options) IN
  IF IsAbrupt(c) THEN c ELSE Ok(CaptureStack(c.s, Val(o), newTarget), Val(o))`,
  },
  // Each call's frame records its this value and whether new made it.
  {
    name: "CallObject",
    from: `  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushCaller(s, f, args), o.slots.realm), f, o.slots.id, this, args, Undefined))
    [] o.class = "bound" -> Call(s, o.slots.target, o.slots.this, o.slots.args \\o args)
    [] o.class = "proxy" -> ProxyCall(s, f, this, args)
    [] o.class = "wrapped" -> InCallerRealm(s, OrdinaryWrappedFunctionCall(EnterRealm(s, o.slots.realm), f, this, args))
    [] OTHER -> InCallerRealm(s, OrdinaryCall(EnterRealm(PushCaller(s, f, args), o.slots.realm), f, this, args))`,
    to: `  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushFrame(s, f, this, args, FALSE, <<>>), o.slots.realm), f, o.slots.id, this, args, Undefined))
    [] o.class = "bound" -> Call(s, o.slots.target, o.slots.this, o.slots.args \\o args)
    [] o.class = "proxy" -> ProxyCall(s, f, this, args)
    [] o.class = "wrapped" -> InCallerRealm(s, OrdinaryWrappedFunctionCall(EnterRealm(s, o.slots.realm), f, this, args))
    [] OTHER -> InCallerRealm(s, OrdinaryCall(EnterRealm(PushFrame(s, f, this, args, FALSE, <<>>), o.slots.realm), f, this, args))`,
  },
  {
    name: "ConstructObject",
    from: `  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushCaller(s, f, args), o.slots.realm), f, o.slots.id, Undefined, args, newTarget))
    [] o.class = "bound" ->
         Construct(s, o.slots.target, o.slots.args \\o args,
                   IF SameValue(f, newTarget) THEN o.slots.target ELSE newTarget)
    [] o.class = "proxy" -> ProxyConstruct(s, f, args, newTarget)
    [] OTHER -> InCallerRealm(s, OrdinaryConstruct(PushCaller(s, f, args), f, args, newTarget))`,
    to: `  CASE o.class = "builtin" -> InCallerRealm(s, CallBuiltin(EnterRealm(PushFrame(s, f, newTarget, args, TRUE, <<>>), o.slots.realm), f, o.slots.id, Undefined, args, newTarget))
    [] o.class = "bound" ->
         Construct(s, o.slots.target, o.slots.args \\o args,
                   IF SameValue(f, newTarget) THEN o.slots.target ELSE newTarget)
    [] o.class = "proxy" -> ProxyConstruct(s, f, args, newTarget)
    [] OTHER -> InCallerRealm(s, OrdinaryConstruct(PushFrame(s, f, newTarget, args, TRUE, <<>>), f, args, newTarget))`,
  },
  // An object that a base constructor makes for itself, whose map V8 makes for that constructor,
  // which names the object's type in a stack trace.
  {
    name: "DefaultConstructorCall",
    from: `ELSE OrdinaryCreateFromConstructor(s, newTarget, "ObjectPrototype", "ordinary", [none |-> TRUE])`,
    to: `ELSE OrdinaryCreateFromConstructor(s, newTarget, "ObjectPrototype", "ordinary", IF SameValue(f, newTarget) THEN [none |-> TRUE, madeBy |-> f] ELSE [none |-> TRUE])`,
  },
  {
    name: "OrdinaryConstruct",
    from: `OrdinaryCreateFromConstructor(s, newTarget, "ObjectPrototype", "ordinary", [none |-> TRUE])`,
    to: `OrdinaryCreateFromConstructor(s, newTarget, "ObjectPrototype", "ordinary", IF SameValue(f, newTarget) THEN [none |-> TRUE, madeBy |-> f] ELSE [none |-> TRUE])`,
  },
  // A job's task, below whose function V8 has no frames, but async ones of the promise a reaction
  // job settles.
  {
    name: "RunJob",
    from: `        r == Call(fns.s, job.then, job.thenable, <<fns.resolve, fns.reject>>)
    IN IF IsAbrupt(r) THEN Call(r.s, fns.reject, Undefined, <<r.c.value>>) ELSE r
  ELSE
    LET reaction == job.reaction
        result == CASE reaction.handler # Empty -> Call(s, reaction.handler, Undefined, <<job.argument>>)`,
    to: `        r == Call([fns.s EXCEPT !.task = [kind |-> "thenable"]], job.then, job.thenable, <<fns.resolve, fns.reject>>)
    IN IF IsAbrupt(r) THEN Call(r.s, fns.reject, Undefined, <<r.c.value>>) ELSE r
  ELSE
    LET reaction == job.reaction
        task == [kind |-> "reaction", promise |-> IF reaction.capability = Empty THEN Empty ELSE reaction.capability.promise]
        result == CASE reaction.handler # Empty -> Call([s EXCEPT !.task = task], reaction.handler, Undefined, <<job.argument>>)`,
  },
  // An error that ESCore throws itself, whose message Node writes as host text. It holds the mark
  // hostMessage, at which reading its message or listing its own keys stops.
  {
    name: "ThrowError",
    from: `LET a == Alloc(s, MakeObject(Obj(s.realm[kind \\o "Prototype"]), "error", [data |-> Empty])) IN
  ThrowValue(a.s, a.v)`,
    to: `LET a == Alloc(s, MakeObject(Obj(s.realm[kind \\o "Prototype"]), "error", [data |-> Empty, hostMessage |-> TRUE])) IN
  ThrowValue(InstallStack(a.s, a.v), a.v)`,
  },
  {
    name: "GetOwnProperty",
    from: `    [] OTHER -> Ok(s, OrdinaryGetOwnProperty(o, k))`,
    to: `    [] o.class = "error" /\\ k = SV("message") /\\ "hostMessage" \\in DOMAIN o.slots ->
         Assert(FALSE, "tla-ts can't read the message that Node writes for an error it throws")
    [] OTHER -> Ok(s, OrdinaryGetOwnProperty(o, k))`,
  },
  {
    name: "OwnPropertyKeys",
    from: `    [] OTHER -> Ok(s, OwnKeysOf(o))`,
    to: `    [] o.class = "error" /\\ "hostMessage" \\in DOMAIN o.slots ->
         Assert(FALSE, "tla-ts can't read the message that Node writes for an error it throws")
    [] OTHER -> Ok(s, OwnKeysOf(o))`,
  },
  {
    name: "CombinatorElementDone",
    from: `d == DefinePropertyOrThrow(error.s, error.v, SV("errors"), DataDesc(Val(values), TRUE, FALSE, TRUE))`,
    to: `d == DefinePropertyOrThrow(InstallStack(error.s, error.v), error.v, SV("errors"), DataDesc(Val(values), TRUE, FALSE, TRUE))`,
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
  // import.meta of a module, with the properties that Node gives it (HostGetImportMetaProperties).
  {
    name: "EvaluateImportMeta",
    from: "LET meta == OrdinaryObjectCreate(s, Null) IN",
    to: "LET meta == ImportMeta(s, m) IN",
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
    [] m = "textEncoderGet" ->
         CASE Arg(args, 2) = SV("encode") -> Ok(s, data)
           [] Arg(args, 2) = SV("encoding") -> Ok(s, SV("utf-8"))
           [] OTHER -> HostStop(N("TextEncoder"))
    [] m = "textEncode" ->
         IF ~IsObject(this) \\/ O(s, this).class # "proxy" \\/ O(s, O(s, this).slots.target).slots # [hostName |-> N("TextEncoder")]
         THEN HostStop(N("TextEncoder"))
         ELSE TextEncode(s, IF Arg(args, 1) = Undefined THEN EmptyStr ELSE Arg(args, 1))
    [] m = "processGet" ->
         IF Arg(args, 2) \\notin {SV("getBuiltinModule"), SV("hrtime")} THEN HostStop(N("process")) ELSE Get(s, Arg(args, 1), Arg(args, 2))
    [] m = "getBuiltinModule" ->
         IF Arg(args, 1) \\notin {SV("node:async_hooks"), SV("async_hooks")} THEN HostStop(N("getBuiltinModule")) ELSE Ok(s, data)
    [] m = "asyncHooksGet" ->
         IF Arg(args, 2) # SV("AsyncResource") THEN HostStop(N("async_hooks")) ELSE Get(s, Arg(args, 1), Arg(args, 2))
    [] m = "asyncResource" ->
         IF nt # f \\/ ~IsString(Arg(args, 1)) \\/ (Arg(args, 2) # Undefined /\\ ~IsObject(Arg(args, 2))) THEN HostStop(N("AsyncResource")) ELSE
         LET trigger == IF Arg(args, 2) = Undefined THEN Ok(s, Undefined) ELSE Get(s, Arg(args, 2), SV("triggerAsyncId")) IN
         IF IsAbrupt(trigger) THEN trigger ELSE IF Val(trigger) # Undefined THEN HostStop(N("AsyncResource")) ELSE
         LET manual == IF Arg(args, 2) = Undefined THEN Ok(trigger.s, Undefined) ELSE Get(trigger.s, Arg(args, 2), SV("requireManualDestroy")) IN
         IF IsAbrupt(manual) THEN manual ELSE
         LET instance == Alloc(manual.s, MakeObject(Null, "ordinary", [asyncResource |-> TRUE])) IN
         StoppingProxy(instance.s, instance.v, N("AsyncResource"), <<[trap |-> SV("get"), method |-> "asyncResourceGet", data |-> data]>>)
    [] m = "asyncResourceGet" ->
         CASE Arg(args, 2) = SV("runInAsyncScope") -> Ok(s, data.run)
           [] Arg(args, 2) = SV("emitDestroy") -> Ok(s, data.destroy)
           [] OTHER -> HostStop(N("AsyncResource"))
    [] m \\in {"asyncRun", "asyncDestroy"} ->
         IF ~IsObject(this) \\/ O(s, this).class # "proxy" \\/ "asyncResource" \\notin DOMAIN O(s, O(s, this).slots.target).slots
         THEN HostStop(N("AsyncResource"))
         ELSE IF m = "asyncDestroy" THEN Ok(s, this)
         ELSE Call(s, Arg(args, 1), Arg(args, 2), IF Len(args) > 2 THEN SubSeq(args, 3, Len(args)) ELSE <<>>)
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
    [] m \\in {"hostStop", "hostQuietConstructor"} -> HostStop(data)
    [] m = "hostConstruct" ->
         LET target == Arg(args, 1)
             list == CreateListFromArrayLike(s, Arg(args, 2), "all")
         IN IF IsAbrupt(list) THEN list
            ELSE IF O(s, target).slots.id[2] # "hostQuietConstructor" \\/ O(s, Arg(args, 3)).class # "proxy" \\/
                    O(s, Arg(args, 3)).slots.target # target
            THEN HostStop(O(s, target).slots.data) ELSE
            LET quiet == QuietConstruct(list.s, O(s, target).slots.data, Val(list)) IN
            IF IsAbrupt(quiet) THEN quiet ELSE
            LET name == O(s, target).slots.data
                instance == Alloc(quiet.s, MakeObject(Null, "ordinary", [hostName |-> name]))
                encode == CreateBuiltinFunction(instance.s, <<"Module", "textEncode">>, 0, N("encode"), Empty)
            IN IF name = N("TextEncoder")
               THEN StoppingProxy(encode.s, instance.v, name, <<[trap |-> SV("get"), method |-> "textEncoderGet", data |-> Val(encode)]>>)
               ELSE ProxyCreate(instance.s, instance.v, s.hostHandler)
    [] m = "hostTrap" ->
         HostStop(IF "hostName" \\in DOMAIN O(s, Arg(args, 1)).slots THEN O(s, Arg(args, 1)).slots.hostName ELSE O(s, Arg(args, 1)).slots.data)
    [] m = "hrtimeGet" -> IF Arg(args, 2) # SV("bigint") THEN HostStop(N("process.hrtime")) ELSE Ok(s, data)`,
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
  // Node has no Error.prototype.stack: each error has its own stack accessor, whose functions the
  // realm makes in its place (InstallStack).
  const missing = getMissingProperties(library)
    .filter((property) => property.owner !== "ErrorPrototype" || property.key !== "stack")
    .map((property) => `<<"${property.owner}", Str(${getUnitsOf(property.key)})>>`);
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

// The time zone names a program writes in strings, as test262's recorder finds them: each string,
// and the annotations in brackets of a date-time string.
const getZoneNames = (text: string) =>
  [...text.matchAll(/["'`]([^"'`\n]{1,60})["'`]/g)].flatMap((match) => [
    match[1],
    ...[...match[1].matchAll(/\[!?([^\]=]+)\]/g)].map((annotation) => annotation[1]),
  ]);

// Whether the host has no time zone of a name, which only a host with Temporal can tell.
const isRejectedZone = (name: string) => {
  const temporal: unknown = Reflect.get(HOST_GLOBAL, "Temporal");
  if (typeof temporal !== "object" || temporal === null) return false;
  const zoned: unknown = Reflect.get(temporal, "ZonedDateTime");
  if (typeof zoned !== "function") return false;
  try {
    Reflect.construct(zoned, [0n, name]);
    return false;
  } catch {
    return true;
  }
};

// The program's HostTimeZone: the recorded table's entries of the time zones its strings name, and
// for the other names in them that the host rejects, "rejected". Any other name may be one that the
// host has and the table leaves out.
export const getHostTimeZone = (text: string) => {
  const keys = [...new Set(getZoneNames(text).map((name) => name.toLowerCase()))].sort();
  const entries = keys.filter((key) => Object.hasOwn(TIME_ZONES, key));
  const rejected = keys.filter((key) => !Object.hasOwn(TIME_ZONES, key) && isRejectedZone(key));
  const getEntry = (key: string) => {
    const table = TIME_ZONES[key];
    const days = table.times.map((time) => Math.floor(time / 86400));
    return `[found |-> "zone", id |-> ${getUnitsOf(table.id)}, primary |-> ${getUnitsOf(table.primary)}, offsets |-> <<${table.offsets.join(", ")}>>, days |-> <<${days.join(", ")}>>, seconds |-> <<${table.times.map((time, index) => time - days[index] * 86400).join(", ")}>>, isFinal |-> ${table.isFinal ? "TRUE" : "FALSE"}, rule |-> <<${table.rule.join(", ")}>>]`;
  };
  const arms = [
    ...entries.map((key) => `key = ${getUnitsOf(key)} -> ${getEntry(key)}`),
    ...(rejected.length === 0
      ? []
      : [`key \\in {${rejected.map(getUnitsOf).join(", ")}} -> [found |-> "rejected"]`]),
  ];
  return arms.length === 0
    ? `HostTimeZone(key) == [found |-> "unknown"]`
    : `HostTimeZone(key) ==\n  CASE ${arms.join("\n    [] ")}\n    [] OTHER -> [found |-> "unknown"]`;
};

export const getUnitsOf = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

\* The realm (§9.3). The state is a record:
\*   objs          the objects, a heap (HeapGet) by index
\*   envs          the environment records, a heap by index
\*   syms          each symbol's [[Description]], a string value or Undefined
\*   realm         the index of each intrinsic object of the current realm, by name
\*   globalEnv     the index of the current realm's global environment
\*   realmId       the index of the current realm in realms
\*   realms        each realm's [intrinsics, globalEnv], the first the one the host starts with
\*   privateCount  the number of Private Names made so far
\*   symbolRegistry  the GlobalSymbolRegistry of Symbol.for (§20.4.2.2)
\*   jobs          the pending jobs, as [kind, ...] records
\*   out           the lines print wrote
\* CreateRealm allocates the intrinsics in the order of Intrinsics, so the index of each is its
\* position there. A built-in function's id is <<family, name>>.

\* An intrinsic object: its name, its prototype's name or "" for null, its class, and slots. A
\* built-in function has a length and a name.
IntrinsicObject(name, proto, class, slots) ==
  [name |-> name, proto |-> proto, class |-> class, slots |-> slots, length |-> -1, fname |-> <<>>]
IntrinsicFunction(name, proto, id, length, fname, isConstructor) ==
  [name |-> name, proto |-> proto, class |-> "builtin",
   slots |-> [id |-> id, constructor |-> isConstructor, data |-> Empty, realm |-> 1, initialName |-> fname],
   length |-> length, fname |-> fname]

CoreIntrinsics ==
  << IntrinsicObject("ObjectPrototype", "", "immutableProto", [none |-> TRUE]),
     IntrinsicFunction("FunctionPrototype", "ObjectPrototype", <<"Function", "prototype">>, 0, <<>>, FALSE),
     IntrinsicFunction("Object", "FunctionPrototype", <<"Object", "constructor">>, 1, N("Object"), TRUE),
     IntrinsicFunction("Function", "FunctionPrototype", <<"Function", "constructor">>, 1, N("Function"), TRUE),
     IntrinsicFunction("ThrowTypeError", "FunctionPrototype", <<"Function", "throwTypeError">>, 0, <<>>, FALSE),
     IntrinsicFunction("FunctionCaller", "FunctionPrototype", <<"Function", "caller">>, 0, N("get caller"), FALSE),
     IntrinsicFunction("FunctionArguments", "FunctionPrototype", <<"Function", "arguments">>, 0, N("get arguments"), FALSE),
     IntrinsicObject("IteratorPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("ForInIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("ForInIteratorPrototype_next", "FunctionPrototype", <<"ForInIterator", "next">>, 0, N("next"), FALSE),
     IntrinsicFunction("eval", "FunctionPrototype", <<"Global", "eval">>, 1, N("eval"), FALSE),
     IntrinsicObject("Host262", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IsHTMLDDA", "FunctionPrototype", <<"Global", "IsHTMLDDA">>, 0, N("IsHTMLDDA"), FALSE),
     IntrinsicObject("GlobalObject", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

IntrinsicIndex == [name \in {Intrinsics[i].name : i \in DOMAIN Intrinsics} |->
                     CHOOSE i \in DOMAIN Intrinsics : Intrinsics[i].name = name]

\* The intrinsic objects of realm number realm, with a built-in function's length and name, for
\* objects allocated after the first offset.
IntrinsicObjects(offset, realm) ==
  [i \in DOMAIN Intrinsics |->
     LET d == Intrinsics[i]
         base == MakeObject(IF d.proto = "" THEN Null ELSE Obj(offset + IntrinsicIndex[d.proto]), d.class,
                            IF d.class = "builtin" THEN [d.slots EXCEPT !.realm = realm] ELSE d.slots)
         \* %ThrowTypeError% (§10.2.4.1) is frozen.
         isFrozen == d.name = "ThrowTypeError"
     IN IF d.length < 0 THEN base
        ELSE [PutProp(PutProp(base, SV("length"), DataDesc(IntV(d.length), FALSE, FALSE, ~isFrozen)),
                      SV("name"), DataDesc(Str(d.fname), FALSE, FALSE, ~isFrozen))
              EXCEPT !.ext = ~isFrozen]]

\* Properties of the intrinsics, each one of
\*   [t |-> "m", o, k, id, len]          a built-in method, or with t "mfixed" a read-only one
\*   [t |-> "g", o, k, get, set]         an accessor of built-ins, set "" for none
\*   [t |-> "l", o, k, to, w, e, c]      an intrinsic as a data property
\*   [t |-> "v", o, k, v, w, e, c]       a value as a data property
\*   [t |-> "thrower", o, k]              an accessor whose get and set are %ThrowTypeError%
\* with o the intrinsic's name and k the key.
M(o, k, family, name, len) == [t |-> "m", o |-> o, k |-> k, id |-> <<family, name>>, len |-> len]
G(o, k, family, get, set) == [t |-> "g", o |-> o, k |-> k, get |-> <<family, get>>, set |-> <<family, set>>]
L(o, k, to, w, e, c) == [t |-> "l", o |-> o, k |-> k, to |-> to, w |-> w, e |-> e, c |-> c]
V(o, k, v, w, e, c) == [t |-> "v", o |-> o, k |-> k, v |-> v, w |-> w, e |-> e, c |-> c]
Ctor(o, p) == << L(o, SV("prototype"), p, FALSE, FALSE, FALSE), L(p, SV("constructor"), o, TRUE, FALSE, TRUE) >>
Thrower(o, k) == [t |-> "thrower", o |-> o, k |-> k]
GlobalLink(name, units) == L("GlobalObject", Str(units), name, TRUE, FALSE, TRUE)

CoreProperties ==
  Ctor("Object", "ObjectPrototype") \o Ctor("Function", "FunctionPrototype") \o
  << GlobalLink("Object", N("Object")), GlobalLink("Function", N("Function")),
     GlobalLink("eval", N("eval")),
     GlobalLink("Host262", N("$262")),
     L("GlobalObject", SV("globalThis"), "GlobalObject", TRUE, FALSE, TRUE),
     L("Host262", SV("global"), "GlobalObject", TRUE, FALSE, TRUE),
     L("Host262", SV("IsHTMLDDA"), "IsHTMLDDA", TRUE, FALSE, TRUE),
     L("ForInIteratorPrototype", SV("next"), "ForInIteratorPrototype_next", TRUE, FALSE, TRUE) >>

\* The symbols the realm starts with: the well-known symbols, by description.
WellKnownSymbolDescriptions ==
  << N("Symbol.asyncIterator"), N("Symbol.hasInstance"), N("Symbol.isConcatSpreadable"), N("Symbol.iterator"),
     N("Symbol.match"), N("Symbol.matchAll"), N("Symbol.replace"), N("Symbol.search"), N("Symbol.species"),
     N("Symbol.split"), N("Symbol.toPrimitive"), N("Symbol.toStringTag"), N("Symbol.unscopables"),
     N("Symbol.asyncDispose"), N("Symbol.dispose") >>

\* A built-in function object for a property, named by its key.
BuiltinForKey(s, id, len, k, prefix) ==
  LET units == FunctionNameUnits(s, k)
  IN Alloc(s, BuiltinObject(Intrinsic(s, "FunctionPrototype"), id, len,
                            IF prefix = <<>> THEN units ELSE prefix \o <<32>> \o units, FALSE, Empty, s.realmId))

AddRealmProperty(s, p) ==
  LET owner == Intrinsic(s, p.o) IN
  CASE p.t \in {"m", "mfixed"} ->
         LET f == BuiltinForKey(s, p.id, p.len, p.k, <<>>) IN
         SetO(f.s, owner, PutProp(O(f.s, owner), p.k, DataDesc(f.v, p.t = "m", FALSE, p.t = "m")))
    [] p.t = "g" ->
         LET g == BuiltinForKey(s, p.get, 0, p.k, N("get"))
             st == IF p.set[2] = "" THEN [s |-> g.s, v |-> Undefined] ELSE BuiltinForKey(g.s, p.set, 1, p.k, N("set"))
         IN SetO(st.s, owner, PutProp(O(st.s, owner), p.k, AccessorDesc(g.v, st.v, FALSE, TRUE)))
    [] p.t = "l" -> SetO(s, owner, PutProp(O(s, owner), p.k, DataDesc(Intrinsic(s, p.to), p.w, p.e, p.c)))
    [] p.t = "v" -> SetO(s, owner, PutProp(O(s, owner), p.k, DataDesc(p.v, p.w, p.e, p.c)))
    [] p.t = "thrower" ->
         SetO(s, owner, PutProp(O(s, owner), p.k,
              AccessorDesc(Intrinsic(s, "ThrowTypeError"), Intrinsic(s, "ThrowTypeError"), FALSE, TRUE)))
AddRealmProperties(s, ps) ==
  IF ps = <<>> THEN s ELSE AddRealmProperties(AddRealmProperty(s, Head(ps)), Tail(ps))

\* The environments of a realm whose intrinsics follow the first offset objects, for environments
\* allocated after the first envOffset: the global object's, the global declarative one, and the
\* global environment, last.
GlobalEnvironments(offset, envOffset) ==
  << [kind |-> "object", outer |-> 0, obj |-> Obj(offset + IntrinsicIndex["GlobalObject"]), withEnv |-> FALSE],
     [kind |-> "declarative", outer |-> 0, b |-> <<>>],
     [kind |-> "global", outer |-> 0, objRec |-> envOffset + 1, declRec |-> envOffset + 2,
      this |-> Obj(offset + IntrinsicIndex["GlobalObject"])] >>

\* Makes realm id the current one, as running code of a function of that realm does.
EnterRealm(s, id) ==
  IF id = s.realmId THEN s
  ELSE [s EXCEPT !.realmId = id, !.realm = s.realms[id].intrinsics, !.globalEnv = s.realms[id].globalEnv]

\* CreateRealm (§9.3.1), SetRealmGlobalObject, and SetDefaultGlobalBindings (§9.3.3) together, for
\* $262.createRealm: allocates a realm's intrinsics and environments after the state's, and
\* returns the realm's $262.
CreateRealm(s) ==
  LET offset == s.objs.size
      id == Len(s.realms) + 1
      intrinsics == [name \in DOMAIN IntrinsicIndex |-> offset + IntrinsicIndex[name]]
      s0 == HoldEnvs([s EXCEPT !.objs = HeapAppendFrom(@, IntrinsicObjects(offset, id), 1),
                               !.envs = HeapAppendFrom(@, GlobalEnvironments(offset, s.envs.size), 1),
                               !.realms = Append(@, [intrinsics |-> intrinsics, globalEnv |-> s.envs.size + 3])])
  IN Ok(EnterRealm(AddRealmProperties(EnterRealm(s0, id), RealmProperties), s.realmId), Obj(intrinsics["Host262"]))

\* The realm the host starts with. Its environments are the first three.
InitialState ==
  LET s0 == [objs |-> HeapOf(IntrinsicObjects(0, 1)),
             envs |-> HeapOf(GlobalEnvironments(0, 0)),
             envsHeld |-> 3,
             callers |-> Null,
             syms |-> [i \in DOMAIN WellKnownSymbolDescriptions |-> Str(WellKnownSymbolDescriptions[i])],
             realm |-> IntrinsicIndex,
             globalEnv |-> 3,
             realmId |-> 1,
             realms |-> <<[intrinsics |-> IntrinsicIndex, globalEnv |-> 3]>>,
             privateCount |-> 0,
             symbolRegistry |-> <<>>,
             jobs |-> <<>>,
             parses |-> <<>>,
             templates |-> <<>>,
             evalCount |-> 0,
             hoisted |-> {},
             directory |-> <<>>,
             modules |-> <<>>,
             moduleIds |-> <<>>,
             asyncCount |-> 1,
             clock |-> 0,
             canSuspend |-> TRUE,
             waiters |-> <<>>,
             disposables |-> <<>>,
             out |-> <<>>]
  IN AddRealmProperties(s0, RealmProperties)

\* The context that script code of the current realm runs in, outside any private environment.
NoPrivateEnvironment == [outer |-> Null, names |-> <<>>]
ScriptContext(s) == Context(s.globalEnv, s.globalEnv, NoPrivateEnvironment, Null)

\* Environment records (§9.1). The state's envs holds each as a record with kind "declarative",
\* "catch" (a catch clause's declarative environment), "function", "module", "object", or "global", and outer, the index of the outer environment or 0.
\* A declarative environment's b maps each name to [value, mutable, init, strict, deletable].
\* A function environment adds this, thisStatus, fn, and newTarget. An object environment has obj
\* and withEnv. A global environment has objRec and declRec, the indices of its parts. A module environment adds module, the index of its module, and its import bindings
\* hold [type |-> "import", module, name], the module and the name of the binding they read.
E(s, e) == HeapGet(s.envs, e)
SetE(s, e, env) == [s EXCEPT !.envs = HeapSet(@, e, env)]
\* The heap never collects, so a call frees the environments it made when it returns, unless
\* something other than the evaluation may refer to one. envsHeld counts the environments, from
\* the first, that may be: HoldEnvs holds them all whenever an object is allocated, which covers
\* closures, arguments objects, and await reactions, and whenever a realm, a module, a suspended
\* body's frames, a hoisted function, or a disposable resource records an environment.
HoldEnvs(s) == [s EXCEPT !.envsHeld = s.envs.size]
FreeEnvs(size, r) ==
  IF r.s.envsHeld > size \/ r.s.envs.size = size THEN r ELSE [r EXCEPT !.s.envs = HeapTruncate(@, size)]
AllocEnv(s, env) == [s |-> [s EXCEPT !.envs = HeapAppend(@, env)], e |-> s.envs.size + 1]

NewDeclarativeEnvironment(s, outer) ==
  AllocEnv(s, [kind |-> "declarative", outer |-> outer, b |-> <<>>])
NewCatchEnvironment(s, outer) == AllocEnv(s, [kind |-> "catch", outer |-> outer, b |-> <<>>])
NewObjectEnvironment(s, obj, withEnv, outer) ==
  AllocEnv(s, [kind |-> "object", outer |-> outer, obj |-> obj, withEnv |-> withEnv])
NewFunctionEnvironment(s, f, newTarget) ==
  LET fo == O(s, f) IN
  AllocEnv(s, [kind |-> "function", outer |-> fo.slots.env, b |-> <<>>,
               this |-> Undefined,
               thisStatus |-> IF fo.slots.thisMode = "lexical" THEN "lexical" ELSE "uninitialized",
               fn |-> f, newTarget |-> newTarget])
NewModuleEnvironment(s, outer, m) ==
  LET a == AllocEnv(s, [kind |-> "module", outer |-> outer, b |-> <<>>, module |-> m]) IN [a EXCEPT !.s = HoldEnvs(@)]
\* CreateImportBinding (§9.1.1.5.5).
CreateImportBinding(s, e, name, m, bindingName) ==
  SetE(s, e, [E(s, e) EXCEPT !.b = (name :> Binding([type |-> "import", module |-> m, name |-> bindingName], FALSE, TRUE, TRUE, FALSE)) @@ @])

Binding(value, mutable, init, strict, deletable) ==
  [value |-> value, mutable |-> mutable, init |-> init, strict |-> strict, deletable |-> deletable]
IsDeclarativeKind(kind) == kind \in {"declarative", "catch", "function", "module"}

\* HasBinding (§9.1.1.*.1).
HasBinding(s, e, name) ==
  LET env == E(s, e) IN
  CASE IsDeclarativeKind(env.kind) -> Ok(s, Bool(name \in DOMAIN env.b))
    [] env.kind = "object" ->
         LET h == HasProperty(s, env.obj, Str(name)) IN
         IF IsAbrupt(h) \/ Val(h) = False \/ ~env.withEnv THEN h
         ELSE LET u == Get(h.s, env.obj, SymUnscopables) IN
         IF IsAbrupt(u) THEN u
         ELSE IF ~IsObject(Val(u)) THEN Ok(u.s, True)
         ELSE LET blocked == Get(u.s, Val(u), Str(name)) IN
              IF IsAbrupt(blocked) THEN blocked ELSE Ok(blocked.s, Bool(~ToBooleanValue(Val(blocked))))
    [] env.kind = "global" ->
         IF name \in DOMAIN E(s, env.declRec).b THEN Ok(s, True)
         ELSE HasBinding(s, env.objRec, name)

CreateMutableBinding(s, e, name, deletable) ==
  LET env == E(s, e) IN
  CASE IsDeclarativeKind(env.kind) ->
         Ok(SetE(s, e, [env EXCEPT !.b = (name :> Binding(Undefined, TRUE, FALSE, FALSE, deletable)) @@ @]), Empty)
    [] env.kind = "object" ->
         LET r == DefinePropertyOrThrow(s, env.obj, Str(name), DataDesc(Undefined, TRUE, TRUE, deletable)) IN
         IF IsAbrupt(r) THEN r ELSE Ok(r.s, Empty)
    [] env.kind = "global" ->
         IF name \in DOMAIN E(s, env.declRec).b THEN ThrowTypeError(s)
         ELSE CreateMutableBinding(s, env.declRec, name, deletable)

CreateImmutableBinding(s, e, name, strict) ==
  LET env == E(s, e)
      target == IF env.kind = "global" THEN env.declRec ELSE e
  IN IF env.kind = "global" /\ name \in DOMAIN E(s, env.declRec).b THEN ThrowTypeError(s)
     ELSE Ok(SetE(s, target, [E(s, target) EXCEPT !.b = (name :> Binding(Undefined, FALSE, FALSE, strict, FALSE)) @@ @]), Empty)

InitializeBinding(s, e, name, value) ==
  LET env == E(s, e) IN
  CASE IsDeclarativeKind(env.kind) ->
         Ok(SetE(s, e, [env EXCEPT !.b[name].value = value, !.b[name].init = TRUE]), Empty)
    [] env.kind = "object" -> SetMutableBinding(s, e, name, value, FALSE)
    [] env.kind = "global" ->
         IF name \in DOMAIN E(s, env.declRec).b THEN InitializeBinding(s, env.declRec, name, value)
         ELSE InitializeBinding(s, env.objRec, name, value)

SetMutableBinding(s, e, name, value, strict) ==
  LET env == E(s, e) IN
  CASE IsDeclarativeKind(env.kind) ->
         IF name \notin DOMAIN env.b THEN
           IF strict THEN ThrowError(s, "ReferenceError")
           ELSE LET c == CreateMutableBinding(s, e, name, TRUE) IN
                InitializeBinding(c.s, e, name, value)
         ELSE LET bind == env.b[name] IN
         IF ~bind.init THEN ThrowError(s, "ReferenceError")
         ELSE IF bind.mutable THEN Ok(SetE(s, e, [env EXCEPT !.b[name].value = value]), Empty)
         ELSE IF strict \/ bind.strict THEN ThrowTypeError(s)
         ELSE Ok(s, Empty)
    [] env.kind = "object" ->
         LET h == HasProperty(s, env.obj, Str(name)) IN
         IF IsAbrupt(h) THEN h
         ELSE IF Val(h) = False /\ strict THEN ThrowError(h.s, "ReferenceError")
         ELSE LET r == Set(h.s, env.obj, Str(name), value, strict) IN
              IF IsAbrupt(r) THEN r ELSE Ok(r.s, Empty)
    [] env.kind = "global" ->
         IF name \in DOMAIN E(s, env.declRec).b THEN SetMutableBinding(s, env.declRec, name, value, strict)
         ELSE SetMutableBinding(s, env.objRec, name, value, strict)

GetBindingValue(s, e, name, strict) ==
  LET env == E(s, e) IN
  CASE env.kind = "module" /\ env.b[name].value.type = "import" ->
         LET target == env.b[name].value IN
         IF ModuleAt(s, target.module).env = 0 THEN ThrowError(s, "ReferenceError")
         ELSE GetBindingValue(s, ModuleAt(s, target.module).env, target.name, TRUE)
    [] IsDeclarativeKind(env.kind) ->
         IF ~env.b[name].init THEN ThrowError(s, "ReferenceError") ELSE Ok(s, env.b[name].value)
    [] env.kind = "object" ->
         LET h == HasProperty(s, env.obj, Str(name)) IN
         IF IsAbrupt(h) THEN h
         ELSE IF Val(h) = False THEN
           IF strict THEN ThrowError(h.s, "ReferenceError") ELSE Ok(h.s, Undefined)
         ELSE Get(h.s, env.obj, Str(name))
    [] env.kind = "global" ->
         IF name \in DOMAIN E(s, env.declRec).b THEN GetBindingValue(s, env.declRec, name, strict)
         ELSE GetBindingValue(s, env.objRec, name, strict)

DeleteBinding(s, e, name) ==
  LET env == E(s, e) IN
  CASE IsDeclarativeKind(env.kind) ->
         IF ~env.b[name].deletable THEN Ok(s, False)
         ELSE Ok(SetE(s, e, [env EXCEPT !.b = [n \in DOMAIN @ \ {name} |-> @[n]]]), True)
    [] env.kind = "object" -> Delete(s, env.obj, Str(name))
    [] env.kind = "global" ->
         IF name \in DOMAIN E(s, env.declRec).b THEN DeleteBinding(s, env.declRec, name)
         ELSE LET h == HasOwnProperty(s, E(s, env.objRec).obj, Str(name)) IN
         IF IsAbrupt(h) THEN h
         ELSE IF Val(h) = False THEN Ok(h.s, True)
         ELSE DeleteBinding(h.s, env.objRec, name)

HasThisBinding(s, e) ==
  LET env == E(s, e) IN
  CASE env.kind = "function" -> env.thisStatus # "lexical"
    [] env.kind \in {"global", "module"} -> TRUE
    [] OTHER -> FALSE

HasSuperBinding(s, e) ==
  LET env == E(s, e) IN
  env.kind = "function" /\ env.thisStatus # "lexical" /\ O(s, env.fn).slots.home # Undefined

GetThisBinding(s, e) ==
  LET env == E(s, e) IN
  CASE env.kind = "function" ->
         IF env.thisStatus = "uninitialized" THEN ThrowError(s, "ReferenceError") ELSE Ok(s, env.this)
    [] env.kind = "global" -> Ok(s, env.this)
    [] env.kind = "module" -> Ok(s, Undefined)

BindThisValue(s, e, v) ==
  LET env == E(s, e) IN
  IF env.thisStatus = "initialized" THEN ThrowError(s, "ReferenceError")
  ELSE Ok(SetE(s, e, [env EXCEPT !.this = v, !.thisStatus = "initialized"]), v)

GetSuperBase(s, e) ==
  LET home == O(s, E(s, e).fn).slots.home IN
  IF home = Undefined THEN Ok(s, Undefined) ELSE GetPrototypeOf(s, home)

\* The global environment's own operations (§9.1.1.4).
HasLexicalDeclaration(s, e, name) == name \in DOMAIN E(s, E(s, e).declRec).b

HasRestrictedGlobalProperty(s, e, name) ==
  LET d == GetOwnProperty(s, E(s, E(s, e).objRec).obj, Str(name)) IN
  IF IsAbrupt(d) THEN d
  ELSE IF Val(d) = Absent THEN Ok(d.s, False)
  ELSE Ok(d.s, Bool(Val(d).configurable = False))

CanDeclareGlobalVar(s, e, name) ==
  LET g == E(s, E(s, e).objRec).obj
      h == HasOwnProperty(s, g, Str(name))
  IN IF IsAbrupt(h) THEN h
     ELSE IF Val(h) = True THEN Ok(h.s, True)
     ELSE IsExtensible(h.s, g)

CanDeclareGlobalFunction(s, e, name) ==
  LET g == E(s, E(s, e).objRec).obj
      d == GetOwnProperty(s, g, Str(name))
  IN IF IsAbrupt(d) THEN d
     ELSE IF Val(d) = Absent THEN IsExtensible(d.s, g)
     ELSE IF Val(d).configurable = True THEN Ok(d.s, True)
     ELSE Ok(d.s, Bool(IsDataDescriptor(Val(d)) /\ Val(d).writable = True /\ Val(d).enumerable = True))

CreateGlobalVarBinding(s, e, name, deletable) ==
  LET env == E(s, e)
      g == E(s, env.objRec).obj
      h == HasOwnProperty(s, g, Str(name))
  IN IF IsAbrupt(h) THEN h ELSE
     LET ex == IsExtensible(h.s, g) IN
     IF IsAbrupt(ex) THEN ex ELSE
     IF Val(h) = False /\ Val(ex) = True
     THEN LET m == CreateMutableBinding(ex.s, env.objRec, name, deletable) IN
          IF IsAbrupt(m) THEN m ELSE InitializeBinding(m.s, env.objRec, name, Undefined)
     ELSE Ok(ex.s, Empty)

CreateGlobalFunctionBinding(s, e, name, value, deletable) ==
  LET env == E(s, e)
      g == E(s, env.objRec).obj
      d == GetOwnProperty(s, g, Str(name))
  IN IF IsAbrupt(d) THEN d ELSE
     LET desc == IF Val(d) = Absent \/ Val(d).configurable = True
                 THEN DataDesc(value, TRUE, TRUE, deletable)
                 ELSE [EmptyDesc EXCEPT !.value = value]
         r == DefinePropertyOrThrow(d.s, g, Str(name), desc)
     IN IF IsAbrupt(r) THEN r ELSE
        LET w == Set(r.s, g, Str(name), value, FALSE) IN
        IF IsAbrupt(w) THEN w ELSE Ok(w.s, Empty)

\* GetIdentifierReference (§9.1.2.1): a Reference Record for name, resolved from environment e.
Reference(base, name, strict, this) ==
  [type |-> "reference", base |-> base, name |-> name, strict |-> strict, this |-> this]
EnvBase(e) == [type |-> "env", env |-> e]
Unresolvable == [type |-> "unresolvable"]

GetIdentifierReference(s, e, name, strict) ==
  IF e = 0 THEN Ok(s, Reference(Unresolvable, Str(name), strict, Empty))
  ELSE LET h == HasBinding(s, e, name) IN
       IF IsAbrupt(h) THEN h
       ELSE IF Val(h) = True THEN Ok(h.s, Reference(EnvBase(e), Str(name), strict, Empty))
       ELSE GetIdentifierReference(h.s, E(h.s, e).outer, name, strict)

ResolveBinding(s, ctx, name, strict) == GetIdentifierReference(s, ctx.lex, name, strict)

\* GetThisEnvironment (§9.4.3).
GetThisEnvironment(s, e) ==
  IF HasThisBinding(s, e) THEN e ELSE GetThisEnvironment(s, E(s, e).outer)

ResolveThisBinding(s, ctx) == GetThisBinding(s, GetThisEnvironment(s, ctx.lex))

GetNewTarget(s, ctx) == E(s, GetThisEnvironment(s, ctx.lex)).newTarget

\* Reference Records (§6.2.5).
IsPropertyReference(ref) == ref.base.type \notin {"env", "unresolvable"}
IsUnresolvableReference(ref) == ref.base.type = "unresolvable"
GetThisValue(ref) == IF ref.this = Empty THEN ref.base ELSE ref.this

GetValue(s, v) ==
  IF v.type # "reference" THEN Ok(s, v)
  ELSE IF IsUnresolvableReference(v) THEN ThrowError(s, "ReferenceError")
  ELSE IF IsPropertyReference(v) THEN
    LET base == ToObject(s, v.base) IN
    IF IsAbrupt(base) THEN base
    ELSE IF v.name.type = "private" THEN PrivateGet(base.s, Val(base), v.name)
    ELSE LET k == IF IsPropertyKey(v.name) THEN Ok(base.s, v.name) ELSE ToPropertyKey(base.s, v.name) IN
         IF IsAbrupt(k) THEN k ELSE GetV(k.s, Val(base), Val(k), GetThisValue(v))
  ELSE GetBindingValue(s, v.base.env, v.name.value, v.strict)

\* Step 3.c of GetValue, which stores the property key it converts in the reference, for an
\* operator that puts a value to the reference after getting it. A nullish base throws first.
ToKeyedReference(s, v) ==
  IF v.type # "reference" \/ ~IsPropertyReference(v) \/ IsNullish(v.base) \/ v.name.type = "private" \/
     IsPropertyKey(v.name)
  THEN Ok(s, v)
  ELSE LET k == ToPropertyKey(s, v.name) IN IF IsAbrupt(k) THEN k ELSE Ok(k.s, [v EXCEPT !.name = Val(k)])

PutValue(s, v, w) ==
  IF v.type # "reference" THEN ThrowError(s, "ReferenceError")
  ELSE IF IsUnresolvableReference(v) THEN
    IF v.strict THEN ThrowError(s, "ReferenceError")
    ELSE LET g == E(s, s.globalEnv)
             r == Set(s, E(s, g.objRec).obj, v.name, w, FALSE)
         IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Empty)
  ELSE IF IsPropertyReference(v) THEN
    LET base == ToObject(s, v.base) IN
    IF IsAbrupt(base) THEN base
    ELSE IF v.name.type = "private" THEN PrivateSet(base.s, Val(base), v.name, w)
    ELSE LET k == IF IsPropertyKey(v.name) THEN Ok(base.s, v.name) ELSE ToPropertyKey(base.s, v.name) IN
    IF IsAbrupt(k) THEN k ELSE
    LET r == SetV(k.s, Val(base), Val(k), w, GetThisValue(v)) IN
    IF IsAbrupt(r) THEN r
    ELSE IF Val(r) = False /\ v.strict THEN ThrowTypeError(r.s)
    ELSE Ok(r.s, Empty)
  ELSE SetMutableBinding(s, v.base.env, v.name.value, w, v.strict)

InitializeReferencedBinding(s, v, w) == InitializeBinding(s, v.base.env, v.name.value, w)

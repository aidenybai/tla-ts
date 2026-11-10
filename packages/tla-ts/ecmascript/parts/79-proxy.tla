\* Proxy exotic objects (§10.5). A Proxy object has class "proxy" and slots:
\*   target, handler  [[ProxyTarget]] and [[ProxyHandler]], both Null once revoked
\*   callable         whether it has [[Call]], which is whether its target was callable
\*   constructor      whether it has [[Construct]]

\* ProxyCreate (§10.5.14).
ProxyCreate(s, target, handler) ==
  IF ~IsObject(target) \/ ~IsObject(handler) THEN ThrowTypeError(s)
  ELSE LET a == Alloc(s, MakeObject(Null, "proxy",
                        [target |-> target, handler |-> handler,
                         callable |-> IsCallable(s, target), constructor |-> IsConstructor(s, target)]))
       IN Ok(a.s, a.v)

\* Steps 1 to 6 of each internal method: throws if the proxy is revoked, else returns the trap of
\* the handler named name, or Undefined.
ProxyTrap(s, v, name) ==
  IF O(s, v).slots.handler = Null THEN ThrowTypeError(s)
  ELSE GetMethod(s, O(s, v).slots.handler, name)

\* IsCompatiblePropertyDescriptor (§10.1.6.2), which validates without an object to apply to.
IsCompatiblePropertyDescriptor(extensible, d, current) ==
  ValidateAndApply(MakeObject(Null, "ordinary", [none |-> TRUE]), EmptyStr, extensible, d, current).ok

\* [[GetPrototypeOf]] (§10.5.1).
ProxyGetPrototypeOf(s, v) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("getPrototypeOf"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN GetPrototypeOf(trap.s, target)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ~IsObject(Val(r)) /\ Val(r) # Null THEN ThrowTypeError(r.s)
     ELSE LET e == IsExtensible(r.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE IF Val(e) = True THEN Ok(e.s, Val(r))
     ELSE LET p == GetPrototypeOf(e.s, target) IN
     IF IsAbrupt(p) THEN p
     ELSE IF ~SameValue(Val(r), Val(p)) THEN ThrowTypeError(p.s)
     ELSE Ok(p.s, Val(r))

\* [[SetPrototypeOf]] (§10.5.2).
ProxySetPrototypeOf(s, v, proto) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("setPrototypeOf"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN SetPrototypeOf(trap.s, target, proto)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target, proto>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, False)
     ELSE LET e == IsExtensible(r.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE IF Val(e) = True THEN Ok(e.s, True)
     ELSE LET p == GetPrototypeOf(e.s, target) IN
     IF IsAbrupt(p) THEN p
     ELSE IF ~SameValue(proto, Val(p)) THEN ThrowTypeError(p.s)
     ELSE Ok(p.s, True)

\* [[IsExtensible]] (§10.5.3).
ProxyIsExtensible(s, v) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("isExtensible"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN IsExtensible(trap.s, target)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target>>) IN
     IF IsAbrupt(r) THEN r
     ELSE LET t == IsExtensible(r.s, target) IN
     IF IsAbrupt(t) THEN t
     ELSE IF ToBoolean(Val(r)) # Val(t) THEN ThrowTypeError(t.s)
     ELSE t

\* [[PreventExtensions]] (§10.5.4).
ProxyPreventExtensions(s, v) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("preventExtensions"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN PreventExtensions(trap.s, target)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, False)
     ELSE LET e == IsExtensible(r.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE IF Val(e) = True THEN ThrowTypeError(e.s)
     ELSE Ok(e.s, True)

\* [[GetOwnProperty]] (§10.5.5).
ProxyGetOwnProperty(s, v, k) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("getOwnPropertyDescriptor"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN GetOwnProperty(trap.s, target, k)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target, k>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ~IsObject(Val(r)) /\ Val(r) # Undefined THEN ThrowTypeError(r.s)
     ELSE LET td == GetOwnProperty(r.s, target, k) IN
     IF IsAbrupt(td) THEN td
     ELSE LET targetDesc == Val(td) IN
     IF Val(r) = Undefined THEN
       IF targetDesc = Absent THEN Ok(td.s, Absent)
       ELSE IF targetDesc.configurable = False THEN ThrowTypeError(td.s)
       ELSE LET e == IsExtensible(td.s, target) IN
            IF IsAbrupt(e) THEN e
            ELSE IF Val(e) = False THEN ThrowTypeError(e.s)
            ELSE Ok(e.s, Absent)
     ELSE LET e == IsExtensible(td.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE LET rd == ToPropertyDescriptor(e.s, Val(r)) IN
     IF IsAbrupt(rd) THEN rd
     ELSE LET resultDesc == CompletePropertyDescriptor(Val(rd)) IN
     IF ~IsCompatiblePropertyDescriptor(Truthy(Val(e)), resultDesc, targetDesc) THEN ThrowTypeError(rd.s)
     ELSE IF resultDesc.configurable = False /\
             (targetDesc = Absent \/ targetDesc.configurable = True \/
              (resultDesc.writable = False /\ targetDesc.writable = True))
     THEN ThrowTypeError(rd.s)
     ELSE Ok(rd.s, resultDesc)

\* [[DefineOwnProperty]] (§10.5.6).
ProxyDefineOwnProperty(s, v, k, d) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("defineProperty"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN DefineOwnProperty(trap.s, target, k, d)
     ELSE LET descObj == FromPropertyDescriptor(trap.s, d)
              r == Call(descObj.s, Val(trap), handler, <<target, k, Val(descObj)>>)
          IN IF IsAbrupt(r) THEN r
     ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, False)
     ELSE LET td == GetOwnProperty(r.s, target, k) IN
     IF IsAbrupt(td) THEN td
     ELSE LET e == IsExtensible(td.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE LET targetDesc == Val(td)
              settingConfigFalse == d.configurable = False
          IN IF targetDesc = Absent THEN
               IF Val(e) = False \/ settingConfigFalse THEN ThrowTypeError(e.s) ELSE Ok(e.s, True)
             ELSE IF ~IsCompatiblePropertyDescriptor(Truthy(Val(e)), d, targetDesc) \/
                     (settingConfigFalse /\ targetDesc.configurable = True) \/
                     (IsDataDescriptor(targetDesc) /\ targetDesc.configurable = False /\
                      targetDesc.writable = True /\ d.writable = False)
             THEN ThrowTypeError(e.s)
             ELSE Ok(e.s, True)

\* [[HasProperty]] (§10.5.7).
ProxyHasProperty(s, v, k) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("has"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN HasProperty(trap.s, target, k)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target, k>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ToBooleanValue(Val(r)) THEN Ok(r.s, True)
     ELSE LET td == GetOwnProperty(r.s, target, k) IN
     IF IsAbrupt(td) THEN td
     ELSE IF Val(td) = Absent THEN Ok(td.s, False)
     ELSE IF Val(td).configurable = False THEN ThrowTypeError(td.s)
     ELSE LET e == IsExtensible(td.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE IF Val(e) = False THEN ThrowTypeError(e.s)
     ELSE Ok(e.s, False)

\* [[Get]] (§10.5.8).
ProxyGet(s, v, k, receiver) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("get"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN GetV(trap.s, target, k, receiver)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target, k, receiver>>) IN
     IF IsAbrupt(r) THEN r
     ELSE LET td == GetOwnProperty(r.s, target, k) IN
     IF IsAbrupt(td) THEN td
     ELSE LET d == Val(td) IN
     IF d # Absent /\ d.configurable = False /\
        ((IsDataDescriptor(d) /\ d.writable = False /\ ~SameValue(Val(r), d.value)) \/
         (IsAccessorDescriptor(d) /\ d.get = Undefined /\ Val(r) # Undefined))
     THEN ThrowTypeError(td.s)
     ELSE Ok(td.s, Val(r))

\* [[Set]] (§10.5.9).
ProxySet(s, v, k, value, receiver) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("set"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN SetV(trap.s, target, k, value, receiver)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target, k, value, receiver>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, False)
     ELSE LET td == GetOwnProperty(r.s, target, k) IN
     IF IsAbrupt(td) THEN td
     ELSE LET d == Val(td) IN
     IF d # Absent /\ d.configurable = False /\
        ((IsDataDescriptor(d) /\ d.writable = False /\ ~SameValue(value, d.value)) \/
         (IsAccessorDescriptor(d) /\ d.set = Undefined))
     THEN ThrowTypeError(td.s)
     ELSE Ok(td.s, True)

\* [[Delete]] (§10.5.10).
ProxyDelete(s, v, k) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("deleteProperty"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN Delete(trap.s, target, k)
     ELSE LET r == Call(trap.s, Val(trap), handler, <<target, k>>) IN
     IF IsAbrupt(r) THEN r
     ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, False)
     ELSE LET td == GetOwnProperty(r.s, target, k) IN
     IF IsAbrupt(td) THEN td
     ELSE IF Val(td) = Absent THEN Ok(td.s, True)
     ELSE IF Val(td).configurable = False THEN ThrowTypeError(td.s)
     ELSE LET e == IsExtensible(td.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE IF Val(e) = False THEN ThrowTypeError(e.s)
     ELSE Ok(e.s, True)

\* [[OwnPropertyKeys]] (§10.5.11). The trap's result and the target's keys have no duplicates, so
\* checking off each target key in turn comes to the subset tests below.
ProxyOwnPropertyKeys(s, v) ==
  LET handler == O(s, v).slots.handler
      target == O(s, v).slots.target
      trap == ProxyTrap(s, v, SV("ownKeys"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN OwnPropertyKeys(trap.s, target)
     ELSE LET array == Call(trap.s, Val(trap), handler, <<target>>) IN
     IF IsAbrupt(array) THEN array
     ELSE LET list == CreateListFromArrayLike(array.s, Val(array), "property-key") IN
     IF IsAbrupt(list) THEN list
     ELSE LET result == Val(list) IN
     IF Cardinality(Range(result)) # Len(result) THEN ThrowTypeError(list.s)
     ELSE LET e == IsExtensible(list.s, target) IN
     IF IsAbrupt(e) THEN e
     ELSE LET ks == OwnPropertyKeys(e.s, target) IN
     IF IsAbrupt(ks) THEN ks
     ELSE LET split == SplitConfigurableKeys(ks.s, target, Val(ks), <<>>, <<>>) IN
     IF IsAbrupt(split) THEN split
     ELSE LET configurable == Range(Val(split).configurable)
              nonconfigurable == Range(Val(split).nonconfigurable)
          IN IF Val(e) = True /\ nonconfigurable = {} THEN Ok(split.s, result)
             ELSE IF ~(nonconfigurable \subseteq Range(result)) THEN ThrowTypeError(split.s)
             ELSE IF Val(e) = True THEN Ok(split.s, result)
             ELSE IF ~(configurable \subseteq Range(result)) THEN ThrowTypeError(split.s)
             ELSE IF ~(Range(result) \subseteq configurable \cup nonconfigurable) THEN ThrowTypeError(split.s)
             ELSE Ok(split.s, result)

\* Steps 16 and 17 of [[OwnPropertyKeys]]: the target's keys, split by whether they are
\* configurable.
SplitConfigurableKeys(s, target, ks, configurable, nonconfigurable) ==
  IF ks = <<>> THEN Ok(s, [configurable |-> configurable, nonconfigurable |-> nonconfigurable])
  ELSE LET d == GetOwnProperty(s, target, Head(ks)) IN
       IF IsAbrupt(d) THEN d
       ELSE IF Val(d) # Absent /\ Val(d).configurable = False
       THEN SplitConfigurableKeys(d.s, target, Tail(ks), configurable, Append(nonconfigurable, Head(ks)))
       ELSE SplitConfigurableKeys(d.s, target, Tail(ks), Append(configurable, Head(ks)), nonconfigurable)

\* [[Call]] (§10.5.12).
ProxyCall(s, f, this, args) ==
  LET handler == O(s, f).slots.handler
      target == O(s, f).slots.target
      trap == ProxyTrap(s, f, SV("apply"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN Call(trap.s, target, this, args)
     ELSE LET array == CreateArrayFromList(trap.s, args) IN
          Call(array.s, Val(trap), handler, <<target, this, Val(array)>>)

\* [[Construct]] (§10.5.13).
ProxyConstruct(s, f, args, newTarget) ==
  LET handler == O(s, f).slots.handler
      target == O(s, f).slots.target
      trap == ProxyTrap(s, f, SV("construct"))
  IN IF IsAbrupt(trap) THEN trap
     ELSE IF Val(trap) = Undefined THEN Construct(trap.s, target, args, newTarget)
     ELSE LET array == CreateArrayFromList(trap.s, args)
              r == Call(array.s, Val(trap), handler, <<target, Val(array), newTarget>>)
          IN IF IsAbrupt(r) THEN r
             ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s)
             ELSE r

\* The Proxy constructor (§28.2). A revocation function keeps its proxy, or Null once it has
\* revoked it, in its data slot.
ProxyIntrinsics ==
  << IntrinsicFunction("Proxy", "FunctionPrototype", <<"Proxy", "constructor">>, 2, N("Proxy"), TRUE) >>

ProxyProperties ==
  << M("Proxy", SV("revocable"), "Proxy", "revocable", 2),
     GlobalLink("Proxy", N("Proxy")) >>

ProxyBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         \* Proxy (§28.2.1.1).
         IF nt = Undefined THEN ThrowTypeError(s) ELSE ProxyCreate(s, Arg(args, 1), Arg(args, 2))
    [] m = "revocable" ->
         \* Proxy.revocable (§28.2.2.1).
         LET p == ProxyCreate(s, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(p) THEN p
         ELSE LET revoker == CreateBuiltinFunction(p.s, <<"Proxy", "revoke">>, 0, <<>>, Val(p))
                  result == OrdinaryObjectCreate(revoker.s, Intrinsic(revoker.s, "ObjectPrototype"))
              IN Ok(SetO(result.s, Val(result),
                         WithDataProps(O(result.s, Val(result)),
                                       << <<SV("proxy"), Val(p)>>, <<SV("revoke"), Val(revoker)>> >>)),
                    Val(result))
    [] m = "revoke" ->
         \* Proxy revocation functions (§28.2.2.1.1).
         LET p == O(s, f).slots.data IN
         IF p = Null THEN Ok(s, Undefined)
         ELSE LET s1 == SetO(s, f, [O(s, f) EXCEPT !.slots.data = Null]) IN
              Ok(SetO(s1, p, [O(s1, p) EXCEPT !.slots.target = Null, !.slots.handler = Null]), Undefined)

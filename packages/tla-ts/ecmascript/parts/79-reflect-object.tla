\* The Reflect object (§28.1).
ReflectIntrinsics == << IntrinsicObject("Reflect", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

ReflectProperties ==
  << M("Reflect", SV("apply"), "Reflect", "apply", 3),
     M("Reflect", SV("construct"), "Reflect", "construct", 2),
     M("Reflect", SV("defineProperty"), "Reflect", "defineProperty", 3),
     M("Reflect", SV("deleteProperty"), "Reflect", "deleteProperty", 2),
     M("Reflect", SV("get"), "Reflect", "get", 2),
     M("Reflect", SV("getOwnPropertyDescriptor"), "Reflect", "getOwnPropertyDescriptor", 2),
     M("Reflect", SV("getPrototypeOf"), "Reflect", "getPrototypeOf", 1),
     M("Reflect", SV("has"), "Reflect", "has", 2),
     M("Reflect", SV("isExtensible"), "Reflect", "isExtensible", 1),
     M("Reflect", SV("ownKeys"), "Reflect", "ownKeys", 1),
     M("Reflect", SV("preventExtensions"), "Reflect", "preventExtensions", 1),
     M("Reflect", SV("set"), "Reflect", "set", 3),
     M("Reflect", SV("setPrototypeOf"), "Reflect", "setPrototypeOf", 2),
     V("Reflect", SymToStringTag, SV("Reflect"), FALSE, FALSE, TRUE),
     GlobalLink("Reflect", N("Reflect")) >>

ReflectBuiltin(s, f, m, this, args, nt) ==
  LET target == Arg(args, 1) IN
  IF m = "apply" THEN
    \* Reflect.apply (§28.1.1).
    IF ~IsCallable(s, target) THEN ThrowTypeError(s)
    ELSE LET l == CreateListFromArrayLike(s, Arg(args, 3), "all") IN
         IF IsAbrupt(l) THEN l ELSE Call(l.s, target, Arg(args, 2), Val(l))
  ELSE IF m = "construct" THEN
    \* Reflect.construct (§28.1.2).
    LET newTarget == IF Len(args) < 3 THEN target ELSE args[3] IN
    IF ~IsConstructor(s, target) \/ ~IsConstructor(s, newTarget) THEN ThrowTypeError(s)
    ELSE LET l == CreateListFromArrayLike(s, Arg(args, 2), "all") IN
         IF IsAbrupt(l) THEN l ELSE Construct(l.s, target, Val(l), newTarget)
  ELSE IF ~IsObject(target) THEN ThrowTypeError(s)
  ELSE IF m = "getPrototypeOf" THEN GetPrototypeOf(s, target)
  ELSE IF m = "setPrototypeOf" THEN
    IF ~IsObject(Arg(args, 2)) /\ Arg(args, 2) # Null THEN ThrowTypeError(s)
    ELSE SetPrototypeOf(s, target, Arg(args, 2))
  ELSE IF m = "isExtensible" THEN IsExtensible(s, target)
  ELSE IF m = "preventExtensions" THEN PreventExtensions(s, target)
  ELSE IF m = "ownKeys" THEN
    LET ks == OwnPropertyKeys(s, target) IN IF IsAbrupt(ks) THEN ks ELSE CreateArrayFromList(ks.s, Val(ks))
  ELSE
    \* The methods that take a property key second.
    LET k == ToPropertyKey(s, Arg(args, 2)) IN
    IF IsAbrupt(k) THEN k
    ELSE CASE m = "defineProperty" ->
                LET d == ToPropertyDescriptor(k.s, Arg(args, 3)) IN
                IF IsAbrupt(d) THEN d ELSE DefineOwnProperty(d.s, target, Val(k), Val(d))
           [] m = "deleteProperty" -> Delete(k.s, target, Val(k))
           [] m = "get" -> GetV(k.s, target, Val(k), IF Len(args) < 3 THEN target ELSE args[3])
           [] m = "getOwnPropertyDescriptor" ->
                LET d == GetOwnProperty(k.s, target, Val(k)) IN
                IF IsAbrupt(d) THEN d ELSE FromPropertyDescriptor(d.s, Val(d))
           [] m = "has" -> HasProperty(k.s, target, Val(k))
           [] m = "set" -> SetV(k.s, target, Val(k), Arg(args, 3), IF Len(args) < 4 THEN target ELSE args[4])

\* Object (§20.1).
ObjectProperties ==
  << M("Object", SV("assign"), "Object", "assign", 2),
     M("Object", SV("create"), "Object", "create", 2),
     M("Object", SV("defineProperties"), "Object", "defineProperties", 2),
     M("Object", SV("defineProperty"), "Object", "defineProperty", 3),
     M("Object", SV("entries"), "Object", "entries", 1),
     M("Object", SV("freeze"), "Object", "freeze", 1),
     M("Object", SV("fromEntries"), "Object", "fromEntries", 1),
     M("Object", SV("getOwnPropertyDescriptor"), "Object", "getOwnPropertyDescriptor", 2),
     M("Object", SV("getOwnPropertyDescriptors"), "Object", "getOwnPropertyDescriptors", 1),
     M("Object", SV("getOwnPropertyNames"), "Object", "getOwnPropertyNames", 1),
     M("Object", SV("getOwnPropertySymbols"), "Object", "getOwnPropertySymbols", 1),
     M("Object", SV("getPrototypeOf"), "Object", "getPrototypeOf", 1),
     M("Object", SV("groupBy"), "Object", "groupBy", 2),
     M("Object", SV("hasOwn"), "Object", "hasOwn", 2),
     M("Object", SV("is"), "Object", "is", 2),
     M("Object", SV("isExtensible"), "Object", "isExtensible", 1),
     M("Object", SV("isFrozen"), "Object", "isFrozen", 1),
     M("Object", SV("isSealed"), "Object", "isSealed", 1),
     M("Object", SV("keys"), "Object", "keys", 1),
     M("Object", SV("preventExtensions"), "Object", "preventExtensions", 1),
     M("Object", SV("seal"), "Object", "seal", 1),
     M("Object", SV("setPrototypeOf"), "Object", "setPrototypeOf", 2),
     M("Object", SV("values"), "Object", "values", 1),
     M("ObjectPrototype", SV("hasOwnProperty"), "Object", "hasOwnProperty", 1),
     M("ObjectPrototype", SV("isPrototypeOf"), "Object", "isPrototypeOf", 1),
     M("ObjectPrototype", SV("propertyIsEnumerable"), "Object", "propertyIsEnumerable", 1),
     M("ObjectPrototype", SV("toLocaleString"), "Object", "toLocaleString", 0),
     M("ObjectPrototype", SV("toString"), "Object", "toString", 0),
     M("ObjectPrototype", SV("valueOf"), "Object", "valueOf", 0),
     M("ObjectPrototype", SV("__defineGetter__"), "Object", "__defineGetter__", 2),
     M("ObjectPrototype", SV("__defineSetter__"), "Object", "__defineSetter__", 2),
     M("ObjectPrototype", SV("__lookupGetter__"), "Object", "__lookupGetter__", 1),
     M("ObjectPrototype", SV("__lookupSetter__"), "Object", "__lookupSetter__", 1),
     G("ObjectPrototype", SV("__proto__"), "Object", "getProto", "setProto") >>

ObjectBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1)
      a2 == Arg(args, 2)
  IN
  CASE m = "constructor" ->
         IF nt # Undefined /\ ~SameValue(nt, f)
         THEN OrdinaryCreateFromConstructor(s, nt, "ObjectPrototype", "ordinary", [none |-> TRUE])
         ELSE IF IsNullish(a1) THEN OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
         ELSE ToObject(s, a1)
    [] m = "getPrototypeOf" ->
         LET o == ToObject(s, a1) IN IF IsAbrupt(o) THEN o ELSE GetPrototypeOf(o.s, Val(o))
    [] m = "setPrototypeOf" ->
         IF IsNullish(a1) THEN ThrowTypeError(s)
         ELSE IF ~IsObject(a2) /\ a2 # Null THEN ThrowTypeError(s)
         ELSE IF ~IsObject(a1) THEN Ok(s, a1)
         ELSE LET r == SetPrototypeOf(s, a1, a2) IN
              IF IsAbrupt(r) THEN r ELSE IF Val(r) = False THEN ThrowTypeError(r.s) ELSE Ok(r.s, a1)
    [] m = "defineProperty" ->
         IF ~IsObject(a1) THEN ThrowTypeError(s)
         ELSE LET k == ToPropertyKey(s, a2) IN
         IF IsAbrupt(k) THEN k ELSE
         LET d == ToPropertyDescriptor(k.s, Arg(args, 3)) IN
         IF IsAbrupt(d) THEN d ELSE
         LET r == DefinePropertyOrThrow(d.s, a1, Val(k), Val(d)) IN
         IF IsAbrupt(r) THEN r ELSE Ok(r.s, a1)
    [] m = "defineProperties" -> IF ~IsObject(a1) THEN ThrowTypeError(s) ELSE ObjectDefineProperties(s, a1, a2)
    [] m = "getOwnPropertyDescriptor" ->
         LET o == ToObject(s, a1) IN IF IsAbrupt(o) THEN o ELSE
         LET k == ToPropertyKey(o.s, a2) IN IF IsAbrupt(k) THEN k ELSE
         LET d == GetOwnProperty(k.s, Val(o), Val(k)) IN IF IsAbrupt(d) THEN d ELSE FromPropertyDescriptor(d.s, Val(d))
    [] m = "getOwnPropertyDescriptors" ->
         \* Object.getOwnPropertyDescriptors (§20.1.2.9).
         LET o == ToObject(s, a1) IN IF IsAbrupt(o) THEN o ELSE
         LET ks == OwnPropertyKeys(o.s, Val(o)) IN IF IsAbrupt(ks) THEN ks ELSE
         LET descriptors == OrdinaryObjectCreate(ks.s, Intrinsic(ks.s, "ObjectPrototype")) IN
         AddDescriptors(descriptors.s, Val(o), Val(ks), Val(descriptors))
    [] m \in {"getOwnPropertyNames", "getOwnPropertySymbols"} ->
         LET o == ToObject(s, a1) IN IF IsAbrupt(o) THEN o ELSE
         LET ks == OwnPropertyKeys(o.s, Val(o)) IN IF IsAbrupt(ks) THEN ks ELSE
         CreateArrayFromList(ks.s, SelectSeq(Val(ks), LAMBDA k : IF m = "getOwnPropertyNames" THEN IsString(k) ELSE IsSymbol(k)))
    [] m \in {"keys", "values", "entries"} ->
         LET o == ToObject(s, a1) IN IF IsAbrupt(o) THEN o ELSE
         LET l == EnumerableOwnProperties(o.s, Val(o), CASE m = "keys" -> "key" [] m = "values" -> "value" [] OTHER -> "key+value") IN
         IF IsAbrupt(l) THEN l ELSE CreateArrayFromList(l.s, Val(l))
    [] m = "create" ->
         IF ~IsObject(a1) /\ a1 # Null THEN ThrowTypeError(s)
         ELSE LET o == OrdinaryObjectCreate(s, a1) IN
              IF a2 = Undefined THEN o ELSE ObjectDefineProperties(o.s, Val(o), a2)
    [] m = "assign" ->
         LET to == ToObject(s, a1) IN IF IsAbrupt(to) THEN to ELSE AssignSources(to.s, Val(to), Rest(args, 2))
    [] m = "fromEntries" ->
         \* Object.fromEntries (§20.1.2.7).
         LET c == RequireObjectCoercible(s, a1) IN IF IsAbrupt(c) THEN c ELSE
         LET obj == OrdinaryObjectCreate(c.s, Intrinsic(c.s, "ObjectPrototype"))
             adder == CreateBuiltinFunction(obj.s, <<"Object", "fromEntriesAdder">>, 2, <<>>, Val(obj))
         IN AddEntriesFromIterable(adder.s, Val(obj), a1, Val(adder))
    [] m = "fromEntriesAdder" ->
         LET k == ToPropertyKey(s, a1) IN IF IsAbrupt(k) THEN k ELSE
         LET c == CreateDataPropertyOrThrow(k.s, O(k.s, f).slots.data, Val(k), a2) IN
         IF IsAbrupt(c) THEN c ELSE Ok(c.s, Undefined)
    [] m = "groupBy" ->
         \* Object.groupBy (§20.1.2.12).
         LET groups == GroupBy(s, a1, a2, "property") IN IF IsAbrupt(groups) THEN groups ELSE
         LET obj == OrdinaryObjectCreate(groups.s, Null) IN
         AddGroups(obj.s, Val(obj), Val(groups))
    [] m = "hasOwn" ->
         \* Object.hasOwn (§20.1.2.13).
         LET o == ToObject(s, a1) IN IF IsAbrupt(o) THEN o ELSE
         LET k == ToPropertyKey(o.s, a2) IN IF IsAbrupt(k) THEN k ELSE HasOwnProperty(k.s, Val(o), Val(k))
    [] m = "is" -> Ok(s, Bool(SameValue(a1, a2)))
    [] m \in {"freeze", "seal", "preventExtensions"} ->
         IF ~IsObject(a1) THEN Ok(s, a1)
         ELSE LET r == IF m = "preventExtensions" THEN PreventExtensions(s, a1)
                       ELSE SetIntegrityLevel(s, a1, IF m = "freeze" THEN "frozen" ELSE "sealed")
              IN IF IsAbrupt(r) THEN r ELSE IF Val(r) = False THEN ThrowTypeError(r.s) ELSE Ok(r.s, a1)
    [] m \in {"isFrozen", "isSealed"} ->
         IF ~IsObject(a1) THEN Ok(s, True) ELSE TestIntegrityLevel(s, a1, IF m = "isFrozen" THEN "frozen" ELSE "sealed")
    [] m = "isExtensible" -> IF ~IsObject(a1) THEN Ok(s, False) ELSE IsExtensible(s, a1)
    [] m = "hasOwnProperty" ->
         LET k == ToPropertyKey(s, a1) IN IF IsAbrupt(k) THEN k ELSE
         LET o == ToObject(k.s, this) IN IF IsAbrupt(o) THEN o ELSE HasOwnProperty(o.s, Val(o), Val(k))
    [] m = "isPrototypeOf" ->
         IF ~IsObject(a1) THEN Ok(s, False)
         ELSE LET o == ToObject(s, this) IN IF IsAbrupt(o) THEN o ELSE PrototypeWalk(o.s, a1, Val(o))
    [] m = "propertyIsEnumerable" ->
         LET k == ToPropertyKey(s, a1) IN IF IsAbrupt(k) THEN k ELSE
         LET o == ToObject(k.s, this) IN IF IsAbrupt(o) THEN o ELSE
         LET d == GetOwnProperty(o.s, Val(o), Val(k)) IN
         IF IsAbrupt(d) THEN d ELSE Ok(d.s, IF Val(d) = Absent THEN False ELSE Val(d).enumerable)
    [] m = "toString" -> ObjectToString(s, this)
    [] m = "toLocaleString" -> Invoke(s, this, SV("toString"), <<>>)
    [] m = "valueOf" -> ToObject(s, this)
    [] m \in {"__defineGetter__", "__defineSetter__"} ->
         \* Object.prototype.__defineGetter__ and __defineSetter__ (§B.2.2.2, §B.2.2.3).
         LET o == ToObject(s, this) IN IF IsAbrupt(o) THEN o
         ELSE IF ~IsCallable(o.s, a2) THEN ThrowTypeError(o.s)
         ELSE LET k == ToPropertyKey(o.s, a1) IN IF IsAbrupt(k) THEN k ELSE
         LET d == IF m = "__defineGetter__"
                  THEN [EmptyDesc EXCEPT !.get = a2, !.enumerable = True, !.configurable = True]
                  ELSE [EmptyDesc EXCEPT !.set = a2, !.enumerable = True, !.configurable = True]
             r == DefinePropertyOrThrow(k.s, Val(o), Val(k), d)
         IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Undefined)
    [] m \in {"__lookupGetter__", "__lookupSetter__"} ->
         \* Object.prototype.__lookupGetter__ and __lookupSetter__ (§B.2.2.4, §B.2.2.5).
         LET o == ToObject(s, this) IN IF IsAbrupt(o) THEN o ELSE
         LET k == ToPropertyKey(o.s, a1) IN IF IsAbrupt(k) THEN k ELSE
         LookupAccessor(k.s, Val(o), Val(k), IF m = "__lookupGetter__" THEN "get" ELSE "set")
    [] m = "getProto" ->
         \* get Object.prototype.__proto__ (§B.2.2.1.1).
         LET o == ToObject(s, this) IN IF IsAbrupt(o) THEN o ELSE GetPrototypeOf(o.s, Val(o))
    [] m = "setProto" ->
         \* set Object.prototype.__proto__ (§B.2.2.1.2).
         LET c == RequireObjectCoercible(s, this) IN IF IsAbrupt(c) THEN c
         ELSE IF (~IsObject(a1) /\ a1 # Null) \/ ~IsObject(this) THEN Ok(s, Undefined)
         ELSE LET r == SetPrototypeOf(s, this, a1) IN
              IF IsAbrupt(r) THEN r ELSE IF Val(r) = False THEN ThrowTypeError(r.s) ELSE Ok(r.s, Undefined)

\* Object.prototype.toString (§20.1.3.6).
ObjectToString(s, this) ==
  IF this = Undefined THEN Ok(s, SV("[object Undefined]"))
  ELSE IF this = Null THEN Ok(s, SV("[object Null]"))
  ELSE LET o == ToObject(s, this) IN
  LET isArray == IsArray(o.s, Val(o)) IN
  IF IsAbrupt(isArray) THEN isArray ELSE
  LET class == O(o.s, Val(o)).class
      builtinTag ==
        CASE Val(isArray) = True -> N("Array")
          [] class = "arguments" \/ (class = "ordinary" /\ "argumentsData" \in DOMAIN O(o.s, Val(o)).slots) -> N("Arguments")
          [] IsCallable(o.s, Val(o)) -> N("Function")
          [] class = "error" -> N("Error")
          [] class = "boolean" -> N("Boolean")
          [] class = "number" -> N("Number")
          [] class = "string" -> N("String")
          [] class = "date" -> N("Date")
          [] class = "regexp" -> N("RegExp")
          [] OTHER -> N("Object")
      tag == Get(isArray.s, Val(o), SymToStringTag)
  IN IF IsAbrupt(tag) THEN tag
     ELSE Ok(tag.s, Str(N("[object ") \o (IF IsString(Val(tag)) THEN Val(tag).value ELSE builtinTag) \o N("]")))

\* ObjectDefineProperties (§20.1.2.3.1).
ObjectDefineProperties(s, o, properties) ==
  LET props == ToObject(s, properties) IN IF IsAbrupt(props) THEN props ELSE
  LET ks == OwnPropertyKeys(props.s, Val(props)) IN IF IsAbrupt(ks) THEN ks ELSE
  LET ds == ReadPropertyDescriptors(ks.s, Val(props), Val(ks), <<>>) IN IF IsAbrupt(ds) THEN ds ELSE
  LET r == DefineAll(ds.s, o, Val(ds)) IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, o)
ReadPropertyDescriptors(s, props, ks, acc) ==
  IF ks = <<>> THEN Ok(s, acc)
  ELSE LET d == GetOwnProperty(s, props, Head(ks)) IN IF IsAbrupt(d) THEN d
  ELSE IF Val(d) = Absent \/ Val(d).enumerable # True THEN ReadPropertyDescriptors(d.s, props, Tail(ks), acc)
  ELSE LET obj == Get(d.s, props, Head(ks)) IN IF IsAbrupt(obj) THEN obj ELSE
  LET desc == ToPropertyDescriptor(obj.s, Val(obj)) IN IF IsAbrupt(desc) THEN desc
  ELSE ReadPropertyDescriptors(desc.s, props, Tail(ks), Append(acc, <<Head(ks), Val(desc)>>))
DefineAll(s, o, pairs) ==
  IF pairs = <<>> THEN Ok(s, Empty)
  ELSE LET r == DefinePropertyOrThrow(s, o, Head(pairs)[1], Head(pairs)[2]) IN
       IF IsAbrupt(r) THEN r ELSE DefineAll(r.s, o, Tail(pairs))

\* Object.assign's loop over its sources (§20.1.2.1).
AssignSources(s, to, sources) ==
  IF sources = <<>> THEN Ok(s, to)
  ELSE IF IsNullish(Head(sources)) THEN AssignSources(s, to, Tail(sources))
  ELSE LET from == ToObject(s, Head(sources)) IN
  LET ks == OwnPropertyKeys(from.s, Val(from)) IN IF IsAbrupt(ks) THEN ks ELSE
  LET r == AssignKeys(ks.s, to, Val(from), Val(ks)) IN IF IsAbrupt(r) THEN r ELSE AssignSources(r.s, to, Tail(sources))
AssignKeys(s, to, from, ks) ==
  IF ks = <<>> THEN Ok(s, Empty)
  ELSE LET d == GetOwnProperty(s, from, Head(ks)) IN IF IsAbrupt(d) THEN d
  ELSE IF Val(d) = Absent \/ Val(d).enumerable # True THEN AssignKeys(d.s, to, from, Tail(ks))
  ELSE LET v == Get(d.s, from, Head(ks)) IN IF IsAbrupt(v) THEN v ELSE
  LET w == Set(v.s, to, Head(ks), Val(v), TRUE) IN IF IsAbrupt(w) THEN w ELSE AssignKeys(w.s, to, from, Tail(ks))

\* Object.getOwnPropertyDescriptors' loop over the keys (§20.1.2.9 step 4).
AddDescriptors(s, o, ks, descriptors) ==
  IF ks = <<>> THEN Ok(s, descriptors)
  ELSE LET d == GetOwnProperty(s, o, Head(ks)) IN IF IsAbrupt(d) THEN d
  ELSE IF Val(d) = Absent THEN AddDescriptors(d.s, o, Tail(ks), descriptors)
  ELSE LET desc == FromPropertyDescriptor(d.s, Val(d))
           c == CreateDataPropertyOrThrow(desc.s, descriptors, Head(ks), Val(desc))
       IN AddDescriptors(c.s, o, Tail(ks), descriptors)

\* Object.groupBy's loop over the groups (§20.1.2.12 step 3).
AddGroups(s, obj, groups) ==
  IF groups = <<>> THEN Ok(s, obj)
  ELSE LET elements == CreateArrayFromList(s, Head(groups).elements)
           c == CreateDataPropertyOrThrow(elements.s, obj, Head(groups).key, Val(elements))
       IN AddGroups(c.s, obj, Tail(groups))

\* The loop of __lookupGetter__ and __lookupSetter__ up the prototype chain, reading the
\* descriptor's field "get" or "set".
LookupAccessor(s, o, k, field) ==
  LET d == GetOwnProperty(s, o, k) IN
  IF IsAbrupt(d) THEN d
  ELSE IF Val(d) # Absent THEN Ok(d.s, IF IsAccessorDescriptor(Val(d)) THEN Val(d)[field] ELSE Undefined)
  ELSE LET p == GetPrototypeOf(d.s, o) IN
       IF IsAbrupt(p) THEN p
       ELSE IF Val(p) = Null THEN Ok(p.s, Undefined)
       ELSE LookupAccessor(p.s, Val(p), k, field)

\* AddEntriesFromIterable (§24.1.1.2).
AddEntriesFromIterable(s, target, iterable, adder) ==
  LET it == GetIterator(s, iterable, "sync") IN
  IF IsAbrupt(it) THEN it ELSE AddEntries(it.s, target, Val(it), adder)
AddEntries(s, target, it, adder) ==
  LET next == IteratorStepValue(s, it) IN
  IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, target)
  ELSE LET item == Val(next).value IN
  IF ~IsObject(item) THEN LET error == ThrowTypeError(next.s) IN IteratorClose(error.s, it, error.c)
  ELSE LET k == Get(next.s, item, SV("0")) IN
  IF IsAbrupt(k) THEN IteratorClose(k.s, it, k.c)
  ELSE LET v == Get(k.s, item, SV("1")) IN
  IF IsAbrupt(v) THEN IteratorClose(v.s, it, v.c)
  ELSE LET status == Call(v.s, adder, target, <<Val(k), Val(v)>>) IN
  IF IsAbrupt(status) THEN IteratorClose(status.s, it, status.c)
  ELSE AddEntries(status.s, target, it, adder)


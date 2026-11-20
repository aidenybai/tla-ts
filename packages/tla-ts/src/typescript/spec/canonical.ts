// The canonical form of ESCore's state at the end of a model's step, as the module ESCanonical,
// whose CanonicalStateOf tla-ts runs natively (see escore-canonical.ts) and TLC runs as written. A
// call leaves behind the objects and environments that nothing reaches any more, and numbers the
// ones it makes in the order it made them, so that states that are equal to JavaScript differ as
// values. The canonical form keeps the realm's objects and environments where they are, drops
// every other one that the realm's objects, the global environments, and the template registry
// don't reach, and numbers the rest in the order a breadth-first walk from those roots visits
// them, which only the graph decides: the realm's changed objects by id, an object's prototype,
// its properties in OrdinaryOwnPropertyKeys order, its private elements and its internal slots,
// an environment's outer one and its bindings by name. A Map's or a Set's deleted entries go, as
// no iterator can read them once a step ends, and so do the buckets of properties that deletes
// emptied, which no lookup tells from a bucket never made. Where a state holds what the walk can't number,
// such as a suspended generator or a pending job, the check stops.
export const CANONICAL_MODULE = String.raw`---- MODULE ESCanonical ----
EXTENDS ESRuntime
\* The objects that a value refers to beyond the r.objects of the realm, and the environments
\* beyond its r.environments, as negative numbers.
ObjectRef(v, r) == IF v.type = "object" /\ v.id > r.objects THEN <<v.id>> ELSE <<>>
MaybeRef(v, r) == IF v = Absent \/ v = Empty THEN <<>> ELSE ObjectRef(v, r)
EnvironmentRef(e, r) == IF e > r.environments THEN <<-e>> ELSE <<>>
ModelStop(what) == Assert(FALSE, "tla-ts can't keep " \o what \o " in a model's state yet")
DescriptorRefs(d, r) == MaybeRef(d.value, r) \o MaybeRef(d.get, r) \o MaybeRef(d.set, r)
\* A private element, or a class element record, whose decorators a model's state never holds.
ElementRefs(e, r) ==
  MaybeRef(e.value, r) \o MaybeRef(e.get, r) \o MaybeRef(e.set, r)
  \o (IF "init" \notin DOMAIN e THEN <<>>
      ELSE IF e.decorators # <<>> \/ e.extra # Empty THEN ModelStop("a decorated class element")
      ELSE MaybeRef(e.init, r) \o ConcatMap(e.initializers, LAMBDA x : MaybeRef(x, r)))
ValueRefs(seq, r) == ConcatMap(seq, LAMBDA x : MaybeRef(x, r))
\* The classes whose slots hold no object or environment, but an ordinary object's initializers.
PlainClasses == {"ordinary", "array", "error", "boolean", "number", "string", "date", "bigint", "symbol", "namespace"}
\* The built-in functions whose data is the cell of a promise's resolving functions or capability.
CellBuiltins == {<<"Promise", "resolveFunction">>, <<"Promise", "rejectFunction">>, <<"Promise", "capabilityExecutor">>}
BuiltinSlots == {"id", "constructor", "data", "realm", "initialName"}
\* The built-in functions whose data is a name, which refers to nothing: the host's that stop.
NamedBuiltins == {<<"Module", "hostStop">>, <<"Module", "hostQuietConstructor">>}
\* The slots of a class's default constructor, a built-in that holds the class's elements.
DefaultConstructorSlots == BuiltinSlots \cup {"ctorKind", "sourceText", "privateMethods", "fields", "initializers"}
SlotRefs(o, r) ==
  CASE o.class \in PlainClasses ->
         IF "initializers" \in DOMAIN o.slots THEN ValueRefs(o.slots.initializers, r) ELSE <<>>
    [] o.class = "function" ->
         EnvironmentRef(o.slots.env, r) \o MaybeRef(o.slots.home, r)
         \o ConcatMap(o.slots.fields, LAMBDA e : ElementRefs(e, r))
         \o ConcatMap(o.slots.privateMethods, LAMBDA e : ElementRefs(e, r))
         \o (IF o.slots.initializers = Empty THEN <<>> ELSE ValueRefs(o.slots.initializers, r))
    [] o.class = "bound" -> ObjectRef(o.slots.target, r) \o MaybeRef(o.slots.this, r) \o ValueRefs(o.slots.args, r)
    [] o.class = "map" ->
         ConcatMap(o.slots.mapData, LAMBDA e : IF e = Empty THEN <<>> ELSE MaybeRef(e.key, r) \o MaybeRef(e.value, r))
    [] o.class = "set" -> ValueRefs(o.slots.setData, r)
    [] o.class \in {"weakMap", "weakSet", "weakRef"} -> <<>>
    \* A registry holds no cell, as the runtime stops where a program registers a target.
    [] o.class = "finalizationRegistry" /\ o.slots.cells = <<>> -> ObjectRef(o.slots.cleanupCallback, r)
    [] o.class = "proxy" -> MaybeRef(o.slots.target, r) \o MaybeRef(o.slots.handler, r)
    [] o.class = "promise" ->
         IF o.slots.state = "pending" THEN ModelStop("a pending promise") ELSE MaybeRef(o.slots.result, r)
    [] o.class = "cell" /\ DOMAIN o.slots = {"promise"} -> MaybeRef(o.slots.promise, r)
    [] o.class = "cell" /\ DOMAIN o.slots = {"resolve", "reject"} -> MaybeRef(o.slots.resolve, r) \o MaybeRef(o.slots.reject, r)
    [] o.class = "builtin" /\ DOMAIN o.slots = BuiltinSlots /\ o.slots.id \in CellBuiltins -> ObjectRef(o.slots.data, r)
    [] o.class = "builtin" /\ DOMAIN o.slots = BuiltinSlots /\ (o.slots.data = Empty \/ o.slots.id \in NamedBuiltins) -> <<>>
    [] o.class = "builtin" /\ DOMAIN o.slots = DefaultConstructorSlots /\ o.slots.id = <<"Class", "default">> ->
         ConcatMap(o.slots.fields, LAMBDA e : ElementRefs(e, r))
         \o ConcatMap(o.slots.privateMethods, LAMBDA e : ElementRefs(e, r))
         \o (IF o.slots.initializers = Empty THEN <<>> ELSE ValueRefs(o.slots.initializers, r))
    [] OTHER -> ModelStop("an object of class " \o o.class)
ObjectRefs(o, r) ==
  MaybeRef(o.proto, r)
  \o ConcatMap(OwnKeysOf(o), LAMBDA k : DescriptorRefs(o.props[PropBucket(k)][k], r))
  \o ConcatMap(o.privs, LAMBDA e : ElementRefs(e, r))
  \o SlotRefs(o, r)
BindingRefs(b, r) == ConcatMap(SortCodeUnits(DOMAIN b), LAMBDA name : MaybeRef(b[name].value, r))
EnvironmentRefs(env, r) ==
  EnvironmentRef(env.outer, r)
  \o CASE env.kind \in {"declarative", "catch"} -> BindingRefs(env.b, r)
       [] env.kind = "function" ->
            BindingRefs(env.b, r) \o MaybeRef(env.this, r) \o ObjectRef(env.fn, r) \o MaybeRef(env.newTarget, r)
       [] env.kind = "object" -> ObjectRef(env.obj, r)
       [] env.kind = "global" -> MaybeRef(env.this, r)
       [] env.kind = "module" -> BindingRefs(env.b, r)
       [] OTHER -> ModelStop("an environment of kind " \o env.kind)
\* What a module record refers to: its environment, its namespaces, its import.meta, a synthetic
\* module's value, its module source, the capability of its evaluation, and what it threw.
ModuleRefs(m, r) ==
  (IF m.env = 0 THEN <<>> ELSE EnvironmentRef(m.env, r))
  \o MaybeRef(m.namespace, r) \o MaybeRef(m.deferredNamespace, r) \o MaybeRef(m.meta, r)
  \o MaybeRef(m.value, r) \o MaybeRef(m.moduleSource, r) \o MaybeRef(m.error, r)
  \o (IF m.capability = Empty THEN <<>>
      ELSE ObjectRef(m.capability.promise, r) \o MaybeRef(m.capability.resolve, r) \o MaybeRef(m.capability.reject, r))
NodeRefs(s, n, r) == IF n > 0 THEN ObjectRefs(HeapGet(s.objs, n), r) ELSE EnvironmentRefs(HeapGet(s.envs, -n), r)
\* The realm's objects that differ from the realm's start, by id, which a page equal to its start
\* holds none of.
ChangedRealmObjects(s, initial) ==
  LET count == initial.objs.size IN
  ConcatMap([p \in 1..Len(initial.objs.pages) |-> p], LAMBDA p :
    IF s.objs.pages[p] = initial.objs.pages[p] THEN <<>>
    ELSE LET low == (p - 1) * HeapPageSize
             high == IF p * HeapPageSize < count THEN p * HeapPageSize ELSE count
         IN SelectSeq([i \in 1..(high - low) |-> low + i],
                      LAMBDA i : HeapGet(s.objs, i) # HeapGet(initial.objs, i)))
\* The objects and environments that the queue reaches, in the order of the walk, and their new
\* numbers: objects after the realm's, and environments after the realm's.
RECURSIVE CanonicalWalk(_, _, _, _)
CanonicalWalk(s, queue, walk, r) ==
  IF queue = <<>> THEN walk
  ELSE LET n == Head(queue) IN
       IF n \in DOMAIN walk.number THEN CanonicalWalk(s, Tail(queue), walk, r)
       ELSE LET isObject == n > 0
                number == IF isObject THEN r.objects + walk.objects + 1 ELSE r.environments + walk.environments + 1
            IN CanonicalWalk(s, Tail(queue) \o NodeRefs(s, n, r),
                             [number |-> (n :> number) @@ walk.number,
                              order |-> Append(walk.order, n),
                              objects |-> walk.objects + (IF isObject THEN 1 ELSE 0),
                              environments |-> walk.environments + (IF isObject THEN 0 ELSE 1)],
                             r)
\* Whether the walk reached an object that a WeakMap or a WeakSet holds as a key, which a step can
\* still read the entry by. An entry whose key nothing else reaches no code can read once the step
\* ends, so the canonical form drops it, as the host's collector may.
IsWeakKeyReached(k, number, r) ==
  IF k.type # "object" THEN ModelStop("a weak collection keyed by a symbol")
  ELSE k.id <= r.objects \/ k.id \in DOMAIN number
WeakKeyNumber(k, number, r) == IF k.id <= r.objects THEN k.id ELSE number[k.id]
\* The objects that the values of the walked WeakMaps' reached entries refer to, by the walk's order
\* of the WeakMaps and each one's keys by their new numbers.
WeakEntryRefs(s, walk, r) ==
  ConcatMap(SelectSeq(walk.order, LAMBDA n : n > 0), LAMBDA n :
    LET o == HeapGet(s.objs, n) IN
    IF o.class # "weakMap" THEN <<>>
    ELSE LET data == o.slots.weakMapData
             keys == {k \in DOMAIN data : IsWeakKeyReached(k, walk.number, r)}
         IN ConcatMap(SortInts({WeakKeyNumber(k, walk.number, r) : k \in keys}), LAMBDA i :
              MaybeRef(data[CHOOSE k \in keys : WeakKeyNumber(k, walk.number, r) = i], r)))
\* The walk, then again from the objects that the reached entries of its WeakMaps refer to, until
\* it reaches no more.
RECURSIVE CanonicalClosure(_, _, _)
CanonicalClosure(s, walk, r) ==
  LET more == SelectSeq(WeakEntryRefs(s, walk, r), LAMBDA n : n \notin DOMAIN walk.number)
  IN IF more = <<>> THEN walk ELSE CanonicalClosure(s, CanonicalWalk(s, more, walk, r), r)
RenameValue(v, number, r) == IF v.type = "object" /\ v.id > r.objects THEN Obj(number[v.id]) ELSE v
RenameMaybe(v, number, r) == IF v = Absent \/ v = Empty THEN v ELSE RenameValue(v, number, r)
RenameEnvironment(e, number, r) == IF e > r.environments THEN number[-e] ELSE e
RenameValues(seq, number, r) == [i \in DOMAIN seq |-> RenameMaybe(seq[i], number, r)]
RenameDescriptor(d, number, r) ==
  [d EXCEPT !.value = RenameMaybe(@, number, r), !.get = RenameMaybe(@, number, r), !.set = RenameMaybe(@, number, r)]
RenameElement(e, number, r) ==
  LET renamed == [e EXCEPT !.value = RenameMaybe(@, number, r), !.get = RenameMaybe(@, number, r), !.set = RenameMaybe(@, number, r)]
  IN IF "init" \in DOMAIN e
     THEN [renamed EXCEPT !.init = RenameMaybe(@, number, r), !.initializers = RenameValues(@, number, r)]
     ELSE renamed
RenameElements(seq, number, r) == [i \in DOMAIN seq |-> RenameElement(seq[i], number, r)]
\* An error's captured stack holds the calls that made it, which a model's state keeps none of: its
\* stack can't be read once the step that made it ends.
RenameSlots(o, number, r) ==
  CASE o.class \in PlainClasses ->
         LET slots == IF "trace" \in DOMAIN o.slots THEN [o.slots EXCEPT !.trace = [dropped |-> TRUE]] ELSE o.slots
         IN IF "initializers" \in DOMAIN slots THEN [slots EXCEPT !.initializers = RenameValues(@, number, r)] ELSE slots
    [] o.class = "function" ->
         [o.slots EXCEPT !.env = RenameEnvironment(@, number, r), !.home = RenameMaybe(@, number, r),
                         !.fields = RenameElements(@, number, r),
                         !.privateMethods = RenameElements(@, number, r),
                         !.initializers = IF @ = Empty THEN @ ELSE RenameValues(@, number, r)]
    [] o.class = "bound" ->
         [o.slots EXCEPT !.target = RenameValue(@, number, r), !.this = RenameMaybe(@, number, r), !.args = RenameValues(@, number, r)]
    [] o.class = "map" ->
         [o.slots EXCEPT !.mapData = LET kept == SelectSeq(@, LAMBDA e : e # Empty)
                                     IN [i \in DOMAIN kept |-> [key |-> RenameMaybe(kept[i].key, number, r), value |-> RenameMaybe(kept[i].value, number, r)]]]
    [] o.class = "set" -> [o.slots EXCEPT !.setData = RenameValues(SelectSeq(@, LAMBDA e : e # Empty), number, r)]
    [] o.class = "weakMap" ->
         LET data == o.slots.weakMapData
             keys == {k \in DOMAIN data : IsWeakKeyReached(k, number, r)}
         IN [o.slots EXCEPT !.weakMapData =
               [k \in {RenameValue(x, number, r) : x \in keys} |->
                  RenameMaybe(data[CHOOSE x \in keys : RenameValue(x, number, r) = k], number, r)]]
    [] o.class = "weakRef" ->
         IF IsWeakKeyReached(o.slots.weakRefTarget, number, r)
         THEN [o.slots EXCEPT !.weakRefTarget = RenameValue(@, number, r)]
         ELSE ModelStop("a WeakRef whose target nothing else reaches")
    [] o.class = "finalizationRegistry" -> [o.slots EXCEPT !.cleanupCallback = RenameValue(@, number, r)]
    [] o.class = "weakSet" ->
         [o.slots EXCEPT !.weakSetData =
            {RenameValue(x, number, r) : x \in {k \in @ : IsWeakKeyReached(k, number, r)}}]
    [] o.class = "proxy" -> [o.slots EXCEPT !.target = RenameMaybe(@, number, r), !.handler = RenameMaybe(@, number, r)]
    [] o.class = "promise" -> [o.slots EXCEPT !.result = RenameMaybe(@, number, r)]
    [] o.class = "cell" ->
         IF DOMAIN o.slots = {"promise"} THEN [o.slots EXCEPT !.promise = RenameMaybe(@, number, r)]
         ELSE [o.slots EXCEPT !.resolve = RenameMaybe(@, number, r), !.reject = RenameMaybe(@, number, r)]
    [] o.class = "builtin" /\ o.slots.id = <<"Class", "default">> /\ "fields" \in DOMAIN o.slots ->
         [o.slots EXCEPT !.fields = RenameElements(@, number, r), !.privateMethods = RenameElements(@, number, r),
                         !.initializers = IF @ = Empty THEN @ ELSE RenameValues(@, number, r)]
    [] o.class = "builtin" -> IF o.slots.id \in CellBuiltins THEN [o.slots EXCEPT !.data = RenameValue(@, number, r)] ELSE o.slots
RenameObject(o, number, r) ==
  [o EXCEPT !.proto = RenameMaybe(@, number, r),
            !.props = [b \in {c \in DOMAIN @ : DOMAIN @[c] # {}} |-> [k \in DOMAIN @[b] |-> RenameDescriptor(@[b][k], number, r)]],
            !.privs = RenameElements(@, number, r),
            !.slots = RenameSlots(o, number, r)]
RenameBindings(b, number, r) == [name \in DOMAIN b |-> [b[name] EXCEPT !.value = RenameMaybe(@, number, r)]]
RenameEnvironmentRecord(env, number, r) ==
  LET outer == [env EXCEPT !.outer = RenameEnvironment(@, number, r)] IN
  CASE env.kind \in {"declarative", "catch", "module"} -> [outer EXCEPT !.b = RenameBindings(@, number, r)]
    [] env.kind = "function" ->
         [outer EXCEPT !.b = RenameBindings(@, number, r), !.this = RenameMaybe(@, number, r),
                       !.fn = RenameValue(@, number, r), !.newTarget = RenameMaybe(@, number, r)]
    [] env.kind = "object" -> [outer EXCEPT !.obj = RenameValue(@, number, r)]
    [] env.kind = "global" -> [outer EXCEPT !.this = RenameMaybe(@, number, r)]
RenameModule(m, number, r) ==
  [m EXCEPT !.env = IF @ = 0 THEN 0 ELSE RenameEnvironment(@, number, r),
            !.namespace = RenameMaybe(@, number, r), !.deferredNamespace = RenameMaybe(@, number, r),
            !.meta = RenameMaybe(@, number, r), !.value = RenameMaybe(@, number, r),
            !.moduleSource = RenameMaybe(@, number, r), !.error = RenameMaybe(@, number, r),
            !.capability = IF @ = Empty THEN @
                           ELSE [promise |-> RenameValue(@.promise, number, r), resolve |-> RenameMaybe(@.resolve, number, r),
                                 reject |-> RenameMaybe(@.reject, number, r)]]
RECURSIVE RenameObjectsIn(_, _, _, _)
RenameObjectsIn(h, ids, number, r) ==
  IF ids = <<>> THEN h ELSE RenameObjectsIn(HeapSet(h, Head(ids), RenameObject(HeapGet(h, Head(ids)), number, r)), Tail(ids), number, r)
RECURSIVE RenameEnvironmentsIn(_, _, _, _)
RenameEnvironmentsIn(h, ids, number, r) ==
  IF ids = <<>> THEN h ELSE RenameEnvironmentsIn(HeapSet(h, Head(ids), RenameEnvironmentRecord(HeapGet(h, Head(ids)), number, r)), Tail(ids), number, r)
\* The canonical form of the state s that a step ends in, whose jobs, timers, and calls all ended,
\* of a realm whose start is the state initial.
CanonicalStateOf(s, initial) ==
  IF s.jobs # <<>> \/ s.timers # <<>> \/ s.callers # Null \/ Len(s.realms) > 1 \/ s.waiters # <<>> \/ s.disposables # <<>>
  THEN ModelStop("pending work")
  ELSE IF s.required # <<>> THEN ModelStop("a module that require loaded")
  ELSE
  LET r == [objects |-> initial.objs.size, environments |-> initial.envs.size]
      changed == ChangedRealmObjects(s, initial)
      roots == ConcatMap([e \in 1..r.environments |-> e], LAMBDA e : EnvironmentRefs(HeapGet(s.envs, e), r))
               \o ConcatMap(changed, LAMBDA i : ObjectRefs(HeapGet(s.objs, i), r))
               \o ConcatMap(SortInts(DOMAIN s.templates), LAMBDA k : ObjectRef(s.templates[k], r))
               \o ConcatMap(s.modules, LAMBDA m : ModuleRefs(m, r))
      walk == CanonicalClosure(s, CanonicalWalk(s, roots, [number |-> <<>>, order |-> <<>>, objects |-> 0, environments |-> 0], r), r)
      number == walk.number
      objects == SelectSeq(walk.order, LAMBDA n : n > 0)
      environments == SelectSeq(walk.order, LAMBDA n : n < 0)
      realmObjects == RenameObjectsIn(HeapTruncate(s.objs, r.objects), changed, number, r)
      realmEnvironments == RenameEnvironmentsIn(HeapTruncate(s.envs, r.environments), [e \in 1..r.environments |-> e], number, r)
      envs == HeapAppendFrom(realmEnvironments, [i \in DOMAIN environments |-> RenameEnvironmentRecord(HeapGet(s.envs, -environments[i]), number, r)], 1)
  IN [s EXCEPT
        !.objs = HeapAppendFrom(realmObjects, [i \in DOMAIN objects |-> RenameObject(HeapGet(s.objs, objects[i]), number, r)], 1),
        !.envs = envs,
        !.envsHeld = envs.size,
        !.templates = [k \in DOMAIN @ |-> RenameValue(@[k], number, r)],
        !.modules = [i \in DOMAIN @ |-> RenameModule(@[i], number, r)],
        !.hoisted = {<<RenameEnvironment(pair[1], number, r), pair[2]>> : pair \in {p \in @ : p[1] <= r.environments \/ -p[1] \in DOMAIN number}},
        !.out = <<>>]
====
`;

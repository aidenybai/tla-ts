import ts from "@typescript/typescript6";
import { foldNames } from "./library";

// A model's state lowered out of ESCore's heap: the value of each module-level binding that
// isn't a function, as a record of the bindings' names. A primitive is ESCore's own value, and an
// object that only holds data a TLA+ value of its own:
//   [type |-> "lobject", keys |-> <<units>>, vals |-> [units -> value]]
//     an ordinary object of %Object.prototype%, extensible, with keys in OrdinaryOwnPropertyKeys
//     order, each a writable, enumerable, and configurable data property;
//   [type |-> "larray", elems |-> <<value>>]
//     an array of %Array.prototype% with no holes and no properties but its elements and length;
//   [type |-> "lset", elems |-> <<value>>] and [type |-> "lmap", keys |-> <<value>>, vals |-> <<value>>]
//     a Set or a Map of its prototype with no properties, whose entries are in insertion order.
// No object is reached twice. ModelBase is the canonical state after the module's top level, with
// those bindings undefined: the realm and the functions, which no step changes. A step
// materializes the record into ModelBase, runs ESCore, and lowers the bindings back, where each
// object must be the one that materializing its lowered value makes, and ModelBase unchanged, so
// that a lowered state and the canonical heap it stands for are one to one.
export const LOWERED_DEFINITIONS =
  foldNames(String.raw`LowerStop(what) == Assert(FALSE, "tla-ts can't keep " \o what \o " in a model's lowered state yet")
RECURSIVE KeyedValues(_, _)
KeyedValues(keys, values) == IF keys = <<>> THEN <<>> ELSE (Head(keys) :> Head(values)) @@ KeyedValues(Tail(keys), Tail(values))
LObj(keys, values) == [type |-> "lobject", keys |-> keys, vals |-> KeyedValues(keys, values)]
\* The objects a value lowers to, made in the state s: [s, v].
RECURSIVE MaterializeValue(_, _)
RECURSIVE MaterializeList(_, _)
MaterializeList(s, list) ==
  IF list = <<>> THEN [s |-> s, args |-> <<>>]
  ELSE LET head == MaterializeValue(s, Head(list))
           rest == MaterializeList(head.s, Tail(list))
       IN [s |-> rest.s, args |-> <<head.v>> \o rest.args]
\* The symmetric values that a lowered set, map's keys, or object's keys holds, in their declared
\* order, which no step of a symmetric model reads.
SymmetricIn(set) == SelectSeq(SymmetricOrder, LAMBDA m : m \in set)
MaterializeValue(s, v) ==
  CASE v.type = "lsymmetric" -> [s |-> s, v |-> Str(SymmetricUnits(v.value))]
    [] v.type = "lsymobject" ->
         LET keys == SymmetricIn(DOMAIN v.vals)
             e == MaterializeList(s, [i \in DOMAIN keys |-> v.vals[keys[i]]])
         IN NewRecord(e.s, [i \in DOMAIN keys |-> <<Str(SymmetricUnits(keys[i])), e.args[i]>>])
    [] v.type = "lsymset" ->
         LET elems == SymmetricIn(v.elems) IN
         NewSet(s, [i \in DOMAIN elems |-> Str(SymmetricUnits(elems[i]))])
    [] v.type = "lsymmap" ->
         LET keys == SymmetricIn(DOMAIN v.vals)
             e == MaterializeList(s, [i \in DOMAIN keys |-> v.vals[keys[i]]])
         IN NewMap(e.s, [i \in DOMAIN keys |-> [key |-> Str(SymmetricUnits(keys[i])), value |-> e.args[i]]])
    [] v.type = "lobject" ->
         LET e == MaterializeList(s, [i \in DOMAIN v.keys |-> v.vals[v.keys[i]]])
         IN NewRecord(e.s, [i \in DOMAIN v.keys |-> <<Str(v.keys[i]), e.args[i]>>])
    [] v.type = "larray" -> LET e == MaterializeList(s, v.elems) IN NewArray(e.s, e.args)
    [] v.type = "lset" -> LET e == MaterializeList(s, v.elems) IN NewSet(e.s, e.args)
    [] v.type = "lmap" ->
         LET k == MaterializeList(s, v.keys)
             e == MaterializeList(k.s, v.vals)
         IN NewMap(e.s, [i \in DOMAIN v.keys |-> [key |-> k.args[i], value |-> e.args[i]]])
    [] OTHER -> [s |-> s, v |-> v]
\* An object as the canonical form keeps it: without the buckets that deletes emptied, or a Set's
\* or a Map's deleted entries.
NormalObject(o) ==
  LET kept == [o EXCEPT !.props = [b \in {c \in DOMAIN @ : DOMAIN @[c] # {}} |-> @[b]]] IN
  CASE o.class = "set" -> [kept EXCEPT !.slots.setData = SelectSeq(@, LAMBDA e : e # Empty)]
    [] o.class = "map" -> [kept EXCEPT !.slots.mapData = SelectSeq(@, LAMBDA e : e # Empty)]
    [] OTHER -> kept
\* The lowered value of v in s and the ids of the objects it reaches, in order: [v, ids].
RECURSIVE LowerValue(_, _, _)
RECURSIVE LowerList(_, _, _)
LowerList(s, list, depth) ==
  IF list = <<>> THEN [vs |-> <<>>, ids |-> <<>>]
  ELSE LET head == LowerValue(s, Head(list), depth)
           rest == LowerList(s, Tail(list), depth)
       IN [vs |-> <<head.v>> \o rest.vs, ids |-> head.ids \o rest.ids]
DataOf(o, k) == o.props[PropBucket(k)][k].value
\* Whether a value is a symmetric value's string.
IsSymmetric(v) == v.type = "string" /\ SymmetricOf(v.value) # Empty
LowerValue(s, v, depth) ==
  IF IsSymmetric(v) THEN [v |-> [type |-> "lsymmetric", value |-> SymmetricOf(v.value)], ids |-> <<>>]
  ELSE IF v.type # "object" THEN [v |-> v, ids |-> <<>>]
  ELSE IF depth > 64 THEN LowerStop("an object that holds itself")
  ELSE
  LET o == NormalObject(O(s, v)) IN
  CASE o.class = "ordinary" ->
         LET keys == OwnKeysOf(o)
             raw == [i \in DOMAIN keys |-> DataOf(o, keys[i])]
         IN IF \E i \in DOMAIN keys : ~IsString(keys[i]) THEN LowerStop("an object with a symbol key")
            ELSE IF o # WithDataProps(MakeObject(Intrinsic(s, "ObjectPrototype"), "ordinary", [none |-> TRUE]),
                                      [i \in DOMAIN keys |-> <<keys[i], raw[i]>>])
            THEN LowerStop("an object other than one of data properties")
            ELSE LET e == LowerList(s, raw, depth + 1)
                     symmetric == {i \in DOMAIN keys : IsSymmetric(keys[i])}
                 IN IF symmetric = {} THEN [v |-> LObj([i \in DOMAIN keys |-> keys[i].value], e.vs), ids |-> <<v.id>> \o e.ids]
                    ELSE IF symmetric # DOMAIN keys THEN LowerStop("an object of a symmetric value's key and another key")
                    ELSE [v |-> [type |-> "lsymobject", vals |-> [m \in {SymmetricOf(keys[i].value) : i \in DOMAIN keys} |->
                                   e.vs[CHOOSE i \in DOMAIN keys : SymmetricOf(keys[i].value) = m]]],
                          ids |-> <<v.id>> \o e.ids]
    [] o.class = "array" ->
         LET length == DataOf(o, SV("length"))
             n == NumToInt(length.value)
             key(i) == Str(NumToString(NumFromInt(i - 1)))
         IN IF ~NumIsIntegral(length.value) \/ ~NumFitsInt(length.value) \/ n > 65536
               \/ \E i \in 1..n : ~HasProp(o, key(i))
            THEN LowerStop("an array with holes")
            ELSE LET raw == [i \in 1..n |-> DataOf(o, key(i))]
                     shape == [AddIndexProps(PutProp(MakeObject(Intrinsic(s, "ArrayPrototype"), "array", [none |-> TRUE]),
                                                     SV("length"), DataDesc(IntV(0), TRUE, FALSE, FALSE)), raw, 1)
                               EXCEPT !.props[NamedBucket][SV("length")].value = IntV(n)]
                 IN IF o # shape THEN LowerStop("an array other than one of data elements")
                    ELSE LET e == LowerList(s, raw, depth + 1)
                         IN [v |-> [type |-> "larray", elems |-> e.vs], ids |-> <<v.id>> \o e.ids]
    [] o.class = "set" ->
         IF o # MakeObject(Intrinsic(s, "SetPrototype"), "set", [setData |-> o.slots.setData])
         THEN LowerStop("a Set with properties")
         ELSE LET e == LowerList(s, o.slots.setData, depth + 1)
                  symmetric == {i \in DOMAIN o.slots.setData : IsSymmetric(o.slots.setData[i])}
              IN IF symmetric = {} \/ o.slots.setData = <<>> THEN [v |-> [type |-> "lset", elems |-> e.vs], ids |-> <<v.id>> \o e.ids]
                 ELSE IF symmetric # DOMAIN o.slots.setData THEN LowerStop("a Set of a symmetric value and another value")
                 ELSE [v |-> [type |-> "lsymset", elems |-> {e.vs[i].value : i \in DOMAIN e.vs}], ids |-> <<v.id>> \o e.ids]
    [] o.class = "map" ->
         IF o # MakeObject(Intrinsic(s, "MapPrototype"), "map", [mapData |-> o.slots.mapData])
         THEN LowerStop("a Map with properties")
         ELSE LET entries == o.slots.mapData
                  k == LowerList(s, [i \in DOMAIN entries |-> entries[i].key], depth + 1)
                  e == LowerList(s, [i \in DOMAIN entries |-> entries[i].value], depth + 1)
                  symmetric == {i \in DOMAIN entries : IsSymmetric(entries[i].key)}
              IN IF symmetric = {} \/ entries = <<>> THEN [v |-> [type |-> "lmap", keys |-> k.vs, vals |-> e.vs], ids |-> <<v.id>> \o k.ids \o e.ids]
                 ELSE IF symmetric # DOMAIN entries THEN LowerStop("a Map of a symmetric value's key and another key")
                 ELSE [v |-> [type |-> "lsymmap", vals |-> [m \in {k.vs[i].value : i \in DOMAIN entries} |->
                                e.vs[CHOOSE i \in DOMAIN entries : k.vs[i].value = m]]],
                       ids |-> <<v.id>> \o k.ids \o e.ids]
    [] OTHER -> LowerStop("an object of class " \o o.class)
\* Whether a step's state s left base as it was, but for the bindings the model lowers, whose
\* declarative environment, at e, is env without them: every object and environment of base, and
\* every other part of the state.
BaseKept(base, e, s, env) ==
  /\ [s EXCEPT !.objs = base.objs, !.envs = base.envs, !.envsHeld = base.envsHeld,
               !.written = base.written, !.writeMark = base.writeMark, !.out = base.out] = base
  /\ env = E(base, e)
  /\ \A i \in 1..base.envs.size : i = e \/ HeapGet(s.envs, i) = HeapGet(base.envs, i)
  /\ \A p \in DOMAIN base.objs.pages :
       LET page == base.objs.pages[p] IN
       IF Len(s.objs.pages[p]) = Len(page) THEN s.objs.pages[p] = page ELSE SubSeq(s.objs.pages[p], 1, Len(page)) = page`);

// The reserved words of TLA+, which name no field of the lowered state's record.
const TLA_WORDS = new Set(
  "ASSUME ASSUMPTION AXIOM BOOLEAN CASE CHOOSE CONSTANT CONSTANTS DOMAIN ELSE ENABLED EXCEPT EXTENDS IF IN INSTANCE LET LOCAL MODULE OTHER STRING SUBSET THEN THEOREM UNCHANGED UNION VARIABLE VARIABLES WITH WF_ SF_ LAMBDA TRUE FALSE".split(
    " ",
  ),
);

// The module-level bindings a model's state lowers, in the order the module declares them, or
// undefined where the module's top level does more than declare them and functions, as it must
// for ModelBase to be the same in every state: no initializer reads a binding that the initial
// state chooses or calls a function the module declares.
export const getLoweredBindings = (file: ts.SourceFile, chosen: ReadonlySet<string>) => {
  const functions = new Set<string>();
  const bindings: { name: string; initializer: ts.Expression | undefined }[] = [];
  const isFunction = (node: ts.Expression | undefined) =>
    node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      functions.add(statement.name.text);
      continue;
    }
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) continue;
    // A declare binds nothing when the module runs, so the module's state stays on the heap, where
    // reading the binding throws as in Node.
    if (
      !ts.isVariableStatement(statement) ||
      (statement.declarationList.flags & ts.NodeFlags.BlockScoped) === 0 ||
      (ts
        .getModifiers(statement)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword) ??
        false)
    ) {
      return undefined;
    }
    const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) return undefined;
      const name = declaration.name.text;
      if (isFunction(declaration.initializer)) {
        if (!isConst) return undefined;
        functions.add(name);
      } else {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || TLA_WORDS.has(name)) return undefined;
        bindings.push({ name, initializer: declaration.initializer });
      }
    }
  }
  // An error a module keeps holds the calls that made it, which no lowered value does, so a
  // module that names an error or catches one keeps its state on the heap.
  const isErring = (node: ts.Node): boolean =>
    ts.isCatchClause(node) ||
    (ts.isIdentifier(node) && node.text.endsWith("Error")) ||
    (ts.forEachChild(node, isErring) ?? false);
  if (isErring(file)) return undefined;
  const isReading = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) && (chosen.has(node.text) || functions.has(node.text))) ||
    ts.isClassLike(node) ||
    (ts.forEachChild(node, isReading) ?? false);
  return bindings.some(
    (binding) => binding.initializer !== undefined && isReading(binding.initializer),
  ) || bindings.length === 0
    ? undefined
    : bindings.map((binding) => binding.name);
};

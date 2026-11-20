import ts from "@typescript/typescript6";
import { foldNames } from "./library";
import { getNumber } from "./specialize";

// A lowered model's functions run on the lowered state itself where they can (see lowered.ts):
// each syntax node gives ESCore's evaluation rule for it, specialized to the lowered values its
// operands hold. A rule holds only where its operands are what it expects, such as an ordinary
// object's own data property or an index within an array, and gives LBail otherwise, which every
// later rule passes on, so that the call gives LBail and runs on ESCore instead, from the state it
// started in. A call gives [type |-> "ok", m, w, v]: the lowered state, whether it wrote what
// existed before it, as SetO and SetE tell ESCore's step, and the value it returns. A composite
// value that a call stores or passes is one that an object or array literal just made, and LBail
// otherwise, so that no two places hold one object.
export const NATIVE_MODULE = foldNames(String.raw`---- MODULE ESNative ----
EXTENDS ESRuntime
LBail == [type |-> "bail"]
IsLComposite(v) == v.type \in {"lobject", "larray", "lset", "lmap"}
LIsPrimitive(v) == v.type \in {"undefined", "null", "boolean", "number", "string"}
\* A value that a call stores or passes, which mustn't be an object the state holds.
LOwn(v) == IF IsLComposite(v) THEN LBail ELSE v
LTruthy(v) == IF IsLComposite(v) THEN TRUE ELSE ToBooleanValue(v)
LNot(v) == IF v.type = "bail" THEN v ELSE Bool(~LTruthy(v))
LValue(r) == IF r.type = "bail" THEN r ELSE r.v
LNumber(v) == v.type = "number"
\* [[Get]] of an own data property, an array's length, and the size of a Set or a Map.
LGet(v, k) ==
  CASE v.type = "lobject" -> IF k \in DOMAIN v.vals THEN v.vals[k] ELSE LBail
    [] v.type = "larray" /\ k = N("length") -> IntV(Len(v.elems))
    [] v.type = "lset" /\ k = N("size") -> IntV(Len(v.elems))
    [] v.type = "lmap" /\ k = N("size") -> IntV(Len(v.keys))
    [] OTHER -> LBail
LIsIndex(v, i, n) == i.type = "number" /\ i.value.k = "int" /\ i.value.i >= 0 /\ i.value.i < n
LIndex(v, i) ==
  CASE v.type = "larray" /\ LIsIndex(v, i, Len(v.elems)) -> v.elems[i.value.i + 1]
    [] v.type = "lobject" /\ i.type = "string" -> IF i.value \in DOMAIN v.vals THEN v.vals[i.value] ELSE LBail
    [] OTHER -> LBail
LArith(op, a, b) ==
  IF LNumber(a) /\ LNumber(b) THEN Num(NumberOperation(a.value, op, b.value))
  ELSE IF op = "+" /\ a.type = "string" /\ b.type = "string" THEN Str(a.value \o b.value)
  ELSE LBail
LRelation(op, a, b) == IF LNumber(a) /\ LNumber(b) THEN NumberRelation(a.value, op, b.value) ELSE LBail
LStrict(a, b) ==
  IF LIsPrimitive(a) /\ LIsPrimitive(b) THEN Bool(IsStrictlyEqual(a, b))
  ELSE IF (LIsPrimitive(a) /\ IsLComposite(b)) \/ (IsLComposite(a) /\ LIsPrimitive(b)) THEN False
  ELSE LBail
LLoose(a, b) ==
  IF LIsPrimitive(a) /\ LIsPrimitive(b) /\ a.type = b.type THEN Bool(IsStrictlyEqual(a, b))
  ELSE IF a.type \in {"undefined", "null"} /\ b.type \in {"undefined", "null"} THEN True
  ELSE LBail
LNegate(v) == IF LNumber(v) THEN Num(NumUnaryMinus(v.value)) ELSE LBail
LPlus(v) == IF LNumber(v) THEN v ELSE LBail
LIncrement(v, d) == IF LNumber(v) THEN Num(NumAdd(v.value, NumFromInt(d))) ELSE LBail
LEmptyObject == [type |-> "lobject", keys |-> <<>>, vals |-> <<>>]
\* CreateDataProperty on an ordinary object, which keeps a key where it was, or adds it last.
LPut(o, k, v) ==
  IF o.type # "lobject" \/ v.type = "bail" THEN LBail
  ELSE IF k \in DOMAIN o.vals THEN [o EXCEPT !.vals[k] = v]
  ELSE [o EXCEPT !.keys = Append(@, k), !.vals = @ @@ (k :> v)]
RECURSIVE LCopyKeys(_, _, _)
LCopyKeys(o, a, keys) == IF keys = <<>> THEN o ELSE LCopyKeys(LPut(o, Head(keys), LOwn(a.vals[Head(keys)])), a, Tail(keys))
\* CopyDataProperties from a primitive, which gives no keys but a string's, or from an object.
LSpread(o, a) ==
  CASE o.type # "lobject" -> LBail
    [] a.type \in {"undefined", "null", "boolean", "number"} -> o
    [] a.type = "lobject" /\ \A i \in DOMAIN a.keys : ~IsLComposite(a.vals[a.keys[i]]) ->
         IF o.keys = <<>> THEN a
         ELSE IF \E i \in DOMAIN a.keys : IsArrayIndexUnits(a.keys[i]) THEN LBail
         ELSE LCopyKeys(o, a, a.keys)
    [] OTHER -> LBail
LArray(list) == IF \E i \in DOMAIN list : list[i].type = "bail" THEN LBail ELSE [type |-> "larray", elems |-> list]
\* The elements that a spread of an array or a Set gives an array literal, in the order their
\* iterators give them, which must be primitives, or <<LBail>>.
LSpreadElems(v) ==
  IF v.type \in {"larray", "lset"} /\ \A i \in DOMAIN v.elems : ~IsLComposite(v.elems[i]) THEN v.elems
  ELSE <<LBail>>
\* PutValue of a property: an ordinary object's own data property or a new one that no prototype
\* sets, or an array's element within it or just after it.
LAssign(c, k, v) ==
  CASE v.type = "bail" -> LBail
    [] c.type = "lobject" /\ k.type = "string" ->
         IF k.value \in DOMAIN c.vals \/ (~IsArrayIndexUnits(k.value) /\ k.value # N("__proto__")) THEN LPut(c, k.value, v) ELSE LBail
    [] c.type = "larray" /\ LIsIndex(c, k, Len(c.elems) + 1) ->
         IF k.value.i = Len(c.elems) THEN [c EXCEPT !.elems = Append(@, v)] ELSE [c EXCEPT !.elems[k.value.i + 1] = v]
    [] OTHER -> LBail
\* The built-in methods on a lowered receiver, as [c, v]: the receiver after the call and its result,
\* each LBail where the call bails.
LMethod(c, m, args) ==
  LET a == IF args = <<>> THEN Undefined ELSE args[1] IN
  CASE \E i \in DOMAIN args : args[i].type = "bail" \/ (IsLComposite(args[i]) /\ m # "push") -> [c |-> LBail, v |-> LBail]
    [] c.type = "larray" /\ m = "push" -> [c |-> [c EXCEPT !.elems = @ \o args], v |-> IntV(Len(c.elems) + Len(args))]
    [] c.type = "larray" /\ m = "pop" ->
         IF c.elems = <<>> THEN [c |-> c, v |-> Undefined] ELSE [c |-> [c EXCEPT !.elems = SubSeq(@, 1, Len(@) - 1)], v |-> c.elems[Len(c.elems)]]
    [] c.type = "larray" /\ m = "shift" ->
         IF c.elems = <<>> THEN [c |-> c, v |-> Undefined] ELSE [c |-> [c EXCEPT !.elems = Tail(@)], v |-> Head(c.elems)]
    [] c.type = "larray" /\ m = "includes" /\ Len(args) = 1 -> [c |-> c, v |-> Bool(KeyIndex(c.elems, a) # 0)]
    [] c.type = "lset" /\ m = "has" -> [c |-> c, v |-> Bool(KeyIndex(c.elems, a) # 0)]
    [] c.type = "lset" /\ m = "add" ->
         [c |-> IF KeyIndex(c.elems, a) # 0 THEN c ELSE [c EXCEPT !.elems = Append(@, CanonicalizeKeyedCollectionKey(a))], v |-> c]
    [] c.type = "lset" /\ m = "delete" ->
         LET i == KeyIndex(c.elems, a) IN
         IF i = 0 THEN [c |-> c, v |-> False]
         ELSE [c |-> [c EXCEPT !.elems = SubSeq(@, 1, i - 1) \o SubSeq(@, i + 1, Len(@))], v |-> True]
    [] c.type = "lmap" /\ m = "has" -> [c |-> c, v |-> Bool(KeyIndex(c.keys, a) # 0)]
    [] c.type = "lmap" /\ m = "get" -> LET i == KeyIndex(c.keys, a) IN [c |-> c, v |-> IF i = 0 THEN Undefined ELSE c.vals[i]]
    [] c.type = "lmap" /\ m = "set" ->
         LET i == KeyIndex(c.keys, a)
             value == IF Len(args) < 2 THEN Undefined ELSE args[2]
         IN [c |-> IF i # 0 THEN [c EXCEPT !.vals[i] = value]
                   ELSE [c EXCEPT !.keys = Append(@, CanonicalizeKeyedCollectionKey(a)), !.vals = Append(@, value)],
             v |-> c]
    [] c.type = "lmap" /\ m = "delete" ->
         LET i == KeyIndex(c.keys, a) IN
         IF i = 0 THEN [c |-> c, v |-> False]
         ELSE [c |-> [c EXCEPT !.keys = SubSeq(@, 1, i - 1) \o SubSeq(@, i + 1, Len(@)),
                               !.vals = SubSeq(@, 1, i - 1) \o SubSeq(@, i + 1, Len(@))], v |-> True]
    [] OTHER -> [c |-> LBail, v |-> LBail]
\* A callback's results on an array's elements and their indices, in order.
LResults(elems, F(_, _)) == [i \in DOMAIN elems |-> F(elems[i], IntV(i - 1))]
\* The index of the first result that bails or fails test, or 0, where the method that calls the
\* callback stops.
LFirst(rs, test(_)) ==
  LET stops == {i \in DOMAIN rs : rs[i].type = "bail" \/ ~test(rs[i])} IN
  IF stops = {} THEN 0 ELSE CHOOSE i \in stops : \A k \in stops : i <= k
\* Array.prototype.every and some, which stop at the first result that fails or passes.
LEvery(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F)
      i == LFirst(rs, LTruthy)
  IN IF i = 0 THEN True ELSE IF rs[i].type = "bail" THEN LBail ELSE False
LSome(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F)
      i == LFirst(rs, LAMBDA r : ~LTruthy(r))
  IN IF i = 0 THEN False ELSE IF rs[i].type = "bail" THEN LBail ELSE True
\* Array.prototype.map and filter, whose array ArraySpeciesCreate makes an array's constructor's.
\* filter's, as slice's, holds the elements of the array it's called on, which a store then owns.
LMap(c, F(_, _)) == IF c.type # "larray" THEN LBail ELSE LArray(LResults(c.elems, F))
LFilter(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F) IN
  IF \E i \in DOMAIN rs : rs[i].type = "bail" THEN LBail ELSE
  LET kept == SelectSeq([i \in DOMAIN rs |-> i], LAMBDA i : LTruthy(rs[i]))
  IN LArray([j \in DOMAIN kept |-> c.elems[kept[j]]])
\* An index of Array.prototype.slice, relative to the end where it's negative, or -1 where it
\* isn't an integer.
LRelative(v, n, default) ==
  CASE v.type = "undefined" -> default
    [] v.type = "number" /\ v.value.k = "int" ->
         IF v.value.i < 0 THEN (IF n + v.value.i < 0 THEN 0 ELSE n + v.value.i)
         ELSE IF v.value.i < n THEN v.value.i ELSE n
    [] OTHER -> -1
LSlice(c, start, end) ==
  IF c.type # "larray" THEN LBail ELSE
  LET n == Len(c.elems)
      k == LRelative(start, n, 0)
      f == LRelative(end, n, n)
  IN IF k < 0 \/ f < 0 THEN LBail
     ELSE LArray([j \in 1..(IF f > k THEN f - k ELSE 0) |-> c.elems[k + j]])
\* Array.from of an array-like object of a length alone, which reads undefined at each index.
LFrom(length, F(_, _)) ==
  IF length.type = "number" /\ length.value.k = "int" /\ length.value.i >= 0 /\ length.value.i <= 65536
  THEN LArray([i \in 1..length.value.i |-> F(Undefined, IntV(i - 1))])
  ELSE LBail
\* Array.prototype.find, and an iterator's find, which stops at the first result that passes.
LFind(c, F(_, _)) ==
  IF c.type # "larray" THEN LBail ELSE
  LET rs == LResults(c.elems, F)
      i == LFirst(rs, LAMBDA r : ~LTruthy(r))
  IN IF i = 0 THEN Undefined ELSE IF rs[i].type = "bail" THEN LBail ELSE c.elems[i]
\* The values that a Set's or an array's values() iterator gives, as an array, which only iterator
\* helpers and new Set read.
LValues(v) == IF v.type \in {"larray", "lset"} THEN [type |-> "larray", elems |-> v.elems] ELSE LBail
\* A Math function of one Number, which ToNumber gives back as it is.
LMath(m, a) == IF LNumber(a) THEN Num(MathOf(m, a.value)) ELSE LBail
\* Object.values of an ordinary object: its data properties' values in its keys' order.
LObjectValues(o) == IF o.type = "lobject" THEN LArray([i \in DOMAIN o.keys |-> o.vals[o.keys[i]]]) ELSE LBail
\* Whether a Set's or an array's elements are all primitives, which SameValueZero compares as they are.
LPrimitives(v) == \A i \in DOMAIN v.elems : ~IsLComposite(v.elems[i])
LSet(list) == [type |-> "lset", elems |-> list]
LHas(list, v) == KeyIndex(list, v) # 0
\* The elements of a list of primitives that Set.prototype.add keeps: each once, canonicalized, in
\* order.
RECURSIVE LDistinct(_, _)
LDistinct(list, kept) ==
  IF list = <<>> THEN kept
  ELSE LDistinct(Tail(list), IF LHas(kept, Head(list)) THEN kept ELSE Append(kept, CanonicalizeKeyedCollectionKey(Head(list))))
\* new Set(v): of an array's or a Set's primitives in the order their iterators give them, or of
\* none where v is undefined or null.
LNewSet(v) ==
  CASE v.type \in {"undefined", "null"} -> LSet(<<>>)
    [] v.type \in {"larray", "lset"} /\ LPrimitives(v) -> LSet(LDistinct(v.elems, <<>>))
    [] OTHER -> LBail
\* Set.prototype's methods that take another Set (§24.2.4), of primitives: each iterates the
\* smaller Set where the specification lets the sizes decide, which intersection's order shows.
LSetMethod(c, m, o) ==
  IF c.type # "lset" \/ o.type # "lset" \/ ~LPrimitives(c) \/ ~LPrimitives(o) THEN LBail ELSE
  LET a == c.elems
      b == o.elems
  IN CASE m = "union" -> LSet(a \o SelectSeq(b, LAMBDA e : ~LHas(a, e)))
       [] m = "intersection" ->
            LSet(IF Len(a) <= Len(b) THEN SelectSeq(a, LAMBDA e : LHas(b, e)) ELSE SelectSeq(b, LAMBDA e : LHas(a, e)))
       [] m = "difference" -> LSet(SelectSeq(a, LAMBDA e : ~LHas(b, e)))
       [] m = "symmetricDifference" -> LSet(SelectSeq(a, LAMBDA e : ~LHas(b, e)) \o SelectSeq(b, LAMBDA e : ~LHas(a, e)))
       [] m = "isSubsetOf" -> Bool(Len(a) <= Len(b) /\ \A i \in DOMAIN a : LHas(b, a[i]))
       [] m = "isSupersetOf" -> Bool(Len(a) >= Len(b) /\ \A i \in DOMAIN b : LHas(a, b[i]))
       [] m = "isDisjointFrom" -> Bool(~\E i \in DOMAIN a : LHas(b, a[i]))
       [] OTHER -> LBail
====
`);

// The methods LMethod runs, which change the receiver where they're in MUTATORS. ESCore's step
// counts a call of a mutator on what existed before it as a write, as ModelCallBuiltin does.
const METHODS = new Set(["push", "pop", "shift", "includes", "has", "add", "delete", "get", "set"]);
const MUTATORS = new Set(["push", "pop", "shift", "add", "delete", "set"]);

// The array methods that call an arrow function on each element, by their operators.
const CALLBACK_METHODS = new Map([
  ["every", "LEvery"],
  ["some", "LSome"],
  ["map", "LMap"],
  ["filter", "LFilter"],
  ["find", "LFind"],
]);

// The methods of a Set that take another Set, and those of them that make a Set.
const SET_METHODS = new Set([
  "union",
  "intersection",
  "difference",
  "symmetricDifference",
  "isSubsetOf",
  "isSupersetOf",
  "isDisjointFrom",
]);
const SET_MAKERS = new Set(["union", "intersection", "difference", "symmetricDifference"]);

// The functions of Math that MathOf gives of one Number.
const MATH_FUNCTIONS = new Set(
  "abs acos acosh asin asinh atan atanh cbrt ceil clz32 cos cosh exp expm1 f16round floor fround log log2 log10 log1p round sign sin sinh sqrt tan tanh trunc".split(
    " ",
  ),
);

const ARITHMETIC = new Map([
  [ts.SyntaxKind.PlusToken, "+"],
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.SlashToken, "/"],
  [ts.SyntaxKind.PercentToken, "%"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "**"],
]);

const COMPOUND = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
  [ts.SyntaxKind.SlashEqualsToken, "/"],
  [ts.SyntaxKind.PercentEqualsToken, "%"],
]);

const RELATIONS = new Map([
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
]);

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

// Whether a key names an array index, whose place in an object's keys isn't the order it came in.
export const isIndexKey = (text: string) =>
  /^(?:0|[1-9][0-9]*)$/.test(text) && Number(text) < 2 ** 32 - 1;

interface Scope {
  // The TLA+ expressions of the lowered state and of whether the call wrote, so far.
  m: string;
  w: string;
  // The TLA+ names of the parameters and constants of the function's code, by name.
  locals: ReadonlyMap<string, string>;
  // The function whose code this is.
  body: ts.Node;
  // The TLA+ names of the constants that hold an object or array that nothing else holds.
  fresh: ReadonlySet<string>;
}

interface Value {
  text: string;
  // Whether the value is an object or array that the expression made, which nothing else holds.
  isFresh: boolean;
}

// The text of what follows a statement, given the state and written flag it leaves.
type Rest = (m: string, w: string) => string | undefined;

type FunctionNode = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;

interface Compiled {
  operator: string;
  // Whether a call writes nothing, so that an expression may call it.
  isPure: boolean;
}

export interface NativeFunctions {
  definitions: string[];
  // The operator that runs a module function natively, Native(m, w, p1, ..., pn), if it can.
  getOperator: (name: string) => string | undefined;
}

// The native operators of a lowered model's module functions, by the module's top-level
// declarations: its functions, and the bindings that the state lowers, of which let ones are
// mutable.
export const getNativeFunctions = (
  file: ts.SourceFile,
  lowered: readonly string[],
): NativeFunctions => {
  const functions = new Map<string, FunctionNode>();
  const mutable = new Set<string>();
  for (const statement of file.statements) {
    if (
      ts.isVariableStatement(statement) &&
      (statement.declarationList.flags & ts.NodeFlags.Let) !== 0
    ) {
      statement.declarationList.declarations.forEach((declaration) => {
        if (ts.isIdentifier(declaration.name)) mutable.add(declaration.name.text);
      });
    }
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      functions.set(statement.name.text, statement);
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        if (
          ts.isIdentifier(declaration.name) &&
          initializer !== undefined &&
          (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
        ) {
          functions.set(declaration.name.text, initializer);
        }
      }
    }
  }
  const bindings = new Set(lowered);
  const definitions: string[] = [];
  const compiled = new Map<string, Compiled | undefined>();
  // The functions that compileFunction is compiling, innermost last.
  const compiling: { name: string; operator: string; isRecursive: boolean }[] = [];
  let count = 0;
  // A name of the generated code's own, which no definition of ESCore's takes.
  const fresh = (prefix: string) => {
    count += 1;
    return `${prefix === "Native" ? prefix : `nv${prefix}`}${count}`;
  };
  const isBinding = (name: string, scope: Scope) => !scope.locals.has(name) && bindings.has(name);
  // A literal's value, defined once as a constant of its own, before the code that reads it.
  const constants = new Map<string, string>();
  const getConstant = (text: string) => {
    const known = constants.get(text);
    if (known !== undefined) return known;
    const name = fresh("Constant");
    constants.set(text, name);
    definitions.push(`${name} == ${text}`);
    return name;
  };

  // The function of a call's callee, where it names one of the module's functions.
  const getCallee = (node: ts.Expression, scope: Scope) =>
    ts.isIdentifier(node) && !scope.locals.has(node.text) && !bindings.has(node.text)
      ? compileFunction(node.text)
      : undefined;

  const compileArguments = (
    args: readonly ts.Expression[],
    scope: Scope,
    isOwned: boolean,
  ): string[] | undefined => {
    const values = args.map((arg) => compileExpression(arg, scope));
    return values.some((value) => value === undefined)
      ? undefined
      : values.map((value) =>
          isOwned && value !== undefined && !value.isFresh
            ? `LOwn(${value.text})`
            : (value?.text ?? ""),
        );
  };

  // An arrow function that a method calls on each element and its index, as a TLA+ LAMBDA of
  // them that gives its result, owned where the method keeps it, and writes nothing.
  const compileCallback = (
    node: ts.Expression | undefined,
    scope: Scope,
    isOwned: boolean,
  ): string | undefined => {
    if (
      node === undefined ||
      !ts.isArrowFunction(node) ||
      node.parameters.length > 2 ||
      node.parameters.some(
        (parameter) =>
          !ts.isIdentifier(parameter.name) ||
          parameter.initializer !== undefined ||
          parameter.dotDotDotToken !== undefined,
      ) ||
      (ts.getModifiers(node) ?? []).length > 0
    ) {
      return undefined;
    }
    const params = [fresh("p"), fresh("p")];
    const locals = new Map(scope.locals);
    node.parameters.forEach((parameter, index) =>
      locals.set((parameter.name as ts.Identifier).text, params[index]),
    );
    const inner = { ...scope, locals };
    const state = { isPure: true };
    const body = ts.isBlock(node.body)
      ? (() => {
          const text = compileStatements(
            node.body.statements,
            inner,
            (m, w) => result(m, w, "Undefined"),
            state,
          );
          return text === undefined ? undefined : { text: `LValue(${text})`, isFresh: false };
        })()
      : compileExpression(node.body, inner);
    return body === undefined || !state.isPure
      ? undefined
      : `LAMBDA ${params.join(", ")} : ${isOwned && !body.isFresh ? `LOwn(${body.text})` : body.text}`;
  };

  // Whether a name is the realm's global, which no local, binding or function of the module takes.
  const isRealmGlobal = (name: string, scope: Scope) =>
    !scope.locals.has(name) && !bindings.has(name) && !functions.has(name);

  // The values an iterator gives, as an array, where it's a Set's or an array's values() or an
  // iterator helper's filter or map of one, which calls its callback on each value and its index in
  // turn, as the iterator that reads it asks.
  const compileIterator = (node: ts.Expression, scope: Scope): Value | undefined => {
    if (
      !ts.isCallExpression(node) ||
      node.questionDotToken !== undefined ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken !== undefined ||
      !ts.isIdentifier(node.expression.name)
    ) {
      return undefined;
    }
    const method = node.expression.name.text;
    if (method === "values" && node.arguments.length === 0) {
      const receiver = compileExpression(node.expression.expression, scope);
      return receiver === undefined
        ? undefined
        : { text: `LValues(${receiver.text})`, isFresh: false };
    }
    if ((method !== "filter" && method !== "map") || node.arguments.length !== 1) return undefined;
    const iterator = compileIterator(node.expression.expression, scope);
    const callback = compileCallback(node.arguments[0], scope, method === "map");
    return iterator === undefined || callback === undefined
      ? undefined
      : {
          text: `${method === "map" ? "LMap" : "LFilter"}(${iterator.text}, ${callback})`,
          isFresh: false,
        };
  };

  // A call of a module function that writes nothing, whose parameters it's given in order.
  const compileCall = (node: ts.CallExpression, scope: Scope): Value | undefined => {
    const callee = getCallee(node.expression, scope);
    if (callee !== undefined) {
      const fn = functions.get((node.expression as ts.Identifier).text);
      const args = compileArguments(node.arguments, scope, false);
      if (!callee.isPure || args === undefined || fn === undefined) return undefined;
      if (args.length > fn.parameters.length) return undefined;
      const padded = [...args, ...fn.parameters.slice(args.length).map(() => "Undefined")];
      return {
        text: `LValue(${callee.operator}(${[scope.m, scope.w, ...padded].join(", ")}))`,
        isFresh: false,
      };
    }
    // Array.from({ length }, callback), where Array is the realm's.
    const source = node.arguments[0];
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "Array" &&
      !scope.locals.has("Array") &&
      !bindings.has("Array") &&
      !functions.has("Array") &&
      node.expression.name.text === "from" &&
      node.arguments.length === 2 &&
      source !== undefined &&
      ts.isObjectLiteralExpression(source) &&
      source.properties.length === 1 &&
      ts.isPropertyAssignment(source.properties[0]) &&
      ts.isIdentifier(source.properties[0].name) &&
      source.properties[0].name.text === "length"
    ) {
      const length = compileExpression(source.properties[0].initializer, scope);
      const callback = compileCallback(node.arguments[1], scope, true);
      return length === undefined || callback === undefined
        ? undefined
        : { text: `LFrom(${length.text}, ${callback})`, isFresh: true };
    }
    // Math's functions of one Number, where Math is the realm's, which read only their first
    // argument.
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "Math" &&
      isRealmGlobal("Math", scope) &&
      MATH_FUNCTIONS.has(node.expression.name.text) &&
      node.arguments.length >= 1
    ) {
      const args = compileArguments(node.arguments, scope, false);
      return args === undefined
        ? undefined
        : { text: `LMath("${node.expression.name.text}", ${args[0]})`, isFresh: false };
    }
    // Object.values(o), where Object is the realm's.
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "Object" &&
      isRealmGlobal("Object", scope) &&
      node.expression.name.text === "values" &&
      node.arguments.length === 1
    ) {
      const object = compileExpression(node.arguments[0], scope);
      return object === undefined
        ? undefined
        : { text: `LObjectValues(${object.text})`, isFresh: false };
    }
    if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) {
      const method = node.expression.name.text;
      // A Set's method of another Set, whose Set holds primitives alone, so that nothing else
      // holds what it holds.
      if (SET_METHODS.has(method) && node.arguments.length === 1) {
        const receiver = compileExpression(node.expression.expression, scope);
        const other = compileExpression(node.arguments[0], scope);
        return receiver === undefined || other === undefined
          ? undefined
          : {
              text: `LSetMethod(${receiver.text}, "${method}", ${other.text})`,
              isFresh: SET_MAKERS.has(method),
            };
      }
      const iterating = CALLBACK_METHODS.get(method);
      if (iterating !== undefined || method === "slice") {
        // An iterator's every, some and find give a value, and its filter and map an iterator,
        // which only compileIterator reads.
        const iterator = compileIterator(node.expression.expression, scope);
        if (iterator !== undefined && (method === "filter" || method === "map")) return undefined;
        const receiver = iterator ?? compileExpression(node.expression.expression, scope);
        if (receiver === undefined || (iterator !== undefined && method === "slice")) {
          return undefined;
        }
        if (method === "slice") {
          const args = compileArguments(node.arguments, scope, false);
          return args === undefined || args.length > 2
            ? undefined
            : {
                text: `LSlice(${receiver.text}, ${args[0] ?? "Undefined"}, ${args[1] ?? "Undefined"})`,
                isFresh: false,
              };
        }
        const callback =
          node.arguments.length === 1
            ? compileCallback(node.arguments[0], scope, method === "map")
            : undefined;
        return callback === undefined || iterating === undefined
          ? undefined
          : {
              text: `${iterating}(${receiver.text}, ${callback})`,
              isFresh: method === "map",
            };
      }
      // A method that doesn't change its receiver, on any lowered value.
      if (!METHODS.has(method) || MUTATORS.has(method)) return undefined;
      const receiver = compileExpression(node.expression.expression, scope);
      const args = compileArguments(node.arguments, scope, false);
      if (receiver === undefined || args === undefined) return undefined;
      return {
        text: `LMethod(${receiver.text}, "${method}", <<${args.join(", ")}>>).v`,
        isFresh: false,
      };
    }
    return undefined;
  };

  const compileExpression = (node: ts.Expression, scope: Scope): Value | undefined => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node)
    ) {
      return compileExpression(node.expression, scope);
    }
    if (ts.isNumericLiteral(node)) {
      return { text: getConstant(`Num(${getNumber(Number(node.text))})`), isFresh: false };
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return { text: getConstant(`Str(${getUnits(node.text)})`), isFresh: false };
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return { text: "True", isFresh: false };
    if (node.kind === ts.SyntaxKind.FalseKeyword) return { text: "False", isFresh: false };
    if (node.kind === ts.SyntaxKind.NullKeyword) return { text: "Null", isFresh: false };
    if (ts.isIdentifier(node)) {
      const local = scope.locals.get(node.text);
      if (local !== undefined) return { text: local, isFresh: false };
      if (bindings.has(node.text)) return { text: `${scope.m}.${node.text}`, isFresh: false };
      return node.text === "undefined" && !functions.has(node.text)
        ? { text: "Undefined", isFresh: false }
        : undefined;
    }
    if (ts.isPropertyAccessExpression(node)) {
      const object = compileExpression(node.expression, scope);
      return node.questionDotToken !== undefined ||
        !ts.isIdentifier(node.name) ||
        object === undefined
        ? undefined
        : { text: `LGet(${object.text}, ${getUnits(node.name.text)})`, isFresh: false };
    }
    if (ts.isElementAccessExpression(node)) {
      const object = compileExpression(node.expression, scope);
      const key = compileExpression(node.argumentExpression, scope);
      return node.questionDotToken !== undefined || object === undefined || key === undefined
        ? undefined
        : { text: `LIndex(${object.text}, ${key.text})`, isFresh: false };
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const operand = compileExpression(node.operand, scope);
      if (operand === undefined) return undefined;
      const operator = new Map([
        [ts.SyntaxKind.ExclamationToken, "LNot"],
        [ts.SyntaxKind.MinusToken, "LNegate"],
        [ts.SyntaxKind.PlusToken, "LPlus"],
      ]).get(node.operator);
      return operator === undefined
        ? undefined
        : { text: `${operator}(${operand.text})`, isFresh: false };
    }
    if (ts.isConditionalExpression(node)) {
      const condition = compileExpression(node.condition, scope);
      const whenTrue = compileExpression(node.whenTrue, scope);
      const whenFalse = compileExpression(node.whenFalse, scope);
      if (condition === undefined || whenTrue === undefined || whenFalse === undefined)
        return undefined;
      const name = fresh("c");
      return {
        text: `(LET ${name} == ${condition.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF LTruthy(${name}) THEN ${whenTrue.text} ELSE ${whenFalse.text})`,
        isFresh: whenTrue.isFresh && whenFalse.isFresh,
      };
    }
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      const left = compileExpression(node.left, scope);
      const right = compileExpression(node.right, scope);
      if (left === undefined || right === undefined) return undefined;
      const arithmetic = ARITHMETIC.get(kind);
      if (arithmetic !== undefined) {
        return { text: `LArith("${arithmetic}", ${left.text}, ${right.text})`, isFresh: false };
      }
      const relation = RELATIONS.get(kind);
      if (relation !== undefined) {
        return { text: `LRelation("${relation}", ${left.text}, ${right.text})`, isFresh: false };
      }
      const equality = new Map([
        [ts.SyntaxKind.EqualsEqualsEqualsToken, `LStrict(${left.text}, ${right.text})`],
        [ts.SyntaxKind.ExclamationEqualsEqualsToken, `LNot(LStrict(${left.text}, ${right.text}))`],
        [ts.SyntaxKind.EqualsEqualsToken, `LLoose(${left.text}, ${right.text})`],
        [ts.SyntaxKind.ExclamationEqualsToken, `LNot(LLoose(${left.text}, ${right.text}))`],
      ]).get(kind);
      if (equality !== undefined) return { text: equality, isFresh: false };
      const name = fresh("c");
      const isFresh = left.isFresh && right.isFresh;
      if (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken) {
        const isAnd = kind === ts.SyntaxKind.AmpersandAmpersandToken;
        return {
          text: `(LET ${name} == ${left.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF ${isAnd ? "" : "~"}LTruthy(${name}) THEN ${right.text} ELSE ${name})`,
          isFresh,
        };
      }
      if (kind === ts.SyntaxKind.QuestionQuestionToken) {
        return {
          text: `(LET ${name} == ${left.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF ${name}.type \\in {"undefined", "null"} THEN ${right.text} ELSE ${name})`,
          isFresh,
        };
      }
      return undefined;
    }
    if (ts.isObjectLiteralExpression(node)) {
      let text = "LEmptyObject";
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) {
          const value = compileExpression(property.expression, scope);
          if (value === undefined) return undefined;
          text = `LSpread(${text}, ${value.text})`;
          continue;
        }
        const name = property.name;
        const key =
          name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name))
            ? name.text
            : undefined;
        if (key === undefined || key === "__proto__" || isIndexKey(key)) return undefined;
        const value = ts.isPropertyAssignment(property)
          ? compileExpression(property.initializer, scope)
          : ts.isShorthandPropertyAssignment(property) &&
              property.objectAssignmentInitializer === undefined
            ? compileExpression(property.name, scope)
            : undefined;
        if (value === undefined) return undefined;
        text = `LPut(${text}, ${getUnits(key)}, ${value.isFresh ? value.text : `LOwn(${value.text})`})`;
      }
      return { text, isFresh: true };
    }
    if (ts.isArrayLiteralExpression(node)) {
      if (node.elements.some(ts.isOmittedExpression)) return undefined;
      // A spread of an array or a Set gives its elements, and each run of other elements
      // between spreads gives them.
      const parts: string[] = [];
      for (const [index, element] of node.elements.entries()) {
        if (ts.isSpreadElement(element)) {
          const spread = compileExpression(element.expression, scope);
          if (spread === undefined) return undefined;
          parts.push(`LSpreadElems(${spread.text})`);
        } else if (index === 0 || ts.isSpreadElement(node.elements[index - 1])) {
          const end = node.elements.findIndex(
            (other, at) => at > index && ts.isSpreadElement(other),
          );
          const owned = compileArguments(
            node.elements.slice(index, end === -1 ? undefined : end),
            scope,
            true,
          );
          if (owned === undefined) return undefined;
          parts.push(`<<${owned.join(", ")}>>`);
        }
      }
      return {
        text: `LArray(${parts.length === 0 ? "<<>>" : parts.join(" \\o ")})`,
        isFresh: true,
      };
    }
    if (ts.isCallExpression(node) && node.questionDotToken === undefined)
      return compileCall(node, scope);
    // new Set(iterable), where Set is the realm's, of primitives alone, which nothing else holds.
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "Set" &&
      isRealmGlobal("Set", scope) &&
      (node.arguments ?? []).length <= 1
    ) {
      const source = node.arguments?.[0];
      const values =
        source === undefined
          ? { text: "Undefined", isFresh: false }
          : (compileIterator(source, scope) ?? compileExpression(source, scope));
      return values === undefined ? undefined : { text: `LNewSet(${values.text})`, isFresh: true };
    }
    return undefined;
  };

  // A path to a value the state holds: a binding the state lowers and the keys from it, which
  // an assignment or a mutator changes. Each step gives the TLA+ of its container and key.
  const getPath = (
    node: ts.Expression,
    scope: Scope,
  ): { root: string; keys: string[] } | undefined => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isAsExpression(node)
    ) {
      return getPath(node.expression, scope);
    }
    if (ts.isIdentifier(node)) {
      return isBinding(node.text, scope) ? { root: node.text, keys: [] } : undefined;
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      node.questionDotToken === undefined &&
      ts.isIdentifier(node.name)
    ) {
      const base = getPath(node.expression, scope);
      return base === undefined
        ? undefined
        : { root: base.root, keys: [...base.keys, `Str(${getUnits(node.name.text)})`] };
    }
    if (ts.isElementAccessExpression(node) && node.questionDotToken === undefined) {
      const base = getPath(node.expression, scope);
      const key = compileExpression(node.argumentExpression, scope);
      return base === undefined || key === undefined
        ? undefined
        : { root: base.root, keys: [...base.keys, key.text] };
    }
    return undefined;
  };

  // The text that replaces the value at a path with change(value), where change gives the new
  // value's text, or a record [c, v] of it and a result, and continues with rest.
  const updatePath = (
    path: { root: string; keys: string[] },
    scope: Scope,
    change: (value: string) => string,
    rest: (m: string, result: string) => string | undefined,
  ): string | undefined => {
    const names = path.keys.map(() => fresh("k"));
    const containers = [`${scope.m}.${path.root}`, ...path.keys.map(() => fresh("o"))];
    const reads = path.keys.map(
      (key, index) =>
        `${names[index]} == ${key}\n  ${containers[index + 1]} == LIndex(${containers[index]}, ${names[index]})`,
    );
    const changed = fresh("r");
    const rebuilt = path.keys.reduceRight(
      (inner, _, index) => `LAssign(${containers[index]}, ${names[index]}, ${inner})`,
      `${changed}.c`,
    );
    const updated = fresh("u");
    const m = fresh("m");
    const next = rest(m, `${changed}.v`);
    return next === undefined
      ? undefined
      : `LET ${[...reads, `${changed} == ${change(containers.at(-1) ?? "")}`, `${updated} == ${rebuilt}`].join("\n  ")}\n  IN IF ${updated}.type = "bail" THEN LBail ELSE\n  LET ${m} == [${scope.m} EXCEPT !.${path.root} = ${updated}] IN\n  ${next}`;
  };

  // The binding and the depth of the object that an expression's path of properties ends in, or
  // undefined for a path from anything but a name.
  const getPathRoot = (node: ts.Expression): { root: string; depth: number } | undefined => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isAsExpression(node)
    ) {
      return getPathRoot(node.expression);
    }
    if (ts.isIdentifier(node)) return { root: node.text, depth: 0 };
    if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node))
      return undefined;
    const base = getPathRoot(node.expression);
    return base === undefined ? undefined : { root: base.root, depth: base.depth + 1 };
  };

  // The object that a node changes in place, as the binding and depth of its path, "any" where it
  // may change any, or undefined where it changes none.
  const getChange = (node: ts.Node): { root: string; depth: number } | "any" | undefined => {
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.EqualsToken ||
        COMPOUND.has(node.operatorToken.kind))
    ) {
      if (ts.isIdentifier(node.left)) return undefined;
      const target = getPathRoot(node.left);
      return target === undefined ? "any" : { root: target.root, depth: target.depth - 1 };
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      if (ts.isIdentifier(node.operand)) return undefined;
      const target = getPathRoot(node.operand);
      return target === undefined ? "any" : { root: target.root, depth: target.depth - 1 };
    }
    if (ts.isDeleteExpression(node)) return "any";
    if (!ts.isCallExpression(node)) return undefined;
    if (ts.isIdentifier(node.expression) && functions.has(node.expression.text)) {
      return compileFunction(node.expression.text)?.isPure === true ? undefined : "any";
    }
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.name) &&
      MUTATORS.has(node.expression.name.text)
    ) {
      return getPathRoot(node.expression.expression) ?? "any";
    }
    return undefined;
  };

  // Whether code after a position in a function may change in place the object at a depth of a
  // binding's path, or one that it holds: a change of a binding's object holds of no deeper one, as
  // no object of the state is held twice.
  const isChangedAfter = (body: ts.Node, position: number, root: string, depth: number) => {
    const isChanged = (node: ts.Node): boolean => {
      if (node.getStart() >= position) {
        const change = getChange(node);
        if (
          change === "any" ||
          (change !== undefined &&
            (!bindings.has(change.root) || (change.root === root && change.depth >= depth)))
        ) {
          return true;
        }
      }
      return ts.forEachChild(node, isChanged) ?? false;
    };
    return isChanged(body);
  };

  // Whether a name is read after a position in a function.
  const isReadAfter = (body: ts.Node, position: number, name: string) => {
    const isRead = (node: ts.Node): boolean =>
      (ts.isIdentifier(node) && node.text === name && node.getStart() >= position) ||
      (ts.forEachChild(node, isRead) ?? false);
    return isRead(body);
  };

  // Whether a function declares a name once, so that each of its reads names that declaration.
  const isDeclaredOnce = (body: ts.Node, name: string) => {
    let count = 0;
    const visit = (node: ts.Node): void => {
      if (
        (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name
      ) {
        count += 1;
      }
      ts.forEachChild(node, visit);
    };
    visit(body);
    return count === 1;
  };

  const isExiting = (statement: ts.Statement): boolean =>
    ts.isReturnStatement(statement) ||
    (ts.isBlock(statement) && statement.statements.some(isExiting)) ||
    (ts.isIfStatement(statement) &&
      statement.elseStatement !== undefined &&
      isExiting(statement.thenStatement) &&
      isExiting(statement.elseStatement));

  const result = (m: string, w: string, value: string) =>
    `[type |-> "ok", m |-> ${m}, w |-> ${w}, v |-> ${value}]`;

  // The statements from index on, which a function's code runs in turn, and then rest.
  const compileStatements = (
    statements: readonly ts.Statement[],
    scope: Scope,
    rest: Rest,
    state: { isPure: boolean },
  ): string | undefined => {
    if (statements.length === 0) return rest(scope.m, scope.w);
    const statement = statements[0];
    const after = statements.slice(1);
    const next: Rest = (m, w) => compileStatements(after, { ...scope, m, w }, rest, state);
    if (ts.isEmptyStatement(statement)) return next(scope.m, scope.w);
    if (ts.isReturnStatement(statement)) {
      const value =
        statement.expression === undefined
          ? { text: "Undefined", isFresh: false }
          : compileExpression(statement.expression, scope);
      if (value === undefined) return undefined;
      const name = fresh("v");
      return `LET ${name} == ${value.text} IN IF ${name}.type = "bail" THEN LBail ELSE ${result(scope.m, scope.w, name)}`;
    }
    if (ts.isBlock(statement)) {
      return compileStatements(statement.statements, scope, (m, w) => next(m, w), state);
    }
    if (ts.isVariableStatement(statement)) {
      const isBlockScoped = (statement.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0;
      const declarations = statement.declarationList.declarations;
      if (
        !isBlockScoped ||
        declarations.some(
          (declaration) =>
            !ts.isIdentifier(declaration.name) || declaration.initializer === undefined,
        )
      ) {
        return undefined;
      }
      const locals = new Map(scope.locals);
      const held = new Set(scope.fresh);
      const lines: string[] = [];
      for (const declaration of declarations) {
        const initializer = declaration.initializer as ts.Expression;
        const inner = { ...scope, locals };
        const value = compileExpression(initializer, inner);
        if (value === undefined) return undefined;
        const name = fresh("l");
        const text = (declaration.name as ts.Identifier).text;
        // A constant holds an object that an expression just made, or one that the state holds
        // where nothing that follows changes it in place, and otherwise no object at all.
        const path = value.isFresh ? undefined : getPath(initializer, inner);
        const isHeld =
          value.isFresh ||
          (path !== undefined &&
            !isChangedAfter(scope.body, statement.getEnd(), path.root, path.keys.length));
        lines.push(`${name} == ${isHeld ? value.text : `LOwn(${value.text})`}`);
        if (value.isFresh && isDeclaredOnce(scope.body, text)) held.add(name);
        locals.set(text, name);
      }
      const body = compileStatements(after, { ...scope, locals, fresh: held }, rest, state);
      const names = [...locals.values()].slice(scope.locals.size);
      return body === undefined
        ? undefined
        : `LET ${lines.join("\n      ")}\n  IN IF ${names.map((name) => `${name}.type = "bail"`).join(" \\/ ")} THEN LBail ELSE\n  ${body}`;
    }
    if (ts.isIfStatement(statement)) {
      const condition = compileExpression(statement.expression, scope);
      if (condition === undefined) return undefined;
      const name = fresh("c");
      const isJoined =
        !isExiting(statement.thenStatement) ||
        (statement.elseStatement !== undefined && !isExiting(statement.elseStatement));
      // A branch that may run to its end returns to what follows through a record of its state.
      const joined = fresh("j");
      const branchRest: Rest = isJoined
        ? (m, w) => `[type |-> "next", m |-> ${m}, w |-> ${w}, v |-> Undefined]`
        : next;
      const whenTrue = compileStatements([statement.thenStatement], scope, branchRest, state);
      const whenFalse =
        statement.elseStatement === undefined
          ? branchRest(scope.m, scope.w)
          : compileStatements([statement.elseStatement], scope, branchRest, state);
      if (whenTrue === undefined || whenFalse === undefined) return undefined;
      const choice = `LET ${name} == ${condition.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF LTruthy(${name}) THEN\n  ${whenTrue}\n  ELSE\n  ${whenFalse}`;
      if (!isJoined) return choice;
      const tail = next(`${joined}.m`, `${joined}.w`);
      return tail === undefined
        ? undefined
        : `LET ${joined} == ${choice}\n  IN IF ${joined}.type # "next" THEN ${joined} ELSE\n  ${tail}`;
    }
    if (ts.isExpressionStatement(statement)) {
      return compileEffect(statement.expression, scope, next, state);
    }
    return undefined;
  };

  // An expression statement: an assignment to what the state holds, a call of a mutator on it or
  // of a module function, or an expression whose value the statement drops.
  const compileEffect = (
    node: ts.Expression,
    scope: Scope,
    next: Rest,
    state: { isPure: boolean },
  ): string | undefined => {
    const written = (m: string) => {
      state.isPure = false;
      return next(m, "TRUE");
    };
    if (ts.isParenthesizedExpression(node))
      return compileEffect(node.expression, scope, next, state);
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      const operator = COMPOUND.get(kind);
      if (kind !== ts.SyntaxKind.EqualsToken && operator === undefined) return undefined;
      const value = compileExpression(node.right, scope);
      const target = node.left;
      if (value === undefined) return undefined;
      // A constant that holds what nothing else holds gives it to the state where nothing that
      // follows reads the constant again.
      const local = ts.isIdentifier(node.right) ? scope.locals.get(node.right.text) : undefined;
      const isGiven =
        local !== undefined &&
        scope.fresh.has(local) &&
        !isReadAfter(scope.body, node.getEnd(), (node.right as ts.Identifier).text);
      const owned = value.isFresh || isGiven ? value.text : `LOwn(${value.text})`;
      if (ts.isIdentifier(target)) {
        if (!isBinding(target.text, scope) || !mutable.has(target.text)) return undefined;
        const name = fresh("v");
        const m = fresh("m");
        const assigned =
          operator === undefined
            ? owned
            : `LArith("${operator}", ${scope.m}.${target.text}, ${value.text})`;
        const body = written(m);
        return body === undefined
          ? undefined
          : `LET ${name} == ${assigned} IN IF ${name}.type = "bail" THEN LBail ELSE\n  LET ${m} == [${scope.m} EXCEPT !.${target.text} = ${name}] IN\n  ${body}`;
      }
      const path =
        ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
          ? getPath(target, scope)
          : undefined;
      if (path === undefined || path.keys.length === 0) return undefined;
      const container = { root: path.root, keys: path.keys.slice(0, -1) };
      const key = fresh("k");
      return updatePath(
        container,
        scope,
        (object) =>
          `LET ${key} == ${path.keys.at(-1)} IN [c |-> LAssign(${object}, ${key}, ${operator === undefined ? owned : `LArith("${operator}", LIndex(${object}, ${key}), ${value.text})`}), v |-> Undefined]`,
        (m) => written(m),
      );
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      const delta =
        node.operator === ts.SyntaxKind.PlusPlusToken
          ? 1
          : node.operator === ts.SyntaxKind.MinusMinusToken
            ? -1
            : 0;
      if (delta === 0) return undefined;
      const target = node.operand;
      if (ts.isIdentifier(target)) {
        if (!isBinding(target.text, scope) || !mutable.has(target.text)) return undefined;
        const name = fresh("v");
        const m = fresh("m");
        const body = written(m);
        return body === undefined
          ? undefined
          : `LET ${name} == LIncrement(${scope.m}.${target.text}, ${delta}) IN IF ${name}.type = "bail" THEN LBail ELSE\n  LET ${m} == [${scope.m} EXCEPT !.${target.text} = ${name}] IN\n  ${body}`;
      }
      const path = getPath(target, scope);
      if (path === undefined || path.keys.length === 0) return undefined;
      const key = fresh("k");
      return updatePath(
        { root: path.root, keys: path.keys.slice(0, -1) },
        scope,
        (object) =>
          `LET ${key} == ${path.keys.at(-1)} IN [c |-> LAssign(${object}, ${key}, LIncrement(LIndex(${object}, ${key}), ${delta})), v |-> Undefined]`,
        (m) => written(m),
      );
    }
    if (ts.isCallExpression(node) && node.questionDotToken === undefined) {
      const callee = getCallee(node.expression, scope);
      const fn = ts.isIdentifier(node.expression) ? functions.get(node.expression.text) : undefined;
      if (callee !== undefined && fn !== undefined) {
        const args = compileArguments(node.arguments, scope, !callee.isPure);
        if (args === undefined || args.length > fn.parameters.length) return undefined;
        const padded = [...args, ...fn.parameters.slice(args.length).map(() => "Undefined")];
        const name = fresh("r");
        if (!callee.isPure) state.isPure = false;
        const body = next(`${name}.m`, `${name}.w`);
        return body === undefined
          ? undefined
          : `LET ${name} == ${callee.operator}(${[scope.m, scope.w, ...padded].join(", ")}) IN IF ${name}.type = "bail" THEN LBail ELSE\n  ${body}`;
      }
      if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) {
        const method = node.expression.name.text;
        const path = getPath(node.expression.expression, scope);
        const args = compileArguments(node.arguments, scope, true);
        if (MUTATORS.has(method) && path !== undefined && args !== undefined) {
          return updatePath(
            path,
            scope,
            (object) => `LMethod(${object}, "${method}", <<${args.join(", ")}>>)`,
            (m) => written(m),
          );
        }
      }
    }
    const value = compileExpression(node, scope);
    if (value === undefined) return undefined;
    const name = fresh("v");
    const body = next(scope.m, scope.w);
    return body === undefined
      ? undefined
      : `LET ${name} == ${value.text} IN IF ${name}.type = "bail" THEN LBail ELSE\n  ${body}`;
  };

  // A module function's operator, compiled once, or undefined where its code goes beyond what
  // runs natively.
  const compileFunction = (name: string): Compiled | undefined => {
    if (compiled.has(name)) return compiled.get(name);
    // A function that calls itself takes its operator as it compiles, as one that writes nothing,
    // which it must turn out to be; one that another function it calls calls runs on ESCore.
    const innermost = compiling.at(-1);
    if (innermost?.name === name) {
      innermost.isRecursive = true;
      return { operator: innermost.operator, isPure: true };
    }
    if (compiling.some((entry) => entry.name === name)) return undefined;
    const fn = functions.get(name);
    compiled.set(name, undefined);
    if (
      fn === undefined ||
      fn.asteriskToken !== undefined ||
      (ts.getModifiers(fn) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      return undefined;
    }
    const usesThis = (node: ts.Node): boolean =>
      node.kind === ts.SyntaxKind.ThisKeyword ||
      (ts.isIdentifier(node) && node.text === "arguments") ||
      ((!ts.isFunctionLike(node) || node === fn) && (ts.forEachChild(node, usesThis) ?? false));
    if (
      fn.parameters.some(
        (parameter) =>
          !ts.isIdentifier(parameter.name) ||
          parameter.initializer !== undefined ||
          parameter.dotDotDotToken !== undefined,
      ) ||
      usesThis(fn)
    ) {
      return undefined;
    }
    const params = fn.parameters.map(() => fresh("p"));
    const operator = fresh("Native");
    const entry = { name, operator, isRecursive: false };
    compiled.delete(name);
    compiling.push(entry);
    const scope: Scope = {
      m: "m",
      w: "w",
      body: fn,
      fresh: new Set(),
      locals: new Map(
        fn.parameters.map((parameter, index) => [
          (parameter.name as ts.Identifier).text,
          params[index],
        ]),
      ),
    };
    const state = { isPure: true };
    const body = fn.body;
    const text =
      body === undefined
        ? undefined
        : ts.isBlock(body)
          ? compileStatements(body.statements, scope, (m, w) => result(m, w, "Undefined"), state)
          : (() => {
              const value = compileExpression(body, scope);
              const v = fresh("v");
              return value === undefined
                ? undefined
                : `LET ${v} == ${value.text} IN IF ${v}.type = "bail" THEN LBail ELSE ${result("m", "w", v)}`;
            })();
    compiling.pop();
    if (text === undefined || (entry.isRecursive && !state.isPure)) {
      compiled.set(name, undefined);
      return undefined;
    }
    const formals = ["m", "w", ...params];
    if (entry.isRecursive)
      definitions.push(`RECURSIVE ${operator}(${formals.map(() => "_").join(", ")})`);
    definitions.push(`${operator}(${formals.join(", ")}) ==\n  ${text}`);
    const done = { operator, isPure: state.isPure };
    compiled.set(name, done);
    return done;
  };

  return {
    definitions,
    getOperator: (name) => compileFunction(name)?.operator,
  };
};

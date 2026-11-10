\* The JSON object (§25.5), with JSON.rawJSON and JSON.isRawJSON and the reviver's source context
\* of the JSON.parse source text access proposal, as engine262 has them.
JSONIntrinsics == << IntrinsicObject("JSON", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

JSONProperties ==
  << GlobalLink("JSON", N("JSON")),
     M("JSON", SV("parse"), "JSON", "parse", 2),
     M("JSON", SV("stringify"), "JSON", "stringify", 3),
     M("JSON", SV("rawJSON"), "JSON", "rawJSON", 1),
     M("JSON", SV("isRawJSON"), "JSON", "isRawJSON", 1),
     V("JSON", SymToStringTag, SV("JSON"), FALSE, FALSE, TRUE) >>

JSONBuiltin(s, f, m, this, args, nt) ==
  CASE m = "parse" -> JSONParse(s, Arg(args, 1), Arg(args, 2))
    [] m = "stringify" -> JSONStringify(s, Arg(args, 1), Arg(args, 2), Arg(args, 3))
    [] m = "rawJSON" -> JSONRawJSON(s, Arg(args, 1))
    [] m = "isRawJSON" -> Ok(s, Bool(IsObject(Arg(args, 1)) /\ O(s, Arg(args, 1)).class = "rawJSON"))

\* JSON.parse (§25.5.1). ParseJSON checks the text against ECMA-404 and gives its parse tree, which
\* JSONEvaluate turns into a value as evaluating the text as a script would.
JSONParse(s, text, reviver) ==
  LET str == ToStr(s, text) IN IF IsAbrupt(str) THEN str ELSE
  LET tree == ParseJSON(Val(str).value) IN
  IF tree = None THEN ThrowError(str.s, "SyntaxError")
  ELSE LET result == JSONEvaluate(str.s, tree) IN
       IF ~IsCallable(result.s, reviver) THEN Ok(result.s, result.v)
       ELSE LET root == OrdinaryObjectCreate(result.s, Intrinsic(result.s, "ObjectPrototype")) IN
            LET c == CreateDataPropertyOrThrow(root.s, Val(root), EmptyStr, result.v) IN
            InternalizeJSONProperty(c.s, Val(root), EmptyStr, reviver, result.record)

\* The parse tree of a JSON text, or None. A node is a value with its source text, an array of
\* nodes, or an object of <<key, node>> members.
ParseJSON(units) ==
  LET r == JSONValue(units, JSONWhitespace(units, 1)) IN
  IF r.ok /\ r.i = Len(units) + 1 THEN r.node ELSE None

JSONFail == [ok |-> FALSE]
\* A parsed node, with the index after it and the whitespace that follows.
JSONNode(units, node, i) == [ok |-> TRUE, node |-> node, i |-> JSONWhitespace(units, i)]
JSONPrimitive(units, value, from, to) ==
  JSONNode(units, [type |-> "value", value |-> value, source |-> SubSeq(units, from, to - 1)], to)
JSONWhitespace(units, i) ==
  IF i <= Len(units) /\ units[i] \in {9, 10, 13, 32} THEN JSONWhitespace(units, i + 1) ELSE i
JSONHas(units, i, word) == i + Len(word) - 1 <= Len(units) /\ SubSeq(units, i, i + Len(word) - 1) = word

\* The node of the JSON value at index i.
JSONValue(units, i) ==
  IF i > Len(units) THEN JSONFail
  ELSE LET c == units[i] IN
  CASE c = 34 ->
         LET r == JSONString(units, i + 1, <<>>) IN
         IF r.ok THEN JSONPrimitive(units, Str(r.units), i, r.i) ELSE r
    [] c = 123 -> JSONObject(units, JSONWhitespace(units, i + 1), <<>>)
    [] c = 91 -> JSONArray(units, JSONWhitespace(units, i + 1), <<>>)
    [] c = 45 \/ IsDigit(c) ->
         LET end == JSONNumberEnd(units, i) IN
         IF end = 0 THEN JSONFail ELSE JSONPrimitive(units, Num(StrToNum(SubSeq(units, i, end - 1))), i, end)
    [] JSONHas(units, i, N("true")) -> JSONPrimitive(units, True, i, i + 4)
    [] JSONHas(units, i, N("false")) -> JSONPrimitive(units, False, i, i + 5)
    [] JSONHas(units, i, N("null")) -> JSONPrimitive(units, Null, i, i + 4)
    [] OTHER -> JSONFail

\* A string's code units after its opening quote at i - 1, with the index after its closing quote.
JSONString(units, i, acc) ==
  IF i > Len(units) THEN JSONFail
  ELSE LET c == units[i] IN
  CASE c = 34 -> [ok |-> TRUE, units |-> acc, i |-> i + 1]
    [] c < 32 -> JSONFail
    [] c = 92 /\ i < Len(units) ->
         LET e == units[i + 1]
             escaped == CASE e \in {34, 47, 92} -> e [] e = 98 -> 8 [] e = 102 -> 12 [] e = 110 -> 10
                          [] e = 114 -> 13 [] e = 116 -> 9 [] OTHER -> -1
         IN IF escaped >= 0 THEN JSONString(units, i + 2, Append(acc, escaped))
            ELSE IF e = 117 /\ i + 5 <= Len(units) /\ \A k \in i + 2..i + 5 : IsHexDigit(units[k])
            THEN JSONString(units, i + 6, Append(acc, ((NumDigitValue(units[i + 2]) * 16 + NumDigitValue(units[i + 3])) * 16 +
                                                       NumDigitValue(units[i + 4])) * 16 + NumDigitValue(units[i + 5])))
            ELSE JSONFail
    [] c = 92 -> JSONFail
    [] OTHER -> JSONString(units, i + 1, Append(acc, c))
IsHexDigit(c) == IsDigit(c) \/ (c >= 65 /\ c <= 70) \/ (c >= 97 /\ c <= 102)

\* The index after the number at i, or 0 when it isn't one.
JSONNumberEnd(units, i) ==
  LET At(k, set) == k <= Len(units) /\ units[k] \in set
      Digits(k) == IF At(k, 48..57) THEN JSONDigitsEnd(units, k) ELSE 0
      sign == IF At(i, {45}) THEN i + 1 ELSE i
      integer == IF At(sign, {48}) THEN sign + 1 ELSE IF At(sign, 49..57) THEN JSONDigitsEnd(units, sign) ELSE 0
      fraction == IF integer = 0 \/ ~At(integer, {46}) THEN integer ELSE Digits(integer + 1)
      exponentSign == IF At(fraction + 1, {43, 45}) THEN fraction + 2 ELSE fraction + 1
  IN IF fraction = 0 \/ ~At(fraction, {69, 101}) THEN fraction ELSE Digits(exponentSign)
JSONDigitsEnd(units, i) == IF i <= Len(units) /\ IsDigit(units[i]) THEN JSONDigitsEnd(units, i + 1) ELSE i

\* The members of an object after its opening brace, from index i.
JSONObject(units, i, members) ==
  IF i > Len(units) THEN JSONFail
  ELSE IF units[i] = 125 THEN JSONNode(units, [type |-> "object", members |-> members], i + 1)
  ELSE LET j == IF members = <<>> THEN i ELSE IF units[i] = 44 THEN JSONWhitespace(units, i + 1) ELSE 0 IN
  IF j = 0 \/ j > Len(units) \/ units[j] # 34 THEN JSONFail ELSE
  LET key == JSONString(units, j + 1, <<>>) IN IF ~key.ok THEN key ELSE
  LET colon == JSONWhitespace(units, key.i) IN
  IF colon > Len(units) \/ units[colon] # 58 THEN JSONFail ELSE
  LET value == JSONValue(units, JSONWhitespace(units, colon + 1)) IN IF ~value.ok THEN value
  ELSE JSONObject(units, value.i, Append(members, <<key.units, value.node>>))

\* The elements of an array after its opening bracket, from index i.
JSONArray(units, i, items) ==
  IF i > Len(units) THEN JSONFail
  ELSE IF units[i] = 93 THEN JSONNode(units, [type |-> "array", items |-> items], i + 1)
  ELSE LET j == IF items = <<>> THEN i ELSE IF units[i] = 44 THEN JSONWhitespace(units, i + 1) ELSE 0 IN
  IF j = 0 THEN JSONFail ELSE
  LET value == JSONValue(units, j) IN IF ~value.ok THEN value ELSE JSONArray(units, value.i, Append(items, value.node))

\* Evaluates a parse tree to [s, v, record], with the JSON Parse Record (§25.5.1.2) that
\* CreateJSONParseRecord would make for it: [value, source, elements, entries], where entries maps
\* each key to the record of its last member.
JSONEvaluate(s, tree) ==
  CASE tree.type = "value" ->
         [s |-> s, v |-> tree.value,
          record |-> [value |-> tree.value, source |-> tree.source, elements |-> <<>>, entries |-> <<>>]]
    [] tree.type = "array" ->
         LET items == JSONEvaluateItems(s, tree.items, <<>>, <<>>)
             a == CreateArrayFromList(items.s, items.values)
         IN [s |-> a.s, v |-> Val(a), record |-> [value |-> Val(a), source |-> <<>>, elements |-> items.records, entries |-> <<>>]]
    [] OTHER ->
         LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
             members == JSONEvaluateMembers(o.s, Val(o), tree.members, <<>>)
         IN [s |-> members.s, v |-> Val(o), record |-> [value |-> Val(o), source |-> <<>>, elements |-> <<>>, entries |-> members.entries]]
JSONEvaluateItems(s, items, values, records) ==
  IF items = <<>> THEN [s |-> s, values |-> values, records |-> records]
  ELSE LET r == JSONEvaluate(s, Head(items)) IN
       JSONEvaluateItems(r.s, Tail(items), Append(values, r.v), Append(records, r.record))
JSONEvaluateMembers(s, o, members, entries) ==
  IF members = <<>> THEN [s |-> s, entries |-> entries]
  ELSE LET key == Str(Head(members)[1])
           r == JSONEvaluate(s, Head(members)[2])
           c == CreateDataProperty(r.s, o, key, r.v)
       IN JSONEvaluateMembers(c.s, o, Tail(members), (key :> r.record) @@ entries)

\* InternalizeJSONProperty (§25.5.1.3), with the parse record of the value or Absent.
InternalizeJSONProperty(s, holder, name, reviver, record) ==
  LET val == Get(s, holder, name) IN IF IsAbrupt(val) THEN val ELSE
  LET v == Val(val)
      context == OrdinaryObjectCreate(val.s, Intrinsic(val.s, "ObjectPrototype"))
      isSame == record # Absent /\ SameValue(record.value, v)
      withSource == IF isSame /\ ~IsObject(v)
                    THEN CreateDataPropertyOrThrow(context.s, Val(context), SV("source"), Str(record.source))
                    ELSE Ok(context.s, Empty)
      revived ==
        IF ~IsObject(v) THEN withSource
        ELSE LET isArray == IsArray(withSource.s, v) IN IF IsAbrupt(isArray) THEN isArray
        ELSE IF Val(isArray) = True THEN
          LET len == LengthOfArrayLike(isArray.s, v) IN IF IsAbrupt(len) THEN len
          ELSE InternalizeJSONElements(len.s, v, reviver, IF isSame THEN record.elements ELSE <<>>, Val(len).value, PosZero)
        ELSE LET keys == EnumerableOwnProperties(isArray.s, v, "key") IN IF IsAbrupt(keys) THEN keys
        ELSE InternalizeJSONKeys(keys.s, v, reviver, IF isSame THEN record.entries ELSE <<>>, Val(keys))
  IN IF IsAbrupt(revived) THEN revived ELSE Call(revived.s, reviver, holder, <<name, v, Val(context)>>)
InternalizeJSONElements(s, v, reviver, records, len, i) ==
  IF ~NumLess(i, len) THEN Ok(s, Empty)
  ELSE LET record == IF NumLess(i, NumFromInt(Len(records))) THEN records[NumToSmallInt(i) + 1] ELSE Absent
           r == InternalizeJSONReplace(s, v, Index(i), reviver, record)
       IN IF IsAbrupt(r) THEN r ELSE InternalizeJSONElements(r.s, v, reviver, records, len, NumAdd(i, OneNum))
InternalizeJSONKeys(s, v, reviver, entries, keys) ==
  IF keys = <<>> THEN Ok(s, Empty)
  ELSE LET r == InternalizeJSONReplace(s, v, Head(keys), reviver,
                                       IF Head(keys) \in DOMAIN entries THEN entries[Head(keys)] ELSE Absent)
       IN IF IsAbrupt(r) THEN r ELSE InternalizeJSONKeys(r.s, v, reviver, entries, Tail(keys))
\* Revives the property k of v, then deletes it or redefines it with the new value.
InternalizeJSONReplace(s, v, k, reviver, record) ==
  LET e == InternalizeJSONProperty(s, v, k, reviver, record) IN IF IsAbrupt(e) THEN e
  ELSE IF Val(e) = Undefined THEN Delete(e.s, v, k) ELSE CreateDataProperty(e.s, v, k, Val(e))

\* JSON.rawJSON (§25.5.3 of the proposal).
JSONRawJSON(s, text) ==
  LET str == ToStr(s, text) IN IF IsAbrupt(str) THEN str ELSE
  LET units == Val(str).value
      forbidden == {9, 10, 13, 32, 91, 123}
  IN IF units = <<>> \/ units[1] \in forbidden \/ Last(units) \in forbidden \/ ParseJSON(units) = None
     THEN ThrowError(str.s, "SyntaxError")
     ELSE LET a == Alloc(str.s, MakeObject(Null, "rawJSON", [none |-> TRUE])) IN
          LET c == CreateDataPropertyOrThrow(a.s, a.v, SV("rawJSON"), Val(str)) IN
          LET frozen == SetIntegrityLevel(c.s, a.v, "frozen") IN Ok(frozen.s, a.v)

\* JSON.stringify (§25.5.2). The serialization state is [replacer, list, gap, stack, indent], with
\* list the PropertyList or None.
JSONStringify(s, value, replacer, space) ==
  LET list ==
        IF ~IsObject(replacer) \/ IsCallable(s, replacer) THEN Ok(s, None)
        ELSE LET isArray == IsArray(s, replacer) IN IF IsAbrupt(isArray) THEN isArray
        ELSE IF Val(isArray) = False THEN Ok(isArray.s, None)
        ELSE LET len == LengthOfArrayLike(isArray.s, replacer) IN IF IsAbrupt(len) THEN len
        ELSE JSONPropertyList(len.s, replacer, Val(len).value, PosZero, <<>>)
  IN IF IsAbrupt(list) THEN list ELSE
  LET sp == IF IsObject(space) /\ O(list.s, space).class = "number" THEN ToNumber(list.s, space)
            ELSE IF IsObject(space) /\ O(list.s, space).class = "string" THEN ToStr(list.s, space)
            ELSE Ok(list.s, space)
  IN IF IsAbrupt(sp) THEN sp ELSE
  LET gap == CASE IsNumber(Val(sp)) ->
                    LET n == NumToIntegerOrInfinity(Val(sp).value) IN
                    Repeat(32, IF NumLess(n, OneNum) THEN 0 ELSE IF NumLess(NumFromInt(10), n) THEN 10 ELSE NumToSmallInt(n))
                [] IsString(Val(sp)) -> SubSeq(Val(sp).value, 1, IF Len(Val(sp).value) < 10 THEN Len(Val(sp).value) ELSE 10)
                [] OTHER -> <<>>
      wrapper == OrdinaryObjectCreate(sp.s, Intrinsic(sp.s, "ObjectPrototype"))
      c == CreateDataPropertyOrThrow(wrapper.s, Val(wrapper), EmptyStr, value)
      state == [replacer |-> IF IsCallable(s, replacer) THEN replacer ELSE Undefined,
                list |-> Val(list), gap |-> gap, stack |-> <<>>, indent |-> <<>>]
  IN SerializeJSONProperty(c.s, state, EmptyStr, Val(wrapper))
JSONPropertyList(s, replacer, len, k, list) ==
  IF ~NumLess(k, len) THEN Ok(s, list)
  ELSE LET v == Get(s, replacer, Index(k)) IN IF IsAbrupt(v) THEN v ELSE
       LET x == Val(v)
           item == CASE IsString(x) -> Ok(v.s, x)
                     [] IsNumber(x) -> Ok(v.s, Str(NumToString(x.value)))
                     [] IsObject(x) /\ O(v.s, x).class \in {"string", "number"} -> ToStr(v.s, x)
                     [] OTHER -> Ok(v.s, Undefined)
       IN IF IsAbrupt(item) THEN item
          ELSE JSONPropertyList(item.s, replacer, len, NumAdd(k, OneNum),
                                IF Val(item) = Undefined \/ Val(item) \in Range(list) THEN list ELSE Append(list, Val(item)))

\* SerializeJSONProperty (§25.5.2.2): a String value, or Undefined.
SerializeJSONProperty(s, state, key, holder) ==
  LET value == Get(s, holder, key) IN IF IsAbrupt(value) THEN value ELSE
  LET withJSON ==
        IF ~IsObject(Val(value)) /\ ~IsBigInt(Val(value)) THEN value
        ELSE LET toJSON == GetValueProperty(value.s, Val(value), SV("toJSON")) IN IF IsAbrupt(toJSON) THEN toJSON
        ELSE IF IsCallable(toJSON.s, Val(toJSON)) THEN Call(toJSON.s, Val(toJSON), Val(value), <<key>>)
        ELSE Ok(toJSON.s, Val(value))
  IN IF IsAbrupt(withJSON) THEN withJSON ELSE
  LET replaced == IF state.replacer = Undefined THEN withJSON
                  ELSE Call(withJSON.s, state.replacer, holder, <<key, Val(withJSON)>>)
  IN IF IsAbrupt(replaced) THEN replaced ELSE
  LET x == Val(replaced)
      class == IF IsObject(x) THEN O(replaced.s, x).class ELSE ""
  IN IF class = "rawJSON" THEN Get(replaced.s, x, SV("rawJSON")) ELSE
  LET unwrapped == CASE class = "number" -> ToNumber(replaced.s, x)
                     [] class = "string" -> ToStr(replaced.s, x)
                     [] class \in {"boolean", "bigint"} -> Ok(replaced.s, O(replaced.s, x).slots.data)
                     [] OTHER -> replaced
  IN IF IsAbrupt(unwrapped) THEN unwrapped ELSE
  LET v == Val(unwrapped)
      t == unwrapped.s
  IN CASE v = Null -> Ok(t, SV("null"))
       [] v = True -> Ok(t, SV("true"))
       [] v = False -> Ok(t, SV("false"))
       [] IsString(v) -> Ok(t, Str(QuoteJSONString(v.value)))
       [] IsNumber(v) -> Ok(t, IF NumIsFinite(v.value) THEN Str(NumToString(v.value)) ELSE SV("null"))
       [] IsBigInt(v) -> ThrowTypeError(t)
       [] IsObject(v) /\ ~IsCallable(t, v) ->
            LET isArray == IsArray(t, v) IN IF IsAbrupt(isArray) THEN isArray
            ELSE IF v \in Range(state.stack) THEN ThrowTypeError(isArray.s)
            ELSE LET inner == [state EXCEPT !.stack = Append(@, v), !.indent = @ \o state.gap] IN
                 IF Val(isArray) = True THEN SerializeJSONArray(isArray.s, inner, state.indent, v)
                 ELSE SerializeJSONObject(isArray.s, inner, state.indent, v)
       [] OTHER -> Ok(t, Undefined)

\* QuoteJSONString (§25.5.2.3).
QuoteJSONString(units) ==
  LET cps == StringToCodePoints(units, 0, <<>>) IN
  <<34>> \o FoldLeftSeq([i \in DOMAIN cps |->
    LET cp == cps[i] IN
    CASE cp = 8 -> <<92, 98>> [] cp = 9 -> <<92, 116>> [] cp = 10 -> <<92, 110>> [] cp = 12 -> <<92, 102>>
      [] cp = 13 -> <<92, 114>> [] cp = 34 -> <<92, 34>> [] cp = 92 -> <<92, 92>>
      [] cp < 32 \/ (cp >= 55296 /\ cp <= 57343) ->
           <<92, 117>> \o [k \in 1..4 |-> NumDigitChar((cp \div (16 ^ (4 - k))) % 16)]
      [] OTHER -> UTF16EncodeCodePoint(cp)]) \o <<34>>

\* The members or elements of an object or array, as SerializeJSONObject and SerializeJSONArray
\* (§25.5.2.5, §25.5.2.6) join them, with stepback the indent outside.
JSONJoin(state, stepback, open, close, partial) ==
  IF partial = <<>> THEN <<open, close>>
  ELSE IF state.gap = <<>> THEN <<open>> \o JoinUnits(partial, <<44>>) \o <<close>>
  ELSE <<open, 10>> \o state.indent \o JoinUnits(partial, <<44, 10>> \o state.indent) \o <<10>> \o stepback \o <<close>>
JoinUnits(parts, separator) ==
  FoldLeftSeq([i \in DOMAIN parts |-> (IF i = 1 THEN <<>> ELSE separator) \o parts[i]])

\* SerializeJSONObject (§25.5.2.5).
SerializeJSONObject(s, state, stepback, value) ==
  LET keys == IF state.list # None THEN Ok(s, state.list) ELSE EnumerableOwnProperties(s, value, "key") IN
  IF IsAbrupt(keys) THEN keys ELSE
  LET partial == SerializeJSONMembers(keys.s, state, value, Val(keys), <<>>) IN
  IF IsAbrupt(partial) THEN partial ELSE Ok(partial.s, Str(JSONJoin(state, stepback, 123, 125, Val(partial))))
SerializeJSONMembers(s, state, value, keys, partial) ==
  IF keys = <<>> THEN Ok(s, partial)
  ELSE LET str == SerializeJSONProperty(s, state, Head(keys), value) IN IF IsAbrupt(str) THEN str
       ELSE SerializeJSONMembers(str.s, state, value, Tail(keys),
              IF Val(str) = Undefined THEN partial
              ELSE Append(partial, QuoteJSONString(Head(keys).value) \o <<58>> \o
                                   (IF state.gap = <<>> THEN <<>> ELSE <<32>>) \o Val(str).value))

\* SerializeJSONArray (§25.5.2.6).
SerializeJSONArray(s, state, stepback, value) ==
  LET len == LengthOfArrayLike(s, value) IN IF IsAbrupt(len) THEN len ELSE
  LET partial == SerializeJSONElements(len.s, state, value, Val(len).value, PosZero, <<>>) IN
  IF IsAbrupt(partial) THEN partial ELSE Ok(partial.s, Str(JSONJoin(state, stepback, 91, 93, Val(partial))))
SerializeJSONElements(s, state, value, len, i, partial) ==
  IF ~NumLess(i, len) THEN Ok(s, partial)
  ELSE LET str == SerializeJSONProperty(s, state, Index(i), value) IN IF IsAbrupt(str) THEN str
       ELSE SerializeJSONElements(str.s, state, value, len, NumAdd(i, OneNum),
              Append(partial, IF Val(str) = Undefined THEN N("null") ELSE Val(str).value))

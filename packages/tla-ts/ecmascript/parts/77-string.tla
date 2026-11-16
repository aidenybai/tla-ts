\* String objects (§22.1), String Iterator objects (§22.1.5), and the String methods of Annex B
\* (§B.2.2).
StringIntrinsics ==
  << IntrinsicObject("StringPrototype", "ObjectPrototype", "string", [data |-> <<>>]),
     IntrinsicFunction("String", "FunctionPrototype", <<"String", "constructor">>, 1, N("String"), TRUE),
     IntrinsicFunction("StringProto_trimStart", "FunctionPrototype", <<"String", "trimStart">>, 0, N("trimStart"), FALSE),
     IntrinsicFunction("StringProto_trimEnd", "FunctionPrototype", <<"String", "trimEnd">>, 0, N("trimEnd"), FALSE),
     IntrinsicObject("StringIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]) >>

StringProperties ==
  Ctor("String", "StringPrototype") \o
  << GlobalLink("String", N("String")),
     M("String", SV("fromCharCode"), "String", "fromCharCode", 1),
     M("String", SV("fromCodePoint"), "String", "fromCodePoint", 1),
     M("String", SV("raw"), "String", "raw", 1),
     V("StringPrototype", SV("length"), IntV(0), FALSE, FALSE, FALSE),
     M("StringPrototype", SV("at"), "String", "at", 1),
     M("StringPrototype", SV("charAt"), "String", "charAt", 1),
     M("StringPrototype", SV("charCodeAt"), "String", "charCodeAt", 1),
     M("StringPrototype", SV("codePointAt"), "String", "codePointAt", 1),
     M("StringPrototype", SV("concat"), "String", "concat", 1),
     M("StringPrototype", SV("endsWith"), "String", "endsWith", 1),
     M("StringPrototype", SV("includes"), "String", "includes", 1),
     M("StringPrototype", SV("indexOf"), "String", "indexOf", 1),
     M("StringPrototype", SV("isWellFormed"), "String", "isWellFormed", 0),
     M("StringPrototype", SV("lastIndexOf"), "String", "lastIndexOf", 1),
     M("StringPrototype", SV("localeCompare"), "String", "localeCompare", 1),
     M("StringPrototype", SV("match"), "String", "match", 1),
     M("StringPrototype", SV("matchAll"), "String", "matchAll", 1),
     M("StringPrototype", SV("normalize"), "String", "normalize", 0),
     M("StringPrototype", SV("padEnd"), "String", "padEnd", 1),
     M("StringPrototype", SV("padStart"), "String", "padStart", 1),
     M("StringPrototype", SV("repeat"), "String", "repeat", 1),
     M("StringPrototype", SV("replace"), "String", "replace", 2),
     M("StringPrototype", SV("replaceAll"), "String", "replaceAll", 2),
     M("StringPrototype", SV("search"), "String", "search", 1),
     M("StringPrototype", SV("slice"), "String", "slice", 2),
     M("StringPrototype", SV("split"), "String", "split", 2),
     M("StringPrototype", SV("startsWith"), "String", "startsWith", 1),
     M("StringPrototype", SV("substring"), "String", "substring", 2),
     M("StringPrototype", SV("toLocaleLowerCase"), "String", "toLowerCase", 0),
     M("StringPrototype", SV("toLocaleUpperCase"), "String", "toUpperCase", 0),
     M("StringPrototype", SV("toLowerCase"), "String", "toLowerCase", 0),
     M("StringPrototype", SV("toString"), "String", "toString", 0),
     M("StringPrototype", SV("toUpperCase"), "String", "toUpperCase", 0),
     M("StringPrototype", SV("toWellFormed"), "String", "toWellFormed", 0),
     M("StringPrototype", SV("trim"), "String", "trim", 0),
     L("StringPrototype", SV("trimEnd"), "StringProto_trimEnd", TRUE, FALSE, TRUE),
     L("StringPrototype", SV("trimStart"), "StringProto_trimStart", TRUE, FALSE, TRUE),
     M("StringPrototype", SV("valueOf"), "String", "valueOf", 0),
     M("StringPrototype", SymIterator, "String", "iterator", 0),
     M("StringIteratorPrototype", SV("next"), "StringIterator", "next", 0),
     V("StringIteratorPrototype", SymToStringTag, SV("String Iterator"), FALSE, FALSE, TRUE),
     \* Annex B (§B.2.2).
     M("StringPrototype", SV("substr"), "String", "substr", 2),
     M("StringPrototype", SV("anchor"), "String", "anchor", 1),
     M("StringPrototype", SV("big"), "String", "big", 0),
     M("StringPrototype", SV("blink"), "String", "blink", 0),
     M("StringPrototype", SV("bold"), "String", "bold", 0),
     M("StringPrototype", SV("fixed"), "String", "fixed", 0),
     M("StringPrototype", SV("fontcolor"), "String", "fontcolor", 1),
     M("StringPrototype", SV("fontsize"), "String", "fontsize", 1),
     M("StringPrototype", SV("italics"), "String", "italics", 0),
     M("StringPrototype", SV("link"), "String", "link", 1),
     M("StringPrototype", SV("small"), "String", "small", 0),
     M("StringPrototype", SV("strike"), "String", "strike", 0),
     M("StringPrototype", SV("sub"), "String", "sub", 0),
     M("StringPrototype", SV("sup"), "String", "sup", 0),
     L("StringPrototype", SV("trimLeft"), "StringProto_trimStart", TRUE, FALSE, TRUE),
     L("StringPrototype", SV("trimRight"), "StringProto_trimEnd", TRUE, FALSE, TRUE) >>

\* thisStringValue (§22.1.3.35.1).
ThisStringValue(s, v) ==
  IF IsString(v) THEN Ok(s, v)
  ELSE IF IsObject(v) /\ O(s, v).class = "string" THEN Ok(s, Str(O(s, v).slots.data))
  ELSE ThrowTypeError(s)

StringBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> StringConstructor(s, args, nt)
    [] m \in {"toString", "valueOf"} -> ThisStringValue(s, this)
    [] m = "fromCharCode" -> StringFromCharCode(s, args, <<>>)
    [] m = "fromCodePoint" -> StringFromCodePoint(s, args, <<>>)
    [] m = "raw" -> StringRaw(s, Arg(args, 1), Rest(args, 2))
    [] m \in {"match", "matchAll", "replace", "replaceAll", "search", "split"} ->
         LET o == RequireObjectCoercible(s, this) IN IF IsAbrupt(o) THEN o ELSE StringRegExpMethod(o.s, this, m, args)
    [] OTHER ->
         LET o == RequireObjectCoercible(s, this) IN IF IsAbrupt(o) THEN o ELSE
         LET str == ToStr(o.s, this) IN IF IsAbrupt(str) THEN str ELSE
         StringMethod(str.s, Val(str).value, m, args)

\* String (§22.1.1.1).
StringConstructor(s, args, nt) ==
  LET str == IF args = <<>> THEN Ok(s, EmptyStr)
             ELSE IF nt = Undefined /\ IsSymbol(args[1]) THEN Ok(s, SymbolDescriptiveString(s, args[1]))
             ELSE ToStr(s, args[1])
  IN IF IsAbrupt(str) \/ nt = Undefined THEN str
     ELSE LET p == GetPrototypeFromConstructor(str.s, nt, "StringPrototype") IN
          IF IsAbrupt(p) THEN p ELSE StringCreate(p.s, Val(str), Val(p))

\* String.fromCharCode (§22.1.2.1).
StringFromCharCode(s, args, acc) ==
  IF args = <<>> THEN Ok(s, Str(acc))
  ELSE LET n == ToNumber(s, Head(args)) IN IF IsAbrupt(n) THEN n
       ELSE StringFromCharCode(n.s, Tail(args), Append(acc, NumToUint16(Val(n).value)))

\* String.fromCodePoint (§22.1.2.2).
StringFromCodePoint(s, args, acc) ==
  IF args = <<>> THEN Ok(s, Str(acc))
  ELSE LET n == ToNumber(s, Head(args)) IN IF IsAbrupt(n) THEN n ELSE
       LET x == Val(n).value IN
       IF ~NumIsFinite(x) \/ ~NumIsIntegral(x) THEN ThrowError(n.s, "RangeError")
       ELSE IF NumLess(x, PosZero) \/ NumLess(NumFromInt(1114111), x) THEN ThrowError(n.s, "RangeError")
       ELSE StringFromCodePoint(n.s, Tail(args), acc \o UTF16EncodeCodePoint(NumToSmallInt(x)))

\* String.raw (§22.1.2.4).
StringRaw(s, template, substitutions) ==
  LET cooked == ToObject(s, template) IN IF IsAbrupt(cooked) THEN cooked ELSE
  LET rawValue == Get(cooked.s, Val(cooked), SV("raw")) IN IF IsAbrupt(rawValue) THEN rawValue ELSE
  LET literals == ToObject(rawValue.s, Val(rawValue)) IN IF IsAbrupt(literals) THEN literals ELSE
  LET count == LengthOfArrayLike(literals.s, Val(literals)) IN IF IsAbrupt(count) THEN count
  ELSE IF NumIsZero(Val(count).value) THEN Ok(count.s, EmptyStr)
  ELSE StringRawFrom(count.s, Val(literals), Val(count).value, substitutions, 0, <<>>)
StringRawFrom(s, literals, count, substitutions, i, acc) ==
  LET literal == Get(s, literals, Index(NumFromInt(i))) IN IF IsAbrupt(literal) THEN literal ELSE
  LET next == ToStr(literal.s, Val(literal)) IN IF IsAbrupt(next) THEN next ELSE
  LET result == acc \o Val(next).value IN
  IF NumFromInt(i + 1) = count THEN Ok(next.s, Str(result))
  ELSE IF i >= Len(substitutions) THEN StringRawFrom(next.s, literals, count, substitutions, i + 1, result)
  ELSE LET sub == ToStr(next.s, substitutions[i + 1]) IN IF IsAbrupt(sub) THEN sub
       ELSE StringRawFrom(sub.s, literals, count, substitutions, i + 1, result \o Val(sub).value)

\* The String.prototype methods that start with RequireObjectCoercible and ToString of the this
\* value, whose code units are units.
StringMethod(s, units, m, args) ==
  LET size == NumFromInt(Len(units))
      a1 == Arg(args, 1)
  IN
  CASE m = "at" ->
         LET p == ToIntegerOrInfinity(s, a1) IN IF IsAbrupt(p) THEN p ELSE
         LET k == IF NumLess(Val(p).value, PosZero) THEN NumAdd(size, Val(p).value) ELSE Val(p).value IN
         Ok(p.s, IF NumLess(k, PosZero) \/ ~NumLess(k, size) THEN Undefined ELSE Str(<<units[NumToSmallInt(k) + 1]>>))
    [] m \in {"charAt", "charCodeAt", "codePointAt"} ->
         LET p == ToIntegerOrInfinity(s, a1) IN IF IsAbrupt(p) THEN p ELSE
         LET x == Val(p).value IN
         IF NumLess(x, PosZero) \/ ~NumLess(x, size)
         THEN Ok(p.s, CASE m = "charAt" -> EmptyStr [] m = "charCodeAt" -> Num(NaN) [] OTHER -> Undefined)
         ELSE LET i == NumToSmallInt(x) IN
              Ok(p.s, CASE m = "charAt" -> Str(<<units[i + 1]>>)
                        [] m = "charCodeAt" -> IntV(units[i + 1])
                        [] OTHER -> IntV(CodePointAt(units, i).cp))
    [] m = "concat" -> StringConcat(s, units, args)
    [] m \in {"endsWith", "includes", "startsWith"} ->
         LET isRegExp == IsRegExp(s, a1) IN IF IsAbrupt(isRegExp) THEN isRegExp
         ELSE IF Val(isRegExp) = True THEN ThrowTypeError(isRegExp.s)
         ELSE LET search == ToStr(isRegExp.s, a1) IN IF IsAbrupt(search) THEN search ELSE
         LET p == ClampedIndex(search.s, Arg(args, 2), Len(units), IF m = "endsWith" THEN Len(units) ELSE 0) IN
         IF IsAbrupt(p) THEN p ELSE
         LET searchUnits == Val(search).value
             searchLength == Len(searchUnits)
         IN Ok(p.s, Bool(CASE m = "includes" -> StringIndexOf(units, searchUnits, Val(p)) # -1
                           [] m = "startsWith" ->
                                Val(p) + searchLength <= Len(units) /\
                                SubSeq(units, Val(p) + 1, Val(p) + searchLength) = searchUnits
                           [] OTHER ->
                                Val(p) - searchLength >= 0 /\
                                SubSeq(units, Val(p) - searchLength + 1, Val(p)) = searchUnits))
    [] m = "indexOf" ->
         LET search == ToStr(s, a1) IN IF IsAbrupt(search) THEN search ELSE
         LET p == ClampedIndex(search.s, Arg(args, 2), Len(units), 0) IN IF IsAbrupt(p) THEN p
         ELSE Ok(p.s, IntV(StringIndexOf(units, Val(search).value, Val(p))))
    [] m = "lastIndexOf" ->
         LET search == ToStr(s, a1) IN IF IsAbrupt(search) THEN search ELSE
         LET n == ToNumber(search.s, Arg(args, 2)) IN IF IsAbrupt(n) THEN n ELSE
         LET maxStart == Len(units) - Len(Val(search).value)
             x == Val(n).value
             start == CASE NumIsNaN(x) \/ NumLess(NumFromInt(maxStart), x) -> maxStart
                         [] NumLess(x, PosZero) -> 0
                         [] OTHER -> NumToSmallInt(NumToIntegerOrInfinity(x))
         IN Ok(n.s, IntV(IF maxStart < 0 THEN -1 ELSE StringLastIndexOf(units, Val(search).value, start)))
    [] m = "isWellFormed" -> Ok(s, Bool(IsStringWellFormedUnicode(units, 0)))
    [] m = "localeCompare" ->
         LET that == ToStr(s, a1) IN IF IsAbrupt(that) THEN that ELSE
         LET x == Normalize(units, "NFC")
             y == Normalize(Val(that).value, "NFC")
         IN Ok(that.s, IntV(IF x = y THEN 0 ELSE IF LexLess(x, y) THEN -1 ELSE 1))
    [] m = "normalize" ->
         LET form == IF a1 = Undefined THEN Ok(s, SV("NFC")) ELSE ToStr(s, a1) IN IF IsAbrupt(form) THEN form ELSE
         LET f == Val(form).value IN
         CASE f = N("NFC") -> Ok(form.s, Str(Normalize(units, "NFC")))
           [] f = N("NFD") -> Ok(form.s, Str(Normalize(units, "NFD")))
           [] f = N("NFKC") -> Ok(form.s, Str(Normalize(units, "NFKC")))
           [] f = N("NFKD") -> Ok(form.s, Str(Normalize(units, "NFKD")))
           [] OTHER -> ThrowError(form.s, "RangeError")
    [] m \in {"padEnd", "padStart"} -> StringPad(s, units, a1, Arg(args, 2), m = "padStart")
    [] m = "repeat" ->
         LET n == ToIntegerOrInfinity(s, a1) IN IF IsAbrupt(n) THEN n
         ELSE IF NumLess(Val(n).value, PosZero) \/ Val(n).value = PosInf THEN ThrowError(n.s, "RangeError")
         ELSE IF units = <<>> \/ NumIsZero(Val(n).value) THEN Ok(n.s, EmptyStr)
         ELSE Ok(n.s, Str(RepeatUnits(units, NumToSmallInt(Val(n).value))))
    [] m = "slice" ->
         LET st == RelativeIndex(s, a1, size, PosZero) IN IF IsAbrupt(st) THEN st ELSE
         LET en == RelativeIndex(st.s, Arg(args, 2), size, size) IN IF IsAbrupt(en) THEN en ELSE
         LET from == NumToSmallInt(Val(st))
             to == NumToSmallInt(Val(en))
         IN Ok(en.s, IF from >= to THEN EmptyStr ELSE Str(SubSeq(units, from + 1, to)))
    [] m = "substring" ->
         LET st == ClampedIndex(s, a1, Len(units), 0) IN IF IsAbrupt(st) THEN st ELSE
         LET en == ClampedIndex(st.s, Arg(args, 2), Len(units), Len(units)) IN IF IsAbrupt(en) THEN en ELSE
         LET from == IF Val(st) < Val(en) THEN Val(st) ELSE Val(en)
             to == IF Val(st) < Val(en) THEN Val(en) ELSE Val(st)
         IN Ok(en.s, Str(SubSeq(units, from + 1, to)))
    [] m = "toLowerCase" -> Ok(s, Str(ToLowercase(units)))
    [] m = "toUpperCase" -> Ok(s, Str(ToUppercase(units)))
    [] m = "toWellFormed" -> Ok(s, Str(ToWellFormed(units, 0, <<>>)))
    [] m = "trim" -> Ok(s, Str(TrimString(units, TRUE, TRUE)))
    [] m = "trimStart" -> Ok(s, Str(TrimString(units, TRUE, FALSE)))
    [] m = "trimEnd" -> Ok(s, Str(TrimString(units, FALSE, TRUE)))
    [] m = "iterator" ->
         LET a == Alloc(s, MakeObject(Intrinsic(s, "StringIteratorPrototype"), "stringIterator",
                                      [string |-> units, position |-> 0]))
         IN Ok(a.s, a.v)
    \* String.prototype.substr (§B.2.2.1).
    [] m = "substr" ->
         LET st == ToIntegerOrInfinity(s, a1) IN IF IsAbrupt(st) THEN st ELSE
         LET x == Val(st).value
             start == CASE NumLess(x, PosZero) ->
                             IF NumLess(NumAdd(size, x), PosZero) THEN 0 ELSE NumToSmallInt(NumAdd(size, x))
                        [] NumLess(size, x) -> Len(units)
                        [] OTHER -> NumToSmallInt(x)
             len == ClampedIndex(st.s, Arg(args, 2), Len(units), Len(units))
         IN IF IsAbrupt(len) THEN len
            ELSE LET end == IF start + Val(len) < Len(units) THEN start + Val(len) ELSE Len(units) IN
                 Ok(len.s, Str(SubSeq(units, start + 1, end)))
    \* The HTML methods (§B.2.2.2 to §B.2.2.14).
    [] OTHER -> CreateHTML(s, units, m, a1)

\* String.prototype.concat (§22.1.3.5).
StringConcat(s, units, args) ==
  IF args = <<>> THEN Ok(s, Str(units))
  ELSE LET next == ToStr(s, Head(args)) IN IF IsAbrupt(next) THEN next
       ELSE StringConcat(next.s, units \o Val(next).value, Tail(args))

\* An index argument clamped to 0..len as a TLA+ integer, or default when it is undefined.
ClampedIndex(s, v, len, default) ==
  IF v = Undefined THEN Ok(s, default)
  ELSE LET n == ToIntegerOrInfinity(s, v) IN IF IsAbrupt(n) THEN n ELSE
       LET x == Val(n).value IN
       Ok(n.s, IF NumLess(x, PosZero) THEN 0 ELSE IF NumLess(NumFromInt(len), x) THEN len ELSE NumToSmallInt(NumAdd(x, PosZero)))

\* StringIndexOf (§6.1.4.1): the first index at or after start where search occurs, or -1.
StringIndexOf(units, search, start) ==
  IF search = <<>> /\ start <= Len(units) THEN start
  ELSE IF start + Len(search) > Len(units) THEN -1
  ELSE IF SubSeq(units, start + 1, start + Len(search)) = search THEN start
  ELSE StringIndexOf(units, search, start + 1)

\* The last index at or before start where search occurs, or -1, as lastIndexOf searches.
StringLastIndexOf(units, search, start) ==
  IF start < 0 THEN -1
  ELSE IF SubSeq(units, start + 1, start + Len(search)) = search THEN start
  ELSE StringLastIndexOf(units, search, start - 1)

\* StringPad (§22.1.3.17.2) after ToString of the this value.
StringPad(s, units, maxLength, fillString, atStart) ==
  LET l == ToLength(s, maxLength) IN IF IsAbrupt(l) THEN l
  ELSE IF ~NumLess(NumFromInt(Len(units)), Val(l).value) THEN Ok(l.s, Str(units))
  ELSE LET filler == IF fillString = Undefined THEN Ok(l.s, SV(" ")) ELSE ToStr(l.s, fillString) IN
  IF IsAbrupt(filler) THEN filler
  ELSE IF Val(filler).value = <<>> THEN Ok(filler.s, Str(units))
  ELSE LET fillLen == NumToSmallInt(Val(l).value) - Len(units)
           fill == SubSeq(RepeatUnits(Val(filler).value, fillLen \div Len(Val(filler).value) + 1), 1, fillLen)
       IN Ok(filler.s, Str(IF atStart THEN fill \o units ELSE units \o fill))

\* The code units repeated n times.
RepeatUnits(units, n) ==
  IF n = 0 THEN <<>>
  ELSE LET half == RepeatUnits(units, n \div 2) IN half \o half \o (IF n % 2 = 1 THEN units ELSE <<>>)

\* TrimString (§22.1.3.32.1), trimming WhiteSpace and LineTerminator at the start, the end, or both.
TrimString(units, atStart, atEnd) ==
  SubSeq(units, IF atStart THEN NumTrimStart(units, 1) ELSE 1, IF atEnd THEN NumTrimEnd(units, Len(units)) ELSE Len(units))

\* Code points (§6.1.4, §11.1). CodePointAt (§11.1.4) reads the code point at the 0-based position.
CodePointAt(units, pos) ==
  LET first == units[pos + 1] IN
  IF first < 55296 \/ first > 57343 THEN [cp |-> first, count |-> 1, unpaired |-> FALSE]
  ELSE IF first > 56319 \/ pos + 1 = Len(units) THEN [cp |-> first, count |-> 1, unpaired |-> TRUE]
  ELSE LET second == units[pos + 2] IN
       IF second < 56320 \/ second > 57343 THEN [cp |-> first, count |-> 1, unpaired |-> TRUE]
       ELSE [cp |-> (first - 55296) * 1024 + second - 56320 + 65536, count |-> 2, unpaired |-> FALSE]

\* UTF16EncodeCodePoint (§11.1.1).
UTF16EncodeCodePoint(cp) ==
  IF cp < 65536 THEN <<cp>> ELSE <<(cp - 65536) \div 1024 + 55296, ((cp - 65536) % 1024) + 56320>>

\* StringToCodePoints (§11.1.5), from the 0-based position i, with lone surrogates as themselves.
StringToCodePoints(units, i, acc) ==
  IF i >= Len(units) THEN acc
  ELSE LET cp == CodePointAt(units, i) IN StringToCodePoints(units, i + cp.count, Append(acc, cp.cp))

CodePointsToUnits(cps) == FoldLeftSeq([i \in DOMAIN cps |-> UTF16EncodeCodePoint(cps[i])])

\* IsStringWellFormedUnicode (§6.1.4.2), from the 0-based position i.
IsStringWellFormedUnicode(units, i) ==
  IF i >= Len(units) THEN TRUE
  ELSE LET cp == CodePointAt(units, i) IN ~cp.unpaired /\ IsStringWellFormedUnicode(units, i + cp.count)

\* String.prototype.toWellFormed (§22.1.3.31) from the 0-based position i.
ToWellFormed(units, i, acc) ==
  IF i >= Len(units) THEN acc
  ELSE LET cp == CodePointAt(units, i) IN
       ToWellFormed(units, i + cp.count, acc \o IF cp.unpaired THEN <<65533>> ELSE UTF16EncodeCodePoint(cp.cp))

\* String.prototype.match, matchAll, replace, replaceAll, search, and split (§22.1.3.13, .14, .19,
\* .20, .23, .24), which defer to the method of an object argument's well-known symbol.
StringRegExpMethod(s, this, m, args) ==
  LET regexp == Arg(args, 1)
      symbol == CASE m = "match" -> SymMatch [] m = "matchAll" -> SymMatchAll [] m = "search" -> SymSearch
                  [] m = "split" -> SymSplit [] OTHER -> SymReplace
      checked == IF m \in {"matchAll", "replaceAll"} /\ IsObject(regexp) THEN RequireGlobalFlag(s, regexp) ELSE Ok(s, Empty)
  IN IF IsAbrupt(checked) THEN checked ELSE
     LET method == IF IsObject(regexp) THEN GetMethod(checked.s, regexp, symbol) ELSE Ok(checked.s, Undefined) IN
     IF IsAbrupt(method) THEN method
     ELSE IF Val(method) # Undefined
     THEN Call(method.s, Val(method), regexp, IF m \in {"match", "matchAll", "search"} THEN <<this>> ELSE <<this, Arg(args, 2)>>)
     ELSE LET str == ToStr(method.s, this) IN IF IsAbrupt(str) THEN str ELSE
     CASE m \in {"match", "matchAll", "search"} ->
            LET rx == RegExpCreate(str.s, regexp, IF m = "matchAll" THEN SV("g") ELSE Undefined) IN
            IF IsAbrupt(rx) THEN rx ELSE Invoke(rx.s, Val(rx), symbol, <<Val(str)>>)
       [] m = "split" -> StringSplit(str.s, Val(str).value, regexp, Arg(args, 2))
       [] OTHER -> StringReplace(str.s, Val(str).value, regexp, Arg(args, 2), m = "replaceAll")

\* The check of matchAll and replaceAll that a RegExp argument is global.
RequireGlobalFlag(s, regexp) ==
  LET isRegExp == IsRegExp(s, regexp) IN IF IsAbrupt(isRegExp) \/ Val(isRegExp) = False THEN isRegExp ELSE
  LET flags == Get(isRegExp.s, regexp, SV("flags")) IN IF IsAbrupt(flags) THEN flags ELSE
  LET coercible == RequireObjectCoercible(flags.s, Val(flags)) IN IF IsAbrupt(coercible) THEN coercible ELSE
  LET str == ToStr(coercible.s, Val(flags)) IN IF IsAbrupt(str) THEN str
  ELSE IF 103 \notin Range(Val(str).value) THEN ThrowTypeError(str.s)
  ELSE str

\* The string steps of String.prototype.replace and replaceAll.
StringReplace(s, units, searchValue, replaceValue, isAll) ==
  LET search == ToStr(s, searchValue) IN IF IsAbrupt(search) THEN search ELSE
  LET isFunctional == IsCallable(search.s, replaceValue)
      template == IF isFunctional THEN Ok(search.s, Empty) ELSE ToStr(search.s, replaceValue)
      searchUnits == Val(search).value
  IN IF IsAbrupt(template) THEN template ELSE
     LET positions == IF isAll THEN MatchPositions(units, searchUnits, StringIndexOf(units, searchUnits, 0), <<>>)
                      ELSE LET p == StringIndexOf(units, searchUnits, 0) IN IF p = -1 THEN <<>> ELSE <<p>>
     IN ReplaceAt(template.s, units, searchUnits, positions, IF isFunctional THEN replaceValue ELSE Val(template), 0, <<>>)
MatchPositions(units, search, p, acc) ==
  IF p = -1 THEN acc
  ELSE MatchPositions(units, search, StringIndexOf(units, search, p + IF search = <<>> THEN 1 ELSE Len(search)), Append(acc, p))
\* Replaces each match in positions, with the result so far acc up to endOfLastMatch.
ReplaceAt(s, units, search, positions, replaceValue, endOfLastMatch, acc) ==
  IF positions = <<>> THEN Ok(s, Str(acc \o SubSeq(units, endOfLastMatch + 1, Len(units))))
  ELSE LET p == Head(positions)
           replacement ==
             IF IsString(replaceValue)
             THEN GetSubstitution(s, search, units, p, <<>>, Undefined, replaceValue.value, <<>>)
             ELSE LET r == Call(s, replaceValue, Undefined, <<Str(search), IntV(p), Str(units)>>) IN
                  IF IsAbrupt(r) THEN r ELSE ToStr(r.s, Val(r))
       IN IF IsAbrupt(replacement) THEN replacement
          ELSE ReplaceAt(replacement.s, units, search, Tail(positions), replaceValue, p + Len(search),
                         acc \o SubSeq(units, endOfLastMatch + 1, p) \o Val(replacement).value)

\* GetSubstitution (§22.1.3.19.1) over the rest of the template, appending to acc. captures holds
\* String values or Undefined, and namedCaptures is an object or Undefined.
GetSubstitution(s, matched, str, position, captures, namedCaptures, rest, acc) ==
  IF rest = <<>> THEN Ok(s, Str(acc))
  ELSE LET Next(n, replacement) ==
             GetSubstitution(s, matched, str, position, captures, namedCaptures, SubSeq(rest, n + 1, Len(rest)), acc \o replacement)
           c == IF Len(rest) >= 2 /\ rest[1] = 36 THEN rest[2] ELSE 0
       IN CASE c = 36 -> Next(2, <<36>>)
            [] c = 96 -> Next(2, SubSeq(str, 1, position))
            [] c = 38 -> Next(2, matched)
            [] c = 39 ->
                 LET tail == position + Len(matched) IN
                 Next(2, SubSeq(str, (IF tail < Len(str) THEN tail ELSE Len(str)) + 1, Len(str)))
            [] IsDigit(c) ->
                 LET twoDigits == (c - 48) * 10 + (IF Len(rest) >= 3 /\ IsDigit(rest[3]) THEN rest[3] - 48 ELSE 0)
                     isTwo == Len(rest) >= 3 /\ IsDigit(rest[3]) /\ twoDigits <= Len(captures)
                     index == IF isTwo THEN twoDigits ELSE c - 48
                     ref == SubSeq(rest, 1, IF isTwo THEN 3 ELSE 2)
                 IN Next(Len(ref), IF index < 1 \/ index > Len(captures) THEN ref
                                   ELSE IF captures[index] = Undefined THEN <<>> ELSE captures[index].value)
            [] c = 60 ->
                 LET gtPos == StringIndexOf(rest, <<62>>, 0) IN
                 IF gtPos = -1 \/ namedCaptures = Undefined THEN Next(2, <<36, 60>>)
                 ELSE LET capture == Get(s, namedCaptures, Str(SubSeq(rest, 3, gtPos))) IN
                      IF IsAbrupt(capture) THEN capture
                      ELSE LET text == IF Val(capture) = Undefined THEN Ok(capture.s, EmptyStr) ELSE ToStr(capture.s, Val(capture)) IN
                           IF IsAbrupt(text) THEN text
                           ELSE GetSubstitution(text.s, matched, str, position, captures, namedCaptures,
                                                SubSeq(rest, gtPos + 2, Len(rest)), acc \o Val(text).value)
            [] OTHER -> Next(1, <<rest[1]>>)

\* The string steps of String.prototype.split (§22.1.3.23).
StringSplit(s, units, separator, limit) ==
  LET lim == IF limit = Undefined THEN Ok(s, Num(NumToUint32(NumFromInt(-1)))) ELSE ToUint32(s, limit) IN
  IF IsAbrupt(lim) THEN lim ELSE
  LET sep == ToStr(lim.s, separator) IN IF IsAbrupt(sep) THEN sep ELSE
  LET r == Val(sep).value
      n == Val(lim).value
  IN CASE NumIsZero(n) -> CreateArrayFromList(sep.s, <<>>)
       [] separator = Undefined -> CreateArrayFromList(sep.s, <<Str(units)>>)
       [] r = <<>> ->
            LET count == IF NumLess(n, NumFromInt(Len(units))) THEN NumToSmallInt(n) ELSE Len(units) IN
            CreateArrayFromList(sep.s, [i \in 1..count |-> Str(<<units[i]>>)])
       [] units = <<>> -> CreateArrayFromList(sep.s, <<Str(units)>>)
       [] OTHER -> CreateArrayFromList(sep.s, SplitFrom(units, r, n, 0, StringIndexOf(units, r, 0), <<>>))
SplitFrom(units, sep, lim, i, j, acc) ==
  IF j = -1 THEN Append(acc, Str(SubSeq(units, i + 1, Len(units))))
  ELSE LET substrings == Append(acc, Str(SubSeq(units, i + 1, j))) IN
       IF NumEqual(NumFromInt(Len(substrings)), lim) THEN substrings
       ELSE SplitFrom(units, sep, lim, j + Len(sep), StringIndexOf(units, sep, j + Len(sep)), substrings)

\* CreateHTML (§B.2.2.2.1) for the HTML method m, after ToString of the this value.
CreateHTML(s, units, m, value) ==
  LET tag == CASE m = "anchor" -> N("a") [] m = "big" -> N("big") [] m = "blink" -> N("blink")
               [] m = "bold" -> N("b") [] m = "fixed" -> N("tt") [] m \in {"fontcolor", "fontsize"} -> N("font")
               [] m = "italics" -> N("i") [] m = "link" -> N("a") [] m = "small" -> N("small")
               [] m = "strike" -> N("strike") [] m = "sub" -> N("sub") [] m = "sup" -> N("sup")
      attribute == CASE m = "anchor" -> N("name") [] m = "fontcolor" -> N("color") [] m = "fontsize" -> N("size")
                     [] m = "link" -> N("href") [] OTHER -> <<>>
      v == IF attribute = <<>> THEN Ok(s, EmptyStr) ELSE ToStr(s, value)
  IN IF IsAbrupt(v) THEN v
     ELSE LET escaped == FoldLeftSeq([i \in DOMAIN Val(v).value |-> IF Val(v).value[i] = 34 THEN N("&quot;") ELSE <<Val(v).value[i]>>])
              p1 == <<60>> \o tag \o (IF attribute = <<>> THEN <<>> ELSE <<32>> \o attribute \o <<61, 34>> \o escaped \o <<34>>)
          IN Ok(v.s, Str(p1 \o <<62>> \o units \o <<60, 47>> \o tag \o <<62>>))

\* %StringIteratorPrototype%.next (§22.1.5.1.1). The iterator holds the string and the 0-based
\* position of the next code point, as the closure of String.prototype[@@iterator] (§22.1.3.36) does.
StringIteratorBuiltin(s, f, m, this, args, nt) ==
  IF ~IsObject(this) \/ O(s, this).class # "stringIterator" THEN ThrowTypeError(s)
  ELSE LET slots == O(s, this).slots IN
  IF slots.position >= Len(slots.string) THEN CreateIterResultObject(s, Undefined, TRUE)
  ELSE LET next == slots.position + CodePointAt(slots.string, slots.position).count IN
       CreateIterResultObject(SetO(s, this, [O(s, this) EXCEPT !.slots.position = next]),
                              Str(SubSeq(slots.string, slots.position + 1, next)), FALSE)

\* Unicode normalization (UAX #15) into form "NFC", "NFD", "NFKC", or "NFKD", as engine262's host
\* does for String.prototype.normalize (§22.1.3.15).
Normalize(units, form) ==
  LET decomposed == CanonicalOrder(DecomposeAll(StringToCodePoints(units, 0, <<>>), form \in {"NFKC", "NFKD"}), 1, <<>>)
  IN CodePointsToUnits(IF form \in {"NFC", "NFKC"} THEN Compose(decomposed, 1, <<>>, 0, 256) ELSE decomposed)

\* The index of the last row of a sorted table whose first field is at most key, or 0.
UnicodeFloor(table, key, low, high) ==
  IF low > high THEN high
  ELSE LET mid == (low + high) \div 2 IN
       IF table[mid][1] <= key THEN UnicodeFloor(table, key, mid + 1, high) ELSE UnicodeFloor(table, key, low, mid - 1)
\* The code points a table of <<code point, code points>> maps cp to, or <<>>.
UnicodePoint(table, cp) ==
  LET i == UnicodeFloor(table, cp, 1, Len(table)) IN IF i > 0 /\ table[i][1] = cp THEN table[i][2] ELSE <<>>
\* The code points a table of runs <<first, last, step, delta>> maps cp to, or <<>>.
UnicodeRun(table, cp) ==
  LET i == UnicodeFloor(table, cp, 1, Len(table)) IN
  IF i > 0 /\ cp <= table[i][2] /\ (cp - table[i][1]) % table[i][3] = 0 THEN <<cp + table[i][4]>> ELSE <<>>
UnicodeInRanges(table, cp) ==
  LET i == UnicodeFloor(table, cp, 1, Len(table)) IN i > 0 /\ cp <= table[i][2]
UnicodeMapping(runs, special, cp) ==
  LET r == UnicodeRun(runs, cp) IN IF r # <<>> THEN r ELSE UnicodePoint(special, cp)

CombiningClass(cp) ==
  LET i == UnicodeFloor(UnicodeCombiningClasses, cp, 1, Len(UnicodeCombiningClasses)) IN
  IF i > 0 /\ cp <= UnicodeCombiningClasses[i][2] THEN UnicodeCombiningClasses[i][3] ELSE 0

\* The full decomposition of each code point, with Hangul syllables decomposed by formula.
DecomposeAll(cps, isCompatibility) ==
  FoldLeftSeq([i \in DOMAIN cps |->
    LET cp == cps[i]
        index == cp - 44032
        compatible == IF isCompatibility THEN UnicodeMapping(UnicodeCompatibilityRuns, UnicodeCompatibilitySpecial, cp) ELSE <<>>
        canonical == UnicodePoint(UnicodeCanonicalDecompositions, cp)
    IN CASE index >= 0 /\ index < 11172 ->
              <<4352 + index \div 588, 4449 + (index % 588) \div 28>> \o (IF index % 28 = 0 THEN <<>> ELSE <<4519 + (index % 28)>>)
         [] compatible # <<>> -> compatible
         [] canonical # <<>> -> canonical
         [] OTHER -> <<cp>>])

\* The canonical ordering algorithm: a stable sort of each run of nonstarters by combining class.
CanonicalOrder(cps, i, out) ==
  IF i > Len(cps) THEN out
  ELSE LET class == CombiningClass(cps[i])
           k == IF class = 0 THEN Len(out) ELSE MarkPosition(out, class, Len(out))
       IN CanonicalOrder(cps, i + 1, SubSeq(out, 1, k) \o <<cps[i]>> \o SubSeq(out, k + 1, Len(out)))
MarkPosition(out, class, k) ==
  IF k > 0 /\ CombiningClass(out[k]) > class THEN MarkPosition(out, class, k - 1) ELSE k

\* The canonical composition algorithm, with starter the index in out of the last starter or 0, and
\* lastClass the combining class of the last code point kept, or 256 before the first starter.
Compose(cps, i, out, starter, lastClass) ==
  IF i > Len(cps) THEN out
  ELSE LET cp == cps[i]
           class == CombiningClass(cp)
           composite == IF starter > 0 THEN ComposePair(out[starter], cp) ELSE 0
       IN IF composite > 0 /\ (lastClass < class \/ lastClass = 0)
          THEN Compose(cps, i + 1, [out EXCEPT ![starter] = composite], starter, lastClass)
          ELSE Compose(cps, i + 1, Append(out, cp), IF class = 0 THEN Len(out) + 1 ELSE starter, class)
\* The primary composite of a and b, or 0.
ComposePair(a, b) ==
  CASE a >= 4352 /\ a < 4371 /\ b >= 4449 /\ b < 4470 -> 44032 + ((a - 4352) * 21 + b - 4449) * 28
    [] a >= 44032 /\ a < 55204 /\ (a - 44032) % 28 = 0 /\ b > 4519 /\ b < 4547 -> a + b - 4519
    [] OTHER ->
         LET i == CompositionFloor(a, b, 1, Len(UnicodeCompositions)) IN
         IF i > 0 /\ UnicodeCompositions[i][1] = a /\ UnicodeCompositions[i][2] = b THEN UnicodeCompositions[i][3] ELSE 0
\* The index of the last row of UnicodeCompositions whose pair is at most <<a, b>>, or 0.
CompositionFloor(a, b, low, high) ==
  IF low > high THEN high
  ELSE LET mid == (low + high) \div 2
           row == UnicodeCompositions[mid]
       IN IF row[1] < a \/ (row[1] = a /\ row[2] <= b) THEN CompositionFloor(a, b, mid + 1, high)
          ELSE CompositionFloor(a, b, low, mid - 1)

\* Full case mapping, as engine262's host does for String.prototype.toLowerCase (§22.1.3.28) and
\* toUpperCase (§22.1.3.30), with the Final_Sigma condition for U+03A3.
ToLowercase(units) ==
  LET cps == StringToCodePoints(units, 0, <<>>) IN
  CodePointsToUnits(FoldLeftSeq([i \in DOMAIN cps |->
    IF cps[i] = 931 THEN <<IF IsCasedBefore(cps, i - 1) /\ ~IsCasedAfter(cps, i + 1) THEN 962 ELSE 963>>
    ELSE LET mapped == UnicodeMapping(UnicodeLowercaseRuns, UnicodeLowercaseSpecial, cps[i]) IN
         IF mapped = <<>> THEN <<cps[i]>> ELSE mapped]))
ToUppercase(units) ==
  LET cps == StringToCodePoints(units, 0, <<>>) IN
  CodePointsToUnits(FoldLeftSeq([i \in DOMAIN cps |->
    LET mapped == UnicodeMapping(UnicodeUppercaseRuns, UnicodeUppercaseSpecial, cps[i]) IN
    IF mapped = <<>> THEN <<cps[i]>> ELSE mapped]))
\* Whether a cased code point comes at or before index i, past case-ignorable ones, and at or
\* after it. A code point that is both is skipped, as the host does.
IsCasedBefore(cps, i) ==
  IF i < 1 THEN FALSE
  ELSE IF UnicodeInRanges(UnicodeCaseIgnorable, cps[i]) THEN IsCasedBefore(cps, i - 1)
  ELSE UnicodeInRanges(UnicodeCased, cps[i])
IsCasedAfter(cps, i) ==
  IF i > Len(cps) THEN FALSE
  ELSE IF UnicodeInRanges(UnicodeCaseIgnorable, cps[i]) THEN IsCasedAfter(cps, i + 1)
  ELSE UnicodeInRanges(UnicodeCased, cps[i])

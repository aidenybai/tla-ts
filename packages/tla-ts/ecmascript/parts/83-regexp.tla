\* RegExp objects (§22.2.3 to §22.2.9). A RegExp object has class "regexp" and the slots
\*   source, flags   [[OriginalSource]] and [[OriginalFlags]], as code units
\*   matcher         [[RegExpMatcher]], the compiled pattern
\*   groups          the pattern's capturing groups, each [name, path]
\*   realm, legacy   [[Realm]] and [[LegacyFeaturesEnabled]], from the legacy RegExp features proposal
\* A RegExp String Iterator has class "regexpStringIterator" and the slots r, str, global, unicode,
\* the state of its closure, and done and running, the state of its generator.

RegExpPrototypeFlags ==
  << <<SV("hasIndices"), 100>>, <<SV("global"), 103>>, <<SV("ignoreCase"), 105>>, <<SV("multiline"), 109>>,
     <<SV("dotAll"), 115>>, <<SV("unicode"), 117>>, <<SV("unicodeSets"), 118>>, <<SV("sticky"), 121>> >>

\* RegExpAlloc (§22.2.3.2), with the legacy RegExp features proposal's [[Realm]] and [[LegacyFeaturesEnabled]].
RegExpAlloc(s, newTarget) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, "RegExpPrototype", "regexp",
                                         [source |-> <<>>, flags |-> <<>>, matcher |-> None, groups |-> <<>>,
                                          realm |-> s.realmId, legacy |-> newTarget = Intrinsic(s, "RegExp")])
  IN IF IsAbrupt(o) THEN o
     ELSE Ok(SetO(o.s, Val(o), PutProp(O(o.s, Val(o)), SV("lastIndex"), DataDesc(Undefined, TRUE, FALSE, FALSE))), Val(o))

\* RegExpInitialize (§22.2.3.3).
RegExpInitialize(s, obj, pattern, flags) ==
  LET p == IF pattern = Undefined THEN Ok(s, EmptyStr) ELSE ToStr(s, pattern) IN IF IsAbrupt(p) THEN p ELSE
  LET f == IF flags = Undefined THEN Ok(p.s, EmptyStr) ELSE ToStr(p.s, flags) IN IF IsAbrupt(f) THEN f ELSE
  LET units == Val(f).value
      parsed == ParsePattern(Val(p).value, 117 \in Range(units), 118 \in Range(units))
  IN IF ~(Range(units) \subseteq Range(N("dgimsuvy"))) \/ Cardinality(Range(units)) # Len(units) THEN ThrowError(f.s, "SyntaxError")
     ELSE IF ~parsed.ok THEN ThrowError(f.s, "SyntaxError")
     ELSE LET rer == [ic |-> 105 \in Range(units), multiline |-> 109 \in Range(units), dotAll |-> 115 \in Range(units),
                      u |-> 117 \in Range(units), v |-> 118 \in Range(units), groups |-> parsed.pattern.groups]
              t == SetO(f.s, obj, [O(f.s, obj) EXCEPT !.slots.source = Val(p).value, !.slots.flags = units,
                                     !.slots.matcher = RxCompilePattern(parsed.pattern, rer), !.slots.groups = parsed.pattern.groups])
              r == Set(t, obj, SV("lastIndex"), IntV(0), TRUE)
          IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, obj)

\* RegExpCreate (§22.2.3.1).
RegExpCreate(s, P, F) ==
  LET o == RegExpAlloc(s, Intrinsic(s, "RegExp")) IN IF IsAbrupt(o) THEN o ELSE RegExpInitialize(o.s, Val(o), P, F)

\* Evaluation of a RegularExpressionLiteral (§13.2.7.3).
RegExpCreateLiteral(s, n) == RegExpCreate(s, Str(n.RegularExpressionBody), Str(n.RegularExpressionFlags))

\* The RegExp constructor (§22.2.4.1).
RegExpConstructor(s, f, pattern, flags, nt) ==
  LET isRegExp == IsRegExp(s, pattern) IN IF IsAbrupt(isRegExp) THEN isRegExp ELSE
  LET newTarget == IF nt = Undefined THEN f ELSE nt
      patternConstructor ==
        IF nt = Undefined /\ Val(isRegExp) = True /\ flags = Undefined THEN Get(isRegExp.s, pattern, SV("constructor"))
        ELSE Ok(isRegExp.s, Undefined)
  IN IF IsAbrupt(patternConstructor) THEN patternConstructor
     ELSE IF nt = Undefined /\ Val(isRegExp) = True /\ flags = Undefined /\ SameValue(newTarget, Val(patternConstructor))
     THEN Ok(patternConstructor.s, pattern)
     ELSE LET s1 == patternConstructor.s
              isMatcher == IsObject(pattern) /\ O(s1, pattern).class = "regexp"
              P == CASE isMatcher -> Ok(s1, Str(O(s1, pattern).slots.source))
                     [] Val(isRegExp) = True -> Get(s1, pattern, SV("source"))
                     [] OTHER -> Ok(s1, pattern)
          IN IF IsAbrupt(P) THEN P ELSE
          LET F == CASE flags # Undefined -> Ok(P.s, flags)
                     [] isMatcher -> Ok(P.s, Str(O(P.s, pattern).slots.flags))
                     [] Val(isRegExp) = True -> Get(P.s, pattern, SV("flags"))
                     [] OTHER -> Ok(P.s, Undefined)
          IN IF IsAbrupt(F) THEN F ELSE
          LET o == RegExpAlloc(F.s, newTarget) IN IF IsAbrupt(o) THEN o ELSE RegExpInitialize(o.s, Val(o), Val(P), Val(F))

IsRegExpObject(s, v) == IsObject(v) /\ O(s, v).class = "regexp"

\* RegExpExec (§22.2.7.1).
RegExpExec(s, R, S) ==
  LET exec == Get(s, R, SV("exec")) IN IF IsAbrupt(exec) THEN exec
  ELSE IF IsCallable(exec.s, Val(exec)) THEN
    LET result == Call(exec.s, Val(exec), R, <<S>>) IN
    IF IsAbrupt(result) THEN result
    ELSE IF ~IsObject(Val(result)) /\ Val(result) # Null THEN ThrowTypeError(result.s)
    ELSE result
  ELSE IF ~IsRegExpObject(exec.s, R) THEN ThrowTypeError(exec.s)
  ELSE RegExpBuiltinExec(exec.s, R, S)

\* The characters of a string as RegExpBuiltinExec matches them: its code points when fullUnicode,
\* with the index in the string where each starts, or else its code units.
RxIsPairSecond(units, j) == j > 1 /\ RxIsTrail(units[j]) /\ RxIsLead(units[j - 1])
RxCodePointAt(units, j) ==
  IF j < Len(units) /\ RxIsLead(units[j]) /\ RxIsTrail(units[j + 1])
  THEN UTF16SurrogatePairToCodePoint(units[j], units[j + 1]) ELSE units[j]
RxInput(units, fullUnicode) ==
  IF ~fullUnicode THEN [chars |-> units, starts |-> <<>>]
  ELSE LET starts == SelectSeq([j \in 1..Len(units) |-> j], LAMBDA j : ~RxIsPairSecond(units, j)) IN
       [chars |-> [i \in DOMAIN starts |-> RxCodePointAt(units, starts[i])], starts |-> [i \in DOMAIN starts |-> starts[i] - 1]]
\* The index into the input of the character that holds the code unit at index i.
RxInputIndex(units, fullUnicode, i) ==
  IF ~fullUnicode THEN i
  ELSE i - Cardinality({j \in 1..(IF i + 1 < Len(units) THEN i + 1 ELSE Len(units)) : RxIsPairSecond(units, j)})
\* GetStringIndex (§22.2.7.4).
GetStringIndex(units, input, fullUnicode, e) ==
  CASE ~fullUnicode -> e
    [] e >= Len(input.chars) -> Len(units)
    [] OTHER -> input.starts[e + 1]

\* AdvanceStringIndex (§22.2.7.3), on an integer index and on a Number.
RxAdvanceIndex(units, index, unicode) ==
  IF ~unicode \/ index + 1 >= Len(units) THEN index + 1
  ELSE IF RxIsLead(units[index + 1]) /\ RxIsTrail(units[index + 2]) THEN index + 2 ELSE index + 1
AdvanceStringIndex(units, index, unicode) ==
  IF ~NumLess(NumAdd(index, OneNum), NumFromInt(Len(units))) THEN NumAdd(index, OneNum)
  ELSE NumFromInt(RxAdvanceIndex(units, NumToSmallInt(index), unicode))

\* RegExpBuiltinExec (§22.2.7.2).
RegExpBuiltinExec(s, R, S) ==
  LET li == Get(s, R, SV("lastIndex")) IN IF IsAbrupt(li) THEN li ELSE
  LET len == ToLength(li.s, Val(li)) IN IF IsAbrupt(len) THEN len ELSE
  LET o == O(len.s, R).slots
      units == S.value
      global == 103 \in Range(o.flags)
      sticky == 121 \in Range(o.flags)
      fullUnicode == 117 \in Range(o.flags) \/ 118 \in Range(o.flags)
      input == RxInput(units, fullUnicode)
      lastIndex == IF ~global /\ ~sticky THEN PosZero ELSE Val(len).value
      found == IF NumLess(NumFromInt(Len(units)), lastIndex) THEN None
               ELSE RxExecFrom(o, units, input, fullUnicode, sticky, NumToSmallInt(lastIndex))
  IN IF found = None THEN
       LET r == IF global \/ sticky THEN Set(len.s, R, SV("lastIndex"), IntV(0), TRUE) ELSE Ok(len.s, Undefined) IN
       IF IsAbrupt(r) THEN r ELSE Ok(r.s, Null)
     ELSE LET e == GetStringIndex(units, input, fullUnicode, found.r.e)
              r == IF global \/ sticky THEN Set(len.s, R, SV("lastIndex"), IntV(e), TRUE) ELSE Ok(len.s, Undefined)
              captures == [i \in DOMAIN found.r.cap |->
                             IF found.r.cap[i] = None THEN None
                             ELSE [start |-> GetStringIndex(units, input, fullUnicode, found.r.cap[i][1]),
                                   end |-> GetStringIndex(units, input, fullUnicode, found.r.cap[i][2])]]
          IN IF IsAbrupt(r) THEN r
             ELSE RxMatchResult(UpdateLegacyRegExpStatics(r.s, R, units, found.index, e, captures), o, S,
                                [start |-> found.index, end |-> e], captures)
\* The legacy RegExp features proposal's static properties of %RegExp%, kept in its data slot as a
\* record of strings, each Empty until a match sets it, or Empty for all of them.
LegacyRegExpParens == [legacyParen1 |-> 1, legacyParen2 |-> 2, legacyParen3 |-> 3, legacyParen4 |-> 4, legacyParen5 |-> 5,
                       legacyParen6 |-> 6, legacyParen7 |-> 7, legacyParen8 |-> 8, legacyParen9 |-> 9]
LegacyRegExpNone == [input |-> Empty, lastMatch |-> Empty, lastParen |-> Empty, leftContext |-> Empty,
                     rightContext |-> Empty, parens |-> [i \in 1..9 |-> Empty]]
LegacyRegExpStatic(d, m) ==
  CASE d = Empty -> Empty
    [] m = "legacyInput" -> d.input
    [] m = "legacyLastMatch" -> d.lastMatch
    [] m = "legacyLastParen" -> d.lastParen
    [] m = "legacyLeftContext" -> d.leftContext
    [] m = "legacyRightContext" -> d.rightContext
    [] OTHER -> d.parens[LegacyRegExpParens[m]]
\* UpdateLegacyRegExpStaticProperties and InvalidateLegacyRegExpStaticProperties, for a match of R
\* in the current realm from start to end with the given captures.
UpdateLegacyRegExpStatics(s, R, units, start, end, captures) ==
  LET o == O(s, R).slots
      C == Intrinsic(s, "RegExp")
      Capture(i) == IF i > Len(captures) \/ captures[i] = None THEN <<>> ELSE SubSeq(units, captures[i].start + 1, captures[i].end)
  IN IF o.realm # s.realmId THEN s
     ELSE SetO(s, C, [O(s, C) EXCEPT !.slots.data =
                        IF ~o.legacy THEN Empty
                        ELSE [input |-> units, lastMatch |-> SubSeq(units, start + 1, end),
                              lastParen |-> IF captures = <<>> THEN <<>> ELSE Capture(Len(captures)),
                              leftContext |-> SubSeq(units, 1, start), rightContext |-> SubSeq(units, end + 1, Len(units)),
                              parens |-> [i \in 1..9 |-> Capture(i)]]])

\* The first index at or after lastIndex where the pattern matches, with its MatchState, or None.
RxExecFrom(o, units, input, fullUnicode, sticky, lastIndex) ==
  IF lastIndex > Len(units) THEN None ELSE
  LET r == RxRun(o.matcher, input.chars, RxInputIndex(units, fullUnicode, lastIndex), Len(o.groups)) IN
  CASE r # MatchFailure -> [index |-> lastIndex, r |-> r]
    [] sticky -> None
    [] OTHER -> RxExecFrom(o, units, input, fullUnicode, sticky, RxAdvanceIndex(units, lastIndex, fullUnicode))

\* The match array of RegExpBuiltinExec from the Match Records of the match and of each capture.
RxMatchResult(s, o, S, match, captures) ==
  LET values == [i \in DOMAIN captures |-> GetMatchString(S, captures[i])]
      a == CreateArrayFromList(s, <<GetMatchString(S, match)>> \o values)
      hasGroups == \E i \in DOMAIN o.groups : o.groups[i].name # None
      groups == RxGroupsObject(a.s, o, values, hasGroups)
      d == 100 \in Range(o.flags)
      indices == IF d THEN MakeMatchIndicesIndexPairArray(groups.s, o, <<match>> \o captures, hasGroups) ELSE Ok(groups.s, Undefined)
      pairs == <<<<SV("index"), IntV(match.start)>>, <<SV("input"), S>>, <<SV("groups"), Val(groups)>>>> \o
               (IF d THEN <<<<SV("indices"), Val(indices)>>>> ELSE <<>>)
  IN Ok(SetO(indices.s, Val(a), WithDataProps(O(indices.s, Val(a)), pairs)), Val(a))
\* GetMatchString (§22.2.7.5), or undefined for a capture that didn't participate.
GetMatchString(S, match) == IF match = None THEN Undefined ELSE Str(SubSeq(S.value, match.start + 1, match.end))
\* The groups object of a match with the value of each capture, or undefined. A name that more than
\* one group has gets the value of the one that participated.
RxGroupsObject(s, o, values, hasGroups) ==
  IF ~hasGroups THEN Ok(s, Undefined)
  ELSE LET a == Alloc(s, MakeObject(Null, "ordinary", [none |-> TRUE])) IN
       Ok(SetO(a.s, a.v, WithDataProps(O(a.s, a.v), RxGroupEntries(o, values))), a.v)
RxGroupEntries(o, values) ==
  LET named == SelectSeq([i \in DOMAIN o.groups |-> i],
                         LAMBDA i : o.groups[i].name # None /\
                                    ~\E j \in 1..(i - 1) : o.groups[j].name = o.groups[i].name /\ values[j] # Undefined)
  IN [i \in DOMAIN named |-> <<Str(o.groups[named[i]].name), values[named[i]]>>]
\* MakeMatchIndicesIndexPairArray (§22.2.7.8).
MakeMatchIndicesIndexPairArray(s, o, indices, hasGroups) ==
  LET pairs == RxIndexPairs(s, indices, 1, <<>>) IN
  LET a == CreateArrayFromList(pairs.s, Val(pairs)) IN
  LET groups == RxGroupsObject(a.s, o, Tail(Val(pairs)), hasGroups) IN
  Ok(SetO(groups.s, Val(a), WithDataProps(O(groups.s, Val(a)), <<<<SV("groups"), Val(groups)>>>>)), Val(a))
\* GetMatchIndexPair (§22.2.7.7) of each Match Record from the ith, or undefined.
RxIndexPairs(s, indices, i, acc) ==
  IF i > Len(indices) THEN Ok(s, acc)
  ELSE IF indices[i] = None THEN RxIndexPairs(s, indices, i + 1, Append(acc, Undefined))
  ELSE LET pair == CreateArrayFromList(s, <<IntV(indices[i].start), IntV(indices[i].end)>>) IN
       RxIndexPairs(pair.s, indices, i + 1, Append(acc, Val(pair)))

\* RegExpHasFlag (§22.2.6.4.1).
RegExpHasFlag(s, R, cu) ==
  CASE ~IsObject(R) -> ThrowTypeError(s)
    [] IsRegExpObject(s, R) -> Ok(s, Bool(cu \in Range(O(s, R).slots.flags)))
    [] SameValue(R, Intrinsic(s, "RegExpPrototype")) -> Ok(s, Undefined)
    [] OTHER -> ThrowTypeError(s)

\* get RegExp.prototype.flags (§22.2.6.4), from the ith getter on.
RxFlagsFrom(s, R, i, acc) ==
  IF i > Len(RegExpPrototypeFlags) THEN Ok(s, Str(acc))
  ELSE LET v == Get(s, R, RegExpPrototypeFlags[i][1]) IN
       IF IsAbrupt(v) THEN v
       ELSE RxFlagsFrom(v.s, R, i + 1, IF ToBooleanValue(Val(v)) THEN Append(acc, RegExpPrototypeFlags[i][2]) ELSE acc)
\* The flag of each flag getter.
RxFlagOf(m) ==
  CASE m = "hasIndices" -> 100 [] m = "global" -> 103 [] m = "ignoreCase" -> 105 [] m = "multiline" -> 109
    [] m = "dotAll" -> 115 [] m = "unicode" -> 117 [] m = "unicodeSets" -> 118 [] OTHER -> 121

\* EscapeRegExpPattern (§22.2.6.13.1), as engine262 escapes: "/" outside a class and line
\* terminators, from index i of the source.
EscapeRegExpPattern(source) == IF source = <<>> THEN N("(?:)") ELSE RxEscapeFrom(source, 1, FALSE, FALSE, <<>>)
RxEscapeFrom(source, i, inClass, isEscape, acc) ==
  IF i > Len(source) THEN acc ELSE
  LET c == source[i] IN
  CASE c = 92 /\ i < Len(source) /\ RxIsLineTerminator(source[i + 1]) -> RxEscapeFrom(source, i + 1, inClass, isEscape, acc)
    [] c = 92 -> RxEscapeFrom(source, i + 1, inClass, ~isEscape, Append(acc, 92))
    [] c = 47 -> RxEscapeFrom(source, i + 1, inClass, FALSE, acc \o (IF inClass \/ isEscape THEN <<47>> ELSE N("\\/")))
    [] c = 91 -> RxEscapeFrom(source, i + 1, inClass \/ ~isEscape, FALSE, Append(acc, 91))
    [] c = 93 -> RxEscapeFrom(source, i + 1, inClass /\ isEscape, FALSE, Append(acc, 93))
    [] c = 10 -> RxEscapeFrom(source, i + 1, inClass, FALSE, acc \o N("\\n"))
    [] c = 13 -> RxEscapeFrom(source, i + 1, inClass, FALSE, acc \o N("\\r"))
    [] c = 8232 -> RxEscapeFrom(source, i + 1, inClass, FALSE, acc \o N("\\u2028"))
    [] c = 8233 -> RxEscapeFrom(source, i + 1, inClass, FALSE, acc \o N("\\u2029"))
    [] OTHER -> RxEscapeFrom(source, i + 1, inClass, FALSE, Append(acc, c))

\* RegExp.prototype[@@match] (§22.2.6.8) from the nth match on, with global set.
RxMatchAll(s, rx, S, fullUnicode, A, n) ==
  LET result == RegExpExec(s, rx, S) IN IF IsAbrupt(result) THEN result
  ELSE IF Val(result) = Null THEN Ok(result.s, IF n = 0 THEN Null ELSE A)
  ELSE LET matchStr == RxGetString(result.s, Val(result), SV("0")) IN IF IsAbrupt(matchStr) THEN matchStr ELSE
       LET c == CreateDataPropertyOrThrow(matchStr.s, A, Index(NumFromInt(n)), Val(matchStr)) IN
       LET advanced == IF Val(matchStr) = EmptyStr THEN RxAdvanceLastIndex(c.s, rx, S, fullUnicode) ELSE Ok(c.s, Undefined) IN
       IF IsAbrupt(advanced) THEN advanced ELSE RxMatchAll(advanced.s, rx, S, fullUnicode, A, n + 1)
\* ? ToString(? Get(o, k)).
RxGetString(s, o, k) == LET v == Get(s, o, k) IN IF IsAbrupt(v) THEN v ELSE ToStr(v.s, Val(v))
\* Sets lastIndex past an empty match: thisIndex, AdvanceStringIndex, and Set.
RxAdvanceLastIndex(s, rx, S, fullUnicode) ==
  LET li == Get(s, rx, SV("lastIndex")) IN IF IsAbrupt(li) THEN li ELSE
  LET thisIndex == ToLength(li.s, Val(li)) IN IF IsAbrupt(thisIndex) THEN thisIndex
  ELSE Set(thisIndex.s, rx, SV("lastIndex"), Num(AdvanceStringIndex(S.value, Val(thisIndex).value, fullUnicode)), TRUE)

\* The flags of a RegExp object as a string, and whether they make it match code points.
RxFlagsString(s, rx) == RxGetString(s, rx, SV("flags"))
RxFullUnicode(flags) == 117 \in Range(flags.value) \/ 118 \in Range(flags.value)

\* RegExp.prototype[@@replace] (§22.2.6.11): the results of RegExpExec.
RxReplaceResults(s, rx, S, global, fullUnicode, results) ==
  LET result == RegExpExec(s, rx, S) IN IF IsAbrupt(result) THEN result
  ELSE IF Val(result) = Null THEN Ok(result.s, results)
  ELSE IF ~global THEN Ok(result.s, Append(results, Val(result)))
  ELSE LET matchStr == RxGetString(result.s, Val(result), SV("0")) IN IF IsAbrupt(matchStr) THEN matchStr ELSE
       LET advanced == IF Val(matchStr) = EmptyStr THEN RxAdvanceLastIndex(matchStr.s, rx, S, fullUnicode) ELSE Ok(matchStr.s, Undefined) IN
       IF IsAbrupt(advanced) THEN advanced ELSE RxReplaceResults(advanced.s, rx, S, global, fullUnicode, Append(results, Val(result)))
\* The replacements of the results from the ith on, with nextSourcePosition next.
RxReplaceFrom(s, S, replaceValue, functional, results, i, acc, next) ==
  IF i > Len(results) THEN
    Ok(s, Str(IF next >= Len(S.value) THEN acc ELSE acc \o SubSeq(S.value, next + 1, Len(S.value))))
  ELSE
    LET result == results[i] IN
    LET length == LengthOfArrayLike(s, result) IN IF IsAbrupt(length) THEN length ELSE
    LET matched == RxGetString(length.s, result, SV("0")) IN IF IsAbrupt(matched) THEN matched ELSE
    LET index == Get(matched.s, result, SV("index")) IN IF IsAbrupt(index) THEN index ELSE
    LET pos == ToIntegerOrInfinity(index.s, Val(index)) IN IF IsAbrupt(pos) THEN pos ELSE
    LET position == CASE NumLess(Val(pos).value, PosZero) -> 0
                      [] NumLess(NumFromInt(Len(S.value)), Val(pos).value) -> Len(S.value)
                      [] OTHER -> NumToSmallInt(NumAdd(Val(pos).value, PosZero))
        captures == RxResultCaptures(pos.s, result, Val(length).value, 1, <<>>)
    IN IF IsAbrupt(captures) THEN captures ELSE
    LET named == Get(captures.s, result, SV("groups")) IN IF IsAbrupt(named) THEN named ELSE
    LET replacement ==
          IF functional THEN
            LET replValue == Call(named.s, replaceValue, Undefined,
                                  <<Val(matched)>> \o Val(captures) \o <<IntV(position), S>> \o
                                  (IF Val(named) = Undefined THEN <<>> ELSE <<Val(named)>>))
            IN IF IsAbrupt(replValue) THEN replValue ELSE ToStr(replValue.s, Val(replValue))
          ELSE
            LET namedObject == IF Val(named) = Undefined THEN Ok(named.s, Undefined) ELSE ToObject(named.s, Val(named)) IN
            IF IsAbrupt(namedObject) THEN namedObject
            ELSE GetSubstitution(namedObject.s, Val(matched).value, S.value, position, Val(captures), Val(namedObject),
                                 replaceValue.value, <<>>)
    IN IF IsAbrupt(replacement) THEN replacement
       ELSE IF position >= next
       THEN RxReplaceFrom(replacement.s, S, replaceValue, functional, results, i + 1,
                          acc \o SubSeq(S.value, next + 1, position) \o Val(replacement).value, position + Len(Val(matched).value))
       ELSE RxReplaceFrom(replacement.s, S, replaceValue, functional, results, i + 1, acc, next)
\* The captures of a result from the nth, up to resultLength - 1, each a String or undefined.
RxResultCaptures(s, result, resultLength, n, acc) ==
  IF ~NumLess(NumFromInt(n), resultLength) THEN Ok(s, acc)
  ELSE LET capN == Get(s, result, Index(NumFromInt(n))) IN IF IsAbrupt(capN) THEN capN ELSE
       LET value == IF Val(capN) = Undefined THEN capN ELSE ToStr(capN.s, Val(capN)) IN
       IF IsAbrupt(value) THEN value ELSE RxResultCaptures(value.s, result, resultLength, n + 1, Append(acc, Val(value)))

\* RegExp.prototype[@@split] (§22.2.6.14), from q with the last split at p.
RxSplitFrom(s, splitter, S, unicodeMatching, A, lengthA, lim, p, q) ==
  LET size == Len(S.value) IN
  IF q >= size THEN
       LET c == CreateDataProperty(s, A, Index(NumFromInt(lengthA)), Str(SubSeq(S.value, p + 1, size))) IN
       IF IsAbrupt(c) THEN c ELSE Ok(c.s, A)
     ELSE
       LET set == Set(s, splitter, SV("lastIndex"), IntV(q), TRUE) IN IF IsAbrupt(set) THEN set ELSE
       LET z == RegExpExec(set.s, splitter, S) IN IF IsAbrupt(z) THEN z
       ELSE IF Val(z) = Null THEN RxSplitFrom(z.s, splitter, S, unicodeMatching, A, lengthA, lim, p, RxAdvanceIndex(S.value, q, unicodeMatching))
       ELSE LET li == Get(z.s, splitter, SV("lastIndex")) IN IF IsAbrupt(li) THEN li ELSE
            LET el == ToLength(li.s, Val(li)) IN IF IsAbrupt(el) THEN el ELSE
            LET e == IF NumLess(NumFromInt(size), Val(el).value) THEN size ELSE NumToSmallInt(Val(el).value) IN
            IF e = p THEN RxSplitFrom(el.s, splitter, S, unicodeMatching, A, lengthA, lim, p, RxAdvanceIndex(S.value, q, unicodeMatching))
            ELSE LET c == CreateDataProperty(el.s, A, Index(NumFromInt(lengthA)), Str(SubSeq(S.value, p + 1, q))) IN
                 IF IsAbrupt(c) THEN c
                 ELSE IF NumFromInt(lengthA + 1) = lim THEN Ok(c.s, A)
                 ELSE LET n == LengthOfArrayLike(c.s, Val(z)) IN IF IsAbrupt(n) THEN n
                 ELSE RxSplitCaptures(n.s, splitter, S, unicodeMatching, A, lengthA + 1, lim, e, Val(z), Val(n).value, 1)
\* Adds the captures of z from the ith, up to numberOfCaptures, then splits on from e.
RxSplitCaptures(s, splitter, S, unicodeMatching, A, lengthA, lim, e, z, resultLength, i) ==
  IF ~NumLess(NumFromInt(i), resultLength) THEN RxSplitFrom(s, splitter, S, unicodeMatching, A, lengthA, lim, e, e)
  ELSE LET capture == Get(s, z, Index(NumFromInt(i))) IN IF IsAbrupt(capture) THEN capture ELSE
       LET c == CreateDataProperty(capture.s, A, Index(NumFromInt(lengthA)), Val(capture)) IN
       IF IsAbrupt(c) THEN c
       ELSE IF NumFromInt(lengthA + 1) = lim THEN Ok(c.s, A)
       ELSE RxSplitCaptures(c.s, splitter, S, unicodeMatching, A, lengthA + 1, lim, e, z, resultLength, i + 1)

\* CreateRegExpStringIterator (§22.2.9.1).
CreateRegExpStringIterator(s, R, S, global, fullUnicode) ==
  LET a == Alloc(s, MakeObject(Intrinsic(s, "RegExpStringIteratorPrototype"), "regexpStringIterator",
                               [r |-> R, str |-> S, global |-> global, unicode |-> fullUnicode, done |-> FALSE, running |-> FALSE]))
  IN Ok(a.s, a.v)
\* %RegExpStringIteratorPrototype%.next (§22.2.9.2.1): GeneratorResume of the iterator's closure.
RegExpStringIteratorNext(s, it) ==
  IF ~IsObject(it) \/ O(s, it).class # "regexpStringIterator" THEN ThrowTypeError(s) ELSE
  LET o == O(s, it).slots IN
  IF o.running THEN ThrowTypeError(s)
  ELSE IF o.done THEN CreateIterResultObject(s, Undefined, TRUE)
  ELSE LET r == RxIteratorStep(SetO(s, it, [O(s, it) EXCEPT !.slots.running = TRUE]), o) IN
       IF IsAbrupt(r) THEN Abrupt(SetO(r.s, it, [O(r.s, it) EXCEPT !.slots.done = TRUE, !.slots.running = FALSE]), r.c)
       ELSE CreateIterResultObject(SetO(r.s, it, [O(r.s, it) EXCEPT !.slots.done = Val(r) = Null \/ ~o.global, !.slots.running = FALSE]),
                                   IF Val(r) = Null THEN Undefined ELSE Val(r), Val(r) = Null)
\* The closure's steps up to its next Yield: the match, or null when it returns.
RxIteratorStep(s, o) ==
  LET match == RegExpExec(s, o.r, o.str) IN
  IF IsAbrupt(match) \/ Val(match) = Null \/ ~o.global THEN match
  ELSE LET matchStr == RxGetString(match.s, Val(match), SV("0")) IN IF IsAbrupt(matchStr) THEN matchStr ELSE
       LET advanced == IF Val(matchStr) = EmptyStr THEN RxAdvanceLastIndex(matchStr.s, o.r, o.str, o.unicode) ELSE Ok(matchStr.s, Undefined) IN
       IF IsAbrupt(advanced) THEN advanced ELSE Ok(advanced.s, Val(match))

\* RegExp.escape (§22.2.5.1) and EncodeForRegExpEscape (§22.2.5.1.1).
RxHex(n, width) ==
  LET digit(d) == IF d < 10 THEN 48 + d ELSE 87 + d IN
  IF width = 0 THEN <<>> ELSE Append(RxHex(n \div 16, width - 1), digit(n % 16))
RxEscapeCodePoints(cps, i, acc) ==
  IF i > Len(cps) THEN acc ELSE
  LET c == cps[i] IN
  CASE acc = <<>> /\ (RxIsDigit(c) \/ RxIsAsciiLetter(c)) -> RxEscapeCodePoints(cps, i + 1, N("\\x") \o RxHex(c, 2))
    [] OTHER -> RxEscapeCodePoints(cps, i + 1, acc \o EncodeForRegExpEscape(c))
EncodeForRegExpEscape(c) ==
  CASE c = 47 \/ c \in RxSyntaxCharacters -> <<92>> \o UTF16EncodeCodePoint(c)
    [] c \in 9..13 -> <<92, CASE c = 9 -> 116 [] c = 10 -> 110 [] c = 11 -> 118 [] c = 12 -> 102 [] OTHER -> 114>>
    [] c \in Range(N(",-=<>#&!%:;@~'`\"")) \/ RxIsWhiteSpace(c) \/ RxIsLineTerminator(c) \/ (c >= 55296 /\ c <= 57343) ->
         IF c <= 255 THEN N("\\x") \o RxHex(c, 2)
         ELSE FoldLeftSeq([i \in DOMAIN UTF16EncodeCodePoint(c) |-> N("\\u") \o RxHex(UTF16EncodeCodePoint(c)[i], 4)])
    [] OTHER -> UTF16EncodeCodePoint(c)

RegExpBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1)
      a2 == Arg(args, 2)
  IN
  CASE m = "constructor" -> RegExpConstructor(s, f, a1, a2, nt)
    \* get RegExp[@@species] (§22.2.5.2).
    [] m = "species" -> Ok(s, this)
    \* GetLegacyRegExpStaticProperty and SetLegacyRegExpStaticProperty, of the legacy RegExp features proposal.
    [] m \in {"legacyInput", "legacyLastMatch", "legacyLastParen", "legacyLeftContext", "legacyRightContext"} \cup
              DOMAIN LegacyRegExpParens ->
         LET value == LegacyRegExpStatic(O(s, Intrinsic(s, "RegExp")).slots.data, m) IN
         IF ~SameValue(this, Intrinsic(s, "RegExp")) \/ value = Empty THEN ThrowTypeError(s) ELSE Ok(s, Str(value))
    [] m = "legacySetInput" ->
         IF ~SameValue(this, Intrinsic(s, "RegExp")) THEN ThrowTypeError(s) ELSE
         LET v == ToStr(s, a1) IN IF IsAbrupt(v) THEN v ELSE
         LET C == Intrinsic(v.s, "RegExp")
             d == O(v.s, C).slots.data
         IN Ok(SetO(v.s, C, [O(v.s, C) EXCEPT !.slots.data = [(IF d = Empty THEN LegacyRegExpNone ELSE d) EXCEPT !.input = Val(v).value]]),
               Undefined)
    [] m = "escape" -> IF ~IsString(a1) THEN ThrowTypeError(s) ELSE Ok(s, Str(RxEscapeCodePoints(StringToCodePoints(a1.value, 0, <<>>), 1, <<>>)))
    \* RegExp.prototype.exec (§22.2.6.2).
    [] m = "exec" ->
         IF ~IsRegExpObject(s, this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE RegExpBuiltinExec(S.s, this, Val(S))
    \* RegExp.prototype.compile (§B.2.4.1), with the legacy RegExp features proposal's realm and subclass checks.
    [] m = "compile" ->
         IF ~IsRegExpObject(s, this) THEN ThrowTypeError(s)
         ELSE IF O(s, this).slots.realm # s.realmId \/ ~O(s, this).slots.legacy THEN ThrowTypeError(s)
         ELSE IF ~IsRegExpObject(s, a1) THEN RegExpInitialize(s, this, a1, a2)
         ELSE IF a2 # Undefined THEN ThrowTypeError(s)
         ELSE RegExpInitialize(s, this, Str(O(s, a1).slots.source), Str(O(s, a1).slots.flags))
    \* get RegExp.prototype.flags (§22.2.6.4).
    [] m = "flags" -> IF ~IsObject(this) THEN ThrowTypeError(s) ELSE RxFlagsFrom(s, this, 1, <<>>)
    \* get RegExp.prototype.source (§22.2.6.13).
    [] m = "source" ->
         CASE ~IsObject(this) -> ThrowTypeError(s)
           [] IsRegExpObject(s, this) -> Ok(s, Str(EscapeRegExpPattern(O(s, this).slots.source)))
           [] SameValue(this, Intrinsic(s, "RegExpPrototype")) -> Ok(s, SV("(?:)"))
           [] OTHER -> ThrowTypeError(s)
    \* get RegExp.prototype.hasIndices, global, ignoreCase, multiline, dotAll, unicode, unicodeSets,
    \* and sticky (§22.2.6.3 to §22.2.6.18).
    [] m \in {"hasIndices", "global", "ignoreCase", "multiline", "dotAll", "unicode", "unicodeSets", "sticky"} ->
         RegExpHasFlag(s, this, RxFlagOf(m))
    \* RegExp.prototype.test (§22.2.6.16).
    [] m = "test" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE
              LET match == RegExpExec(S.s, this, Val(S)) IN IF IsAbrupt(match) THEN match ELSE Ok(match.s, Bool(Val(match) # Null))
    \* RegExp.prototype.toString (§22.2.6.17).
    [] m = "toString" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET pattern == RxGetString(s, this, SV("source")) IN IF IsAbrupt(pattern) THEN pattern ELSE
              LET flags == RxFlagsString(pattern.s, this) IN IF IsAbrupt(flags) THEN flags
              ELSE Ok(flags.s, Str(<<47>> \o Val(pattern).value \o <<47>> \o Val(flags).value))
    \* RegExp.prototype[@@match] (§22.2.6.8).
    [] m = "match" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE
              LET flags == RxFlagsString(S.s, this) IN IF IsAbrupt(flags) THEN flags
              ELSE IF 103 \notin Range(Val(flags).value) THEN RegExpExec(flags.s, this, Val(S))
              ELSE LET set == Set(flags.s, this, SV("lastIndex"), IntV(0), TRUE) IN IF IsAbrupt(set) THEN set ELSE
                   LET A == ArrayCreate(set.s, 0, Intrinsic(set.s, "ArrayPrototype")) IN
                   RxMatchAll(A.s, this, Val(S), RxFullUnicode(Val(flags)), Val(A), 0)
    \* RegExp.prototype[@@matchAll] (§22.2.6.9).
    [] m = "matchAll" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE
              LET C == SpeciesConstructor(S.s, this, Intrinsic(S.s, "RegExp")) IN IF IsAbrupt(C) THEN C ELSE
              LET flags == RxFlagsString(C.s, this) IN IF IsAbrupt(flags) THEN flags ELSE
              LET matcher == Construct(flags.s, Val(C), <<this, Val(flags)>>, Val(C)) IN IF IsAbrupt(matcher) THEN matcher ELSE
              LET li == Get(matcher.s, this, SV("lastIndex")) IN IF IsAbrupt(li) THEN li ELSE
              LET lastIndex == ToLength(li.s, Val(li)) IN IF IsAbrupt(lastIndex) THEN lastIndex ELSE
              LET set == Set(lastIndex.s, Val(matcher), SV("lastIndex"), Val(lastIndex), TRUE) IN IF IsAbrupt(set) THEN set
              ELSE CreateRegExpStringIterator(set.s, Val(matcher), Val(S), 103 \in Range(Val(flags).value), RxFullUnicode(Val(flags)))
    \* RegExp.prototype[@@replace] (§22.2.6.11).
    [] m = "replace" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE
              LET functional == IsCallable(S.s, a2)
                  replaceValue == IF functional THEN Ok(S.s, a2) ELSE ToStr(S.s, a2)
              IN IF IsAbrupt(replaceValue) THEN replaceValue ELSE
              LET flags == RxFlagsString(replaceValue.s, this) IN IF IsAbrupt(flags) THEN flags ELSE
              LET global == 103 \in Range(Val(flags).value)
                  set == IF global THEN Set(flags.s, this, SV("lastIndex"), IntV(0), TRUE) ELSE Ok(flags.s, Undefined)
              IN IF IsAbrupt(set) THEN set ELSE
              LET results == RxReplaceResults(set.s, this, Val(S), global, RxFullUnicode(Val(flags)), <<>>) IN
              IF IsAbrupt(results) THEN results
              ELSE RxReplaceFrom(results.s, Val(S), Val(replaceValue), functional, Val(results), 1, <<>>, 0)
    \* RegExp.prototype[@@search] (§22.2.6.12).
    [] m = "search" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE
              LET previous == Get(S.s, this, SV("lastIndex")) IN IF IsAbrupt(previous) THEN previous ELSE
              LET reset == IF SameValue(Val(previous), IntV(0)) THEN Ok(previous.s, Undefined)
                           ELSE Set(previous.s, this, SV("lastIndex"), IntV(0), TRUE)
              IN IF IsAbrupt(reset) THEN reset ELSE
              LET result == RegExpExec(reset.s, this, Val(S)) IN IF IsAbrupt(result) THEN result ELSE
              LET current == Get(result.s, this, SV("lastIndex")) IN IF IsAbrupt(current) THEN current ELSE
              LET restore == IF SameValue(Val(current), Val(previous)) THEN Ok(current.s, Undefined)
                             ELSE Set(current.s, this, SV("lastIndex"), Val(previous), TRUE)
              IN IF IsAbrupt(restore) THEN restore
              ELSE IF Val(result) = Null THEN Ok(restore.s, IntV(-1))
              ELSE Get(restore.s, Val(result), SV("index"))
    \* RegExp.prototype[@@split] (§22.2.6.14).
    [] m = "split" ->
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE LET S == ToStr(s, a1) IN IF IsAbrupt(S) THEN S ELSE
              LET C == SpeciesConstructor(S.s, this, Intrinsic(S.s, "RegExp")) IN IF IsAbrupt(C) THEN C ELSE
              LET flags == RxFlagsString(C.s, this) IN IF IsAbrupt(flags) THEN flags ELSE
              LET newFlags == IF 121 \in Range(Val(flags).value) THEN Val(flags) ELSE Str(Append(Val(flags).value, 121))
                  splitter == Construct(flags.s, Val(C), <<this, newFlags>>, Val(C))
              IN IF IsAbrupt(splitter) THEN splitter ELSE
              LET A == ArrayCreate(splitter.s, 0, Intrinsic(splitter.s, "ArrayPrototype")) IN
              LET lim == IF a2 = Undefined THEN Ok(A.s, Num(NumFromBigNat(FALSE, BNSub(BNPow2(32), <<1>>), 0))) ELSE ToUint32(A.s, a2) IN
              IF IsAbrupt(lim) THEN lim
              ELSE IF Val(lim).value = PosZero THEN Ok(lim.s, Val(A))
              ELSE IF Val(S) = EmptyStr THEN
                LET z == RegExpExec(lim.s, Val(splitter), Val(S)) IN IF IsAbrupt(z) THEN z
                ELSE IF Val(z) # Null THEN Ok(z.s, Val(A))
                ELSE LET c == CreateDataProperty(z.s, Val(A), SV("0"), Val(S)) IN IF IsAbrupt(c) THEN c ELSE Ok(c.s, Val(A))
              ELSE RxSplitFrom(lim.s, Val(splitter), Val(S), RxFullUnicode(Val(flags)), Val(A), 0, Val(lim).value, 0, 0)
    [] m = "iteratorNext" -> RegExpStringIteratorNext(s, this)

RegExpIntrinsics ==
  << IntrinsicObject("RegExpPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("RegExp", "FunctionPrototype", <<"RegExp", "constructor">>, 2, N("RegExp"), TRUE),
     IntrinsicObject("RegExpStringIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]) >>

RegExpProperties ==
  Ctor("RegExp", "RegExpPrototype") \o
  << GlobalLink("RegExp", N("RegExp")),
     G("RegExp", SymSpecies, "RegExp", "species", ""),
     M("RegExp", SV("escape"), "RegExp", "escape", 1),
     G("RegExp", SV("input"), "RegExp", "legacyInput", "legacySetInput"),
     G("RegExp", SV("$_"), "RegExp", "legacyInput", "legacySetInput"),
     G("RegExp", SV("lastMatch"), "RegExp", "legacyLastMatch", ""),
     G("RegExp", SV("$&"), "RegExp", "legacyLastMatch", ""),
     G("RegExp", SV("lastParen"), "RegExp", "legacyLastParen", ""),
     G("RegExp", SV("$+"), "RegExp", "legacyLastParen", ""),
     G("RegExp", SV("leftContext"), "RegExp", "legacyLeftContext", ""),
     G("RegExp", SV("$`"), "RegExp", "legacyLeftContext", ""),
     G("RegExp", SV("rightContext"), "RegExp", "legacyRightContext", ""),
     G("RegExp", SV("$'"), "RegExp", "legacyRightContext", ""),
     G("RegExp", SV("$1"), "RegExp", "legacyParen1", ""), G("RegExp", SV("$2"), "RegExp", "legacyParen2", ""),
     G("RegExp", SV("$3"), "RegExp", "legacyParen3", ""), G("RegExp", SV("$4"), "RegExp", "legacyParen4", ""),
     G("RegExp", SV("$5"), "RegExp", "legacyParen5", ""), G("RegExp", SV("$6"), "RegExp", "legacyParen6", ""),
     G("RegExp", SV("$7"), "RegExp", "legacyParen7", ""), G("RegExp", SV("$8"), "RegExp", "legacyParen8", ""),
     G("RegExp", SV("$9"), "RegExp", "legacyParen9", ""),
     M("RegExpPrototype", SV("compile"), "RegExp", "compile", 2),
     M("RegExpPrototype", SV("exec"), "RegExp", "exec", 1),
     G("RegExpPrototype", SV("dotAll"), "RegExp", "dotAll", ""),
     G("RegExpPrototype", SV("flags"), "RegExp", "flags", ""),
     G("RegExpPrototype", SV("global"), "RegExp", "global", ""),
     G("RegExpPrototype", SV("hasIndices"), "RegExp", "hasIndices", ""),
     G("RegExpPrototype", SV("ignoreCase"), "RegExp", "ignoreCase", ""),
     M("RegExpPrototype", SymMatch, "RegExp", "match", 1),
     M("RegExpPrototype", SymMatchAll, "RegExp", "matchAll", 1),
     G("RegExpPrototype", SV("multiline"), "RegExp", "multiline", ""),
     M("RegExpPrototype", SymReplace, "RegExp", "replace", 2),
     M("RegExpPrototype", SymSearch, "RegExp", "search", 1),
     G("RegExpPrototype", SV("source"), "RegExp", "source", ""),
     M("RegExpPrototype", SymSplit, "RegExp", "split", 2),
     G("RegExpPrototype", SV("sticky"), "RegExp", "sticky", ""),
     M("RegExpPrototype", SV("test"), "RegExp", "test", 1),
     M("RegExpPrototype", SV("toString"), "RegExp", "toString", 0),
     G("RegExpPrototype", SV("unicode"), "RegExp", "unicode", ""),
     G("RegExpPrototype", SV("unicodeSets"), "RegExp", "unicodeSets", ""),
     M("RegExpStringIteratorPrototype", SV("next"), "RegExp", "iteratorNext", 0),
     V("RegExpStringIteratorPrototype", SymToStringTag, SV("RegExp String Iterator"), FALSE, FALSE, TRUE) >>

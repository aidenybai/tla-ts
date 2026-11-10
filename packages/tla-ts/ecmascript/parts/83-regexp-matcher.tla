\* Pattern semantics (§22.2.2). CompilePattern turns a parsed pattern into a matcher tree that
\* RxMatch runs with explicit continuations. A RegExp Record rer is
\*   [ic, multiline, dotAll, u, v, groups]
\* with groups the pattern's capturing groups. A MatchState is [e, cap]: the endIndex and the
\* captures, each None or <<start, end>>. A matcher returns a MatchState or MatchFailure.
\*
\* A CharSet is [c, strs]: c a tree of the single characters, and strs the strings of other lengths
\* it holds. The kinds of tree are
\*   cps(set), range(lo, hi), ranges(id)  the characters listed, in a range, or of a property
\*   space, lt                            WhiteSpace or LineTerminator, and LineTerminator
\*   all(vi)                              AllCharacters, only those with scf(c) = c when vi
\*   word(cm)                             WordCharacters
\*   union(sets), inter(sets), diff(left, right), fold(inner)
\* with fold MaybeSimpleCaseFolding. cm is [ic, uni], the parts of rer that Canonicalize reads.

MatchFailure == None

\* Binary search for x in a sorted sequence, which holds it.
RxSearch(seq, x, lo, hi) ==
  LET mid == (lo + hi) \div 2 IN
  CASE seq[mid] = x -> mid
    [] seq[mid] < x -> RxSearch(seq, x, mid + 1, hi)
    [] OTHER -> RxSearch(seq, x, lo, mid - 1)
\* Whether c is in the ranges <<lo1, hi1, lo2, hi2, ...>>, by binary search on pairs lo..hi.
RxInRanges(ranges, c) == RxInRangesFrom(ranges, c, 1, Len(ranges) \div 2)
RxInRangesFrom(ranges, c, lo, hi) ==
  LET mid == (lo + hi) \div 2 IN
  CASE lo > hi -> FALSE
    [] c < ranges[2 * mid - 1] -> RxInRangesFrom(ranges, c, lo, mid - 1)
    [] c > ranges[2 * mid] -> RxInRangesFrom(ranges, c, mid + 1, hi)
    [] OTHER -> TRUE

RxFoldMap == [c \in Range(RegExpFoldKeys) |-> RegExpFoldValues[RxSearch(RegExpFoldKeys, c, 1, Len(RegExpFoldKeys))]]
RxFoldSources == [c \in Range(RegExpFoldTargets) |-> RegExpFoldSources[RxSearch(RegExpFoldTargets, c, 1, Len(RegExpFoldTargets))]]
RxUpperMap == [c \in Range(RegExpUpperKeys) |-> RegExpUpperValues[RxSearch(RegExpUpperKeys, c, 1, Len(RegExpUpperKeys))]]
RxUpperSources == [c \in Range(RegExpUpperTargets) |-> RegExpUpperSources[RxSearch(RegExpUpperTargets, c, 1, Len(RegExpUpperTargets))]]

\* scf, the simple or common case folding.
RxScf(c) == IF c \in DOMAIN RxFoldMap THEN RxFoldMap[c] ELSE c
\* Canonicalize (§22.2.2.7.3).
RxCanonicalize(cm, c) ==
  CASE ~cm.ic -> c
    [] cm.uni -> RxScf(c)
    [] OTHER -> IF c \in DOMAIN RxUpperMap THEN RxUpperMap[c] ELSE c
\* The characters that Canonicalize maps to t.
RxPreimage(cm, t) ==
  LET sources == IF cm.uni THEN RxFoldSources ELSE RxUpperSources IN
  (IF t \in DOMAIN sources THEN sources[t] ELSE {}) \cup (IF RxCanonicalize(cm, t) = t THEN {t} ELSE {})
RxScfPreimage(t) == RxPreimage([ic |-> TRUE, uni |-> TRUE], t)

RxIsBasicWord(c) == RxIsDigit(c) \/ RxIsAsciiLetter(c) \/ c = 95

\* Whether the tree t holds the character c.
RxIn(t, c) ==
  CASE t.k = "cps" -> c \in t.set
    [] t.k = "range" -> t.lo <= c /\ c <= t.hi
    [] t.k = "ranges" -> RxInRanges(RegExpPropertyRanges[t.id], c)
    [] t.k = "space" -> RxIsWhiteSpace(c) \/ RxIsLineTerminator(c)
    [] t.k = "lt" -> RxIsLineTerminator(c)
    [] t.k = "all" -> ~t.vi \/ RxScf(c) = c
    [] t.k = "word" -> RxIsBasicWord(c) \/ RxIsBasicWord(RxCanonicalize(t.cm, c))
    [] t.k = "union" -> \E i \in DOMAIN t.sets : RxIn(t.sets[i], c)
    [] t.k = "inter" -> \A i \in DOMAIN t.sets : RxIn(t.sets[i], c)
    [] t.k = "diff" -> RxIn(t.left, c) /\ ~RxIn(t.right, c)
    [] t.k = "fold" -> \E b \in RxScfPreimage(c) : RxIn(t.inner, b)

RxChars(t) == [c |-> t, strs |-> {}]
RxNoChars == [k |-> "cps", set |-> {}]
\* The union of properties of strings, each [chars, strs].
RegExpStringUnion(sets) ==
  [chars |-> UNION {sets[i].chars : i \in DOMAIN sets}, strs |-> UNION {sets[i].strs : i \in DOMAIN sets}]
RxUnion(sets) ==
  [c |-> [k |-> "union", sets |-> [i \in DOMAIN sets |-> sets[i].c]], strs |-> UNION {sets[i].strs : i \in DOMAIN sets}]
RxCm(rer) == [ic |-> rer.ic, uni |-> rer.u \/ rer.v]
\* AllCharacters (§22.2.2.9.3).
RxAllCharacters(rer) == [k |-> "all", vi |-> rer.v /\ rer.ic]
\* CharacterComplement (§22.2.2.9.4).
RxComplement(rer, cs) == RxChars([k |-> "diff", left |-> RxAllCharacters(rer), right |-> cs.c])
\* MaybeSimpleCaseFolding (§22.2.2.9.2).
RxMaybeFold(rer, cs) ==
  IF ~rer.v \/ ~rer.ic THEN cs
  ELSE [c |-> [k |-> "fold", inner |-> cs.c], strs |-> {[i \in DOMAIN str |-> RxScf(str[i])] : str \in cs.strs}]
\* WordCharacters (§22.2.2.9.5).
RxWordCharacters(rer) == RxChars([k |-> "word", cm |-> RxCm(rer)])

\* CompileToCharSet of a CharacterClassEscape (§22.2.2.9).
RxEscapeSet(e, rer) ==
  LET digits == RxChars([k |-> "range", lo |-> 48, hi |-> 57])
      space == RxChars([k |-> "space"])
  IN CASE e.c = 100 -> digits
       [] e.c = 68 -> RxComplement(rer, digits)
       [] e.c = 115 -> space
       [] e.c = 83 -> RxComplement(rer, space)
       [] e.c = 119 -> RxMaybeFold(rer, RxWordCharacters(rer))
       [] e.c = 87 -> RxComplement(rer, RxWordCharacters(rer))
       [] e.c = 112 -> RxPropertySet(e.property, rer)
       [] OTHER -> RxComplement(rer, RxPropertySet(e.property, rer))
RxPropertySet(property, rer) ==
  CASE property.k = "gc" -> RxChars([k |-> "ranges", id |-> property.id])
    [] property.k = "ranges" -> RxMaybeFold(rer, RxChars([k |-> "ranges", id |-> property.id]))
    [] OTHER -> RxMaybeFold(rer, [c |-> [k |-> "cps", set |-> property.set.chars], strs |-> property.set.strs])

\* CompileToCharSet of ClassContents, and of the ranges and operands in it.
RxContentsSet(contents, rer) ==
  LET sets == IF contents.k = "empty" THEN <<>> ELSE [i \in DOMAIN contents.items |-> RxItemSet(contents.items[i], rer)] IN
  CASE contents.k = "empty" -> RxChars(RxNoChars)
    [] contents.k = "intersection" ->
         [c |-> [k |-> "inter", sets |-> [i \in DOMAIN sets |-> sets[i].c]],
          strs |-> {str \in sets[1].strs : \A i \in DOMAIN sets : str \in sets[i].strs}]
    [] contents.k = "subtraction" -> RxSubtract(sets[1], sets, 2)
    [] OTHER -> RxUnion(sets)
RxSubtract(cs, sets, i) ==
  IF i > Len(sets) THEN cs
  ELSE RxSubtract([c |-> [k |-> "diff", left |-> cs.c, right |-> sets[i].c], strs |-> cs.strs \ sets[i].strs], sets, i + 1)
RxItemSet(item, rer) ==
  CASE item.t = "char" -> RxMaybeFold(rer, RxChars([k |-> "cps", set |-> {item.cp}]))
    [] item.t = "range" -> RxMaybeFold(rer, RxChars([k |-> "range", lo |-> item.lo, hi |-> item.hi]))
    [] item.t = "escape" -> RxEscapeSet(item, rer)
    [] item.t = "nested" ->
         IF item.invert THEN RxComplement(rer, RxContentsSet(item.c, rer)) ELSE RxContentsSet(item.c, rer)
    [] OTHER ->
         RxMaybeFold(rer, [c |-> [k |-> "cps", set |-> {item.strs[i][1] : i \in {j \in DOMAIN item.strs : Len(item.strs[j]) = 1}}],
                           strs |-> {item.strs[i] : i \in {j \in DOMAIN item.strs : Len(item.strs[j]) # 1}}])

\* CompilePattern (§22.2.2.2) of a parsed pattern, and CompileSubpattern of its parts. dir is TRUE
\* for forward.
RxCompilePattern(pattern, rer) == RxCompileDisjunction(pattern.d, rer, TRUE)
RxCompileDisjunction(d, rer, dir) ==
  IF Len(d) = 1 THEN RxCompileAlternative(d[1], rer, dir)
  ELSE [t |-> "alt", ms |-> [i \in DOMAIN d |-> RxCompileAlternative(d[i], rer, dir)]]
RxCompileAlternative(terms, rer, dir) ==
  LET ms == [i \in DOMAIN terms |-> RxCompileTerm(terms[i], rer, dir)] IN
  [t |-> "seq", ms |-> IF dir THEN ms ELSE [i \in DOMAIN ms |-> ms[Len(ms) - i + 1]]]
RxCompileTerm(term, rer, dir) ==
  CASE term.t = "^" -> [t |-> "bol", multiline |-> rer.multiline]
    [] term.t = "$" -> [t |-> "eol", multiline |-> rer.multiline]
    [] term.t = "b" -> [t |-> "wb", negated |-> FALSE, cm |-> RxCm(rer)]
    [] term.t = "B" -> [t |-> "wb", negated |-> TRUE, cm |-> RxCm(rer)]
    [] term.t = "look" -> [t |-> "look", positive |-> term.positive, m |-> RxCompileDisjunction(term.d, rer, term.ahead)]
    [] term.q = None -> RxCompileAtom(term.atom, rer, dir)
    [] OTHER ->
         [t |-> "rep", m |-> RxCompileAtom(term.atom, rer, dir), min |-> term.q.min, max |-> term.q.max,
          greedy |-> term.q.greedy, parenIndex |-> term.parenIndex, parenCount |-> term.parenCount]

\* CompileAtom (§22.2.2.7).
RxCompileAtom(atom, rer, dir) ==
  CASE atom.t = "char" -> RxSetMatcher(rer, [k |-> "cps", set |-> {atom.cp}], FALSE, dir)
    [] atom.t = "dot" ->
         RxSetMatcher(rer, IF rer.dotAll THEN RxAllCharacters(rer)
                           ELSE [k |-> "diff", left |-> RxAllCharacters(rer), right |-> [k |-> "lt"]], FALSE, dir)
    [] atom.t = "class" ->
         LET cs == RxContentsSet(atom.c, rer) IN
         IF ~rer.v THEN RxSetMatcher(rer, cs.c, atom.invert, dir)
         ELSE RxCharSetMatcher(rer, IF atom.invert THEN RxComplement(rer, cs) ELSE cs, dir)
    [] atom.t = "escape" -> RxCharSetMatcher(rer, RxEscapeSet(atom, rer), dir)
    [] atom.t = "group" -> [t |-> "group", index |-> atom.index + 1, dir |-> dir, m |-> RxCompileDisjunction(atom.d, rer, dir)]
    [] atom.t = "modifiers" -> RxCompileDisjunction(atom.d, RxUpdateModifiers(rer, atom.add, atom.remove), dir)
    [] atom.t = "backreference" -> [t |-> "back", ns |-> {atom.n}, cm |-> RxCm(rer), dir |-> dir]
    [] atom.t = "look" -> RxCompileTerm(atom, rer, dir)
    [] OTHER ->
         [t |-> "back", ns |-> {i \in DOMAIN rer.groups : rer.groups[i].name = atom.name}, cm |-> RxCm(rer), dir |-> dir]

\* UpdateModifiers (§22.2.2.7.4).
RxUpdateModifiers(rer, add, remove) ==
  [rer EXCEPT !.ic = RxModifier(105, add, remove, @), !.multiline = RxModifier(109, add, remove, @),
              !.dotAll = RxModifier(115, add, remove, @)]
RxModifier(flag, add, remove, value) == IF flag \in add THEN TRUE ELSE IF flag \in remove THEN FALSE ELSE value

\* CharacterSetMatcher (§22.2.2.7.1).
RxSetMatcher(rer, cs, invert, dir) == [t |-> "set", cs |-> cs, invert |-> invert, cm |-> RxCm(rer), dir |-> dir]
\* The matcher of a CharSet that may hold strings: its strings by descending length, then its
\* single characters, then the empty string.
RxCharSetMatcher(rer, cs, dir) ==
  IF cs.strs = {} THEN RxSetMatcher(rer, cs.c, FALSE, dir)
  ELSE [t |-> "strings", singles |-> cs.c, hasEmpty |-> <<>> \in cs.strs, cm |-> RxCm(rer), dir |-> dir,
        byLength |-> RxByLength({Len(str) : str \in cs.strs} \ {0}, cs.strs, RxCm(rer))]
\* The strings of each length, canonicalized, longest first.
RxByLength(lengths, strs, cm) ==
  IF lengths = {} THEN <<>>
  ELSE LET longest == CHOOSE l \in lengths : \A o \in lengths : o <= l IN
       <<<<longest, {RxCanonicalizeString(cm, str) : str \in {s \in strs : Len(s) = longest}}>>>> \o
       RxByLength(lengths \ {longest}, strs, cm)
RxCanonicalizeString(cm, str) == IF cm.ic THEN [i \in DOMAIN str |-> RxCanonicalize(cm, str[i])] ELSE str

\* Runs matcher m on the input env [in, len] from state x with continuation k. A continuation is
\*   done                                the end of a pattern or lookaround
\*   seq(ms, i)                          the rest of a sequence, from its ith matcher
\*   group(index, start, dir)            the end of a capturing group
\*   rep(m, min, max, greedy, start, parenIndex, parenCount)   RepeatMatcher's continuation d
\* each with the continuation next after it.
RxMatch(env, m, x, k) ==
  CASE m.t = "set" ->
         LET index == IF m.dir THEN x.e ELSE x.e - 1 IN
         IF index < 0 \/ index >= env.len THEN MatchFailure
         ELSE IF RxSetFound(m.cs, m.cm, env.in[index + 1]) = m.invert THEN MatchFailure
         ELSE RxContinue(env, k, [x EXCEPT !.e = IF m.dir THEN @ + 1 ELSE @ - 1])
    [] m.t = "seq" -> RxSequence(env, m.ms, 1, x, k)
    [] m.t = "alt" -> RxMatchAlternatives(env, m.ms, 1, x, k)
    [] m.t = "group" -> RxMatch(env, m.m, x, [t |-> "group", index |-> m.index, start |-> x.e, dir |-> m.dir, next |-> k])
    [] m.t = "rep" -> RxRepeatMatcher(env, m.m, m.min, m.max, m.greedy, x, k, m.parenIndex, m.parenCount)
    [] m.t = "bol" ->
         IF x.e = 0 \/ (m.multiline /\ RxIsLineTerminator(env.in[x.e])) THEN RxContinue(env, k, x) ELSE MatchFailure
    [] m.t = "eol" ->
         IF x.e = env.len \/ (m.multiline /\ RxIsLineTerminator(env.in[x.e + 1])) THEN RxContinue(env, k, x) ELSE MatchFailure
    [] m.t = "wb" ->
         IF (RxIsWordChar(env, m.cm, x.e - 1) # RxIsWordChar(env, m.cm, x.e)) # m.negated
         THEN RxContinue(env, k, x) ELSE MatchFailure
    [] m.t = "look" ->
         LET r == RxMatch(env, m.m, x, [t |-> "done"]) IN
         IF m.positive THEN IF r = MatchFailure THEN MatchFailure ELSE RxContinue(env, k, [x EXCEPT !.cap = r.cap])
         ELSE IF r # MatchFailure THEN MatchFailure ELSE RxContinue(env, k, x)
    [] m.t = "back" -> RxBackreference(env, m, x, k)
    [] m.t = "strings" -> RxMatchStrings(env, m, 1, x, k)

RxContinue(env, k, y) ==
  CASE k.t = "done" -> y
    [] k.t = "seq" -> RxSequence(env, k.ms, k.i, y, k.next)
    [] k.t = "group" ->
         RxContinue(env, k.next, [y EXCEPT !.cap[k.index] = IF k.dir THEN <<k.start, y.e>> ELSE <<y.e, k.start>>])
    [] k.t = "rep" ->
         IF k.min = 0 /\ y.e = k.start THEN MatchFailure
         ELSE RxRepeatMatcher(env, k.m, IF k.min = 0 THEN 0 ELSE k.min - 1,
                              IF k.max = RxInfinity THEN RxInfinity ELSE k.max - 1, k.greedy, y, k.next,
                              k.parenIndex, k.parenCount)

\* MatchSequence (§22.2.2.3) of a list of matchers, already in the order they run.
RxSequence(env, ms, i, x, k) ==
  IF i > Len(ms) THEN RxContinue(env, k, x)
  ELSE RxMatch(env, ms[i], x, IF i = Len(ms) THEN k ELSE [t |-> "seq", ms |-> ms, i |-> i + 1, next |-> k])
\* MatchTwoAlternatives (§22.2.2.3) of a list of matchers.
RxMatchAlternatives(env, ms, i, x, k) ==
  IF i > Len(ms) THEN MatchFailure
  ELSE LET r == RxMatch(env, ms[i], x, k) IN IF r # MatchFailure THEN r ELSE RxMatchAlternatives(env, ms, i + 1, x, k)

\* RepeatMatcher (§22.2.2.3.1).
RxRepeatMatcher(env, m, min, max, greedy, x, k, parenIndex, parenCount) ==
  LET d == [t |-> "rep", m |-> m, min |-> min, max |-> max, greedy |-> greedy, start |-> x.e,
            parenIndex |-> parenIndex, parenCount |-> parenCount, next |-> k]
      xr == IF parenCount = 0 THEN x
            ELSE [x EXCEPT !.cap = [i \in DOMAIN @ |-> IF i > parenIndex /\ i <= parenIndex + parenCount THEN None ELSE @[i]]]
  IN CASE max = 0 -> RxContinue(env, k, x)
       [] min # 0 -> RxMatch(env, m, xr, d)
       [] ~greedy -> LET z == RxContinue(env, k, x) IN IF z # MatchFailure THEN z ELSE RxMatch(env, m, xr, d)
       [] OTHER -> LET z == RxMatch(env, m, xr, d) IN IF z # MatchFailure THEN z ELSE RxContinue(env, k, x)

\* Whether CharacterSetMatcher finds a member of A that canonicalizes to the character c does.
RxSetFound(cs, cm, c) == IF ~cm.ic THEN RxIn(cs, c) ELSE \E a \in RxPreimage(cm, RxCanonicalize(cm, c)) : RxIn(cs, a)

\* IsWordChar (§22.2.2.9.2).
RxIsWordChar(env, cm, e) ==
  /\ e # -1 /\ e # env.len
  /\ RxIsBasicWord(env.in[e + 1]) \/ RxIsBasicWord(RxCanonicalize(cm, env.in[e + 1]))

\* BackreferenceMatcher (§22.2.2.7.2), with ns the group numbers the backreference names.
RxBackreference(env, m, x, k) ==
  LET found == {n \in m.ns : x.cap[n] # None} IN
  IF found = {} THEN RxContinue(env, k, x)
  ELSE LET capture == x.cap[CHOOSE n \in found : TRUE]
           len == capture[2] - capture[1]
           f == IF m.dir THEN x.e + len ELSE x.e - len
           g == IF m.dir THEN x.e ELSE f
       IN IF f < 0 \/ f > env.len THEN MatchFailure
          ELSE IF \E i \in 1..len : RxCanonicalize(m.cm, env.in[capture[1] + i]) # RxCanonicalize(m.cm, env.in[g + i])
          THEN MatchFailure
          ELSE RxContinue(env, k, [x EXCEPT !.e = f])

\* The matcher of a CharSet with strings (§22.2.2.7, Atom :: CharacterClass), from its ith length.
RxMatchStrings(env, m, i, x, k) ==
  IF i <= Len(m.byLength) THEN
    LET length == m.byLength[i][1]
      start == IF m.dir THEN x.e ELSE x.e - length
      r == IF start >= 0 /\ start + length <= env.len
                /\ RxCanonicalizeString(m.cm, SubSeq(env.in, start + 1, start + length)) \in m.byLength[i][2]
           THEN RxContinue(env, k, [x EXCEPT !.e = IF m.dir THEN @ + length ELSE @ - length])
           ELSE MatchFailure
    IN IF r # MatchFailure THEN r ELSE RxMatchStrings(env, m, i + 1, x, k)
  ELSE LET singles == RxMatch(env, [t |-> "set", cs |-> m.singles, invert |-> FALSE, cm |-> m.cm, dir |-> m.dir], x, k) IN
       IF singles # MatchFailure \/ ~m.hasEmpty THEN singles ELSE RxContinue(env, k, x)

\* Runs a compiled pattern on input, a list of characters, from index: a MatchState or MatchFailure.
RxRun(matcher, input, index, groupCount) ==
  RxMatch([in |-> input, len |-> Len(input)], matcher, [e |-> index, cap |-> [i \in 1..groupCount |-> None]], [t |-> "done"])

\* Patterns (§22.2.1): a port of engine262's RegExpParser, which parses the pattern's code units and
\* reads a surrogate pair as one code point in Unicode mode. The parser state p is
\*   src     the pattern's code units
\*   pos     the index in src of the next code unit
\*   u, v    whether it parses in UnicodeMode and in UnicodeSetsMode
\*   named   whether it parses with NamedCaptureGroups
\*   captures the number of capturing groups, outside UnicodeMode, when a DecimalEscape is one only
\*           up to it (§B.1.2)
\*   groups  the capturing groups by left parenthesis, each [name, path] with the GroupName as code
\*           units or None, and the path of Disjunction alternatives the group is in
\*   path    the alternatives the parser is in, as <<start of the Disjunction, alternative>> pairs
\*   decs    the numbers of the DecimalEscapes, and refs the GroupNames of \k escapes
\*   err     whether the parser found a Syntax Error
\* Each parse operator returns [p, n]: the state after it and the node it parsed. A parsed character
\* is its CharacterValue (§22.2.1.8). Outside UnicodeMode, it parses the grammar of §B.1.2.

RxIsDigit(c) == c >= 48 /\ c <= 57
RxIsHexDigit(c) == RxIsDigit(c) \/ (c >= 65 /\ c <= 70) \/ (c >= 97 /\ c <= 102)
RxHexValue(c) == IF RxIsDigit(c) THEN c - 48 ELSE IF c >= 97 THEN c - 87 ELSE c - 55
RxIsAsciiLetter(c) == (c >= 65 /\ c <= 90) \/ (c >= 97 /\ c <= 122)
RxIsLead(c) == c >= 55296 /\ c <= 56319
RxIsTrail(c) == c >= 56320 /\ c <= 57343
UTF16SurrogatePairToCodePoint(lead, trail) == (lead - 55296) * 1024 + (trail - 56320) + 65536

RxSyntaxCharacters == Range(N("^$\\.*+?()[]{}|"))
RxClassSetSyntaxCharacters == Range(N("()[]{}/-\\|"))
RxClassSetReservedDoublePunctuators == Range(N("&!#$%*+,.:;<=>?@^`~"))
RxClassSetReservedPunctuators == Range(N("&-!#%,:;<=>@`~"))
RxCharacterEscapeStarts == Range(N("fnrtvc0xu/^$\\.*+?()[]{}|"))

RxIsLineTerminator(c) == c \in {10, 13, 8232, 8233}
RxIsWhiteSpace(c) ==
  c \in {9, 11, 12, 32, 160, 65279} \/ RxInRanges(RegExpPropertyRanges[RegExpSpaceSeparatorId], c)
RxIsIDContinue(c) == RxInRanges(RegExpPropertyRanges[RegExpIDContinueId], c)
\* IdentifierStartChar and IdentifierPartChar (§12.7) of a code point.
RxIsIdentifierChar(cp, isStart) ==
  \/ cp = 36 \/ cp = 95
  \/ IF isStart THEN RxInRanges(RegExpPropertyRanges[RegExpIDStartId], cp)
     ELSE cp = 8204 \/ cp = 8205 \/ RxIsIDContinue(cp)

RxUnit(p, k) == IF p.pos + k < Len(p.src) THEN p.src[p.pos + k + 1] ELSE -1
RxAtEnd(p) == p.pos >= Len(p.src)
RxIsAt(p, text) == p.pos + Len(text) <= Len(p.src) /\ SubSeq(p.src, p.pos + 1, p.pos + Len(text)) = text
RxSkip(p, k) == [p EXCEPT !.pos = @ + k]
RxNode(p, n) == [p |-> p, n |-> n]
RxError(p) == [p |-> [p EXCEPT !.err = TRUE], n |-> None]
RxClose(p, text, n) == IF RxIsAt(p, text) THEN RxNode(RxSkip(p, Len(text)), n) ELSE RxError(p)

\* ParsePattern (§22.2.3.4, §B.1.2.9): [ok, pattern], the pattern's Disjunction d and its capturing
\* groups. Outside UnicodeMode, a pattern with a GroupName parses again with NamedCaptureGroups, and
\* one with a DecimalEscape past its capturing groups again with their number.
ParsePattern(units, u, v) ==
  LET first == RxParse(units, u, v, u \/ v, IntLimit)
      groups == first.p.groups
      named == u \/ v \/ \E i \in DOMAIN groups : groups[i].name # None
      d == IF u \/ v \/ first.p.err \/ (~named /\ \A i \in DOMAIN first.p.decs : first.p.decs[i] <= Len(groups))
           THEN first ELSE RxParse(units, FALSE, FALSE, named, Len(groups))
      p == d.p
      names == {p.groups[i].name : i \in DOMAIN p.groups}
  IN IF (u /\ v) \/ p.err \/ ~RxAtEnd(p) THEN [ok |-> FALSE]
     \* The early errors of §22.2.1.1 that need the whole Pattern.
     ELSE IF \E i \in DOMAIN p.decs : p.decs[i] > Len(p.groups) THEN [ok |-> FALSE]
     ELSE IF \E i \in DOMAIN p.refs : p.refs[i] \notin names THEN [ok |-> FALSE]
     ELSE IF \E i, j \in DOMAIN p.groups :
               /\ i < j /\ p.groups[i].name # None /\ p.groups[i].name = p.groups[j].name
               /\ RxMightBothParticipate(p.groups[i].path, p.groups[j].path)
     THEN [ok |-> FALSE]
     ELSE [ok |-> TRUE, pattern |-> [d |-> d.n, groups |-> p.groups]]
RxParse(units, u, v, named, captures) ==
  RxDisjunction([src |-> units, pos |-> 0, u |-> u \/ v, v |-> v, named |-> named, captures |-> captures,
                 groups |-> <<>>, path |-> <<>>, decs |-> <<>>, refs |-> <<>>, err |-> FALSE])

\* MightBothParticipate (§22.2.1.3): two groups can't both participate in a match only when they are
\* in different alternatives of one Disjunction.
RxMightBothParticipate(x, y) ==
  ~\E i \in 1..Len(x) : i <= Len(y) /\ x[i][1] = y[i][1] /\ x[i][2] # y[i][2]

\* Disjunction :: Alternative | Disjunction, as the list of its alternatives.
RxDisjunction(p) == RxAlternatives(p, p.pos, p.path, 1, <<>>)
RxAlternatives(p, start, outer, i, alts) ==
  LET a == RxAlternative([p EXCEPT !.path = Append(outer, <<start, i>>)], <<>>) IN
  IF a.p.err THEN a
  ELSE IF RxIsAt(a.p, N("|")) THEN RxAlternatives(RxSkip(a.p, 1), start, outer, i + 1, Append(alts, a.n))
  ELSE RxNode([a.p EXCEPT !.path = outer], Append(alts, a.n))

\* Alternative :: Term*, as the list of its terms.
RxAlternative(p, terms) ==
  IF RxAtEnd(p) \/ RxUnit(p, 0) \in Range(IF p.u THEN N(")]}|") ELSE N(")|")) THEN RxNode(p, terms)
  ELSE LET t == RxTerm(p) IN IF t.p.err THEN t ELSE RxAlternative(t.p, Append(terms, t.n))

\* Term :: Assertion | Atom Quantifier?, and outside UnicodeMode QuantifiableAssertion Quantifier?,
\* with the capturing groups before and within the Atom.
RxTerm(p) ==
  CASE RxIsAt(p, N("^")) -> RxNode(RxSkip(p, 1), [t |-> "^"])
    [] RxIsAt(p, N("$")) -> RxNode(RxSkip(p, 1), [t |-> "$"])
    [] RxIsAt(p, N("\\b")) -> RxNode(RxSkip(p, 2), [t |-> "b"])
    [] RxIsAt(p, N("\\B")) -> RxNode(RxSkip(p, 2), [t |-> "B"])
    [] RxIsAt(p, N("(?=")) /\ p.u -> RxLookaround(RxSkip(p, 3), TRUE, TRUE)
    [] RxIsAt(p, N("(?!")) /\ p.u -> RxLookaround(RxSkip(p, 3), TRUE, FALSE)
    [] RxIsAt(p, N("(?=")) -> RxQuantified(p, RxLookaround(RxSkip(p, 3), TRUE, TRUE))
    [] RxIsAt(p, N("(?!")) -> RxQuantified(p, RxLookaround(RxSkip(p, 3), TRUE, FALSE))
    [] RxIsAt(p, N("(?<=")) -> RxLookaround(RxSkip(p, 4), FALSE, TRUE)
    [] RxIsAt(p, N("(?<!")) -> RxLookaround(RxSkip(p, 4), FALSE, FALSE)
    [] OTHER -> RxQuantified(p, RxAtom(p))
\* The term of atom a, which starts at p, with the Quantifier after it.
RxQuantified(p, a) ==
  IF a.p.err THEN a ELSE
  LET q == RxQuantifier(a.p) IN IF q.p.err THEN q
  ELSE RxNode(q.p, [t |-> "atom", atom |-> a.n, q |-> q.n, parenIndex |-> Len(p.groups),
                    parenCount |-> Len(q.p.groups) - Len(p.groups)])

RxLookaround(p, ahead, positive) ==
  LET d == RxDisjunction(p) IN
  IF d.p.err THEN d ELSE RxClose(d.p, N(")"), [t |-> "look", ahead |-> ahead, positive |-> positive, d |-> d.n])

\* Quantifier :: QuantifierPrefix ?opt, as [min, max, greedy], or None. An unbounded max, or a bound
\* that no match can reach, is RxInfinity.
RxInfinity == IntLimit
RxQuantifier(p) ==
  LET prefix ==
        CASE RxIsAt(p, N("*")) -> RxNode(RxSkip(p, 1), <<0, RxInfinity>>)
          [] RxIsAt(p, N("+")) -> RxNode(RxSkip(p, 1), <<1, RxInfinity>>)
          [] RxIsAt(p, N("?")) -> RxNode(RxSkip(p, 1), <<0, 1>>)
          [] RxIsAt(p, N("{")) /\ (p.u \/ RxIsBracedQuantifier(p)) -> RxBraceQuantifier(RxSkip(p, 1))
          [] OTHER -> RxNode(p, None)
      lazy == RxIsAt(prefix.p, N("?"))
  IN IF prefix.p.err \/ prefix.n = None THEN prefix
     ELSE RxNode(RxSkip(prefix.p, IF lazy THEN 1 ELSE 0),
                 [min |-> prefix.n[1], max |-> prefix.n[2], greedy |-> ~lazy])

RxBraceQuantifier(p) ==
  LET a == RxDecimalDigits(p) IN
  IF a.p.err THEN a
  ELSE IF ~RxIsAt(a.p, N(",")) THEN RxClose(a.p, N("}"), <<RxDigitsValue(a.n), RxDigitsValue(a.n)>>)
  ELSE IF RxIsAt(RxSkip(a.p, 1), N("}")) THEN RxNode(RxSkip(a.p, 2), <<RxDigitsValue(a.n), RxInfinity>>)
  ELSE LET b == RxDecimalDigits(RxSkip(a.p, 1)) IN
       IF b.p.err THEN b
       ELSE IF RxDigitsLess(b.n, a.n) THEN RxError(b.p)
       ELSE RxClose(b.p, N("}"), <<RxDigitsValue(a.n), RxDigitsValue(b.n)>>)

\* Whether a QuantifierPrefix's braces, or an InvalidBracedQuantifier, are at "{".
RxIsBracedQuantifier(p) ==
  LET a == RxDigitsFrom(RxSkip(p, 1), <<>>)
      b == RxDigitsFrom(RxSkip(a.p, 1), <<>>)
  IN a.n # <<>> /\ (RxIsAt(a.p, N("}")) \/ (RxIsAt(a.p, N(",")) /\ RxIsAt(b.p, N("}"))))

RxDecimalDigits(p) == IF RxIsDigit(RxUnit(p, 0)) THEN RxDigitsFrom(p, <<>>) ELSE RxError(p)
RxDigitsFrom(p, digits) ==
  IF RxIsDigit(RxUnit(p, 0)) THEN RxDigitsFrom(RxSkip(p, 1), Append(digits, RxUnit(p, 0)))
  ELSE RxNode(p, digits)
\* The MV of decimal digits, or RxInfinity when it's at least that.
RxDigitsValue(digits) == RxDigitsValueFrom(digits, 1, 0)
RxDigitsValueFrom(digits, i, v) ==
  IF i > Len(digits) THEN v
  ELSE RxDigitsValueFrom(digits, i + 1,
         IF v > (RxInfinity - (digits[i] - 48)) \div 10 THEN RxInfinity ELSE v * 10 + digits[i] - 48)
RxDigitsLess(a, b) ==
  LET x == RxNoLeadingZeros(a)
      y == RxNoLeadingZeros(b)
  IN Len(x) < Len(y) \/ (Len(x) = Len(y) /\ LexLess(x, y))
RxNoLeadingZeros(digits) ==
  IF digits # <<>> /\ Head(digits) = 48 THEN RxNoLeadingZeros(Tail(digits)) ELSE digits

\* Atom (§22.2.1), and outside UnicodeMode ExtendedAtom, whose ExtendedPatternCharacter may be "]",
\* "{", or "}", but not an InvalidBracedQuantifier.
RxAtom(p) ==
  CASE RxIsAt(p, N(".")) -> RxNode(RxSkip(p, 1), [t |-> "dot"])
    [] RxIsAt(p, N("\\")) -> RxAtomEscape(RxSkip(p, 1))
    [] RxIsAt(p, N("(")) -> RxGroup(RxSkip(p, 1))
    [] RxIsAt(p, N("[")) -> RxCharacterClass(p)
    [] ~p.u /\ RxUnit(p, 0) \in Range(N("]{}")) /\ ~(RxIsAt(p, N("{")) /\ RxIsBracedQuantifier(p)) ->
         RxNode(RxSkip(p, 1), [t |-> "char", cp |-> RxUnit(p, 0)])
    [] RxUnit(p, 0) \in RxSyntaxCharacters -> RxError(p)
    [] OTHER -> LET c == RxSourceCharacter(p) IN IF c.p.err THEN c ELSE RxNode(c.p, [t |-> "char", cp |-> c.n])

RxSourceCharacter(p) ==
  CASE RxAtEnd(p) -> RxError(p)
    [] p.u /\ RxIsLead(RxUnit(p, 0)) /\ RxIsTrail(RxUnit(p, 1)) ->
         RxNode(RxSkip(p, 2), UTF16SurrogatePairToCodePoint(RxUnit(p, 0), RxUnit(p, 1)))
    [] OTHER -> RxNode(RxSkip(p, 1), RxUnit(p, 0))

\* ( GroupSpecifier? Disjunction ) and the modifier groups (? Modifiers : Disjunction ), after "(".
RxGroup(p) ==
  IF RxIsAt(p, N("?<")) THEN
    LET name == RxGroupName(RxSkip(p, 1)) IN IF name.p.err THEN name ELSE RxCapturingGroup(name.p, name.n)
  ELSE IF RxIsAt(p, N("?")) THEN
    LET m == RxModifiers(RxSkip(p, 1), <<>>, <<>>, FALSE) IN IF m.p.err THEN m ELSE
    LET d == RxDisjunction(m.p) IN
    IF d.p.err THEN d ELSE RxClose(d.p, N(")"), [t |-> "modifiers", add |-> m.n[1], remove |-> m.n[2], d |-> d.n])
  ELSE RxCapturingGroup(p, None)
RxCapturingGroup(p, name) ==
  LET d == RxDisjunction([p EXCEPT !.groups = Append(@, [name |-> name, path |-> p.path])]) IN
  IF d.p.err THEN d ELSE RxClose(d.p, N(")"), [t |-> "group", index |-> Len(p.groups), d |-> d.n])

\* RegularExpressionModifiers - RegularExpressionModifiers before ":", as the sets of code units
\* to add and to remove.
RxModifiers(p, add, remove, isRemoving) ==
  CASE RxIsAt(p, N(":")) ->
         IF (isRemoving /\ add = <<>> /\ remove = <<>>) \/ Cardinality(Range(add \o remove)) # Len(add \o remove)
         THEN RxError(p) ELSE RxNode(RxSkip(p, 1), <<Range(add), Range(remove)>>)
    [] RxUnit(p, 0) \in Range(N("ims")) /\ isRemoving ->
         RxModifiers(RxSkip(p, 1), add, Append(remove, RxUnit(p, 0)), TRUE)
    [] RxUnit(p, 0) \in Range(N("ims")) -> RxModifiers(RxSkip(p, 1), Append(add, RxUnit(p, 0)), remove, FALSE)
    [] RxIsAt(p, N("-")) /\ ~isRemoving -> RxModifiers(RxSkip(p, 1), add, remove, TRUE)
    [] OTHER -> RxError(p)

\* AtomEscape, after "\". Outside UnicodeMode, a DecimalEscape past the capturing groups is a
\* CharacterEscape.
RxAtomEscape(p) ==
  LET class == RxCharacterClassEscape(p)
      digits == RxDigitsFrom(p, <<>>)
  IN
  CASE RxIsAt(p, N("k")) /\ p.named ->
         LET name == RxGroupName(RxSkip(p, 1)) IN
         IF name.p.err THEN name
         ELSE RxNode([name.p EXCEPT !.refs = Append(@, name.n)], [t |-> "named", name |-> name.n])
    [] class.p.err \/ class.n # None -> class
    [] RxIsDigit(RxUnit(p, 0)) /\ ~RxIsAt(p, N("0")) /\ RxDigitsValue(digits.n) <= p.captures ->
         LET n == RxDigitsValue(digits.n)
         IN RxNode([digits.p EXCEPT !.decs = Append(@, n)], [t |-> "backreference", n |-> n])
    [] OTHER -> LET e == RxCharacterEscape(p) IN IF e.p.err THEN e ELSE RxNode(e.p, [t |-> "char", cp |-> e.n])

\* CharacterEscape, after "\": its CharacterValue. Outside UnicodeMode, by §B.1.2, "\c" before a
\* code unit that isn't a letter is "\" followed by "c", an octal digit starts a
\* LegacyOctalEscapeSequence, and IdentityEscape is any code unit but "c", or "k" with
\* NamedCaptureGroups, so "\x" or "\u" that starts no escape is "x" or "u".
RxCharacterEscape(p) ==
  LET c == RxUnit(p, 0) IN
  CASE c \in Range(N("fnrtv")) ->
         RxNode(RxSkip(p, 1), CASE c = 116 -> 9 [] c = 110 -> 10 [] c = 118 -> 11 [] c = 102 -> 12 [] OTHER -> 13)
    [] RxIsAt(p, N("c")) ->
         IF RxIsAsciiLetter(RxUnit(p, 1)) THEN RxNode(RxSkip(p, 2), RxUnit(p, 1) % 32)
         ELSE IF p.u THEN RxError(p) ELSE RxNode(p, 92)
    [] RxIsAt(p, N("x")) ->
         IF RxIsHexDigit(RxUnit(p, 1)) /\ RxIsHexDigit(RxUnit(p, 2))
         THEN RxNode(RxSkip(p, 3), RxHexValue(RxUnit(p, 1)) * 16 + RxHexValue(RxUnit(p, 2)))
         ELSE IF p.u THEN RxError(p) ELSE RxNode(RxSkip(p, 1), c)
    [] RxIsAt(p, N("u")) ->
         LET e == RxUnicodeEscape(p) IN
         IF e.p.err \/ e.n # None THEN e ELSE IF p.u THEN RxError(p) ELSE RxNode(RxSkip(p, 1), c)
    [] RxAtEnd(p) -> RxError(p)
    [] RxIsAt(p, N("0")) /\ ~RxIsDigit(RxUnit(p, 1)) -> RxNode(RxSkip(p, 1), 0)
    [] p.u -> IF c = 47 \/ c \in RxSyntaxCharacters THEN RxNode(RxSkip(p, 1), c) ELSE RxError(p)
    [] RxIsOctalDigit(c) -> RxLegacyOctal(RxSkip(p, 1), IF c <= 51 THEN 2 ELSE 1, c - 48)
    [] OTHER -> IF p.named /\ c = 107 THEN RxError(p) ELSE RxNode(RxSkip(p, 1), c)
\* LegacyOctalEscapeSequence after its first digit, with up to more digits left: its MV.
RxIsOctalDigit(c) == c >= 48 /\ c <= 55
RxLegacyOctal(p, more, value) ==
  IF more = 0 \/ ~RxIsOctalDigit(RxUnit(p, 0)) THEN RxNode(p, value)
  ELSE RxLegacyOctal(RxSkip(p, 1), more - 1, value * 8 + RxUnit(p, 0) - 48)

\* RegExpUnicodeEscapeSequence at "u": its CharacterValue, or None with p unchanged when there's none.
RxUnicodeEscape(p) ==
  LET q == RxSkip(p, 1)
      r == RxSkip(q, 4)
      lead == RxHex4Value(q)
  IN CASE p.u /\ RxIsAt(q, N("{")) -> RxBracedHex(RxSkip(q, 1), 0, 0)
       [] ~RxIsHex4(q) -> RxNode(p, None)
       [] p.u /\ RxIsLead(lead) /\ RxIsAt(r, N("\\u")) /\ RxIsHex4(RxSkip(r, 2)) /\ RxIsTrail(RxHex4Value(RxSkip(r, 2))) ->
            RxNode(RxSkip(r, 6), UTF16SurrogatePairToCodePoint(lead, RxHex4Value(RxSkip(r, 2))))
       [] OTHER -> RxNode(r, lead)
RxIsHex4(p) == \A i \in 0..3 : RxIsHexDigit(RxUnit(p, i))
RxHex4Value(p) == ((RxHexValue(RxUnit(p, 0)) * 16 + RxHexValue(RxUnit(p, 1))) * 16 + RxHexValue(RxUnit(p, 2))) * 16 + RxHexValue(RxUnit(p, 3))
\* CodePoint :: HexDigits but only if MV of HexDigits ≤ 0x10FFFF, up to "}".
RxBracedHex(p, count, value) ==
  CASE RxIsAt(p, N("}")) -> IF count = 0 THEN RxError(p) ELSE RxNode(RxSkip(p, 1), value)
    [] ~RxIsHexDigit(RxUnit(p, 0)) \/ value * 16 + RxHexValue(RxUnit(p, 0)) > 1114111 -> RxError(p)
    [] OTHER -> RxBracedHex(RxSkip(p, 1), count + 1, value * 16 + RxHexValue(RxUnit(p, 0)))

\* GroupName :: < RegExpIdentifierName >, as the code units of the name.
RxGroupName(p) ==
  LET name == RxIdentifierName(RxSkip(p, 1), <<>>) IN
  CASE ~RxIsAt(p, N("<")) -> RxError(p)
    [] name.p.err -> name
    [] name.n = <<>> -> RxError(name.p)
    [] OTHER -> RxClose(name.p, N(">"), name.n)
RxIdentifierName(p, name) ==
  LET c == RxUnit(p, 0)
      e == RxUnicodeEscape([RxSkip(p, 1) EXCEPT !.u = TRUE])
      pair == UTF16SurrogatePairToCodePoint(c, RxUnit(p, 1))
  IN CASE RxAtEnd(p) -> RxNode(p, name)
       [] RxIsAt(p, N("\\")) ->
            IF e.p.err \/ e.n = None \/ ~RxIsIdentifierChar(e.n, name = <<>>) THEN RxError(p)
            ELSE RxIdentifierName([e.p EXCEPT !.u = p.u], name \o UTF16EncodeCodePoint(e.n))
       [] RxIsLead(c) ->
            IF ~RxIsTrail(RxUnit(p, 1)) \/ ~RxIsIdentifierChar(pair, name = <<>>) THEN RxError(p)
            ELSE RxIdentifierName(RxSkip(p, 2), name \o <<c, RxUnit(p, 1)>>)
       [] RxIsIdentifierChar(c, name = <<>>) -> RxIdentifierName(RxSkip(p, 1), Append(name, c))
       [] OTHER -> RxNode(p, name)

\* CharacterClassEscape at the code unit after "\", or None with p unchanged when there's none. A
\* property escape resolves its property: k is "gc" for a General_Category value on its own, which
\* MaybeSimpleCaseFolding doesn't apply to, "ranges" for another property of code points, and
\* "strings" for a property of strings.
RxCharacterClassEscape(p) ==
  LET c == RxUnit(p, 0) IN
  CASE c \in Range(N("dDsSwW")) -> RxNode(RxSkip(p, 1), [t |-> "escape", c |-> c])
    [] c \in Range(N("pP")) /\ p.u -> RxPropertyEscape(RxSkip(p, 1), c)
    [] OTHER -> RxNode(p, None)
RxPropertyEscape(p, c) ==
  LET name == RxPropertyCharacters(RxSkip(p, 1), <<>>)
      value == RxPropertyCharacters(RxSkip(name.p, 1), <<>>)
  IN CASE ~RxIsAt(p, N("{")) -> RxError(p)
       [] name.p.err -> name
       [] name.n = <<>> -> RxError(name.p)
       [] ~RxIsAt(name.p, N("=")) -> RxPropertyEnd(name.p, c, RxLoneProperty(name.n, p.v, c = 80))
       [] value.p.err -> value
       [] value.n = <<>> -> RxError(value.p)
       [] OTHER -> RxPropertyEnd(value.p, c, RxPropertyValue(name.n, value.n))
RxPropertyCharacters(p, acc) ==
  CASE RxAtEnd(p) -> RxError(p)
    [] RxIsDigit(RxUnit(p, 0)) \/ RxIsAsciiLetter(RxUnit(p, 0)) \/ RxUnit(p, 0) = 95 ->
         RxPropertyCharacters(RxSkip(p, 1), Append(acc, RxUnit(p, 0)))
    [] OTHER -> RxNode(p, acc)
RxPropertyEnd(p, c, property) ==
  IF property = None THEN RxError(p) ELSE RxClose(p, N("}"), [t |-> "escape", c |-> c, property |-> property])

\* The property of UnicodePropertyName = UnicodePropertyValue, or None for a Syntax Error.
RxPropertyValue(name, value) ==
  LET gc == RxLookup(RegExpGeneralCategories, value)
      sc == RxLookup(RegExpScripts, value)
  IN CASE name \in {N("General_Category"), N("gc")} /\ gc # None -> [k |-> "ranges", id |-> gc[2]]
       [] name \in {N("Script"), N("sc")} /\ sc # None -> [k |-> "ranges", id |-> sc[2]]
       [] name \in {N("Script_Extensions"), N("scx")} /\ sc # None -> [k |-> "ranges", id |-> sc[3]]
       [] OTHER -> None
\* The property of LoneUnicodePropertyNameOrValue, or None for a Syntax Error.
RxLoneProperty(name, v, negated) ==
  LET gc == RxLookup(RegExpGeneralCategories, name)
      binary == RxLookup(RegExpBinaryPropertyIds, name)
      strings == RxLookup(RegExpStringPropertySets, name)
  IN CASE gc # None -> [k |-> "gc", id |-> gc[2]]
       [] binary # None -> [k |-> "ranges", id |-> binary[2]]
       [] strings # None /\ v /\ ~negated -> [k |-> "strings", set |-> strings[2]]
       [] OTHER -> None
\* The entry of a table whose first element is key, or None.
RxLookup(table, key) ==
  LET found == SelectSeq(table, LAMBDA entry : entry[1] = key) IN IF found = <<>> THEN None ELSE found[1]

\* CharacterClass :: [ ^? ClassContents ].
RxCharacterClass(p) == RxBracketed(p, "class")
\* A bracketed class at "[": a CharacterClass, or with kind "nested" a NestedClass.
RxBracketed(p, kind) ==
  LET invert == RxIsAt(RxSkip(p, 1), N("^"))
      c == RxClassContents(RxSkip(p, IF invert THEN 2 ELSE 1))
  IN IF c.p.err THEN c
     ELSE IF invert /\ RxContentsMayContainStrings(c.n) THEN RxError(c.p)
     ELSE RxClose(c.p, N("]"), [t |-> kind, invert |-> invert, c |-> c.n])

\* ClassContents: [k |-> "empty"], NonemptyClassRanges as [k |-> "ranges", items], or a
\* ClassSetExpression with k "union", "intersection", or "subtraction".
RxClassContents(p) ==
  CASE RxIsAt(p, N("]")) -> RxNode(p, [k |-> "empty"])
    [] p.v -> RxClassSetExpression(p)
    [] OTHER -> RxClassRanges(p, <<>>)

\* NonemptyClassRanges, as a list of characters, ranges, and class escapes.
RxClassRanges(p, items) ==
  LET a == RxClassAtom(p)
      q == RxSkip(a.p, 1)
      b == RxClassAtom(q)
  IN CASE RxIsAt(p, N("]")) -> RxNode(p, [k |-> "ranges", items |-> items])
       [] RxAtEnd(p) -> RxError(p)
       [] a.p.err -> a
       [] ~RxIsAt(a.p, N("-")) -> RxClassRanges(a.p, Append(items, a.n))
       [] RxIsAt(q, N("]")) -> RxClassRanges(q, items \o <<a.n, [t |-> "char", cp |-> 45]>>)
       [] b.p.err -> b
       \* §B.1.2.8.1: outside UnicodeMode, a class escape at either end is in the union with "-".
       [] (a.n.t = "escape" \/ b.n.t = "escape") /\ ~p.u ->
            RxClassRanges(b.p, items \o <<a.n, [t |-> "char", cp |-> 45], b.n>>)
       [] a.n.t = "escape" \/ b.n.t = "escape" \/ a.n.cp > b.n.cp -> RxError(b.p)
       [] OTHER -> RxClassRanges(b.p, Append(items, [t |-> "range", lo |-> a.n.cp, hi |-> b.n.cp]))

\* ClassAtom: a character, or a class escape.
RxClassAtom(p) ==
  LET q == RxSkip(p, 1)
      class == RxCharacterClassEscape(q)
      e == RxCharacterEscape(q)
      c == RxSourceCharacter(p)
  IN CASE ~RxIsAt(p, N("\\")) -> IF c.p.err THEN c ELSE RxNode(c.p, [t |-> "char", cp |-> c.n])
       [] RxIsAt(q, N("b")) -> RxNode(RxSkip(q, 1), [t |-> "char", cp |-> 8])
       [] p.u /\ RxIsAt(q, N("-")) -> RxNode(RxSkip(q, 1), [t |-> "char", cp |-> 45])
       [] class.p.err \/ class.n # None -> class
       [] ~p.u /\ RxIsAt(q, N("c")) /\ (RxIsDigit(RxUnit(q, 1)) \/ RxUnit(q, 1) = 95) ->
            RxNode(RxSkip(q, 2), [t |-> "char", cp |-> RxUnit(q, 1) % 32])
       [] e.p.err -> e
       [] OTHER -> RxNode(e.p, [t |-> "char", cp |-> e.n])

\* ClassSetExpression :: ClassUnion | ClassIntersection | ClassSubtraction.
RxClassSetExpression(p) ==
  LET left == RxClassSetCharacter(p)
      operand == IF left.n # None THEN RxNode(left.p, [t |-> "char", cp |-> left.n]) ELSE RxClassSetOperand(p)
  IN CASE left.p.err -> left
       [] left.n # None /\ RxIsAt(left.p, N("-")) /\ ~RxIsAt(left.p, N("--")) -> RxClassUnion(p, <<>>)
       [] operand.p.err -> operand
       [] RxIsAt(operand.p, N("&&")) -> RxClassSetOperation(RxSkip(operand.p, 2), "intersection", N("&&"), <<operand.n>>)
       [] RxIsAt(operand.p, N("--")) -> RxClassSetOperation(RxSkip(operand.p, 2), "subtraction", N("--"), <<operand.n>>)
       [] OTHER -> RxClassUnion(operand.p, <<operand.n>>)

\* ClassUnion :: (ClassSetRange | ClassSetOperand)*.
RxClassUnion(p, items) ==
  LET c == RxClassSetCharacter(p)
      d == RxClassSetCharacter(RxSkip(c.p, 1))
      o == RxClassSetOperand(p)
  IN CASE c.p.err -> c
       [] c.n # None /\ RxIsAt(c.p, N("-")) ->
            IF d.p.err THEN d
            ELSE IF d.n = None \/ c.n > d.n THEN RxError(d.p)
            ELSE RxClassUnion(d.p, Append(items, [t |-> "range", lo |-> c.n, hi |-> d.n]))
       [] c.n # None -> RxClassUnion(c.p, Append(items, [t |-> "char", cp |-> c.n]))
       [] ~RxIsAt(p, N("\\")) /\ ~RxIsAt(p, N("[")) -> RxNode(p, [k |-> "union", items |-> items])
       [] o.p.err -> o
       [] OTHER -> RxClassUnion(o.p, Append(items, o.n))

\* ClassIntersection and ClassSubtraction: operands joined by op, "&&" or "--". The second operand of
\* "&&" can't start with "&".
RxClassSetOperation(p, kind, op, items) ==
  LET o == RxClassSetOperand(p) IN
  CASE kind = "intersection" /\ RxIsAt(p, N("&")) -> RxError(p)
    [] o.p.err -> o
    [] RxIsAt(o.p, op) -> RxClassSetOperation(RxSkip(o.p, 2), kind, op, Append(items, o.n))
    [] OTHER -> RxNode(o.p, [k |-> kind, items |-> Append(items, o.n)])

\* ClassSetOperand :: NestedClass | ClassStringDisjunction | ClassSetCharacter.
RxClassSetOperand(p) ==
  LET strings == RxClassStrings(RxSkip(p, 3), <<>>, <<>>)
      class == IF RxIsAt(p, N("\\")) THEN RxCharacterClassEscape(RxSkip(p, 1)) ELSE RxNode(p, None)
      c == RxClassSetCharacter(p)
  IN CASE RxIsAt(p, N("[")) -> RxBracketed(p, "nested")
       [] RxIsAt(p, N("\\q{")) -> IF strings.p.err THEN strings ELSE RxClose(strings.p, N("}"), [t |-> "strings", strs |-> strings.n])
       [] RxIsAt(p, N("\\q")) -> RxError(p)
       [] class.p.err \/ class.n # None -> class
       [] c.p.err -> c
       [] c.n = None -> RxError(p)
       [] OTHER -> RxNode(c.p, [t |-> "char", cp |-> c.n])

\* ClassSetCharacter: its CharacterValue, or None with p unchanged when there's none.
RxClassSetCharacter(p) ==
  LET a == RxUnit(p, 0)
      b == RxUnit(p, 1)
  IN CASE RxAtEnd(p) -> RxError(p)
       [] RxIsAt(p, N("\\b")) -> RxNode(RxSkip(p, 2), 8)
       [] ~(a = b /\ a \in RxClassSetReservedDoublePunctuators) /\ a \notin RxClassSetSyntaxCharacters ->
            RxSourceCharacter(p)
       [] a # 92 -> RxNode(p, None)
       [] b \in RxClassSetReservedPunctuators -> RxNode(RxSkip(p, 2), b)
       [] b \in RxCharacterEscapeStarts -> RxCharacterEscape(RxSkip(p, 1))
       [] OTHER -> RxNode(p, None)

\* ClassStringDisjunctionContents, after "\q{": the list of its ClassStrings, as code points.
RxClassStrings(p, current, strs) ==
  LET c == RxClassSetCharacter(p) IN
  CASE c.p.err -> c
    [] c.n # None -> RxClassStrings(c.p, Append(current, c.n), strs)
    [] RxIsAt(p, N("|")) -> RxClassStrings(RxSkip(p, 1), <<>>, Append(strs, current))
    [] OTHER -> RxNode(p, Append(strs, current))

\* MayContainStrings (§22.2.1.6).
RxContentsMayContainStrings(c) ==
  CASE c.k = "union" -> \E i \in DOMAIN c.items : RxOperandMayContainStrings(c.items[i])
    [] c.k = "intersection" -> \A i \in DOMAIN c.items : RxOperandMayContainStrings(c.items[i])
    [] c.k = "subtraction" -> RxOperandMayContainStrings(c.items[1])
    [] OTHER -> FALSE
RxOperandMayContainStrings(o) ==
  CASE o.t = "nested" -> ~o.invert /\ RxContentsMayContainStrings(o.c)
    [] o.t = "escape" -> o.c = 112 /\ o.property.k = "strings"
    [] o.t = "strings" -> \E i \in DOMAIN o.strs : Len(o.strs[i]) # 1
    [] OTHER -> FALSE

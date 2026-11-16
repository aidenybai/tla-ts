\* ECMAScript language values (§6.1). A JS string is a sequence of UTF-16 code units, a Number is
\* the record that ESNumber defines, and an object or symbol is an index into the state.
Undefined == [type |-> "undefined"]
Null == [type |-> "null"]
True == [type |-> "boolean", value |-> TRUE]
False == [type |-> "boolean", value |-> FALSE]
Bool(b) == IF b THEN True ELSE False
Str(units) == [type |-> "string", value |-> units]
Num(n) == [type |-> "number", value |-> n]
IntV(n) == Num(NumFromInt(n))
BigInt(b) == [type |-> "bigint", value |-> b]
Obj(id) == [type |-> "object", id |-> id]
Sym(id) == [type |-> "symbol", id |-> id]
EmptyStr == Str(<<>>)


IsObject(v) == v.type = "object"
IsString(v) == v.type = "string"
IsNumber(v) == v.type = "number"
IsSymbol(v) == v.type = "symbol"
IsBigInt(v) == v.type = "bigint"
IsBoolean(v) == v.type = "boolean"
IsNullish(v) == v.type \in {"undefined", "null"}
IsPropertyKey(v) == v.type \in {"string", "symbol"}
SV(text) == Str(N(text))

\* Completion records (§6.2.4) and the result of an operation that changes the state: the new
\* state s and the completion c.
Completion(type, value, target) == [type |-> type, value |-> value, target |-> target]
NormalCompletion(v) == Completion("normal", v, Empty)
ThrowCompletion(v) == Completion("throw", v, Empty)
Ok(s, v) == [s |-> s, c |-> NormalCompletion(v)]
Abrupt(s, c) == [s |-> s, c |-> c]
ThrowValue(s, v) == [s |-> s, c |-> ThrowCompletion(v)]
IsAbrupt(r) == r.c.type # "normal"
Val(r) == r.c.value
UpdateEmpty(c, v) ==
  IF c.value # Empty THEN c ELSE [c EXCEPT !.value = v]

\* A generator or async function suspends at a yield or await with a completion of type
\* "suspend": its value is the value yielded or awaited, its target is "yield" or "await", and
\* frames is the rest of the body's evaluation, innermost first. Each evaluation step whose name
\* ends in Then takes the result of the evaluation it waits on as its last parameter. The build
\* makes every such step pass a suspension on with a frame of its other parameters, and
\* generates ResumeFrame, which runs a frame's step on the result the body resumes with.
Suspend(s, target, v) == [s |-> s, c |-> [type |-> "suspend", value |-> v, target |-> target, frames |-> <<>>]]
IsSuspended(r) == r.c.type = "suspend"
Pass(r, step, args) == [r EXCEPT !.c.frames = Append(@, [step |-> step, args |-> args])]

\* Resumes a suspended evaluation from its frames with the completion r of the yield or await.
ResumeFrames(frames, r) ==
  IF frames = <<>> \/ IsSuspended(r) THEN
    IF IsSuspended(r) THEN [r EXCEPT !.c.frames = @ \o frames] ELSE r
  ELSE ResumeFrames(Tail(frames), ResumeFrame(Head(frames), r))

\* Well-known symbols (§6.1.5.1), which the realm allocates first.
WellKnownSymbols ==
  << "Symbol.asyncIterator", "Symbol.hasInstance", "Symbol.isConcatSpreadable", "Symbol.iterator",
     "Symbol.match", "Symbol.matchAll", "Symbol.replace", "Symbol.search", "Symbol.species",
     "Symbol.split", "Symbol.toPrimitive", "Symbol.toStringTag", "Symbol.unscopables",
     "Symbol.asyncDispose", "Symbol.dispose" >>
SymAsyncIterator == Sym(1)
SymHasInstance == Sym(2)
SymIsConcatSpreadable == Sym(3)
SymIterator == Sym(4)
SymMatch == Sym(5)
SymMatchAll == Sym(6)
SymReplace == Sym(7)
SymSearch == Sym(8)
SymSpecies == Sym(9)
SymSplit == Sym(10)
SymToPrimitive == Sym(11)
SymToStringTag == Sym(12)
SymUnscopables == Sym(13)
SymAsyncDispose == Sym(14)
SymDispose == Sym(15)

\* Sequence helpers.
Range(seq) == {seq[i] : i \in DOMAIN seq}
Last(seq) == seq[Len(seq)]
IndexOf(seq, x) ==
  LET found == {i \in DOMAIN seq : seq[i] = x}
  IN IF found = {} THEN 0 ELSE CHOOSE i \in found : \A j \in found : i <= j
Remove(seq, x) == SelectSeq(seq, LAMBDA y : y # x)
MapSeq(seq, F(_)) == [i \in DOMAIN seq |-> F(seq[i])]
Concat(seqs) == FoldLeftSeq(seqs)
FoldLeftSeq(seqs) == IF seqs = <<>> THEN <<>> ELSE Head(seqs) \o FoldLeftSeq(Tail(seqs))
Repeat(x, n) == [i \in 1..n |-> x]

\* A heap of records, indexed from 1, in pages of HeapPageSize. Changing a record copies its page and
\* the list of pages, about n / HeapPageSize + HeapPageSize entries, rather than all n.
HeapPageSize == 256
HeapGet(h, i) == h.pages[(i - 1) \div HeapPageSize + 1][((i - 1) % HeapPageSize) + 1]
HeapSet(h, i, x) == [h EXCEPT !.pages[(i - 1) \div HeapPageSize + 1][((i - 1) % HeapPageSize) + 1] = x]
HeapAppend(h, x) ==
  [size |-> h.size + 1,
   pages |-> IF h.size % HeapPageSize = 0 THEN Append(h.pages, <<x>>) ELSE [h.pages EXCEPT ![Len(h.pages)] = Append(@, x)]]
\* h with only its first n records.
HeapTruncate(h, n) ==
  LET count == (n + HeapPageSize - 1) \div HeapPageSize
      pages == SubSeq(h.pages, 1, count)
  IN [size |-> n, pages |-> IF n % HeapPageSize = 0 THEN pages ELSE [pages EXCEPT ![count] = SubSeq(@, 1, n % HeapPageSize)]]
\* h with the records of seq from index i on appended.
HeapAppendFrom(h, seq, i) == IF i > Len(seq) THEN h ELSE HeapAppendFrom(HeapAppend(h, seq[i]), seq, i + 1)
HeapOf(seq) == HeapAppendFrom([size |-> 0, pages |-> <<>>], seq, 1)

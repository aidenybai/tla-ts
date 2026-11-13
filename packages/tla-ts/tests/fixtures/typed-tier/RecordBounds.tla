---- MODULE RecordBounds ----
EXTENDS Naturals, Sequences
VARIABLES pair, data
Array(T, len) == [elems: [1..len -> T]]
Pairs == [lo: 0..2, hi: 0..3]
Min(left, right) == IF left < right THEN left ELSE right
Init == pair = [lo |-> 0, hi |-> 1] /\ data = [elems |-> <<>>]
Next ==
  \/ /\ \E next \in [lo: 0..Min(pair.hi, 2), hi: pair.lo..3]:
          /\ next.lo < next.hi
          /\ IF data \in Array(0..3, next.lo) THEN TRUE ELSE next.hi = 3
          /\ ~(data.elems \in [0..next.lo -> 0..3])
          /\ pair' = next
     /\ UNCHANGED data
  \/ /\ \E len \in 0..pair.lo: \E next \in Array({pair.lo, pair.hi}, len):
          /\ \A index \in DOMAIN next.elems: next.elems[index] >= index
          /\ data' = next
     /\ UNCHANGED pair
TypeOK == pair \in Pairs /\ data \in Array(0..3, Len(data.elems))
====

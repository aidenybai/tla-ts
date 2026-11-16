---- MODULE FlattenChunks ----
EXTENDS Naturals, Sequences, SequencesExt
VARIABLES chunks, flat
Init == chunks = <<>> /\ flat = FlattenSeq(<<>>)
Grow ==
  /\ Len(chunks) < 3
  /\ \E size \in 0..2, start \in {1, 5} :
       chunks' = Append(chunks, [i \in 1..size |-> start + i])
  /\ flat' = FlattenSeq(chunks')
Restart == Len(flat) > 1 /\ flat[1] = 2 /\ chunks' = <<<<9>>>> /\ flat' = FlattenSeq(chunks')
Next == Grow \/ Restart
Inv == Len(flat) <= 6 /\ \A i \in DOMAIN flat : flat[i] > 1
====

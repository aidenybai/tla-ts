---- MODULE SubSeqPrefixes ----
EXTENDS Naturals, Sequences
VARIABLES a, b, same, shifted
Init == a = <<>> /\ b = <<>> /\ same = FALSE /\ shifted = FALSE
Grow ==
  \/ Len(a) < 3 /\ \E x \in {1, 2} : a' = Append(a, x) /\ UNCHANGED b
  \/ Len(b) < 3 /\ \E x \in {1, 2} : b' = Append(b, x) /\ UNCHANGED a
Next ==
  \/ Grow /\ UNCHANGED <<same, shifted>>
  \/ /\ Len(a) = Len(b)
     /\ Len(a) > 0
     /\ SubSeq(a, 1, Len(a)) = SubSeq(b, 1, Len(b))
     /\ same' = TRUE
     /\ UNCHANGED <<a, b, shifted>>
  \/ /\ Len(a) > 1
     /\ Len(b) >= Len(a) - 1
     /\ SubSeq(a, 2, Len(a)) # SubSeq(b, 1, Len(a) - 1)
     /\ shifted' = TRUE
     /\ UNCHANGED <<a, b, same>>
====

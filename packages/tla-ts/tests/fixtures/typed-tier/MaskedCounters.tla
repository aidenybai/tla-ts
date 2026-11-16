---- MODULE MaskedCounters ----
EXTENDS Naturals
VARIABLE counts
Init == counts = [slot \in {} |-> 0]
Next ==
  \E slot \in 0..3 :
    counts' = [other \in DOMAIN counts \cup {slot} |->
                IF other = slot
                THEN IF slot \in DOMAIN counts THEN (counts[slot] + 1) % 12 ELSE 0
                ELSE counts[other]]
====

---- MODULE TupleLengths ----
EXTENDS Naturals, Sequences
VARIABLES pairs, x
Init == pairs = {<<1, 2>>} /\ x = 0
Next ==
  \/ /\ x < 2
     /\ pairs' = pairs \cup {<<x, x + 1, x + 2>>}
     /\ x' = x + 1
  \/ \E <<a, b>> \in pairs :
       /\ x' = (a + b) % 3
       /\ UNCHANGED pairs
====

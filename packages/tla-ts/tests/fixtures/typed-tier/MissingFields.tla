---- MODULE MissingFields ----
EXTENDS Naturals
VARIABLE m
Init == m = [kind |-> 1]
Next ==
  \/ m' = [kind |-> 2, size |-> 3]
  \/ m.size = 3 /\ m' = [kind |-> 1]
====

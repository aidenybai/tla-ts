---- MODULE SetBoundSelection ----
EXTENDS Naturals
VARIABLE x
Init == x = {r \in [a : 1..11, b : 1..10] : r.a = 1}
Next == UNCHANGED x
====

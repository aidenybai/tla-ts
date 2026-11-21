---- MODULE SetBoundFilter ----
EXTENDS Naturals
VARIABLE x
Init == x = {r \in [a : 1..11, b : 1..10] : TRUE}
Next == UNCHANGED x
====

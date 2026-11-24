---- MODULE LazyExcept ----
EXTENDS Naturals
VARIABLE x, r
Init == x = 0 /\ r = [a |-> 0]
Next == x < 3 /\ x' = x + 1 /\ r' = [n \in {1} |-> [[a |-> 0] EXCEPT !.b = n]]
====

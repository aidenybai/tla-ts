---- MODULE NextExcept ----
EXTENDS Naturals
VARIABLE x, r
Init == x = 0 /\ r = [a |-> 0]
Next == x < 3 /\ x' = x + 1 /\ r' = [[a |-> 0] EXCEPT !.b = 1]
====

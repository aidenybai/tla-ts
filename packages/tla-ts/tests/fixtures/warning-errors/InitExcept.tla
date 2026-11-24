---- MODULE InitExcept ----
EXTENDS Naturals
VARIABLE x, r
Init == x = 0 /\ r = [[a |-> 0] EXCEPT !.b = 1]
Next == x < 3 /\ x' = x + 1 /\ r' = r
====

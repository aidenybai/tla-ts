---- MODULE OperatorExcept ----
EXTENDS Naturals
VARIABLE x, r
F(s) == [s EXCEPT !.b = 1]
Init == x = 0 /\ r = F([a |-> 0])
Next == x < 3 /\ x' = x + 1 /\ r' = r
====

---- MODULE Records ----
EXTENDS Naturals
VARIABLES r, q, n
Init == r = [a |-> 0, b |-> 0] /\ q = 0 /\ n = 0
Next == n < 3 /\ n' = n + 1 /\ r' = [b |-> n, a |-> n] /\ q' = IF n = 0 THEN [b |-> 1, a |-> 1] ELSE q
Inv == n < 2
Cons == n # 2
====

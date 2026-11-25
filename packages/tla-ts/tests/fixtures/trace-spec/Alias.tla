---- MODULE Alias ----
EXTENDS Naturals, TLC
VARIABLES r, s, q, n
Init == r = [a |-> 0, b |-> 0] /\ s = r /\ q = <<>> /\ n = 0
Next == n < 3 /\ n' = n + 1 /\ r' = [b |-> n, a |-> n] /\ s' = [b |-> n, a |-> n] /\ q' = <<r, s>>
Inv == n < 3
Alias == [r |-> r, s |-> [b |-> s.b, a |-> s.a], q |-> q, n |-> n, t |-> ToString(q)]
====

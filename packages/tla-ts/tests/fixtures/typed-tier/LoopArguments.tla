---- MODULE LoopArguments ----
EXTENDS Naturals
VARIABLE x
Twice(a) == a + a
Init == x = 0
Next == \E i \in 1..3 : x' = (x + Twice(i * x + i)) % 11
====

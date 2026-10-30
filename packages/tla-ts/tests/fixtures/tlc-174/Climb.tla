---- MODULE Climb ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Step(n) == x' = x + n
Next == \E n \in {1, 2} : Step(n)
Low == x < 3
Settled == TRUE
====

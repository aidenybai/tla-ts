---- MODULE ValueOverride ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Step(n) == x' = x + n
Reset(n) == x' = 0
Next == (\E n \in 1..2 : x < 4 /\ Step(n)) \/ (\E n \in 1..2 : Reset(n))
====

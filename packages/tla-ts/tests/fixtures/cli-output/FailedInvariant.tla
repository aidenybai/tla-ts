---- MODULE FailedInvariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 3 /\ x' = x + 1
Inv == 1 \div (2 - x) >= 0
====

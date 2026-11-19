---- MODULE ViewSteps ----
EXTENDS Naturals, TLC
CONSTANT Last
VARIABLE x
Init == x \in {0, 1}
Next == x < Last /\ x' = x + 1
View == IF PrintT(<<"view", x, TLCGet("level")>>) THEN x ELSE x
====

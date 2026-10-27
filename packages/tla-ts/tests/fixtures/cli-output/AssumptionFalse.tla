---- MODULE AssumptionFalse ----
EXTENDS Naturals
VARIABLE x
ASSUME Positive == 1 > 2
Init == x = 0
Next == x' = x
====

---- MODULE UnfingerprintedState ----
EXTENDS Naturals
VARIABLE x
Init == x = SUBSET SUBSET (1..36)
Next == x' = x
====

---- MODULE UnfingerprintedConstraint ----
EXTENDS Naturals
VARIABLES x, y
vars == <<x, y>>
Init == x = 0 /\ y = 0
Next == x' = {1} /\ y' = y
A == y' = y + 1
C == [A]_vars
====

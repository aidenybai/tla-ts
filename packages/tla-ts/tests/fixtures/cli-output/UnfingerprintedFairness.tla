---- MODULE UnfingerprintedFairness ----
EXTENDS Naturals
VARIABLES x, y
vars == <<x, y>>
Init == x = 0 /\ y = 0
A == x' = x /\ y' = (y + 1) % 3
Next == A \/ (x' = {1} /\ y' = y)
Spec == Init /\ [][Next]_vars /\ WF_vars(A)
Live == <>(y = 2)
====

---- MODULE LiveViolation ----
EXTENDS Naturals
VARIABLES x, y
vars == <<x, y>>
Init == x = 0 /\ y \in {0, 1}
Next ==
  \/ x < 5 /\ x' = x + 1 /\ y' = y
  \/ y' = 1 - y /\ x' = x
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)
Grows == <>(x > 0)
Short == x + y < 6
====

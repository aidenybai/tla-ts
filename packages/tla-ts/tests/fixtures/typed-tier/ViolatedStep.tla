---- MODULE ViolatedStep ----
EXTENDS Naturals
VARIABLES x, y
vars == <<x, y>>
Init == x = 0 /\ y = 0
Next ==
  \/ x < 5 /\ x' = x + 1 /\ y' = y
  \/ y < 3 /\ y' = y + 1 /\ x' = x
  \/ x = 4 /\ y = 2 /\ x' = 0 /\ y' = y
Spec == Init /\ [][Next]_vars
Monotone == [][x' >= x]_vars
====

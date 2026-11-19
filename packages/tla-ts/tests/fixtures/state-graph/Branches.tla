---- MODULE Branches ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Init == x = 0 /\ y = 0
Inc == x < 2 /\ x' = x + 1 /\ y' = y
Flip == y' = 1 - y /\ x' = x
Next == Inc \/ Flip
Spec == Init /\ [][Next]_vars /\ WF_vars(Inc) /\ SF_vars(Flip)
Live == []<>(y = 1) /\ <>(x = 2)
Live2 == (x = 1) ~> (y = 0)
====

---- MODULE LeadsTo ----
EXTENDS Integers
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Live == (x = 1) ~> (x = 0)
====

---- MODULE UnnamedActions ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0
Next == \E d \in {1, 2} : x' = (x + d) % 3 /\ UNCHANGED y
Spec == Init /\ y = 0 /\ [][Next \/ (y' = 1 - y /\ UNCHANGED x)]_<<x, y>>
====

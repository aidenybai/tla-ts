---- MODULE MissingFunctionField ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = [s \in {"a"} |-> 1].b
Spec == Init /\ [][Next]_x
====

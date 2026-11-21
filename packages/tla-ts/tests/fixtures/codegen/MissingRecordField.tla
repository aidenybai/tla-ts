---- MODULE MissingRecordField ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = [a |-> 1].b
Spec == Init /\ [][Next]_x
====

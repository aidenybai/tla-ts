---- MODULE NonRecordField ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (5).a
Spec == Init /\ [][Next]_x
====

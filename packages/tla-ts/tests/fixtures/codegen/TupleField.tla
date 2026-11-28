---- MODULE TupleField ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = <<1, 2>>.a
Spec == Init /\ [][Next]_x
====

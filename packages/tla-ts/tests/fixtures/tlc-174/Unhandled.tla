---- MODULE Unhandled ----
EXTENDS Integers
VARIABLE x
Init == x = 0
Next == x' = 1 - x
Spec == Init /\ [][Next]_x
Prop == \A k \in 0..1 : \A j \in 0..1 : <>(2 \in 1)
====

------------------------------ MODULE Counting ------------------------------
EXTENDS Naturals

CONSTANT Limit

VARIABLE value

Init == value = 0

Next == value < Limit /\ value' = value + 1

Spec == Init /\ [][Next]_value /\ WF_value(Next)
=============================================================================

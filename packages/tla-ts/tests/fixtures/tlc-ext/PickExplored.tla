----------------------------- MODULE PickExplored -----------------------------
EXTENDS Naturals, TLCExt

VARIABLES x, y

vars == <<x, y>>

Init == x = 0 /\ y = 0

Next == \/ x = 0 /\ x' = 1 /\ UNCHANGED y
        \/ y = 0 /\ y' = 1 /\ UNCHANGED x

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

Ask == PickSuccessor(FALSE)

Unmarked == x + y < 2

Leads == (x = 1) ~> (y = 1)
=============================================================================

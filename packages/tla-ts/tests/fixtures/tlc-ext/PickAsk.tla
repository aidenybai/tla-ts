------------------------------ MODULE PickAsk ------------------------------
EXTENDS Naturals, TLCExt

VARIABLES x, y

Init == x = 0 /\ y = 0

Next == \/ x < 2 /\ x' = x + 1 /\ UNCHANGED y
        \/ y < 1 /\ y' = y + 1 /\ UNCHANGED x

Ask == PickSuccessor(FALSE)
=============================================================================

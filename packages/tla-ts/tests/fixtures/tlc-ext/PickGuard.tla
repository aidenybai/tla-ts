------------------------------ MODULE PickGuard ------------------------------
EXTENDS Naturals, TLC, TLCExt

VARIABLE x

Init == x = 0

Next == PickSuccessor(PrintT("guard")) /\ x < 2 /\ x' = x + 1
=============================================================================

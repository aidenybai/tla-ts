---------------------------- MODULE Postconditions ----------------------------
EXTENDS Naturals, TLC

VARIABLE x

Init == x = 0

Next == x < 3 /\ x' = x + 1

AtTwo == x = 2

AtTen == x = 10

Steps == x' = x + 1

FourStates == TLCGet("distinct") = 4

FiveStates == TLCGet("distinct") = 5
=============================================================================

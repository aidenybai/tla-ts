------------------------------ MODULE Ordering ------------------------------
EXTENDS Naturals

VARIABLE x

Init == x = 0

Next == x' = x + 1

Small == x < 2

Increasing == [][x' < 2]_x

Bounded == x' < 2
=============================================================================

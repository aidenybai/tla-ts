------------------------------ MODULE Capture ------------------------------
EXTENDS Naturals

VARIABLE x

I(p) == INSTANCE CaptureInner WITH C <- p

ASSUME I(3)!Has({1, 3}) /\ ~I(3)!Has({1, 2})

Init == x = 0

Next == x' = 1 - x
=============================================================================

---- MODULE ContinueNextFailure ----
EXTENDS Naturals

VARIABLE x

Init == x = 0

Next == x' = (x /\ TRUE)
====

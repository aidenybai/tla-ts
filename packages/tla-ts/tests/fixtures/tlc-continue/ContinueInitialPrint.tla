---- MODULE ContinueInitialPrint ----
EXTENDS Naturals, TLC

VARIABLE x

Init == x \in 1..2

Next == x' = x

Positive == x > 1

Shown == PrintT(<<"checked", x>>)
====

---- MODULE CaseNonBoolean ----
EXTENDS Naturals

VARIABLE x

Pick(n) == CASE n = 0 -> 1
             [] n + 1 -> 2

Init == x = 0

Next == x' = Pick(x)

Inv == x < 10
====

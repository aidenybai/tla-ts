---- MODULE Base ----
EXTENDS Naturals
VARIABLE c
BaseInit == c = 0
Step(n) == c' = (c + n) % 3
BaseNext == \E n \in {1, 2} : Step(n)
====

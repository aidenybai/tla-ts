---- MODULE SetBoundUnion ----
EXTENDS Naturals
VARIABLE x
Init == x = UNION {1..60, 61..120}
Next == UNCHANGED x
====

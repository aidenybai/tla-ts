---- MODULE Counter ----
EXTENDS Naturals
VARIABLE count
CInit == count = 0
CNext == count' = (count + 1) % 2
====

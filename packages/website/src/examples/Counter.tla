---- MODULE Counter ----
EXTENDS Naturals
VARIABLE count

Init == count = 0
Next == count' = count + 1

Small == count < 3
====

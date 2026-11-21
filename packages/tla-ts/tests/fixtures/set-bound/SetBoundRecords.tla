---- MODULE SetBoundRecords ----
EXTENDS Naturals
VARIABLE x
Init == x = [a : 1..11, b : 1..10]
Next == UNCHANGED x
====

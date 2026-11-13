---- MODULE GrowingSet ----
EXTENDS Naturals
VARIABLES n, s
Init == n = 0 /\ s = {}
Next == n < 30 /\ n' = n + 1 /\ s' = s \cup {n}
====

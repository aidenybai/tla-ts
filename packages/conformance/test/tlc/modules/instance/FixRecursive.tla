---- MODULE FixRecursive ----
EXTENDS Naturals
r[n \in 0..2] == IF n = 0 THEN 0 ELSE r[n - 1] + 1
====

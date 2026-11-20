---- MODULE Sum ----
EXTENDS Naturals
CONSTANT Depth
RECURSIVE Sum(_)
Sum(n) == IF n = 0 THEN 0 ELSE n + Sum(n - 1)
VARIABLE total
Init == total = 0
Next == total' = Sum(Depth)
====

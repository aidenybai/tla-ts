--------------------------- MODULE ScopingCounter ---------------------------
EXTENDS Naturals

CONSTANT Limit

VARIABLE count

Step == count < Limit /\ count' = count + 1

RECURSIVE Sum(_)
Sum(n) == IF n = 0 THEN 0 ELSE LET rest == Sum(n - 1) IN n + rest

Table[n \in 0..Limit] == IF n = 0 THEN 1 ELSE Table[n - 1] + 1
=============================================================================

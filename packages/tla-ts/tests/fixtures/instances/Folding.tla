------------------------------ MODULE Folding ------------------------------
EXTENDS Naturals

CONSTANT Combine(_, _)

VARIABLE total

Step == \E item \in 1..2 : total' = Combine(total, item)
=============================================================================

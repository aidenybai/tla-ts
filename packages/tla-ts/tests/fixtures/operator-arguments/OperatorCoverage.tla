---- MODULE OperatorCoverage ----
EXTENDS Naturals, Sequences
VARIABLE x
Big(e) == e > 1
Inc(y) == y + 1
Step(F(_)) == x < 3 /\ x' = F(x)
Init == x = 0
Next == Step(Inc) \/ (x < 3 /\ x' = x + Len(SelectSeq(<<1, 2, 3>>, Big)))
Inv == Big(x) \/ Inc(x) > 0
====

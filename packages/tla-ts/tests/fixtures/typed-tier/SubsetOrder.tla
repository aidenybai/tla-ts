---- MODULE SubsetOrder ----
EXTENDS Naturals, FiniteSets
VARIABLES pool, picked, branch
Init == pool = {1, 3, 5, 7} /\ picked = {} /\ branch = 0
Next ==
  /\ Cardinality(pool) >= 2
  /\ picked' = CHOOSE s \in SUBSET pool : Cardinality(s) = 2
  /\ pool' = pool \ {CHOOSE x \in picked' : TRUE}
  /\ \E k \in 1..(CHOOSE x \in picked' : \A y \in picked' : x <= y) : branch' = k
====

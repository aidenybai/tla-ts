---- MODULE SubsetUnionViolation ----
EXTENDS Naturals, FiniteSets
VARIABLES held, round
Init == held = {} /\ round = 0
Next ==
  /\ round' = round + 1
  /\ held' \in SUBSET (UNION {{1, 2}, {2, round + 2}, held})
Small == Cardinality(held) < 3
====

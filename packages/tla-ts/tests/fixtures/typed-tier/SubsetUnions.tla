---- MODULE SubsetUnions ----
EXTENDS Naturals, FiniteSets
VARIABLES held, pairs, round
Ids == UNION {[proc : {p}, idx : {1}] : p \in 1..round}
Init == held = {} /\ pairs = {} /\ round = 0
Next ==
  /\ round < 2
  /\ round' = round + 1
  /\ held' \in SUBSET (UNION {{1, 2}, {2, round + 2}, held})
  /\ pairs' \in SUBSET (Ids' \X Ids')
====

---- MODULE SymmetricViolation ----
EXTENDS Naturals, FiniteSets, TLC
CONSTANTS Procs
VARIABLES held, count
Init == held = {} /\ count = 0
Next ==
  \/ \E p \in Procs \ held : held' = held \cup {p} /\ count' = count + 1
  \/ \E p \in held : held' = held \ {p} /\ count' = count
Symmetry == Permutations(Procs)
Few == Cardinality(held) < 3 \/ count < 4
====

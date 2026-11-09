---- MODULE ScrambledImages ----
EXTENDS Naturals, TLC
CONSTANT Procs
VARIABLE pairs
Init == pairs = Procs \X (1..6)
Next == \E p \in Procs : pairs' = pairs \ {<<p, 6>>}
Symmetry == Permutations(Procs)
====

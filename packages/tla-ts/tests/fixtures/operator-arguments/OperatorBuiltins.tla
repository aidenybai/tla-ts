---- MODULE OperatorBuiltins ----
EXTENDS Naturals, FiniteSets
VARIABLE x
Skip(F(_)) == x = 0 /\ x' = 1
SkipPair(G(_, _)) == x = 1 /\ x' = 2
Apply(F(_)) == x < 2 /\ x' = x + Cardinality(F({1}))
Init == x = 0
Named == Skip(SUBSET) \/ SkipPair(\cup)
Applied == Apply(SUBSET)
====

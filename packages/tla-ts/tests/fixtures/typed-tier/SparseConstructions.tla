---- MODULE SparseConstructions ----
EXTENDS Integers, TLC
VARIABLES x
Init == x \in [{1, 2} -> BOOLEAN]
Swap == x # <<TRUE, FALSE>> /\ x' = [i \in DOMAIN x |-> x[3 - i]]
Flip == x' = (1 :> ~x[1]) @@ x
Next == Swap \/ Flip
====

---- MODULE Symmetry ----
EXTENDS Naturals, TLC

CONSTANT Proc, Value

VARIABLES votes, owner

Init == votes = [p \in Proc |-> 0] /\ owner \in Value

Next ==
  \/ \E p \in Proc :
       /\ votes[p] < 2
       /\ votes' = [votes EXCEPT ![p] = @ + 1]
       /\ UNCHANGED owner
  \/ \E v \in Value :
       /\ owner' = v
       /\ UNCHANGED votes

Spec == Init /\ [][Next]_<<votes, owner>>

Symmetric == Permutations(Proc) \cup Permutations(Value)
====

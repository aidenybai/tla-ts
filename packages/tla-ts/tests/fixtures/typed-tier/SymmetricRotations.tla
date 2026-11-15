---- MODULE SymmetricRotations ----
EXTENDS Naturals, TLC
CONSTANTS p1, p2, p3, Values
Procs == {p1, p2, p3}
VARIABLES holds, count

Rotations == {[p \in Procs |-> CASE p = p1 -> p2 [] p = p2 -> p3 [] p = p3 -> p1]}
Symmetry == Rotations \cup Permutations(Values)

Init == holds = [p \in Procs |-> {}] /\ count = [p \in Procs |-> 0]

Take == \E p \in Procs, v \in Values :
  /\ holds' = [holds EXCEPT ![p] = @ \cup {v}]
  /\ count' = [count EXCEPT ![p] = (@ + 1) % 3]

Drop == \E p \in Procs : \E v \in holds[p] :
  /\ holds' = [holds EXCEPT ![p] = @ \ {v}]
  /\ UNCHANGED count

Next == Take \/ Drop
====

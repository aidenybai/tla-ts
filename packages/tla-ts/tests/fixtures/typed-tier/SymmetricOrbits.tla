---- MODULE SymmetricOrbits ----
EXTENDS Naturals, TLC
CONSTANTS Procs, Values
VARIABLES holds, count

Symmetry == Permutations(Procs) \cup Permutations(Values)

Init == holds = [p \in Procs |-> {}] /\ count = [p \in Procs |-> 0]

Take == \E p \in Procs, v \in Values :
  /\ holds' = [holds EXCEPT ![p] = @ \cup {v}]
  /\ count' = [count EXCEPT ![p] = (@ + 1) % 3]

Drop == \E p \in Procs : \E v \in holds[p] :
  /\ holds' = [holds EXCEPT ![p] = @ \ {v}]
  /\ UNCHANGED count

Next == Take \/ Drop
====

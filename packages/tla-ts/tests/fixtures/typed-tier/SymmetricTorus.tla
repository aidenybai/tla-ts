---- MODULE SymmetricTorus ----
EXTENDS Naturals, TLC
CONSTANTS Procs
VARIABLES count, last
Perms == Permutations(Procs)
Init == count = [p \in Procs |-> 0] /\ last = [who |-> CHOOSE p \in Procs : TRUE, at |-> 0]
Next ==
  \E p \in Procs :
    /\ count' = [count EXCEPT ![p] = (@ + 1) % 40]
    /\ last' = [who |-> p, at |-> count[p]]
====

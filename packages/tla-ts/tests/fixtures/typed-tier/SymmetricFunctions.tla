---- MODULE SymmetricFunctions ----
EXTENDS TLC
CONSTANTS Procs
VARIABLES seen, by
Perms == Permutations(Procs)
Init ==
  /\ seen = [p \in Procs |-> {}]
  /\ by = [p \in Procs |-> p]
Next ==
  \E p, q \in Procs :
    /\ q \notin seen[p]
    /\ seen' = [seen EXCEPT ![p] = seen[p] \cup {q}]
    /\ by' = [by EXCEPT ![q] = p]
====

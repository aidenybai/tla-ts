---- MODULE SymmetricDeadlock ----
EXTENDS Naturals, TLC
CONSTANTS A, B, C
VARIABLES holder, waiting
Procs == {A, B, C}
Swaps == Permutations(Procs)
Init == holder = [p \in Procs |-> 0] /\ waiting = {}
Take(p) ==
  /\ holder[p] < 2
  /\ \A q \in Procs \ {p} : holder[q] < 2
  /\ holder' = [holder EXCEPT ![p] = @ + 1]
  /\ waiting' = waiting \ {p}
Wait(p) ==
  /\ p \notin waiting
  /\ holder[p] > 0
  /\ waiting' = waiting \cup {p}
  /\ UNCHANGED holder
Next == \E p \in Procs : Take(p) \/ Wait(p)
====

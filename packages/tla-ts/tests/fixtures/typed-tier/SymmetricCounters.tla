---- MODULE SymmetricCounters ----
EXTENDS Naturals, TLC
CONSTANTS Procs
VARIABLES sent, msgs
Perms == Permutations(Procs)
Init ==
  /\ sent = [p \in Procs |-> 0]
  /\ msgs = {}
Next ==
  \E p, q \in Procs :
    /\ sent[p] < 2
    /\ sent' = [sent EXCEPT ![p] = @ + 1]
    /\ msgs' = msgs \cup {[from |-> p, to |-> q, round |-> sent[p]]}
====

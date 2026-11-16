---- MODULE SymmetricProcesses ----
EXTENDS Naturals, Sequences, TLC
CONSTANTS Procs
VARIABLES pc, waiting, last, log
Perms == Permutations(Procs)
Init ==
  /\ pc = [p \in Procs |-> 0]
  /\ waiting = {}
  /\ last = [who |-> CHOOSE p \in Procs : TRUE, step |-> 0]
  /\ log = << >>
Next ==
  \E p \in Procs :
    \/ /\ pc[p] = 0
       /\ pc' = [pc EXCEPT ![p] = 1]
       /\ waiting' = waiting \cup {p}
       /\ UNCHANGED <<last, log>>
    \/ /\ pc[p] = 1
       /\ \A q \in waiting : q = p \/ pc[q] # 2
       /\ pc' = [pc EXCEPT ![p] = 2]
       /\ waiting' = waiting \ {p}
       /\ last' = [who |-> p, step |-> last.step + 1]
       /\ log' = IF Len(log) < 2 THEN Append(log, p) ELSE log
    \/ /\ pc[p] = 2
       /\ pc' = [pc EXCEPT ![p] = 0]
       /\ UNCHANGED <<waiting, last, log>>
Bounded == last.step < 4
====

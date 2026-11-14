---- MODULE StarvedProcesses ----
EXTENDS Naturals

CONSTANT Procs

VARIABLES pc

Init == pc = [p \in Procs |-> "idle"]

Start(p) ==
  /\ pc[p] = "idle"
  /\ pc' = [pc EXCEPT ![p] = "busy"]

Finish(p) ==
  /\ pc[p] = "busy"
  /\ pc' = [pc EXCEPT ![p] = "done"]

Next == \E p \in Procs : Start(p) \/ Finish(p)

Spec == Init /\ [][Next]_pc /\ WF_pc(\E p \in Procs : Start(p))

AllDone == \A p \in Procs : <>(pc[p] = "done")
====

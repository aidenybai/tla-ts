---- MODULE FairProcesses ----
EXTENDS Naturals, FiniteSets

CONSTANT Procs

VARIABLES pc, count

vars == <<pc, count>>

Init == pc = [p \in Procs |-> "idle"] /\ count = 0

Start(p) ==
  /\ pc[p] = "idle"
  /\ pc' = [pc EXCEPT ![p] = "busy"]
  /\ count' = count + 1

Finish(p) ==
  /\ pc[p] = "busy"
  /\ pc' = [pc EXCEPT ![p] = "done"]
  /\ UNCHANGED count

Next == \E p \in Procs : Start(p) \/ Finish(p)

Spec == Init /\ [][Next]_vars /\ \A p \in Procs : WF_vars(Start(p) \/ Finish(p))

AllDone == \A p \in Procs : <>(pc[p] = "done")

Stays == <>[](count = Cardinality(Procs))

Enabled == []<>(\A p \in Procs : ~ENABLED Start(p))
====

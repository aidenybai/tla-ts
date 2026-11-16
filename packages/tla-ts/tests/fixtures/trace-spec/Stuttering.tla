---- MODULE Stuttering ----
EXTENDS Naturals
CONSTANT Procs
VARIABLES pc, count
Init == pc = [p \in Procs |-> "idle"] /\ count = 0
Next == \E p \in Procs : pc[p] = "idle" /\ pc' = [pc EXCEPT ![p] = "done"] /\ count' = count + 1
Spec == Init /\ [][Next]_<<pc, count>>
Done == <>(count = 2)
====

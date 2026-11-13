---- MODULE StringFields ----
EXTENDS Naturals
VARIABLES jobs
Init == jobs = [job \in 1..2 |-> [state |-> "idle", runs |-> 0, limit |-> job]]
Next ==
  \E job \in 1..2 :
    \/ /\ jobs[job]["state"] = "idle"
       /\ jobs[job]["runs"] < jobs[job]["limit"]
       /\ jobs' = [jobs EXCEPT ![job]["state"] = "busy", ![job]["runs"] = @ + 1]
    \/ /\ jobs[job]["state"] = "busy"
       /\ jobs' = [jobs EXCEPT ![job]["state"] = "idle", ![job]["limit"] = @ + jobs[3 - job]["runs"]]
Small == \A job \in 1..2 : jobs[job]["limit"] <= 3
Bounded == \A job \in 1..2 : jobs[job]["runs"] <= 4
====

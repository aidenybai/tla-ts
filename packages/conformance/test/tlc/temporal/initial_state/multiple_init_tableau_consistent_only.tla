(*---
description: 'Only tableau nodes consistent with the initial state form initial graph nodes.'
ref: tlc2/tool/liveness/LiveCheck.java#addInitState
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE multiple_init_tableau_consistent_only ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x \in {5, 0} /\ [][Next \/ UNCHANGED x]_x /\ WF_x(Next)
Prop == (x = 0 /\ <>(x = 1)) \/ (x = 5 /\ <>(x = 5))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 16 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 8.7E-19
    2199:0 8 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

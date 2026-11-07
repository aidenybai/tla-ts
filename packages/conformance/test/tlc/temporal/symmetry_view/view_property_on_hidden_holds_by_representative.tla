(*---
description: 'A property true only for a hidden-state value not explored holds or fails on the explored representative.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness, view]
outcome: success
config: |
  SPECIFICATION Spec
  VIEW Vw
  PROPERTY Prop
---*)
---- MODULE view_property_on_hidden_holds_by_representative ----
EXTENDS Naturals
VARIABLES x, h
Next == x' = (x + 1) % 2 /\ h' = (h + 1) % 3
Spec == x = 0 /\ h = 0 /\ [][Next]_<<x, h>> /\ WF_<<x, h>>(Next)
Vw == x
Prop == []<>(h = 0)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

(*---
description: 'A constant VIEW collapses the graph to one state, but the tableau is matched against the real successor, which contradicts []~P, so only a stutter edge exists, and WF excludes it: success.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness, view]
outcome: success
config: |
  SPECIFICATION Spec
  VIEW Vw
  PROPERTY Prop
---*)
---- MODULE view_constant_collapses_all ----
EXTENDS Naturals
VARIABLES x, h
Next == x' = (x + 1) % 2 /\ h' = (h + 1) % 3
Spec == x = 0 /\ h = 0 /\ [][Next]_<<x, h>> /\ WF_<<x, h>>(Next)
Vw == 0
Prop == <>(x = 1)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 1 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

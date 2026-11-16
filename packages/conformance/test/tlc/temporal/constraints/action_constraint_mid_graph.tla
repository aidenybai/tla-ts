(*---
description: 'An action constraint removing one edge of a cycle removes the cycle from the graph as well.'
ref: tlc2/tool/ModelChecker.java#doNext
features: [liveness, constraint]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ACTION_CONSTRAINT Ac
---*)
---- MODULE action_constraint_mid_graph ----
EXTENDS Naturals
VARIABLE x
Next == x' = 1 - x
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Ac == x' = 1
Prop == <>[](x = 1)
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

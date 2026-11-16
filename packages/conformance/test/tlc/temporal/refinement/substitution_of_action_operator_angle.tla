(*---
description: 'An operator constant replaced by a definition is usable inside an angle action.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness, refinement]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE substitution_of_action_operator_angle ----
EXTENDS Naturals
VARIABLE x
---- MODULE Ops ----
EXTENDS Naturals
VARIABLE v
CONSTANT Same(_)
Goal == Same(v) = v
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
Id(a) == a
O == INSTANCE Ops WITH v <- x, Same <- Id
Prop == <>[](O!Goal)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

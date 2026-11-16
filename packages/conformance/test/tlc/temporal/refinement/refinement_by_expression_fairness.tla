(*---
description: 'Fairness under a substitution of an expression: ENABLED computes the primed mapping from the successor it enumerates, and the check passes.'
ref: tlc2/tool/impl/Tool.java#enabled
features: [liveness, refinement]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE refinement_by_expression_fairness ----
EXTENDS Naturals
VARIABLE x

---- MODULE Abs ----
EXTENDS Naturals
VARIABLE v
AInit == v = 0
ANext == v < 2 /\ v' = v + 1
ASpec == AInit /\ [][ANext]_v
ALive == ASpec /\ WF_v(ANext)
====
N == x < 4 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
A == INSTANCE Abs WITH v <- x \div 2

Prop == A!ALive
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 5 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 5 states generated, 5 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 5.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

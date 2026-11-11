(*---
description: An operator parameter bound to x and primed in the body assigns x'.
ref: tlc2/tool/impl/Spec.java#getPrimedVar
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE operator_parameter_primed_in_body ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Op(p) == p' = 1
Next == Op(x) /\ PrintT(x')
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

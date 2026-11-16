(*---
description: "A variable may be replaced by a constant expression, which then cannot change."
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [variables]
config: |
  INIT Init
  NEXT Next
outcome: success
---*)
---- MODULE constant_expression_for_variable ----
---- MODULE I ----
VARIABLE v
Same == v' = v
====
VARIABLE x
M == INSTANCE I WITH v <- 1
Init == x = 0
Next == M!Same /\ x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

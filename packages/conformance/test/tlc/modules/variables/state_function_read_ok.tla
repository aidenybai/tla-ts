(*---
description: A state-level definition reads the replaced variable in an invariant.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [variables]
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
outcome: success
---*)
---- MODULE state_function_read_ok ----
EXTENDS Naturals
---- MODULE Counter ----
EXTENDS Naturals
VARIABLE v
Init0 == v = 0
Step == v' = (v + 1) % 3
Pos == v >= 0
Double == 2 * v
====
VARIABLE x
M == INSTANCE Counter WITH v <- x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == M!Double < 5
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

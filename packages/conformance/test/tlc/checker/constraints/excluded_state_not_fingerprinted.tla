(*---
description: An excluded state isn't recorded, so it's checked each time it's generated, and the invariant's PrintT runs twice.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTRAINT Con
---*)
---- MODULE excluded_state_not_fingerprinted ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 1}
Next == x' = 2
Con == x < 2
Inv == PrintT(x)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 0
    | 1
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    | 2
    | 2
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

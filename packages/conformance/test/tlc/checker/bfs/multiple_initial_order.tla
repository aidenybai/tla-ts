(*---
description: Initial states are dequeued in the order they were generated, before any successor.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE multiple_initial_order ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {2, 1}
Next == PrintT(x) /\ x' = IF x < 3 THEN x + 2 ELSE x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    | 1
    | 2
    | 3
    | 4
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.3E-19
    2199:0 6 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

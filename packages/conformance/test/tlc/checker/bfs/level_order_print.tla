(*---
description: States are dequeued in FIFO order, so an action's PrintT shows breadth-first order.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE level_order_print ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1
Next == PrintT(x) /\ x' \in {IF x < 4 THEN 2 * x ELSE x, IF x < 4 THEN 2 * x + 1 ELSE x}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.5E-18
    2199:0 11 states generated, 7 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)

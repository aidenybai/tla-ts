(*---
description: Successors of one state enqueue in action order, then element order within an action.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE successors_enqueue_in_action_order ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x = 0 /\ x' \in {3, 1}
B == x = 0 /\ x' = 2
Next == (PrintT(x) /\ x' = x /\ x > 0) \/ A \/ B
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 0
    | 1
    | 3
    | 2
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 6.5E-19
    2199:0 7 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 3 and the 95th percentile is 3).
---*)

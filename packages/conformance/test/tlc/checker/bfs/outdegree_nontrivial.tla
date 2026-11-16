(*---
description: The final outdegree line reports average, minimum, maximum and 95th percentile computed from distinct successor counts.
ref: tlc2/tool/AbstractChecker.java#printSummary
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE outdegree_nontrivial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == \/ x = 0 /\ x' \in 1..5
        \/ x > 0 /\ x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-18
    2199:0 11 states generated, 6 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 5 and the 95th percentile is 5).
---*)

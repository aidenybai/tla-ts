(*---
description: Each action's successors count as generated even if already seen, so generated exceeds distinct.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE branching_counts ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in {(x + 1) % 4, (x + 2) % 4}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-18
    2199:0 9 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)

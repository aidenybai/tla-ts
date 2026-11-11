(*---
description: "x \\in {v \\in S: P} enumerates the source set in its order and keeps the elements that satisfy P."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_set_filter ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \in {v \in 1..4 : v % 2 = 0} /\ PrintT(x)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 2
    | 4
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

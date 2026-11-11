(*---
description: x \in S \X T enumerates tuples in SetOfTuplesValue's order, with the last component varying fastest.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_cartesian_product ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \in {1, 2} \X {3, 4} /\ PrintT(x)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 3>>
    | <<1, 4>>
    | <<2, 3>>
    2269:0 Computed 2 initial states...
    | <<2, 4>>
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 8.7E-19
    2199:0 8 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

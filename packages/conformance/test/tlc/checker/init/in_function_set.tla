(*---
description: x \in [S -> T] enumerates functions in SetOfFcnsValue's order.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_function_set ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \in [{1, 2} -> {0, 1}] /\ PrintT(x)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<0, 0>>
    | <<0, 1>>
    | <<1, 0>>
    2269:0 Computed 2 initial states...
    | <<1, 1>>
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 8.7E-19
    2199:0 8 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

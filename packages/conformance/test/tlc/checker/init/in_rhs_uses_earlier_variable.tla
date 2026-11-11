(*---
description: The right side of x \in S can use a variable that an earlier conjunct assigned.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_rhs_uses_earlier_variable ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == y \in 1..2 /\ x \in 1..y /\ PrintT(<<y, x>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 1>>
    | <<2, 1>>
    | <<2, 2>>
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 3 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.9E-19
    2199:0 6 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

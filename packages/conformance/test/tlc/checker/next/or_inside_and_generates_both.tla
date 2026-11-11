(*---
description: A disjunction inside a conjunction generates a state for each disjunct, in order.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_lor
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE or_inside_and_generates_both ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == (x' = 2 \/ x' = 1) /\ y' = x' /\ PrintT(<<x', y'>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<2, 2>>
    | <<1, 1>>
    | <<2, 2>>
    | <<1, 1>>
    | <<2, 2>>
    | <<1, 1>>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 6.5E-19
    2199:0 7 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)

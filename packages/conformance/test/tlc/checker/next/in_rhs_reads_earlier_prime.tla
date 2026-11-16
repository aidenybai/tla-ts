(*---
description: The right side of x' \in S can read earlier primed variables.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_in
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_rhs_reads_earlier_prime ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == y' \in 1..2 /\ x' \in 1..y' /\ PrintT(<<x', y'>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<1, 1>>
    | <<1, 2>>
    | <<2, 2>>
    | <<1, 1>>
    | <<1, 2>>
    | <<2, 2>>
    | <<1, 1>>
    | <<1, 2>>
    | <<2, 2>>
    | <<1, 1>>
    | <<1, 2>>
    | <<2, 2>>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.0E-18
    2199:0 13 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 3 and the 95th percentile is 3).
---*)

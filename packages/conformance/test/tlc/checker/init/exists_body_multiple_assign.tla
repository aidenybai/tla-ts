(*---
description: Each witness runs the rest of the conjunction, including a later assignment.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_be
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_body_multiple_assign ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == (\E v \in 1..2 : x = v) /\ y = x + 1 /\ PrintT(<<x, y>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 2>>
    | <<2, 3>>
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

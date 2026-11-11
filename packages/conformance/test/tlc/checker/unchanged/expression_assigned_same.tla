(*---
description: UNCHANGED of an expression compares after x' is assigned, keeping an equal value.
ref: tlc2/tool/impl/Tool.java#verifyUnchanged
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE expression_assigned_same ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in {x, (x + 1) % 2} /\ UNCHANGED (x % 1) /\ PrintT(x')
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 0
    | 1
    | 0
    | 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
    2199:0 5 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

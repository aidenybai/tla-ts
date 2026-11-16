(*---
description: A record and a function over the same string domain are one state.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE record_vs_function ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = [a |-> 1, b |-> 2]
Next == x' = [k \in {"a", "b"} |-> IF k = "a" THEN 1 ELSE 2] /\ PrintT(x')
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [a |-> 1, b |-> 2]
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

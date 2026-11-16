(*---
description: TLCGet("spec").actions lists each split action with its name.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE spec_actions ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x' = x
B == x' = x
Next == A \/ B
Inv == PrintT({a.name : a \in TLCGet("spec").actions})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | {"A", "B"}
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

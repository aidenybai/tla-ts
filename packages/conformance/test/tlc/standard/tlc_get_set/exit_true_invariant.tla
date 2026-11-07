(*---
description: TLCSet("exit", TRUE) in an invariant stops once the workers notice the flag.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exit_true_invariant ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT(x) /\ TLCSet("exit", x = 1)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 0
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)

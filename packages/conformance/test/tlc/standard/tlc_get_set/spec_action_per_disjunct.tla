(*---
description: Each disjunct of Next is an action in TLCGet("spec").actions.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE spec_action_per_disjunct ----
EXTENDS TLC, Naturals
VARIABLE x
Init == x = 0
A == x' = 1
B == x' = 2
Next == (x = 0 /\ (A \/ B)) \/ (x > 0 /\ UNCHANGED x)
Post == PrintT({a.name : a \in TLCGet("spec").actions})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | {"Next"}
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)

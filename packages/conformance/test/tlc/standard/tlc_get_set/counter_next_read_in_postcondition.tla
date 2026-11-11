(*---
description: A counter updated in Next by a worker is read in POSTCONDITION through register 0's main-checker lookup.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
  CHECK_DEADLOCK FALSE
---*)
---- MODULE counter_next_read_in_postcondition ----
EXTENDS TLC, Naturals
VARIABLE x
ASSUME TLCSet(1, 0)
Init == x = 0
Next == /\ x < 2
        /\ x' = x + 1
        /\ TLCSet(1, TLCGet(1) + 1)
Post == PrintT(TLCGet(1))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 2
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

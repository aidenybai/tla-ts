(*---
description: TLCSet("exit", TRUE) stops the run with success and the counts at that point.
ref: tlc2/module/TLCGetSet.java#TLCSet
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exit_stops ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ TLCSet("exit", x = 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 4 states generated, 4 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)

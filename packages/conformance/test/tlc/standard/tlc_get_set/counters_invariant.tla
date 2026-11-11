(*---
description: The named counters at each invariant evaluation, for one worker.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE counters_invariant ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT([distinct |-> TLCGet("distinct"), queue |-> TLCGet("queue"), generated |-> TLCGet("generated"), diameter |-> TLCGet("diameter")])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [distinct |-> 1, queue |-> 1, generated |-> 1, diameter |-> 1]
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [distinct |-> 2, queue |-> 0, generated |-> 2, diameter |-> 2]
    | [distinct |-> 3, queue |-> 0, generated |-> 3, diameter |-> 3]
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

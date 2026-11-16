(*---
description: TLCGet("stats") fields during BFS. Duration is left out since it depends on the clock.
ref: tlc2/tool/AbstractChecker.java#getStatistics
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE stats_invariant ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT(LET s == TLCGet("stats") IN [q |-> s.queue, d |-> s.distinct, i |-> s.initial, g |-> s.generated, m |-> s.diameter, w |-> s.worker])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [q |-> 1, d |-> 1, i |-> 1, g |-> 1, m |-> 1, w |-> 0]
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [q |-> 0, d |-> 2, i |-> 1, g |-> 2, m |-> 2, w |-> 0]
    | [q |-> 0, d |-> 3, i |-> 1, g |-> 3, m |-> 3, w |-> 0]
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

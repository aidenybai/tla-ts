(*---
description: "In BFS, TLCDefer's expression is not run: the checker ignores the callable."
ref: tlc2/module/TLCExt.java#tlcDefer
features:
  - TLCExt
outcome: success
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK FALSE
---*)
---- MODULE defer_bfs_never_runs ----
EXTENDS TLCExt, TLC, Naturals
VARIABLE x
Init == x = 0
Next == /\ x < 2
        /\ x' = x + 1
        /\ TLCDefer(PrintT("deferred"))
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
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

(*---
description: A state-level expression is cached per state.
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE cache_state_level ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == TLCCache(Print(x, x), 0) = x /\ TLCCache(Print(x, x), 0) = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 0  0
    | 0  0
    | 0  0
    | 0  0
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1  1
    | 1  1
    | 1  1
    | 1  1
    | 2  2
    | 2  2
    | 2  2
    | 2  2
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

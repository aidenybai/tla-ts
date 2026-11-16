(*---
description: A LET definition reading x' is reevaluated per branch, so a value from one action isn't reused for the next.
ref: tlc2/value/impl/LazyValue.java#getCachedValue
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE primed_value_in_cache_free_let ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == LET v == x' IN \/ (x' = 1 /\ PrintT(v))
                       \/ (x' = 2 /\ PrintT(v))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 2
    | 1
    | 2
    | 1
    | 2
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 6.5E-19
    2199:0 7 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)

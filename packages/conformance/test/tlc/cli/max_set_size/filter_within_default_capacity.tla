(*---
description: A filter's ValueVec starts with capacity 10, and the bound is checked only on growth, so 10 elements pass a bound of 5.
ref: tlc2/value/impl/ValueVec.java#ensureCapacity
outcome: success
config: ""
args:
  - -maxSetSize
  - "5"
---*)
---- MODULE filter_within_default_capacity ----
EXTENDS Naturals, TLC, FiniteSets
ASSUME PrintT(Cardinality({e \in 1..10 : TRUE}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 10
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

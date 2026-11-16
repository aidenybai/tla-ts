(*---
description: An untyped model value may share a set with an integer, because its comparison with a non-model value doesn't fail.
ref: tlc2/value/impl/ModelValue.java#modelValueCompareTo
outcome: success
config: |
  CONSTANTS
  A = a
  S = {a, 1}
---*)
---- MODULE mixed_set_with_int ----
CONSTANTS A, S
ASSUME 1 \in S /\ A \in S
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

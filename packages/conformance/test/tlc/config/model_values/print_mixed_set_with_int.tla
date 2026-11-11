(*---
description: A set mixing an integer with a model value prints in the order that the mixed comparison gives.
ref: tlc2/value/impl/IntValue.java#compareTo
outcome: success
config: |
  CONSTANT S = {z, 1}
---*)
---- MODULE print_mixed_set_with_int ----
EXTENDS TLC
CONSTANT S
ASSUME PrintT(S)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | {z, 1}
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

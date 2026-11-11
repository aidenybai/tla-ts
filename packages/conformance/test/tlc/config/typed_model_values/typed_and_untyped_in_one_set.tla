(*---
description: Typed and untyped model values may be sorted together by name.
ref: tlc2/value/impl/ModelValue.java#compareTo
outcome: success
config: |
  CONSTANT S = {x_b, y, a}
---*)
---- MODULE typed_and_untyped_in_one_set ----
EXTENDS TLC
CONSTANT S
ASSUME PrintT(S)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | {x_b, y, a}
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

(*---
description: SpecProcessor looks up only declared names, so assigning a name the spec doesn't have is silently ignored, unlike an override.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: success
config: |
  CONSTANT Nope = 5
---*)
---- MODULE assign_undefined_name_ignored ----
ASSUME TRUE
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

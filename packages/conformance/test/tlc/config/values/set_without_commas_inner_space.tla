(*---
description: Elements need no spaces around the commas.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: success
config: |
  CONSTANT N = {1,2,3}
---*)
---- MODULE set_without_commas_inner_space ----
CONSTANT N
ASSUME N = {1, 2, 3}
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

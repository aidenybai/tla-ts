(*---
description: Model checking collects initial states through a functor, not a StateVec, so the bound doesn't limit them.
ref: tlc2/tool/ModelChecker.java#doInit
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -maxSetSize
  - "2"
---*)
---- MODULE model_check_initial_states_ignore_bound ----
EXTENDS Naturals
VARIABLE x
Init == x \in 1..9
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2190:0 Finished computing initial states: 9 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.4E-18
    2199:0 18 states generated, 9 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

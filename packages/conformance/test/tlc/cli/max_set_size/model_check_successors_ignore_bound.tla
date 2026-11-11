(*---
description: Model checking takes successors through a functor too, so a state may have more than the bound.
ref: tlc2/tool/Worker.java#run
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -maxSetSize
  - "2"
---*)
---- MODULE model_check_successors_ignore_bound ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' \in 1..9
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.4E-17
    2199:0 91 states generated, 10 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 9 and the 95th percentile is 9).
---*)

(*---
description: With -coverage, TLCGet("spec") adds coverage counts to the actions.
ref: tlc2/module/TLCGetSet.java#action2Value
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
args:
  - -coverage
  - "1"
---*)
---- MODULE spec_with_coverage ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == PrintT({a.coverage : a \in TLCGet("spec").actions})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | {[generated |-> 3, distinct |-> 2]}
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 17, col 10 to line 17, col 10 of module spec_with_coverage>: 2
    2773:0 <Init line 18, col 1 to line 18, col 4 of module spec_with_coverage>: 1:1
    2221:0   line 18, col 9 to line 18, col 13 of module spec_with_coverage: 1
    2772:0 <Next line 19, col 1 to line 19, col 4 of module spec_with_coverage>: 2:3
    2221:0   line 19, col 9 to line 19, col 24 of module spec_with_coverage: 3
    2202:0 End of statistics.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

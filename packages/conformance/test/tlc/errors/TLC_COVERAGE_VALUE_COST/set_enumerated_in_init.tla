(*---
description: Enumerating a set in Init adds a line with its cost to the report.
ref: tlc2/tool/coverage/OpApplNodeWrapper.java#printSelf
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -coverage
  - "1"
---*)
---- MODULE set_enumerated_in_init ----
VARIABLE x
Init == x \in {0, 1}
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 13, col 10 to line 13, col 10 of module set_enumerated_in_init>: 0
    2773:0 <Init line 14, col 1 to line 14, col 4 of module set_enumerated_in_init>: 2:2
    2221:0   line 14, col 9 to line 14, col 20 of module set_enumerated_in_init: 2
    2775:0   |line 14, col 15 to line 14, col 20 of module set_enumerated_in_init: 1:3
    2772:0 <Next line 15, col 1 to line 15, col 4 of module set_enumerated_in_init>: 0:2
    2221:0   line 15, col 9 to line 15, col 14 of module set_enumerated_in_init: 2
    2202:0 End of statistics.
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

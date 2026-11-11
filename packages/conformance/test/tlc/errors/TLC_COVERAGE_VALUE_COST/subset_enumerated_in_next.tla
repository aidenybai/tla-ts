(*---
description: A nested set's enumeration in Next is reported through this message too.
ref: tlc2/tool/coverage/OpApplNodeWrapper.java#printSelf
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -coverage
  - "1"
---*)
---- MODULE subset_enumerated_in_next ----
EXTENDS Naturals, FiniteSets
VARIABLE x
Init == x = 0
Next == x' = Cardinality({e \in SUBSET {1, 2} : TRUE}) - 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 14, col 10 to line 14, col 10 of module subset_enumerated_in_next>: 0
    2773:0 <Init line 15, col 1 to line 15, col 4 of module subset_enumerated_in_next>: 1:1
    2221:0   line 15, col 9 to line 15, col 13 of module subset_enumerated_in_next: 1
    2772:0 <Next line 16, col 1 to line 16, col 4 of module subset_enumerated_in_next>: 0:1
    2221:0   line 16, col 9 to line 16, col 58 of module subset_enumerated_in_next: 1
    2221:0   |line 16, col 14 to line 16, col 58 of module subset_enumerated_in_next: 1
    2221:0   ||line 16, col 14 to line 16, col 54 of module subset_enumerated_in_next: 1
    2775:0   |||line 16, col 26 to line 16, col 53 of module subset_enumerated_in_next: 1:8
    2221:0   ||||line 16, col 49 to line 16, col 52 of module subset_enumerated_in_next: 4
    2221:0   ||||line 16, col 33 to line 16, col 45 of module subset_enumerated_in_next: 1
    2202:0 End of statistics.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

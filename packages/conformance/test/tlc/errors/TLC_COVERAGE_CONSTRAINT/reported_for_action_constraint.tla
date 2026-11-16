(*---
description: An ACTION_CONSTRAINT appears in the report through this message.
ref: tlc2/tool/coverage/CostModelCreator.java
outcome: success
config: |
  SPECIFICATION Spec
  ACTION_CONSTRAINT Con
args:
  - -coverage
  - "1"
---*)
---- MODULE reported_for_action_constraint ----
EXTENDS Naturals
VARIABLE x
Init == x \in {0, 1}
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Con == x' < 5
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
    2779:0 <x line 14, col 10 to line 14, col 10 of module reported_for_action_constraint>: 0
    2773:0 <Init line 15, col 1 to line 15, col 4 of module reported_for_action_constraint>: 2:2
    2221:0   line 15, col 9 to line 15, col 20 of module reported_for_action_constraint: 2
    2775:0   |line 15, col 15 to line 15, col 20 of module reported_for_action_constraint: 1:3
    2772:0 <Next line 16, col 1 to line 16, col 4 of module reported_for_action_constraint>: 0:2
    2221:0   line 16, col 9 to line 16, col 24 of module reported_for_action_constraint: 2
    2778:0 <Con line 18, col 1 to line 18, col 3 of module reported_for_action_constraint>: 2:2
    2221:0   line 18, col 8 to line 18, col 13 of module reported_for_action_constraint: 2
    2202:0 End of statistics.
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

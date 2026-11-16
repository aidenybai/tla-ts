(*---
description: Each variable has a line in the report.
ref: tlc2/tool/coverage/CostModelCreator.java
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -coverage
  - "1"
---*)
---- MODULE one_line_per_variable ----
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == UNCHANGED <<x, y>>
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
    2779:0 <x line 13, col 11 to line 13, col 11 of module one_line_per_variable>: 0
    2779:0 <y line 13, col 14 to line 13, col 14 of module one_line_per_variable>: 0
    2773:0 <Init line 14, col 1 to line 14, col 4 of module one_line_per_variable>: 1:1
    2221:0   line 14, col 9 to line 14, col 22 of module one_line_per_variable: 1
    2772:0 <Next line 15, col 1 to line 15, col 4 of module one_line_per_variable>: 0:1
    2221:0   line 15, col 9 to line 15, col 26 of module one_line_per_variable: 1
    2202:0 End of statistics.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

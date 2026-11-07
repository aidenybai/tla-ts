(*---
description: -coverage prints the coverage report once at the end, with counts per location.
ref: tlc2/tool/ModelChecker.java#doPeriodicWork
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTRAINT C
  ACTION_CONSTRAINT AC
args:
  - -coverage
  - "1"
---*)
---- MODULE final_report ----
EXTENDS Naturals
VARIABLE x
Init == x \in {0, 1}
A == x < 3 /\ x' = x + 1
B == x = 3 /\ x' = 0
Next == A \/ B
C == x < 9
AC == x' < 9
Inv == x < 9
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.3E-19
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 17, col 10 to line 17, col 10 of module final_report>: 2
    2773:0 <Init line 18, col 1 to line 18, col 4 of module final_report>: 2:2
    2221:0   line 18, col 9 to line 18, col 20 of module final_report: 2
    2775:0   |line 18, col 15 to line 18, col 20 of module final_report: 1:3
    2772:0 <A line 19, col 1 to line 19, col 1 of module final_report>: 2:3
    2221:0   line 19, col 6 to line 19, col 10 of module final_report: 3
    2221:0   |line 19, col 6 to line 19, col 6 of module final_report: 4
    2221:0   line 19, col 15 to line 19, col 24 of module final_report: 3
    2772:0 <B line 20, col 1 to line 20, col 1 of module final_report>: 0:1
    2221:0   line 20, col 6 to line 20, col 10 of module final_report: 5
    2221:0   |line 20, col 6 to line 20, col 6 of module final_report: 4
    2221:0   line 20, col 15 to line 20, col 20 of module final_report: 1
    2774:0 <Inv line 24, col 1 to line 24, col 3 of module final_report>
    2221:0   line 24, col 8 to line 24, col 12 of module final_report: 4
    2778:0 <AC line 23, col 1 to line 23, col 2 of module final_report>: 4:4
    2221:0   line 23, col 7 to line 23, col 12 of module final_report: 4
    2778:0 <C line 22, col 1 to line 22, col 1 of module final_report>: 6:6
    2221:0   line 22, col 6 to line 22, col 10 of module final_report: 6
    2202:0 End of statistics.
    2199:0 6 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

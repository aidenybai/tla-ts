(*---
description: A violation ends the run before the final coverage report's success path, and the transcript pins what is still printed.
ref: tlc2/tool/ModelChecker.java#modelCheck
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -coverage
  - "1"
---*)
---- MODULE with_violation ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 24 of module with_violation>
    x = 1
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 15, col 10 to line 15, col 10 of module with_violation>: 0
    2773:0 <Init line 16, col 1 to line 16, col 4 of module with_violation>: 2:2
    2221:0   line 16, col 9 to line 16, col 13 of module with_violation: 2
    2772:0 <Next line 17, col 1 to line 17, col 4 of module with_violation>: 1:3
    2221:0   line 17, col 9 to line 17, col 24 of module with_violation: 2
    2221:0   |line 17, col 14 to line 17, col 24 of module with_violation: 3
    2774:0 <Inv line 18, col 1 to line 18, col 3 of module with_violation>
    2221:0   line 18, col 8 to line 18, col 12 of module with_violation: 2
    2202:0 End of statistics.
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

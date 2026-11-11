(*---
description: An error in a constraint on a successor prints the behavior ending with that successor.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE error_prints_last_good_state_constraint ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con == 1 \div (2 - x) >= 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module error_prints_last_good_state_constraint>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 18 of module error_prints_last_good_state_constraint>
    x = 2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 8 to line 15, column 26 in error_prints_last_good_state_constraint
    1. Line 15, column 8 to line 15, column 21 in error_prints_last_good_state_constraint
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

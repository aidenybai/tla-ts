(*---
description: An evaluation error in a later step prints the whole behavior up to the failing state.
ref: tlc2/tool/ModelChecker.java#doNextFailed
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_in_guard_later_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == 1 \div (2 - x) >= 0 /\ x' = x + 1
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
    2217:4 2: <Next line 13, col 9 to line 13, col 41 of module error_in_guard_later_state>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 41 of module error_in_guard_later_state>
    x = 2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 41 in error_in_guard_later_state
    1. Line 13, column 9 to line 13, column 27 in error_in_guard_later_state
    2. Line 13, column 9 to line 13, column 22 in error_in_guard_later_state
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

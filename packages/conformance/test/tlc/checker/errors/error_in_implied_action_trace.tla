(*---
description: An error in an implied action prints the behavior ending with the step's successor.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE error_in_implied_action_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Prop == [][1 \div (2 - x') >= 0]_x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2113:1 Evaluating action property Prop failed.
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module error_in_implied_action_trace>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 18 of module error_in_implied_action_trace>
    x = 2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 11 to line 15, column 34 in error_in_implied_action_trace
    1. Line 15, column 12 to line 15, column 31 in error_in_implied_action_trace
    2. Line 15, column 12 to line 15, column 26 in error_in_implied_action_trace
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

(*---
description: An evaluation error in an implied action reports the property name and the behavior.
ref: tlc2/tool/ModelChecker.java#doNextCheckImplied
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE implied_action_eval_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1
Next == x' = x - 1
Prop == [][1 \div x' > 0]_x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 1
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module implied_action_eval_error>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 11 to line 15, column 27 in implied_action_eval_error
    1. Line 15, column 12 to line 15, column 24 in implied_action_eval_error
    2. Line 15, column 12 to line 15, column 20 in implied_action_eval_error
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

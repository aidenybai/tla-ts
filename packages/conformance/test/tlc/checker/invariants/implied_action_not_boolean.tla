(*---
description: A non-Boolean implied action fails with the expected-value message.
ref: tlc2/tool/ModelChecker.java#doNextCheckImplied
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE implied_action_not_boolean ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1
Prop == [][x' + 1]_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2113:1 Evaluating action property Prop failed.
    Attempted to evaluate an expression of form [A]_e, but A was not a boolean.
    line 15, col 11 to line 15, col 20 of module implied_action_not_boolean
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 14 of module implied_action_not_boolean>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 11 to line 15, column 20 in implied_action_not_boolean
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

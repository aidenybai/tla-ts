(*---
description: 'A non-Boolean body fails with TLC_ACTION_PROPERTY_EVALUATION_FAILED, exit 75.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE body_non_boolean ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [][x']_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2113:1 Evaluating action property Prop failed.
    Attempted to evaluate an expression of form [A]_e, but A was not a boolean.
    line 16, col 11 to line 16, col 16 of module body_non_boolean
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module body_non_boolean>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 11 to line 16, column 16 in body_non_boolean
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

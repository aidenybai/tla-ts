(*---
description: A type error while checking an action property reports this message and the behavior so far, and exits 75.
ref: tlc2/tool/Worker.java#doNextCheckImplied
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE type_error_in_action_property ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Prop == [][x' = "a" \/ x = "a"]_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2113:1 Evaluating action property Prop failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 24 of module type_error_in_action_property>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 11 to line 15, column 33 in type_error_in_action_property
    1. Line 15, column 12 to line 15, column 30 in type_error_in_action_property
    2. Line 15, column 12 to line 15, column 19 in type_error_in_action_property
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

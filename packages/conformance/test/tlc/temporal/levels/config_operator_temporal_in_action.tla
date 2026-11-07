(*---
description: 'A constant operator replaced by a temporal definition escapes SANY when used in a box, and fails on evaluation.'
ref: tlc2/tool/impl/Tool.java#evalAppl
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- T
---*)
---- MODULE config_operator_temporal_in_action ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT Op(_)
T(a) == <>(x = 1)
Prop == [][Op(TRUE)]_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 9 to line 18, col 17 of module config_operator_temporal_in_action
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 9 to line 18, col 17 of module config_operator_temporal_in_action
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 27 of module config_operator_temporal_in_action>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 11 to line 19, column 22 in config_operator_temporal_in_action
    1. Line 19, column 12 to line 19, column 19 in config_operator_temporal_in_action
    2. Line 18, column 9 to line 18, column 17 in config_operator_temporal_in_action
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

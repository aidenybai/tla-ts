(*---
description: "Action composition in an implied action property fails as the action-property evaluation error, with the trace and evaluation-failure exit status."
ref: tlc2/tool/impl/Tool.java#evalAppl OPCODE_cdot
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE cdot_in_action_property ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1
A == x' = 1
B == x' = 2
Prop == [][A \cdot B]_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2113:1 Evaluating action property Prop failed.
    The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 14 of module cdot_in_action_property>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 11 to line 17, column 23 in cdot_in_action_property
    1. Line 17, column 12 to line 17, column 20 in cdot_in_action_property
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

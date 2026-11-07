(*---
description: <<A>>_x whose A leaves a variable unassigned reports the partial state after the subscript comparison fails to evaluate.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_aa
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE angle_action_unassigned ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == <<x' = 1>>_<<x, y>>
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 25 to line 13, col 25 of module angle_action_unassigned
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 25 to line 13, col 25 of module angle_action_unassigned
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 27 in angle_action_unassigned
    1. Line 13, column 11 to line 13, column 16 in angle_action_unassigned
    2. Line 13, column 20 to line 13, column 27 in angle_action_unassigned
    3. Line 13, column 25 to line 13, column 25 in angle_action_unassigned
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: WF_vars(a' = b') reads a next value that nothing assigned, which takes the generic path rather than this message.
ref: tlc2/tool/impl/Tool.java#evalImpl
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE next_of_unassigned_variable_read_in_action ----
VARIABLES a, b
vars == <<a, b>>
Init == a = 0 /\ b = 0
Next == UNCHANGED vars
Prop == <>(a = 9)
Spec == Init /\ [][Next]_vars /\ WF_vars(a' = b')
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 42 to line 15, column 48 in next_of_unassigned_variable_read_in_action
    1. Line 15, column 47 to line 15, column 48 in next_of_unassigned_variable_read_in_action
    2. Line 15, column 47 to line 15, column 47 in next_of_unassigned_variable_read_in_action
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier b is either undefined or not an operator.
    line 15, col 47 to line 15, col 47 of module next_of_unassigned_variable_read_in_action
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier b is either undefined or not an operator.
    line 15, col 47 to line 15, col 47 of module next_of_unassigned_variable_read_in_action
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ a = 0
    /\ b = 0
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

(*---
description: 'A subscript mentioning a variable the fair action does not set fails with TLC_STATE_NOT_COMPLETELY_SPECIFIED_LIVE, though Next sets it.'
ref: tlc2/tool/impl/Tool.java#evalAppl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE subscript_has_variable_action_ignores ----
EXTENDS Naturals
VARIABLES x, y
A == x < 2 /\ x' = x + 1
Next == A /\ y' = y
Spec == x = 0 /\ y = 0 /\ [][Next]_<<x, y>> /\ WF_<<x, y>>(A)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 60 to line 16, column 60 in subscript_has_variable_action_ignores
    1. Line 14, column 6 to line 14, column 24 in subscript_has_variable_action_ignores
    2. Line 14, column 6 to line 14, column 10 in subscript_has_variable_action_ignores
    3. Line 14, column 15 to line 14, column 24 in subscript_has_variable_action_ignores
    4. Line 16, column 51 to line 16, column 58 in subscript_has_variable_action_ignores
    5. Line 16, column 56 to line 16, column 56 in subscript_has_variable_action_ignores
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2148:0 @!@!@
    The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable y occurring in the state formula v.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2148:0 @!@!@
    The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable y occurring in the state formula v.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)

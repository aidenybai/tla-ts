(*---
description: WF_vars(A) compares vars across the step, so an A that leaves a variable in vars unassigned stops liveness with this message.
ref: tlc2/tool/impl/Tool.java#evalImpl
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE subscript_variable_not_assigned_by_action ----
EXTENDS Naturals
VARIABLES a, b
vars == <<a, b>>
Init == a = 0 /\ b = 0
Next == UNCHANGED vars
Prop == <>(a = 9)
A == a' = 42
Spec == Init /\ [][Next]_vars /\ WF_vars(A)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 42 to line 17, column 42 in subscript_variable_not_assigned_by_action
    1. Line 16, column 6 to line 16, column 12 in subscript_variable_not_assigned_by_action
    2. Line 17, column 37 to line 17, column 40 in subscript_variable_not_assigned_by_action
    3. Line 12, column 9 to line 12, column 16 in subscript_variable_not_assigned_by_action
    4. Line 12, column 14 to line 12, column 14 in subscript_variable_not_assigned_by_action
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2148:0 The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable b occurring in the state formula v.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ a = 0
    /\ b = 0
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

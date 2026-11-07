(*---
description: In the fast path a non-Boolean operator value reports the value and the conjunction.
ref: tlc2/tool/impl/Tool.java#getNextStatesAllAssigned
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE all_assigned_print_nonbool_value ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
C == 1
Next == x' = 1 /\ C
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
    : @!@!@STARTMSG 2247:0 @!@!@
    In computing next states, TLC expected a boolean expression,
    but instead found 1.
    line 14, col 19 to line 14, col 19 of module all_assigned_print_nonbool_value
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2247:0 @!@!@
    In computing next states, TLC expected a boolean expression,
    but instead found 1.
    line 14, col 19 to line 14, col 19 of module all_assigned_print_nonbool_value
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 19 in all_assigned_print_nonbool_value
    1. Line 14, column 9 to line 14, column 14 in all_assigned_print_nonbool_value
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

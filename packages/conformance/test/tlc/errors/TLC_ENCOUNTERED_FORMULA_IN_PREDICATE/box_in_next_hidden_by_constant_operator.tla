(*---
description: A constant operator replaced by a temporal formula gets a [] into Next past SANY, and evaluation reports it.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTANT C <- G
---*)
---- MODULE box_in_next_hidden_by_constant_operator ----
EXTENDS Naturals
CONSTANT C(_)
VARIABLE x
G(a) == [](x = 0)
Init == x = 0
Next == x' = x /\ C(1)
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
    : @!@!@STARTMSG 2261:0 @!@!@
    TLC encountered a temporal formula ([]A) when evaluating a predicate or action.
    line 14, col 9 to line 14, col 17 of module box_in_next_hidden_by_constant_operator
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2261:0 @!@!@
    TLC encountered a temporal formula ([]A) when evaluating a predicate or action.
    line 14, col 9 to line 14, col 17 of module box_in_next_hidden_by_constant_operator
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 22 in box_in_next_hidden_by_constant_operator
    1. Line 16, column 9 to line 16, column 14 in box_in_next_hidden_by_constant_operator
    2. Line 16, column 19 to line 16, column 22 in box_in_next_hidden_by_constant_operator
    3. Line 14, column 9 to line 14, column 17 in box_in_next_hidden_by_constant_operator
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

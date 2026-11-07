(*---
description: A LET definition reading a primed variable fails if used before the assignment.
ref: tlc2/tool/impl/Tool.java#getNextStatesImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE let_forced_before_assign ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == LET v == x' + 1 IN v = 2 /\ x' = 1
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
    In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 18 to line 13, col 18 of module let_forced_before_assign
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 18 to line 13, col 18 of module let_forced_before_assign
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 28 to line 13, column 42 in let_forced_before_assign
    1. Line 13, column 28 to line 13, column 32 in let_forced_before_assign
    2. Line 13, column 28 to line 13, column 28 in let_forced_before_assign
    3. Line 13, column 18 to line 13, column 23 in let_forced_before_assign
    4. Line 13, column 18 to line 13, column 19 in let_forced_before_assign
    5. Line 13, column 18 to line 13, column 18 in let_forced_before_assign
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

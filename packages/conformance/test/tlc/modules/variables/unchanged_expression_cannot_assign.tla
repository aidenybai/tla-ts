(*---
description: "UNCHANGED of a substituted x + 1 does not assign x', so TLC fails on the undefined x' when nothing else binds it."
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [variables]
config: |
  INIT Init
  NEXT Next
outcome: evaluation-failure
---*)
---- MODULE unchanged_expression_cannot_assign ----
EXTENDS Naturals
---- MODULE I ----
VARIABLE v
Same == v' = v
Stay == UNCHANGED v
====
VARIABLE x
M == INSTANCE I WITH v <- x + 1
Init == x = 0
Next == M!Stay
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
    line 18, col 27 to line 18, col 27 of module unchanged_expression_cannot_assign
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 18, col 27 to line 18, col 27 of module unchanged_expression_cannot_assign
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 1 to line 18, column 31 in unchanged_expression_cannot_assign
    1. Line 15, column 9 to line 15, column 19 in unchanged_expression_cannot_assign
    2. Line 15, column 19 to line 15, column 19 in unchanged_expression_cannot_assign
    3. Line 18, column 27 to line 18, column 31 in unchanged_expression_cannot_assign
    4. Line 18, column 27 to line 18, column 27 in unchanged_expression_cannot_assign
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

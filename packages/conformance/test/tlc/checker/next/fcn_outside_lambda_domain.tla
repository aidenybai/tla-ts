(*---
description: A lambda applied outside its domain fails with the message from getFcnContext.
ref: tlc2/tool/impl/Tool.java#getFcnContext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_outside_lambda_domain ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
F == [i \in 1..2 |-> x' = i]
Next == F[3]
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
    : In applying the function
    [i \in 1..2 |-> <expression line 13, col 22 to line 13, col 27 of module fcn_outside_lambda_domain>],
    the first argument is:
    3which is not in its domain.
    line 14, col 9 to line 14, col 9 of module fcn_outside_lambda_domain
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 12 in fcn_outside_lambda_domain
    1. Line 13, column 22 to line 13, column 27 in fcn_outside_lambda_domain
    2. Line 13, column 22 to line 13, column 23 in fcn_outside_lambda_domain
    3. Line 13, column 22 to line 13, column 22 in fcn_outside_lambda_domain
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

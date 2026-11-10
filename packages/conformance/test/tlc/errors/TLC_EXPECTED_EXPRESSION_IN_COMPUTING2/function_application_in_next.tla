(*---
description: A function application that isn't Boolean as a Next conjunct is refused.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE function_application_in_next ----
VARIABLE x
f == [e \in {1} |-> 3]
Init == x = 0
Next == x' = x /\ f[1]
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
    :
    2247:0 In computing next states, TLC expected a boolean expression,
    but instead found 3.
    line 13, col 19 to line 13, col 22 of module function_application_in_next
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 22 in function_application_in_next
    1. Line 13, column 9 to line 13, column 14 in function_application_in_next
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

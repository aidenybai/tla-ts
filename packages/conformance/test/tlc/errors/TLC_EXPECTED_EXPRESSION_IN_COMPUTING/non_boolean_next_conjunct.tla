(*---
description: A non-Boolean conjunct in Next is refused while computing successors.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE non_boolean_next_conjunct ----
VARIABLE x
Init == x = 0
Next == x' = x /\ 3
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
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 19 in non_boolean_next_conjunct
    1. Line 12, column 9 to line 12, column 14 in non_boolean_next_conjunct
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

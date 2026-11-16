(*---
description: <<x, y>>' = e isn't an assignment of x and y.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_primed_tuple_lhs ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == <<x, y>>' = <<1, 1>>
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
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 11 to line 13, col 11 of module eq_primed_tuple_lhs
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 28 in eq_primed_tuple_lhs
    1. Line 13, column 9 to line 13, column 17 in eq_primed_tuple_lhs
    2. Line 13, column 9 to line 13, column 16 in eq_primed_tuple_lhs
    3. Line 13, column 11 to line 13, column 11 in eq_primed_tuple_lhs
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

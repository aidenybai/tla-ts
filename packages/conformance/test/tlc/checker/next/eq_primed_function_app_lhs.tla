(*---
description: f'[1] = e isn't an assignment of f, so it fails on the unassigned f'.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_primed_function_app_lhs ----
EXTENDS Naturals, TLC
VARIABLE f
Init == f = <<0>>
Next == f'[1] = 1
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
    2280:0 In evaluation, the identifier f is either undefined or not an operator.
    line 13, col 9 to line 13, col 9 of module eq_primed_function_app_lhs
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    f = <<0>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 17 in eq_primed_function_app_lhs
    1. Line 13, column 9 to line 13, column 13 in eq_primed_function_app_lhs
    2. Line 13, column 9 to line 13, column 10 in eq_primed_function_app_lhs
    3. Line 13, column 9 to line 13, column 9 in eq_primed_function_app_lhs
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

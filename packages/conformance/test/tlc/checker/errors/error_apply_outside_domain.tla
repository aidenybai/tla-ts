(*---
description: A function applied outside its domain in Next prints the error and the state.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_apply_outside_domain ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = <<1>>
Next == x' = <<x[2]>>
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
    : Attempted to access index 2 of tuple
    <<1>>
    which is out of bounds.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 21 in error_apply_outside_domain
    1. Line 13, column 14 to line 13, column 21 in error_apply_outside_domain
    2. Line 13, column 16 to line 13, column 19 in error_apply_outside_domain
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

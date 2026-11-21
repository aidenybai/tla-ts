(*---
description: "A selection from a recursive function's body leaves the function's name unbound, so TLC fails on the recursive call."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [subexpressions]
config: |
  INIT Init
  NEXT Next
outcome: evaluation-failure
---*)
---- MODULE recursive_function_call_selected ----
EXTENDS Naturals
VARIABLE x
r[n \in {0, 1}] == IF n = 0 THEN 0 ELSE r[n - 1] + 1
Init == x = 0
Next == x' = r!(1)
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
    2280:0 In evaluation, the identifier r is either undefined or not an operator.
    line 13, col 41 to line 13, col 41 of module recursive_function_call_selected
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 18 in recursive_function_call_selected
    1. Line 15, column 14 to line 15, column 18 in recursive_function_call_selected
    2. Line 13, column 20 to line 13, column 52 in recursive_function_call_selected
    3. Line 13, column 41 to line 13, column 52 in recursive_function_call_selected
    4. Line 13, column 41 to line 13, column 48 in recursive_function_call_selected
    5. Line 13, column 41 to line 13, column 41 in recursive_function_call_selected
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: "A selection from the body of a recursive function a LET defines fails on the recursive call, though the LET's body is in the function's scope."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [subexpressions]
config: |
  INIT Init
  NEXT Next
outcome: evaluation-failure
---*)
---- MODULE recursive_let_function_call_selected ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = LET r[n \in {0, 1}] == IF n = 0 THEN 0 ELSE r[n - 1] + 1 IN r!(1)
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
    line 14, col 58 to line 14, col 58 of module recursive_let_function_call_selected
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 78 in recursive_let_function_call_selected
    1. Line 14, column 14 to line 14, column 78 in recursive_let_function_call_selected
    2. Line 14, column 74 to line 14, column 78 in recursive_let_function_call_selected
    3. Line 14, column 37 to line 14, column 69 in recursive_let_function_call_selected
    4. Line 14, column 58 to line 14, column 69 in recursive_let_function_call_selected
    5. Line 14, column 58 to line 14, column 65 in recursive_let_function_call_selected
    6. Line 14, column 58 to line 14, column 58 in recursive_let_function_call_selected
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

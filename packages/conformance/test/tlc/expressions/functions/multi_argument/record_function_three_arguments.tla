(*---
description: "A two-argument function record does not hold a triple."
ref: "tlc2/value/impl/FcnRcdValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE record_function_three_arguments ----
EXTENDS Integers
F == [x, y \in 1..2 |-> 0]
Test == F[1, 2, 3] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module record_function_three_arguments failed.
    Attempted to apply function:
    (<<1, 1>> :> 0 @@ <<1, 2>> :> 0 @@ <<2, 1>> :> 0 @@ <<2, 2>> :> 0)
    to argument <<1, 2, 3>>, which is not in the domain of the function.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function:
    (<<1, 1>> :> 0 @@ <<1, 2>> :> 0 @@ <<2, 1>> :> 0 @@ <<2, 2>> :> 0)
    to argument <<1, 2, 3>>, which is not in the domain of the function.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in record_function_three_arguments
    1. Line 12, column 29 to line 12, column 32 in record_function_three_arguments
    2. Line 10, column 9 to line 10, column 22 in record_function_three_arguments
    3. Line 10, column 9 to line 10, column 18 in record_function_three_arguments
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function:
    (<<1, 1>> :> 0 @@ <<1, 2>> :> 0 @@ <<2, 1>> :> 0 @@ <<2, 2>> :> 0)
    to argument <<1, 2, 3>>, which is not in the domain of the function.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in record_function_three_arguments
    1. Line 13, column 30 to line 13, column 33 in record_function_three_arguments
    2. Line 10, column 9 to line 10, column 22 in record_function_three_arguments
    3. Line 10, column 9 to line 10, column 18 in record_function_three_arguments
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    (<<1, 1>> :> 0 @@ <<1, 2>> :> 0 @@ <<2, 1>> :> 0 @@ <<2, 2>> :> 0)
    to argument <<1, 2, 3>>, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in record_function_three_arguments
    1. Line 14, column 8 to line 14, column 32 in record_function_three_arguments
    2. Line 14, column 29 to line 14, column 32 in record_function_three_arguments
    3. Line 10, column 9 to line 10, column 22 in record_function_three_arguments
    4. Line 10, column 9 to line 10, column 18 in record_function_three_arguments
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    (<<1, 1>> :> 0 @@ <<1, 2>> :> 0 @@ <<2, 1>> :> 0 @@ <<2, 2>> :> 0)
    to argument <<1, 2, 3>>, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in record_function_three_arguments
    1. Line 13, column 12 to line 13, column 36 in record_function_three_arguments
    2. Line 13, column 33 to line 13, column 36 in record_function_three_arguments
    3. Line 10, column 9 to line 10, column 22 in record_function_three_arguments
    4. Line 10, column 9 to line 10, column 18 in record_function_three_arguments
---*)

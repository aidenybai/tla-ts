(*---
description: "A two-argument function record cannot be applied to one integer, and comparing a tuple key with it fails."
ref: "tlc2/value/impl/FcnRcdValue.java#selectLinearSearch"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE record_function_wrong_arity ----
EXTENDS Integers
F == [x, y \in 1..2 |-> 0]
Test == F[1] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module record_function_wrong_arity failed.
    Attempted to check equality of the function <<1, 1>> with the value:
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of the function <<1, 1>> with the value:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in record_function_wrong_arity
    1. Line 12, column 29 to line 12, column 32 in record_function_wrong_arity
    2. Line 10, column 9 to line 10, column 16 in record_function_wrong_arity
    3. Line 10, column 9 to line 10, column 12 in record_function_wrong_arity
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of the function <<1, 1>> with the value:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in record_function_wrong_arity
    1. Line 13, column 30 to line 13, column 33 in record_function_wrong_arity
    2. Line 10, column 9 to line 10, column 16 in record_function_wrong_arity
    3. Line 10, column 9 to line 10, column 12 in record_function_wrong_arity
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the function <<1, 1>> with the value:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in record_function_wrong_arity
    1. Line 14, column 8 to line 14, column 32 in record_function_wrong_arity
    2. Line 14, column 29 to line 14, column 32 in record_function_wrong_arity
    3. Line 10, column 9 to line 10, column 16 in record_function_wrong_arity
    4. Line 10, column 9 to line 10, column 12 in record_function_wrong_arity
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the function <<1, 1>> with the value:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in record_function_wrong_arity
    1. Line 13, column 12 to line 13, column 36 in record_function_wrong_arity
    2. Line 13, column 33 to line 13, column 36 in record_function_wrong_arity
    3. Line 10, column 9 to line 10, column 16 in record_function_wrong_arity
    4. Line 10, column 9 to line 10, column 12 in record_function_wrong_arity
---*)

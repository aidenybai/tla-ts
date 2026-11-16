(*---
description: "A lazy multi-bound function reports the second position when the first holds."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_second_argument_outside ----
EXTENDS Integers
Test == [x \in Nat, y \in Nat |-> x + y][1, -2] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_second_argument_outside failed.
    In applying the function
    [x \in Nat, y \in Nat |-> <expression line 9, col 35 to line 9, col 39 of module lazy_second_argument_outside>],
    the argument number 2 is:
    -2
    which is not in the function's domain (Nat \X Nat).
init:
  exit: 75
  transcript: |-
    1000:1 In applying the function
    [x \in Nat, y \in Nat |-> <expression line 9, col 35 to line 9, col 39 of module lazy_second_argument_outside>],
    the argument number 2 is:
    -2
    which is not in the function's domain (Nat \X Nat).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_second_argument_outside
    1. Line 11, column 29 to line 11, column 32 in lazy_second_argument_outside
    2. Line 9, column 9 to line 9, column 51 in lazy_second_argument_outside
    3. Line 9, column 9 to line 9, column 47 in lazy_second_argument_outside
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In applying the function
    [x \in Nat, y \in Nat |-> <expression line 9, col 35 to line 9, col 39 of module lazy_second_argument_outside>],
    the argument number 2 is:
    -2
    which is not in the function's domain (Nat \X Nat).
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_second_argument_outside
    1. Line 12, column 30 to line 12, column 33 in lazy_second_argument_outside
    2. Line 9, column 9 to line 9, column 51 in lazy_second_argument_outside
    3. Line 9, column 9 to line 9, column 47 in lazy_second_argument_outside
invariant:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [x \in Nat, y \in Nat |-> <expression line 9, col 35 to line 9, col 39 of module lazy_second_argument_outside>],
    the argument number 2 is:
    -2
    which is not in the function's domain (Nat \X Nat).

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_second_argument_outside
    1. Line 13, column 8 to line 13, column 32 in lazy_second_argument_outside
    2. Line 13, column 29 to line 13, column 32 in lazy_second_argument_outside
    3. Line 9, column 9 to line 9, column 51 in lazy_second_argument_outside
    4. Line 9, column 9 to line 9, column 47 in lazy_second_argument_outside
property:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [x \in Nat, y \in Nat |-> <expression line 9, col 35 to line 9, col 39 of module lazy_second_argument_outside>],
    the argument number 2 is:
    -2
    which is not in the function's domain (Nat \X Nat).

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_second_argument_outside
    1. Line 12, column 12 to line 12, column 36 in lazy_second_argument_outside
    2. Line 12, column 33 to line 12, column 36 in lazy_second_argument_outside
    3. Line 9, column 9 to line 9, column 51 in lazy_second_argument_outside
    4. Line 9, column 9 to line 9, column 47 in lazy_second_argument_outside
---*)

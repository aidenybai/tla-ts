(*---
description: "A lazy multi-bound function reports a non-tuple argument list."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_non_tuple_argument ----
EXTENDS Integers
Test == [x, y \in Nat |-> x + y][1] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_non_tuple_argument failed.
    In applying the function
    [x \in Nat |-> <expression line 9, col 27 to line 9, col 31 of module lazy_non_tuple_argument>],
    the argument list is:
    1
    which does not match its formal parameter.
init:
  exit: 75
  transcript: |-
    1000:1 In applying the function
    [x \in Nat |-> <expression line 9, col 27 to line 9, col 31 of module lazy_non_tuple_argument>],
    the argument list is:
    1
    which does not match its formal parameter.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_non_tuple_argument
    1. Line 11, column 29 to line 11, column 32 in lazy_non_tuple_argument
    2. Line 9, column 9 to line 9, column 39 in lazy_non_tuple_argument
    3. Line 9, column 9 to line 9, column 35 in lazy_non_tuple_argument
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In applying the function
    [x \in Nat |-> <expression line 9, col 27 to line 9, col 31 of module lazy_non_tuple_argument>],
    the argument list is:
    1
    which does not match its formal parameter.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_non_tuple_argument
    1. Line 12, column 30 to line 12, column 33 in lazy_non_tuple_argument
    2. Line 9, column 9 to line 9, column 39 in lazy_non_tuple_argument
    3. Line 9, column 9 to line 9, column 35 in lazy_non_tuple_argument
invariant:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [x \in Nat |-> <expression line 9, col 27 to line 9, col 31 of module lazy_non_tuple_argument>],
    the argument list is:
    1
    which does not match its formal parameter.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_non_tuple_argument
    1. Line 13, column 8 to line 13, column 32 in lazy_non_tuple_argument
    2. Line 13, column 29 to line 13, column 32 in lazy_non_tuple_argument
    3. Line 9, column 9 to line 9, column 39 in lazy_non_tuple_argument
    4. Line 9, column 9 to line 9, column 35 in lazy_non_tuple_argument
property:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [x \in Nat |-> <expression line 9, col 27 to line 9, col 31 of module lazy_non_tuple_argument>],
    the argument list is:
    1
    which does not match its formal parameter.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_non_tuple_argument
    1. Line 12, column 12 to line 12, column 36 in lazy_non_tuple_argument
    2. Line 12, column 33 to line 12, column 36 in lazy_non_tuple_argument
    3. Line 9, column 9 to line 9, column 39 in lazy_non_tuple_argument
    4. Line 9, column 9 to line 9, column 35 in lazy_non_tuple_argument
---*)

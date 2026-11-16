(*---
description: "A string path on a function on an interval is an error from select."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE string_key_on_interval_function ----
EXTENDS Integers
Test == [[i \in 1..2 |-> i] EXCEPT !.a = 0] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module string_key_on_interval_function failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function with integer domain to the non-integer argument "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in string_key_on_interval_function
    1. Line 11, column 29 to line 11, column 32 in string_key_on_interval_function
    2. Line 9, column 9 to line 9, column 47 in string_key_on_interval_function
    3. Line 9, column 9 to line 9, column 43 in string_key_on_interval_function
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function with integer domain to the non-integer argument "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in string_key_on_interval_function
    1. Line 12, column 30 to line 12, column 33 in string_key_on_interval_function
    2. Line 9, column 9 to line 9, column 47 in string_key_on_interval_function
    3. Line 9, column 9 to line 9, column 43 in string_key_on_interval_function
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function with integer domain to the non-integer argument "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in string_key_on_interval_function
    1. Line 13, column 8 to line 13, column 32 in string_key_on_interval_function
    2. Line 13, column 29 to line 13, column 32 in string_key_on_interval_function
    3. Line 9, column 9 to line 9, column 47 in string_key_on_interval_function
    4. Line 9, column 9 to line 9, column 43 in string_key_on_interval_function
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function with integer domain to the non-integer argument "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in string_key_on_interval_function
    1. Line 12, column 12 to line 12, column 36 in string_key_on_interval_function
    2. Line 12, column 33 to line 12, column 36 in string_key_on_interval_function
    3. Line 9, column 9 to line 9, column 47 in string_key_on_interval_function
    4. Line 9, column 9 to line 9, column 43 in string_key_on_interval_function
---*)

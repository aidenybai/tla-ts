(*---
description: "A tuple compared with a string is an error from the function path."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE tuple_not_equal_to_string ----
EXTENDS Integers
Test == <<"a">> = "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module tuple_not_equal_to_string failed.
    Attempted to check equality of the function <<"a">> with the value:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of the function <<"a">> with the value:
    "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in tuple_not_equal_to_string
    1. Line 11, column 29 to line 11, column 32 in tuple_not_equal_to_string
    2. Line 9, column 9 to line 9, column 21 in tuple_not_equal_to_string
    3. Line 9, column 9 to line 9, column 15 in tuple_not_equal_to_string


    Reason:
    Attempted to check equality of the function <<"a">> with the value:
    "a"
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of the function <<"a">> with the value:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in tuple_not_equal_to_string
    1. Line 12, column 30 to line 12, column 33 in tuple_not_equal_to_string
    2. Line 9, column 9 to line 9, column 21 in tuple_not_equal_to_string
    3. Line 9, column 9 to line 9, column 15 in tuple_not_equal_to_string


    Reason:
    Attempted to check equality of the function <<"a">> with the value:
    "a"
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the function <<"a">> with the value:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in tuple_not_equal_to_string
    1. Line 13, column 8 to line 13, column 32 in tuple_not_equal_to_string
    2. Line 13, column 29 to line 13, column 32 in tuple_not_equal_to_string
    3. Line 9, column 9 to line 9, column 21 in tuple_not_equal_to_string
    4. Line 9, column 9 to line 9, column 15 in tuple_not_equal_to_string


    Reason:
    Attempted to check equality of the function <<"a">> with the value:
    "a"
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the function <<"a">> with the value:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in tuple_not_equal_to_string
    1. Line 12, column 12 to line 12, column 36 in tuple_not_equal_to_string
    2. Line 12, column 33 to line 12, column 36 in tuple_not_equal_to_string
    3. Line 9, column 9 to line 9, column 21 in tuple_not_equal_to_string
    4. Line 9, column 9 to line 9, column 15 in tuple_not_equal_to_string


    Reason:
    Attempted to check equality of the function <<"a">> with the value:
    "a"
---*)

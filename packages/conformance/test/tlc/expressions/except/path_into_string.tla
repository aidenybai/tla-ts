(*---
description: "A path that continues past a string is an error, because strings are not functions."
ref: "tlc2/value/impl/Value.java#select"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE path_into_string ----
EXTENDS Integers
Test == [<<"ab">> EXCEPT ![1][1] = 0] = <<1>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module path_into_string failed.
    Attempted to apply EXCEPT construct to the value "ab".
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply EXCEPT construct to the value "ab".
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in path_into_string
    1. Line 11, column 29 to line 11, column 32 in path_into_string
    2. Line 9, column 9 to line 9, column 45 in path_into_string
    3. Line 9, column 9 to line 9, column 37 in path_into_string
    4. Line 9, column 10 to line 9, column 17 in path_into_string


    Reason:
    Attempted to apply EXCEPT construct to the value "ab".
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply EXCEPT construct to the value "ab".
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in path_into_string
    1. Line 12, column 30 to line 12, column 33 in path_into_string
    2. Line 9, column 9 to line 9, column 45 in path_into_string
    3. Line 9, column 9 to line 9, column 37 in path_into_string
    4. Line 9, column 10 to line 9, column 17 in path_into_string


    Reason:
    Attempted to apply EXCEPT construct to the value "ab".
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply EXCEPT construct to the value "ab".
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in path_into_string
    1. Line 13, column 8 to line 13, column 32 in path_into_string
    2. Line 13, column 29 to line 13, column 32 in path_into_string
    3. Line 9, column 9 to line 9, column 45 in path_into_string
    4. Line 9, column 9 to line 9, column 37 in path_into_string
    5. Line 9, column 10 to line 9, column 17 in path_into_string


    Reason:
    Attempted to apply EXCEPT construct to the value "ab".
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply EXCEPT construct to the value "ab".
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in path_into_string
    1. Line 12, column 12 to line 12, column 36 in path_into_string
    2. Line 12, column 33 to line 12, column 36 in path_into_string
    3. Line 9, column 9 to line 9, column 45 in path_into_string
    4. Line 9, column 9 to line 9, column 37 in path_into_string
    5. Line 9, column 10 to line 9, column 17 in path_into_string


    Reason:
    Attempted to apply EXCEPT construct to the value "ab".
---*)

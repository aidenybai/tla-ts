(*---
description: "A path that continues past a set is an error."
ref: "tlc2/value/impl/Value.java#select"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE path_into_set ----
EXTENDS Integers
Test == [<<{1}>> EXCEPT ![1][1] = 0] = <<1>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module path_into_set failed.
    Attempted to apply EXCEPT construct to the value {1}.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply EXCEPT construct to the value {1}.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in path_into_set
    1. Line 11, column 29 to line 11, column 32 in path_into_set
    2. Line 9, column 9 to line 9, column 44 in path_into_set
    3. Line 9, column 9 to line 9, column 36 in path_into_set
    4. Line 9, column 10 to line 9, column 16 in path_into_set


    Reason:
    Attempted to apply EXCEPT construct to the value {1}.
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply EXCEPT construct to the value {1}.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in path_into_set
    1. Line 12, column 30 to line 12, column 33 in path_into_set
    2. Line 9, column 9 to line 9, column 44 in path_into_set
    3. Line 9, column 9 to line 9, column 36 in path_into_set
    4. Line 9, column 10 to line 9, column 16 in path_into_set


    Reason:
    Attempted to apply EXCEPT construct to the value {1}.
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply EXCEPT construct to the value {1}.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in path_into_set
    1. Line 13, column 8 to line 13, column 32 in path_into_set
    2. Line 13, column 29 to line 13, column 32 in path_into_set
    3. Line 9, column 9 to line 9, column 44 in path_into_set
    4. Line 9, column 9 to line 9, column 36 in path_into_set
    5. Line 9, column 10 to line 9, column 16 in path_into_set


    Reason:
    Attempted to apply EXCEPT construct to the value {1}.
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply EXCEPT construct to the value {1}.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in path_into_set
    1. Line 12, column 12 to line 12, column 36 in path_into_set
    2. Line 12, column 33 to line 12, column 36 in path_into_set
    3. Line 9, column 9 to line 9, column 44 in path_into_set
    4. Line 9, column 9 to line 9, column 36 in path_into_set
    5. Line 9, column 10 to line 9, column 16 in path_into_set


    Reason:
    Attempted to apply EXCEPT construct to the value {1}.
---*)

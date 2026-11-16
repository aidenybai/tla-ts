(*---
description: "A tuple compared with a set is an error."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE compared_with_set ----
EXTENDS Integers
Test == <<>> = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module compared_with_set failed.
    Attempted to check equality of the function <<>> with the value:
    {}
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of the function <<>> with the value:
    {}
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in compared_with_set
    1. Line 11, column 29 to line 11, column 32 in compared_with_set
    2. Line 9, column 9 to line 9, column 17 in compared_with_set
    3. Line 9, column 9 to line 9, column 12 in compared_with_set


    Reason:
    Attempted to check equality of the function <<>> with the value:
    {}
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of the function <<>> with the value:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in compared_with_set
    1. Line 12, column 30 to line 12, column 33 in compared_with_set
    2. Line 9, column 9 to line 9, column 17 in compared_with_set
    3. Line 9, column 9 to line 9, column 12 in compared_with_set


    Reason:
    Attempted to check equality of the function <<>> with the value:
    {}
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the function <<>> with the value:
    {}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in compared_with_set
    1. Line 13, column 8 to line 13, column 32 in compared_with_set
    2. Line 13, column 29 to line 13, column 32 in compared_with_set
    3. Line 9, column 9 to line 9, column 17 in compared_with_set
    4. Line 9, column 9 to line 9, column 12 in compared_with_set


    Reason:
    Attempted to check equality of the function <<>> with the value:
    {}
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the function <<>> with the value:
    {}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in compared_with_set
    1. Line 12, column 12 to line 12, column 36 in compared_with_set
    2. Line 12, column 33 to line 12, column 36 in compared_with_set
    3. Line 9, column 9 to line 9, column 17 in compared_with_set
    4. Line 9, column 9 to line 9, column 12 in compared_with_set


    Reason:
    Attempted to check equality of the function <<>> with the value:
    {}
---*)

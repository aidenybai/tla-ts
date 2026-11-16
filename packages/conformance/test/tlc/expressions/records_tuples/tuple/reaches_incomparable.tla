(*---
description: "Tuple comparison reaches a later incomparable component after equal ones."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE reaches_incomparable ----
EXTENDS Integers
Test == <<1, "a">> = <<1, 1>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module reaches_incomparable failed.
    Attempted to check equality of string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of string "a" with non-string:
    1
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in reaches_incomparable
    1. Line 11, column 29 to line 11, column 32 in reaches_incomparable
    2. Line 9, column 9 to line 9, column 29 in reaches_incomparable
    3. Line 9, column 9 to line 9, column 18 in reaches_incomparable


    Reason:
    Attempted to check equality of string "a" with non-string:
    1
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in reaches_incomparable
    1. Line 12, column 30 to line 12, column 33 in reaches_incomparable
    2. Line 9, column 9 to line 9, column 29 in reaches_incomparable
    3. Line 9, column 9 to line 9, column 18 in reaches_incomparable


    Reason:
    Attempted to check equality of string "a" with non-string:
    1
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of string "a" with non-string:
    1
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in reaches_incomparable
    1. Line 13, column 8 to line 13, column 32 in reaches_incomparable
    2. Line 13, column 29 to line 13, column 32 in reaches_incomparable
    3. Line 9, column 9 to line 9, column 29 in reaches_incomparable
    4. Line 9, column 9 to line 9, column 18 in reaches_incomparable


    Reason:
    Attempted to check equality of string "a" with non-string:
    1
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of string "a" with non-string:
    1
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in reaches_incomparable
    1. Line 12, column 12 to line 12, column 36 in reaches_incomparable
    2. Line 12, column 33 to line 12, column 36 in reaches_incomparable
    3. Line 9, column 9 to line 9, column 29 in reaches_incomparable
    4. Line 9, column 9 to line 9, column 18 in reaches_incomparable


    Reason:
    Attempted to check equality of string "a" with non-string:
    1
---*)

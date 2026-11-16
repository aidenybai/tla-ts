(*---
description: "Membership in an unnormalized set compares with each element until a match, so reaching an incomparable one is an error."
ref: "tlc2/value/impl/ValueVec.java#search"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_unsorted_reaches_incomparable ----
EXTENDS Integers
Test == "a" \in {1, "a"}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module member_unsorted_reaches_incomparable failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_unsorted_reaches_incomparable
    1. Line 11, column 29 to line 11, column 32 in member_unsorted_reaches_incomparable
    2. Line 9, column 9 to line 9, column 24 in member_unsorted_reaches_incomparable
    3. Line 9, column 17 to line 9, column 24 in member_unsorted_reaches_incomparable


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "a"
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of integer 1 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in member_unsorted_reaches_incomparable
    1. Line 12, column 30 to line 12, column 33 in member_unsorted_reaches_incomparable
    2. Line 9, column 9 to line 9, column 24 in member_unsorted_reaches_incomparable
    3. Line 9, column 17 to line 9, column 24 in member_unsorted_reaches_incomparable


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "a"
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_unsorted_reaches_incomparable
    1. Line 13, column 8 to line 13, column 32 in member_unsorted_reaches_incomparable
    2. Line 13, column 29 to line 13, column 32 in member_unsorted_reaches_incomparable
    3. Line 9, column 9 to line 9, column 24 in member_unsorted_reaches_incomparable
    4. Line 9, column 17 to line 9, column 24 in member_unsorted_reaches_incomparable


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "a"
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_unsorted_reaches_incomparable
    1. Line 12, column 12 to line 12, column 36 in member_unsorted_reaches_incomparable
    2. Line 12, column 33 to line 12, column 36 in member_unsorted_reaches_incomparable
    3. Line 9, column 9 to line 9, column 24 in member_unsorted_reaches_incomparable
    4. Line 9, column 17 to line 9, column 24 in member_unsorted_reaches_incomparable


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)

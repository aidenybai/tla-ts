(*---
description: "\\cap with a Reducible side filters eagerly, and a string probe fails on an integer set."
ref: "tlc2/value/impl/SetEnumValue.java#cap"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE cap_eager_reaches_incomparable ----
EXTENDS Integers
Test == ({"a"} \cap {1}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module cap_eager_reaches_incomparable failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cap_eager_reaches_incomparable
    1. Line 11, column 29 to line 11, column 32 in cap_eager_reaches_incomparable
    2. Line 9, column 9 to line 9, column 29 in cap_eager_reaches_incomparable
    3. Line 9, column 10 to line 9, column 23 in cap_eager_reaches_incomparable
    4. Line 9, column 10 to line 9, column 14 in cap_eager_reaches_incomparable
    5. Line 9, column 21 to line 9, column 23 in cap_eager_reaches_incomparable


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
    0. Line 12, column 9 to line 12, column 33 in cap_eager_reaches_incomparable
    1. Line 12, column 30 to line 12, column 33 in cap_eager_reaches_incomparable
    2. Line 9, column 9 to line 9, column 29 in cap_eager_reaches_incomparable
    3. Line 9, column 10 to line 9, column 23 in cap_eager_reaches_incomparable
    4. Line 9, column 10 to line 9, column 14 in cap_eager_reaches_incomparable
    5. Line 9, column 21 to line 9, column 23 in cap_eager_reaches_incomparable


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
    0. Line 11, column 9 to line 11, column 32 in cap_eager_reaches_incomparable
    1. Line 13, column 8 to line 13, column 32 in cap_eager_reaches_incomparable
    2. Line 13, column 29 to line 13, column 32 in cap_eager_reaches_incomparable
    3. Line 9, column 9 to line 9, column 29 in cap_eager_reaches_incomparable
    4. Line 9, column 10 to line 9, column 23 in cap_eager_reaches_incomparable
    5. Line 9, column 10 to line 9, column 14 in cap_eager_reaches_incomparable
    6. Line 9, column 21 to line 9, column 23 in cap_eager_reaches_incomparable


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
    0. Line 11, column 9 to line 11, column 32 in cap_eager_reaches_incomparable
    1. Line 12, column 12 to line 12, column 36 in cap_eager_reaches_incomparable
    2. Line 12, column 33 to line 12, column 36 in cap_eager_reaches_incomparable
    3. Line 9, column 9 to line 9, column 29 in cap_eager_reaches_incomparable
    4. Line 9, column 10 to line 9, column 23 in cap_eager_reaches_incomparable
    5. Line 9, column 10 to line 9, column 14 in cap_eager_reaches_incomparable
    6. Line 9, column 21 to line 9, column 23 in cap_eager_reaches_incomparable


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)

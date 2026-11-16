(*---
description: "= normalizes both sets, so a mixed set fails to sort even when the sizes differ."
ref: "tlc2/value/impl/SetEnumValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE equality_normalizes_mixed_set ----
EXTENDS Integers
Test == {1, "a"} = {1}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module equality_normalizes_mixed_set failed.
    Attempted to compare string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare string "a" with non-string:
    1
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in equality_normalizes_mixed_set
    1. Line 11, column 29 to line 11, column 32 in equality_normalizes_mixed_set
    2. Line 9, column 9 to line 9, column 22 in equality_normalizes_mixed_set
    3. Line 9, column 9 to line 9, column 16 in equality_normalizes_mixed_set


    Reason:
    Attempted to compare string "a" with non-string:
    1
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in equality_normalizes_mixed_set
    1. Line 12, column 30 to line 12, column 33 in equality_normalizes_mixed_set
    2. Line 9, column 9 to line 9, column 22 in equality_normalizes_mixed_set
    3. Line 9, column 9 to line 9, column 16 in equality_normalizes_mixed_set


    Reason:
    Attempted to compare string "a" with non-string:
    1
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare string "a" with non-string:
    1
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in equality_normalizes_mixed_set
    1. Line 13, column 8 to line 13, column 32 in equality_normalizes_mixed_set
    2. Line 13, column 29 to line 13, column 32 in equality_normalizes_mixed_set
    3. Line 9, column 9 to line 9, column 22 in equality_normalizes_mixed_set
    4. Line 9, column 9 to line 9, column 16 in equality_normalizes_mixed_set


    Reason:
    Attempted to compare string "a" with non-string:
    1
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare string "a" with non-string:
    1
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in equality_normalizes_mixed_set
    1. Line 12, column 12 to line 12, column 36 in equality_normalizes_mixed_set
    2. Line 12, column 33 to line 12, column 36 in equality_normalizes_mixed_set
    3. Line 9, column 9 to line 9, column 22 in equality_normalizes_mixed_set
    4. Line 9, column 9 to line 9, column 16 in equality_normalizes_mixed_set


    Reason:
    Attempted to compare string "a" with non-string:
    1
---*)

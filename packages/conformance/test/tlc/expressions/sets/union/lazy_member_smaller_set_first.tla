(*---
description: "Lazy UNION membership enumerates the outer set in normalized order, so the smaller set is asked first and an integer probe fails on its string."
ref: "tlc2/value/impl/UnionValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_member_smaller_set_first ----
EXTENDS Integers
Test == 1 \in UNION {1..2, {"a"}}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_member_smaller_set_first failed.
    Attempted to compare integer 1 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare integer 1 with non-integer:
    "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_smaller_set_first
    1. Line 11, column 29 to line 11, column 32 in lazy_member_smaller_set_first
    2. Line 9, column 9 to line 9, column 33 in lazy_member_smaller_set_first
    3. Line 9, column 15 to line 9, column 33 in lazy_member_smaller_set_first
    4. Line 9, column 28 to line 9, column 32 in lazy_member_smaller_set_first


    Reason:
    Attempted to compare integer 1 with non-integer:
    "a"
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare integer 1 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in lazy_member_smaller_set_first
    1. Line 12, column 30 to line 12, column 33 in lazy_member_smaller_set_first
    2. Line 9, column 9 to line 9, column 33 in lazy_member_smaller_set_first
    3. Line 9, column 15 to line 9, column 33 in lazy_member_smaller_set_first
    4. Line 9, column 28 to line 9, column 32 in lazy_member_smaller_set_first


    Reason:
    Attempted to compare integer 1 with non-integer:
    "a"
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_smaller_set_first
    1. Line 13, column 8 to line 13, column 32 in lazy_member_smaller_set_first
    2. Line 13, column 29 to line 13, column 32 in lazy_member_smaller_set_first
    3. Line 9, column 9 to line 9, column 33 in lazy_member_smaller_set_first
    4. Line 9, column 15 to line 9, column 33 in lazy_member_smaller_set_first
    5. Line 9, column 28 to line 9, column 32 in lazy_member_smaller_set_first


    Reason:
    Attempted to compare integer 1 with non-integer:
    "a"
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_smaller_set_first
    1. Line 12, column 12 to line 12, column 36 in lazy_member_smaller_set_first
    2. Line 12, column 33 to line 12, column 36 in lazy_member_smaller_set_first
    3. Line 9, column 9 to line 9, column 33 in lazy_member_smaller_set_first
    4. Line 9, column 15 to line 9, column 33 in lazy_member_smaller_set_first
    5. Line 9, column 28 to line 9, column 32 in lazy_member_smaller_set_first


    Reason:
    Attempted to compare integer 1 with non-integer:
    "a"
---*)

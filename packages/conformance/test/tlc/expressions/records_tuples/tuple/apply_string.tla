(*---
description: "A string index is not integral."
ref: "tlc2/value/impl/TupleValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE apply_string ----
EXTENDS Integers
Test == <<7>>["a"] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module apply_string failed.
    Attempted to access tuple at a non integral index: "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to access tuple at a non integral index: "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in apply_string
    1. Line 11, column 29 to line 11, column 32 in apply_string
    2. Line 9, column 9 to line 9, column 22 in apply_string
    3. Line 9, column 9 to line 9, column 18 in apply_string
    4. Line 9, column 9 to line 9, column 13 in apply_string


    Reason:
    Attempted to access tuple at a non integral index: "a"
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to access tuple at a non integral index: "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in apply_string
    1. Line 12, column 30 to line 12, column 33 in apply_string
    2. Line 9, column 9 to line 9, column 22 in apply_string
    3. Line 9, column 9 to line 9, column 18 in apply_string
    4. Line 9, column 9 to line 9, column 13 in apply_string


    Reason:
    Attempted to access tuple at a non integral index: "a"
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to access tuple at a non integral index: "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in apply_string
    1. Line 13, column 8 to line 13, column 32 in apply_string
    2. Line 13, column 29 to line 13, column 32 in apply_string
    3. Line 9, column 9 to line 9, column 22 in apply_string
    4. Line 9, column 9 to line 9, column 18 in apply_string
    5. Line 9, column 9 to line 9, column 13 in apply_string


    Reason:
    Attempted to access tuple at a non integral index: "a"
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to access tuple at a non integral index: "a"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in apply_string
    1. Line 12, column 12 to line 12, column 36 in apply_string
    2. Line 12, column 33 to line 12, column 36 in apply_string
    3. Line 9, column 9 to line 9, column 22 in apply_string
    4. Line 9, column 9 to line 9, column 18 in apply_string
    5. Line 9, column 9 to line 9, column 13 in apply_string


    Reason:
    Attempted to access tuple at a non integral index: "a"
---*)

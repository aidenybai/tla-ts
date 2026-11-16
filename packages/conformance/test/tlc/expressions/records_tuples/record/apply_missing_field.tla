(*---
description: "r[\"b\"] on a record without b reports a message different from r.b."
ref: "tlc2/value/impl/RecordValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE apply_missing_field ----
EXTENDS Integers
Test == [a |-> 1]["b"] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module apply_missing_field failed.
    Attempted to access nonexistent field 'b' of record
    [a |-> 1]
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to access nonexistent field 'b' of record
    [a |-> 1]
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in apply_missing_field
    1. Line 11, column 29 to line 11, column 32 in apply_missing_field
    2. Line 9, column 9 to line 9, column 26 in apply_missing_field
    3. Line 9, column 9 to line 9, column 22 in apply_missing_field
    4. Line 9, column 9 to line 9, column 17 in apply_missing_field


    Reason:
    Attempted to access nonexistent field 'b' of record
    [a |-> 1]
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to access nonexistent field 'b' of record
    [a |-> 1]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in apply_missing_field
    1. Line 12, column 30 to line 12, column 33 in apply_missing_field
    2. Line 9, column 9 to line 9, column 26 in apply_missing_field
    3. Line 9, column 9 to line 9, column 22 in apply_missing_field
    4. Line 9, column 9 to line 9, column 17 in apply_missing_field


    Reason:
    Attempted to access nonexistent field 'b' of record
    [a |-> 1]
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to access nonexistent field 'b' of record
    [a |-> 1]
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in apply_missing_field
    1. Line 13, column 8 to line 13, column 32 in apply_missing_field
    2. Line 13, column 29 to line 13, column 32 in apply_missing_field
    3. Line 9, column 9 to line 9, column 26 in apply_missing_field
    4. Line 9, column 9 to line 9, column 22 in apply_missing_field
    5. Line 9, column 9 to line 9, column 17 in apply_missing_field


    Reason:
    Attempted to access nonexistent field 'b' of record
    [a |-> 1]
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to access nonexistent field 'b' of record
    [a |-> 1]
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in apply_missing_field
    1. Line 12, column 12 to line 12, column 36 in apply_missing_field
    2. Line 12, column 33 to line 12, column 36 in apply_missing_field
    3. Line 9, column 9 to line 9, column 26 in apply_missing_field
    4. Line 9, column 9 to line 9, column 22 in apply_missing_field
    5. Line 9, column 9 to line 9, column 17 in apply_missing_field


    Reason:
    Attempted to access nonexistent field 'b' of record
    [a |-> 1]
---*)

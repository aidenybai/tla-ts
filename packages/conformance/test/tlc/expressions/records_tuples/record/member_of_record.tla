(*---
description: "A record is not a set, and checking membership in one is an error."
ref: "tlc2/value/impl/RecordValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_of_record ----
EXTENDS Integers
Test == 1 \in [a |-> 1]
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module member_of_record failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_of_record
    1. Line 11, column 29 to line 11, column 32 in member_of_record
    2. Line 9, column 9 to line 9, column 23 in member_of_record
    3. Line 9, column 15 to line 9, column 23 in member_of_record


    Reason:
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in member_of_record
    1. Line 12, column 30 to line 12, column 33 in member_of_record
    2. Line 9, column 9 to line 9, column 23 in member_of_record
    3. Line 9, column 15 to line 9, column 23 in member_of_record


    Reason:
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_of_record
    1. Line 13, column 8 to line 13, column 32 in member_of_record
    2. Line 13, column 29 to line 13, column 32 in member_of_record
    3. Line 9, column 9 to line 9, column 23 in member_of_record
    4. Line 9, column 15 to line 9, column 23 in member_of_record


    Reason:
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_of_record
    1. Line 12, column 12 to line 12, column 36 in member_of_record
    2. Line 12, column 33 to line 12, column 36 in member_of_record
    3. Line 9, column 9 to line 9, column 23 in member_of_record
    4. Line 9, column 15 to line 9, column 23 in member_of_record


    Reason:
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)

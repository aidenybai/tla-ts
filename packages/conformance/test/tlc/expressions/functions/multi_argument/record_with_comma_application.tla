(*---
description: "A comma application on a record passes a tuple as the field name."
ref: "tlc2/value/impl/RecordValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE record_with_comma_application ----
EXTENDS Integers
Test == [a |-> 1][1, 2] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module record_with_comma_application failed.
    Attempted to access record by a non-string argument: <<1, 2>>
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to access record by a non-string argument: <<1, 2>>
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in record_with_comma_application
    1. Line 11, column 29 to line 11, column 32 in record_with_comma_application
    2. Line 9, column 9 to line 9, column 27 in record_with_comma_application
    3. Line 9, column 9 to line 9, column 23 in record_with_comma_application
    4. Line 9, column 9 to line 9, column 17 in record_with_comma_application


    Reason:
    Attempted to access record by a non-string argument: <<1, 2>>
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to access record by a non-string argument: <<1, 2>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in record_with_comma_application
    1. Line 12, column 30 to line 12, column 33 in record_with_comma_application
    2. Line 9, column 9 to line 9, column 27 in record_with_comma_application
    3. Line 9, column 9 to line 9, column 23 in record_with_comma_application
    4. Line 9, column 9 to line 9, column 17 in record_with_comma_application


    Reason:
    Attempted to access record by a non-string argument: <<1, 2>>
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to access record by a non-string argument: <<1, 2>>
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in record_with_comma_application
    1. Line 13, column 8 to line 13, column 32 in record_with_comma_application
    2. Line 13, column 29 to line 13, column 32 in record_with_comma_application
    3. Line 9, column 9 to line 9, column 27 in record_with_comma_application
    4. Line 9, column 9 to line 9, column 23 in record_with_comma_application
    5. Line 9, column 9 to line 9, column 17 in record_with_comma_application


    Reason:
    Attempted to access record by a non-string argument: <<1, 2>>
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to access record by a non-string argument: <<1, 2>>
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in record_with_comma_application
    1. Line 12, column 12 to line 12, column 36 in record_with_comma_application
    2. Line 12, column 33 to line 12, column 36 in record_with_comma_application
    3. Line 9, column 9 to line 9, column 27 in record_with_comma_application
    4. Line 9, column 9 to line 9, column 23 in record_with_comma_application
    5. Line 9, column 9 to line 9, column 17 in record_with_comma_application


    Reason:
    Attempted to access record by a non-string argument: <<1, 2>>
---*)

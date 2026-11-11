(*---
description: "A model value is a non-string field argument, unlike its treatment by equality."
ref: "tlc2/value/impl/RecordValue.java#apply"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT mv = mv
---*)
---- MODULE apply_model_value ----
EXTENDS Integers
CONSTANT mv
Test == [a |-> 1][mv] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module apply_model_value failed.
    Attempted to access record by a non-string argument: mv
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to access record by a non-string argument: mv
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in apply_model_value
    1. Line 14, column 29 to line 14, column 32 in apply_model_value
    2. Line 12, column 9 to line 12, column 25 in apply_model_value
    3. Line 12, column 9 to line 12, column 21 in apply_model_value
    4. Line 12, column 9 to line 12, column 17 in apply_model_value


    Reason:
    Attempted to access record by a non-string argument: mv
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to access record by a non-string argument: mv
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in apply_model_value
    1. Line 15, column 30 to line 15, column 33 in apply_model_value
    2. Line 12, column 9 to line 12, column 25 in apply_model_value
    3. Line 12, column 9 to line 12, column 21 in apply_model_value
    4. Line 12, column 9 to line 12, column 17 in apply_model_value


    Reason:
    Attempted to access record by a non-string argument: mv
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to access record by a non-string argument: mv
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in apply_model_value
    1. Line 16, column 8 to line 16, column 32 in apply_model_value
    2. Line 16, column 29 to line 16, column 32 in apply_model_value
    3. Line 12, column 9 to line 12, column 25 in apply_model_value
    4. Line 12, column 9 to line 12, column 21 in apply_model_value
    5. Line 12, column 9 to line 12, column 17 in apply_model_value


    Reason:
    Attempted to access record by a non-string argument: mv
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to access record by a non-string argument: mv
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in apply_model_value
    1. Line 15, column 12 to line 15, column 36 in apply_model_value
    2. Line 15, column 33 to line 15, column 36 in apply_model_value
    3. Line 12, column 9 to line 12, column 25 in apply_model_value
    4. Line 12, column 9 to line 12, column 21 in apply_model_value
    5. Line 12, column 9 to line 12, column 17 in apply_model_value


    Reason:
    Attempted to access record by a non-string argument: mv
---*)

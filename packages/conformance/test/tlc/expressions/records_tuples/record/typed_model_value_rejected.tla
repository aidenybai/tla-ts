(*---
description: "A record compared with a typed model value is an error."
ref: "tlc2/value/impl/ModelValue.java#modelValueEquals"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT t_1 = t_1
---*)
---- MODULE typed_model_value_rejected ----
EXTENDS Integers
CONSTANT t_1
Test == [a |-> 1] # t_1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module typed_model_value_rejected failed.
    Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in typed_model_value_rejected
    1. Line 14, column 29 to line 14, column 32 in typed_model_value_rejected
    2. Line 12, column 9 to line 12, column 23 in typed_model_value_rejected
    3. Line 12, column 9 to line 12, column 17 in typed_model_value_rejected


    Reason:
    Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in typed_model_value_rejected
    1. Line 15, column 30 to line 15, column 33 in typed_model_value_rejected
    2. Line 12, column 9 to line 12, column 23 in typed_model_value_rejected
    3. Line 12, column 9 to line 12, column 17 in typed_model_value_rejected


    Reason:
    Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in typed_model_value_rejected
    1. Line 16, column 8 to line 16, column 32 in typed_model_value_rejected
    2. Line 16, column 29 to line 16, column 32 in typed_model_value_rejected
    3. Line 12, column 9 to line 12, column 23 in typed_model_value_rejected
    4. Line 12, column 9 to line 12, column 17 in typed_model_value_rejected


    Reason:
    Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in typed_model_value_rejected
    1. Line 15, column 12 to line 15, column 36 in typed_model_value_rejected
    2. Line 15, column 33 to line 15, column 36 in typed_model_value_rejected
    3. Line 12, column 9 to line 12, column 23 in typed_model_value_rejected
    4. Line 12, column 9 to line 12, column 17 in typed_model_value_rejected


    Reason:
    Attempted to check equality of the typed model value t_1 and the non-model value
    [a |-> 1]
---*)

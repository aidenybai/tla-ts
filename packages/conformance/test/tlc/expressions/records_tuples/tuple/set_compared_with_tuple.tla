(*---
description: "A set compared with a tuple reports the set message."
ref: "tlc2/value/impl/SetEnumValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE set_compared_with_tuple ----
EXTENDS Integers
Test == {} = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module set_compared_with_tuple failed.
    Attempted to check equality of the set {} with the value:
    <<>>
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of the set {} with the value:
    <<>>
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in set_compared_with_tuple
    1. Line 11, column 29 to line 11, column 32 in set_compared_with_tuple
    2. Line 9, column 9 to line 9, column 17 in set_compared_with_tuple
    3. Line 9, column 9 to line 9, column 10 in set_compared_with_tuple


    Reason:
    Attempted to check equality of the set {} with the value:
    <<>>
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of the set {} with the value:
    <<>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in set_compared_with_tuple
    1. Line 12, column 30 to line 12, column 33 in set_compared_with_tuple
    2. Line 9, column 9 to line 9, column 17 in set_compared_with_tuple
    3. Line 9, column 9 to line 9, column 10 in set_compared_with_tuple


    Reason:
    Attempted to check equality of the set {} with the value:
    <<>>
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the set {} with the value:
    <<>>
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in set_compared_with_tuple
    1. Line 13, column 8 to line 13, column 32 in set_compared_with_tuple
    2. Line 13, column 29 to line 13, column 32 in set_compared_with_tuple
    3. Line 9, column 9 to line 9, column 17 in set_compared_with_tuple
    4. Line 9, column 9 to line 9, column 10 in set_compared_with_tuple


    Reason:
    Attempted to check equality of the set {} with the value:
    <<>>
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the set {} with the value:
    <<>>
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in set_compared_with_tuple
    1. Line 12, column 12 to line 12, column 36 in set_compared_with_tuple
    2. Line 12, column 33 to line 12, column 36 in set_compared_with_tuple
    3. Line 9, column 9 to line 9, column 17 in set_compared_with_tuple
    4. Line 9, column 9 to line 9, column 10 in set_compared_with_tuple


    Reason:
    Attempted to check equality of the set {} with the value:
    <<>>
---*)

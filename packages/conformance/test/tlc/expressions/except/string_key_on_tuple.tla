(*---
description: "A string path on a tuple is an error from select."
ref: "tlc2/value/impl/TupleValue.java#select"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE string_key_on_tuple ----
EXTENDS Integers
Test == [<<1>> EXCEPT !.a = 0] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module string_key_on_tuple failed.
    Attempted to access tuple at a non integral index: "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to access tuple at a non integral index: "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in string_key_on_tuple
    1. Line 11, column 29 to line 11, column 32 in string_key_on_tuple
    2. Line 9, column 9 to line 9, column 34 in string_key_on_tuple
    3. Line 9, column 9 to line 9, column 30 in string_key_on_tuple
    4. Line 9, column 10 to line 9, column 14 in string_key_on_tuple


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
    0. Line 12, column 9 to line 12, column 33 in string_key_on_tuple
    1. Line 12, column 30 to line 12, column 33 in string_key_on_tuple
    2. Line 9, column 9 to line 9, column 34 in string_key_on_tuple
    3. Line 9, column 9 to line 9, column 30 in string_key_on_tuple
    4. Line 9, column 10 to line 9, column 14 in string_key_on_tuple


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
    0. Line 11, column 9 to line 11, column 32 in string_key_on_tuple
    1. Line 13, column 8 to line 13, column 32 in string_key_on_tuple
    2. Line 13, column 29 to line 13, column 32 in string_key_on_tuple
    3. Line 9, column 9 to line 9, column 34 in string_key_on_tuple
    4. Line 9, column 9 to line 9, column 30 in string_key_on_tuple
    5. Line 9, column 10 to line 9, column 14 in string_key_on_tuple


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
    0. Line 11, column 9 to line 11, column 32 in string_key_on_tuple
    1. Line 12, column 12 to line 12, column 36 in string_key_on_tuple
    2. Line 12, column 33 to line 12, column 36 in string_key_on_tuple
    3. Line 9, column 9 to line 9, column 34 in string_key_on_tuple
    4. Line 9, column 9 to line 9, column 30 in string_key_on_tuple
    5. Line 9, column 10 to line 9, column 14 in string_key_on_tuple


    Reason:
    Attempted to access tuple at a non integral index: "a"
---*)

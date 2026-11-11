(*---
description: "A non-function checked against a function set is an error."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_non_function ----
EXTENDS Integers
Test == 1 \in [{1} -> {1}]
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module member_non_function failed.
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_non_function
    1. Line 11, column 29 to line 11, column 32 in member_non_function
    2. Line 9, column 9 to line 9, column 26 in member_non_function
    3. Line 9, column 15 to line 9, column 26 in member_non_function


    Reason:
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in member_non_function
    1. Line 12, column 30 to line 12, column 33 in member_non_function
    2. Line 9, column 9 to line 9, column 26 in member_non_function
    3. Line 9, column 15 to line 9, column 26 in member_non_function


    Reason:
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_non_function
    1. Line 13, column 8 to line 13, column 32 in member_non_function
    2. Line 13, column 29 to line 13, column 32 in member_non_function
    3. Line 9, column 9 to line 9, column 26 in member_non_function
    4. Line 9, column 15 to line 9, column 26 in member_non_function


    Reason:
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_non_function
    1. Line 12, column 12 to line 12, column 36 in member_non_function
    2. Line 12, column 33 to line 12, column 36 in member_non_function
    3. Line 9, column 9 to line 9, column 26 in member_non_function
    4. Line 9, column 15 to line 9, column 26 in member_non_function


    Reason:
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<1>>}
---*)

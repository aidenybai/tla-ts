(*---
description: "An integer cannot be converted to a function, so asking if it is in a product is an error."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_integer ----
EXTENDS Integers
Test == 1 \in {1} \X {2}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module member_integer failed.
    Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_integer
    1. Line 11, column 29 to line 11, column 32 in member_integer
    2. Line 9, column 9 to line 9, column 24 in member_integer
    3. Line 9, column 15 to line 9, column 24 in member_integer


    Reason:
    Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in member_integer
    1. Line 12, column 30 to line 12, column 33 in member_integer
    2. Line 9, column 9 to line 9, column 24 in member_integer
    3. Line 9, column 15 to line 9, column 24 in member_integer


    Reason:
    Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_integer
    1. Line 13, column 8 to line 13, column 32 in member_integer
    2. Line 13, column 29 to line 13, column 32 in member_integer
    3. Line 9, column 9 to line 9, column 24 in member_integer
    4. Line 9, column 15 to line 9, column 24 in member_integer


    Reason:
    Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_integer
    1. Line 12, column 12 to line 12, column 36 in member_integer
    2. Line 12, column 33 to line 12, column 36 in member_integer
    3. Line 9, column 9 to line 9, column 24 in member_integer
    4. Line 9, column 15 to line 9, column 24 in member_integer


    Reason:
    Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 2>>}
---*)

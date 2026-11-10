(*---
description: "\\cap membership evaluates the right set when the left holds the element, and the filter wraps the failure of its predicate."
ref: "tlc2/value/impl/SetCapValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE cap_reaches_right_when_left_holds ----
EXTENDS Integers
Test == {1} \in ((SUBSET {1}) \cap {y \in SUBSET Nat : 1 \div 0 = 0})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module cap_reaches_right_when_left_holds failed.
    Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
init:
  exit: 75
  transcript: |-
    1000:1 Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cap_reaches_right_when_left_holds
    1. Line 11, column 29 to line 11, column 32 in cap_reaches_right_when_left_holds
    2. Line 9, column 9 to line 9, column 69 in cap_reaches_right_when_left_holds
    3. Line 9, column 56 to line 9, column 67 in cap_reaches_right_when_left_holds
    4. Line 9, column 56 to line 9, column 63 in cap_reaches_right_when_left_holds


    Reason:
    Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in cap_reaches_right_when_left_holds
    1. Line 12, column 30 to line 12, column 33 in cap_reaches_right_when_left_holds
    2. Line 9, column 9 to line 9, column 69 in cap_reaches_right_when_left_holds
    3. Line 9, column 56 to line 9, column 67 in cap_reaches_right_when_left_holds
    4. Line 9, column 56 to line 9, column 63 in cap_reaches_right_when_left_holds


    Reason:
    Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
invariant:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cap_reaches_right_when_left_holds
    1. Line 13, column 8 to line 13, column 32 in cap_reaches_right_when_left_holds
    2. Line 13, column 29 to line 13, column 32 in cap_reaches_right_when_left_holds
    3. Line 9, column 9 to line 9, column 69 in cap_reaches_right_when_left_holds
    4. Line 9, column 56 to line 9, column 67 in cap_reaches_right_when_left_holds
    5. Line 9, column 56 to line 9, column 63 in cap_reaches_right_when_left_holds


    Reason:
    Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
property:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cap_reaches_right_when_left_holds
    1. Line 12, column 12 to line 12, column 36 in cap_reaches_right_when_left_holds
    2. Line 12, column 33 to line 12, column 36 in cap_reaches_right_when_left_holds
    3. Line 9, column 9 to line 9, column 69 in cap_reaches_right_when_left_holds
    4. Line 9, column 56 to line 9, column 67 in cap_reaches_right_when_left_holds
    5. Line 9, column 56 to line 9, column 63 in cap_reaches_right_when_left_holds


    Reason:
    Cannot decide if element:
    {1}
     is element of:
    SUBSET Nat
    and satisfies the predicate line 9, col 56 to line 9, col 67 of module cap_reaches_right_when_left_holds
---*)

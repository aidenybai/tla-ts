(*---
description: "S \\subseteq T continues past elements inside T, so a later failing membership surfaces, wrapped by the filter."
ref: "tlc2/value/impl/EnumerableValue.java#isSubsetEq"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE subseteq_reaches_later_element ----
EXTENDS Integers
Test == {0, 5} \subseteq {y \in Nat : IF y = 5 THEN 1 \div 0 = 0 ELSE TRUE}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module subseteq_reaches_later_element failed.
    Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
init:
  exit: 75
  transcript: |-
    1000:1 Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in subseteq_reaches_later_element
    1. Line 11, column 29 to line 11, column 32 in subseteq_reaches_later_element
    2. Line 9, column 9 to line 9, column 75 in subseteq_reaches_later_element
    3. Line 9, column 39 to line 9, column 74 in subseteq_reaches_later_element
    4. Line 9, column 53 to line 9, column 64 in subseteq_reaches_later_element
    5. Line 9, column 53 to line 9, column 60 in subseteq_reaches_later_element


    Reason:
    Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in subseteq_reaches_later_element
    1. Line 12, column 30 to line 12, column 33 in subseteq_reaches_later_element
    2. Line 9, column 9 to line 9, column 75 in subseteq_reaches_later_element
    3. Line 9, column 39 to line 9, column 74 in subseteq_reaches_later_element
    4. Line 9, column 53 to line 9, column 64 in subseteq_reaches_later_element
    5. Line 9, column 53 to line 9, column 60 in subseteq_reaches_later_element


    Reason:
    Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
invariant:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in subseteq_reaches_later_element
    1. Line 13, column 8 to line 13, column 32 in subseteq_reaches_later_element
    2. Line 13, column 29 to line 13, column 32 in subseteq_reaches_later_element
    3. Line 9, column 9 to line 9, column 75 in subseteq_reaches_later_element
    4. Line 9, column 39 to line 9, column 74 in subseteq_reaches_later_element
    5. Line 9, column 53 to line 9, column 64 in subseteq_reaches_later_element
    6. Line 9, column 53 to line 9, column 60 in subseteq_reaches_later_element


    Reason:
    Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
property:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in subseteq_reaches_later_element
    1. Line 12, column 12 to line 12, column 36 in subseteq_reaches_later_element
    2. Line 12, column 33 to line 12, column 36 in subseteq_reaches_later_element
    3. Line 9, column 9 to line 9, column 75 in subseteq_reaches_later_element
    4. Line 9, column 39 to line 9, column 74 in subseteq_reaches_later_element
    5. Line 9, column 53 to line 9, column 64 in subseteq_reaches_later_element
    6. Line 9, column 53 to line 9, column 60 in subseteq_reaches_later_element


    Reason:
    Cannot decide if element:
    5
     is element of:
    Nat
    and satisfies the predicate line 9, col 39 to line 9, col 74 of module subseteq_reaches_later_element
---*)

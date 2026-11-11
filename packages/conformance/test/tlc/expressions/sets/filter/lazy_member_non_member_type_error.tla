(*---
description: "Membership in a lazy filter over Nat fails for a string because Nat.member does, and the failure is rewrapped."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_member_non_member_type_error ----
EXTENDS Integers
Test == "a" \in {x \in Nat : TRUE}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_member_non_member_type_error failed.
    Cannot decide if element:
    "a"
     is element of:
    Nat
    and satisfies the predicate line 9, col 30 to line 9, col 33 of module lazy_member_non_member_type_error
init:
  exit: 75
  transcript: |-
    1000:1 Cannot decide if element:
    "a"
     is element of:
    Nat
    and satisfies the predicate line 9, col 30 to line 9, col 33 of module lazy_member_non_member_type_error
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_non_member_type_error
    1. Line 11, column 29 to line 11, column 32 in lazy_member_non_member_type_error
    2. Line 9, column 9 to line 9, column 34 in lazy_member_non_member_type_error
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Cannot decide if element:
    "a"
     is element of:
    Nat
    and satisfies the predicate line 9, col 30 to line 9, col 33 of module lazy_member_non_member_type_error
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_member_non_member_type_error
    1. Line 12, column 30 to line 12, column 33 in lazy_member_non_member_type_error
    2. Line 9, column 9 to line 9, column 34 in lazy_member_non_member_type_error
invariant:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    "a"
     is element of:
    Nat
    and satisfies the predicate line 9, col 30 to line 9, col 33 of module lazy_member_non_member_type_error
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_non_member_type_error
    1. Line 13, column 8 to line 13, column 32 in lazy_member_non_member_type_error
    2. Line 13, column 29 to line 13, column 32 in lazy_member_non_member_type_error
    3. Line 9, column 9 to line 9, column 34 in lazy_member_non_member_type_error
property:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    "a"
     is element of:
    Nat
    and satisfies the predicate line 9, col 30 to line 9, col 33 of module lazy_member_non_member_type_error
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_non_member_type_error
    1. Line 12, column 12 to line 12, column 36 in lazy_member_non_member_type_error
    2. Line 12, column 33 to line 12, column 36 in lazy_member_non_member_type_error
    3. Line 9, column 9 to line 9, column 34 in lazy_member_non_member_type_error
---*)

(*---
description: "An EvalException from the predicate during membership is rewrapped as a Cannot decide message."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_member_predicate_error_is_wrapped ----
EXTENDS Integers
Test == 1 \in {x \in Nat : 1 \div 0 = x}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_member_predicate_error_is_wrapped failed.
    Cannot decide if element:
    1
     is element of:
    Nat
    and satisfies the predicate line 9, col 28 to line 9, col 39 of module lazy_member_predicate_error_is_wrapped
init:
  exit: 75
  transcript: |-
    1000:1 Cannot decide if element:
    1
     is element of:
    Nat
    and satisfies the predicate line 9, col 28 to line 9, col 39 of module lazy_member_predicate_error_is_wrapped
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_predicate_error_is_wrapped
    1. Line 11, column 29 to line 11, column 32 in lazy_member_predicate_error_is_wrapped
    2. Line 9, column 9 to line 9, column 40 in lazy_member_predicate_error_is_wrapped
    3. Line 9, column 28 to line 9, column 39 in lazy_member_predicate_error_is_wrapped
    4. Line 9, column 28 to line 9, column 35 in lazy_member_predicate_error_is_wrapped
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Cannot decide if element:
    1
     is element of:
    Nat
    and satisfies the predicate line 9, col 28 to line 9, col 39 of module lazy_member_predicate_error_is_wrapped
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_member_predicate_error_is_wrapped
    1. Line 12, column 30 to line 12, column 33 in lazy_member_predicate_error_is_wrapped
    2. Line 9, column 9 to line 9, column 40 in lazy_member_predicate_error_is_wrapped
    3. Line 9, column 28 to line 9, column 39 in lazy_member_predicate_error_is_wrapped
    4. Line 9, column 28 to line 9, column 35 in lazy_member_predicate_error_is_wrapped
invariant:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    1
     is element of:
    Nat
    and satisfies the predicate line 9, col 28 to line 9, col 39 of module lazy_member_predicate_error_is_wrapped
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_predicate_error_is_wrapped
    1. Line 13, column 8 to line 13, column 32 in lazy_member_predicate_error_is_wrapped
    2. Line 13, column 29 to line 13, column 32 in lazy_member_predicate_error_is_wrapped
    3. Line 9, column 9 to line 9, column 40 in lazy_member_predicate_error_is_wrapped
    4. Line 9, column 28 to line 9, column 39 in lazy_member_predicate_error_is_wrapped
    5. Line 9, column 28 to line 9, column 35 in lazy_member_predicate_error_is_wrapped
property:
  exit: 75
  transcript: |-
    2102:1 Cannot decide if element:
    1
     is element of:
    Nat
    and satisfies the predicate line 9, col 28 to line 9, col 39 of module lazy_member_predicate_error_is_wrapped
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_member_predicate_error_is_wrapped
    1. Line 12, column 12 to line 12, column 36 in lazy_member_predicate_error_is_wrapped
    2. Line 12, column 33 to line 12, column 36 in lazy_member_predicate_error_is_wrapped
    3. Line 9, column 9 to line 9, column 40 in lazy_member_predicate_error_is_wrapped
    4. Line 9, column 28 to line 9, column 39 in lazy_member_predicate_error_is_wrapped
    5. Line 9, column 28 to line 9, column 35 in lazy_member_predicate_error_is_wrapped
---*)

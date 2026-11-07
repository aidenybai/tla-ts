(*---
description: "A tuple binder over Nat \\X Nat rejects a non-pair through the domain."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE tuple_binder_lazy_non_member ----
EXTENDS Integers
Test == [<<a, b>> \in Nat \X Nat |-> a + b][<<1, 2, 3>>] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module tuple_binder_lazy_non_member failed.
    In applying the function
    [<<a, b>> \in (Nat \X Nat) |-> <expression line 9, col 38 to line 9, col 42 of module tuple_binder_lazy_non_member>],
    the first argument is:
    <<1, 2, 3>>
    which is not in its domain.
init:
  exit: 75
  transcript: |-
    1000:1 In applying the function
    [<<a, b>> \in (Nat \X Nat) |-> <expression line 9, col 38 to line 9, col 42 of module tuple_binder_lazy_non_member>],
    the first argument is:
    <<1, 2, 3>>
    which is not in its domain.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_lazy_non_member
    1. Line 11, column 29 to line 11, column 32 in tuple_binder_lazy_non_member
    2. Line 9, column 9 to line 9, column 60 in tuple_binder_lazy_non_member
    3. Line 9, column 9 to line 9, column 56 in tuple_binder_lazy_non_member
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In applying the function
    [<<a, b>> \in (Nat \X Nat) |-> <expression line 9, col 38 to line 9, col 42 of module tuple_binder_lazy_non_member>],
    the first argument is:
    <<1, 2, 3>>
    which is not in its domain.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in tuple_binder_lazy_non_member
    1. Line 12, column 30 to line 12, column 33 in tuple_binder_lazy_non_member
    2. Line 9, column 9 to line 9, column 60 in tuple_binder_lazy_non_member
    3. Line 9, column 9 to line 9, column 56 in tuple_binder_lazy_non_member
invariant:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [<<a, b>> \in (Nat \X Nat) |-> <expression line 9, col 38 to line 9, col 42 of module tuple_binder_lazy_non_member>],
    the first argument is:
    <<1, 2, 3>>
    which is not in its domain.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_lazy_non_member
    1. Line 13, column 8 to line 13, column 32 in tuple_binder_lazy_non_member
    2. Line 13, column 29 to line 13, column 32 in tuple_binder_lazy_non_member
    3. Line 9, column 9 to line 9, column 60 in tuple_binder_lazy_non_member
    4. Line 9, column 9 to line 9, column 56 in tuple_binder_lazy_non_member
property:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [<<a, b>> \in (Nat \X Nat) |-> <expression line 9, col 38 to line 9, col 42 of module tuple_binder_lazy_non_member>],
    the first argument is:
    <<1, 2, 3>>
    which is not in its domain.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_lazy_non_member
    1. Line 12, column 12 to line 12, column 36 in tuple_binder_lazy_non_member
    2. Line 12, column 33 to line 12, column 36 in tuple_binder_lazy_non_member
    3. Line 9, column 9 to line 9, column 60 in tuple_binder_lazy_non_member
    4. Line 9, column 9 to line 9, column 56 in tuple_binder_lazy_non_member
---*)

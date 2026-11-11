(*---
description: "Comparing a function over Nat must enumerate it and fails."
ref: "tlc2/value/impl/FcnLambdaValue.java#toFcnRcd"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE compare_nat_function ----
EXTENDS Integers
Test == [x \in Nat |-> x] = [x \in Nat |-> x]
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module compare_nat_function failed.
    Attempted to compute the number of elements in the overridden value Nat.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in compare_nat_function
    1. Line 11, column 29 to line 11, column 32 in compare_nat_function
    2. Line 9, column 9 to line 9, column 45 in compare_nat_function
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compute the number of elements in the overridden value Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in compare_nat_function
    1. Line 12, column 30 to line 12, column 33 in compare_nat_function
    2. Line 9, column 9 to line 9, column 45 in compare_nat_function
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value Nat.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in compare_nat_function
    1. Line 13, column 8 to line 13, column 32 in compare_nat_function
    2. Line 13, column 29 to line 13, column 32 in compare_nat_function
    3. Line 9, column 9 to line 9, column 45 in compare_nat_function
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value Nat.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in compare_nat_function
    1. Line 12, column 12 to line 12, column 36 in compare_nat_function
    2. Line 12, column 33 to line 12, column 36 in compare_nat_function
    3. Line 9, column 9 to line 9, column 45 in compare_nat_function
---*)

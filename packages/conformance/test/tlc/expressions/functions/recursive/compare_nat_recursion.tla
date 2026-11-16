(*---
description: "Comparing a recursive function over Nat cannot enumerate it."
ref: "tlc2/value/impl/FcnLambdaValue.java#toFcnRcd"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE compare_nat_recursion ----
EXTENDS Integers
F[n \in Nat] == IF n = 0 THEN 0 ELSE F[n - 1]
Test == F = F
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module compare_nat_recursion failed.
    Attempted to compute the number of elements in the overridden value Nat.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in compare_nat_recursion
    1. Line 12, column 29 to line 12, column 32 in compare_nat_recursion
    2. Line 10, column 9 to line 10, column 13 in compare_nat_recursion
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
    0. Line 13, column 9 to line 13, column 33 in compare_nat_recursion
    1. Line 13, column 30 to line 13, column 33 in compare_nat_recursion
    2. Line 10, column 9 to line 10, column 13 in compare_nat_recursion
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value Nat.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in compare_nat_recursion
    1. Line 14, column 8 to line 14, column 32 in compare_nat_recursion
    2. Line 14, column 29 to line 14, column 32 in compare_nat_recursion
    3. Line 10, column 9 to line 10, column 13 in compare_nat_recursion
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value Nat.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in compare_nat_recursion
    1. Line 13, column 12 to line 13, column 36 in compare_nat_recursion
    2. Line 13, column 33 to line 13, column 36 in compare_nat_recursion
    3. Line 10, column 9 to line 10, column 13 in compare_nat_recursion
---*)

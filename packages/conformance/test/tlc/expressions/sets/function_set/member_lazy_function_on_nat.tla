(*---
description: "Membership converts the candidate through toFcnRcd, which cannot enumerate a function on Nat."
ref: "tlc2/value/impl/FcnLambdaValue.java#toFcnRcd"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_lazy_function_on_nat ----
EXTENDS Integers
Test == [x \in Nat |-> 0] \in [Nat -> {0}]
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module member_lazy_function_on_nat failed.
    Attempted to compute the number of elements in the overridden value Nat.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the number of elements in the overridden value Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_lazy_function_on_nat
    1. Line 11, column 29 to line 11, column 32 in member_lazy_function_on_nat
    2. Line 9, column 9 to line 9, column 42 in member_lazy_function_on_nat
    3. Line 9, column 31 to line 9, column 42 in member_lazy_function_on_nat


    Reason:
    Attempted to compute the number of elements in the overridden value Nat.
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
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in member_lazy_function_on_nat
    1. Line 12, column 30 to line 12, column 33 in member_lazy_function_on_nat
    2. Line 9, column 9 to line 9, column 42 in member_lazy_function_on_nat
    3. Line 9, column 31 to line 9, column 42 in member_lazy_function_on_nat


    Reason:
    Attempted to compute the number of elements in the overridden value Nat.
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value Nat.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_lazy_function_on_nat
    1. Line 13, column 8 to line 13, column 32 in member_lazy_function_on_nat
    2. Line 13, column 29 to line 13, column 32 in member_lazy_function_on_nat
    3. Line 9, column 9 to line 9, column 42 in member_lazy_function_on_nat
    4. Line 9, column 31 to line 9, column 42 in member_lazy_function_on_nat


    Reason:
    Attempted to compute the number of elements in the overridden value Nat.
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value Nat.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_lazy_function_on_nat
    1. Line 12, column 12 to line 12, column 36 in member_lazy_function_on_nat
    2. Line 12, column 33 to line 12, column 36 in member_lazy_function_on_nat
    3. Line 9, column 9 to line 9, column 42 in member_lazy_function_on_nat
    4. Line 9, column 31 to line 9, column 42 in member_lazy_function_on_nat


    Reason:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

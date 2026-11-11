(*---
description: "Nat is not Enumerable, so Nat \\in SUBSET Nat is an error although it is true in TLA+."
ref: "tlc2/value/impl/SubsetValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_nat_of_subset_nat ----
EXTENDS Integers
Test == Nat \in SUBSET Nat
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module member_nat_of_subset_nat failed.
    Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_nat_of_subset_nat
    1. Line 11, column 29 to line 11, column 32 in member_nat_of_subset_nat
    2. Line 9, column 9 to line 9, column 26 in member_nat_of_subset_nat
    3. Line 9, column 17 to line 9, column 26 in member_nat_of_subset_nat


    Reason:
    Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in member_nat_of_subset_nat
    1. Line 12, column 30 to line 12, column 33 in member_nat_of_subset_nat
    2. Line 9, column 9 to line 9, column 26 in member_nat_of_subset_nat
    3. Line 9, column 17 to line 9, column 26 in member_nat_of_subset_nat


    Reason:
    Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_nat_of_subset_nat
    1. Line 13, column 8 to line 13, column 32 in member_nat_of_subset_nat
    2. Line 13, column 29 to line 13, column 32 in member_nat_of_subset_nat
    3. Line 9, column 9 to line 9, column 26 in member_nat_of_subset_nat
    4. Line 9, column 17 to line 9, column 26 in member_nat_of_subset_nat


    Reason:
    Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in member_nat_of_subset_nat
    1. Line 12, column 12 to line 12, column 36 in member_nat_of_subset_nat
    2. Line 12, column 33 to line 12, column 36 in member_nat_of_subset_nat
    3. Line 9, column 9 to line 9, column 26 in member_nat_of_subset_nat
    4. Line 9, column 17 to line 9, column 26 in member_nat_of_subset_nat


    Reason:
    Attempted to check if the non-enumerable value
    Nat
    is element of
    SUBSET Nat
---*)

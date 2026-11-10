(*---
description: "A set of Nat and an enumerated set cannot be normalized, so enumerating its UNION fails at that compare."
ref: "tlc2/value/impl/UserValue.java#compareTo"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE enumerate_nat_beside_enum ----
EXTENDS Integers
Test == (UNION {{0}, Nat}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module enumerate_nat_beside_enum failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {0}
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare overridden value Nat with non-overridden value:
    {0}
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat_beside_enum
    1. Line 11, column 29 to line 11, column 32 in enumerate_nat_beside_enum
    2. Line 9, column 9 to line 9, column 31 in enumerate_nat_beside_enum
    3. Line 9, column 10 to line 9, column 25 in enumerate_nat_beside_enum
    4. Line 9, column 16 to line 9, column 25 in enumerate_nat_beside_enum


    Reason:
    Attempted to compare overridden value Nat with non-overridden value:
    {0}
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare overridden value Nat with non-overridden value:
    {0}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in enumerate_nat_beside_enum
    1. Line 12, column 30 to line 12, column 33 in enumerate_nat_beside_enum
    2. Line 9, column 9 to line 9, column 31 in enumerate_nat_beside_enum
    3. Line 9, column 10 to line 9, column 25 in enumerate_nat_beside_enum
    4. Line 9, column 16 to line 9, column 25 in enumerate_nat_beside_enum


    Reason:
    Attempted to compare overridden value Nat with non-overridden value:
    {0}
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare overridden value Nat with non-overridden value:
    {0}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat_beside_enum
    1. Line 13, column 8 to line 13, column 32 in enumerate_nat_beside_enum
    2. Line 13, column 29 to line 13, column 32 in enumerate_nat_beside_enum
    3. Line 9, column 9 to line 9, column 31 in enumerate_nat_beside_enum
    4. Line 9, column 10 to line 9, column 25 in enumerate_nat_beside_enum
    5. Line 9, column 16 to line 9, column 25 in enumerate_nat_beside_enum


    Reason:
    Attempted to compare overridden value Nat with non-overridden value:
    {0}
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare overridden value Nat with non-overridden value:
    {0}
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat_beside_enum
    1. Line 12, column 12 to line 12, column 36 in enumerate_nat_beside_enum
    2. Line 12, column 33 to line 12, column 36 in enumerate_nat_beside_enum
    3. Line 9, column 9 to line 9, column 31 in enumerate_nat_beside_enum
    4. Line 9, column 10 to line 9, column 25 in enumerate_nat_beside_enum
    5. Line 9, column 16 to line 9, column 25 in enumerate_nat_beside_enum


    Reason:
    Attempted to compare overridden value Nat with non-overridden value:
    {0}
---*)

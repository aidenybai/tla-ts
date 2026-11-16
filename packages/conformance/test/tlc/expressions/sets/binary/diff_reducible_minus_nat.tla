(*---
description: "S \\ Nat checks each element of S against Nat, which rejects a string."
ref: "tlc2/value/impl/SetEnumValue.java#diff"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE diff_reducible_minus_nat ----
EXTENDS Integers
Test == ({1, "a"} \ Nat) = {"a"}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module diff_reducible_minus_nat failed.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in diff_reducible_minus_nat
    1. Line 11, column 29 to line 11, column 32 in diff_reducible_minus_nat
    2. Line 9, column 9 to line 9, column 32 in diff_reducible_minus_nat
    3. Line 9, column 10 to line 9, column 23 in diff_reducible_minus_nat
    4. Line 9, column 10 to line 9, column 17 in diff_reducible_minus_nat


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
next:
  exit: 75
  transcript: |-
    2158:1 Attempted to check if the value:
    "a"
    is an element of Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in diff_reducible_minus_nat
    1. Line 12, column 30 to line 12, column 33 in diff_reducible_minus_nat
    2. Line 9, column 9 to line 9, column 32 in diff_reducible_minus_nat
    3. Line 9, column 10 to line 9, column 23 in diff_reducible_minus_nat
    4. Line 9, column 10 to line 9, column 17 in diff_reducible_minus_nat


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in diff_reducible_minus_nat
    1. Line 13, column 8 to line 13, column 32 in diff_reducible_minus_nat
    2. Line 13, column 29 to line 13, column 32 in diff_reducible_minus_nat
    3. Line 9, column 9 to line 9, column 32 in diff_reducible_minus_nat
    4. Line 9, column 10 to line 9, column 23 in diff_reducible_minus_nat
    5. Line 9, column 10 to line 9, column 17 in diff_reducible_minus_nat


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in diff_reducible_minus_nat
    1. Line 12, column 12 to line 12, column 36 in diff_reducible_minus_nat
    2. Line 12, column 33 to line 12, column 36 in diff_reducible_minus_nat
    3. Line 9, column 9 to line 9, column 32 in diff_reducible_minus_nat
    4. Line 9, column 10 to line 9, column 23 in diff_reducible_minus_nat
    5. Line 9, column 10 to line 9, column 17 in diff_reducible_minus_nat


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
---*)
